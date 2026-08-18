#!/bin/bash
# ═══════════════════════════════════════════════════════════
# AI Research Agent - Setup Script for Ubuntu/WSL2
# ═══════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 AI Research Agent - Setup${NC}"
echo "================================"

# ── Check prerequisites ────────────────────────────────────
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Installing...${NC}"
    sudo apt-get update
    sudo apt-get install -y ca-certificates curl gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✅ Docker installed. You may need to logout/login.${NC}"
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker & Docker Compose available${NC}"

# ── Create .env from example ───────────────────────────────
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Created .env from template. Please edit it with your API keys!${NC}"
fi

# ── Start infrastructure ───────────────────────────────────
echo -e "${BLUE}Starting infrastructure containers...${NC}"
docker-compose up -d postgres n8n ollama

# ── Wait for Ollama ────────────────────────────────────────
echo -e "${YELLOW}Waiting for Ollama to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Ollama is ready${NC}"
        break
    fi
    sleep 2
    echo -n "."
done

# ── Pull Ollama models ─────────────────────────────────────
echo -e "${BLUE}Pulling Ollama models (this may take a while)...${NC}"

MODELS=("phi4" "llama3.1:8b" "nomic-embed-text")
for model in "${MODELS[@]}"; do
    echo -e "${YELLOW}Pulling $model...${NC}"
    docker exec ai_research_ollama ollama pull $model || echo -e "${RED}⚠️  Failed to pull $model${NC}"
done

echo -e "${GREEN}✅ Models pulled${NC}"

# ── Verify n8n ─────────────────────────────────────────────
echo -e "${YELLOW}Waiting for n8n to start...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5678/healthz > /dev/null 2>&1; then
        echo -e "${GREEN}✅ n8n is running at http://localhost:5678${NC}"
        break
    fi
    sleep 2
    echo -n "."
done

# ── Verify PostgreSQL ──────────────────────────────────────
echo -e "${YELLOW}Checking PostgreSQL...${NC}"
if docker exec ai_research_db pg_isready -U research_user > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
else
    echo -e "${RED}⚠️  PostgreSQL may need more time to initialize${NC}"
fi

# ── Summary ────────────────────────────────────────────────
echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo "================================"
echo -e "${BLUE}Services:${NC}"
echo "  • n8n:        http://localhost:5678"
echo "  • pgAdmin:    http://localhost:5050"
echo "  • Ollama API: http://localhost:11434"
echo "  • Postgres:   localhost:5432"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Edit .env with your API keys"
echo "  2. Open n8n at http://localhost:5678"
echo "  3. Import workflows from n8n-workflows/"
echo "  4. Run a test query!"
echo ""
echo -e "${YELLOW}Default credentials:${NC}"
echo "  n8n:    admin / admin123"
echo "  pgAdmin: admin@local.com / admin123"
