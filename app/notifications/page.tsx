'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Trash2,
  CheckCircle,
  MessageSquare,
  AlertCircle,
  Mail,
} from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  action_url: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'unread'>('all');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadNotifications();
    }
  }, [filterType]);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setLoading(false);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/auth/login');
    }
  };

  const loadNotifications = async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        offset: '0',
      });

      if (filterType === 'unread') {
        params.append('unread', 'true');
      }

      const response = await fetch(`/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Load notifications error:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string, isRead: boolean) => {
    setActionInProgress(notificationId);
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ isRead: !isRead }),
      });

      if (response.ok) {
        loadNotifications();
      }
    } catch (error) {
      console.error('Mark as read error:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (notificationId: string) => {
    setActionInProgress(notificationId);
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (response.ok) {
        loadNotifications();
      }
    } catch (error) {
      console.error('Delete notification error:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'reply':
        return <MessageSquare className="w-5 h-5 text-ocean" />;
      case 'mention':
        return <AlertCircle className="w-5 h-5 text-coral" />;
      case 'email':
        return <Mail className="w-5 h-5 text-sand" />;
      default:
        return <Bell className="w-5 h-5 text-ink" />;
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
    <div className="min-h-screen bg-paper py-12">
      <div className="max-w-2xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-ink flex items-center gap-3">
            <Bell className="w-8 h-8" />
            Notifications
          </h1>
          <p className="mt-2 text-ink/60">Stay updated with discussions and replies</p>
        </div>

        {/* Filter */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filterType === 'all'
                ? 'bg-ocean text-white'
                : 'border border-ink/20 text-ink hover:bg-ink/5'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('unread')}
            className={`px-4 py-2 rounded-lg transition ${
              filterType === 'unread'
                ? 'bg-ocean text-white'
                : 'border border-ink/20 text-ink hover:bg-ink/5'
            }`}
          >
            Unread
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition ${
                  notification.is_read
                    ? 'bg-white border-ink/10'
                    : 'bg-ocean/5 border-ocean/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-ink">
                          {notification.title}
                        </h3>
                        {notification.message && (
                          <p className="text-sm text-ink/60 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-xs text-ink/50 mt-2">
                          {new Date(notification.created_at).toLocaleDateString()}{' '}
                          {new Date(notification.created_at).toLocaleTimeString()}
                        </p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {notification.action_url && (
                          <Link
                            href={notification.action_url}
                            className="px-3 py-2 rounded bg-ocean text-white hover:bg-ocean/90 text-sm font-medium transition"
                          >
                            View
                          </Link>
                        )}
                        <button
                          onClick={() =>
                            handleMarkAsRead(
                              notification.id,
                              notification.is_read
                            )
                          }
                          disabled={actionInProgress === notification.id}
                          className="p-2 hover:bg-ink/10 rounded transition text-ink/60 disabled:opacity-50"
                          title={
                            notification.is_read
                              ? 'Mark as unread'
                              : 'Mark as read'
                          }
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(notification.id)}
                          disabled={actionInProgress === notification.id}
                          className="p-2 hover:bg-coral/10 rounded transition text-coral disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-ink/10 mx-auto mb-4" />
              <p className="text-ink/60">
                {filterType === 'unread'
                  ? 'All caught up! No unread notifications'
                  : 'No notifications yet'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
