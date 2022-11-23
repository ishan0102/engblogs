import pandas as pd
import requests
from bs4 import BeautifulSoup

def parse_readme():
    with open('readme.md', 'r') as f:
        readme = f.read()
        readme = readme.split('Blog links')[1]
        readme = readme.split('\n')
        readme = [line for line in readme if line]
        readme = [line.split('- ')[1].split(': ') for line in readme]
        df = pd.DataFrame(readme, columns=['company', 'link'])
        return df

df = parse_readme()
for index, row in df.iterrows():
    # grab page html and check if it has an RSS feed
    page = requests.get(row['link'])
    soup = BeautifulSoup(page.content, 'html.parser')
    rss = soup.find('link', {'type': 'application/rss+xml'})
    if rss:
        print(row['company'], rss['href'])