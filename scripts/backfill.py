import os

from dotenv import load_dotenv
from supabase import create_client
from tqdm import tqdm

from scrape import scrape_post
from summarize import get_post_insights

# Load environment variables
load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)


def log_message(message, type="INFO"):
    """
    Custom logging function for uniformity and prettiness.
    :param message: String message to be logged
    :param type: String log type: INFO, WARNING, ERROR
    """
    tqdm.write(f"{type}: {message}")


def backfill_full_text():
    posts = supabase.table("posts").select("link, full_text").execute().data
    for post in tqdm(posts):
        link = post["link"]

        if post["full_text"]:
            log_message(f"Skipping {link} - already scraped")
            continue

        log_message(f"Scraping {link}")
        full_text = scrape_post(link)
        if not full_text:
            log_message(f"Trafilatura - failed to scrape {link}", "WARNING")
            continue

        response = supabase.table("posts").update({"full_text": full_text}).match({"link": link}).execute()

        if "error" in response:
            log_message(f"Supabase - failed to backfill {link}: {response['error']}", "ERROR")


def backfill_buzzwords():
    posts = supabase.table("posts").select("title, link, description, summary, full_text, buzzwords").execute().data
    for post in tqdm(posts):
        title = post["title"]
        link = post["link"]
        description = post["description"]
        full_text = post["full_text"]
        summary = post["summary"]

        if post["buzzwords"]:
            log_message(f"Skipping {link} - buzzwords already extracted")
            continue

        context = full_text if full_text else description if description else summary
        buzzwords = get_post_insights(title, context)["buzzwords"]
        log_message(f"Extracting buzzwords for {link}")

        response = supabase.table("posts").update({"buzzwords": buzzwords}).match({"link": link}).execute()

        if "error" in response:
            log_message(f"Supabase - failed to backfill {link}: {response['error']}", "ERROR")


if __name__ == "__main__":
    backfill_buzzwords()
