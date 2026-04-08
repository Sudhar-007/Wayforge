from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import httpx
import asyncio
import os
import json

from intent_mapper import build_search_strategy
from searcher import search_all
from scraper import scrape_all
from ranker import filter_results, format_for_prompt
from validator import validate_all

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT_TEMPLATE = """You are Pathfinder, a CS learning roadmap generator.

You have access to real, freshly researched resources gathered specifically for this user. Use ONLY the resources provided below — never invent URLs or course names.

{resource_context}

Based on the user's profile and the resources above, generate a personalized roadmap in this EXACT format:

ROADMAP_START
PHASE:Foundation
DURATION:Week 1-2
CONTENT:- [resource name from above] — [exact URL from above]
- [resource name from above] — [exact URL from above]
PROJECT:[project name from above] — [exact URL from above]

PHASE:Core Skills
DURATION:Week 3-6
CONTENT:- [resource name from above] — [exact URL from above]
- [resource name from above] — [exact URL from above]
PROJECT:[project name from above] — [exact URL from above]

PHASE:Specialization
DURATION:Week 7-10
CONTENT:- [resource name from above] — [exact URL from above]
PROJECT:[project name from above] — [exact URL from above]

PHASE:Portfolio Push
DURATION:Week 11-12
CONTENT:- [resource name from above] — [exact URL from above]
PROJECT:[project name from above] — [exact URL from above]

KEY_CONCEPT:[one insight about their specific path most people miss]
ROADMAP_END

Match resources to the user's skill level. Order from foundational to advanced. Be specific."""

INTERVIEW_PROMPT = """You are Pathfinder, a CS learning roadmap generator. Conduct a short interview to understand the user.

Ask these 5 questions one at a time, naturally and conversationally:
1. What's their end goal? (job, build something, research, explore)
2. Current skill level? (never coded, basics, intermediate, experienced)
3. What CS area interests them? (web dev, ML, cybersecurity, mobile, DSA, etc.)
4. How many hours per week can they dedicate?
5. Do they prefer learning by building or theory first?

After the user answers question 5, respond with exactly:
INTERVIEW_COMPLETE
goal: [their goal]
skill: [their skill level]
interest: [their interest area]
hours: [hours per week]
style: [learning style]

Do not generate a roadmap yet. Just collect the answers and output INTERVIEW_COMPLETE with the summary."""

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]

def parse_interview_complete(text: str) -> dict:
    lines = text.split("\n")
    data = {}
    for line in lines:
        if line.startswith("goal:"):
            data["goal"] = line.replace("goal:", "").strip()
        elif line.startswith("skill:"):
            data["skill"] = line.replace("skill:", "").strip()
        elif line.startswith("interest:"):
            data["interest"] = line.replace("interest:", "").strip()
        elif line.startswith("hours:"):
            data["hours"] = line.replace("hours:", "").strip()
        elif line.startswith("style:"):
            data["style"] = line.replace("style:", "").strip()
    return data

async def generate_roadmap(user_data: dict) -> str:
    print(f"Building search strategy for: {user_data}")
    strategy = build_search_strategy(
        goal=user_data.get("goal", ""),
        skill_input=user_data.get("skill", ""),
        interest=user_data.get("interest", ""),
        hours_per_week=user_data.get("hours", ""),
        learning_style=user_data.get("style", "")
    )
    print(f"Track: {strategy.track}, Level: {strategy.skill_level}")

    print("Searching for resources...")
    raw_results = await search_all(strategy.queries, strategy.project_queries)

    print("Scraping content...")
    scraped_resources = await scrape_all(raw_results["resources"])
    scraped_projects = await scrape_all(raw_results["projects"])

    print("Validating URLs...")
    validated_resources = await validate_all(scraped_resources)
    validated_projects = await validate_all(scraped_projects)

    print("Ranking results...")
    top_resources = filter_results(validated_resources, top_n=8)
    top_projects = filter_results(validated_projects, top_n=4)

    resource_context = format_for_prompt(top_resources, top_projects)
    print(f"Final context: {len(top_resources)} resources, {len(top_projects)} projects")

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(resource_context=resource_context)

    messages = [{"role": "system", "content": system_prompt}]
    messages.append({
        "role": "user",
        "content": f"Generate my roadmap based on: Goal={user_data.get('goal')}, Skill={user_data.get('skill')}, Interest={user_data.get('interest')}, Hours/week={user_data.get('hours')}, Style={user_data.get('style')}"
    })

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            "http://localhost:11434/api/chat",
            json={
                "model": "llama3.1:8b",
                "messages": messages,
                "stream": False
            }
        )
    data = response.json()
    return data["message"]["content"]

@app.post("/chat")
async def chat(request: ChatRequest):
    messages = [{"role": "system", "content": INTERVIEW_PROMPT}]
    for m in request.messages:
        messages.append({"role": m.role, "content": m.content})

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            "http://localhost:11434/api/chat",
            json={
                "model": "llama3.1:8b",
                "messages": messages,
                "stream": False
            }
        )

    data = response.json()
    reply = data["message"]["content"]

    if "INTERVIEW_COMPLETE" in reply:
        user_data = parse_interview_complete(reply)
        print(f"Interview complete, generating roadmap for: {user_data}")
        roadmap = await generate_roadmap(user_data)
        return {"response": roadmap}

    return {"response": reply}

@app.get("/health")
async def health():
    return {"status": "ok"}
