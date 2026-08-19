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
import { ArrowLeftRight, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface TransactionItem {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  type: string;
  amount: number;
  amountFormatted: string;
  description: string | null;
  status: string;
  referenceId: string | null;
  createdAt: string;
}

const typeColors: Record<string, string> = {
  DEMO_LOAN_CREDIT: 'bg-emerald-100 text-emerald-800',
  DEMO_INTEREST: 'bg-amber-100 text-amber-800',
  DEMO_REPAYMENT: 'bg-blue-100 text-blue-800',
  ADJUSTMENT: 'bg-slate-100 text-slate-800',
};

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  FAILED: 'bg-red-100 text-red-800',
};

const typeLabels: Record<string, string> = {
  DEMO_LOAN_CREDIT: 'Loan Credit',
  DEMO_INTEREST: 'Interest',
  DEMO_REPAYMENT: 'Repayment',
  ADJUSTMENT: 'Adjustment',
};

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (typeFilter !== 'ALL') params.set('type', typeFilter);

    try {
      const res = await fetch(`/api/admin/transactions?${params}`);
      const data = await res.json();
      if (data.success) {
        setTransactions(data.data.transactions);
        setTotalPages(data.data.pagination.pages);
      } else {
        setError(data.error || 'Failed to load');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <ArrowLeftRight className="h-5 w-5 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Transactions</h1>
          <p className="text-sm text-slate-500">All platform transactions</p>
        </div>
      </div>

      <div className="mb-4">
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="DEMO_LOAN_CREDIT">Loan Credit</SelectItem>
            <SelectItem value="DEMO_INTEREST">Interest</SelectItem>
            <SelectItem value="DEMO_REPAYMENT">Repayment</SelectItem>
            <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
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
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Description</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-slate-500">No transactions found</TableCell></TableRow>
                )}
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs text-slate-500 font-mono">{tx.id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-sm font-medium">{tx.userName || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={typeColors[tx.type] || ''}>
                        {typeLabels[tx.type] || tx.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-right font-medium">{tx.amountFormatted}</TableCell>
                    <TableCell className="text-xs text-slate-500 hidden lg:table-cell max-w-[200px] truncate">{tx.description || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[tx.status] || ''}>{tx.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 hidden md:table-cell">{new Date(tx.createdAt).toLocaleDateString()}</TableCell>
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
