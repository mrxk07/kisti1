# Task 5: Admin Panel UI

## Status: COMPLETE

## Files Created
1. `/src/app/admin/layout.tsx` - Server-side auth layout (cookie check, DB session, ADMIN role verify, redirect to / if not admin)
2. `/src/app/admin/admin-shell.tsx` - Client shell with dark slate-900 sidebar (desktop), sheet drawer (mobile), dual-row bottom nav
3. `/src/app/admin/page.tsx` - Admin dashboard: 8 stat cards + 3 summary sections
4. `/src/app/admin/users/page.tsx` - User management: search, role filter, table, profile dialog, reset confirmation
5. `/src/app/admin/applications/page.tsx` - Application management: status filter, detail dialog, approve/reject actions
6. `/src/app/admin/plans/page.tsx` - Plan management: create dialog with auto-calc, active toggle
7. `/src/app/admin/transactions/page.tsx` - All transactions: type filter, colored badges, pagination
8. `/src/app/admin/repayments/page.tsx` - All repayments: status filter, installment details
9. `/src/app/admin/support/page.tsx` - Support tickets: status filter, message thread, admin reply, status change
10. `/src/app/admin/audit/page.tsx` - Audit logs: read-only, action badges, tooltip for details
11. `/src/app/admin/settings/page.tsx` - Settings: demo mode status, environment info, session config

## Design Decisions
- Dark sidebar (slate-900) with emerald-600 active indicators to differentiate from user dashboard
- Mobile: sheet drawer for full nav + 2-row bottom nav (5 + 4 links)
- All tables: max-h-96 overflow-y-auto with custom-scrollbar class
- Status badges: PENDING=yellow, APPROVED=green, REJECTED=red, COMPLETED=blue, OPEN=cyan, RESOLVED=green, OVERDUE=red
- All destructive actions use AlertDialog confirmation
- Toast notifications via sonner for all actions
- Lint passes clean
