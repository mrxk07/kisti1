import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth';
import { formatTaka } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const [
      totalUsers,
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      totalTransactions,
      totalRepayments,
      pendingRepayments,
      paidRepayments,
      totalSupportTickets,
      openTickets,
      totalLoanDisbursed,
      totalInterestCollected,
      totalRepaymentCollected,
      totalActiveBalance,
      totalPlans,
      activePlans,
    ] = await Promise.all([
      db.user.count(),
      db.application.count(),
      db.application.count({ where: { status: 'PENDING' } }),
      db.application.count({ where: { status: 'APPROVED' } }),
      db.application.count({ where: { status: 'REJECTED' } }),
      db.transaction.count(),
      db.repayment.count(),
      db.repayment.count({ where: { status: 'PENDING' } }),
      db.repayment.count({ where: { status: { in: ['PAID', 'DEMO_PAID'] } } }),
      db.supportTicket.count(),
      db.supportTicket.count({ where: { status: 'OPEN' } }),
      db.transaction.aggregate({
        where: { type: 'DEMO_LOAN_CREDIT', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { type: 'DEMO_INTEREST', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { type: 'DEMO_REPAYMENT', status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      db.user.aggregate({ _sum: { balance: true } }),
      db.loanPlan.count(),
      db.loanPlan.count({ where: { active: true } }),
    ]);

    // Users joined in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await db.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    // Applications in last 7 days
    const recentApplications = await db.application.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          recent: recentUsers,
        },
        applications: {
          total: totalApplications,
          recent: recentApplications,
          pending: pendingApplications,
          approved: approvedApplications,
          rejected: rejectedApplications,
        },
        transactions: {
          total: totalTransactions,
        },
        repayments: {
          total: totalRepayments,
          pending: pendingRepayments,
          paid: paidRepayments,
        },
        support: {
          total: totalSupportTickets,
          open: openTickets,
        },
        financials: {
          totalLoanDisbursed: totalLoanDisbursed._sum.amount || 0,
          totalLoanDisbursedFormatted: formatTaka(totalLoanDisbursed._sum.amount || 0),
          totalInterestCollected: totalInterestCollected._sum.amount || 0,
          totalInterestCollectedFormatted: formatTaka(totalInterestCollected._sum.amount || 0),
          totalRepaymentCollected: totalRepaymentCollected._sum.amount || 0,
          totalRepaymentCollectedFormatted: formatTaka(totalRepaymentCollected._sum.amount || 0),
          totalActiveBalance: totalActiveBalance._sum.balance || 0,
          totalActiveBalanceFormatted: formatTaka(totalActiveBalance._sum.balance || 0),
        },
        plans: {
          total: totalPlans,
          active: activePlans,
        },
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch stats' }, { status: 500 });
  }
}
