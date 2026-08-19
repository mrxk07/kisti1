'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { LifeBuoy, AlertCircle, Eye, ChevronLeft, ChevronRight, Send, Loader2, MessageSquare } from 'lucide-react';

interface TicketItem {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  subject: string;
  status: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface TicketMessage {
  id: string;
  userId: string;
  message: string;
  isAdmin: boolean;
  createdAt: string;
  user?: { name: string | null };
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-cyan-100 text-cyan-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  RESOLVED: 'bg-green-100 text-green-800',
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [reply, setReply] = useState('');
  const [replying, setReplying] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [ticketStatus, setTicketStatus] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter !== 'ALL') params.set('status', statusFilter);

    try {
      const res = await fetch(`/api/admin/support?${params}`);
      const data = await res.json();
      if (data.success) {
        setTickets(data.data.tickets);
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
    fetchTickets();
  }, [fetchTickets]);

  const openTicket = async (ticket: TicketItem) => {
    setSelectedTicket(ticket);
    setTicketStatus(ticket.status);
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/support/${ticket.id}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.data.messages || []);
      }
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleReply = async () => {
    if (!reply.trim() || !selectedTicket) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/admin/support/${selectedTicket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: reply.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setReply('');
        setMessages((prev) => [
          ...prev,
          { id: data.data.id, userId: '', message: data.data.message, isAdmin: true, createdAt: data.data.createdAt },
        ]);
        toast.success('Reply sent');
      } else {
        toast.error(data.error || 'Failed to reply');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setReplying(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket || newStatus === selectedTicket.status) return;
    setChangingStatus(true);
    try {
      const res = await fetch(`/api/admin/support/${selectedTicket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setTicketStatus(newStatus);
        setSelectedTicket({ ...selectedTicket, status: newStatus });
        toast.success(`Status changed to ${newStatus}`);
        fetchTickets();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setChangingStatus(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <LifeBuoy className="h-5 w-5 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Support Tickets</h1>
          <p className="text-sm text-slate-500">Manage user support requests</p>
        </div>
      </div>

      <div className="mb-4">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
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
                  <TableHead className="text-xs">Subject</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs text-center hidden sm:table-cell">Msgs</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Created</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-slate-500">No tickets found</TableCell></TableRow>
                )}
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="text-xs text-slate-500 font-mono">{ticket.id.slice(0, 8)}...</TableCell>
                    <TableCell className="text-sm font-medium">{ticket.userName || '—'}</TableCell>
                    <TableCell className="text-sm max-w-[180px] truncate">{ticket.subject}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[ticket.status] || ''}>{ticket.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-center hidden sm:table-cell">{ticket.messageCount}</TableCell>
                    <TableCell className="text-xs text-slate-500 hidden md:table-cell">{new Date(ticket.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openTicket(ticket)}>
                        <Eye className="h-4 w-4 text-slate-500" />
                      </Button>
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

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => { if (!open) { setSelectedTicket(null); setMessages([]); } }}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4 text-emerald-600" />
              {selectedTicket?.subject}
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500">From: <strong>{selectedTicket?.userName || '—'}</strong></span>
            <Badge variant="secondary" className={statusColors[ticketStatus] || ''}>{ticketStatus}</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs text-slate-500 whitespace-nowrap">Change Status:</Label>
            <Select value={ticketStatus} onValueChange={handleStatusChange} disabled={changingStatus}>
              <SelectTrigger className="h-8 text-xs">
                {changingStatus && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <ScrollArea className="flex-1 min-h-0">
            {messagesLoading && <Skeleton className="h-32" />}
            {!messagesLoading && messages.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No messages yet</p>
            )}
            <div className="space-y-3 pr-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-lg p-3 text-sm ${msg.isAdmin ? 'bg-emerald-50 border border-emerald-100 ml-6' : 'bg-slate-50 border border-slate-100 mr-6'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-700">
                      {msg.isAdmin ? 'Admin' : msg.user?.name || 'User'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600 whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))}
            </div>
          </ScrollArea>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="admin-reply" className="text-xs">Admin Reply</Label>
            <div className="flex gap-2">
              <Textarea
                id="admin-reply"
                placeholder="Type your reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
            <Button
              onClick={handleReply}
              disabled={replying || !reply.trim()}
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {replying && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              <Send className="h-4 w-4 mr-1.5" />
              Send Reply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
