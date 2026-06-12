'use client';

import { useRouter, useParams } from 'next/navigation';
import { POLICIES } from '@/lib/constants';
import { PolicyForm } from '@/app/components/PolicyForm';

export default function EditPolicyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const policy = POLICIES.find((p) => p.id === id);

  if (!policy) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-4xl font-bold text-ink">Policy Not Found</h1>
          <p className="mt-2 text-ink/60">The policy you're looking for doesn't exist.</p>
        </div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-full border border-ink/30 px-8 py-3 font-mono text-sm uppercase tracking-[0.18em] text-ink transition hover:bg-ink/5"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-4xl font-bold text-ink">Edit Policy</h1>
        <p className="mt-2 text-ink/60">Update the policy entry for: <strong>{policy.title}</strong></p>
      </div>

      {/* Form */}
      <PolicyForm
        initialData={policy}
        isEditing={true}
        onSuccess={() => {
          router.push('/admin/manage');
        }}
      />
    </div>
  );
}
