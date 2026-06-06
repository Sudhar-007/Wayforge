"""
Roadmap synthesis stage.

Takes the ranked/scraped resource context produced by the pipeline and asks
Gemini to assemble it into a roadmap matching the frontend contract in
`src/types/roadmap.ts` / `mock-roadmap.json`:

    {
      "id": str,
      "title": str,
      "description": str,
      "nodes": [
        { "id", "title", "description",
          "type": "section_header" | "primary" | "secondary",
          "status": "not_started",
          "resources": [ { "label", "url", "type": "article"|"video"|"course"|"docs" } ] }
      ],
      "edges": [ { "id", "source", "target", "type": "required" | "optional" } ]
    }

The endpoint returns this object directly (no chat envelope).
"""

import json
import re
import uuid
from typing import Callable

from fastapi import HTTPException


NODE_TYPES = {"section_header", "primary", "secondary"}
STATUSES = {"not_started", "in_progress", "completed", "skipped"}
EDGE_TYPES = {"required", "optional"}
RESOURCE_TYPES = {"article", "video", "course", "docs"}


SYNTH_PROMPT_TEMPLATE = """You are Wayforge. Assemble a personalized learning roadmap as a directed acyclic graph (DAG), output as strict JSON.

LEARNER:
- Topic: {topic}
- Current level: {level}
- Weekly time: {weekly}
- End goal: {goal}
- Focus / notes: {focus}

{resource_context}

RULES:
1. Use ONLY URLs that appear in the resource database above — never invent URLs or names. If a node needs no resource, give it an empty "resources" array.
2. Organize the path into 3-5 SECTIONS. Each section is a node with "type": "section_header".
3. Under each section, add topic nodes: "type": "primary" for required/core topics, "type": "secondary" for optional or alternative topics.
4. Connect nodes with edges that express prerequisite order. "type": "required" for mandatory progression, "type": "optional" for side-quests / alternatives. The graph must be acyclic and connected (section -> its first topic, topic -> next topic, section -> next section).
5. Give every node a short "title" and a one-sentence "description" (Markdown allowed). Section headers may have an empty "resources" array.
6. Each resource object is {{ "label": short name, "url": exact URL from the database, "type": one of "article"|"video"|"course"|"docs" }}.
7. Use stable string ids: nodes "n1","n2",... and edges "e1","e2",... Every edge "source"/"target" MUST reference a node id you defined.
8. Output ONLY the JSON between the markers below — no prose before or after. Do NOT include a "status" field; it is added automatically.

ROADMAP_START
{{
  "title": "[roadmap title, e.g. '{topic} Roadmap']",
  "description": "[one sentence describing this path]",
  "nodes": [
    {{ "id": "n1", "title": "[Section name]", "description": "[what this section covers]", "type": "section_header", "resources": [] }},
    {{ "id": "n2", "title": "[Topic]", "description": "[one sentence]", "type": "primary", "resources": [ {{ "label": "[name]", "url": "[exact URL from database]", "type": "docs" }} ] }}
  ],
  "edges": [
    {{ "id": "e1", "source": "n1", "target": "n2", "type": "required" }}
  ]
}}
ROADMAP_END"""


def _extract_json(text: str) -> dict:
    """Pull the JSON object out of the model output (markers or bare braces)."""
    if "ROADMAP_START" in text and "ROADMAP_END" in text:
        start = text.index("ROADMAP_START") + len("ROADMAP_START")
        end = text.index("ROADMAP_END")
        candidate = text[start:end].strip()
    else:
        # Fall back to the outermost braces.
        match = re.search(r"\{.*\}", text, re.DOTALL)
        candidate = match.group(0) if match else text.strip()

    try:
        return json.loads(candidate)
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Synthesizer returned unparseable roadmap JSON: {e}",
        ) from e


def _coerce_resource(raw: dict) -> dict | None:
    if not isinstance(raw, dict):
        return None
    url = (raw.get("url") or "").strip()
    label = (raw.get("label") or "").strip()
    if not url or not label:
        return None
    rtype = raw.get("type")
    if rtype not in RESOURCE_TYPES:
        rtype = "article"
    return {"label": label, "url": url, "type": rtype}


def _normalize(data: dict) -> dict:
    """Validate and coerce the model output into the frontend Roadmap schema."""
    if not isinstance(data, dict):
        raise HTTPException(status_code=502, detail="Synthesizer output was not an object.")

    raw_nodes = data.get("nodes")
    raw_edges = data.get("edges")
    if not isinstance(raw_nodes, list) or not isinstance(raw_edges, list):
        raise HTTPException(
            status_code=502,
            detail="Synthesizer output missing nodes[]/edges[] arrays.",
        )

    nodes = []
    node_ids = set()
    for raw in raw_nodes:
        if not isinstance(raw, dict):
            continue
        node_id = str(raw.get("id") or f"n{len(nodes) + 1}")
        ntype = raw.get("type")
        if ntype not in NODE_TYPES:
            ntype = "primary"
        resources = [
            r
            for r in (_coerce_resource(x) for x in (raw.get("resources") or []))
            if r is not None
        ]
        nodes.append(
            {
                "id": node_id,
                "title": str(raw.get("title") or "Untitled"),
                "description": str(raw.get("description") or ""),
                "type": ntype,
                # Fresh roadmap — progress always starts clean.
                "status": "not_started",
                "resources": resources,
            }
        )
        node_ids.add(node_id)

    if not nodes:
        raise HTTPException(status_code=502, detail="Synthesizer produced no usable nodes.")

    edges = []
    for raw in raw_edges:
        if not isinstance(raw, dict):
            continue
        source = str(raw.get("source") or "")
        target = str(raw.get("target") or "")
        # Drop dangling edges referencing unknown nodes.
        if source not in node_ids or target not in node_ids:
            continue
        etype = raw.get("type")
        if etype not in EDGE_TYPES:
            etype = "required"
        edges.append(
            {
                "id": str(raw.get("id") or f"e{len(edges) + 1}"),
                "source": source,
                "target": target,
                "type": etype,
            }
        )

    return {
        "id": str(uuid.uuid4()),
        "title": str(data.get("title") or "Learning Roadmap"),
        "description": str(data.get("description") or ""),
        "nodes": nodes,
        "edges": edges,
    }


def synthesize_roadmap(
    resource_context: str,
    req,
    generate_text: Callable[[str], str],
) -> dict:
    """Build the synthesis prompt, call the LLM, parse + normalize to the schema."""
    prompt = SYNTH_PROMPT_TEMPLATE.format(
        resource_context=resource_context,
        topic=req.topic,
        level=req.level,
        weekly=req.weekly,
        goal=req.goal,
        focus=req.focus or "(none)",
    )
    raw = generate_text(prompt)
    return _normalize(_extract_json(raw))


def mock_structured_roadmap(req) -> dict:
    """Schema-valid roadmap for when GEMINI/SERPER keys are absent, so the frontend
    flow can be exercised end-to-end without external APIs."""
    topic = req.topic or "Your Topic"
    return {
        "id": str(uuid.uuid4()),
        "title": f"{topic} Roadmap",
        "description": (
            f"[Mock] A sample roadmap for {topic} — set GEMINI_API_KEY & "
            f"SERPER_API_KEY for the real AI-generated pipeline."
        ),
        "nodes": [
            {
                "id": "n1",
                "title": "Foundations",
                "description": f"Core groundwork for {topic}.",
                "type": "section_header",
                "status": "not_started",
                "resources": [],
            },
            {
                "id": "n2",
                "title": f"Intro to {topic}",
                "description": f"Get oriented with {topic} and why it matters for your goal: {req.goal or 'learning'}.",
                "type": "primary",
                "status": "not_started",
                "resources": [
                    {
                        "label": "MDN Web Docs",
                        "url": "https://developer.mozilla.org/",
                        "type": "docs",
                    }
                ],
            },
            {
                "id": "n3",
                "title": "Optional Deep Dive",
                "description": "A side-quest for the curious.",
                "type": "secondary",
                "status": "not_started",
                "resources": [],
            },
            {
                "id": "n4",
                "title": "Build a Project",
                "description": f"Apply your {topic} skills in a hands-on project.",
                "type": "primary",
                "status": "not_started",
                "resources": [],
            },
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2", "type": "required"},
            {"id": "e2", "source": "n2", "target": "n3", "type": "optional"},
            {"id": "e3", "source": "n2", "target": "n4", "type": "required"},
        ],
    }
