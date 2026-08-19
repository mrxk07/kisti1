import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, AuthError } from '@/lib/auth';
import { createPlanSchema, updatePlanSchema } from '@/lib/validation';
import { getClientIP } from '@/lib/security';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    const where: Record<string, unknown> = {};
    if (activeOnly) where.active = true;

    const plans = await db.loanPlan.findMany({
      where,
      include: {
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: plans });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch plans' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    const body = await request.json();
    const parsed = createPlanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const plan = await db.loanPlan.create({
      data: parsed.data,
    });

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'CREATE_PLAN',
        details: `Created plan: ${parsed.data.name}`,
        ipAddress: getClientIP(request),
      },
    });

    return NextResponse.json({ success: true, data: plan });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to create plan' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Plan ID is required' }, { status: 400 });
    }

    const parsed = updatePlanSchema.safeParse(updateData);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const existing = await db.loanPlan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 });
    }

    const plan = await db.loanPlan.update({
      where: { id },
      data: parsed.data,
    });

    await db.auditLog.create({
      data: {
        userId: admin.id,
        action: 'UPDATE_PLAN',
        details: `Updated plan ${id}: ${JSON.stringify(parsed.data)}`,
        ipAddress: getClientIP(request),
      },
    });

    return NextResponse.json({ success: true, data: plan });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, error: 'Failed to update plan' }, { status: 500 });
  }
}
