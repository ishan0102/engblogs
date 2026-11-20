"""Bounded, single-owner RSS ingestion; run on the devbox with systemd."""
import argparse
import calendar
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
import fcntl
import json
import os
from pathlib import Path
import shlex
import sys
import tempfile
import time

import feedparser
import httpx
from dotenv import dotenv_values
from openai import OpenAI, AuthenticationError, PermissionDeniedError, RateLimitError, BadRequestError
from supabase import create_client

from scrape import scrape_post, fetch_bytes
from summarize import get_post_insights

FATAL_MODEL_ERRORS = (AuthenticationError, PermissionDeniedError, RateLimitError, BadRequestError)


def config():
    values = dict(dotenv_values(Path(__file__).with_name('.env')))
    extras = Path.home() / '.extras'
    if extras.exists():
        # Read only this key; never execute a shell profile or load unrelated secrets.
        for line in extras.read_text().splitlines():
            line = line.strip().removeprefix('export ').strip()
            name, sep, value = line.partition('=')
            if sep and name.strip() == 'OPENAI_API_KEY':
                parts = shlex.split(value, comments=True)
                if len(parts) != 1:
                    raise ValueError('OPENAI_API_KEY must contain one quoted value')
                values['OPENAI_API_KEY'] = parts[0]
    values.update({key: os.environ[key] for key in ('OPENAI_API_KEY', 'SUPABASE_URL', 'SUPABASE_KEY', 'ENGBLOGS_MODEL') if key in os.environ})
    for key in ('OPENAI_API_KEY', 'SUPABASE_URL', 'SUPABASE_KEY'):
        if not values.get(key):
            raise ValueError(f'Missing {key}')
    return values


def read_feed(feed):
    parsed = feedparser.parse(fetch_bytes(feed['link']))
    if not parsed.entries:
        raise ValueError('Feed has no parseable entries')
    rows, invalid = [], 0
    for entry in parsed.entries:
        stamp = entry.get('published_parsed') or entry.get('updated_parsed')
        if not entry.get('title') or not entry.get('link') or not stamp:
            invalid += 1
            continue
        published = datetime.fromtimestamp(calendar.timegm(stamp), timezone.utc).date()
        if published > datetime.now(timezone.utc).date():
            invalid += 1
            continue
        rows.append(dict(title=entry.title, link=entry.link, company=feed['company'],
                         description=entry.get('description', ''), published_at=published.isoformat()))
    return rows, invalid


def existing_links(db):
    links, offset = set(), 0
    while True:
        rows = db.table('engblogs_posts').select('id,link').order('id').range(offset, offset + 999).execute().data
        links.update(row['link'] for row in rows)
        if len(rows) < 1000:
            return links
        offset += len(rows)


def prepare(row, client, model):
    started = time.monotonic()
    text = scrape_post(row['link'])
    if not text or len(text.strip()) < 100:
        raise ValueError('No usable article text')
    insights, usage = get_post_insights(client, row['title'], text, model=model, with_usage=True)
    return {**row, 'full_text': text, **insights}, usage, time.monotonic() - started


def ingest(args, stats):
    settings = config()
    db = create_client(settings['SUPABASE_URL'], settings['SUPABASE_KEY'])
    model = settings.get('ENGBLOGS_MODEL') or 'gpt-5-nano'
    with OpenAI(api_key=settings['OPENAI_API_KEY'], timeout=httpx.Timeout(45, connect=10), max_retries=0) as client:
        # Authentication/model access is checked once, before scraping or paid requests.
        client.models.retrieve(model)
        feeds = db.table('engblogs_links').select('company,link').execute().data
        known = existing_links(db)
        stats.update(model=model, feeds=len(feeds), existing=len(known))
        candidates = {}
        with ThreadPoolExecutor(max_workers=8) as pool:
            jobs = {pool.submit(read_feed, feed): feed['company'] for feed in feeds}
            for job in as_completed(jobs):
                company = jobs[job]
                try:
                    rows, invalid = job.result()
                    stats['invalid_entries'] += invalid
                    stats['feeds_ok'] += 1
                    for row in rows:
                        if row['link'] not in known:
                            candidates.setdefault(row['link'], row)
                except Exception as error:
                    stats['feed_errors'].append({'company': company, 'error': type(error).__name__, 'http_status': getattr(getattr(error, 'response', None), 'status_code', None)})
                    print(f'Feed warning: {company}: {type(error).__name__}', flush=True)
        if not stats['feeds_ok']:
            raise RuntimeError('All feeds failed')
        retry_path = args.state_dir / 'article-retries.json'
        retries = json.loads(retry_path.read_text()) if retry_path.exists() else {}
        retries = {link: until for link, until in retries.items() if link not in known and until > time.time()}
        pending = sorted((row for link, row in candidates.items() if link not in retries),
                         key=lambda row: (row['published_at'], row['link']), reverse=True)
        stats.update(pending=len(candidates), deferred=len(candidates)-len(pending))
        print(f"Feeds {stats['feeds_ok']}/{len(feeds)}; existing {len(known)}; unseen {len(pending)}", flush=True)
        # Batches never reserve more slots than the remaining insert or attempt limit.
        # No new calls are submitted after a fatal provider error; in-flight calls are bounded.
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            while pending and stats['inserted'] < args.max_new and stats['attempted'] < args.max_attempts:
                size = min(args.workers, args.max_new-stats['inserted'], args.max_attempts-stats['attempted'], len(pending))
                batch, pending = pending[:size], pending[size:]
                jobs = {pool.submit(prepare, row, client, model): row for row in batch}
                stats['attempted'] += size
                for job in as_completed(jobs):
                    row = jobs[job]
                    try:
                        article, usage, seconds = job.result()
                    except FATAL_MODEL_ERRORS:
                        raise
                    except Exception as error:
                        # A broken recent article must not consume every later run's budget.
                        retries[row['link']] = time.time() + 6 * 3600
                        write_status(retry_path, retries)
                        stats['article_errors'].append({'link': row['link'], 'error': type(error).__name__, 'http_status': getattr(getattr(error, 'response', None), 'status_code', None)})
                        print(f"Article warning: {row['company']}: {type(error).__name__}", flush=True)
                        continue
                    # Database errors fail the run; never call them a skipped article.
                    db.table('engblogs_posts').insert(article).execute()
                    stats['inserted'] += 1
                    for name in ('prompt_tokens', 'completion_tokens', 'total_tokens'):
                        stats[name] += usage.get(name, 0)
                    print(f"Inserted: {row['company']} · {row['title']} ({seconds:.1f}s)", flush=True)
        stats['remaining'] = len(candidates) - stats['inserted']
        if stats['attempted'] and not stats['inserted']:
            raise RuntimeError('No attempted articles could be imported')


def write_status(path, stats):
    with tempfile.NamedTemporaryFile(mode='w', dir=path.parent, delete=False) as file:
        json.dump(stats, file, indent=2)
        temporary = file.name
    os.replace(temporary, path)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--max-new', type=int, default=20)
    parser.add_argument('--max-attempts', type=int, default=30)
    parser.add_argument('--workers', type=int, default=4)
    parser.add_argument('--state-dir', type=Path, default=Path('~/.local/state/engblogs').expanduser())
    args = parser.parse_args(argv)
    if not 1 <= args.workers <= 8 or not 1 <= args.max_new <= args.max_attempts <= 200:
        parser.error('Require workers 1–8 and 1 <= max-new <= max-attempts <= 200')
    args.state_dir.mkdir(parents=True, exist_ok=True, mode=0o700)
    with (args.state_dir / 'ingest.lock').open('a') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print('Another importer owns the lock', file=sys.stderr)
            return 1
        started = time.monotonic()
        stats = dict(started_at=datetime.now(timezone.utc).isoformat(), status='running',
                     inserted=0, attempted=0, feeds_ok=0, invalid_entries=0, feed_errors=[], article_errors=[],
                     prompt_tokens=0, completion_tokens=0, total_tokens=0)
        write_status(args.state_dir / 'last-run.json', stats)
        try:
            ingest(args, stats)
            stats['status'] = 'degraded' if stats['feed_errors'] or stats['article_errors'] else 'success'
        except Exception as error:
            # SDK exception strings can contain credential fragments. Log only the class/code.
            stats.update(status='failed', error=type(error).__name__, http_status=getattr(error, 'status_code', None))
        stats.update(finished_at=datetime.now(timezone.utc).isoformat(), seconds=round(time.monotonic()-started, 2))
        write_status(args.state_dir / 'last-run.json', stats)
        if stats['status'] != 'failed':
            write_status(args.state_dir / 'last-success.json', stats)
        print(json.dumps(stats), flush=True)
        return int(stats['status'] == 'failed')


if __name__ == '__main__':
    raise SystemExit(main())
