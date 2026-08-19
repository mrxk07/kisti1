'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { DEMO_MODE, APP_NAME } from '@/lib/constants';
import { Settings, Server, Shield, Info, Database } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
          <Settings className="h-5 w-5 text-emerald-700" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500">Platform configuration</p>
        </div>
      </div>

      <div className="grid gap-4">
        {/* Demo Mode Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-600" />
              Demo Mode
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-900">
                  Demo mode is <span className={DEMO_MODE ? 'text-emerald-600' : 'text-red-600'}>{DEMO_MODE ? 'ACTIVE' : 'INACTIVE'}</span>
                </p>
                <p className="text-xs text-slate-500">
                  {DEMO_MODE
                    ? 'All financial operations are simulated. No real money is involved.'
                    : 'Platform is running in live mode.'}
                </p>
              </div>
              <Badge variant={DEMO_MODE ? 'default' : 'destructive'} className={DEMO_MODE ? 'bg-emerald-600' : ''}>
                {DEMO_MODE ? 'DEMO' : 'LIVE'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Environment Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Server className="h-4 w-4 text-slate-600" />
              Environment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-slate-500 text-sm">App Name</Label>
                <span className="text-sm font-medium">{APP_NAME}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <Label className="text-slate-500 text-sm">Framework</Label>
                <span className="text-sm font-medium">Next.js 16 (App Router)</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <Label className="text-slate-500 text-sm">Database</Label>
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-slate-400" />
                  SQLite (Prisma ORM)
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <Label className="text-slate-500 text-sm">Database URL</Label>
                <span className="text-sm font-mono text-slate-500">
                  {process.env.NEXT_PUBLIC_DB_URL
                    ? process.env.NEXT_PUBLIC_DB_URL.replace(/\/[^/]*$/, '/****')
                    : 'file:./dev.db'}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <Label className="text-slate-500 text-sm">Runtime</Label>
                <span className="text-sm font-medium">Node.js / Bun</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Configuration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-slate-600" />
              Session Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-slate-500 text-sm">Session Expiry</Label>
                <span className="text-sm font-medium">7 days</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <Label className="text-slate-500 text-sm">Session Cookie</Label>
                <span className="text-sm font-mono text-slate-500">kisti_session</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <Label className="text-slate-500 text-sm">Auth Method</Label>
                <span className="text-sm font-medium">Cookie-based (session token)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Reset Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-600" />
              Demo Reset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-slate-600">
                Individual user accounts can be reset from the <strong>Users</strong> page.
                This clears all their data (applications, transactions, repayments, tickets) and resets their balance to 0.
              </p>
              <p className="text-xs text-slate-400">
                Full platform reset (all data) is available via database migration commands.
                Contact the system administrator for a complete reset.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
