'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronRight,
  Upload,
  X,
  FileCheck,
  Loader2,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { formatTaka } from '@/lib/constants';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  principalFormatted: string;
  interestFormatted: string;
  totalFormatted: string;
  interestRate: string;
}

interface VerificationStatus {
  id: string;
  status: string;
  hasFrontDocument: boolean;
  hasBackDocument: boolean;
}

const STEPS = ['Select Plan', 'Upload Documents', 'Review & Submit'];

export default function ApplyPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [verifLoading, setVerifLoading] = useState(true);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedApp, setSubmittedApp] = useState<any>(null);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/plans')
      .then((r) => r.json())
      .then((j) => { if (j.success) setPlans(j.data); })
      .catch(() => {})
      .finally(() => setPlansLoading(false));
  }, []);

  const checkVerification = useCallback(() => {
    setVerifLoading(true);
    fetch('/api/verification')
      .then((r) => r.json())
      .then((j) => { if (j.success) setVerification(j.data); })
      .catch(() => {})
      .finally(() => setVerifLoading(false));
  }, []);

  useEffect(() => {
    checkVerification();
  }, [checkVerification]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      toast.error('Invalid file type. Use JPG, PNG, WEBP, or PDF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Maximum 5MB.');
      return;
    }
    if (side === 'front') setFrontFile(file);
    else setBackFile(file);
  };

  const handleUpload = async () => {
    if (!frontFile || !backFile) {
      toast.error('Please select both front and back documents.');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('frontDocument', frontFile);
      fd.append('backDocument', backFile);
      const res = await fetch('/api/verification', { method: 'POST', body: fd });
      const json = await res.json();
      if (json.success) {
        toast.success('Documents uploaded and verified! (Demo auto-approve)');
        setVerification(json.data);
        setStep(2);
      } else {
        toast.error(json.error || 'Upload failed');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitApplication = async () => {
    if (!selectedPlan) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan.id }),
      });
      const json = await res.json();
      if (json.success) {
        setSubmitted(true);
        setSubmittedApp(json.data);
        toast.success('Application submitted successfully!');
      } else {
        toast.error(json.error || 'Application failed');
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isVerified = verification?.status === 'VERIFIED';

  // Success state
  if (submitted && submittedApp) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <Card className="rounded-xl border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <FileCheck className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your application for <strong>{submittedApp.planName}</strong> has been submitted.
              {submittedApp.principalFormatted} has been credited to your demo balance.
            </p>
            <div className="bg-slate-50 rounded-lg p-4 mb-6 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">PENDING</Badge></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Principal</span><span className="font-medium">{submittedApp.principalFormatted}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total Repayable</span><span className="font-medium">{submittedApp.totalFormatted}</span></div>
            </div>
            <Button onClick={() => router.push('/dashboard')} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-2">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="mb-3 -ml-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
        </Button>
        <h1 className="text-xl font-bold">Apply for a Loan</h1>
        <p className="text-sm text-muted-foreground mt-1">Complete the steps below to submit your application (demo)</p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center">
              <span className={`text-xs font-medium ${i <= step ? 'text-emerald-600' : 'text-muted-foreground'}`}>{s}</span>
              {i < STEPS.length - 1 && <ChevronRight className="h-3.5 w-3.5 mx-2 text-muted-foreground" />}
            </div>
          ))}
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
      </div>

      {/* Step 0: Select Plan */}
      {step === 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Select a Loan Plan</h2>
          {plansLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          ) : plans.length === 0 ? (
            <Card className="rounded-xl p-8 text-center">
              <p className="text-sm text-muted-foreground">No plans available at the moment.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {plans.map((plan) => (
                <Card
                  key={plan.id}
                  className={`rounded-xl cursor-pointer transition-all hover:shadow-md ${
                    selectedPlan?.id === plan.id
                      ? 'border-2 border-emerald-500 ring-1 ring-emerald-500/20'
                      : 'border hover:border-emerald-300'
                  }`}
                  onClick={() => setSelectedPlan(plan)}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{plan.name}</h3>
                          <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700">DEMO</Badge>
                        </div>
                        <div className="text-2xl font-bold text-emerald-600">{plan.principalFormatted}</div>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${selectedPlan?.id === plan.id ? 'border-emerald-500 bg-emerald-500' : 'border-muted-foreground/30'}">
                        {selectedPlan?.id === plan.id && <Check className="h-3 w-3 text-white" />}
                      </div>
                    </div>
                    <Separator className="my-3" />
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div><p className="text-xs text-muted-foreground">Interest Rate</p><p className="font-medium">{plan.interestRate}</p></div>
                      <div><p className="text-xs text-muted-foreground">Interest</p><p className="font-medium">{plan.interestFormatted}</p></div>
                      <div><p className="text-xs text-muted-foreground">Total</p><p className="font-medium">{plan.totalFormatted}</p></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          <div className="flex justify-end pt-2">
            <Button
              onClick={() => {
                if (!selectedPlan) { toast.error('Please select a plan'); return; }
                if (isVerified) { setStep(2); } else { setStep(1); }
              }}
              disabled={!selectedPlan}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 1: Upload Documents */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-semibold">Upload Identity Documents</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upload front and back of your ID document. In demo mode, verification is automatic.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Front Document */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Front Side</Label>
              <div
                className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
                onClick={() => frontRef.current?.click()}
              >
                {frontFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileCheck className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-medium truncate">{frontFile.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); setFrontFile(null); }} className="text-muted-foreground hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                    <p className="text-sm text-muted-foreground">Click to upload</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, PDF (max 5MB)</p>
                  </div>
                )}
              </div>
              <input ref={frontRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => handleFileSelect(e, 'front')} />
            </div>

            {/* Back Document */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Back Side</Label>
              <div
                className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
                onClick={() => backRef.current?.click()}
              >
                {backFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileCheck className="h-5 w-5 text-emerald-600" />
                    <span className="text-sm font-medium truncate">{backFile.name}</span>
                    <button onClick={(e) => { e.stopPropagation(); setBackFile(null); }} className="text-muted-foreground hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                    <p className="text-sm text-muted-foreground">Click to upload</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, PDF (max 5MB)</p>
                  </div>
                )}
              </div>
              <input ref={backRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => handleFileSelect(e, 'back')} />
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(0)}>Back</Button>
            <Button onClick={handleUpload} disabled={!frontFile || !backFile || submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading...</> : 'Upload & Continue'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Review & Submit */}
      {step === 2 && selectedPlan && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-semibold">Review & Submit</h2>
            <p className="text-sm text-muted-foreground mt-1">Review your selection before submitting the application.</p>
          </div>

          {/* Verification Status */}
          {verifLoading ? (
            <Skeleton className="h-16 rounded-xl" />
          ) : (
            <div className={`flex items-center gap-3 p-4 rounded-xl ${isVerified ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
              <ShieldCheck className={`h-5 w-5 shrink-0 ${isVerified ? 'text-emerald-600' : 'text-amber-600'}`} />
              <div>
                <p className="text-sm font-medium">Identity Verification</p>
                <p className="text-xs text-muted-foreground">
                  {isVerified ? 'Verified — you can proceed with your application.' : 'Not verified. Please complete verification first.'}
                </p>
              </div>
              {isVerified && <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-0">VERIFIED</Badge>}
            </div>
          )}

          {/* Plan Summary */}
          <Card className="rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Plan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Plan</span><span className="font-medium">{selectedPlan.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Principal Amount</span><span className="font-medium">{selectedPlan.principalFormatted}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Interest ({selectedPlan.interestRate})</span><span className="font-medium">{selectedPlan.interestFormatted}</span></div>
              <Separator />
              <div className="flex justify-between text-sm font-semibold"><span>Total Repayable</span><span className="text-emerald-600">{selectedPlan.totalFormatted}</span></div>
            </CardContent>
          </Card>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => { if (isVerified) setStep(0); else setStep(1); }}>Back</Button>
            <Button
              onClick={handleSubmitApplication}
              disabled={!isVerified || submitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</> : 'Submit Application'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}