"""Manual integration test for the Pathfinder /chat pipeline.

Simulates a full 5-question interview against a running backend and prints the
generated roadmap. Works in both real mode (GEMINI_API_KEY + SERPER_API_KEY set)
and mock mode (keys absent — the backend returns a sample roadmap).

Prerequisites:
  1. Backend running on http://localhost:8000  (python main.py)
  2. For the real pipeline: GEMINI_API_KEY and SERPER_API_KEY set in backend/.env
     (without them the backend falls back to mock responses)

Run:  python test_pipeline.py
"""

import asyncio

import httpx

BASE_URL = "http://localhost:8000"

CONVERSATION = [
    "I want to get a job as a software engineer",
    "I know the basics of programming",
    "I'm interested in web development",
    "I can dedicate 10 hours per week",
    "I prefer learning by building projects",
]


async def test_pipeline():
    messages = []

    print("=" * 60)
    print("PATHFINDER /chat PIPELINE TEST")
    print("=" * 60)
    print("\nStarting interview phase...\n")

    async with httpx.AsyncClient(timeout=180.0) as client:
        for i, user_message in enumerate(CONVERSATION, 1):
            print(f"{'=' * 60}\nQuestion {i}/5\n{'=' * 60}")
            print(f"You: {user_message}")

            messages.append({"role": "user", "content": user_message})

            try:
                response = await client.post(
                    f"{BASE_URL}/chat", json={"messages": messages}
                )
            except httpx.ReadTimeout:
                print("ERROR: Request timed out — backend may still be processing.")
                return
            except httpx.ConnectError:
                print(f"ERROR: Could not connect to backend at {BASE_URL}.")
                print("Start it with: python main.py")
                return

            if response.status_code != 200:
                print(f"ERROR: Status {response.status_code}\n{response.text}")
                return

            reply = response.json()["response"]

            # The 5th message triggers roadmap generation.
            if i == 5 or "ROADMAP_START" in reply:
                print("\n" + "=" * 60)
                print("ROADMAP GENERATED")
                print("=" * 60)
                print("\nCheck the backend terminal for the pipeline DEBUG output.")
                print("\nFull roadmap:\n")
                print(reply)
                return

            preview = reply[:200] + ("..." if len(reply) > 200 else "")
            print(f"\nPathfinder: {preview}\n")
            messages.append({"role": "assistant", "content": reply})
            await asyncio.sleep(0.5)

    print("\nWARNING: Interview completed but no roadmap was generated.")


if __name__ == "__main__":
    print("\nPathfinder Pipeline Test")
    print("Make sure the backend is running on http://localhost:8000\n")
    asyncio.run(test_pipeline())
