import tweepy
from dotenv import load_dotenv
import os

load_dotenv()

# Authenticate to Twitter
client = tweepy.Client(
    consumer_key=os.getenv("CONSUMER_KEY"),
    consumer_secret=os.getenv("CONSUMER_SECRET"),
    access_token=os.getenv("ACCESS_TOKEN"),
    access_token_secret=os.getenv("ACCESS_TOKEN_SECRET"),
)

client.create_tweet(
    text="Hello world!"
)

