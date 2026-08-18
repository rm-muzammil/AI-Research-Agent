# 🤖 AI Research Agent — $0 Architecture

> A production-grade, multi-agent research system built with **n8n**, **Ollama** (local AI), **Gemini** (free tier), and **PostgreSQL**. Designed for portfolio demonstration and real-world research tasks.

---

## 🏗️ Architecture Overview

```
User Research Question
         │
         ▼
┌─────────────────┐
│  n8n            │
│  Orchestrator   │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
 Router    Web Search
 (Ollama)  (Serper.dev)
    │         │
    └────┬────┘
         ▼
┌─────────────────────────┐
│  Parallel Agent Dispatch │
│  (Sub-workflows)         │
└───────────┬─────────────┘
            │
    ┌───────┼───────┐
    ▼       ▼       ▼
Researcher Analyst  Fact Checker
(Ollama)  (Gemini)  (Ollama)
    │       │       │
    └───────┼───────┘
            ▼
    ┌──────────────┐
    │  PostgreSQL  │  ← Shared state & cache
    │  (Memory)    │
    └──────┬───────┘
           ▼
    ┌──────────────┐
    │ Synthesizer  │  ← Gemini Flash (1 call)
    │ (Gemini)     │
    └──────┬───────┘
           ▼
    Final Report + Citations
```

**Cost Strategy:**
- **Ollama (local)**: Routing, extraction, fact-checking, content classification → **$0**
- **Gemini Flash (free tier)**: Complex reasoning, trend analysis, final synthesis → **$0** (1,500 req/day)
- **Serper.dev**: Web search → **$0** (1,000 searches/month)
- **PostgreSQL**: State management, caching, audit trail → **$0** (self-hosted)

---

## 📁 Project Structure

```
ai-research-agent/
├── docker-compose.yml          # Infrastructure: n8n, Postgres, Ollama, pgAdmin
├── init.sql                    # Database schema + functions
├── .env.example                # Template for environment variables
├── setup.sh                    # One-command Ubuntu/WSL2 setup
├── README.md                   # This file
│
├── prompts/                    # Agent system prompts
│   ├── router.txt
│   ├── researcher.txt
│   ├── analyst.txt
│   ├── fact_checker.txt
│   └── synthesizer.txt
│
├── n8n-workflows/              # Importable n8n workflows
│   ├── master-orchestrator.json
│   ├── agent-researcher.json
│   └── agent-fact-checker.json
│
├── scripts/                    # Helper utilities
│   ├── test_client.py          # Submit research queries
│   └── db_helper.py            # Inspect database state
│
└── docs/                       # Documentation (you add this)
```

---

## 🚀 Quick Start (Step-by-Step)

### Step 0: Prerequisites

You need:
- **Windows 11** with **WSL2** and **Ubuntu** installed
- **Docker Desktop** (WSL2 backend enabled) OR Docker Engine inside WSL2
- At least **8GB RAM** (16GB recommended for Ollama models)
- **~10GB free disk space** (for Docker images + Ollama models)

Verify WSL2:
```bash
wsl --list --verbose
# Should show Ubuntu with VERSION 2
```

### Step 1: Clone & Enter the Project

```bash
# In Ubuntu WSL2
cd ~
git init ai-research-agent
cd ai-research-agent

# Copy all project files here (from this repo)
# Or create them manually following this guide
```

### Step 2: Get Free API Keys

**A. Gemini API Key** (for complex reasoning)
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key

**B. Serper.dev API Key** (for web search)
1. Go to [Serper.dev](https://serper.dev)
2. Sign up (free tier = 1,000 searches/month)
3. Copy your API key from the dashboard

### Step 3: Configure Environment

```bash
# Copy the template
cp .env.example .env

# Edit with your keys
nano .env
```

Fill in:
```env
GEMINI_API_KEY=your_actual_gemini_key_here
SERPER_API_KEY=your_actual_serper_key_here
```

### Step 4: Run the Automated Setup

```bash
chmod +x setup.sh
bash setup.sh
```

This script will:
1. ✅ Check/install Docker & Docker Compose
2. ✅ Create your `.env` file
3. ✅ Start PostgreSQL, n8n, and Ollama containers
4. ✅ Pull Ollama models (`phi4`, `llama3.1:8b`, `nomic-embed-text`)
5. ✅ Verify all services are healthy

**⏱️ This takes 10-20 minutes** (mostly downloading models).

### Step 5: Verify Everything is Running

```bash
# Check containers
docker-compose ps

# Check Ollama models
curl http://localhost:11434/api/tags

# Check n8n health
curl http://localhost:5678/healthz

# Check PostgreSQL
docker exec ai_research_db pg_isready -U research_user
```

All should report **healthy/running**.

### Step 6: Open n8n & Import Workflows

1. Open browser → `http://localhost:5678`
2. Login: `admin` / `admin123`
3. Go to **Workflows** → **Import from File**
4. Import in this order:
   - `n8n-workflows/agent-researcher.json`
   - `n8n-workflows/agent-fact-checker.json`
   - `n8n-workflows/master-orchestrator.json`

### Step 7: Configure n8n Credentials

In n8n, go to **Settings** → **Credentials**:

1. **Ollama**: 
   - Base URL: `http://ollama:11434`
   - Model: `phi4` (or `llama3.1:8b`)

2. **Google Gemini (PaLM)**:
   - API Key: your Gemini key
   - Model: `gemini-1.5-flash`

3. **PostgreSQL**:
   - Host: `postgres`
   - Port: `5432`
   - Database: `ai_research`
   - User: `research_user`
   - Password: `research_pass`

### Step 8: Test Your First Research Query

```bash
# Install Python dependencies (if needed)
pip install requests tabulate psycopg2-binary

# Run a test query
python scripts/test_client.py "What are the best AI engineering specializations for Germany by 2028?"
```

Or trigger directly via curl:
```bash
curl -X POST http://localhost:5678/webhook/research \
  -H "Content-Type: application/json" \
  -d '{"query": "Your research question here"}'
```

### Step 9: Monitor in Real-Time

```bash
# Watch database state
python scripts/db_helper.py list

# View specific job
python scripts/db_helper.py show <job-id-from-list>

# View final report
python scripts/db_helper.py report <job-id>
```

Also open **pgAdmin** at `http://localhost:5050` (admin@local.com / admin123) to browse tables visually.

---

## 🧠 How It Works

### 1. Query Reception
- User sends POST to n8n webhook with research question
- n8n creates a `research_jobs` record in PostgreSQL

### 2. Routing (Ollama — phi4)
- The **Router Agent** classifies the query
- Determines which agents to activate
- Generates search keywords
- **Cost: $0** (local model)

### 3. Web Search (Serper.dev — free tier)
- Searches Google via Serper API
- Stores raw results in `sources` table
- **Cost: $0** (1,000 free/month)

### 4. Parallel Agent Execution

**Researcher Agent** (Ollama — llama3.1:8b)
- Scrapes web pages from search results
- Extracts structured facts, entities, quotes
- Stores findings in `agent_outputs`
- **Cost: $0** (local model)

**Analyst Agent** (Gemini — Flash)
- Reads researcher findings
- Performs trend analysis, comparative scoring
- Identifies risks and opportunities
- Stores analysis in `agent_outputs`
- **Cost: ~$0** (1 of ~5 Gemini calls per job)

**Fact Checker Agent** (Ollama — llama3.1:8b)
- Reads all claims from Researcher + Analyst
- Cross-references with source material
- Updates `claims` table with verification status
- **Cost: $0** (local model)

### 5. Synthesis (Gemini — Flash)
- Reads all verified outputs from PostgreSQL
- Generates executive summary, recommendations, roadmap
- Formats citations with source links
- Stores final report
- **Cost: ~$0** (1 Gemini call per job)

### 6. Response
- Returns structured JSON report to user
- Saves everything in database for audit/reuse

---

## 💰 Cost Breakdown

| Component | Service | Free Tier | Your Usage |
|-----------|---------|-----------|------------|
| Orchestration | n8n (self-hosted) | Unlimited | **$0** |
| Local AI | Ollama | Unlimited | **$0** |
| Cloud AI | Gemini Flash | 1,500 req/day | **$0** |
| Web Search | Serper.dev | 1,000/mo | **$0** |
| Database | PostgreSQL (self-hosted) | Unlimited | **$0** |
| **TOTAL** | | | **$0/month** |

> ⚠️ If you exceed Serper's 1,000 searches, you can switch to Brave Search API (2,000 free) or use DuckDuckGo scraping (unlimited but less reliable).

---

## 🔧 Customization

### Change Ollama Models

Edit `setup.sh` and change the model list:
```bash
MODELS=("phi4" "llama3.1:8b" "nomic-embed-text")
# Or use smaller models for faster inference:
# MODELS=("phi3" "gemma2:2b" "nomic-embed-text")
```

Then re-pull:
```bash
docker exec ai_research_ollama ollama pull your-model-name
```

### Add More Agents

1. Create a new prompt in `prompts/`
2. Create a new sub-workflow in `n8n-workflows/`
3. Add it to the parallel dispatch in the master orchestrator

### Change Search Provider

In the master orchestrator, replace the Serper HTTP node with:
- **Brave Search**: `https://api.search.brave.com/res/v1/web/search`
- **DuckDuckGo**: Use a Python script node

### Enable GPU Acceleration (WSL2)

If you have an NVIDIA GPU:
1. Install [NVIDIA CUDA on WSL2](https://docs.nvidia.com/cuda/wsl-user-guide/)
2. Uncomment the `deploy` section in `docker-compose.yml` for the Ollama service
3. Restart: `docker-compose up -d ollama`

---

## 🐛 Troubleshooting

### "Cannot connect to Docker daemon"
```bash
sudo usermod -aG docker $USER
# Logout and login again, or:
newgrp docker
```

### Ollama models are slow
- **Without GPU**: Expect 5-15 seconds per token on CPU
- **Solution**: Use smaller models (`phi3`, `gemma2:2b`) or enable GPU

### "Gemini API quota exceeded"
- Free tier: 1,500 requests/day for Flash
- Check usage at [Google AI Studio](https://aistudio.google.com/app/apikey)
- **Solution**: The system is designed to use only ~5 Gemini calls per research job. If you hit limits, add rate limiting in n8n or use Ollama for more tasks.

### n8n workflows show "Connection Error"
- Make sure credential names match exactly in workflow nodes
- Check that PostgreSQL credentials use `postgres` (container name) not `localhost`
- Verify Ollama URL is `http://ollama:11434` (internal Docker network)

### "No such file or directory" for init.sql
```bash
# Make sure init.sql is in the same directory as docker-compose.yml
ls -la init.sql
# If not, copy it:
cp /path/to/init.sql ./
# Then restart Postgres:
docker-compose restart postgres
```

---

## 📊 Portfolio Value

This project demonstrates:

| Skill | Evidence |
|-------|----------|
| **Agent Architecture** | Multi-agent orchestration with specialized roles |
| **Workflow Automation** | n8n for complex business logic |
| **Local AI Deployment** | Ollama + model selection for cost optimization |
| **API Integration** | Gemini, Serper, PostgreSQL |
| **Database Design** | Schema for state management, caching, audit trails |
| **Cost Engineering** | Tiered model usage ($0 operational cost) |
| **Validation & QA** | Dedicated fact-checking agent with source grounding |
| **Structured Outputs** | JSON schemas for agent-to-agent communication |
| **Containerization** | Docker Compose for reproducible infrastructure |

---

## 📝 License

MIT — Use this for your portfolio, job applications, or personal projects.

---

## 🙋 Next Steps

1. **Run your first query** and verify the output
2. **Customize prompts** for your domain (e.g., medical research, legal analysis)
3. **Add a frontend** (Streamlit, Next.js) to make it interactive
4. **Add RAG** — use `nomic-embed-text` to embed sources and retrieve relevant chunks
5. **Deploy** — put it on a $5 VPS (Hetzner, DigitalOcean) for 24/7 access

**Questions?** Check the n8n community forum or Ollama Discord for model-specific help.
