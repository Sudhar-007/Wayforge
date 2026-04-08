import httpx
import asyncio
from typing import List, Dict
from bs4 import BeautifulSoup

SKIP_DOMAINS = [
    "youtube.com", "youtu.be",
    "twitter.com", "x.com",
    "facebook.com", "instagram.com",
    "linkedin.com", "tiktok.com",
    "reddit.com"
]


def should_skip(url: str) -> bool:
    return any(domain in url for domain in SKIP_DOMAINS)


def extract_content(html: str, url: str) -> Dict:
    try:
        soup = BeautifulSoup(html, "html.parser")

        for tag in soup(["script", "style", "nav", "footer", "header", "aside", "form"]):
            tag.decompose()

        title = ""
        if soup.title:
            title = soup.title.string or ""

        meta_desc = ""
        meta = soup.find("meta", attrs={"name": "description"})
        if meta:
            meta_desc = meta.get("content", "")

        paragraphs = soup.find_all("p")
        body_text = " ".join(p.get_text(strip=True) for p in paragraphs[:8])
        body_text = " ".join(body_text.split())[:800]

        return {
            "url": url,
            "title": title.strip(),
            "description": meta_desc.strip(),
            "content": body_text.strip()
        }
    except Exception as e:
        return {
            "url": url,
            "title": "",
            "description": "",
            "content": ""
        }


async def scrape_single(client: httpx.AsyncClient, result: Dict) -> Dict:
    url = result["url"]

    enriched = {
        **result,
        "scraped_title": "",
        "scraped_description": "",
        "scraped_content": ""
    }

    if should_skip(url):
        return enriched

    try:
        response = await client.get(
            url,
            timeout=8.0,
            follow_redirects=True,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        )

        if response.status_code == 200:
            content_type = response.headers.get("content-type", "")
            if "text/html" in content_type:
                extracted = extract_content(response.text, url)
                enriched["scraped_title"] = extracted["title"]
                enriched["scraped_description"] = extracted["description"]
                enriched["scraped_content"] = extracted["content"]

    except Exception as e:
        print(f"Scrape failed for {url}: {e}")

    return enriched


async def scrape_all(results: List[Dict]) -> List[Dict]:
    async with httpx.AsyncClient() as client:
        tasks = [scrape_single(client, r) for r in results]
        scraped = await asyncio.gather(*tasks)
    return list(scraped)

