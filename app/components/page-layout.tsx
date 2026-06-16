import type { ReactNode } from 'react';
import { SiteHeader, SiteFooter } from './site-chrome';

export function PageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-col gap-3">
      <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-coral">
        {eyebrow}
      </span>
      <h2 className="font-display text-balance text-4xl font-semibold leading-[1.05] text-ink md:text-5xl">
        {title}
      </h2>
      {children && <p className="max-w-2xl text-pretty text-base text-muted-foreground">{children}</p>}
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone: Record<string, string> = {
    "In Force": "bg-ocean-deep text-paper",
    "Phased": "bg-coral text-accent-foreground",
    "Proposed": "border border-ink/30 bg-paper text-ink",
    "Repealed": "bg-ink/10 text-ink/60 line-through",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] ${tone[status] ?? "bg-muted"}`}>
      {status}
    </span>
  );
}

export function ThemeTag({ theme }: { theme: string }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-ink/15 bg-paper px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/75">
      {theme}
    </span>
  );
}
