'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Receipt,
  CreditCard,
  LifeBuoy,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/apply', label: 'Apply', icon: FileText },
  { href: '/dashboard/verification', label: 'Verification', icon: ShieldCheck },
  { href: '/dashboard/transactions', label: 'Transactions', icon: Receipt },
  { href: '/dashboard/repayments', label: 'Repayments', icon: CreditCard },
  { href: '/dashboard/support', label: 'Support', icon: LifeBuoy },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const getIsActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth', { method: 'DELETE' });
      window.location.href = '/';
    } catch {
      window.location.href = '/';
    }
  };

  return (
    <aside
      className={`hidden md:flex flex-col border-r border-border bg-white h-screen sticky top-0 transition-all duration-200 ${
        collapsed ? 'w-[68px]' : 'w-[240px]'
      }`}
    >
      <div className="p-4 flex items-center justify-between">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">K</span>
            </div>
            <span className="font-semibold text-lg text-foreground">Kisti</span>
          </Link>
        )}
        {collapsed && (
          <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">K</span>
          </div>
        )}
      </div>

      <Collapsible open={!collapsed} onOpenChange={(open) => !open && setCollapsed(true)}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="mx-auto mb-2 h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Separator className="mb-2" />
        </CollapsibleContent>
      </Collapsible>

      {collapsed && <Separator className="mb-2" />}

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = getIsActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-emerald-600' : ''}`} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3">
        <Separator className="mb-3" />
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'default'}
          className={`w-full text-muted-foreground hover:text-red-600 hover:bg-red-50 ${
            collapsed ? 'mx-auto' : 'justify-start'
          }`}
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="ml-3">Logout</span>}
        </Button>
      </div>
    </aside>
  );
}
