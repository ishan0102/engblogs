import trafilatura

trafilatura.logging.getLogger().setLevel("CRITICAL")


def scrape_post(link):
    downloaded = trafilatura.fetch_url(link)
    return trafilatura.extract(downloaded)
