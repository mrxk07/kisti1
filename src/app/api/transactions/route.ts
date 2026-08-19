import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { formatTaka } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: user.id };
    if (type) {
      where.type = type;
    }

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.transaction.count({ where }),
    ]);

    const data = transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      amountFormatted: formatTaka(tx.amount),
      description: tx.description,
      status: tx.status,
      referenceId: tx.referenceId,
      isCredit: tx.type === 'DEMO_LOAN_CREDIT',
      isDebit: tx.type === 'DEMO_INTEREST' || tx.type === 'DEMO_REPAYMENT',
      createdAt: tx.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        transactions: data,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch transactions' }, { status: 500 });
  }
}
