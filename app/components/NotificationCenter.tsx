'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';
import { Notification, NotificationType } from '@/lib/notifications';

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <AlertCircle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
};

const notificationColors: Record<NotificationType, { bg: string; text: string; border: string }> = {
  success: {
    bg: 'bg-ocean/10',
    text: 'text-ocean',
    border: 'border-ocean/30',
  },
  error: {
    bg: 'bg-coral/10',
    text: 'text-coral',
    border: 'border-coral/30',
  },
  info: {
    bg: 'bg-sky-100',
    text: 'text-sky-700',
    border: 'border-sky-300',
  },
  warning: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-300',
  },
};

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handleNotification = (event: Event) => {
      const customEvent = event as CustomEvent<Notification>;
      const notification = customEvent.detail;

      setNotifications((prev) => [...prev, notification]);

      // Auto-close if duration is set
      if (notification.duration && notification.duration > 0) {
        setTimeout(() => {
          removeNotification(notification.id);
        }, notification.duration);
      }
    };

    window.addEventListener('show-notification', handleNotification);
    return () => window.removeEventListener('show-notification', handleNotification);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
      <div className="space-y-4 max-w-md w-full mx-4 pointer-events-auto">
        {notifications.map((notification) => {
          const colors = notificationColors[notification.type];
          const icon = notificationIcons[notification.type];

          return (
            <div
              key={notification.id}
              className={`${colors.bg} ${colors.border} border-2 rounded-lg p-4 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300`}
            >
              <div className="flex items-start gap-3">
                <div className={`${colors.text} flex-shrink-0 mt-0.5`}>{icon}</div>
                <div className="flex-1">
                  <h3 className={`${colors.text} font-bold text-sm`}>{notification.title}</h3>
                  {notification.message && (
                    <p className={`${colors.text} text-xs mt-1 opacity-90`}>{notification.message}</p>
                  )}
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className={`${colors.text} hover:opacity-70 flex-shrink-0`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
