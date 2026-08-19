import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { TRANSACTION_TYPES, formatTaka } from '@/lib/constants';
import { simulatePaymentSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const parsed = simulatePaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { applicationId } = parsed.data;

    // Find application and verify ownership
    const application = await db.application.findUnique({
      where: { id: applicationId },
      include: { plan: true },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    if (application.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    if (application.status !== 'APPROVED') {
      return NextResponse.json({ success: false, error: 'Only approved applications can have interest payments' }, { status: 400 });
    }

    // Check if interest already paid
    const existingInterest = await db.transaction.findFirst({
      where: {
        userId: user.id,
        type: TRANSACTION_TYPES.DEMO_INTEREST,
        referenceId: applicationId,
      },
    });

    if (existingInterest) {
      return NextResponse.json({ success: false, error: 'Interest for this application has already been paid' }, { status: 400 });
    }

    const interestAmount = application.interestAmount;

    // Atomic transaction: debit interest, update balance, create notification
    const result = await db.$transaction([
      db.transaction.create({
        data: {
          userId: user.id,
          type: TRANSACTION_TYPES.DEMO_INTEREST,
          amount: interestAmount,
          description: `Interest payment for ${application.plan.name} (${formatTaka(interestAmount)})`,
          status: 'COMPLETED',
          referenceId: applicationId,
        },
      }),
      db.user.update({
        where: { id: user.id },
        data: { balance: { decrement: interestAmount } },
      }),
      db.notification.create({
        data: {
          userId: user.id,
          title: 'Interest Payment Processed',
          message: `Interest of ${formatTaka(interestAmount)} for ${application.plan.name} has been deducted from your balance.`,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        transactionId: result[0].id,
        type: result[0].type,
        amount: result[0].amount,
        amountFormatted: formatTaka(result[0].amount),
        description: result[0].description,
        createdAt: result[0].createdAt,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to process payment' }, { status: 500 });
  }
}
