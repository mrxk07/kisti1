'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Receipt, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    COMPLETED: 'bg-sky-100 text-sky-800 border-sky-200',
    FAILED: 'bg-red-100 text-red-800 border-red-200',
  };
  return map[status] || 'bg-slate-100 text-slate-800 border-slate-200';
}

function getTypeBadge(type: string) {
  const map: Record<string, string> = {
    DEMO_LOAN_CREDIT: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    DEMO_INTEREST: 'bg-amber-100 text-amber-700 border-amber-200',
    DEMO_REPAYMENT: 'bg-purple-100 text-purple-700 border-purple-200',
    ADJUSTMENT: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return map[type] || 'bg-slate-100 text-slate-800 border-slate-200';
}

function formatType(type: string) {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(1);

  const fetchTransactions = useCallback(async (p: number, type: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (type !== 'all') params.set('type', type);
      const res = await fetch(`/api/transactions?${params}`);
      const json = await res.json();
      if (json.success) {
        setTransactions(json.data.transactions);
        setPagination(json.data.pagination);
      } else {
        setError(json.error || 'Failed to fetch');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions(page, typeFilter);
  }, [page, typeFilter, fetchTransactions]);

  return (
    <div className="py-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="-ml-2 text-muted-foreground mb-1">
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          <h1 className="text-xl font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">View all your demo transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="DEMO_LOAN_CREDIT">Loan Credit</SelectItem>
              <SelectItem value="DEMO_INTEREST">Interest</SelectItem>
              <SelectItem value="DEMO_REPAYMENT">Repayment</SelectItem>
              <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => fetchTransactions(page, typeFilter)}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="rounded-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded" />)}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Receipt className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={() => fetchTransactions(page, typeFilter)}>Retry</Button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Receipt className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                      <TableHead className="text-xs text-right">Amount</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm py-3">
                          {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className={`text-[10px] ${getTypeBadge(tx.type)}`}>{formatType(tx.type)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm py-3 max-w-[200px] truncate">{tx.description || '—'}</TableCell>
                        <TableCell className={`text-sm font-semibold text-right py-3 ${tx.isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
                          {tx.isCredit ? '+' : '-'}{tx.amountFormatted}
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className={`text-[10px] ${getStatusBadge(tx.status)}`}>{tx.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden divide-y">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-[10px] ${getTypeBadge(tx.type)}`}>{formatType(tx.type)}</Badge>
                      </div>
                      <p className="text-sm font-medium truncate">{tx.description || tx.type}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ${tx.isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
                      {tx.isCredit ? '+' : '-'}{tx.amountFormatted}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t">
                  <Button
                    variant="outline" size="sm" disabled={page <= 1}
                    onClick={() => setPage(page - 1)} className="h-8 text-xs"
                  >Previous</Button>
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline" size="sm" disabled={page >= pagination.pages}
                    onClick={() => setPage(page + 1)} className="h-8 text-xs"
                  >Next</Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
