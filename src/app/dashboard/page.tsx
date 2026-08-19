'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Wallet,
  FileText,
  Receipt,
  CreditCard,
  Bell,
  ArrowRight,
  ChevronRight,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatTaka } from '@/lib/constants';
import { toast } from 'sonner';

interface DashboardData {
  user: { id: string; name: string | null; email: string | null; role: string; isDemo: boolean; balance: number };
  plans: any[];
  transactions: any[];
  notifications: any[];
  unreadCount: number;
  latestApplication: any | null;
}

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200',
    COMPLETED: 'bg-sky-100 text-sky-800 border-sky-200',
    VERIFICATION: 'bg-purple-100 text-purple-800 border-purple-200',
  };
  return map[status] || 'bg-slate-100 text-slate-800 border-slate-200';
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessionRes, plansRes, txRes, notifRes] = await Promise.all([
        fetch('/api/demo/session', { method: 'POST' }),
        fetch('/api/plans'),
        fetch('/api/transactions?limit=5'),
        fetch('/api/notifications?limit=5'),
      ]);

      const sessionJson = await sessionRes.json();
      if (!sessionJson.success) throw new Error(sessionJson.error || 'Session failed');

      const plansJson = plansRes.ok ? await plansRes.json() : { success: true, data: [] };
      const txJson = txRes.ok ? await txRes.json() : { success: true, data: { transactions: [] } };
      const notifJson = notifRes.ok ? await notifRes.json() : { success: true, data: { notifications: [], unreadCount: 0 } };

      // Fetch latest application
      let latestApplication = null;
      try {
        const appRes = await fetch('/api/applications?limit=1');
        if (appRes.ok) {
          const appJson = await appRes.json();
          if (appJson.success && appJson.data.applications.length > 0) {
            latestApplication = appJson.data.applications[0];
          }
        }
      } catch { /* ignore */ }

      setData({
        user: sessionJson.data,
        plans: plansJson.success ? plansJson.data : [],
        transactions: txJson.success ? txJson.data.transactions : [],
        notifications: notifJson.success ? notifJson.data.notifications : [],
        unreadCount: notifJson.success ? notifJson.data.unreadCount : 0,
        latestApplication,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">{error || 'Unable to load dashboard data'}</p>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  const { user, transactions, notifications, unreadCount, latestApplication } = data;
  const shortId = user.id.substring(0, 8).toUpperCase();

  const quickActions = [
    { href: '/dashboard/apply', label: 'Apply', icon: FileText, color: 'bg-emerald-100 text-emerald-600' },
    { href: '/dashboard/apply', label: 'My Application', icon: FileText, color: 'bg-blue-100 text-blue-600' },
    { href: '/dashboard/transactions', label: 'Transactions', icon: Receipt, color: 'bg-amber-100 text-amber-600' },
    { href: '/dashboard/repayments', label: 'Repayment', icon: CreditCard, color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">
            Welcome, {user.name || 'Demo User'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Demo Account ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">{shortId}</code>
          </p>
        </div>
        <Link href="/dashboard/notifications">
          <Badge variant="outline" className="gap-1.5 cursor-pointer hover:bg-accent transition-colors">
            <Bell className="h-3.5 w-3.5" />
            {unreadCount > 0 ? `${unreadCount} unread` : 'No new notifications'}
          </Badge>
        </Link>
      </div>

      {/* Balance Card */}
      <Card className="rounded-xl overflow-hidden border-0 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-emerald-100">
              <Wallet className="h-5 w-5" />
              <span className="text-sm font-medium">Available Balance</span>
            </div>
            <Badge className="bg-white/20 text-white border-0 text-[10px]">DEMO</Badge>
          </div>
          <div className="text-3xl sm:text-4xl font-bold tracking-tight">
            {formatTaka(user.balance)}
          </div>
          <p className="text-emerald-200 text-xs mt-2">Simulated balance — no real money</p>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href}>
                <Card className="rounded-xl hover:shadow-md transition-shadow cursor-pointer p-4 text-center group">
                  <div className={`h-10 w-10 rounded-lg ${action.color} flex items-center justify-center mx-auto mb-2 group-hover:scale-105 transition-transform`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium">{action.label}</span>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Application */}
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Current Application</CardTitle>
              {latestApplication && (
                <Link href="/dashboard/apply">
                  <Button variant="ghost" size="sm" className="text-xs h-7">
                    View <ChevronRight className="h-3 w-3 ml-0.5" />
                  </Button>
                </Link>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {latestApplication ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{latestApplication.planName}</span>
                  <Badge variant="outline" className={`text-[10px] ${getStatusBadge(latestApplication.status)}`}>
                    {latestApplication.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-xs text-muted-foreground">Principal</p>
                    <p className="font-semibold">{latestApplication.principalFormatted}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-semibold">{latestApplication.totalFormatted}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No active application</p>
                <Link href="/dashboard/apply">
                  <Button variant="outline" size="sm" className="mt-3 text-xs">
                    Apply Now <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
              <Link href="/dashboard/transactions">
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  View All <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-6">
                <Receipt className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No transactions yet</p>
              </div>
            ) : (
              <ScrollArea className="max-h-48">
                <div className="space-y-2.5">
                  {transactions.map((tx: any) => (
                    <div key={tx.id} className="flex items-center justify-between py-1.5">
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="text-sm font-medium truncate">{tx.description || tx.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold shrink-0 ${tx.isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.isCredit ? '+' : '-'}{tx.amountFormatted}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <Card className="rounded-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Notifications</CardTitle>
              <Link href="/dashboard/notifications">
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  View All <ChevronRight className="h-3 w-3 ml-0.5" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-48">
              <div className="space-y-2.5">
                {notifications.slice(0, 3).map((notif: any) => (
                  <div key={notif.id} className={`flex items-start gap-3 p-2.5 rounded-lg ${!notif.read ? 'bg-emerald-50' : ''}`}>
                    <Bell className={`h-4 w-4 mt-0.5 shrink-0 ${!notif.read ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{notif.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
