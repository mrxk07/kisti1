import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { TRANSACTION_TYPES, APPLICATION_STATUSES, VERIFICATION_STATUSES, formatTaka } from '@/lib/constants';
import { submitApplicationSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: user.id };
    if (status) {
      where.status = status;
    }

    const [applications, total] = await Promise.all([
      db.application.findMany({
        where,
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.application.count({ where }),
    ]);

    const data = applications.map((app) => ({
      id: app.id,
      planName: app.plan.name,
      status: app.status,
      principalAmount: app.principalAmount,
      interestAmount: app.interestAmount,
      totalAmount: app.totalAmount,
      principalFormatted: formatTaka(app.principalAmount),
      interestFormatted: formatTaka(app.interestAmount),
      totalFormatted: formatTaka(app.totalAmount),
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        applications: data,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const parsed = submitApplicationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { planId } = parsed.data;

    // Validate plan exists and is active
    const plan = await db.loanPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.active) {
      return NextResponse.json({ success: false, error: 'Selected plan is not available' }, { status: 400 });
    }

    // Check user verification status
    const verification = await db.verification.findUnique({ where: { userId: user.id } });
    if (!verification || verification.status !== VERIFICATION_STATUSES.VERIFIED) {
      return NextResponse.json({ success: false, error: 'Please complete identity verification before applying' }, { status: 400 });
    }

    // Atomic transaction: create application + transaction + update balance
    const result = await db.$transaction([
      db.application.create({
        data: {
          userId: user.id,
          planId: plan.id,
          status: APPLICATION_STATUSES.PENDING,
          principalAmount: plan.principalAmount,
          interestAmount: plan.interestAmount,
          totalAmount: plan.totalAmount,
        },
        include: { plan: true },
      }),
      db.transaction.create({
        data: {
          userId: user.id,
          type: TRANSACTION_TYPES.DEMO_LOAN_CREDIT,
          amount: plan.principalAmount,
          description: `Loan credited: ${plan.name} (${formatTaka(plan.principalAmount)})`,
          status: 'COMPLETED',
        },
      }),
      db.user.update({
        where: { id: user.id },
        data: { balance: { increment: plan.principalAmount } },
      }),
      db.notification.create({
        data: {
          userId: user.id,
          title: 'Loan Application Submitted',
          message: `Your application for ${plan.name} (${formatTaka(plan.principalAmount)}) has been submitted and ${formatTaka(plan.principalAmount)} has been credited to your balance.`,
        },
      }),
    ]);

    const application = result[0];

    return NextResponse.json({
      success: true,
      data: {
        id: application.id,
        planName: application.plan.name,
        status: application.status,
        principalAmount: application.principalAmount,
        interestAmount: application.interestAmount,
        totalAmount: application.totalAmount,
        principalFormatted: formatTaka(application.principalAmount),
        totalFormatted: formatTaka(application.totalAmount),
        createdAt: application.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to submit application' }, { status: 500 });
  }
}
