const JOB_STATUS_STYLES: Record<string, { fg: string; bg: string }> = {
  completed: { fg: "var(--signal-verified)", bg: "var(--signal-verified-bg)" },
  failed: { fg: "var(--signal-unverifiable)", bg: "var(--signal-unverifiable-bg)" },
  pending: { fg: "var(--signal-unverified)", bg: "var(--signal-unverified-bg)" },
  researching: { fg: "var(--accent)", bg: "var(--accent-soft)" },
  analyzing: { fg: "var(--accent)", bg: "var(--accent-soft)" },
  fact_checking: { fg: "var(--accent)", bg: "var(--accent-soft)" },
  synthesizing: { fg: "var(--accent)", bg: "var(--accent-soft)" },
};

export function JobStatusBadge({ status }: { status: string }) {
  const s = JOB_STATUS_STYLES[status] ?? JOB_STATUS_STYLES.pending;
  return (
    <span
      className="mono text-[10px] uppercase tracking-wide px-2 py-1 rounded-full whitespace-nowrap"
      style={{ color: s.fg, background: s.bg }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

const CLAIM_STATUS_STYLES: Record<string, { fg: string; bg: string }> = {
  verified: { fg: "var(--signal-verified)", bg: "var(--signal-verified-bg)" },
  disputed: { fg: "var(--signal-disputed)", bg: "var(--signal-disputed-bg)" },
  unverifiable: { fg: "var(--signal-unverifiable)", bg: "var(--signal-unverifiable-bg)" },
  unverified: { fg: "var(--signal-unverified)", bg: "var(--signal-unverified-bg)" },
};

export function ClaimBadge({ status }: { status: string }) {
  const s = CLAIM_STATUS_STYLES[status] ?? CLAIM_STATUS_STYLES.unverified;
  return (
    <span
      className="mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 mt-0.5"
      style={{ color: s.fg, background: s.bg }}
    >
      {status}
    </span>
  );
}

export function ClaimLegend() {
  const items = [
    { status: "verified", label: "2+ sources agree" },
    { status: "disputed", label: "sources conflict" },
    { status: "unverifiable", label: "no supporting source" },
    { status: "unverified", label: "single source only" },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((it) => {
        const s = CLAIM_STATUS_STYLES[it.status];
        return (
          <div key={it.status} className="flex items-center gap-1.5">
            <span className="block h-2 w-2 rounded-full" style={{ background: s.fg }} />
            <span className="mono text-[11px]" style={{ color: "var(--ink-soft)" }}>
              {it.status} <span style={{ color: "var(--ink-faint)" }}>· {it.label}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}