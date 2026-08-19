export const APP_NAME = 'Kisti';
export const DEMO_MODE = process.env.DEMO_MODE !== 'false';

export const SESSION_COOKIE_NAME = 'kisti_session';
export const SESSION_EXPIRY_HOURS = 24 * 7; // 7 days

export const APPLICATION_STATUSES = {
  PENDING: 'PENDING',
  VERIFICATION: 'VERIFICATION',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  COMPLETED: 'COMPLETED',
} as const;

export const TRANSACTION_TYPES = {
  DEMO_LOAN_CREDIT: 'DEMO_LOAN_CREDIT',
  DEMO_INTEREST: 'DEMO_INTEREST',
  DEMO_REPAYMENT: 'DEMO_REPAYMENT',
  ADJUSTMENT: 'ADJUSTMENT',
} as const;

export const REPAYMENT_STATUSES = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  DEMO_PAID: 'DEMO_PAID',
} as const;

export const VERIFICATION_STATUSES = {
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
} as const;

export const SUPPORT_STATUSES = {
  OPEN: 'OPEN',
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
} as const;

export const USER_ROLES = {
  DEMO: 'DEMO',
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const DEMO_BANNER_TEXT =
  'DEMO MODE — This platform is currently a simulation. No real money, loan or financial transaction is processed.';

export function formatTaka(amount: number): string {
  return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateSessionToken(): string {
  return crypto.getRandomValues(new Uint8Array(32)).reduce((acc, b) => acc + b.toString(16).padStart(2, '0'), '');
}
