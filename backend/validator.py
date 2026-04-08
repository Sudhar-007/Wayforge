import httpx
import asyncio
from typing import List, Dict

async def validate_single(client: httpx.AsyncClient, result: Dict) -> Dict:
    url = result.get("url", "")
    if not url:
        result["is_live"] = False
        return result

    try:
        response = await client.head(
            url,
            timeout=5.0,
            follow_redirects=True,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        result["is_live"] = response.status_code < 400
    except Exception:
        try:
            response = await client.get(
                url,
                timeout=5.0,
                follow_redirects=True,
                headers={"User-Agent": "Mozilla/5.0"}
            )
            result["is_live"] = response.status_code < 400
        except Exception:
            result["is_live"] = False

    return result

async def validate_all(results: List[Dict]) -> List[Dict]:
    async with httpx.AsyncClient() as client:
        tasks = [validate_single(client, r) for r in results]
        validated = await asyncio.gather(*tasks)

    live = [r for r in validated if r.get("is_live")]
    dead = len(validated) - len(live)
    print(f"Validation: {len(live)} live, {dead} dead links removed")
    return live