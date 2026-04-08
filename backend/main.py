from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import httpx
import asyncio
import os
import json
import google.generativeai as genai

from intent_mapper import build_search_strategy
from searcher import search_all
from scraper import scrape_all
from ranker import filter_results, format_for_prompt
from validator import validate_all

# Configure Gemini
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-3.1-flash-lite-preview')
else:
    print("WARNING: GEMINI_API_KEY not found!")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT_TEMPLATE = """You are Pathfinder. Generate a learning roadmap as a Mermaid flowchart.

RULES:
1. Use ONLY resources from the database below — never invent URLs
2. Node labels should be SHORT (resource name only, NO URLs)
3. Include full URLs in the RESOURCES section after the diagram
4. Output ONLY valid Mermaid code with clean, readable nodes

{resource_context}

Generate output in EXACTLY this format:

ROADMAP_START
MERMAID_START
graph TD
    A["🎯 Goal: [their goal]"]

    subgraph Foundation ["📚 Foundation — Week 1-2"]
        B["[Short Resource Name]"]
        C["[Short Resource Name]"]
        D["🔨 [Project Name]"]
    end

    subgraph Core ["⚙️ Core Skills — Week 3-6"]
        E["[Short Resource Name]"]
        F["[Short Resource Name]"]
        G["🔨 [Project Name]"]
    end

    subgraph Specialization ["🔬 Specialization — Week 7-10"]
        H["[Short Resource Name]"]
        I["🔨 [Project Name]"]
    end

    subgraph Portfolio ["🚀 Portfolio Push — Week 11-12"]
        J["[Short Resource Name]"]
        K["🔨 [Project Name]"]
    end

    A --> B
    A --> C
    B --> D
    C --> D
    D --> E
    D --> F
    E --> G
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K

    K["✅ Portfolio Ready"]

    style A fill:#6366f1,color:#fff
    style D fill:#10b981,color:#fff
    style G fill:#10b981,color:#fff
    style I fill:#10b981,color:#fff
    style K fill:#f59e0b,color:#fff
MERMAID_END

RESOURCES:
B: [Resource Name] — [Full URL]
C: [Resource Name] — [Full URL]
D: [Project Name] — [Full URL]
E: [Resource Name] — [Full URL]
F: [Resource Name] — [Full URL]
G: [Project Name] — [Full URL]
H: [Resource Name] — [Full URL]
I: [Project Name] — [Full URL]
J: [Resource Name] — [Full URL]
K: [Project Name] — [Full URL]

KEY_CONCEPT:[one specific insight most people miss about this exact path]
ROADMAP_END

Only use resources from the database. Keep node names SHORT and readable."""

INTERVIEW_PROMPT = """You are Pathfinder, a CS learning assistant conducting an intake interview.

YOUR ONLY JOB RIGHT NOW IS TO ASK QUESTIONS AND COLLECT ANSWERS.
DO NOT generate a roadmap. DO NOT suggest resources. DO NOT give advice.
ONLY ask questions one at a time and listen.

Ask these 5 questions one at a time:
1. What is your end goal? (job, build something, research, or explore)
2. What is your current skill level? (never coded, basics, intermediate, experienced)
3. What CS area interests you? (web dev, ML, cybersecurity, mobile, DSA, etc.)
4. How many hours per week can you dedicate?
5. Do you prefer learning by building projects or studying theory first?

AFTER THE USER HAS ANSWERED ALL 5 QUESTIONS, output EXACTLY this and nothing else:

INTERVIEW_COMPLETE
goal: [their answer to question 1]
skill: [their answer to question 2]
interest: [their answer to question 3]
hours: [their answer to question 4]
style: [their answer to question 5]

CRITICAL RULES:
- Ask only ONE question at a time
- Do NOT generate any roadmap
- Do NOT suggest any resources
- Do NOT use ROADMAP_START under any circumstance
- ONLY output INTERVIEW_COMPLETE after question 5 is answered
- Nothing else after INTERVIEW_COMPLETE"""

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
    print(f"Parsed interview data: {data}")
    return data

def verify_roadmap_urls(roadmap: str, validated_urls: set) -> str:
    lines = roadmap.split("\n")
    cleaned = []
    for line in lines:
        if "https://" in line or "http://" in line:
            import re
            urls_in_line = re.findall(r'https?://[^\s\)]+', line)
            all_valid = all(url in validated_urls for url in urls_in_line)
            if all_valid:
                cleaned.append(line)
            else:
                print(f"Removed hallucinated URL line: {line}")
        else:
            cleaned.append(line)
    return "\n".join(cleaned)

async def generate_roadmap(user_data: dict) -> str:
    print("\n" + "="*60)
    print("ROADMAP GENERATION STARTED")
    print("="*60)
    print(f"Building search strategy for: {user_data}")

    # Check for SERPER_API_KEY
    if not os.environ.get("SERPER_API_KEY"):
        print("WARNING: SERPER_API_KEY not found in environment variables!")
        return "Error: SERPER_API_KEY not configured. Please set the API key."

    strategy = build_search_strategy(
        goal=user_data.get("goal", ""),
        skill_input=user_data.get("skill", ""),
        interest=user_data.get("interest", ""),
        hours_per_week=user_data.get("hours", ""),
        learning_style=user_data.get("style", "")
    )

    print(f"Track: {strategy.track}, Level: {strategy.skill_level}")
    print(f"Queries: {strategy.queries[:2]}...")

    print("\nSearching for resources...")
    raw_results = await search_all(strategy.queries, strategy.project_queries)

    # DEBUG 1 - did serper return anything?
    print(f"Raw resources from Serper: {len(raw_results['resources'])}")
    print(f"Raw projects from Serper: {len(raw_results['projects'])}")

    print("Scraping content...")
    scraped_resources = await scrape_all(raw_results["resources"])
    scraped_projects = await scrape_all(raw_results["projects"])

    print("Validating URLs...")
    validated_resources = await validate_all(scraped_resources)
    validated_projects = await validate_all(scraped_projects)

    # DEBUG 2 - did anything survive validation?
    print(f"After validation - resources: {len(validated_resources)}, projects: {len(validated_projects)}")

    print("Ranking results...")
    top_resources = filter_results(validated_resources, top_n=8)
    top_projects = filter_results(validated_projects, top_n=4)

    # DEBUG 3 - what URLs are actually being passed to Ollama?
    print("\n=== URLS BEING SENT TO OLLAMA ===")
    for r in top_resources:
        print(f"  - {r.get('url')}")
    for r in top_projects:
        print(f"  - {r.get('url')}")
    print("=================================\n")

    resource_context = format_for_prompt(top_resources, top_projects)

    # DEBUG 4 - what does the full context look like?
    print(f"Resource context being sent:\n{resource_context[:500]}")
    print(f"Final context: {len(top_resources)} resources, {len(top_projects)} projects")

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(resource_context=resource_context)

    user_prompt = f"Generate my roadmap based on: Goal={user_data.get('goal')}, Skill={user_data.get('skill')}, Interest={user_data.get('interest')}, Hours/week={user_data.get('hours')}, Style={user_data.get('style')}"

    # Use Gemini instead of Ollama
    full_prompt = f"{system_prompt}\n\n{user_prompt}"

    print("\nGenerating roadmap with Gemini...")
    response = gemini_model.generate_content(full_prompt)

    return response.text


@app.post("/chat")
async def chat(request: ChatRequest):
    # Count user messages - after 5 messages, force roadmap generation
    user_message_count = sum(1 for m in request.messages if m.role == "user")

    print(f"DEBUG: Received {user_message_count} user messages")

    # Force roadmap generation after 5 user messages (don't call LLM)
    if user_message_count >= 5:
        print(f"\n{'='*60}")
        print(f"FORCING roadmap generation (5 user messages detected)")
        print(f"{'='*60}\n")

        # Get user messages (skip assistant messages)
        user_messages = [m.content for m in request.messages if m.role == "user"]

        print(f"User answers: {user_messages}")

        # Parse user data more intelligently
        conv_text = " ".join(user_messages).lower()

        # Extract goal (from first message)
        goal = "get a software engineering job"
        if "job" in user_messages[0].lower():
            goal = "get a software engineering job"
        elif "build" in user_messages[0].lower():
            goal = "build projects"
        elif "learn" in user_messages[0].lower():
            goal = "learn programming"

        # Extract skill (from second message)
        skill = "basics"
        msg2 = user_messages[1].lower() if len(user_messages) > 1 else ""
        if "never" in msg2 or "no experience" in msg2:
            skill = "never coded"
        elif "intermediate" in msg2:
            skill = "intermediate"
        elif "advanced" in msg2 or "experienced" in msg2:
            skill = "advanced"
        elif "basics" in msg2 or "basic" in msg2:
            skill = "basics"

        # Extract interest (from third message) - extract just the topic
        interest = "web development"
        msg3 = user_messages[2].lower() if len(user_messages) > 2 else ""
        if "web dev" in msg3 or "web" in msg3:
            interest = "web development"
        elif "machine learning" in msg3 or "ml" in msg3 or "ai" in msg3:
            interest = "machine learning"
        elif "mobile" in msg3 or "app" in msg3:
            interest = "mobile development"
        elif "cyber" in msg3 or "security" in msg3:
            interest = "cybersecurity"
        elif "data" in msg3:
            interest = "data science"
        elif "backend" in msg3:
            interest = "backend development"
        elif "frontend" in msg3:
            interest = "frontend development"

        # Extract hours (from fourth message)
        hours = "10 hours per week"
        import re
        msg4 = user_messages[3] if len(user_messages) > 3 else ""
        hours_match = re.search(r'(\d+)\s*hours?', msg4.lower())
        if hours_match:
            hours = f"{hours_match.group(1)} hours per week"

        # Extract style (from fifth message)
        style = "building projects"
        msg5 = user_messages[4].lower() if len(user_messages) > 4 else ""
        if "project" in msg5 or "building" in msg5 or "hands" in msg5:
            style = "learning by building projects"
        elif "theory" in msg5 or "reading" in msg5 or "concept" in msg5:
            style = "theory first"

        user_data = {
            "goal": goal,
            "skill": skill,
            "interest": interest,
            "hours": hours,
            "style": style
        }

        print(f"Extracted user data: {user_data}")
        roadmap = await generate_roadmap(user_data)
        return {"response": roadmap}

    # Build conversation history for Gemini
    conversation = INTERVIEW_PROMPT + "\n\nConversation so far:\n"
    for m in request.messages:
        role = "User" if m.role == "user" else "Assistant"
        conversation += f"{role}: {m.content}\n"
    conversation += "\nAssistant:"

    # Use Gemini for interview
    print("\nGenerating interview response with Gemini...")
    response = gemini_model.generate_content(conversation)
    reply = response.text

    print(f"Gemini raw reply: {reply[:200]}")

    if "INTERVIEW_COMPLETE" in reply:
        print("Interview complete detected, triggering pipeline...")
        user_data = parse_interview_complete(reply)

        if len(user_data) < 3:
            print(f"Warning: only parsed {len(user_data)} fields, data may be incomplete")
            return {
                "response": "Something went wrong collecting your answers. Let's try again — what's your main goal?"}

        roadmap = await generate_roadmap(user_data)
        return {"response": roadmap}

    if "ROADMAP_START" in reply:
        print("WARNING: Gemini generated roadmap directly, bypassing pipeline")
        return {
            "response": "Let me restart — I need to ask you a few questions first. What's your main goal with learning CS?"}

    return {"response": reply}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
