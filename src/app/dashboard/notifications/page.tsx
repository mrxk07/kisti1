'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Bell,
  RefreshCw,
  CheckCheck,
  Circle,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/notifications?limit=50');
      const json = await res.json();
      if (json.success) {
        setNotifications(json.data.notifications);
        setUnreadCount(json.data.unreadCount);
      } else {
        setError(json.error || 'Failed to fetch notifications');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.success) {
        setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(json.data.unreadCount);
      }
    } catch {
      // silent
    }
  };

  const markAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', { method: 'PATCH' });
      const json = await res.json();
      if (json.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  return (
    <div className="py-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="-ml-2 text-muted-foreground mb-1">
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          <h1 className="text-xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              className="text-xs h-8"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              Mark All Read
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchNotifications}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
      ) : error ? (
        <Card className="rounded-xl p-8 text-center">
          <Bell className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchNotifications}>Retry</Button>
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="rounded-xl p-8 text-center">
          <Bell className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No notifications</h3>
          <p className="text-sm text-muted-foreground">You&apos;re all caught up!</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`rounded-xl hover:shadow-sm transition-shadow cursor-pointer ${!notif.read ? 'bg-emerald-50/50 border-emerald-100' : ''}`}
              onClick={() => !notif.read && markAsRead(notif.id)}
            >
              <CardContent className="p-4 flex items-start gap-3">
                {!notif.read ? (
                  <Circle className="h-3 w-3 text-emerald-500 fill-emerald-500 mt-1.5 shrink-0" />
                ) : (
                  <div className="h-3 w-3 mt-1.5 shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-sm ${!notif.read ? 'font-semibold' : 'font-medium text-muted-foreground'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{notif.message}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
