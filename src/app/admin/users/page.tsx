'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { formatTaka } from '@/lib/constants';
import { toast } from 'sonner';
import { Users, Search, RotateCcw, Eye, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface UserItem {
  id: string;
  name: string | null;
  email: string | null;
  mobile: string | null;
  role: string;
  balance: number;
  isDemo: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { applications: number; transactions: number; supportTickets: number };
}

interface UserDetail extends UserItem {
  ipHash: string | null;
  _count: { applications: number; transactions: number; repayments: number; notifications: number; supportTickets: number; demoSessions: number };
}

const roleColors: Record<string, string> = {
  DEMO: 'bg-amber-100 text-amber-800',
  USER: 'bg-blue-100 text-blue-800',
  ADMIN: 'bg-red-100 text-red-800',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Reset dialog
  const [resetUser, setResetUser] = useState<UserItem | null>(null);
  const [resetting, setResetting] = useState(false);

  // Profile dialog
  const [profileUser, setProfileUser] = useState<UserDetail | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (roleFilter !== 'ALL') params.set('role', roleFilter);
    if (search.trim()) params.set('search', search.trim());

    try {
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.users);
        setTotalPages(data.data.pagination.pages);
      } else {
        setError(data.error || 'Failed to load users');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleReset = async () => {
    if (!resetUser) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/users/${resetUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Account reset successfully');
        setResetUser(null);
        fetchUsers();
      } else {
        toast.error(data.error || 'Reset failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setResetting(false);
    }
  };

  const viewProfile = async (userId: string) => {
    setProfileLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      const data = await res.json();
      if (data.success) {
        setProfileUser(data.data);
      } else {
        toast.error(data.error || 'Failed to load user');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <Users className="h-5 w-5 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500">Manage demo and registered users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, or mobile..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            <SelectItem value="DEMO">Demo</SelectItem>
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && (
        <Card>
          <CardContent className="p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 mb-2" />
            ))}
          </CardContent>
        </Card>
      )}

      {error && !loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <Card>
          <div className="max-h-96 overflow-y-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                  <TableHead className="text-xs text-right">Balance</TableHead>
                  <TableHead className="text-xs text-right hidden sm:table-cell">Apps</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Created</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-sm text-slate-500">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
                {users.map((user) => (
                  <TableRow key={user.id} className="cursor-pointer" onClick={() => viewProfile(user.id)}>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {user.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell className="text-sm font-medium">{user.name || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={roleColors[user.role] || ''}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-right font-medium">{formatTaka(user.balance)}</TableCell>
                    <TableCell className="text-sm text-right hidden sm:table-cell">{user._count.applications}</TableCell>
                    <TableCell className="text-xs text-slate-500 hidden md:table-cell">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => { e.stopPropagation(); viewProfile(user.id); }}
                        >
                          <Eye className="h-4 w-4 text-slate-500" />
                        </Button>
                        {user.role !== 'ADMIN' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => { e.stopPropagation(); setResetUser(user); }}
                          >
                            <RotateCcw className="h-4 w-4 text-red-500" />
                          </Button>
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
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Profile Dialog */}
      <Dialog open={!!profileUser} onOpenChange={(open) => { if (!open) setProfileUser(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          {profileLoading && <Skeleton className="h-48" />}
          {profileUser && !profileLoading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><Label className="text-slate-500">Name</Label><p className="font-medium mt-0.5">{profileUser.name || '—'}</p></div>
                <div><Label className="text-slate-500">Email</Label><p className="font-medium mt-0.5">{profileUser.email || '—'}</p></div>
                <div><Label className="text-slate-500">Mobile</Label><p className="font-medium mt-0.5">{profileUser.mobile || '—'}</p></div>
                <div><Label className="text-slate-500">Role</Label><p className="font-medium mt-0.5"><Badge variant="secondary" className={roleColors[profileUser.role] || ''}>{profileUser.role}</Badge></p></div>
                <div><Label className="text-slate-500">Balance</Label><p className="font-medium mt-0.5">{formatTaka(profileUser.balance)}</p></div>
                <div><Label className="text-slate-500">Demo</Label><p className="font-medium mt-0.5">{profileUser.isDemo ? 'Yes' : 'No'}</p></div>
              </div>
              <Separator />
              <div className="grid grid-cols-3 gap-3 text-center text-sm">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-lg font-bold text-slate-900">{profileUser._count.applications}</p>
                  <p className="text-xs text-slate-500">Applications</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-lg font-bold text-slate-900">{profileUser._count.transactions}</p>
                  <p className="text-xs text-slate-500">Transactions</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-lg font-bold text-slate-900">{profileUser._count.supportTickets}</p>
                  <p className="text-xs text-slate-500">Tickets</p>
                </div>
              </div>
              <div className="text-xs text-slate-400">
                Created: {new Date(profileUser.createdAt).toLocaleString()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation */}
      <AlertDialog open={!!resetUser} onOpenChange={(open) => { if (!open) setResetUser(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Demo Account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all applications, transactions, repayments, and support tickets
              for <strong>{resetUser?.name || resetUser?.email || 'this user'}</strong> and reset their balance to 0.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={resetting}
              className="bg-red-600 hover:bg-red-700"
            >
              {resetting ? 'Resetting...' : 'Reset Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
