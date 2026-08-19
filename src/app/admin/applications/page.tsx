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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { formatTaka } from '@/lib/constants';
import { toast } from 'sonner';
import { FileText, AlertCircle, CheckCircle2, XCircle, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface ApplicationItem {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  planName: string;
  status: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  principalFormatted: string;
  totalFormatted: string;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  VERIFICATION: 'bg-cyan-100 text-cyan-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
};

const statusOptions = [
  { value: 'ALL', label: 'All Status' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'VERIFICATION', label: 'Verification' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'COMPLETED', label: 'Completed' },
];

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [actionDialog, setActionDialog] = useState<{ app: ApplicationItem; action: 'APPROVE' | 'REJECT' } | null>(null);
  const [acting, setActing] = useState(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter !== 'ALL') params.set('status', statusFilter);

    try {
      const res = await fetch(`/api/admin/applications?${params}`);
      const data = await res.json();
      if (data.success) {
        setApplications(data.data.applications);
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
    fetchApplications();
  }, [fetchApplications]);

  const handleAction = async () => {
    if (!actionDialog) return;
    setActing(true);
    try {
      const res = await fetch(`/api/admin/applications/${actionDialog.app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionDialog.action }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Application ${actionDialog.action === 'APPROVE' ? 'approved' : 'rejected'}`);
        setActionDialog(null);
        fetchApplications();
      } else {
        toast.error(data.error || 'Action failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setActing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <FileText className="h-5 w-5 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Applications</h1>
          <p className="text-sm text-slate-500">Review and manage loan applications</p>
        </div>
      </div>

      <div className="mb-4">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
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
                  <TableHead className="text-xs hidden sm:table-cell">Plan</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Created</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-slate-500">No applications found</TableCell></TableRow>
                )}
                {applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="text-xs text-slate-500 font-mono">{app.id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-sm font-medium">{app.userName || '—'}</TableCell>
                    <TableCell className="text-sm hidden sm:table-cell">{app.planName}</TableCell>
                    <TableCell className="text-sm text-right font-medium">{app.totalFormatted}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[app.status] || ''}>{app.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 hidden md:table-cell">{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedApp(app)}>
                          <Eye className="h-4 w-4 text-slate-500" />
                        </Button>
                        {app.status === 'PENDING' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setActionDialog({ app, action: 'APPROVE' })}
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setActionDialog({ app, action: 'REJECT' })}
                            >
                              <XCircle className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
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

      {/* Detail Dialog */}
      <Dialog open={!!selectedApp} onOpenChange={(open) => { if (!open) setSelectedApp(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Application Details</DialogTitle></DialogHeader>
          {selectedApp && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className={statusColors[selectedApp.status] || ''}>{selectedApp.status}</Badge>
                <span className="text-xs text-slate-400">{selectedApp.id.slice(0, 12)}...</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><Label className="text-slate-500">User</Label><p className="font-medium mt-0.5">{selectedApp.userName || '—'}</p></div>
                <div><Label className="text-slate-500">Email</Label><p className="font-medium mt-0.5">{selectedApp.userEmail || '—'}</p></div>
                <div><Label className="text-slate-500">Plan</Label><p className="font-medium mt-0.5">{selectedApp.planName}</p></div>
                <div><Label className="text-slate-500">Status</Label><p className="font-medium mt-0.5"><Badge variant="secondary" className={statusColors[selectedApp.status] || ''}>{selectedApp.status}</Badge></p></div>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-sm font-bold text-slate-900">{formatTaka(selectedApp.principalAmount)}</p>
                  <p className="text-xs text-slate-500">Principal</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-sm font-bold text-slate-900">{formatTaka(selectedApp.interestAmount)}</p>
                  <p className="text-xs text-slate-500">Interest</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-sm font-bold text-emerald-700">{selectedApp.totalFormatted}</p>
                  <p className="text-xs text-emerald-600">Total</p>
                </div>
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <p>Created: {new Date(selectedApp.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(selectedApp.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation */}
      <AlertDialog open={!!actionDialog} onOpenChange={(open) => { if (!open) setActionDialog(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog?.action === 'APPROVE' ? 'Approve Application?' : 'Reject Application?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog?.action === 'APPROVE'
                ? `This will approve the loan for ${actionDialog?.app.userName || 'this user'} (${formatTaka(actionDialog?.app.totalAmount)}). A repayment schedule will be created.`
                : `This will reject the loan application from ${actionDialog?.app.userName || 'this user'}. The user will be notified.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={acting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={acting}
              className={actionDialog?.action === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {acting ? 'Processing...' : actionDialog?.action === 'APPROVE' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
