"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/users', label: 'Users' },
    { href: '/admin/instrument-types', label: 'Instrument Types' },
    { href: '/admin/moderation', label: 'Moderation' },
    { href: '/admin/submit', label: 'Submit Entry' },
    { href: '/admin/manage', label: 'Manage Entries' },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Admin Header */}
      <div className="border-b border-rule bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-6 lg:px-10">
          <div className="flex flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="font-display text-2xl md:text-3xl font-bold text-ink">Admin Panel</h1>
              <p className="mt-1 text-xs md:text-sm text-ink/60">Manage policies and view analytics</p>
            </div>
            <div className="flex shrink-0 items-center gap-2 mt-1 md:mt-0">
              <Link
                href="/"
                className="font-mono text-xs md:text-sm uppercase tracking-widest text-ocean hover:text-ocean-deep transition whitespace-nowrap"
              >
                ← Back to Site
              </Link>
              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="inline-flex md:hidden items-center gap-2 rounded-full border border-ink/20 px-3 py-2 hover:bg-ink/5 transition"
                aria-label="Toggle admin menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="h-4 w-4 text-ink" /> : <Menu className="h-4 w-4 text-ink" />}
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink">Menu</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-b border-rule bg-paper md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ink/50">Admin Navigation</div>
            <nav className="grid gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-widest transition ${
                    isActive(item.href)
                      ? 'bg-sand text-coral border border-coral/20'
                      : 'text-ink/70 hover:bg-ink/5'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Admin Navigation */}
      <div className="hidden md:block border-b border-rule bg-paper sticky top-0 z-40 overflow-x-auto">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-10">
          <nav className="flex gap-4 md:gap-8 min-w-min">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`py-4 border-b-2 transition font-mono text-sm uppercase tracking-widest whitespace-nowrap ${
                  isActive(item.href)
                    ? 'border-ocean text-ink'
                    : 'border-transparent text-ink/60 hover:text-ink hover:border-ocean'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Admin Content */}
      <main className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        {children}
      </main>
    </div>
  );
}
