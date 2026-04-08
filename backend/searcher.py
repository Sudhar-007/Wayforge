import httpx
import asyncio
import os
from typing import List, Dict

# Try Doppler first, fallback to environment variable
try:
    from doppler_sdk import DopplerSDK
    doppler = DopplerSDK()
    SERPER_API_KEY = doppler.secrets.get("SERPER_API_KEY")
except (ImportError, Exception):
    # Fallback to environment variable (for doppler run -- python main.py)
    SERPER_API_KEY = os.environ.get("SERPER_API_KEY")


async def search_single(client: httpx.AsyncClient, query: str) -> List[Dict]:
    try:
        response = await client.post(
            "https://google.serper.dev/search",
            headers={
                "X-API-KEY": SERPER_API_KEY,
                "Content-Type": "application/json"
            },
            json={
                "q": query,
                "num": 5
            },
            timeout=10.0
        )

        # Debug: Check response status and content
        if response.status_code != 200:
            print(f"Serper API error for '{query}': Status {response.status_code}")
            print(f"Response: {response.text[:200]}")
            return []

        data = response.json()

        # Debug: Check if API returned error
        if "error" in data:
            print(f"Serper API error for '{query}': {data.get('error')}")
            return []

        # Debug: Check organic results
        organic = data.get("organic", [])
        if not organic:
            print(f"No organic results for '{query}' - API response keys: {list(data.keys())}")

        results = []
        for item in organic:
            results.append({
                "title": item.get("title", ""),
                "url": item.get("link", ""),
                "snippet": item.get("snippet", ""),
                "query": query
            })
        return results
    except Exception as e:
        print(f"Search failed for query '{query}': {e}")
        return []


async def search_all(queries: List[str], project_queries: List[str]) -> Dict:
    async with httpx.AsyncClient() as client:
        resource_tasks = [search_single(client, q) for q in queries]
        project_tasks = [search_single(client, q) for q in project_queries]

        all_tasks = resource_tasks + project_tasks
        all_results = await asyncio.gather(*all_tasks)

        resource_results = []
        for result_list in all_results[:len(queries)]:
            resource_results.extend(result_list)

        project_results = []
        for result_list in all_results[len(queries):]:
            project_results.extend(result_list)

    seen_urls = set()
    unique_resources = []
    for r in resource_results:
        if r["url"] not in seen_urls and r["url"]:
            seen_urls.add(r["url"])
            unique_resources.append(r)

    seen_urls = set()
    unique_projects = []
    for r in project_results:
        if r["url"] not in seen_urls and r["url"]:
            seen_urls.add(r["url"])
            unique_projects.append(r)

    return {
        "resources": unique_resources,
        "projects": unique_projects
    }


