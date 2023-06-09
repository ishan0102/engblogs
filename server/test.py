import feedparser

# List of the RSS feed URLs
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
    # Parse the feed
    feed = feedparser.parse(url)
    count = 0  # Counter for the number of blog entries
    
    for entry in feed.entries:
        # Get the title, link, and published date of the entry
        title = entry.title
        link = entry.link
        published = entry.published

        # Print the title, link, and published date
        print(f"Title: {title}")
        print(f"Link: {link}")
        print(f"Published Date: {published}")
        print("-----------------------------")
        
        count += 1  # Increment the counter

    return count  # Return the number of blog entries

# Call the function with each RSS URL
total_count = 0
for rss_url in rss_urls:
    print(f"Parsing feed: {rss_url}")
    total_count += parse_feed(rss_url)
    print("=============================")

print(f"Total count of blog entries: {total_count}")
