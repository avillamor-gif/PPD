import Link from 'next/link';
import { COUNTRIES } from '@/lib/constants';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, MapPin, Calendar, Building2, Globe, MessageCircle, ThumbsUp, Eye } from 'lucide-react';
import { PolicyForumSection } from '@/app/components/PolicyForumSection';
import { AdminEditButton } from '@/app/components/AdminEditButton';
import { PolicyImplementationStatus } from '@/app/components/PolicyImplementationStatus';
import { PolicyShareCard } from '@/app/components/PolicyShareCard';
import { PolicyEngagementCard } from '@/app/components/PolicyEngagementCard';
import { BookmarkButton } from '@/app/components/BookmarkButton';
import { supabaseAdmin } from '@/lib/supabase-admin';

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

export const dynamicParams = true; // Enable on-demand ISR for new policies
export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  try {
    // Fetch all policy slugs for static generation
    // Since we have dynamicParams = true, this generates common pages upfront
    // and remaining pages will be generated on-demand
    const { data: policies } = await supabaseAdmin
      .from('policies')
      .select('slug')
      .order('created_at', { ascending: false })
      .limit(500); // Generate first 500 most recent policies upfront

    return (policies || []).map((policy: { slug: string }) => ({
      id: policy.slug,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default async function PolicyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  console.log(`[POLICY PAGE] Received id parameter: "${id}" (length: ${id.length})`);
  
  // Fetch policy from Supabase using admin client
  // Try to find by slug first, then by id (for backwards compatibility)
  try {
    console.log(`[POLICY PAGE] Attempting to find policy with slug: "${id}"`);
    let { data: policy, error } = await supabaseAdmin
      .from('policies')
      .select()
      .eq('slug', id)
      .single();

    console.log(`[POLICY PAGE] Slug query result - Error: ${error?.message}, Found: ${!!policy}`);
    if (error || !policy) {
      console.log(`[POLICY PAGE] Slug not found, trying by id: "${id}"`);
      const result = await supabaseAdmin
        .from('policies')
        .select()
        .eq('id', id)
        .single();
      policy = result.data;
      error = result.error;
      console.log(`[POLICY PAGE] ID query result - Error: ${error?.message}, Found: ${!!policy}`);
    }

    if (error || !policy) {
      console.log(`[POLICY PAGE] Policy not found! Checking if it's an old slug...`);
      
      // Check if id matches any previous_slugs
      const { data: policyWithOldSlug } = await supabaseAdmin
        .from('policies')
        .select('slug')
        .contains('previous_slugs', [id])
        .limit(1)
        .single();

      if (policyWithOldSlug) {
        console.log(`[POLICY PAGE] Found policy with old slug. Redirecting to new slug: ${policyWithOldSlug.slug}`);
        redirect(`/policies/${policyWithOldSlug.slug}`);
      }

      console.log(`[POLICY PAGE] Policy not found! Returning 404`);
      return notFound();
    }

    // Fetch all policies for related policies section
    const { data: allPolicies = [] } = await supabaseAdmin
      .from('policies')
      .select()
      .eq('country', policy.country);

    const country = COUNTRIES.find((c) => c.code === policy?.country);

    if (!policy || !country) {
      return notFound();
    }

    // Filter related policies
    const relatedPolicies = (allPolicies || [])
      .filter((p: any) => p.id !== policy.id)
      .slice(0, 3);

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
                  <p className="text-xs uppercase tracking-wider text-ink/60 font-mono">Instrument Type</p>
                  <p className="text-lg font-semibold text-ink mt-1">{policy.category}</p>
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
              <BookmarkButton policyId={policy.id} className="w-full" />
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
              <div className="space-y-2">
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
                {policy.other_links && (
                  <div className="space-y-2">
                    {policy.other_links.split(',').map((url: string, index: number) => {
                      const trimmedUrl = url.trim();
                      if (!trimmedUrl) return null;
                      return (
                        <a
                          key={index}
                          href={trimmedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ocean/10 text-ocean hover:bg-ocean/20 transition font-medium text-sm"
                        >
                          <Globe className="w-4 h-4" />
                          Related Link
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Implementation Timeline Card */}
            <PolicyImplementationStatus 
              policyId={policy.id} 
              initialStatus={policy.status} 
              initialYear={policy.year}
              commencementDate={policy.commencement_date}
              summary={policy.summary}
            />

            {/* Community Discussion */}
            <PolicyForumSection policyId={policy.slug} />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Share Card */}
            <PolicyShareCard 
              title={policy.title}
              url={`https://ppd-pink.vercel.app/policies/${policy.slug}`}
            />

            {/* Engagement Card */}
            <PolicyEngagementCard policyId={policy.id} />

            {/* Metadata Card */}
            <div className="rounded-xl border border-ink/10 bg-white p-6 space-y-3">
              <h3 className="font-bold text-ink text-sm uppercase tracking-wider">Metadata</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-ink/60">ID</p>
                  <p className="text-ink font-mono text-xs">{policy.id}</p>
                </div>
                <div>
                  <p className="text-ink/60">Key Words</p>
                  {policy.keywords ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {policy.keywords.split(',').map((keyword: string, index: number) => (
                        <span 
                          key={index} 
                          className="inline-block px-2 py-1 rounded bg-ocean/10 text-ocean text-xs font-semibold"
                        >
                          {keyword.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-ink/40 italic">No keywords added</p>
                  )}
                </div>
              </div>
            </div>

            {/* Edit Policy Button */}
            {policy.id && (
              <div className="rounded-xl border border-ink/10 bg-white p-6">
                <AdminEditButton policyId={policy.id} />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Policies Section */}
      <section className="border-t border-rule bg-paper">
        <div className="mx-auto max-w-350 px-6 py-12 lg:px-10">
          <h2 className="text-2xl font-bold text-ink mb-8">Related Policies</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {relatedPolicies.map((relatedPolicy: any) => (
              <Link 
                key={relatedPolicy?.id}
                href={`/policies/${relatedPolicy?.slug}`}
                className="group rounded-xl border border-ink/10 bg-white p-6 hover:border-coral hover:shadow-lg transition space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[relatedPolicy?.status].badge}`}>
                    {relatedPolicy?.status}
                  </span>
                  <span className="text-xs font-bold text-ink/40 group-hover:text-coral transition shrink-0">{relatedPolicy?.year}</span>
                </div>
                <h3 className="font-bold text-ink group-hover:text-coral transition line-clamp-2">
                  {relatedPolicy?.title}
                </h3>
                <p className="text-sm text-ink/60 line-clamp-2">{relatedPolicy?.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
  } catch (err) {
    console.error('Error fetching policy:', err);
    return notFound();
  }
}
