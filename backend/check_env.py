"""
Environment Check Script
Verifies all required services and API keys are configured
"""
import os
import httpx
import asyncio

async def check_environment():
    """Check if all required services are running and configured"""

    print("="*60)
    print("PATHFINDER ENVIRONMENT CHECK")
    print("="*60 + "\n")

    all_good = True

    # 1. Check SERPER_API_KEY
    print("1. Checking SERPER_API_KEY...")
    serper_key = os.environ.get("SERPER_API_KEY")
    if serper_key:
        print(f"   ✅ Found: {serper_key[:10]}...")
    else:
        print("   ❌ NOT FOUND")
        print("   Set it with:")
        print("      Windows: set SERPER_API_KEY=your-key-here")
        print("      Linux/Mac: export SERPER_API_KEY='your-key-here'")
        all_good = False

    # 2. Check Ollama
    print("\n2. Checking Ollama (http://localhost:11434)...")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://localhost:11434/api/tags")
            if response.status_code == 200:
                models = response.json().get("models", [])
                print(f"   ✅ Ollama is running")
                print(f"   Models available: {len(models)}")

                # Check for llama3.1:8b
                has_llama = any(m.get("name") == "llama3.1:8b" for m in models)
                if has_llama:
                    print("   ✅ llama3.1:8b model found")
                else:
                    print("   ⚠️  llama3.1:8b not found")
                    print("   Run: ollama pull llama3.1:8b")
                    all_good = False
            else:
                print(f"   ❌ Unexpected status: {response.status_code}")
                all_good = False
    except Exception as e:
        print(f"   ❌ Cannot connect to Ollama: {e}")
        print("   Start it with: ollama serve")
        all_good = False

    # 3. Check Backend
    print("\n3. Checking Backend (http://localhost:8000)...")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://localhost:8000/health")
            if response.status_code == 200:
                print("   ✅ Backend is running")
            else:
                print(f"   ❌ Unexpected status: {response.status_code}")
                all_good = False
    except Exception as e:
        print(f"   ❌ Cannot connect to backend: {e}")
        print("   Start it with: python main.py")
        all_good = False

    # Final verdict
    print("\n" + "="*60)
    if all_good:
        print("✅ ALL CHECKS PASSED - Ready to test!")
        print("\nRun: python test_full_pipeline.py")
    else:
        print("❌ SOME CHECKS FAILED - Fix the issues above")
    print("="*60 + "\n")

if __name__ == "__main__":
    asyncio.run(check_environment())
