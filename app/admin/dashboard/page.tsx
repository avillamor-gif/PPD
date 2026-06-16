'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Trash2, Eye, Shield, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [flaggedComments, setFlaggedComments] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalComments: 0, totalThreads: 0 });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }

      // Get user profile to check if admin
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*, role:roles(name)')
        .eq('id', currentUser.id)
        .single();

      const profileWithRole = userProfile as any;
      if (profileWithRole?.role?.name !== 'admin') {
        router.push('/');
        return;
      }

      setUser(currentUser);
      setProfile(userProfile);
      loadData();
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/auth/login');
    }
  };

  const loadData = async () => {
    try {
      // Load audit logs
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      setAuditLogs(logs || []);

      // Get stats (in production, would use materialized view or API)
      const { count: userCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      const { count: commentCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('is_deleted', false);

      const { count: threadCount } = await supabase
        .from('discussion_threads')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

      setStats({
        totalUsers: userCount || 0,
        totalComments: commentCount || 0,
        totalThreads: threadCount || 0,
      });
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-ink/60">Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="w-full min-h-screen bg-paper">
      {/* Header */}
      <section className="border-b border-rule bg-white">
        <div className="mx-auto max-w-350 px-6 py-6 lg:px-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-coral" />
              <h1 className="text-2xl font-bold text-ink">Admin Dashboard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-coral/10 text-coral hover:bg-coral/20 transition font-medium text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section>
        <div className="mx-auto max-w-350 px-6 py-12 lg:px-10">
          <h2 className="text-xl font-bold text-ink mb-6">Overview</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-ink/10 bg-white p-6 space-y-2">
              <p className="text-sm text-ink/60 uppercase tracking-wider">Total Users</p>
              <p className="text-4xl font-bold text-coral">{stats.totalUsers}</p>
            </div>
            <div className="rounded-xl border border-ink/10 bg-white p-6 space-y-2">
              <p className="text-sm text-ink/60 uppercase tracking-wider">Active Discussions</p>
              <p className="text-4xl font-bold text-ocean">{stats.totalThreads}</p>
            </div>
            <div className="rounded-xl border border-ink/10 bg-white p-6 space-y-2">
              <p className="text-sm text-ink/60 uppercase tracking-wider">Total Comments</p>
              <p className="text-4xl font-bold text-sand">{stats.totalComments}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Audit Logs */}
      <section>
        <div className="mx-auto max-w-350 px-6 py-12 lg:px-10">
          <h2 className="text-xl font-bold text-ink mb-6 flex items-center gap-2">
            <Eye className="w-6 h-6 text-coral" />
            Recent Audit Logs
          </h2>
          <div className="rounded-xl border border-ink/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-paper border-b border-ink/10">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-ink">Action</th>
                  <th className="px-6 py-3 text-left font-semibold text-ink">Resource</th>
                  <th className="px-6 py-3 text-left font-semibold text-ink">Date</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length > 0 ? (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="border-t border-ink/10 hover:bg-paper/50 transition">
                      <td className="px-6 py-3">
                        <span className="inline-flex px-2 py-1 rounded bg-coral/10 text-coral text-xs font-mono">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-ink/60">{log.resource_type}</td>
                      <td className="px-6 py-3 text-ink/50">
                        {new Date(log.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-ink/50">
                      No audit logs yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Moderation */}
      <section className="border-t border-rule py-12">
        <div className="mx-auto max-w-350 px-6 lg:px-10">
          <h2 className="text-xl font-bold text-ink mb-6 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-coral" />
            Moderation Tools
          </h2>
          <div className="rounded-xl border border-coral/30 bg-coral/5 p-6 text-center">
            <p className="text-ink/60">Advanced moderation features coming soon.</p>
            <p className="text-sm text-ink/50 mt-2">Review flagged comments and manage users here.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
