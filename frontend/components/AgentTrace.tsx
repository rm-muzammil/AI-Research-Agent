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

const GRID_CLASSES = "grid grid-cols-2 gap-3 sm:grid-cols-5";

/** Full pipeline trace — the page's signature element on the job detail view.
 *  The connector row uses the SAME grid template as the card row below it,
 *  so dots and connectors always land in the same columns as their cards
 *  regardless of label wrapping or card height — no absolute positioning. */
export function AgentTraceFull({
  stages,
  running = false,
}: {
  stages: AgentStage[];
  running?: boolean;
}) {
  return (
    <div>
      <div className={`${GRID_CLASSES} mb-2`} aria-hidden>
        {stages.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <span
              className={`block h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                s.done ? "border-[var(--accent)] bg-[var(--accent)]" : ""
              }`}
              style={
                !s.done
                  ? { borderColor: "var(--line-strong)", background: "var(--paper)" }
                  : undefined
              }
            />
            {i < stages.length - 1 && (
              <span
                className="ml-1 block h-px flex-1 relative overflow-hidden"
                style={{ background: s.done ? "var(--accent)" : "var(--line)" }}
              >
                {running && !s.done && (
                  <span
                    className="trace-sweep absolute inset-y-0 left-0 w-1/2"
                    style={{ background: "var(--accent)" }}
                  />
                )}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className={GRID_CLASSES}>
        {stages.map((s) => (
          <div
            key={s.key}
            className="w-full rounded-md border px-3 py-2"
            style={{
              borderColor: s.done ? "var(--accent-line)" : "var(--line)",
              background: s.done ? "var(--accent-soft)" : "var(--paper-raised)",
            }}
          >
            <p
              className="mono text-[11px] uppercase tracking-wide"
              style={{ color: s.done ? "var(--accent)" : "var(--ink-faint)" }}
            >
              {s.label}
            </p>
            <p className="mono text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>
              {s.done ? (s.latencyMs != null ? `${s.latencyMs}ms` : "done") : "pending"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}