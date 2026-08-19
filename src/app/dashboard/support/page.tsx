'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  MessageSquare,
  Send,
  Loader2,
  ChevronLeft,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

function getStatusBadge(status: string) {
  const map: Record<string, string> = {
    OPEN: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    RESOLVED: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return map[status] || 'bg-slate-100 text-slate-800 border-slate-200';
}

export default function SupportPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');

  // Ticket detail view
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/support?limit=50');
      const json = await res.json();
      if (json.success) {
        setTickets(json.data.tickets);
      } else {
        setError(json.error || 'Failed to fetch tickets');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const fetchMessages = async (ticketId: string) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/support/${ticketId}`);
      const json = await res.json();
      if (json.success) {
        setSelectedTicket(json.data);
        setMessages(json.data.messages);
      }
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleCreate = async () => {
    if (!newSubject.trim() || !newMessage.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: newSubject, message: newMessage }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('Ticket created successfully!');
        setCreateOpen(false);
        setNewSubject('');
        setNewMessage('');
        fetchTickets();
      } else {
        toast.error(json.error || 'Failed to create ticket');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setCreating(false);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setReplying(true);
    try {
      const res = await fetch(`/api/support/${selectedTicket.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: replyText }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages((prev) => [...prev, json.data]);
        setReplyText('');
        toast.success('Reply sent!');
      } else {
        toast.error(json.error || 'Reply failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setReplying(false);
    }
  };

  // Ticket Detail View
  if (selectedTicket) {
    return (
      <div className="py-2">
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="-ml-2 text-muted-foreground">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Tickets
          </Button>
          <h1 className="text-lg font-bold mt-1">{selectedTicket.subject}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={`text-[10px] ${getStatusBadge(selectedTicket.status)}`}>
              {selectedTicket.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Created {new Date(selectedTicket.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <Card className="rounded-xl">
          <CardContent className="p-4 sm:p-6">
            {loadingMessages ? (
              <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
            ) : (
              <ScrollArea className="max-h-96 mb-4">
                <div className="space-y-4">
                  {messages.map((msg: any) => (
                    <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[80%] rounded-xl p-3 ${msg.isAdmin ? 'bg-slate-100' : 'bg-emerald-50 border border-emerald-200'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold">{msg.isAdmin ? 'Support Team' : msg.senderName || 'You'}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(msg.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">{msg.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {selectedTicket.status !== 'RESOLVED' && (
              <>
                <Separator className="mb-3" />
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleReply()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleReply}
                    disabled={!replyText.trim() || replying}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                    size="icon"
                  >
                    {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Ticket List View
  return (
    <div className="py-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="-ml-2 text-muted-foreground mb-1">
            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
          </Button>
          <h1 className="text-xl font-bold">Support</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Get help with your demo account</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" /> New Ticket
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <AlertCircle className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchTickets}>Retry</Button>
        </div>
      ) : tickets.length === 0 ? (
        <Card className="rounded-xl p-8 text-center">
          <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No support tickets</h3>
          <p className="text-sm text-muted-foreground mb-4">Create a ticket if you need help with anything.</p>
          <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Create Ticket
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="rounded-xl hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => fetchMessages(ticket.id)}
            >
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold truncate">{ticket.subject}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span>{ticket.messageCount} {ticket.messageCount === 1 ? 'message' : 'messages'}</span>
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] shrink-0 ${getStatusBadge(ticket.status)}`}>
                  {ticket.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Ticket Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>Describe your issue and we will get back to you.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ticket-subject">Subject</Label>
              <Input
                id="ticket-subject"
                placeholder="Brief description of your issue"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-message">Message</Label>
              <Textarea
                id="ticket-message"
                placeholder="Describe your issue in detail..."
                rows={4}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !newSubject.trim() || !newMessage.trim()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
