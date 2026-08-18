#!/usr/bin/env python3
"""
AI Research Agent - Database Helper
Quick commands to inspect the research database.
"""

import psycopg2
import json
import sys
from tabulate import tabulate

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "ai_research",
    "user": "research_user",
    "password": "research_pass"
}

def get_connection():
    return psycopg2.connect(**DB_CONFIG)

def list_jobs():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, user_query, status, created_at, completed_at 
        FROM research_jobs 
        ORDER BY created_at DESC 
        LIMIT 10
    """)
    rows = cur.fetchall()
    print(tabulate(rows, headers=["ID", "Query", "Status", "Created", "Completed"], tablefmt="grid"))
    conn.close()

def show_job(job_id):
    conn = get_connection()
    cur = conn.cursor()

    # Job details
    cur.execute("SELECT * FROM research_jobs WHERE id = %s", (job_id,))
    job = cur.fetchone()
    if not job:
        print(f"Job {job_id} not found")
        return

    print("\n📋 JOB DETAILS")
    print("-" * 50)
    print(f"Query: {job[1]}")
    print(f"Status: {job[2]}")
    print(f"Created: {job[3]}")

    # Agent outputs
    cur.execute("SELECT agent_name, model_used, created_at FROM agent_outputs WHERE job_id = %s", (job_id,))
    outputs = cur.fetchall()
    if outputs:
        print("\n🤖 AGENT OUTPUTS")
        print(tabulate(outputs, headers=["Agent", "Model", "Time"], tablefmt="grid"))

    # Sources
    cur.execute("SELECT url, title, relevance_score FROM sources WHERE job_id = %s", (job_id,))
    sources = cur.fetchall()
    if sources:
        print("\n📚 SOURCES")
        print(tabulate(sources, headers=["URL", "Title", "Relevance"], tablefmt="grid"))

    # Claims
    cur.execute("SELECT claim_text, status, checked_by FROM claims WHERE job_id = %s", (job_id,))
    claims = cur.fetchall()
    if claims:
        print("\n✅ CLAIMS")
        print(tabulate(claims, headers=["Claim", "Status", "Checked By"], tablefmt="grid"))

    conn.close()

def show_report(job_id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT full_report FROM final_reports WHERE job_id = %s", (job_id,))
    result = cur.fetchone()
    conn.close()

    if result:
        report = result[0]
        print(json.dumps(report, indent=2))
    else:
        print("No report found for this job.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python db_helper.py <command> [args]")
        print("\nCommands:")
        print("  list              - List recent research jobs")
        print("  show <job_id>     - Show job details")
        print("  report <job_id>   - Show final report")
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "list":
        list_jobs()
    elif cmd == "show" and len(sys.argv) > 2:
        show_job(sys.argv[2])
    elif cmd == "report" and len(sys.argv) > 2:
        show_report(sys.argv[2])
    else:
        print("Unknown command or missing arguments")
