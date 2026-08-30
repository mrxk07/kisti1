import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'এই পেজটি দেখার অনুমতি আপনার নেই।' }, { status: 403 })
    }

    const { userId, title, message } = await request.json()
    if (!userId || !title || !message) {
      return NextResponse.json({ error: 'এই তথ্যটি অবশ্যই দিতে হবে।' }, { status: 400 })
    }

    await db.notification.create({ data: { userId, title, message } })

    return NextResponse.json({ success: true, message: 'নোটিফিকেশন পাঠানো হয়েছে।' })
  } catch (error) {
    console.error('Admin send notification error:', error)
    return NextResponse.json({ error: 'দুঃখিত, একটি সমস্যা হয়েছে।' }, { status: 500 })
  }
}
