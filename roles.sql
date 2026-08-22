-- Run this once against your Neon database, after schema.sql/init.sql.
-- Industry-standard split: the app that writes and the app that reads
-- the public dashboard should never share credentials.

-- ── n8n: read + write, but only on app tables, no DDL rights ──────
CREATE ROLE n8n_app WITH LOGIN PASSWORD 'R91A8IzVCmBqjatSU69K+OFs6viaw2GM';
GRANT USAGE ON SCHEMA public TO n8n_app;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO n8n_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO n8n_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO n8n_app;

-- ── Frontend dashboard: read-only, nothing else ───────────────────
CREATE ROLE dashboard_reader WITH LOGIN PASSWORD 'R91A8IzVCmBqjatSU69K+OFs6viaw2GM';
GRANT USAGE ON SCHEMA public TO dashboard_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO dashboard_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO dashboard_reader;

-- Verify:
-- \du   -- lists roles
-- SET ROLE dashboard_reader; INSERT INTO research_jobs (user_query) VALUES ('test');
-- ^ this should fail with a permission error. If it succeeds, the grants are wrong.

-- ── Rate limiting: caps public submissions per IP ─────────────────
CREATE TABLE IF NOT EXISTS rate_limit_log (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address  TEXT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_time ON rate_limit_log(ip_address, created_at);

GRANT SELECT, INSERT ON rate_limit_log TO n8n_app;