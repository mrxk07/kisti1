import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'এই পেজটি দেখার অনুমতি আপনার নেই।' }, { status: 401 })
    }

    const applications = await db.loanApplication.findMany({
      where: { userId: session.userId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ applications })
  } catch (error) {
    console.error('Fetch applications error:', error)
    return NextResponse.json({ error: 'দুঃখিত, একটি সমস্যা হয়েছে।' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'এই পেজটি দেখার অনুমতি আপনার নেই।' }, { status: 401 })
    }

    const body = await request.json()
    const { planId, amount, interest, totalRepayable, installmentCount, nidNumber } = body

    if (!amount || !totalRepayable) {
      return NextResponse.json({ error: 'এই তথ্যটি অবশ্যই দিতে হবে।' }, { status: 400 })
    }

    const existingPending = await db.loanApplication.findFirst({
      where: {
        userId: session.userId,
        status: { in: ['PENDING', 'VERIFYING'] }
      }
    })

    if (existingPending) {
      return NextResponse.json(
        { error: 'আপনার একটি মুলতবি আবেদন আছে। অনুগ্রহ করে সেটির ফলাফলের জন্য অপেক্ষা করুন।' },
        { status: 400 }
      )
    }

    const application = await db.loanApplication.create({
      data: {
        userId: session.userId,
        planId: planId || null,
        amount,
        interest: interest || 0,
        totalRepayable,
        installmentCount: installmentCount || 1,
        nidNumber: nidNumber || null,
        status: 'PENDING'
      }
    })

    await db.auditLog.create({
      data: { userId: session.userId, action: 'APPLICATION_CREATED', details: `নতুন ঋণ আবেদন: ৳${amount}` }
    })

    await db.notification.create({
      data: {
        userId: session.userId,
        title: 'আবেদন গৃহীত',
        message: `আপনার ৳${amount} ঋণের আবেদন গৃহীত হয়েছে। যাচাই চলছে।`
      }
    })

    return NextResponse.json({ success: true, application }, { status: 201 })
  } catch (error) {
    console.error('Create application error:', error)
    return NextResponse.json({ error: 'দুঃখিত, একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' }, { status: 500 })
  }
}
