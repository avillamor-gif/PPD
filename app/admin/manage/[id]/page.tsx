'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { PolicyForm } from '@/app/components/PolicyForm';
import { supabase } from '@/lib/supabase';
import { Loader } from 'lucide-react';
import type { Policy } from '@/lib/types/policy';

export default function EditPolicyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        setLoading(true);
        
        // Fetch the policy
        const res = await fetch(`/api/policies/${id}`);
        if (!res.ok) {
          throw new Error('Policy not found');
        }
        const data = await res.json() as Policy;
        setPolicy(data);

        // Check if user is admin
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.access_token) {
          throw new Error('Not authenticated');
        }

        const adminRes = await fetch('/api/auth/check-admin', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        const authData = await adminRes.json();
        console.log('Admin check result:', authData);
        setIsAdmin(authData.isAdmin === true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load policy');
        console.error('Error fetching policy:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPolicy();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-ocean" />
      </div>
    );
  }

  if (error || !policy) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-4xl font-bold text-ink">Policy Not Found</h1>
          <p className="mt-2 text-ink/60">{error || 'The policy you\'re looking for doesn\'t exist.'}</p>
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

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-4xl font-bold text-ink">Access Denied</h1>
          <p className="mt-2 text-ink/60">You must be an admin to edit policies.</p>
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
