'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShieldCheck,
  Upload,
  X,
  FileCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface VerificationData {
  id: string;
  status: string;
  hasFrontDocument: boolean;
  hasBackDocument: boolean;
}

function getStatusInfo(status: string) {
  switch (status) {
    case 'PENDING':
      return { label: 'Not Submitted', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: AlertCircle };
    case 'SUBMITTED':
      return { label: 'Submitted', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Upload };
    case 'VERIFIED':
      return { label: 'Verified', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 };
    case 'REJECTED':
      return { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle };
    default:
      return { label: status, color: 'bg-slate-100 text-slate-800 border-slate-200', icon: AlertCircle };
  }
}

export default function VerificationPage() {
  const router = useRouter();
  const [verification, setVerification] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const frontRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/verification');
      const json = await res.json();
      if (json.success) {
        setVerification(json.data);
      } else {
        setError(json.error || 'Failed to fetch verification status');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleSubmit = async () => {
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
        toast.success('Document Submitted — Demo Verification Successful!');
        setVerification(json.data);
        setFrontFile(null);
        setBackFile(null);
      } else {
        toast.error(json.error || 'Upload failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-2 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  const statusInfo = verification ? getStatusInfo(verification.status) : null;
  const isVerified = verification?.status === 'VERIFIED';

  return (
    <div className="py-2 max-w-xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')} className="-ml-2 text-muted-foreground mb-1">
          <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard
        </Button>
        <h1 className="text-xl font-bold">Identity Verification</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Upload your documents for verification (demo auto-approve)</p>
      </div>

      {/* Status Card */}
      {verification && statusInfo && (
        <Card className={`rounded-xl mb-6 border-2 ${
          isVerified ? 'border-emerald-200 bg-emerald-50' : verification.status === 'REJECTED' ? 'border-red-200 bg-red-50' : 'border-slate-200'
        }`}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${
              isVerified ? 'bg-emerald-100' : 'bg-slate-100'
            }`}>
              <statusInfo.icon className={`h-6 w-6 ${isVerified ? 'text-emerald-600' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{statusInfo.label}</h3>
              <p className="text-sm text-muted-foreground">
                {isVerified
                  ? 'Your identity has been verified. You can now apply for loans.'
                  : verification.status === 'REJECTED'
                  ? 'Your documents were rejected. Please re-upload.'
                  : 'Upload your identity documents to get verified.'}
              </p>
            </div>
            <Badge variant="outline" className={statusInfo.color}>{verification.status}</Badge>
          </CardContent>
        </Card>
      )}

      {/* Verified Success */}
      {isVerified ? (
        <Card className="rounded-xl">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">Document Submitted — Demo Verification Successful</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your identity has been verified in demo mode. You can now apply for loan plans.
            </p>
            <Button onClick={() => router.push('/dashboard/apply')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Apply for a Loan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle className="text-base">Upload Documents</CardTitle>
            <CardDescription>Upload front and back of your identity document</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Front */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Front Side</Label>
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
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
                    <p className="text-sm text-muted-foreground">Click to upload front side</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, PDF (max 5MB)</p>
                  </div>
                )}
              </div>
              <input ref={frontRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => handleFileSelect(e, 'front')} />
            </div>

            {/* Back */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Back Side</Label>
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors"
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
                    <p className="text-sm text-muted-foreground">Click to upload back side</p>
                    <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, PDF (max 5MB)</p>
                  </div>
                )}
              </div>
              <input ref={backRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={(e) => handleFileSelect(e, 'back')} />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!frontFile || !backFile || submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Uploading...</> : 'Submit Documents'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
