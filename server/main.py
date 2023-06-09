from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import feedparser
import threading
import time

app = FastAPI()

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

rss_urls = [
    "https://machinelearning.apple.com/rss.xml",
    "https://aws.amazon.com/blogs/machine-learning/feed/",
    "https://bair.berkeley.edu/blog/feed.xml",
    "https://txt.cohere.ai/rss/",
    "https://www.databricks.com/blog/feed",
    "https://www.deepmind.com/blog/rss.xml",
    "https://blog.duolingo.com/rss/",
    "https://github.blog/engineering.atom",
    "https://feeds.feedburner.com/blogspot/gJZg",
    "https://thehive.ai/blog/feed",
    "https://www.inkandswitch.com/index.xml",
    "https://eng.lyft.com/feed",
    "https://engineering.fb.com/feed/",
    "https://blogs.microsoft.com/ai/feed/",
    "https://netflixtechblog.com/feed",
    "https://openai.com/blog/rss/",
    "https://medium.com/feed/@Pinterest_Engineering",
    "https://blog.replit.com/feed.xml",
    "https://snorkel.ai/feed/",
    "https://engineering.atspotify.com/feed/",
    "https://stability.ai/blog?format=rss",
]

# Store the parsed feeds globally
parsed_feeds: List[Dict] = []

def parse_feed(url):
    feed = feedparser.parse(url)
    entries = []
    for entry in feed.entries:
        entries.append({
            'title': entry.title,
            'link': entry.link,
            'published': entry.published
        })
    return entries

# This function will be run in the background and will update the parsed_feeds global variable every 24 hours
def update_feeds_periodically():
    global parsed_feeds
    while True:
        new_feeds = []
        for rss_url in rss_urls:
            new_feeds.extend(parse_feed(rss_url))
        parsed_feeds = new_feeds
        time.sleep(24 * 60 * 60)  # Wait for 24 hours

# Start the background task
threading.Thread(target=update_feeds_periodically, daemon=True).start()

@app.get('/feeds')
async def feeds(start: int = 0, limit: int = 10):
    return parsed_feeds[start : start + limit]
