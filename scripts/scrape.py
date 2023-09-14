import os

import trafilatura
from dotenv import load_dotenv
from supabase import create_client
from tqdm import tqdm

# Load environment variables
load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)

trafilatura.logging.getLogger().setLevel("CRITICAL")


def scrape_post(link):
    downloaded = trafilatura.fetch_url(link)
    return trafilatura.extract(downloaded)


def backfill():
    response = supabase.table("posts").select("link").execute()
    links = [link["link"] for link in response.data]
    for link in tqdm(links):
        # Check if the post has already been scraped
        response = (
            supabase.table("posts").select("full_text").eq("link", link).execute()
        )
        if response.data and response.data[0]["full_text"]:
            tqdm.write(f"Skipping {link} - already scraped")
            continue

        # Scrape the blog post content
        tqdm.write(f"Scraping {link}")
        full_text = scrape_post(link)
        if not full_text:
            print(f"Trafilatura - failed to scrape {link}")
            continue

        # Update the Supabase table with the scraped content
        response = (
            supabase.table("posts")
            .update(
                {
                    "full_text": full_text,
                }
            )
            .match({"link": link})
            .execute()
        )

        if "error" in response:
            print(f"Supabase - failed to backfill {link}: {response['error']}")


if __name__ == "__main__":
    backfill()
