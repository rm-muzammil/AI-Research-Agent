#!/usr/bin/env python3
"""
AI Research Agent - Test Client
Usage: python test_client.py "Your research question here"
"""

import sys
import requests
import json
import time

N8N_WEBHOOK = "http://localhost:5678/webhook/research"

def submit_query(query: str):
    """Submit a research query to the n8n orchestrator."""
    payload = {
        "query": query,
        "options": {
            "depth": "standard",
            "sources_min": 5,
            "fact_check": True
        }
    }

    print(f"🔍 Submitting query: {query}")
    print("-" * 50)

    try:
        response = requests.post(
            N8N_WEBHOOK,
            json=payload,
            timeout=300  # 5 minutes - research takes time
        )
        response.raise_for_status()

        result = response.json()
        print("✅ Research complete!")
        print("\n" + "=" * 50)
        print("RESULTS:")
        print("=" * 50)
        print(json.dumps(result, indent=2))

        # Save to file
        filename = f"research_result_{int(time.time())}.json"
        with open(filename, "w") as f:
            json.dump(result, f, indent=2)
        print(f"\n💾 Saved to: {filename}")

    except requests.exceptions.Timeout:
        print("⏱️  Request timed out. The research is still running in the background.")
        print("   Check n8n execution logs for results.")
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to n8n at {N8N_WEBHOOK}")
        print("   Make sure n8n is running: docker-compose up n8n")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_client.py <research question>")
        print("\nExample:")
        print('  python test_client.py "Best AI engineering specializations for Germany 2028"')
        sys.exit(1)

    query = " ".join(sys.argv[1:])
    submit_query(query)
