'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DemoBanner } from '@/components/kisti/demo-banner';
import {
  LayoutDashboard,
  Users,
  FileText,
  Landmark,
  ArrowLeftRight,
  Receipt,
  LifeBuoy,
  ScrollText,
  Settings,
  ArrowLeft,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/applications', label: 'Applications', icon: FileText },
  { href: '/admin/plans', label: 'Loan Plans', icon: Landmark },
  { href: '/admin/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/admin/repayments', label: 'Repayments', icon: Receipt },
  { href: '/admin/support', label: 'Support', icon: LifeBuoy },
  { href: '/admin/audit', label: 'Audit Logs', icon: ScrollText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

const mobileLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/applications', label: 'Apps', icon: FileText },
  { href: '/admin/plans', label: 'Plans', icon: Landmark },
  { href: '/admin/transactions', label: 'Txns', icon: ArrowLeftRight },
];

const mobileLinksBottom = [
  { href: '/admin/repayments', label: 'Pay', icon: Receipt },
  { href: '/admin/support', label: 'Support', icon: LifeBuoy },
  { href: '/admin/audit', label: 'Audit', icon: ScrollText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

interface AdminShellProps {
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

function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-sm tracking-tight">Kisti Admin</h1>
          <p className="text-slate-400 text-xs">Management Panel</p>
        </div>
      </div>
      <Separator className="bg-slate-700" />
      <ScrollArea className="flex-1 py-2">
        <nav className="flex flex-col gap-0.5 px-2">
          {adminLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-600/20 text-emerald-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <link.icon className="h-4 w-4 shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator className="bg-slate-700" />
      <div className="p-2">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Back to Site
        </Link>
      </div>
    </div>
  );
}

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <DemoBanner />
      <div className="h-10" />

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-60 xl:w-64 flex-col bg-slate-900 border-r border-slate-800 sticky top-10 h-[calc(100vh-2.5rem)]">
          <SidebarNav />
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Mobile Header */}
          <div className="lg:hidden sticky top-10 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-0 bg-slate-900 border-slate-800">
                    <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
                    <SidebarNav />
                  </SheetContent>
                </Sheet>
                <h1 className="font-semibold text-sm text-slate-900">Admin Panel</h1>
              </div>
              <div className="flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-medium text-slate-500">{user.name || 'Admin'}</span>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 lg:pb-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-bottom">
        <div className="grid grid-cols-4 h-16">
          {mobileLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 text-xs transition-colors',
                  isActive ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <link.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                {link.label}
              </Link>
            );
          })}
        </div>
        <div className="grid grid-cols-4 h-12 border-t border-slate-100">
          {mobileLinksBottom.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors',
                  isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                )}
              >
                <link.icon className={cn('h-4 w-4', isActive && 'stroke-[2.5]')} />
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
