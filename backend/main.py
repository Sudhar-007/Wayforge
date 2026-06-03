from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.api_core import exceptions as google_api_exceptions
from pydantic import BaseModel
from typing import List, Literal
import asyncio
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

import google.generativeai as genai

from intent_mapper import build_search_strategy
from searcher import search_all
from scraper import scrape_all
from ranker import filter_results, format_for_prompt
from validator import validate_all
from synthesizer import synthesize_roadmap, mock_structured_roadmap

# Configure Gemini. Default to Gemini 3.1 Flash-Lite; override with GEMINI_MODEL
# env if needed. Stay on 3.1 (or newer) — do not pin back to 2.0.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-3.1-flash-lite")
gemini_model = None

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel(GEMINI_MODEL)
    print(f"Gemini model: {GEMINI_MODEL}")
else:
    print("WARNING: GEMINI_API_KEY not found!")


def generate_gemini_text(prompt: str) -> str:
    if not gemini_model:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY is not configured.")
    try:
        response = gemini_model.generate_content(prompt)
        return response.text
    except google_api_exceptions.ResourceExhausted as e:
        raise HTTPException(
            status_code=503,
            detail=(
                "Gemini API quota exceeded. Wait a minute and try again, "
                "or use a different API key / model (GEMINI_MODEL env var)."
            ),
        ) from e
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Gemini API error: {e}") from e


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SYSTEM_PROMPT_TEMPLATE = """You are Pathfinder. Generate a personalized learning roadmap as structured JSON.

CRITICAL RULES:
1. Use ONLY resources from the database below — never invent URLs or names
2. Output ONLY the markers and JSON shown below — no extra text before or after
3. The JSON must be valid and parseable

{resource_context}

Output EXACTLY this format (fill every placeholder with real data from the database above):

ROADMAP_START
{{
  "goal": "[user's stated goal]",
  "keyConcept": "[one specific insight most people miss about this exact path]",
  "phases": [
    {{
      "id": "foundation",
      "name": "Foundation",
      "emoji": "📚",
      "duration": "Week 1-2",
      "nodes": [
        {{
          "id": "f1",
          "label": "[Short Resource Name]",
          "type": "resource",
          "url": "[exact URL from database]",
          "description": "[one sentence from database about this resource]"
        }},
        {{
          "id": "f2",
          "label": "[Short Resource Name]",
          "type": "resource",
          "url": "[exact URL from database]",
          "description": "[one sentence from database about this resource]"
        }},
        {{
          "id": "f3",
          "label": "[Project Name]",
          "type": "project",
          "url": "[exact URL from database]",
          "description": "[what this project practices]"
        }}
      ]
    }},
    {{
      "id": "core",
      "name": "Core Skills",
      "emoji": "⚙️",
      "duration": "Week 3-6",
      "nodes": [
        {{
          "id": "c1",
          "label": "[Short Resource Name]",
          "type": "resource",
          "url": "[exact URL from database]",
          "description": "[one sentence from database]"
        }},
        {{
          "id": "c2",
          "label": "[Short Resource Name]",
          "type": "resource",
          "url": "[exact URL from database]",
          "description": "[one sentence from database]"
        }},
        {{
          "id": "c3",
          "label": "[Project Name]",
          "type": "project",
          "url": "[exact URL from database]",
          "description": "[what this project practices]"
        }}
      ]
    }},
    {{
      "id": "specialization",
      "name": "Specialization",
      "emoji": "🔬",
      "duration": "Week 7-10",
      "nodes": [
        {{
          "id": "s1",
          "label": "[Short Resource Name]",
          "type": "resource",
          "url": "[exact URL from database]",
          "description": "[one sentence from database]"
        }},
        {{
          "id": "s2",
          "label": "[Project Name]",
          "type": "project",
          "url": "[exact URL from database]",
          "description": "[what this project practices]"
        }}
      ]
    }},
    {{
      "id": "portfolio",
      "name": "Portfolio Push",
      "emoji": "🚀",
      "duration": "Week 11-12",
      "nodes": [
        {{
          "id": "p1",
          "label": "[Short Resource Name]",
          "type": "resource",
          "url": "[exact URL from database]",
          "description": "[one sentence from database]"
        }},
        {{
          "id": "p2",
          "label": "[Capstone Project]",
          "type": "project",
          "url": "[exact URL from database]",
          "description": "[what this project demonstrates]"
        }}
      ]
    }}
  ]
}}
ROADMAP_END"""

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


class GenerateRequest(BaseModel):
    topic: str
    level: Literal["Beginner", "Intermediate", "Advanced"]
    weekly: str  # "1-3 hours" | "4-7 hours" | "8-15 hours" | "15+ hours"
    goal: str
    focus: str = ""


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


def generate_mock_roadmap(user_data: dict) -> str:
    interest = user_data.get("interest", "web development").lower()
    goal = user_data.get("goal", "Learn programming")

    if "ml" in interest or "machine" in interest or "ai" in interest:
        roadmap = {
            "goal": goal,
            "keyConcept": "Don't get bogged down in pure math first — code algorithms, see them work, and then learn the math behind why they work.",
            "phases": [
                {
                    "id": "foundation", "name": "Foundation", "emoji": "📚", "duration": "Week 1-2",
                    "nodes": [
                        {"id": "f1", "label": "Math Foundations", "type": "resource", "url": "https://www.khanacademy.org/math/linear-algebra", "description": "Linear algebra and calculus foundations essential for understanding ML algorithms"},
                        {"id": "f2", "label": "Python & NumPy", "type": "resource", "url": "https://numpy.org/doc/stable/user/absolute_beginners.html", "description": "Essential Python and NumPy skills for data manipulation and numerical computing"},
                        {"id": "f3", "label": "Data Analysis Sandbox", "type": "project", "url": "https://github.com/explore", "description": "Explore and visualize a real-world dataset end-to-end using Pandas and Matplotlib"}
                    ]
                },
                {
                    "id": "core", "name": "Core Skills", "emoji": "⚙️", "duration": "Week 3-6",
                    "nodes": [
                        {"id": "c1", "label": "Scikit-Learn ML", "type": "resource", "url": "https://scikit-learn.org/stable/tutorial/index.html", "description": "Hands-on machine learning with Scikit-Learn: classification, regression, and clustering"},
                        {"id": "c2", "label": "Pandas for Data", "type": "resource", "url": "https://pandas.pydata.org/docs/user_guide/10min.html", "description": "Data wrangling, cleaning, and analysis with the Pandas library"},
                        {"id": "c3", "label": "House Price Predictor", "type": "project", "url": "https://github.com/explore", "description": "Build and evaluate a regression model on real housing data from Kaggle"}
                    ]
                },
                {
                    "id": "specialization", "name": "Specialization", "emoji": "🔬", "duration": "Week 7-10",
                    "nodes": [
                        {"id": "s1", "label": "Deep Learning with PyTorch", "type": "resource", "url": "https://pytorch.org/tutorials/beginner/basics/intro.html", "description": "Neural networks, backpropagation, and deep learning with PyTorch"},
                        {"id": "s2", "label": "Image Classifier", "type": "project", "url": "https://github.com/explore", "description": "Train a convolutional neural network to classify images using PyTorch"}
                    ]
                },
                {
                    "id": "portfolio", "name": "Portfolio Push", "emoji": "🚀", "duration": "Week 11-12",
                    "nodes": [
                        {"id": "p1", "label": "Hugging Face Hub", "type": "resource", "url": "https://huggingface.co/", "description": "Deploy and fine-tune pre-trained transformer models for NLP tasks"},
                        {"id": "p2", "label": "Custom ML Web App", "type": "project", "url": "https://github.com/explore", "description": "Deploy your trained model as a live interactive web application"}
                    ]
                }
            ]
        }
    elif "cyber" in interest or "security" in interest:
        roadmap = {
            "goal": goal,
            "keyConcept": "Security is about mindset, not tools. Understand the underlying system protocols before trying to break them.",
            "phases": [
                {
                    "id": "foundation", "name": "Foundation", "emoji": "📚", "duration": "Week 1-2",
                    "nodes": [
                        {"id": "f1", "label": "Networking Basics", "type": "resource", "url": "https://www.comptia.org/certifications/network", "description": "TCP/IP, DNS, HTTP and core networking protocols every security professional must know"},
                        {"id": "f2", "label": "Linux Command Line", "type": "resource", "url": "https://linuxjourney.com/", "description": "Essential Linux command-line skills for security research and pentesting"},
                        {"id": "f3", "label": "Secure Home Lab Setup", "type": "project", "url": "https://github.com/explore", "description": "Build an isolated virtual lab with VMs for safe security practice"}
                    ]
                },
                {
                    "id": "core", "name": "Core Skills", "emoji": "⚙️", "duration": "Week 3-6",
                    "nodes": [
                        {"id": "c1", "label": "TryHackMe Pentesting", "type": "resource", "url": "https://tryhackme.com/", "description": "Guided penetration testing labs and beginner-friendly CTF challenges"},
                        {"id": "c2", "label": "OWASP Top 10", "type": "resource", "url": "https://owasp.org/www-project-top-ten/", "description": "The 10 most critical web application security vulnerabilities with examples"},
                        {"id": "c3", "label": "Vulnerability Scanner", "type": "project", "url": "https://github.com/explore", "description": "Write a basic port and service scanner in Python using socket programming"}
                    ]
                },
                {
                    "id": "specialization", "name": "Specialization", "emoji": "🔬", "duration": "Week 7-10",
                    "nodes": [
                        {"id": "s1", "label": "Wireshark Network Analysis", "type": "resource", "url": "https://www.wireshark.org/docs/", "description": "Packet capture, filtering, and network traffic analysis with Wireshark"},
                        {"id": "s2", "label": "Packet Sniffer Analyzer", "type": "project", "url": "https://github.com/explore", "description": "Capture and analyze live network traffic to detect anomalous patterns"}
                    ]
                },
                {
                    "id": "portfolio", "name": "Portfolio Push", "emoji": "🚀", "duration": "Week 11-12",
                    "nodes": [
                        {"id": "p1", "label": "Hack The Box", "type": "resource", "url": "https://www.hackthebox.com/", "description": "Real-world penetration testing machines and challenges for portfolio building"},
                        {"id": "p2", "label": "CTF Portfolio Writeups", "type": "project", "url": "https://github.com/explore", "description": "Document your CTF solutions as professional security writeups on GitHub"}
                    ]
                }
            ]
        }
    else:
        # Default: Web Development
        roadmap = {
            "goal": goal,
            "keyConcept": "Master Vanilla JavaScript before diving into complex frameworks. Frameworks change, but JS fundamentals remain forever.",
            "phases": [
                {
                    "id": "foundation", "name": "Foundation", "emoji": "📚", "duration": "Week 1-2",
                    "nodes": [
                        {"id": "f1", "label": "HTML & CSS Deep Dive", "type": "resource", "url": "https://developer.mozilla.org/en-US/docs/Learn", "description": "MDN's comprehensive guide to HTML and CSS — the standard reference for web fundamentals"},
                        {"id": "f2", "label": "JavaScript to ES6", "type": "resource", "url": "https://javascript.info/", "description": "Modern JavaScript from first principles, covering syntax, DOM, and async patterns"},
                        {"id": "f3", "label": "Personal Portfolio Site", "type": "project", "url": "https://github.com/explore", "description": "Build and deploy your personal portfolio using pure HTML, CSS, and JavaScript"}
                    ]
                },
                {
                    "id": "core", "name": "Core Skills", "emoji": "⚙️", "duration": "Week 3-6",
                    "nodes": [
                        {"id": "c1", "label": "React Framework", "type": "resource", "url": "https://react.dev/learn", "description": "The official React docs and tutorial — components, state, hooks, and data flow"},
                        {"id": "c2", "label": "Git & GitHub", "type": "resource", "url": "https://docs.github.com/en/get-started", "description": "Version control, branching, pull requests, and collaborative development workflows"},
                        {"id": "c3", "label": "Task Manager App", "type": "project", "url": "https://github.com/explore", "description": "Full CRUD application in React with state management and local storage"}
                    ]
                },
                {
                    "id": "specialization", "name": "Specialization", "emoji": "🔬", "duration": "Week 7-10",
                    "nodes": [
                        {"id": "s1", "label": "Node.js & Express", "type": "resource", "url": "https://expressjs.com/", "description": "Build REST APIs and server-side applications with Node.js and Express"},
                        {"id": "s2", "label": "RESTful CRUD API", "type": "project", "url": "https://github.com/explore", "description": "Design and implement a full REST API with authentication and database integration"}
                    ]
                },
                {
                    "id": "portfolio", "name": "Portfolio Push", "emoji": "🚀", "duration": "Week 11-12",
                    "nodes": [
                        {"id": "p1", "label": "PostgreSQL & SQL", "type": "resource", "url": "https://www.postgresql.org/", "description": "Relational databases, schema design, and SQL queries for full-stack applications"},
                        {"id": "p2", "label": "Full-Stack SaaS App", "type": "project", "url": "https://github.com/explore", "description": "Deploy a complete full-stack application with auth, database, and live hosting"}
                    ]
                }
            ]
        }

    warning = "[WARNING: Mock Mode - Set GEMINI_API_KEY & SERPER_API_KEY for real-time pipeline]\n\n"
    return f"{warning}ROADMAP_START\n{json.dumps(roadmap, indent=2)}\nROADMAP_END"


async def generate_roadmap(user_data: dict) -> str:
    print("\n" + "="*60)
    print("ROADMAP GENERATION STARTED")
    print("="*60)
    print(f"Building search strategy for: {user_data}")

    if not os.environ.get("GEMINI_API_KEY") or not os.environ.get("SERPER_API_KEY"):
        print("[WARNING] Running in MOCK Mode: GEMINI_API_KEY or SERPER_API_KEY are missing.")
        return generate_mock_roadmap(user_data)

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

    print(f"Raw resources from Serper: {len(raw_results['resources'])}")
    print(f"Raw projects from Serper: {len(raw_results['projects'])}")

    print("Scraping content...")
    scraped_resources = await scrape_all(raw_results["resources"])
    scraped_projects = await scrape_all(raw_results["projects"])

    print("Validating URLs...")
    validated_resources = await validate_all(scraped_resources)
    validated_projects = await validate_all(scraped_projects)

    print(f"After validation - resources: {len(validated_resources)}, projects: {len(validated_projects)}")

    print("Ranking results...")
    top_resources = filter_results(validated_resources, top_n=8)
    top_projects = filter_results(validated_projects, top_n=4)

    print("\n=== URLS BEING SENT TO GEMINI ===")
    for r in top_resources:
        print(f"  - {r.get('url')}")
    for r in top_projects:
        print(f"  - {r.get('url')}")
    print("=================================\n")

    resource_context = format_for_prompt(top_resources, top_projects)

    print(f"Resource context being sent:\n{resource_context[:500]}")
    print(f"Final context: {len(top_resources)} resources, {len(top_projects)} projects")

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(resource_context=resource_context)
    user_prompt = (
        f"Generate my roadmap based on: Goal={user_data.get('goal')}, "
        f"Skill={user_data.get('skill')}, Interest={user_data.get('interest')}, "
        f"Hours/week={user_data.get('hours')}, Style={user_data.get('style')}"
    )

    print("\nGenerating roadmap with Gemini...")
    return generate_gemini_text(f"{system_prompt}\n\n{user_prompt}")


@app.post("/chat")
async def chat(request: ChatRequest):
    user_message_count = sum(1 for m in request.messages if m.role == "user")
    print(f"DEBUG: Received {user_message_count} user messages")

    # Mock mode: no API keys configured
    if not os.environ.get("GEMINI_API_KEY") or not os.environ.get("SERPER_API_KEY"):
        print("[WARNING] GEMINI_API_KEY or SERPER_API_KEY missing. Using local mock handler.")
        if user_message_count == 1:
            reply = "Got it! And what is your current skill level? (never coded, basics, intermediate, or experienced)"
        elif user_message_count == 2:
            reply = "Thanks! What specific area interests you most? (e.g. web dev, machine learning, mobile, DSA, cybersecurity)"
        elif user_message_count == 3:
            reply = "Understood. How many hours per week can you dedicate to this path?"
        elif user_message_count == 4:
            reply = "Great. And finally, do you prefer learning by building hands-on projects, or studying theory and concepts first?"
        elif user_message_count >= 5:
            user_messages = [m.content for m in request.messages if m.role == "user"]
            user_data = {
                "goal": user_messages[0],
                "skill": user_messages[1],
                "interest": user_messages[2],
                "hours": user_messages[3],
                "style": user_messages[4],
            }
            return {"response": generate_mock_roadmap(user_data)}
        else:
            reply = "What's your main goal with learning CS?"
        return {"response": "[WARNING: Running in Mock Mode] " + reply}

    # Force roadmap generation after 5 user messages
    if user_message_count >= 5:
        print(f"\n{'='*60}")
        print("FORCING roadmap generation (5 user messages detected)")
        print(f"{'='*60}\n")

        user_messages = [m.content for m in request.messages if m.role == "user"]
        print(f"User answers: {user_messages}")

        goal = "get a software engineering job"
        if "build" in user_messages[0].lower():
            goal = "build projects"
        elif "learn" in user_messages[0].lower():
            goal = "learn programming"

        skill = "basics"
        msg2 = user_messages[1].lower() if len(user_messages) > 1 else ""
        if "never" in msg2 or "no experience" in msg2:
            skill = "never coded"
        elif "intermediate" in msg2:
            skill = "intermediate"
        elif "advanced" in msg2 or "experienced" in msg2:
            skill = "advanced"

        interest = "web development"
        msg3 = user_messages[2].lower() if len(user_messages) > 2 else ""
        if "machine learning" in msg3 or "ml" in msg3 or "ai" in msg3:
            interest = "machine learning"
        elif "cyber" in msg3 or "security" in msg3:
            interest = "cybersecurity"
        elif "mobile" in msg3 or "app" in msg3:
            interest = "mobile development"
        elif "data" in msg3:
            interest = "data science"
        elif "backend" in msg3:
            interest = "backend development"
        elif "frontend" in msg3:
            interest = "frontend development"

        hours = "10 hours per week"
        msg4 = user_messages[3] if len(user_messages) > 3 else ""
        hours_match = re.search(r'(\d+)\s*hours?', msg4.lower())
        if hours_match:
            hours = f"{hours_match.group(1)} hours per week"

        style = "building projects"
        msg5 = user_messages[4].lower() if len(user_messages) > 4 else ""
        if "theory" in msg5 or "reading" in msg5 or "concept" in msg5:
            style = "theory first"

        user_data = {
            "goal": goal, "skill": skill, "interest": interest,
            "hours": hours, "style": style,
        }
        print(f"Extracted user data: {user_data}")
        return {"response": await generate_roadmap(user_data)}

    # Interview phase — ask questions via Gemini
    conversation = INTERVIEW_PROMPT + "\n\nConversation so far:\n"
    for m in request.messages:
        role = "User" if m.role == "user" else "Assistant"
        conversation += f"{role}: {m.content}\n"
    conversation += "\nAssistant:"

    print("\nGenerating interview response with Gemini...")
    reply = generate_gemini_text(conversation)
    print(f"Gemini raw reply: {reply[:200]}")

    if "INTERVIEW_COMPLETE" in reply:
        print("Interview complete detected, triggering pipeline...")
        user_data = parse_interview_complete(reply)
        if len(user_data) < 3:
            print(f"Warning: only parsed {len(user_data)} fields")
            return {"response": "Something went wrong collecting your answers. Let's try again — what's your main goal?"}
        return {"response": await generate_roadmap(user_data)}

    if "ROADMAP_START" in reply:
        print("WARNING: Gemini generated roadmap directly, bypassing pipeline")
        return {"response": "Let me restart — I need to ask you a few questions first. What's your main goal with learning CS?"}

    return {"response": reply}


@app.post("/generate")
async def generate(request: GenerateRequest):
    """Structured roadmap generation.

    Accepts the intake form directly (no chat conversation) and returns a roadmap
    matching the frontend contract (src/types/roadmap.ts): top-level
    nodes[]/edges[]. Mirrors generate_roadmap()'s pipeline but swaps synthesis for
    the new-schema synthesizer.
    """
    print("\n" + "=" * 60)
    print("STRUCTURED ROADMAP GENERATION (/generate)")
    print("=" * 60)
    print(f"Request: {request.model_dump()}")

    # Mock mode: no API keys configured — return a schema-valid sample roadmap.
    if not os.environ.get("GEMINI_API_KEY") or not os.environ.get("SERPER_API_KEY"):
        print("[WARNING] GEMINI_API_KEY or SERPER_API_KEY missing. Returning mock roadmap.")
        return mock_structured_roadmap(request)

    strategy = build_search_strategy(
        goal=request.goal,
        skill_input=request.level,
        interest=request.topic,
        hours_per_week=request.weekly,
        learning_style=request.focus,
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

    print("Synthesizing roadmap (nodes/edges schema)...")
    return synthesize_roadmap(resource_context, request, generate_gemini_text)


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
