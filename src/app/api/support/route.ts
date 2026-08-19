import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { SUPPORT_STATUSES } from '@/lib/constants';
import { createSupportTicketSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: user.id };
    if (status) where.status = status;

    const [tickets, total] = await Promise.all([
      db.supportTicket.findMany({
        where,
        include: {
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

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    const body = await request.json();
    const parsed = createSupportTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { subject, message } = parsed.data;

    const ticket = await db.supportTicket.create({
      data: {
        userId: user.id,
        subject,
        status: SUPPORT_STATUSES.OPEN,
      },
    });

    await db.supportMessage.create({
      data: {
        ticketId: ticket.id,
        userId: user.id,
        message,
        isAdmin: false,
      },
    });

    await db.notification.create({
      data: {
        userId: user.id,
        title: 'Support Ticket Created',
        message: `Your ticket "${subject}" has been created. We'll respond shortly.`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to create ticket' }, { status: 500 });
  }
}
