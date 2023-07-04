from typing import List, Dict
import feedparser

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

def parse_feed(url):
    feed = feedparser.parse(url)
    entries = []
    for entry in feed.entries:
        entries.append({
            'title': entry.title,
            'link': entry.link,
            'published': entry.published,
        })
    return entries

for url in rss_urls:
    entries = parse_feed(url)
    print(entries)
