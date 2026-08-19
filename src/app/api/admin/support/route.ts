import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [tickets, total] = await Promise.all([
      db.supportTicket.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.supportTicket.count({ where }),
    ]);

    const data = tickets.map((ticket) => ({
      id: ticket.id,
      userId: ticket.userId,
      userName: ticket.user.name,
      userEmail: ticket.user.email,
      subject: ticket.subject,
      status: ticket.status,
      messageCount: ticket._count.messages,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        tickets: data,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch tickets' }, { status: 500 });
  }
}
