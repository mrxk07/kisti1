import { z } from 'zod/v4';

export const submitApplicationSchema = z.object({
  planId: z.string().min(1, 'Please select a loan plan'),
});

export const uploadVerificationSchema = z.object({
  frontDocument: z.any().refine(
    (f) => f && f.size > 0,
    'Front document is required'
  ),
  backDocument: z.any().refine(
    (f) => f && f.size > 0,
    'Back document is required'
  ),
});

export const createSupportTicketSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
});

export const replySupportTicketSchema = z.object({
  message: z.string().min(1, 'Reply cannot be empty').max(2000),
});

export const createPlanSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  principalAmount: z.number().positive('Principal must be positive'),
  interestAmount: z.number().min(0, 'Interest cannot be negative'),
  totalAmount: z.number().positive('Total must be positive'),
  active: z.boolean().default(true),
});

export const updatePlanSchema = createPlanSchema.partial();

export const adminLoginSchema = z.object({
  email: z.email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  mobile: z.string().min(11, 'Mobile must be at least 11 digits'),
  email: z.email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const simulatePaymentSchema = z.object({
  applicationId: z.string().min(1),
});

export const simulateRepaymentSchema = z.object({
  repaymentId: z.string().min(1),
});

export function validateFile(file: File): string | null {
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Invalid file type. Only JPEG, PNG, WEBP, and PDF are allowed.';
  }
  if (file.size > MAX_SIZE) {
    return 'File too large. Maximum size is 5MB.';
  }
  return null;
}
