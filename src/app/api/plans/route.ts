import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const plans = await db.loanPlan.findMany({
      where: { isActive: true },
      orderBy: { amount: 'asc' }
    })
    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Fetch plans error:', error)
    return NextResponse.json({ error: 'দুঃখিত, একটি সমস্যা হয়েছে।' }, { status: 500 })
  }
}
