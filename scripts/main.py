import os
import feedparser
from supabase import create_client, Client
from dotenv import load_dotenv
from tqdm import tqdm

load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)

def parse_feed(url, company):
    feed = feedparser.parse(url)
    entries = []
    for entry in feed.entries:
        entries.append({
            'published_at': entry.published,
            'title': entry.title,
            'link': entry.link,
            'description': getattr(entry, 'description', ''),  # Use empty string if 'description' does not exist
            'company': company
        })
    return entries

# Fetch companies and links from the 'links' table
response = supabase.table('links').select("company, link").execute()
rss_links = response.data

print("Start parsing feeds...")
for link_info in tqdm(rss_links, desc='Parsing RSS feeds', unit='feed'):
    company = link_info['company']
    url = link_info['link']
    entries = parse_feed(url, company)
    for entry in entries:
        # Check if the entry exists in the 'posts' table
        exists_response = supabase.table('posts').select('title').eq('title', entry['title']).eq('published_at', entry['published_at']).execute()
        if not exists_response.data:
            # Insert the entry into the 'posts' table if it doesn't exist
            data, count = supabase.table('posts').insert(entry).execute()
            print(f"Inserted post: {entry['title']} from {company}")
        else:
            print(f"Skipped existing post: {entry['title']} from {company}")
print("Finished parsing feeds.")
