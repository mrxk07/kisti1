import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'এই পেজটি দেখার অনুমতি আপনার নেই।' }, { status: 403 })
    }

    const tickets = await db.supportTicket.findMany({
      include: { user: { select: { name: true, mobile: true } } },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('Admin fetch support error:', error)
    return NextResponse.json({ error: 'দুঃখিত, একটি সমস্যা হয়েছে।' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'এই পেজটি দেখার অনুমতি আপনার নেই।' }, { status: 403 })
    }

    const { ticketId, status } = await request.json()
    if (!ticketId || !status) {
      return NextResponse.json({ error: 'এই তথ্যটি অবশ্যই দিতে হবে।' }, { status: 400 })
    }

    await db.supportTicket.update({ where: { id: ticketId }, data: { status } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin update support error:', error)
    return NextResponse.json({ error: 'দুঃখিত, একটি সমস্যা হয়েছে।' }, { status: 500 })
  }
}
