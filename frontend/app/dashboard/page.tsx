import Link from "next/link";
import pool from "@/lib/db";
import { JobStatusBadge } from "@/components/Badges";
import { AgentTraceMini, PIPELINE_STAGES } from "@/components/AgentTrace";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { rows: jobs } = await pool.query(`
    SELECT
      j.id,
      j.user_query,
      j.status,
      j.created_at,
      j.completed_at,
      COALESCE(ARRAY_AGG(DISTINCT ao.agent_name) FILTER (WHERE ao.agent_name IS NOT NULL), '{}') AS agents_done
    FROM research_jobs j
    LEFT JOIN agent_outputs ao ON ao.job_id = j.id
    GROUP BY j.id
    ORDER BY j.created_at DESC
    LIMIT 20;
  `);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between mb-1">
        <span className="eyebrow">Case log</span>
        <Link
          href="/"
          className="mono text-xs px-3 py-1.5 rounded-md text-white"
          style={{ background: "var(--accent)" }}
        >
          + New Research
        </Link>
      </div>
      <h1 className="text-2xl font-semibold tracking-tight mb-8">Research Jobs</h1>

      <div
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: "var(--line)", background: "var(--paper-raised)" }}
      >
        {jobs.map((j, idx) => {
          const done: string[] = j.agents_done ?? [];
          const stages = PIPELINE_STAGES.map((s) => ({ ...s, done: done.includes(s.key) }));
          const railColor =
            j.status === "completed"
              ? "var(--signal-verified)"
              : j.status === "failed"
              ? "var(--signal-unverifiable)"
              : "var(--accent)";

          return (
            <Link
              key={j.id}
              href={`/dashboard/${j.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-black/[0.02] transition-colors"
              style={{
                borderTop: idx === 0 ? "none" : `1px solid var(--line)`,
                borderLeft: `3px solid ${railColor}`,
              }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate" style={{ color: "var(--ink-soft)" }}>{j.user_query}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="mono text-xs" style={{ color: "var(--ink-faint)" }}>
                    {new Date(j.created_at).toLocaleString()}
                  </span>
                  <AgentTraceMini stages={stages} />
                </div>
              </div>
              <JobStatusBadge status={j.status} />
            </Link>
          );
        })}

        {jobs.length === 0 && (
          <div className="px-5 py-10 text-center">
            <p className="text-sm mb-2" style={{ color: "var(--ink-soft)" }}>
              No cases yet.
            </p>
            <Link href="/" className="mono text-xs underline" style={{ color: "var(--accent)" }}>
              Submit your first research question →
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}