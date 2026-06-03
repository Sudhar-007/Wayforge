"""
Environment Check Script
Verifies all required API keys and services are configured
"""
import os
import httpx
import asyncio
from dotenv import load_dotenv

load_dotenv()

async def check_environment():
    print("="*60)
    print("PATHFINDER ENVIRONMENT CHECK")
    print("="*60 + "\n")

    all_good = True

    # 1. Check GEMINI_API_KEY
    print("1. Checking GEMINI_API_KEY...")
    gemini_key = os.environ.get("GEMINI_API_KEY")
    if gemini_key:
        print(f"   [OK] Found: {gemini_key[:10]}...")
    else:
        print("   [FAIL] NOT FOUND")
        print("   Set it with:")
        print("      Add it to backend/.env  (GEMINI_API_KEY=your-key-here)")
        print("      Windows: set GEMINI_API_KEY=your-key-here")
        print("      Linux/Mac: export GEMINI_API_KEY='your-key-here'")
        all_good = False

    # 2. Check SERPER_API_KEY
    print("\n2. Checking SERPER_API_KEY...")
    serper_key = os.environ.get("SERPER_API_KEY")
    if serper_key:
        print(f"   [OK] Found: {serper_key[:10]}...")
    else:
        print("   [FAIL] NOT FOUND")
        print("   Set it with:")
        print("      Add it to backend/.env  (SERPER_API_KEY=your-key-here)")
        print("      Windows: set SERPER_API_KEY=your-key-here")
        print("      Linux/Mac: export SERPER_API_KEY='your-key-here'")
        all_good = False

    # 3. Check Backend
    print("\n3. Checking Backend (http://localhost:8000)...")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get("http://localhost:8000/health")
            if response.status_code == 200:
                print("   [OK] Backend is running")
            else:
                print(f"   [FAIL] Unexpected status: {response.status_code}")
                all_good = False
    except Exception as e:
        print(f"   [FAIL] Cannot connect to backend: {e}")
        print("   Start it with: python main.py")
        all_good = False

    # Final verdict
    print("\n" + "="*60)
    if all_good:
        print("[OK] ALL CHECKS PASSED - Ready to test!")
        print("\nRun: python test_full_pipeline.py")
    else:
        print("[FAIL] SOME CHECKS FAILED - Fix the issues above")
        if not gemini_key or not serper_key:
            print("\nTip: Copy backend/.env.example to backend/.env and fill in your keys.")
    print("="*60 + "\n")

if __name__ == "__main__":
    asyncio.run(check_environment())
