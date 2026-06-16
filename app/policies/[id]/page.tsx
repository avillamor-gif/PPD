import Link from 'next/link';
import { COUNTRIES, POLICIES, THEMES } from '@/app/data/policies';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Calendar, Building2, Globe, MessageCircle, ThumbsUp, Eye } from 'lucide-react';
import { CommentForm } from '@/app/components/CommentForm';
import { CommentsList } from '@/app/components/CommentsList';

const themeColors: Record<string, string> = {
  "Plastic Ban": "bg-coral/20 text-coral border-coral/30",
  "EPR": "bg-ocean/20 text-ocean border-ocean/30",
  "Waste Management": "bg-sand text-ink border-sand/50",
  "Circular Economy": "bg-ocean-deep/20 text-ocean-deep border-ocean-deep/30",
};

const statusColors: Record<string, { bg: string; badge: string }> = {
  "In Force": { bg: "bg-ocean/10", badge: "bg-ocean text-white" },
  "Proposed": { bg: "bg-coral/10", badge: "bg-coral text-white" },
  "Phased": { bg: "bg-sand/10", badge: "bg-sand text-ink" },
  "Repealed": { bg: "bg-ink/5", badge: "bg-ink/20 text-ink/60" },
};

export const metadata = {
  title: "Policy Details — Plastic Policy Database",
  description: "View detailed information about plastic policy regulations.",
};

export default async function PolicyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Find policy
  const policy = POLICIES.find((p) => p.id === id);
  const country = policy ? COUNTRIES.find((c) => c.code === policy.country) : null;

  if (!policy || !country) {
    return (
      <div className="w-full">
        <div className="mx-auto max-w-350 px-6 py-20 lg:px-10 text-center">
          <h1 className="text-2xl font-bold text-ink">Policy not found</h1>
          <Link href="/search" className="mt-4 inline-block text-coral hover:underline">
            ← Back to search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header Navigation */}
      <div className="border-b border-rule bg-paper">
        <div className="mx-auto max-w-350 px-6 py-4 lg:px-10">
          <Link 
            href="/search" 
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60 hover:text-coral transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to search
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className={`border-b border-rule ${statusColors[policy.status].bg}`}>
        <div className="mx-auto max-w-350 px-6 py-12 lg:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
            {/* Left: Title and Key Info */}
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[policy.status].badge}`}>
                  {policy.status}
                </span>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${themeColors[policy.category]}`}>
                  {policy.category}
                </span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-ink leading-tight">
                  {policy.title}
                </h1>
              </div>
              <p className="text-lg text-ink/70 max-w-2xl">
                {policy.summary}
              </p>
            </div>

            {/* Right: Quick Stats */}
            <div className="space-y-3">
              <div className="rounded-xl border border-ink/10 bg-white/50 p-4 space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink/60 font-mono">Policy Type</p>
                  <p className="text-lg font-semibold text-ink mt-1">{policy.instrument}</p>
                </div>
                <div className="border-t border-ink/10 pt-3">
                  <p className="text-xs uppercase tracking-wider text-ink/60 font-mono">Level</p>
                  <p className="text-lg font-semibold text-ink mt-1">{policy.level}</p>
                </div>
                <div className="border-t border-ink/10 pt-3">
                  <p className="text-xs uppercase tracking-wider text-ink/60 font-mono">Year</p>
                  <p className="text-lg font-semibold text-ink mt-1">{policy.year}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section>
        <div className="mx-auto max-w-350 px-6 py-12 lg:px-10 grid gap-8 lg:grid-cols-3">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Overview Card */}
            <div className="rounded-xl border border-ink/10 bg-white p-6 space-y-4">
              <h2 className="text-xl font-bold text-ink flex items-center gap-2">
                <Globe className="w-5 h-5 text-coral" />
                Overview
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-ink/60 uppercase tracking-wider font-mono">Country</p>
                  <p className="text-base text-ink font-semibold mt-1">{country.name}</p>
                </div>
                <div>
                  <p className="text-sm text-ink/60 uppercase tracking-wider font-mono">Region</p>
                  <p className="text-base text-ink font-semibold mt-1">{country.region}</p>
                </div>
                <div>
                  <p className="text-sm text-ink/60 uppercase tracking-wider font-mono">Language</p>
                  <p className="text-base text-ink font-semibold mt-1">{policy.language}</p>
                </div>
              </div>
            </div>

            {/* Authority Card */}
            <div className="rounded-xl border border-ink/10 bg-white p-6 space-y-4">
              <h2 className="text-xl font-bold text-ink flex items-center gap-2">
                <Building2 className="w-5 h-5 text-ocean" />
                Implementing Authority
              </h2>
              <div>
                <p className="text-base text-ink font-semibold">{policy.authority}</p>
              </div>
              {policy.link && (
                <a 
                  href={policy.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ocean/10 text-ocean hover:bg-ocean/20 transition font-medium text-sm"
                >
                  <Globe className="w-4 h-4" />
                  Official Website
                </a>
              )}
            </div>

            {/* Implementation Timeline Card */}
            <div className="rounded-xl border border-ink/10 bg-white p-6 space-y-4">
              <h2 className="text-xl font-bold text-ink flex items-center gap-2">
                <Calendar className="w-5 h-5 text-coral" />
                Implementation Status
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-coral to-coral/50 flex items-center justify-center">
                    <span className="text-white font-bold">{policy.year}</span>
                  </div>
                  <div>
                    <p className="text-sm text-ink/60 font-mono">Enacted/Proposed</p>
                    <p className="font-semibold text-ink">{policy.year}</p>
                  </div>
                </div>
                <div className="mt-4 p-4 rounded-lg bg-ink/5 border-l-4 border-coral">
                  <p className="text-sm text-ink/70">
                    Status: <span className="font-semibold text-ink">{policy.status}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Community Discussion Card */}
            <div className="rounded-xl border border-coral/20 bg-white p-6 space-y-6">
              <h2 className="text-xl font-bold text-ink flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-coral" />
                Community Discussion
              </h2>

              {/* Comment Form */}
              <CommentForm policyId={policy.id} />

              {/* Comments List */}
              <div className="border-t border-ink/10 pt-6">
                <h3 className="font-bold text-ink mb-4">Comments ({/* count */})</h3>
                <CommentsList policyId={policy.id} />
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Share Card */}
            <div className="rounded-xl border border-ink/10 bg-white p-6 space-y-3">
              <h3 className="font-bold text-ink text-sm uppercase tracking-wider">Share</h3>
              <div className="flex gap-2">
                <button className="flex-1 py-2 px-3 rounded-lg bg-ocean text-white text-sm font-semibold hover:bg-ocean/90 transition">Twitter</button>
                <button className="flex-1 py-2 px-3 rounded-lg bg-ink text-white text-sm font-semibold hover:bg-ink/90 transition">Copy</button>
              </div>
            </div>

            {/* Engagement Card */}
            <div className="rounded-xl border border-ink/10 bg-white p-6 space-y-4">
              <h3 className="font-bold text-ink text-sm uppercase tracking-wider">Engagement</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-coral/10 text-coral hover:bg-coral/20 transition font-semibold">
                  <ThumbsUp className="w-4 h-4" />
                  Helpful (0)
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-ink/60 border-t border-ink/10 pt-3">
                <Eye className="w-4 h-4" />
                <span>0 views</span>
              </div>
            </div>

            {/* Metadata Card */}
            <div className="rounded-xl border border-ink/10 bg-white p-6 space-y-3">
              <h3 className="font-bold text-ink text-sm uppercase tracking-wider">Metadata</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-ink/60">ID</p>
                  <p className="text-ink font-mono text-xs">{policy.id}</p>
                </div>
                <div>
                  <p className="text-ink/60">Category</p>
                  <p className="text-ink font-semibold">{policy.category}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Policies Section */}
      <section className="border-t border-rule bg-paper">
        <div className="mx-auto max-w-350 px-6 py-12 lg:px-10">
          <h2 className="text-2xl font-bold text-ink mb-8">Related Policies</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {POLICIES.filter((p) => p.country === policy.country && p.id !== policy.id).slice(0, 3).map((relatedPolicy) => (
              <Link 
                key={relatedPolicy.id}
                href={`/policies/${relatedPolicy.id}`}
                className="group rounded-xl border border-ink/10 bg-white p-6 hover:border-coral hover:shadow-lg transition space-y-3"
              >
                <div className="flex items-start justify-between">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${themeColors[relatedPolicy.category]}`}>
                    {relatedPolicy.category}
                  </span>
                  <span className="text-xs font-bold text-ink/40 group-hover:text-coral transition">{relatedPolicy.year}</span>
                </div>
                <h3 className="font-bold text-ink group-hover:text-coral transition line-clamp-2">
                  {relatedPolicy.title}
                </h3>
                <p className="text-sm text-ink/60 line-clamp-2">{relatedPolicy.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
