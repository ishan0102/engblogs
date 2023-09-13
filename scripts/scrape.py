import os
from dotenv import load_dotenv
from supabase import create_client
from tqdm import tqdm
import requests
import trafilatura

# Load environment variables
load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)

def scrape_post(link):
    """
    Scrape the blog post content.
    This function is a placeholder. You would replace it with your actual scraping logic.
    """
    return trafilatura.html2txt(requests.get(link).text)

def backfill():
    # Fetch RSS links from the Supabase "links" table
    response = supabase.table("links").select("company, link").execute()
    rss_links = response.get('data', [])
    
    for link_data in tqdm(rss_links):
        company = link_data['company']
        link = link_data['link']
        
        # Scrape the blog post content
        content = scrape_post(link)
        
        if content:
            # Update the Supabase table with the scraped content
            response = supabase.table("links").update({
                'content': content,
            }).match({'link': link}).execute()
            
            if response.get('error'):
                print(f"Failed to backfill for {link}: {response['error']}")

if __name__ == "__main__":
    # backfill()
    print(scrape_post("https://blog.janestreet.com/what-the-interns-have-wrought-2023/"))
