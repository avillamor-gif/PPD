'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle, XCircle, Loader2, Lock } from 'lucide-react';
import { UserRole } from '@/lib/roles';

interface PendingPolicy {
  id: string;
  title: string;
  summary: string;
  country: string;
  created_at: string;
  created_by: string;
  approval_status: string;
}

const roleIdMap: Record<number, UserRole> = {
  1: UserRole.ADMIN,
  2: UserRole.MODERATOR,
  3: UserRole.EXPERT,
  5: UserRole.GUEST,
};

export default function PoliciesReviewPage() {
  const router = useRouter();
  const [policies, setPolicies] = useState<PendingPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      // Fetch user role
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role_id')
        .eq('id', session.user.id)
        .single();

      if (error || !profile) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const role = roleIdMap[profile.role_id] || UserRole.EXPERT;
      setUserRole(role);

      // Only admins can access this page
      if (role !== UserRole.ADMIN) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      // Admin access granted, fetch policies
      fetchPendingPolicies();
    } catch (error) {
      console.error('Error checking admin access:', error);
      setAccessDenied(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessDenied) {
      const timer = setTimeout(() => {
        router.push('/admin');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [accessDenied, router]);

  const fetchPendingPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .eq('approval_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPolicies(data || []);
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (policyId: string) => {
    setApproving(policyId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be logged in');
        return;
      }

      const response = await fetch('/api/admin/policies/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          policyId,
          action: 'approve',
        }),
      });

      if (response.ok) {
        // Remove from list
        setPolicies(policies.filter(p => p.id !== policyId));
        alert('✅ Policy approved successfully!');
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error approving policy:', error);
      alert('Failed to approve policy');
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (policyId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setApproving(policyId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be logged in');
        return;
      }

      const response = await fetch('/api/admin/policies/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          policyId,
          action: 'reject',
          rejectionReason,
        }),
      });

      if (response.ok) {
        // Remove from list
        setPolicies(policies.filter(p => p.id !== policyId));
        setRejectionReason('');
        setSelectedPolicy(null);
        alert('❌ Policy rejected and expert notified');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error rejecting policy:', error);
      alert('Failed to reject policy');
    } finally {
      setApproving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-ocean" />
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="max-w-md mx-auto px-6 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-coral/10 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-coral" />
        </div>
        <h1 className="text-2xl font-bold text-ink mb-2">Access Denied</h1>
        <p className="text-ink/60 mb-6">Only administrators can approve policy submissions.</p>
        <p className="text-sm text-ink/50">Redirecting to admin panel...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-ink mb-2">Policy Approvals</h1>
        <p className="text-ink/60">Review and approve pending policy submissions</p>
        <div className="mt-4 inline-block bg-ocean/10 px-4 py-2 rounded-lg">
          <p className="text-sm font-semibold text-ocean">
            {policies.length} pending submission{policies.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {policies.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-ocean/30 mx-auto mb-4" />
          <p className="text-ink/60">No pending policies to review</p>
        </div>
      ) : (
        <div className="space-y-6">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="bg-white border-2 border-ocean/20 rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-ink mb-2">{policy.title}</h2>
                  <p className="text-ink/70 mb-4">{policy.summary}</p>
                  <div className="flex gap-4 text-sm text-ink/60">
                    <span>🌍 {policy.country}</span>
                    <span>📅 {new Date(policy.created_at).toLocaleDateString()}</span>
                    <span className="inline-block px-3 py-1 bg-ocean/10 rounded-full text-ocean font-semibold">
                      {policy.approval_status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rejection reason input (shown if policy is selected for rejection) */}
              {selectedPolicy === policy.id && (
                <div className="mb-4 p-4 bg-coral/10 border border-coral/20 rounded-lg">
                  <label className="block text-sm font-semibold text-ink mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why this policy submission is being rejected..."
                    className="w-full p-3 border border-ink/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral"
                    rows={3}
                  />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                {selectedPolicy === policy.id ? (
                  <>
                    <button
                      onClick={() => handleReject(policy.id)}
                      disabled={approving === policy.id}
                      className="flex-1 px-6 py-3 bg-coral text-white font-semibold rounded-lg hover:bg-coral/90 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {approving === policy.id ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5" />
                          Confirm Rejection
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPolicy(null);
                        setRejectionReason('');
                      }}
                      className="flex-1 px-6 py-3 bg-ink/10 text-ink font-semibold rounded-lg hover:bg-ink/20"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleApprove(policy.id)}
                      disabled={approving === policy.id}
                      className="flex-1 px-6 py-3 bg-ocean text-white font-semibold rounded-lg hover:bg-ocean/90 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {approving === policy.id ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Approve
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedPolicy(policy.id)}
                      className="flex-1 px-6 py-3 bg-coral/10 text-coral font-semibold rounded-lg hover:bg-coral/20 flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
