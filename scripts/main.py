import os
import feedparser
from supabase import create_client
from dotenv import load_dotenv
from tqdm import tqdm
import openai
from summarize import get_summary

load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
openai.api_key = os.getenv("OPENAI_API_KEY")

supabase = create_client(url, key)

def parse_feed(url, company):
    feed = feedparser.parse(url)
    for entry in feed.entries:
        # Fetch title and description
        title = entry.title
        description = getattr(entry, 'description', '')
        published_at = entry.published
        link = entry.link

        # Check if the entry exists in the 'posts' table
        exists_response = supabase.table('posts').select('title').eq('title', title).eq('published_at', published_at).execute()
        if exists_response.data:
            print(f"Skipped existing post: {title} from {company}")
            continue

        # If the entry is not a duplicate, generate a summary
        summary = get_summary(title, description)

        # Insert the new entry into the 'posts' table
        entry_data = {
            'published_at': published_at,
            'title': title,
            'link': link,
            'description': description,
            'summary': summary,
            'company': company
        }
        supabase.table('posts').insert(entry_data).execute()
        print(f"Inserted post: {title} from {company}")

# Fetch companies and links from the 'links' table
response = supabase.table('links').select("company, link").execute()
rss_links = response.data

print("Start parsing feeds...")
for link_info in tqdm(rss_links, desc='Parsing RSS feeds', unit='feed'):
    company = link_info['company']
    url = link_info['link']
    parse_feed(url, company)
print("Finished parsing feeds.")
