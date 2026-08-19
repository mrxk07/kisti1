'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatTaka } from '@/lib/constants';
import {
  Users,
  FileText,
  Clock,
  CheckCircle2,
  Wallet,
  Receipt,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

interface Stats {
  users: { total: number; recent: number };
  applications: { total: number; recent: number; pending: number; approved: number; rejected: number };
  transactions: { total: number };
  repayments: { total: number; pending: number; paid: number };
  support: { total: number; open: number };
  financials: {
    totalLoanDisbursed: number;
    totalLoanDisbursedFormatted: string;
    totalInterestCollected: number;
    totalInterestCollectedFormatted: string;
    totalRepaymentCollected: number;
    totalRepaymentCollectedFormatted: string;
    totalActiveBalance: number;
    totalActiveBalanceFormatted: string;
  };
  plans: { total: number; active: number };
}

const statCards = [
  {
    key: 'totalUsers',
    label: 'Total Demo Users',
    icon: Users,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    getValue: (s: Stats) => s.users.total,
    suffix: '',
  },
  {
    key: 'totalApplications',
    label: 'Total Applications',
    icon: FileText,
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    getValue: (s: Stats) => s.applications.total,
    suffix: '',
  },
  {
    key: 'pendingApplications',
    label: 'Pending Applications',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    getValue: (s: Stats) => s.applications.pending,
    suffix: '',
  },
  {
    key: 'approvedApplications',
    label: 'Approved Applications',
    icon: CheckCircle2,
    color: 'text-green-600',
    bg: 'bg-green-50',
    getValue: (s: Stats) => s.applications.approved,
    suffix: '',
  },
  {
    key: 'totalBalance',
    label: 'Total Demo Balance',
    icon: Wallet,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    getValue: (s: Stats) => s.financials.totalActiveBalanceFormatted,
    suffix: '',
  },
  {
    key: 'totalRepayments',
    label: 'Total Demo Repayments',
    icon: Receipt,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    getValue: (s: Stats) => s.financials.totalRepaymentCollectedFormatted,
    suffix: '',
  },
  {
    key: 'loanDisbursed',
    label: 'Loan Disbursed',
    icon: TrendingUp,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    getValue: (s: Stats) => s.financials.totalLoanDisbursedFormatted,
    suffix: '',
  },
  {
    key: 'pendingVerification',
    label: 'Pending Verification',
    icon: AlertCircle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    getValue: (s: Stats) => s.repayments.pending,
    suffix: '',
  },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setStats(res.data);
        else setError(res.error || 'Failed to load stats');
      })
      .catch(() => setError('Network error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-sm text-slate-500">Overview of demo platform activity</p>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {stats && !loading && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.key} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {card.label}
                      </span>
                      <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
                        <Icon className={`h-4 w-4 ${card.color}`} />
                      </div>
                    </div>
                    <p className="text-xl lg:text-2xl font-bold text-slate-900">
                      {card.getValue(stats)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Summary */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">User Activity</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total Users</span>
                    <span className="font-medium text-slate-900">{stats.users.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">New (7 days)</span>
                    <span className="font-medium text-emerald-600">+{stats.users.recent}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Open Tickets</span>
                    <span className="font-medium text-orange-600">{stats.support.open}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Applications</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Total</span>
                    <span className="font-medium text-slate-900">{stats.applications.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Pending</span>
                    <span className="font-medium text-amber-600">{stats.applications.pending}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Approved / Rejected</span>
                    <span className="font-medium">
                      <span className="text-green-600">{stats.applications.approved}</span>
                      {' / '}
                      <span className="text-red-600">{stats.applications.rejected}</span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Financial Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Loan Disbursed</span>
                    <span className="font-medium text-slate-900">{stats.financials.totalLoanDisbursedFormatted}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Interest Collected</span>
                    <span className="font-medium text-emerald-600">{stats.financials.totalInterestCollectedFormatted}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Repayment Collected</span>
                    <span className="font-medium text-blue-600">{stats.financials.totalRepaymentCollectedFormatted}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
