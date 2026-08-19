import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { formatTaka } from '@/lib/constants';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const application = await db.application.findUnique({
      where: { id },
      include: {
        plan: true,
        repayments: {
          orderBy: { installmentNumber: 'asc' },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    if (application.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const totalPaid = application.repayments.reduce((sum, r) => sum + r.paidAmount, 0);
    const totalDue = application.repayments.reduce((sum, r) => sum + r.dueAmount, 0);

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
        interestFormatted: formatTaka(application.interestAmount),
        totalFormatted: formatTaka(application.totalAmount),
        totalPaid,
        totalDue,
        totalPaidFormatted: formatTaka(totalPaid),
        totalDueFormatted: formatTaka(totalDue),
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
        repayments: application.repayments.map((r) => ({
          id: r.id,
          installmentNumber: r.installmentNumber,
          dueAmount: r.dueAmount,
          dueAmountFormatted: formatTaka(r.dueAmount),
          paidAmount: r.paidAmount,
          paidAmountFormatted: formatTaka(r.paidAmount),
          status: r.status,
          dueDate: r.dueDate,
          paidAt: r.paidAt,
        })),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch application' }, { status: 500 });
  }
}
