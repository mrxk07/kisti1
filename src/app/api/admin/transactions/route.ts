import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'এই পেজটি দেখার অনুমতি আপনার নেই।' }, { status: 403 })
    }

    const transactions = await db.transaction.findMany({
      include: {
        user: { select: { name: true, mobile: true } },
        application: { select: { id: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Admin fetch transactions error:', error)
    return NextResponse.json({ error: 'দুঃখিত, একটি সমস্যা হয়েছে।' }, { status: 500 })
  }
}
