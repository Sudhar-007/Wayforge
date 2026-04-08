from typing import List, Dict

QUALITY_DOMAINS = {
    "docs.pytorch.org": 10,
    "huggingface.co": 10,
    "fast.ai": 10,
    "cs231n.github.io": 10,
    "karpathy.ai": 10,
    "kaggle.com": 9,
    "coursera.org": 9,
    "mit.edu": 9,
    "stanford.edu": 9,
    "arxiv.org": 9,
    "github.com": 8,
    "tensorflow.org": 8,
    "scikit-learn.org": 8,
    "tryhackme.com": 8,
    "hackthebox.com": 8,
    "leetcode.com": 8,
    "geeksforgeeks.org": 7,
    "towardsdatascience.com": 7,
    "medium.com": 6,
    "freecodecamp.org": 8,
    "w3schools.com": 5,
    "tutorialspoint.com": 5,
    "udemy.com": 7,
    "youtube.com": 7,
    "youtu.be": 7,
}

SPAM_KEYWORDS = [
    "click here", "buy now", "limited offer", "discount",
    "cheapest", "free download crack", "nulled", "torrent"
]

QUALITY_KEYWORDS = [
    "tutorial", "course", "documentation", "guide", "learn",
    "introduction", "beginner", "hands-on", "project", "practice",
    "roadmap", "exercises", "examples", "open source"
]

def score_result(result: Dict) -> float:
    score = 0.0
    url = result.get("url", "").lower()
    title = (result.get("scraped_title") or result.get("title", "")).lower()
    snippet = result.get("snippet", "").lower()
    content = result.get("scraped_content", "").lower()
    full_text = f"{title} {snippet} {content}"

    for domain, domain_score in QUALITY_DOMAINS.items():
        if domain in url:
            score += domain_score
            break
    else:
        score += 4

    for keyword in SPAM_KEYWORDS:
        if keyword in full_text:
            score -= 5

    for keyword in QUALITY_KEYWORDS:
        if keyword in full_text:
            score += 0.5

    if result.get("scraped_content"):
        score += 2

    if result.get("scraped_description"):
        score += 1

    return score

def rank_results(results: List[Dict]) -> List[Dict]:
    for r in results:
        r["score"] = score_result(r)

    ranked = sorted(results, key=lambda x: x["score"], reverse=True)
    return ranked

def filter_results(results: List[Dict], top_n: int = 8) -> List[Dict]:
    ranked = rank_results(results)
    filtered = [r for r in ranked if r["score"] > 3]
    return filtered[:top_n]

def format_for_prompt(resources: List[Dict], projects: List[Dict]) -> str:
    resource_text = "AVAILABLE RESOURCES:\n"
    for i, r in enumerate(resources, 1):
        title = r.get("scraped_title") or r.get("title", "Unknown")
        url = r.get("url", "")
        description = r.get("scraped_description") or r.get("snippet", "")
        resource_text += f"{i}. {title}\n   URL: {url}\n   About: {description[:150]}\n\n"

    project_text = "AVAILABLE PROJECTS:\n"
    for i, r in enumerate(projects, 1):
        title = r.get("scraped_title") or r.get("title", "Unknown")
        url = r.get("url", "")
        description = r.get("scraped_description") or r.get("snippet", "")
        project_text += f"{i}. {title}\n   URL: {url}\n   About: {description[:150]}\n\n"

    return f"{resource_text}\n{project_text}"