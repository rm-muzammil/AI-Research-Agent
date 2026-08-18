import Link from "next/link";
import { notFound } from "next/navigation";
import pool from "@/lib/db";
import { JobStatusBadge, ClaimBadge, ClaimLegend } from "@/components/Badges";
import { AgentTraceFull, PIPELINE_STAGES } from "@/components/AgentTrace";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const jobRes = await pool.query("SELECT * FROM research_jobs WHERE id = $1", [id]);
  if (jobRes.rows.length === 0) notFound();
  const job = jobRes.rows[0];

  const [agentOutputs, sources, claims, finalReport] = await Promise.all([
    pool.query(
      "SELECT agent_name, model_used, latency_ms, cost_estimate, created_at FROM agent_outputs WHERE job_id = $1 ORDER BY created_at ASC",
      [id]
    ),
    pool.query(
      "SELECT title, url, content_summary, relevance_score FROM sources WHERE job_id = $1 ORDER BY relevance_score DESC NULLS LAST",
      [id]
    ),
    pool.query("SELECT claim_text, status FROM claims WHERE job_id = $1", [id]),
    pool.query(
      "SELECT executive_summary, full_report, citations, recommended_actions FROM final_reports WHERE job_id = $1 ORDER BY generated_at DESC LIMIT 1",
      [id]
    ),
  ]);

  const outputByAgent = new Map(agentOutputs.rows.map((r) => [r.agent_name, r]));
  const stages = PIPELINE_STAGES.map((s) => {
    const o = outputByAgent.get(s.key);
    return { ...s, done: Boolean(o), latencyMs: o?.latency_ms ?? null };
  });

  const report = finalReport.rows[0];
  const caveats = report?.full_report?.caveats;
  const reportSections = Object.entries(report?.full_report ?? {}).filter(
    ([key]) => key !== "caveats"
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/dashboard" className="mono text-xs underline" style={{ color: "var(--ink-soft)" }}>
        ← Case Log
      </Link>

      <div className="flex items-start justify-between gap-4 mt-4 mb-1">
        <h1 className="text-xl font-semibold leading-snug">{job.user_query}</h1>
        <JobStatusBadge status={job.status} />
      </div>
      <p className="mono text-xs mb-10" style={{ color: "var(--ink-faint)" }}>
        {new Date(job.created_at).toLocaleString()} · case {job.id.slice(0, 8)}
      </p>

      <section className="mb-12">
        <p className="eyebrow mb-4">Agent trace</p>
        <AgentTraceFull stages={stages} />
      </section>

      {claims.rows.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-3">
            <p className="eyebrow">Evidence ledger · {claims.rows.length} claims reviewed</p>
          </div>
          <ClaimLegend />
          <ul className="mt-4 space-y-2.5">
            {claims.rows.map((c, i) => (
              <li key={i} className="text-sm flex items-start gap-2.5">
                <ClaimBadge status={c.status} />
                <span style={{ color: "var(--ink-soft)" }}>{c.claim_text}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report ? (
        <section className="space-y-8 mb-12">
          <p className="eyebrow">Briefing</p>

          <div>
            <p className="mono text-[11px] uppercase tracking-wide mb-2" style={{ color: "var(--ink-faint)" }}>
              Executive Summary
            </p>
            <p className="text-sm leading-relaxed">{report.executive_summary}</p>
          </div>

          {reportSections.map(([key, value]) => (
            <div key={key}>
              <p className="mono text-[11px] uppercase tracking-wide mb-2" style={{ color: "var(--ink-faint)" }}>
                {key.replace(/_/g, " ")}
              </p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{value as string}</p>
            </div>
          ))}

          {caveats && (
            <div
              className="rounded-md border px-4 py-3"
              style={{ borderColor: "var(--signal-disputed-bg)", background: "var(--signal-disputed-bg)" }}
            >
              <p className="mono text-[11px] uppercase tracking-wide mb-1" style={{ color: "var(--signal-disputed)" }}>
                Flagged by Fact Checker
              </p>
              <p className="text-sm leading-relaxed">{caveats}</p>
            </div>
          )}

          {report.recommended_actions?.length > 0 && (
            <div>
              <p className="mono text-[11px] uppercase tracking-wide mb-2" style={{ color: "var(--ink-faint)" }}>
                Recommended Actions
              </p>
              <ul className="space-y-1.5">
                {report.recommended_actions.map((a: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span
                      className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-sm"
                      style={{ background: "var(--accent)" }}
                    />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.citations?.length > 0 && (
            <div>
              <p className="mono text-[11px] uppercase tracking-wide mb-2" style={{ color: "var(--ink-faint)" }}>
                Citations
              </p>
              <ol className="space-y-1.5">
                {report.citations.map((c: { index: number; title: string; url: string }) => (
                  <li key={c.index} className="text-sm flex gap-2">
                    <span className="mono shrink-0" style={{ color: "var(--ink-faint)" }}>
                      [{c.index}]
                    </span>
                    <a href={c.url} target="_blank" rel="noopener noreferrer" className="underline">
                      {c.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      ) : (
        <p className="text-sm mb-12" style={{ color: "var(--ink-faint)" }}>
          Report not yet generated.
        </p>
      )}

      {sources.rows.length > 0 && (
        <section>
          <p className="eyebrow mb-3">Sources consulted · {sources.rows.length}</p>
          <ul className="space-y-2">
            {sources.rows.map((s, i) => (
              <li key={i} className="text-sm">
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">
                  {s.title}
                </a>
                {s.relevance_score != null && (
                  <span className="mono text-xs ml-2" style={{ color: "var(--ink-faint)" }}>
                    relevance {Number(s.relevance_score).toFixed(2)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}