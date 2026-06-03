from dataclasses import dataclass
from typing import List

@dataclass
class SearchStrategy:
    track: str
    skill_level: str
    queries: List[str]
    project_queries: List[str]

def build_search_strategy(goal: str, skill_input: str, interest: str, hours_per_week: str, learning_style: str) -> SearchStrategy:
    """Build a search strategy based on user input"""

    # Determine track
    track = interest.lower() if interest else "general programming"

    # Determine skill level. Accepts both the legacy /chat vocabulary
    # ("never coded"/"basics"/"experienced") and the structured /generate
    # levels ("Beginner"/"Intermediate"/"Advanced").
    skill_map = {
        "never coded": "beginner",
        "basics": "beginner",
        "beginner": "beginner",
        "intermediate": "intermediate",
        "advanced": "advanced",
        "experienced": "advanced"
    }
    skill_level = "beginner"
    for key, value in skill_map.items():
        if key in skill_input.lower():
            skill_level = value
            break

    # Build resource queries
    queries = [
        f"best {track} tutorial for {skill_level}",
        f"{track} learning path {skill_level}",
        f"{track} course {skill_level}",
        f"learn {track} step by step",
        f"{track} resources for {skill_level}"
    ]

    # Build project queries
    project_queries = [
        f"{track} beginner projects",
        f"{track} practice projects {skill_level}",
        f"{track} portfolio projects",
        f"hands-on {track} projects"
    ]

    return SearchStrategy(
        track=track,
        skill_level=skill_level,
        queries=queries,
        project_queries=project_queries
    )
