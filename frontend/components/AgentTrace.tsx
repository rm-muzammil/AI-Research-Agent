export type AgentStage = {
  key: string;
  label: string;
  done: boolean;
  latencyMs?: number | null;
};

export const PIPELINE_STAGES: { key: string; label: string }[] = [
  { key: "router", label: "Router" },
  { key: "researcher", label: "Researcher" },
  { key: "fact_checker", label: "Fact Checker" },
  { key: "analyst", label: "Analyst" },
  { key: "synthesizer", label: "Synthesizer" },
];

/** Compact 5-tick trace for list rows. */
export function AgentTraceMini({ stages }: { stages: AgentStage[] }) {
  return (
    <div className="flex items-center gap-1" aria-label="Agent pipeline progress">
      {stages.map((s, i) => (
        <div key={s.key} className="flex items-center gap-1">
          <span
            className={`block h-2 w-2 rounded-full ${
              s.done ? "bg-[var(--accent)]" : "bg-[var(--line-strong)]"
            }`}
            title={`${s.label}: ${s.done ? "done" : "pending"}`}
          />
          {i < stages.length - 1 && (
            <span className="block h-px w-3" style={{ background: "var(--line-strong)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

/** Full pipeline trace — the page's signature element on the job detail view. */
export function AgentTraceFull({
  stages,
  running = false,
}: {
  stages: AgentStage[];
  running?: boolean;
}) {
  return (
    <div className="relative">
      <div
        className="absolute left-0 right-0 top-[27px] h-px overflow-hidden"
        style={{ background: "var(--line)" }}
        aria-hidden
      >
        {running && (
          <div
            className="trace-sweep h-full w-1/4"
            style={{ background: "var(--accent)" }}
          />
        )}
      </div>
      <div className="relative grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stages.map((s) => (
          <div key={s.key} className="flex flex-col items-start">
            <span
              className={`mb-2 block h-3.5 w-3.5 rounded-full border-2 ${
                s.done ? "border-[var(--accent)] bg-[var(--accent)]" : ""
              }`}
              style={!s.done ? { borderColor: "var(--line-strong)", background: "var(--paper)" } : undefined}
              aria-hidden
            />
            <div
              className="w-full rounded-md border px-3 py-2"
              style={{
                borderColor: s.done ? "var(--accent-line)" : "var(--line)",
                background: s.done ? "var(--accent-soft)" : "var(--paper-raised)",
              }}
            >
              <p className="mono text-[11px] uppercase tracking-wide" style={{ color: s.done ? "var(--accent)" : "var(--ink-faint)" }}>
                {s.label}
              </p>
              <p className="mono text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>
                {s.done ? (s.latencyMs != null ? `${s.latencyMs}ms` : "done") : "pending"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}