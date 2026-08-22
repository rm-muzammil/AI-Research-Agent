# AI Research Agent

A 5-agent research pipeline that turns a question into an evidence-checked briefing — not just an LLM's confident-sounding answer, but one where every claim has been scored for how well the evidence actually supports it.

**Live demo:** [ai-research-agent-plum.vercel.app](https://ai-research-agent-plum.vercel.app)

> Ask something like *"Which AI specialization should I choose to work in Germany by 2028?"* and watch five agents research it, cross-check it, and write it up — with a color-coded ledger showing exactly which claims are verified, disputed, unverifiable, or single-sourced.

---

## Why this exists

Most LLM-wrapper projects are a single prompt with a nice UI. This one isn't. The interesting engineering problem here is **evidence integrity**: an LLM will confidently state things with no source behind them, and a single "ask and format" pipeline has no way to catch that. This project adds a dedicated Fact Checker agent that audits every claim the Researcher surfaces, and an Analyst that has to work within those verification boundaries — so the final report can actually say *"this specific claim is unverifiable"* instead of quietly asserting it as fact.

## Architecture

```
Next.js UI  →  n8n webhook  →  ┌─────────┐   ┌────────────┐   ┌──────────────┐   ┌─────────┐   ┌─────────────┐
                                │ Router  │ → │ Researcher │ → │ Fact Checker │ → │ Analyst │ → │ Synthesizer │
                                └─────────┘   └────────────┘   └──────────────┘   └─────────┘   └─────────────┘
                                                     ↓                 ↓                              ↓
                                              sources table     claims table              final_reports table
                                                                                                      ↓
                                                                          Next.js dashboard ← Postgres (read-only role)
```

- **Router** breaks the question into 4–6 sub-questions.
- **Researcher** finds 2–3 sources per sub-question in a single batched call (not one call per sub-question — see *Design decisions* below).
- **Fact Checker** extracts the concrete claims made across all the research and classifies each one: `verified` (2+ independent sources agree), `disputed` (sources conflict), `unverifiable` (no real support), or `unverified` (single source only).
- **Analyst** builds the comparison/trends/tradeoffs using the fact-checked claims, explicitly instructed to flag disputed or unverifiable material as caveats rather than presenting it as settled.
- **Synthesizer** writes the final report, folding the Analyst's comparison and any caveats into a structured briefing with citations.

Every agent call is logged to `agent_outputs` with model, latency, and (soon) token cost — so the dashboard's Agent Trace isn't a fake progress bar, it's reading real execution data.

## Stack

| Layer | Technology |
|---|---|
| Orchestration | n8n (self-hosted, Docker) |
| LLM | Gemini API |
| Database | PostgreSQL (Neon in production) |
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind |
| Hosting | Railway (n8n) · Vercel (frontend) · Neon (Postgres) |

## Features

- **Evidence Ledger** — every claim in a report is traceable to a verification status, not just presented as fact.
- **Agent Trace** — a real-time-derived pipeline view showing which of the 5 agents ran, and how long each took.
- **Case Log dashboard** — browse every research job ever run, click into any one for the full trace, claims, sources, and report.
- **Rate limiting** — the public webhook caps submissions per IP (protects the LLM API budget from abuse).
- **Least-privilege database access** — the frontend dashboard connects with a read-only Postgres role; only the n8n backend can write.

## Design decisions worth knowing about

- **Batched Researcher calls, not fan-out.** The original design called Gemini once per sub-question. In production this blew through the free-tier rate limit almost immediately. Rebuilt to send all sub-questions in a single Researcher call — same output, a third of the API calls.
- **SQL built in Code nodes, not n8n's native query-parameter field.** n8n's Postgres node has a long-standing bug where parameter values containing commas (which every JSON payload has) break its comma-separated parameter parsing. Every write instead goes through a Code node that builds a fully-escaped SQL string, sidestepping the bug entirely.
- **Retry-on-fail on every Gemini call.** LLM APIs return transient `503`s under load. Each of the 5 agent calls retries automatically (3 attempts, 8s backoff) rather than failing the whole pipeline on a blip.

## Project structure

```
├── docker-compose.yml        # local dev stack: n8n + Postgres
├── init.sql                  # database schema
├── roles.sql                 # production least-privilege DB roles + rate limit table
├── n8n-workflows/
│   ├── phase1-workflow.json      # Router → Researcher → Synthesizer (early version)
│   └── production-workflow.json  # full 5-agent pipeline + rate limiting + retries
├── prompts/                  # the actual agent prompts, versioned separately for iteration
├── frontend/                 # Next.js app: submission page + dashboard
├── scripts/                  # local dev helpers
└── docs/
```

## Running it locally

```bash
cp .env.example .env   # add your GEMINI_API_KEY
docker compose up -d
```

Open `http://localhost:5678`, import `n8n-workflows/production-workflow.json`, set the Postgres credential on each node, activate.

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

## What's next

- Populate `agent_outputs.cost_estimate` using Gemini's `usageMetadata` token counts for real per-run cost tracking.
- Move from synchronous request/response to fire-and-poll for the submission flow, so long pipeline runs aren't vulnerable to proxy timeouts.

---

Built as part of a portfolio project targeting AI/ML engineering roles in Germany.