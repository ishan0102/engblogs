"""Reviewed official sources shared by the importer and website."""
import argparse
import calendar
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import json
from pathlib import Path
from urllib.parse import urljoin, urlparse

import feedparser
from lxml import html

from scrape import fetch_bytes

CATALOG = Path(__file__).resolve().parents[1] / 'client/src/data/sources.json'


def active_sources():
    sources = json.loads(CATALOG.read_text())
    names = [source['company'] for source in sources]
    if len(names) != len(set(names)):
        raise ValueError('Duplicate source names')
    return [source for source in sources if source['active']]


def plain_text(value):
    if not value or not value.strip():
        return ''
    doc = html.fragment_fromstring(value, create_parent='div')
    for node in doc.xpath('.//script | .//style | .//noscript'):
        node.drop_tree()
    return ' '.join(doc.text_content().split())


def listing_entries(source, data):
    """Small adapters for official blogs that do not publish RSS. Never infer dates."""
    doc = html.fromstring(data)
    kind = source['kind']
    if kind == 'anthropic':
        nodes = doc.xpath('//article[.//time and .//h3/a]')
    elif kind == 'cursor':
        nodes = doc.xpath('//a[starts-with(@href,"/blog/") and .//time]')
    elif kind == 'thinking_machines':
        nodes = doc.xpath('//a[.//h2 and .//time]')
    else:
        raise ValueError('Unknown listing adapter')
    for node in nodes:
        stamp = node.xpath('.//time/@datetime') or node.xpath('.//time/text()')
        if not stamp:
            continue
        try:
            published = (datetime.strptime(stamp[0].strip(), '%b %d, %Y').date()
                         if kind == 'anthropic' else datetime.fromisoformat(stamp[0].replace('Z', '+00:00')).date())
        except ValueError:
            continue
        if kind == 'anthropic':
            anchor = node.xpath('.//h3/a')[0]
            title, link = anchor.text_content(), anchor.get('href')
        else:
            titles = node.xpath('.//h2') if kind == 'thinking_machines' else node.xpath('.//p[contains(@class,"text-theme-text")]')
            if not titles:
                continue
            title, link = titles[0].text_content(), node.get('href')
        yield dict(title=title.strip(), link=urljoin(source['link'], link),
                   published_at=published.isoformat(), description='', _feed_text='')


def read_source(source):
    data = fetch_bytes(source['link'])
    rows, invalid = [], 0
    if source.get('kind'):
        entries = list(listing_entries(source, data))
    else:
        parsed = feedparser.parse(data)
        entries = []
        for entry in parsed.entries:
            stamp = entry.get('published_parsed') or entry.get('updated_parsed')
            if not entry.get('title') or not entry.get('link') or not stamp:
                invalid += 1
                continue
            description = plain_text(entry.get('summary', ''))
            content = '\n'.join(plain_text(part.get('value', '')) for part in entry.get('content', []))
            # Some publishers put the full article in description rather than content:encoded.
            if len(content) < 500 and len(description) >= 1500:
                content = description
            entries.append(dict(title=entry.title, link=urljoin(source['link'], entry.link),
                                published_at=datetime.fromtimestamp(calendar.timegm(stamp), timezone.utc).date().isoformat(),
                                description=description, _feed_text=content if len(content) >= 500 else ''))
    today = datetime.now(timezone.utc).date()
    seen = set()
    for row in entries:
        if (not row['title'] or urlparse(row['link']).scheme not in ('https', 'http')
                or datetime.fromisoformat(row['published_at']).date() > today):
            invalid += 1
            continue
        if row['link'] in seen:
            continue
        seen.add(row['link'])
        rows.append({**row, 'company': source['company'], '_content_mode': source.get('content_mode', 'article')})
    if not rows:
        raise ValueError('Source has no valid dated articles')
    latest = max(datetime.fromisoformat(row['published_at']).date() for row in rows)
    if (today - latest).days > 365:
        raise ValueError('Source has not published in over a year; review its endpoint')
    return rows, invalid


def audit(source):
    try:
        rows, invalid = read_source(source)
        return dict(company=source['company'], articles=len(rows), latest=max(row['published_at'] for row in rows), invalid=invalid)
    except Exception as error:
        return dict(company=source['company'], error=type(error).__name__,
                    http_status=getattr(getattr(error, 'response', None), 'status_code', None))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--sync', action='store_true', help='Upsert reviewed source metadata, preserving all historical rows')
    args = parser.parse_args()
    sources = active_sources()
    with ThreadPoolExecutor(max_workers=8) as pool:
        results = list(pool.map(audit, sources))
    print(json.dumps(results, indent=2))
    if any('error' in result for result in results):
        return 1
    if args.sync:
        # Import late to keep the read-only audit independent of credentials.
        from hourly import config, write_status
        from supabase import create_client
        settings = config()
        db = create_client(settings['SUPABASE_URL'], settings['SUPABASE_KEY'])
        state = Path('~/.local/state/engblogs').expanduser()
        state.mkdir(parents=True, exist_ok=True, mode=0o700)
        stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
        write_status(state / f'sources-before-{stamp}.json', db.table('engblogs_links').select('*').execute().data)
        rows = [{key: source[key] for key in ('company', 'link', 'logo_url')} for source in sources]
        db.table('engblogs_links').upsert(rows, on_conflict='company').execute()
        actual = db.table('engblogs_links').select('company,link,logo_url').in_('company', [r['company'] for r in rows]).execute().data
        if sorted(actual, key=lambda r: r['company']) != sorted(rows, key=lambda r: r['company']):
            raise RuntimeError('Source metadata verification failed')
        print(f'Verified {len(rows)} active sources; historical rows retained.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
