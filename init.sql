-- ═══════════════════════════════════════════════════════════
-- AI Research Agent - PostgreSQL Schema
-- ═══════════════════════════════════════════════════════════

-- ── Core Tables ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS research_jobs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_query      TEXT NOT NULL,
    status          VARCHAR(20) DEFAULT 'pending' 
                    CHECK (status IN ('pending','researching','analyzing','fact_checking','synthesizing','completed','failed')),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at    TIMESTAMP,
    final_report_id UUID,
    metadata        JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS agent_outputs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID NOT NULL REFERENCES research_jobs(id) ON DELETE CASCADE,
    agent_name      VARCHAR(50) NOT NULL 
                    CHECK (agent_name IN ('router','researcher','analyst','fact_checker','synthesizer')),
    input_context   JSONB,
    output_data     JSONB NOT NULL,
    model_used      VARCHAR(50),
    cost_estimate   DECIMAL(10,6) DEFAULT 0,
    latency_ms      INTEGER,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sources (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID NOT NULL REFERENCES research_jobs(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    title           TEXT,
    content_raw     TEXT,
    content_summary TEXT,
    relevance_score DECIMAL(3,2),
    agent_source    VARCHAR(20) DEFAULT 'researcher',
    fetched_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, url)
);

CREATE TABLE IF NOT EXISTS claims (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID NOT NULL REFERENCES research_jobs(id) ON DELETE CASCADE,
    agent_name      VARCHAR(50) NOT NULL,
    claim_text      TEXT NOT NULL,
    claim_type      VARCHAR(30) DEFAULT 'fact',
    status          VARCHAR(20) DEFAULT 'unverified'
                    CHECK (status IN ('unverified','verified','disputed','unverifiable')),
    evidence        JSONB DEFAULT '[]',
    checked_at      TIMESTAMP,
    checked_by      VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS final_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID NOT NULL REFERENCES research_jobs(id) ON DELETE CASCADE,
    executive_summary TEXT,
    full_report     JSONB NOT NULL,
    citations       JSONB DEFAULT '[]',
    recommended_actions JSONB DEFAULT '[]',
    generated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Cache Tables ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS web_cache (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url             TEXT NOT NULL UNIQUE,
    content         TEXT,
    content_hash    VARCHAR(64),
    fetched_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP + INTERVAL '7 days'
);

CREATE TABLE IF NOT EXISTS embedding_cache (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text_hash       VARCHAR(64) NOT NULL UNIQUE,
    text_content    TEXT NOT NULL,
    embedding       vector(768),  -- requires pgvector extension
    model_name      VARCHAR(50),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── Indexes ────────────────────────────────────────────────

CREATE INDEX idx_jobs_status ON research_jobs(status);
CREATE INDEX idx_jobs_created ON research_jobs(created_at);
CREATE INDEX idx_outputs_job ON agent_outputs(job_id);
CREATE INDEX idx_outputs_agent ON agent_outputs(agent_name);
CREATE INDEX idx_sources_job ON sources(job_id);
CREATE INDEX idx_claims_job ON claims(job_id);
CREATE INDEX idx_web_cache_url ON web_cache(url);
CREATE INDEX idx_web_cache_expires ON web_cache(expires_at);

-- ── Helper Functions ───────────────────────────────────────

CREATE OR REPLACE FUNCTION get_job_context(p_job_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'job', row_to_json(j),
        'sources', COALESCE((
            SELECT jsonb_agg(row_to_json(s))
            FROM sources s WHERE s.job_id = p_job_id
        ), '[]'::jsonb),
        'claims', COALESCE((
            SELECT jsonb_agg(row_to_json(c))
            FROM claims c WHERE c.job_id = p_job_id
        ), '[]'::jsonb),
        'agent_outputs', COALESCE((
            SELECT jsonb_agg(row_to_json(a))
            FROM agent_outputs a WHERE a.job_id = p_job_id
        ), '[]'::jsonb)
    ) INTO v_result
    FROM research_jobs j
    WHERE j.id = p_job_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ── Sample Data (for testing) ──────────────────────────────

-- INSERT INTO research_jobs (user_query, status) 
-- VALUES ('What are the best AI engineering specializations for Germany by 2028?', 'pending');
