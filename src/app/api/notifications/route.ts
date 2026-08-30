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

    const notifications = await db.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({ notifications })
  } catch (error) {
    console.error('Fetch notifications error:', error)
    return NextResponse.json({ error: 'দুঃখিত, একটি সমস্যা হয়েছে।' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'এই পেজটি দেখার অনুমতি আপনার নেই।' }, { status: 401 })
    }

    const { notificationId } = await request.json()
    if (!notificationId) {
      return NextResponse.json({ error: 'এই তথ্যটি অবশ্যই দিতে হবে।' }, { status: 400 })
    }

    const notification = await db.notification.findFirst({
      where: { id: notificationId, userId: session.userId }
    })

    if (!notification) {
      return NextResponse.json({ error: 'নোটিফিকেশন পাওয়া যায়নি।' }, { status: 404 })
    }

    await db.notification.update({
      where: { id: notificationId },
      data: { isRead: true }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark notification error:', error)
    return NextResponse.json({ error: 'দুঃখিত, একটি সমস্যা হয়েছে।' }, { status: 500 })
  }
}
