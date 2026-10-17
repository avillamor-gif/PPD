// Notification system using browser events
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number; // ms (0 = no auto-close)
}

// Create a custom event for notifications
export class NotificationEvent extends CustomEvent<Notification> {
  constructor(notification: Notification) {
    super('show-notification', { detail: notification });
  }
}

// Helper functions to trigger notifications
export function showNotification(
  title: string,
  message?: string,
  type: NotificationType = 'info',
  duration: number = 4000
) {
  const id = `${Date.now()}-${Math.random()}`;
  const notification: Notification = {
    id,
    type,
    title,
    message,
    duration,
  };
  
  window.dispatchEvent(new NotificationEvent(notification));
  
  return id;
}

export function showSuccess(title: string, message?: string, duration = 4000) {
  return showNotification(title, message, 'success', duration);
}

export function showError(title: string, message?: string, duration = 5000) {
  return showNotification(title, message, 'error', duration);
}

export function showInfo(title: string, message?: string, duration = 4000) {
  return showNotification(title, message, 'info', duration);
}

export function showWarning(title: string, message?: string, duration = 4000) {
  return showNotification(title, message, 'warning', duration);
}
