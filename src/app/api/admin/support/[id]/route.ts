import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth';
import { replySupportTicketSchema } from '@/lib/validation';
import { SUPPORT_STATUSES } from '@/lib/constants';
import { getClientIP } from '@/lib/security';
import { z } from 'zod/v4';

const changeStatusSchema = z.object({
  status: z.enum(['OPEN', 'PENDING', 'RESOLVED']),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;

    const ticket = await db.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = replySupportTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const message = await db.supportMessage.create({
      data: {
        ticketId: id,
        userId: admin.id,
        message: parsed.data.message,
        isAdmin: true,
      },
    });

    await db.supportTicket.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    await db.notification.create({
      data: {
        userId: ticket.userId,
        title: 'New Reply to Your Ticket',
        message: `An admin has replied to your ticket "${ticket.subject}".`,
      },
    });

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'ADMIN_REPLY_TICKET',
        details: `Replied to ticket ${id}`,
        ipAddress: getClientIP(request),
      },
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
    return NextResponse.json({ success: false, error: 'Failed to reply' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    const { id } = await params;

    const ticket = await db.supportTicket.findUnique({ where: { id } });
    if (!ticket) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = changeStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const updated = await db.supportTicket.update({
      where: { id },
      data: { status: parsed.data.status, updatedAt: new Date() },
    });

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'CHANGE_TICKET_STATUS',
        details: `Changed ticket ${id} status from ${ticket.status} to ${parsed.data.status}`,
        ipAddress: getClientIP(request),
      },
    });

    if (parsed.data.status === SUPPORT_STATUSES.RESOLVED) {
      await db.notification.create({
        data: {
          userId: ticket.userId,
          title: 'Ticket Resolved',
          message: `Your ticket "${ticket.subject}" has been marked as resolved.`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to update ticket' }, { status: 500 });
  }
}
