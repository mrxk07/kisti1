import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'এই পেজটি দেখার অনুমতি আপনার নেই।' }, { status: 403 })
    }

    const plans = await db.loanPlan.findMany({ orderBy: { amount: 'asc' } })
    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Admin fetch plans error:', error)
    return NextResponse.json({ error: 'দুঃখিত, একটি সমস্যা হয়েছে।' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'এই পেজটি দেখার অনুমতি আপনার নেই।' }, { status: 403 })
    }

    const body = await request.json()
    const { name, amount, interest, totalRepayable, installmentCount } = body

    if (!name || !amount || !totalRepayable || !installmentCount) {
      return NextResponse.json({ error: 'এই তথ্যটি অবশ্যই দিতে হবে।' }, { status: 400 })
    }

    const plan = await db.loanPlan.create({
      data: { name, amount, interest: interest || 0, totalRepayable, installmentCount, isActive: true }
    })

    return NextResponse.json({ success: true, plan }, { status: 201 })
  } catch (error) {
    console.error('Admin create plan error:', error)
    return NextResponse.json({ error: 'দুঃখিত, একটি সমস্যা হয়েছে।' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'এই পেজটি দেখার অনুমতি আপনার নেই।' }, { status: 403 })
    }

    const { planId, ...data } = await request.json()
    if (!planId) {
      return NextResponse.json({ error: 'এই তথ্যটি অবশ্যই দিতে হবে।' }, { status: 400 })
    }

    const plan = await db.loanPlan.update({ where: { id: planId }, data })
    return NextResponse.json({ success: true, plan })
  } catch (error) {
    console.error('Admin update plan error:', error)
    return NextResponse.json({ error: 'দুঃখিত, একটি সমস্যা হয়েছে।' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'এই পেজটি দেখার অনুমতি আপনার নেই।' }, { status: 403 })
    }

    const { planId } = await request.json()
    if (!planId) {
      return NextResponse.json({ error: 'এই তথ্যটি অবশ্যই দিতে হবে।' }, { status: 400 })
    }

    await db.loanPlan.update({ where: { id: planId }, data: { isActive: false } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin delete plan error:', error)
    return NextResponse.json({ error: 'দুঃখিত, একটি সমস্যা হয়েছে।' }, { status: 500 })
  }
}
