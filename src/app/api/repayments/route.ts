import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { formatTaka, TRANSACTION_TYPES, REPAYMENT_STATUSES } from '@/lib/constants';
import { simulateRepaymentSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const applicationId = searchParams.get('applicationId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: user.id };
    if (status) where.status = status;
    if (applicationId) where.applicationId = applicationId;

    const [repayments, total] = await Promise.all([
      db.repayment.findMany({
        where,
        include: { application: { include: { plan: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.repayment.count({ where }),
    ]);

    const data = repayments.map((r) => ({
      id: r.id,
      applicationId: r.applicationId,
      planName: r.application.plan.name,
      installmentNumber: r.installmentNumber,
      dueAmount: r.dueAmount,
      dueAmountFormatted: formatTaka(r.dueAmount),
      paidAmount: r.paidAmount,
      paidAmountFormatted: formatTaka(r.paidAmount),
      status: r.status,
      dueDate: r.dueDate,
      paidAt: r.paidAt,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        repayments: data,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch repayments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const parsed = simulateRepaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { repaymentId } = parsed.data;

    // Find the repayment and verify ownership
    const repayment = await db.repayment.findUnique({
      where: { id: repaymentId },
      include: { application: true },
    });

    if (!repayment) {
      return NextResponse.json({ success: false, error: 'Repayment not found' }, { status: 404 });
    }

    if (repayment.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    if (repayment.status === REPAYMENT_STATUSES.PAID || repayment.status === REPAYMENT_STATUSES.DEMO_PAID) {
      return NextResponse.json({ success: false, error: 'This installment is already paid' }, { status: 400 });
    }

    const dueAmount = repayment.dueAmount;

    // Atomic transaction: create repayment transaction, update repayment, update balance
    const result = await db.$transaction([
      db.repayment.update({
        where: { id: repaymentId },
        data: {
          paidAmount: dueAmount,
          status: REPAYMENT_STATUSES.DEMO_PAID,
          paidAt: new Date(),
        },
      }),
      db.transaction.create({
        data: {
          userId: user.id,
          type: TRANSACTION_TYPES.DEMO_REPAYMENT,
          amount: dueAmount,
          description: `Repayment for ${repayment.application.plan?.name || 'loan'} - Installment #${repayment.installmentNumber}`,
          status: 'COMPLETED',
          referenceId: repayment.applicationId,
        },
      }),
      db.user.update({
        where: { id: user.id },
        data: { balance: { decrement: dueAmount } },
      }),
      db.notification.create({
        data: {
          userId: user.id,
          title: 'Repayment Successful',
          message: `Installment #${repayment.installmentNumber} of ${formatTaka(dueAmount)} has been paid successfully.`,
        },
      }),
    ]);

    const updatedRepayment = result[0];

    return NextResponse.json({
      success: true,
      data: {
        id: updatedRepayment.id,
        installmentNumber: updatedRepayment.installmentNumber,
        paidAmount: updatedRepayment.paidAmount,
        paidAmountFormatted: formatTaka(updatedRepayment.paidAmount),
        status: updatedRepayment.status,
        paidAt: updatedRepayment.paidAt,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to process repayment' }, { status: 500 });
  }
}
