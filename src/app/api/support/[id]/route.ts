import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, AuthError } from '@/lib/auth';
import { replySupportTicketSchema } from '@/lib/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const ticket = await db.supportTicket.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!ticket || ticket.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        messages: ticket.messages.map((msg) => ({
          id: msg.id,
          message: msg.message,
          isAdmin: msg.isAdmin,
          senderName: msg.user.name,
          createdAt: msg.createdAt,
        })),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch ticket' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;

    const ticket = await db.supportTicket.findUnique({ where: { id } });
    if (!ticket || ticket.userId !== user.id) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.status === 'RESOLVED') {
      return NextResponse.json({ success: false, error: 'This ticket is already resolved' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = replySupportTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const message = await db.supportMessage.create({
      data: {
        ticketId: id,
        userId: user.id,
        message: parsed.data.message,
        isAdmin: false,
      },
    });

    await db.supportTicket.update({
      where: { id },
      data: { status: 'PENDING', updatedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: message.id,
        message: message.message,
        isAdmin: message.isAdmin,
        createdAt: message.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to reply to ticket' }, { status: 500 });
  }
}
