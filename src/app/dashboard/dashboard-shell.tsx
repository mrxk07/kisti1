'use client';

import { DemoBanner } from '@/components/kisti/demo-banner';
import { DesktopSidebar } from '@/components/layout/desktop-sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';

interface DashboardShellProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    isDemo: boolean;
    balance: number;
  };
  children: React.ReactNode;
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <DemoBanner />
      {/* Spacer for demo banner */}
      <div className="h-10" />

      <div className="flex flex-1">
        <DesktopSidebar />

        <main className="flex-1 min-w-0">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6">
            {children}
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
