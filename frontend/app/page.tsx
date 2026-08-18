"use client";

import Link from "next/link";
import { useState } from "react";
import { AgentTraceFull, PIPELINE_STAGES } from "@/components/AgentTrace";

const N8N_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ??
  "http://localhost:5678/webhook/research";

type ResearchResult = {
  job_id: string;
  status: string;
  executive_summary: string;
  full_report: Record<string, string>;
  citations: { index: number; title: string; url: string }[];
  recommended_actions: string[];
};

const SAMPLE_QUERY = "Which AI specialization should I choose to work in Germany by 2028?";

export default function Home() {
  const [userQuery, setUserQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userQuery.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_query: userQuery }),
      });

      if (!res.ok) {
        throw new Error(`Workflow failed with status ${res.status}`);
      }

      const data: ResearchResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const caveats = result?.full_report?.caveats;
  const reportSections = Object.entries(result?.full_report ?? {}).filter(
    ([key]) => key !== "caveats"
  );

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between mb-3">
        <span className="eyebrow">Multi-agent research system</span>
        <Link href="/dashboard" className="mono text-xs underline" style={{ color: "var(--ink-soft)" }}>
          Case Log →
        </Link>
      </div>

      <h1 className="text-3xl font-semibold tracking-tight mb-2">AI Research Agent</h1>
      <p className="text-sm mb-6" style={{ color: "var(--ink-soft)" }}>
        Ask a question. Five agents research, cross-check, and write the briefing —
        every claim is scored for evidence before it reaches the report.
      </p>

      <div className="mb-8">
        <AgentTraceFull stages={PIPELINE_STAGES.map((s) => ({ ...s, done: false }))} running={loading} />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div
          className="rounded-lg border p-1 transition-colors focus-within:border-[var(--accent)]"
          style={{ borderColor: "var(--line)", background: "var(--paper-raised)" }}
        >
          <textarea
            className="mono w-full resize-none bg-transparent p-3 text-sm outline-none"
            style={{ color: "var(--ink)" }}
            rows={3}
            placeholder={`> ${SAMPLE_QUERY}`}
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mono self-start rounded-md px-4 py-2 text-xs uppercase tracking-wide text-white disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {loading ? "Running pipeline…" : "Run Analysis"}
        </button>
        {loading && (
          <p className="mono text-xs" style={{ color: "var(--ink-faint)" }}>
            Typically 30–90s — five sequential model calls, each one checked before the next runs.
          </p>
        )}
      </form>

      {error && (
        <p className="mt-6 text-sm" style={{ color: "var(--signal-unverifiable)" }}>
          {error}
        </p>
      )}

      {result && (
        <article className="mt-10 space-y-8">
          <div className="flex items-center justify-between border-t pt-6" style={{ borderColor: "var(--line)" }}>
            <span className="eyebrow">Briefing complete</span>
            <Link
              href={`/dashboard/${result.job_id}`}
              className="mono text-xs underline"
              style={{ color: "var(--accent)" }}
            >
              View full trace →
            </Link>
          </div>

          <section>
            <p className="eyebrow mb-2">Executive Summary</p>
            <p className="text-sm leading-relaxed">{result.executive_summary}</p>
          </section>

          {reportSections.map(([key, value]) => (
            <section key={key}>
              <p className="eyebrow mb-2">{key.replace(/_/g, " ")}</p>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{value}</p>
            </section>
          ))}

          {caveats && (
            <section
              className="rounded-md border px-4 py-3"
              style={{ borderColor: "var(--signal-disputed-bg)", background: "var(--signal-disputed-bg)" }}
            >
              <p className="mono text-[11px] uppercase tracking-wide mb-1" style={{ color: "var(--signal-disputed)" }}>
                Flagged by Fact Checker
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink)" }}>
                {caveats}
              </p>
            </section>
          )}

          {result.recommended_actions?.length > 0 && (
            <section>
              <p className="eyebrow mb-2">Recommended Actions</p>
              <ul className="space-y-1.5">
                {result.recommended_actions.map((a, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span
                      className="mt-1.5 block h-1.5 w-1.5 shrink-0 rounded-sm"
                      style={{ background: "var(--accent)" }}
                    />
                    {a}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.citations?.length > 0 && (
            <section>
              <p className="eyebrow mb-2">Citations</p>
              <ol className="space-y-1.5">
                {result.citations.map((c) => (
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
            </section>
          )}
        </article>
      )}
    </main>
  );
}