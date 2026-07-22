'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader, AlertCircle } from 'lucide-react';

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [comparison, setComparison] = useState<string>('');
  const [policies, setPolicies] = useState<Array<{ id: string; title: string; country: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateComparison = async () => {
      try {
        const policyIdsParam = searchParams.get('ids');
        if (!policyIdsParam) {
          setError('No policies selected for comparison');
          setLoading(false);
          return;
        }

        const policyIds = policyIdsParam.split(',');
        if (policyIds.length < 2) {
          setError('Please select at least 2 policies to compare');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/compare-policies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ policyIds }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to generate comparison');
        }

        const data = await response.json();
        setComparison(data.comparison);
        setPolicies(data.policies);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    generateComparison();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="w-full">
        <section className="border-b border-rule">
          <div className="mx-auto max-w-350 px-6 pb-10 pt-14 lg:px-10">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 text-ocean hover:text-ocean-deep transition mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Search
            </Link>
            <h1 className="font-fraunces text-5xl font-semibold leading-[1.02] tracking-[-0.02em]">
              Comparing Policies
            </h1>
          </div>
        </section>
        <section className="mx-auto max-w-350 px-6 py-12 lg:px-10">
          <div className="flex items-center justify-center py-12">
            <Loader className="w-8 h-8 animate-spin text-ocean" />
          </div>
          <p className="text-center text-ink/60 mt-4">
            Analyzing policies with AI... This may take a moment.
          </p>
        </section>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <section className="border-b border-rule">
          <div className="mx-auto max-w-350 px-6 pb-10 pt-14 lg:px-10">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 text-ocean hover:text-ocean-deep transition mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Search
            </Link>
            <h1 className="font-fraunces text-5xl font-semibold leading-[1.02] tracking-[-0.02em]">
              Comparing Policies
            </h1>
          </div>
        </section>
        <section className="mx-auto max-w-350 px-6 py-12 lg:px-10">
          <div className="rounded-2xl border border-coral/30 bg-coral/5 p-6 flex gap-4">
            <AlertCircle className="w-6 h-6 text-coral flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-coral mb-2">Comparison Error</h3>
              <p className="text-ink/60">{error}</p>
              <Link
                href="/search"
                className="mt-4 inline-block text-ocean hover:text-ocean-deep transition underline"
              >
                Return to search and try again
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <section className="border-b border-rule">
        <div className="mx-auto max-w-350 px-6 pb-10 pt-14 lg:px-10">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 text-ocean hover:text-ocean-deep transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Link>
          <h1 className="font-fraunces text-5xl font-semibold leading-[1.02] tracking-[-0.02em] md:text-6xl">
            Policy Comparison Analysis
          </h1>
          <p className="mt-4 text-ink/60">
            AI-powered analysis comparing {policies.length} selected policies
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {policies.map((policy) => (
              <div
                key={policy.id}
                className="px-3 py-1 rounded-full bg-ocean/10 text-ocean text-sm font-medium"
              >
                {policy.title}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Results */}
      <section>
        <div className="mx-auto max-w-350 px-6 py-12 lg:px-10">
          <div className="prose prose-sm max-w-none">
            <div className="rounded-xl border border-rule bg-paper p-8 whitespace-pre-wrap font-sans text-base leading-relaxed text-ink">
              {comparison}
            </div>
          </div>

          <div className="mt-12 flex gap-4">
            <Link
              href="/search"
              className="px-6 py-3 rounded-lg bg-ocean text-white hover:bg-ocean-deep transition font-medium"
            >
              Compare Different Policies
            </Link>
            <Link
              href="/search"
              className="px-6 py-3 rounded-lg border border-ink/20 text-ink hover:bg-ink/5 transition font-medium"
            >
              Back to Search
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CompareContent />
    </Suspense>
  );
}
