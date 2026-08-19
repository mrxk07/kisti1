'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { formatTaka } from '@/lib/constants';
import { toast } from 'sonner';
import { Landmark, Plus, AlertCircle, Loader2 } from 'lucide-react';

interface PlanItem {
  id: string;
  name: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { applications: number };
}

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPrincipal, setFormPrincipal] = useState('');
  const [formInterest, setFormInterest] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/plans?active=false');
      const data = await res.json();
      if (data.success) {
        setPlans(data.data);
      } else {
        setError(data.error || 'Failed to load plans');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const totalCalc = (() => {
    const p = parseFloat(formPrincipal) || 0;
    const i = parseFloat(formInterest) || 0;
    return p + i;
  })();

  const handleCreate = async () => {
    if (!formName.trim()) { toast.error('Plan name is required'); return; }
    const principal = parseFloat(formPrincipal);
    const interest = parseFloat(formInterest);
    if (isNaN(principal) || principal <= 0) { toast.error('Valid principal amount required'); return; }
    if (isNaN(interest) || interest < 0) { toast.error('Valid interest amount required'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), principalAmount: principal, interestAmount: interest, totalAmount: principal + interest, active: true }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Plan created successfully');
        setDialogOpen(false);
        setFormName('');
        setFormPrincipal('');
        setFormInterest('');
        fetchPlans();
      } else {
        toast.error(data.error || 'Failed to create plan');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (plan: PlanItem) => {
    setTogglingId(plan.id);
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: plan.id, active: !plan.active }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Plan ${!plan.active ? 'activated' : 'deactivated'}`);
        fetchPlans();
      } else {
        toast.error(data.error || 'Failed to update');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Landmark className="h-5 w-5 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Loan Plans</h1>
            <p className="text-sm text-slate-500">Manage available loan plans</p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-1.5" /> New Plan
        </Button>
      </div>

      {loading && (
        <Card><CardContent className="p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 mb-2" />)}</CardContent></Card>
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
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs text-right">Principal</TableHead>
                  <TableHead className="text-xs text-right hidden sm:table-cell">Interest</TableHead>
                  <TableHead className="text-xs text-right">Total</TableHead>
                  <TableHead className="text-xs text-center hidden sm:table-cell">Apps</TableHead>
                  <TableHead className="text-xs text-center">Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-sm text-slate-500">No plans found</TableCell></TableRow>
                )}
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="text-sm font-medium">{plan.name}</TableCell>
                    <TableCell className="text-sm text-right">{formatTaka(plan.principalAmount)}</TableCell>
                    <TableCell className="text-sm text-right hidden sm:table-cell">{formatTaka(plan.interestAmount)}</TableCell>
                    <TableCell className="text-sm text-right font-semibold">{formatTaka(plan.totalAmount)}</TableCell>
                    <TableCell className="text-sm text-center hidden sm:table-cell">{plan._count.applications}</TableCell>
                    <TableCell className="text-center">
                      {togglingId === plan.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mx-auto text-slate-400" />
                      ) : (
                        <Switch
                          checked={plan.active}
                          onCheckedChange={() => handleToggle(plan)}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Create Plan Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Create Loan Plan</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="plan-name">Plan Name</Label>
              <Input
                id="plan-name"
                placeholder="e.g., Quick Cash 5000"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="mt-1.5"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="plan-principal">Principal (৳)</Label>
                <Input
                  id="plan-principal"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="5000"
                  value={formPrincipal}
                  onChange={(e) => setFormPrincipal(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="plan-interest">Interest (৳)</Label>
                <Input
                  id="plan-interest"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="500"
                  value={formInterest}
                  onChange={(e) => setFormInterest(e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 flex items-center justify-between">
              <span className="text-sm text-emerald-700 font-medium">Total Amount</span>
              <span className="text-lg font-bold text-emerald-700">{formatTaka(totalCalc)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700">
              {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
