import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper">
      {/* Admin Header */}
      <div className="border-b border-rule bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-ink">Admin Panel</h1>
              <p className="mt-1 text-sm text-ink/60">Manage policies and view analytics</p>
            </div>
            <Link
              href="/"
              className="font-mono text-sm uppercase tracking-widest text-ocean hover:text-ocean-deep transition"
            >
              ← Back to Site
            </Link>
          </div>
        </div>
      </div>

      {/* Admin Navigation */}
      <div className="border-b border-rule bg-paper sticky top-0 z-40 overflow-x-auto">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <nav className="flex gap-8 min-w-min">
            <Link
              href="/admin"
              className="py-4 border-b-2 border-transparent hover:border-ocean transition font-mono text-sm uppercase tracking-widest text-ink/60 hover:text-ink whitespace-nowrap"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/users"
              className="py-4 border-b-2 border-transparent hover:border-ocean transition font-mono text-sm uppercase tracking-widest text-ink/60 hover:text-ink whitespace-nowrap"
            >
              Users
            </Link>
            <Link
              href="/admin/moderation"
              className="py-4 border-b-2 border-transparent hover:border-ocean transition font-mono text-sm uppercase tracking-widest text-ink/60 hover:text-ink whitespace-nowrap"
            >
              Moderation
            </Link>
            <Link
              href="/admin/submit"
              className="py-4 border-b-2 border-transparent hover:border-ocean transition font-mono text-sm uppercase tracking-widest text-ink/60 hover:text-ink whitespace-nowrap"
            >
              Submit Entry
            </Link>
            <Link
              href="/admin/manage"
              className="py-4 border-b-2 border-transparent hover:border-ocean transition font-mono text-sm uppercase tracking-widest text-ink/60 hover:text-ink whitespace-nowrap"
            >
              Manage Entries
            </Link>
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
