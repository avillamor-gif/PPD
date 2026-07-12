'use client';

import { useState, useEffect } from 'react';
import { Calendar, Plus, X, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface StatusHistoryEntry {
  id: string;
  old_status: string | null;
  new_status: string;
  change_date: string;
  notes: string | null;
  recorded_at: string;
  recorded_by: { display_name: string } | null;
}

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
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingHistory, setIsAddingHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableStatuses, setAvailableStatuses] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // Form fields
  const [newStatusForm, setNewStatusForm] = useState('');
  const [historyChangeDate, setHistoryChangeDate] = useState('');
  const [historyNotes, setHistoryNotes] = useState('');

  // Check if user is admin and fetch initial data
  useEffect(() => {
    const initializeData = async () => {
      try {
        console.log('🚀 Initializing PolicyImplementationStatus');
        
        // Check if user is admin
        const { data: { user } } = await supabase.auth.getUser();
        console.log('🔍 Current user:', user?.id);
        
        if (!user) {
          console.log('ℹ️ No user logged in');
          setIsAdmin(false);
          return;
        }

        // Try simplified query: just get the role_id or role directly
        console.log('🔍 Fetching user profile...');
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('id, roles')  // Get the relationship without nested select
          .eq('id', user.id)
          .single();

        console.log('👤 User profile:', profile, 'Error:', profileError);

        // Handle both string and object role formats
        let isUserAdmin = false;
        if (profile) {
          const role = profile.roles;
          console.log('🔍 Role data:', role, 'Type:', typeof role);
          
          // If roles is an object with 'name' property
          if (typeof role === 'object' && role?.name === 'admin') {
            isUserAdmin = true;
          }
          // If roles is a string
          else if (typeof role === 'string' && role === 'admin') {
            isUserAdmin = true;
          }
          // If roles is an array
          else if (Array.isArray(role) && role.some((r: any) => r?.name === 'admin' || r === 'admin')) {
            isUserAdmin = true;
          }
        }

        console.log('🎯 Is admin:', isUserAdmin);
        setIsAdmin(isUserAdmin);

        // Fetch available statuses
        try {
          console.log('📡 Fetching statuses...');
          const res = await fetch('/api/reference-data/statuses');
          console.log('📡 Statuses response status:', res.status);
          
          if (!res.ok) {
            const errorText = await res.text();
            console.error('❌ Status fetch failed:', res.status, errorText);
            setError('Failed to load statuses');
            return;
          }
          
          const data = await res.json();
          console.log('✅ Statuses fetched:', data);
          setAvailableStatuses(data.map((s: any) => s.name));
        } catch (err) {
          console.error('❌ Error fetching statuses:', err);
          setError(`Statuses error: ${err instanceof Error ? err.message : String(err)}`);
        }

        // Fetch status history
        try {
          console.log('📡 Fetching status history for policy:', policyId);
          const historyRes = await fetch(`/api/policies/${policyId}/status-history`);
          console.log('📡 History response status:', historyRes.status);
          
          if (!historyRes.ok) {
            const errorText = await historyRes.text();
            console.error('❌ History fetch failed:', historyRes.status, errorText);
            // Don't set error for history - it's optional
            return;
          }
          
          const historyData = await historyRes.json();
          console.log('📜 Status history fetched:', historyData);
          setStatusHistory(historyData || []);
        } catch (err) {
          console.error('❌ Error fetching status history:', err);
          // Don't set error - history is optional
        }
      } catch (err) {
        console.error('❌ Error initializing:', err);
        setError(`Init error: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    initializeData();
  }, [policyId]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get the current session
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

      // Add to history with today's date
      const today = new Date().toISOString().split('T')[0];
      await addStatusToHistory(status, newStatus, today, 'Status updated');

      setStatus(newStatus);
      setNewStatusForm('');
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const addStatusToHistory = async (oldStatus: string, newStatus: string, changeDate: string, notes: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const historyRes = await fetch(`/api/policies/${policyId}/status-history`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          oldStatus,
          newStatus,
          changeDate,
          notes,
        }),
      });

      if (historyRes.ok) {
        const newEntry = await historyRes.json();
        setStatusHistory([newEntry, ...statusHistory]);
      }
    } catch (err) {
      console.error('Error adding to history:', err);
    }
  };

  const handleAddHistoricalStatus = async () => {
    if (!historyChangeDate || !newStatusForm) {
      setError('Please select a status and date');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      await addStatusToHistory(status, newStatusForm, historyChangeDate, historyNotes);
      setHistoryChangeDate('');
      setNewStatusForm('');
      setHistoryNotes('');
      setIsAddingHistory(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to history');
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
      
      {/* Current Status */}
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

        {/* Debug info (remove in production) */}
        {isAdmin && (
          <div className="p-2 rounded-lg bg-ocean/5 border border-ocean/20 text-xs text-ocean/70">
            <p>✅ Admin: {isAdmin ? 'Yes' : 'No'}</p>
            <p>📊 Statuses available: {availableStatuses.length}</p>
            <p>📜 History entries: {statusHistory.length}</p>
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

      {/* Timeline History Section */}
      {statusHistory.length > 0 && (
        <div className="mt-6 pt-6 border-t border-ink/10">
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider mb-4">Status Timeline</h3>
          <div className="space-y-3">
            {statusHistory.map((entry, index) => (
              <div key={entry.id} className="flex gap-3">
                {/* Timeline dot and line */}
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-ocean mt-1.5" />
                  {index < statusHistory.length - 1 && (
                    <div className="w-0.5 h-12 bg-ink/10 my-1" />
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {entry.old_status && `${entry.old_status} → `}
                        <span className="text-ocean">{entry.new_status}</span>
                      </p>
                      <p className="text-xs text-ink/60 mt-1">
                        {new Date(entry.change_date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      {entry.notes && (
                        <p className="text-xs text-ink/50 mt-2 italic">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Historical Status */}
      {isAdmin && (
        <div className="mt-6 pt-6 border-t border-ink/10">
          {!isAddingHistory ? (
            <button
              onClick={() => setIsAddingHistory(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-ocean/10 text-ocean hover:bg-ocean/20 transition font-semibold text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Historical Status
            </button>
          ) : (
            <div className="p-4 rounded-lg bg-sand/10 border border-sand/30 space-y-3">
              <p className="text-sm font-mono text-ink/60 uppercase tracking-wider">Add Status Change</p>
              
              <div>
                <label className="text-xs font-medium text-ink/60">Status</label>
                <select
                  value={newStatusForm}
                  onChange={(e) => setNewStatusForm(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded border border-ink/20 text-sm"
                >
                  <option value="">Select Status</option>
                  {availableStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-ink/60">Date of Change</label>
                <input
                  type="date"
                  value={historyChangeDate}
                  onChange={(e) => setHistoryChangeDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded border border-ink/20 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-ink/60">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Policy amendments..."
                  value={historyNotes}
                  onChange={(e) => setHistoryNotes(e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded border border-ink/20 text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddHistoricalStatus}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-semibold bg-ocean text-white hover:bg-ocean/90 transition disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Add
                </button>
                <button
                  onClick={() => {
                    setIsAddingHistory(false);
                    setHistoryChangeDate('');
                    setNewStatusForm('');
                    setHistoryNotes('');
                  }}
                  className="flex-1 px-3 py-2 rounded text-sm font-semibold bg-ink/10 text-ink hover:bg-ink/20 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
