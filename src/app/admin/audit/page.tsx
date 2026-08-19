'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollText, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditLogItem {
  id: string;
  userId: string | null;
  userName: string | null;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

const actionColors: Record<string, string> = {
  ADMIN_LOGIN: 'bg-red-100 text-red-800',
  CREATE_PLAN: 'bg-emerald-100 text-emerald-800',
  UPDATE_PLAN: 'bg-amber-100 text-amber-800',
  APPROVE_APPLICATION: 'bg-green-100 text-green-800',
  REJECT_APPLICATION: 'bg-red-100 text-red-800',
  ADMIN_REPLY_TICKET: 'bg-blue-100 text-blue-800',
  CHANGE_TICKET_STATUS: 'bg-violet-100 text-violet-800',
  RESET_USER_ACCOUNT: 'bg-orange-100 text-orange-800',
};

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), limit: '50' });

    try {
      const res = await fetch(`/api/admin/audit?${params}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs);
        setTotalPages(data.data.pagination.pages);
      } else {
        setError(data.error || 'Failed to load');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <TooltipProvider>
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <ScrollText className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Audit Logs</h1>
            <p className="text-sm text-slate-500">System activity and admin actions</p>
          </div>
        </div>

        {loading && (
          <Card><CardContent className="p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 mb-2" />)}</CardContent></Card>
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
                    <TableHead className="text-xs w-40">Timestamp</TableHead>
                    <TableHead className="text-xs">User</TableHead>
                    <TableHead className="text-xs">Action</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Details</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-sm text-slate-500">No audit logs found</TableCell></TableRow>
                  )}
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm font-medium">{log.userName || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={actionColors[log.action] || 'bg-slate-100 text-slate-800'}>
                          {formatAction(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500 hidden lg:table-cell max-w-[300px]">
                        {log.details ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-default truncate block">{log.details.length > 60 ? log.details.slice(0, 60) + '...' : log.details}</span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md">
                              <p className="text-xs">{log.details}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400 font-mono hidden md:table-cell">
                        {log.ipAddress ? log.ipAddress.slice(0, 12) + '...' : '—'}
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
    </TooltipProvider>
  );
}
