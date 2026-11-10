import argparse
import datetime
import os
from openai import OpenAI

import feedparser
from dotenv import load_dotenv
from supabase import create_client
from tqdm import tqdm

from scrape import scrape_post
from summarize import get_post_insights

load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)
client = OpenAI()
client.api_key = os.getenv("OPENAI_API_KEY")


def parse_date(date_string):
    formats = [
        "%Y-%m-%dT%H:%M:%SZ",  # Format like '2023-07-06T19:00:51Z'
        "%a, %d %b %Y %H:%M:%S %Z",  # Format like 'Tue, 20 Jun 2023 00:00:00 GMT'
        "%a, %d %b %Y %H:%M:%S %z",  # Format like 'Wed, 08 Mar 2023 00:00:00 +0000'
        "%Y-%m-%dT%H:%M:%S.%f%z",  # Format like '2023-07-06T12:50:00.000-07:00'
        "%Y-%m-%d %H:%M:%S",  # Format like '2023-06-29 16:30:00'
        "%Y-%m-%dT%H:%M:%S%z",  # Format like '2023-09-13T00:00:00+00:00'
    ]
    for fmt in formats:
        try:
            return datetime.datetime.strptime(date_string, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    raise ValueError(f"couldn't parse date {date_string} with any of the known formats")


def get_existing_links(entries):
    links = list(dict.fromkeys(entry.link for entry in entries if entry.get("link")))
    existing = set()
    for offset in range(0, len(links), 20):
        rows = supabase.table("engblogs_posts").select("link").in_("link", links[offset:offset + 20]).execute().data
        existing.update(row["link"] for row in rows)
    return existing


def parse_feed(url, company, max_new=None):
    feed = feedparser.parse(url)
    existing_links = get_existing_links(feed.entries)
    inserted = 0
    for entry in feed.entries:
        # Skip on bad entries
        if not hasattr(entry, "title") or not hasattr(entry, "link") or not hasattr(entry, "published"):
            print(f"Skipped bad entry: {entry}")
            continue

        # Fetch title and description
        title = entry.title
        description = getattr(entry, "description", "")
        # Convert the timestamp into yyyy-mm-dd format
        try:
            published_at = parse_date(entry.published)
        except ValueError:
            print(f"Skipped unsupported date from {company}: {entry.published}")
            continue
        link = entry.link

        # Check against the in-memory set instead of querying Supabase per entry
        if link in existing_links:
            print(f"Skipped existing post: {title} from {company}")
            continue

        # If the entry is not a duplicate, generate a summary and buzzwords
        try:
            # Get the full post text
            full_text = scrape_post(link)

            # Get post insights
            insights = get_post_insights(client, title, full_text)
            summary = insights["summary"]
            buzzwords = insights["buzzwords"]

            # Insert the new entry into the 'posts' table
            entry_data = {
                "published_at": published_at,
                "company": company,
                "title": title,
                "link": link,
                "description": description,
                "summary": summary,
                "full_text": full_text,
                "buzzwords": buzzwords,
            }
            supabase.table("engblogs_posts").insert(entry_data).execute()
            existing_links.add(link)
            inserted += 1
            print(f"Inserted post: {title} from {company}")
            if inserted == max_new:
                break

        except Exception as e:
            print(f"Error: {e}")
            continue


    return inserted


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-new", type=int, help="Stop after this many successful imports")
    args = parser.parse_args()
    if args.max_new is not None and args.max_new < 1:
        parser.error("--max-new must be positive")
    feeds = supabase.table("engblogs_links").select("company, link").execute().data
    inserted = 0
    for feed in tqdm(feeds, desc="Parsing RSS feeds", unit="feed"):
        remaining = None if args.max_new is None else args.max_new - inserted
        inserted += parse_feed(feed["link"], feed["company"], remaining)
        if inserted == args.max_new:
            break
    print(f"Finished parsing feeds. Inserted {inserted} posts.")
