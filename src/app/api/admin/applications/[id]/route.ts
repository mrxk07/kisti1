import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth';
import { APPLICATION_STATUSES, formatTaka, REPAYMENT_STATUSES } from '@/lib/constants';
import { getClientIP } from '@/lib/security';
import { z } from 'zod/v4';

const patchSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const application = await db.application.findUnique({
      where: { id },
      include: { user: true, plan: true },
    });

    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== APPLICATION_STATUSES.PENDING) {
      return NextResponse.json({ success: false, error: `Application is already ${application.status}` }, { status: 400 });
    }

    const newStatus = parsed.data.action === 'APPROVE'
      ? APPLICATION_STATUSES.APPROVED
      : APPLICATION_STATUSES.REJECTED;

    const txResults = await db.$transaction(async (tx) => {
      const updated = await tx.application.update({
        where: { id },
        data: { status: newStatus },
      });

      if (parsed.data.action === 'APPROVE') {
        // Generate repayment schedule
        const totalInstallments = 6;
        const installmentAmount = application.totalAmount / totalInstallments;
        const repayments = [];

        for (let i = 1; i <= totalInstallments; i++) {
          const dueDate = new Date();
          dueDate.setMonth(dueDate.getMonth() + i);

          repayments.push(
            tx.repayment.create({
              data: {
                userId: application.userId,
                applicationId: id,
                installmentNumber: i,
                dueAmount: installmentAmount,
                paidAmount: 0,
                status: REPAYMENT_STATUSES.PENDING,
                dueDate,
              },
            })
          );
        }

        await Promise.all(repayments);
      }

      // Notify user
      const title = parsed.data.action === 'APPROVE'
        ? 'Loan Approved'
        : 'Loan Application Rejected';
      const message = parsed.data.action === 'APPROVE'
        ? `Your application for ${application.plan.name} (${formatTaka(application.principalAmount)}) has been approved. Repayment schedule has been created.`
        : `Your application for ${application.plan.name} (${formatTaka(application.principalAmount)}) has been rejected. Please contact support for details.`;

      await tx.notification.create({
        data: {
          userId: application.userId,
          title,
          message,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: admin.id,
          action: parsed.data.action === 'APPROVE' ? 'APPROVE_APPLICATION' : 'REJECT_APPLICATION',
          details: `${parsed.data.action} application ${id} for user ${application.user.name || application.userId}`,
          ipAddress: getClientIP(request),
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: txResults.id,
        status: txResults.status,
        updatedAt: txResults.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to update application' }, { status: 500 });
  }
}
