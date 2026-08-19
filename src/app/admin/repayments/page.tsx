'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatTaka } from '@/lib/constants';
import { Receipt, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface RepaymentItem {
  id: string;
  userId: string;
  userName: string | null;
  applicationId: string;
  planName: string | null;
  installmentNumber: number;
  dueAmount: number;
  dueAmountFormatted: string;
  paidAmount: number;
  paidAmountFormatted: string;
  status: string;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  DEMO_PAID: 'bg-blue-100 text-blue-800',
};

export default function AdminRepaymentsPage() {
  const [repayments, setRepayments] = useState<RepaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRepayments = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter !== 'ALL') params.set('status', statusFilter);

    try {
      const res = await fetch(`/api/admin/repayments?${params}`);
      const data = await res.json();
      if (data.success) {
        setRepayments(data.data.repayments);
        setTotalPages(data.data.pagination.pages);
      } else {
        setError(data.error || 'Failed to load');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchRepayments();
  }, [fetchRepayments]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <Receipt className="h-5 w-5 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Repayments</h1>
          <p className="text-sm text-slate-500">All installment repayments</p>
        </div>
      </div>

      <div className="mb-4">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="DEMO_PAID">Demo Paid</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <Card><CardContent className="p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 mb-2" />)}</CardContent></Card>
      )}

      {error && !loading && (
        <Card><CardContent className="p-6 text-center"><AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" /><p className="text-sm text-red-600">{error}</p></CardContent></Card>
      )}

      {!loading && !error && (
        <Card>
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs text-center hidden sm:table-cell">Inst#</TableHead>
                  <TableHead className="text-xs text-right">Due</TableHead>
                  <TableHead className="text-xs text-right">Paid</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repayments.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-slate-500">No repayments found</TableCell></TableRow>
                )}
                {repayments.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs text-slate-500 font-mono">{r.id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-sm font-medium">{r.userName || '—'}</TableCell>
                    <TableCell className="text-sm text-center hidden sm:table-cell">{r.installmentNumber}</TableCell>
                    <TableCell className="text-sm text-right">{r.dueAmountFormatted}</TableCell>
                    <TableCell className={`text-sm text-right font-medium ${r.paidAmount > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {r.paidAmountFormatted}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[r.status] || ''}>{r.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 hidden md:table-cell">
                      {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
