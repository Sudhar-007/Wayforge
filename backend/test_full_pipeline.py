"""
Full Pipeline Test for PathFinder
This script tests the entire flow from interview to roadmap generation
"""
import httpx
import asyncio
import os

async def test_complete_flow():
    """Test the complete PathFinder pipeline"""

    # Check environment
    if not os.environ.get("SERPER_API_KEY"):
        print("⚠️  WARNING: SERPER_API_KEY not set!")
        print("Set it with: export SERPER_API_KEY='your-key-here'")
        print("Or on Windows: set SERPER_API_KEY=your-key-here")
        return

    base_url = "http://localhost:8000"

    # Test interview flow
    conversation = [
        "I want to get a job as a software engineer",
        "I know the basics of programming",
        "I'm interested in web development",
        "I can dedicate 10 hours per week",
        "I prefer learning by building projects"
    ]

    messages = []

    print("="*60)
    print("TESTING PATHFINDER PIPELINE")
    print("="*60)
    print("\nStarting interview phase...\n")

    async with httpx.AsyncClient(timeout=180.0) as client:
        for i, user_message in enumerate(conversation, 1):
            print(f"Question {i}/5")
            print(f"You: {user_message}")

            messages.append({"role": "user", "content": user_message})

            try:
                response = await client.post(
                    f"{base_url}/chat",
                    json={"messages": messages}
                )

                if response.status_code != 200:
                    print(f"❌ ERROR: Status {response.status_code}")
                    print(response.text)
                    return

                data = response.json()
                assistant_reply = data["response"]

                # Check if this is the final roadmap (triggered by 5th message)
                if i == 5 and "ROADMAP_START" in assistant_reply:
                    print(f"Pathfinder: [Generating roadmap using pipeline...]\n")
                    print("\n" + "="*60)
                    print("✅ PIPELINE TRIGGERED - Roadmap Generated!")
                    print("="*60)
                    print("\n🔍 CHECK THE BACKEND TERMINAL FOR DEBUG OUTPUT!")
                    print("\nYou should have seen:")
                    print("  ✅ 'FORCING roadmap generation (5 user messages detected)'")
                    print("  ✅ Raw resources from Serper: [some number]")
                    print("  ✅ Resources after validation: [some number]")
                    print("  ✅ URLs being sent to Ollama: [list of real URLs]")
                    print("\n" + "="*60)
                    print("FINAL ROADMAP:")
                    print("="*60)
                    print(assistant_reply)
                    print("\n" + "="*60)
                    print("SUCCESS! Pipeline completed successfully.")
                    print("="*60)
                    return

                # Show first 150 chars of response for questions 1-4
                preview = assistant_reply[:150] + ("..." if len(assistant_reply) > 150 else "")
                print(f"Pathfinder: {preview}\n")

                messages.append({"role": "assistant", "content": assistant_reply})
                await asyncio.sleep(0.5)

            except httpx.ReadTimeout:
                print("❌ Request timed out - backend might be processing")
                return
            except Exception as e:
                print(f"❌ Error: {e}")
                return

    print("\n⚠️  Interview completed but INTERVIEW_COMPLETE not triggered")
    print("The LLM may have generated a roadmap directly instead of triggering the pipeline")

if __name__ == "__main__":
    print("\n🚀 PathFinder Full Pipeline Test\n")
    print("Prerequisites:")
    print("1. Backend running on http://localhost:8000")
    print("2. Ollama running on http://localhost:11434")
    print("3. SERPER_API_KEY set in environment\n")

    asyncio.run(test_complete_flow())
