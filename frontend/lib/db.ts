import { Pool } from "pg";

// Reuse the pool across hot reloads in dev so we don't open a new
// connection pool on every file change.
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

const pool =
  global._pgPool ??
  new Pool({
    host: process.env.POSTGRES_HOST ?? "localhost",
    port: Number(process.env.POSTGRES_PORT ?? 5433),
    user: process.env.POSTGRES_USER ?? "research_user",
    password: process.env.POSTGRES_PASSWORD ?? "research_pass",
    database: process.env.POSTGRES_DB ?? "ai_research",
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  global._pgPool = pool;
}

export default pool;