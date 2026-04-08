import httpx
import asyncio
import json

async def test_pipeline():
    """Test the full PathFinder pipeline"""

    base_url = "http://localhost:8000"

    # Conversation flow
    conversation = [
        "I want to get a job as a software engineer",
        "I know the basics of programming",
        "I'm interested in web development",
        "I can dedicate 10 hours per week",
        "I prefer learning by building projects"
    ]

    messages = []

    async with httpx.AsyncClient(timeout=180.0) as client:
        for i, user_message in enumerate(conversation, 1):
            print(f"\n{'='*60}")
            print(f"Question {i}/5")
            print(f"{'='*60}")

            # Add user message
            messages.append({"role": "user", "content": user_message})

            # Send request
            response = await client.post(
                f"{base_url}/chat",
                json={"messages": messages}
            )

            if response.status_code != 200:
                print(f"ERROR: Status {response.status_code}")
                print(response.text)
                return

            data = response.json()
            assistant_reply = data["response"]

            print(f"You: {user_message}")
            print(f"\nPathfinder: {assistant_reply[:200]}...")

            # Add assistant response to conversation
            messages.append({"role": "assistant", "content": assistant_reply})

            # Check if interview complete
            if "INTERVIEW_COMPLETE" in assistant_reply or i == 5:
                print(f"\n{'='*60}")
                print("ROADMAP GENERATION STARTED")
                print(f"{'='*60}")
                print("\nCheck the backend terminal for DEBUG output!")
                print("\nFull roadmap:")
                print(assistant_reply)
                break

            await asyncio.sleep(1)

if __name__ == "__main__":
    print("Starting PathFinder Pipeline Test...")
    print("Make sure the backend is running on http://localhost:8000")
    print("\nThis will simulate a full user conversation and trigger roadmap generation.\n")

    asyncio.run(test_pipeline())
