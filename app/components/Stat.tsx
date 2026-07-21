export function Stat({ n, label, accent }: { n: string; label: string; accent?: boolean }) {
  return (
    <div>
      <div className={`font-display text-5xl font-semibold leading-none tracking-tight ${accent ? "text-coral" : "text-ink"}`}>
        {n}
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
    </div>
  );
}
