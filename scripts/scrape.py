import httpx
import trafilatura


def fetch_bytes(url, max_bytes=3_000_000):
    with httpx.stream('GET', url, follow_redirects=True, timeout=httpx.Timeout(20, connect=5),
                      headers={'User-Agent': 'Mozilla/5.0 (compatible; engblogs.dev/1.0; RSS reader)'}) as response:
        response.raise_for_status()
        chunks, length = [], 0
        for chunk in response.iter_bytes():
            length += len(chunk)
            if length > max_bytes:
                raise ValueError('Response exceeds size limit')
            chunks.append(chunk)
        return b''.join(chunks)


def scrape_post(link):
    return trafilatura.extract(fetch_bytes(link))
