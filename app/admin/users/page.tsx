'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  ChevronDown,
  Trash2,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  Plus,
} from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  display_name: string;
  role: string;
  thread_count: number;
  comment_count: number;
  last_activity_at: string;
  created_at: string;
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [actionInProgress, setActionInProgress] = useState(false);
  const router = useRouter();
  const limit = 25;

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (loading === false) {
      loadUsers();
    }
  }, [search, roleFilter, offset]);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Simple role check - get profile with role_id directly
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role_id')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Profile fetch error:', error.message);
        router.push('/');
        return;
      }

      // Check if role_id is 1 (admin) - role_id is an integer, not a relationship
      if (profile?.role_id !== 1) {
        console.log('User role_id:', profile?.role_id, '(not admin)');
        router.push('/');
        return;
      }

      setLoading(false);
    } catch (error) {
      console.error('Access check error:', error);
      router.push('/');
    }
  };

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      const data = await response.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Load users error:', error);
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    if (!role) return;

    setActionInProgress(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ role }),
      });

      if (response.ok) {
        setShowModal(false);
        setNewRole('');
        loadUsers();
      }
    } catch (error) {
      console.error('Role update error:', error);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!confirm('Ban this user?')) return;

    setActionInProgress(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ status: 'banned' }),
      });

      if (response.ok) {
        loadUsers();
      }
    } catch (error) {
      console.error('Ban user error:', error);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;

    setActionInProgress(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (response.ok) {
        loadUsers();
      }
    } catch (error) {
      console.error('Delete user error:', error);
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-ink/60">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-ink">User Management</h1>
          <p className="mt-2 text-ink/60">Manage users, roles, and permissions</p>
        </div>
        <Link
          href="/admin/users/create"
          className="inline-flex items-center gap-2 rounded-lg bg-ink px-6 py-3 font-medium text-paper hover:bg-ink/90 transition"
        >
          <Plus className="w-5 h-5" />
          Create User
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3 w-5 h-5 text-ink/40" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOffset(0);
            }}
            className="w-full pl-12 pr-4 py-3 rounded-lg border border-ink/20 focus:border-ocean focus:ring-2 focus:ring-ocean/20 outline-none transition"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setOffset(0);
          }}
          className="px-4 py-3 rounded-lg border border-ink/20 focus:border-ocean focus:ring-2 focus:ring-ocean/20 outline-none transition"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="moderator">Moderator</option>
          <option value="expert">Expert</option>
          <option value="user">User</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-ink/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-sand/30 border-b border-ink/10">
              <tr>
                <th className="px-6 py-4 text-left font-semibold text-ink">Email</th>
                <th className="px-6 py-4 text-left font-semibold text-ink">Name</th>
                <th className="px-6 py-4 text-left font-semibold text-ink">Role</th>
                <th className="px-6 py-4 text-center font-semibold text-ink">Activity</th>
                <th className="px-6 py-4 text-center font-semibold text-ink">Joined</th>
                <th className="px-6 py-4 text-left font-semibold text-ink">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-sand/20 transition">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-ink/60">{user.email}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-ink">{user.display_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-ocean/10 text-ocean">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-xs text-ink/60">
                        <p>{user.thread_count} threads</p>
                        <p>{user.comment_count} comments</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-xs text-ink/50">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role);
                            setShowModal(true);
                          }}
                          className="p-2 hover:bg-ocean/10 rounded transition text-ocean"
                          title="Change role"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleBanUser(user.id)}
                          className="p-2 hover:bg-coral/10 rounded transition text-coral"
                          title="Ban user"
                          disabled={actionInProgress}
                        >
                          <AlertCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 hover:bg-coral/10 rounded transition text-coral"
                          title="Delete user"
                          disabled={actionInProgress}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-ink/50">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/60">
          Showing {offset + 1}–{Math.min(offset + limit, total)} of {total} users
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setOffset(Math.max(0, offset - limit))}
            disabled={offset === 0}
            className="px-4 py-2 rounded-lg border border-ink/20 text-ink hover:bg-sand/30 disabled:opacity-50 transition"
          >
            ← Previous
          </button>
          <button
            onClick={() => setOffset(offset + limit)}
            disabled={offset + limit >= total}
            className="px-4 py-2 rounded-lg border border-ink/20 text-ink hover:bg-sand/30 disabled:opacity-50 transition"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Role Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-paper rounded-lg max-w-sm w-full p-6 border border-ink/20">
            <h3 className="text-lg font-bold text-ink">
              Change Role: {selectedUser.display_name}
            </h3>
            <p className="mt-2 text-sm text-ink/60">
              Current role: <strong>{selectedUser.role}</strong>
            </p>

            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full mt-4 px-4 py-2 rounded-lg border border-ink/20 focus:border-ocean focus:ring-2 focus:ring-ocean/20"
            >
              <option value="">Select role...</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="expert">Expert</option>
              <option value="user">User</option>
            </select>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => handleRoleChange(selectedUser.id, newRole)}
                disabled={!newRole || actionInProgress || newRole === selectedUser.role}
                className="flex-1 px-4 py-2 rounded-lg bg-ink text-paper hover:bg-ink/90 disabled:opacity-50 transition font-medium"
              >
                {actionInProgress ? 'Updating...' : 'Update Role'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setNewRole('');
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-ink/20 text-ink hover:bg-sand/30 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
