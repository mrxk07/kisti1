import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { formatTaka } from '@/lib/constants';

export async function GET() {
  try {
    const plans = await db.loanPlan.findMany({
      where: { active: true },
      orderBy: { principalAmount: 'asc' },
    });

    const data = plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      principalAmount: plan.principalAmount,
      interestAmount: plan.interestAmount,
      totalAmount: plan.totalAmount,
      principalFormatted: formatTaka(plan.principalAmount),
      interestFormatted: formatTaka(plan.interestAmount),
      totalFormatted: formatTaka(plan.totalAmount),
      interestRate: ((plan.interestAmount / plan.principalAmount) * 100).toFixed(1) + '%',
    }));

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch plans' }, { status: 500 });
  }
}
