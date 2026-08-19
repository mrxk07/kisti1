# Task ID: 2 — Agent: ui-dashboard-agent

## Task: Build landing page and user dashboard UI

### Files Created/Modified:

#### Components:
1. `src/components/kisti/demo-banner.tsx` — Fixed top banner with DEMO_BANNER_TEXT, amber background, dismiss button
2. `src/components/layout/mobile-nav.tsx` — Bottom navigation for mobile (Home, Apply, Transactions, Profile), emerald active state
3. `src/components/layout/desktop-sidebar.tsx` — Collapsible desktop sidebar with nav links, logo, logout

#### Layouts:
4. `src/app/layout.tsx` — Updated root layout with Kisti metadata, sonner toaster
5. `src/app/dashboard/layout.tsx` — Server-side auth check, passes user to client shell
6. `src/app/dashboard/dashboard-shell.tsx` — Client wrapper with DemoBanner, DesktopSidebar, MobileNav
7. `src/app/dashboard/verification/layout.tsx` — Shared layout for verification pages

#### Pages:
8. `src/app/page.tsx` — Landing page: hero, how it works, demo plans, features, FAQ, contact, admin login dialog
9. `src/app/dashboard/page.tsx` — User dashboard: balance card, quick actions, current application, recent transactions, notifications
10. `src/app/dashboard/apply/page.tsx` — Multi-step apply flow: select plan → upload docs → review & submit
11. `src/app/dashboard/transactions/page.tsx` — Transaction table with filters, pagination, mobile card view
12. `src/app/dashboard/repayments/page.tsx` — Loan summary card, installment schedule with simulate payment buttons
13. `src/app/dashboard/verification/page.tsx` — Verification status, file upload UI, demo auto-approve success state
14. `src/app/dashboard/support/page.tsx` — Ticket list, create ticket dialog, ticket detail with messages & reply
15. `src/app/dashboard/notifications/page.tsx` — Notification list, mark as read, mark all as read

#### Utility Pages:
16. `src/app/dashboard/loading.tsx` — Dashboard loading skeleton
17. `src/app/not-found.tsx` — Custom 404 page
18. `src/app/error.tsx` — Custom error boundary

#### Theme:
- Updated `globals.css` with emerald/green fintech color scheme using CSS variables
- Fixed lint error in `constants.ts` (replaced `require('crypto')` with `crypto.getRandomValues`)

### Design Decisions:
- Mobile-first responsive (320px to 1440px)
- Cards with rounded-xl, subtle shadows, p-4/p-6
- Status badges: PENDING=yellow, APPROVED=green, REJECTED=red, COMPLETED=sky, VERIFICATION=purple
- Skeleton loaders on all pages during fetch
- Toast notifications via sonner for user actions
- Framer Motion for scroll animations on landing page
- All data fetching via useEffect + fetch() in 'use client' components
- Custom scrollbar styling in CSS