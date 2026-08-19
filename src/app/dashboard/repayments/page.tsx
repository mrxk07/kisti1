'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CreditCard,
  RefreshCw,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatTaka } from '@/lib/constants';
import { toast } from 'sonner';

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    PAID: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    OVERDUE: 'bg-red-100 text-red-800 border-red-200',
    DEMO_PAID: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };
  return map[status] || 'bg-slate-100 text-slate-800 border-slate-200';
}

export default function RepaymentsPage() {
  const router = useRouter();
  const [repayments, setRepayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [repayRes, appRes] = await Promise.all([
        fetch('/api/repayments?limit=50'),
        fetch('/api/applications?status=APPROVED&limit=1'),
      ]);

      const repayJson = await repayRes.json();
      if (repayJson.success) {
        setRepayments(repayJson.data.repayments);
      }

      if (appRes.ok) {
        const appJson = await appRes.json();
        if (appJson.success && appJson.data.applications.length > 0) {
          const app = appJson.data.applications[0];
          const paid = repayJson.success
            ? repayJson.data.repayments
                .filter((r: any) => r.status === 'PAID' || r.status === 'DEMO_PAID')
                .reduce((sum: number, r: any) => sum + r.paidAmount, 0)
            : 0;
          setSummary({
            planName: app.planName,
            principal: app.principalFormatted,
            interest: app.interestFormatted,
            total: app.totalFormatted,
            totalRaw: app.totalAmount,
            paid,
            remaining: app.totalAmount - paid,
          });
        }
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePay = async (repaymentId: string) => {
    setPaying(repaymentId);
    try {
      const res = await fetch('/api/repayments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repaymentId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Repayment simulated successfully!');
        fetchData();
      } else {
        toast.error(json.error || 'Repayment failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setPaying(null);
    }
  };

  return (
    <div className="py-2">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="-ml-2 text-muted-foreground mb-1">
          <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
        </Button>
        <h1 className="text-xl font-bold">Repayments</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your installment schedule</p>
      </div>

      {/* Summary Card */}
      {loading ? (
        <Skeleton className="h-40 w-full rounded-xl mb-6" />
      ) : summary ? (
        <Card className="rounded-xl mb-6 border-0 bg-gradient-to-br from-emerald-600 to-emerald-700 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-emerald-100">Loan Summary — {summary.planName}</h2>
              <Badge className="bg-white/20 text-white border-0 text-[10px]">DEMO</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-emerald-200">Principal</p>
                <p className="text-lg font-bold">{summary.principal}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-200">Interest</p>
                <p className="text-lg font-bold">{summary.interest}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-200">Total Paid</p>
                <p className="text-lg font-bold">{formatTaka(summary.paid)}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-200">Remaining</p>
                <p className="text-lg font-bold">{formatTaka(summary.remaining)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl mb-6 p-6 text-center">
          <CreditCard className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No active loan. Apply for a loan first.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push('/dashboard/apply')}>Apply Now</Button>
        </Card>
      )}

      {/* Repayment Schedule */}
      <Card className="rounded-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Installment Schedule</CardTitle>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={fetchData}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-12 w-full rounded" />)}</div>
          ) : repayments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <CreditCard className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No repayments found</p>
            </div>
          ) : (
            <>
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">#</TableHead>
                      <TableHead className="text-xs">Due Amount</TableHead>
                      <TableHead className="text-xs">Paid</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Due Date</TableHead>
                      <TableHead className="text-xs text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repayments.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm py-3 font-medium">{r.installmentNumber}</TableCell>
                        <TableCell className="text-sm py-3">{r.dueAmountFormatted}</TableCell>
                        <TableCell className="text-sm py-3">{r.paidAmountFormatted}</TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className={`text-[10px] ${getStatusBadge(r.status)}`}>{r.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm py-3 text-muted-foreground">
                          {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell className="text-right py-3">
                          {(r.status === 'PENDING' || r.status === 'OVERDUE') && (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              disabled={paying === r.id}
                              onClick={() => handlePay(r.id)}
                            >
                              {paying === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Simulate Payment'}
                            </Button>
                          )}
                          {(r.status === 'PAID' || r.status === 'DEMO_PAID') && (
                            <CheckCircle className="h-4 w-4 text-emerald-500 ml-auto" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {/* Mobile Cards */}
              <div className="sm:hidden divide-y">
                {repayments.map((r) => (
                  <div key={r.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Installment #{r.installmentNumber}</span>
                      <Badge variant="outline" className={`text-[10px] ${getStatusBadge(r.status)}`}>{r.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div><span className="text-xs text-muted-foreground">Due:</span> <span className="font-medium">{r.dueAmountFormatted}</span></div>
                      <div><span className="text-xs text-muted-foreground">Paid:</span> <span className="font-medium">{r.paidAmountFormatted}</span></div>
                    </div>
                    {(r.status === 'PENDING' || r.status === 'OVERDUE') && (
                      <Button
                        size="sm"
                        className="w-full h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        disabled={paying === r.id}
                        onClick={() => handlePay(r.id)}
                      >
                        {paying === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Simulate Payment'}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
