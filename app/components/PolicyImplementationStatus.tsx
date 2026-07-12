'use client';

import { useState, useEffect } from 'react';
import { Calendar, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PolicyImplementationStatusProps {
  policyId: string;
  initialStatus: string;
  initialYear: number;
}

export function PolicyImplementationStatus({
  policyId,
  initialStatus,
  initialYear,
}: PolicyImplementationStatusProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsAdmin(false);
          return;
        }

        // Fetch user profile with role
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('roles(name)')
          .eq('id', user.id)
          .single();

        const roles = Array.isArray(profile?.roles) ? profile.roles : profile?.roles ? [profile.roles] : [];
        const userRole = roles?.[0]?.name;
        setIsAdmin(userRole === 'admin');
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, []);

  useEffect(() => {
    // Fetch available statuses from the reference data
    const fetchStatuses = async () => {
      try {
        const res = await fetch('/api/reference-data/statuses');
        const data = await res.json();
        setAvailableStatuses(data.map((s: any) => s.name));
      } catch (err) {
        console.error('Error fetching statuses:', err);
      }
    };
    fetchStatuses();
  }, []);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get the current session to get the auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Authentication required');
        return;
      }

      const res = await fetch(`/api/policies/${policyId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      setStatus(newStatus);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-ink/10 bg-white p-6 space-y-4">
      <h2 className="text-xl font-bold text-ink flex items-center gap-2">
        <Calendar className="w-5 h-5 text-coral" />
        Implementation Status
      </h2>
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-coral to-coral/50 flex items-center justify-center">
            <span className="text-white font-bold">{initialYear}</span>
          </div>
          <div>
            <p className="text-sm text-ink/60 font-mono">Enacted/Proposed</p>
            <p className="font-semibold text-ink">{initialYear}</p>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-coral/10 border border-coral/30 text-coral text-sm">
            {error}
          </div>
        )}

        {isEditing ? (
          <div className="p-4 rounded-lg bg-ink/5 border border-ink/10 space-y-2">
            <p className="text-sm font-mono text-ink/60 uppercase tracking-wider">Select New Status</p>
            <div className="grid grid-cols-2 gap-2">
              {availableStatuses.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusUpdate(s)}
                  disabled={isLoading}
                  className={`px-3 py-2 rounded text-sm font-semibold transition ${
                    s === status
                      ? 'bg-ocean text-white'
                      : 'bg-white border border-ink/20 text-ink hover:border-ocean hover:text-ocean'
                  } disabled:opacity-50`}
                >
                  {s}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsEditing(false)}
              className="w-full px-3 py-2 rounded text-sm font-semibold bg-ink/10 text-ink hover:bg-ink/20 transition"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-ink/5 border-l-4 border-coral flex items-center justify-between">
            <div>
              <p className="text-sm text-ink/70">
                Status: <span className="font-semibold text-ink">{status}</span>
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1 rounded text-xs font-semibold bg-ocean text-white hover:bg-ocean/90 transition"
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
