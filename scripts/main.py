import datetime
import os

import feedparser
import openai
from dotenv import load_dotenv
from supabase import create_client
from tqdm import tqdm

import tweepy
from summarize import get_summary

load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)
openai.api_key = os.getenv("OPENAI_API_KEY")
twitter_client = tweepy.Client(
    consumer_key=os.getenv("TWITTER_CONSUMER_KEY"),
    consumer_secret=os.getenv("TWITTER_CONSUMER_SECRET"),
    access_token=os.getenv("TWITTER_ACCESS_TOKEN"),
    access_token_secret=os.getenv("TWITTER_ACCESS_TOKEN_SECRET"),
)


def parse_date(date_string):
    formats = [
        "%Y-%m-%dT%H:%M:%SZ",  # Format like '2023-07-06T19:00:51Z'
        "%a, %d %b %Y %H:%M:%S %Z",  # Format like 'Tue, 20 Jun 2023 00:00:00 GMT'
        "%a, %d %b %Y %H:%M:%S %z",  # Format like 'Wed, 08 Mar 2023 00:00:00 +0000'
        "%Y-%m-%dT%H:%M:%S.%f%z",  # Format like '2023-07-06T12:50:00.000-07:00'
        "%Y-%m-%d %H:%M:%S",  # Format like '2023-06-29 16:30:00'
    ]
    for fmt in formats:
        try:
            return datetime.datetime.strptime(date_string, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    raise ValueError(f"couldn't parse date {date_string} with any of the known formats")


def parse_feed(url, company):
    feed = feedparser.parse(url)
    for entry in feed.entries:
        # Fetch title and description
        title = entry.title
        description = getattr(entry, "description", "")
        # Convert the timestamp into yyyy-mm-dd format
        published_at = parse_date(entry.published)
        link = entry.link

        # Check if the entry exists in the loaded 'posts' data
        if any(
            post
            for post in existing_posts
            if post["link"] == link
        ):
            print(f"Skipped existing post: {title} from {company}")
            continue

        # If the entry is not a duplicate, generate a summary
        summary = get_summary(title, description)

        # Insert the new entry into the 'posts' table
        entry_data = {
            "published_at": published_at,
            "title": title,
            "link": link,
            "description": description,
            "summary": summary,
            "company": company,
        }
        supabase.table("posts").insert(entry_data).execute()
        print(f"Inserted post: {title} from {company}")

        # Create a tweet
        try:
            twitter_client.create_tweet(
                text=f"{company}: {title}\n\ndate: {published_at}\nlink: {link}",
            )
            print(f"Tweeted post: {title} from {company}")
        except tweepy.errors.TooManyRequests:
            print("Rate limit exceeded. Skipping tweet.")
            continue


# Fetch existing data from the 'posts' table
response = supabase.table("posts").select("link").execute()
existing_posts = response.data

# Fetch companies and links from the 'links' table
response = supabase.table("links").select("company, link").execute()
rss_links = response.data

print("Start parsing feeds...")
for link_info in tqdm(rss_links, desc="Parsing RSS feeds", unit="feed"):
    company = link_info["company"]
    url = link_info["link"]
    parse_feed(url, company)
print("Finished parsing feeds.")
