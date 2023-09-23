# We will summarize all the posts from the previous day
import os

import trafilatura
from dotenv import load_dotenv
from supabase import create_client
from tqdm import tqdm

import openai
import tiktoken
import json
import random
import time
import datetime

# Load environment variables
load_dotenv()
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
supabase = create_client(url, key)
openai.api_key = os.getenv("OPENAI_API_KEY")
supabase = create_client(url, key)

trafilatura.logging.getLogger().setLevel("CRITICAL")


# This the script to add buzzwords to the database retroactively
# go through all the posts in the database and add buzzwords

from summarize import get_buzzwords


if __name__ == "__main__":
    posts = supabase.table("posts").select("*").execute().data

    for index, post in tqdm(enumerate(posts)):
        # if there already are buzzwords, skip
        if post["buzzwords"]:
            continue
        
        title = post["title"]
        description = post["description"]
        full_text = post["full_text"]
        summary = post["summary"]
        
        # priority is full_text > description > summary
        
        buzzwords_basis = full_text if full_text else description if description else summary
        
        if not buzzwords_basis:
            continue
        try:
            buzzwords = get_buzzwords(title, buzzwords_basis)
            
            if not buzzwords:
                continue
            
            supabase.table("posts").update({"buzzwords": buzzwords}).eq("id", post["id"]).execute()
            
        except Exception as e:
            print(f"Error: {e}")
            
        # every 10 posts, wait 3 seconds
        if index % 10 == 0:
            print("sleeping for 3 seconds")
            time.sleep(3)
        
        