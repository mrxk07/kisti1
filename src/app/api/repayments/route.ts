import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'এই পেজটি দেখার অনুমতি আপনার নেই।' }, { status: 401 })
    }

    const repayments = await db.repayment.findMany({
      where: { userId: session.userId },
      include: { application: { select: { id: true, amount: true, status: true } } },
      orderBy: { dueDate: 'asc' }
    })

    return NextResponse.json({ repayments })
  } catch (error) {
    console.error('Fetch repayments error:', error)
    return NextResponse.json({ error: 'দুঃখিত, একটি সমস্যা হয়েছে।' }, { status: 500 })
  }
}
