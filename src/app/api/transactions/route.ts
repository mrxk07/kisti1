import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'এই পেজটি দেখার অনুমতি আপনার নেই।' }, { status: 401 })
    }

    const transactions = await db.transaction.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('Fetch transactions error:', error)
    return NextResponse.json({ error: 'দুঃখিত, একটি সমস্যা হয়েছে।' }, { status: 500 })
  }
}
