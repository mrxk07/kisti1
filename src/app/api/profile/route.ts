import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'এই পেজটি দেখার অনুমতি আপনার নেই।' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, mobile: true, email: true, role: true, createdAt: true }
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Fetch profile error:', error)
    return NextResponse.json({ error: 'দুঃখিত, একটি সমস্যা হয়েছে।' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'এই পেজটি দেখার অনুমতি আপনার নেই।' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, currentPassword, newPassword } = body

    if (name) {
      await db.user.update({ where: { id: session.userId }, data: { name } })
    }

    if (email !== undefined) {
      const existing = await db.user.findFirst({ where: { email, NOT: { id: session.userId } } })
      if (existing) {
        return NextResponse.json({ error: 'এই ইমেইলটি অন্য কেউ ব্যবহার করছে।' }, { status: 409 })
      }
      await db.user.update({ where: { id: session.userId }, data: { email } })
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'বর্তমান পাসওয়ার্ড দিন।' }, { status: 400 })
      }
      const user = await db.user.findUnique({ where: { id: session.userId } })
      if (!user) {
        return NextResponse.json({ error: 'ব্যবহারকারী পাওয়া যায়নি।' }, { status: 404 })
      }
      const bcrypt = await import('bcryptjs')
      const valid = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!valid) {
        return NextResponse.json({ error: 'বর্তমান পাসওয়ার্ড সঠিক নয়।' }, { status: 401 })
      }
      const newHash = await hashPassword(newPassword)
      await db.user.update({ where: { id: session.userId }, data: { passwordHash: newHash } })
    }

    await db.auditLog.create({
      data: { userId: session.userId, action: 'PROFILE_UPDATED', details: 'প্রোফাইল আপডেট করা হয়েছে' }
    })

    return NextResponse.json({ success: true, message: 'পরিবর্তন সংরক্ষণ করা হয়েছে।' })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'দুঃখিত, একটি সমস্যা হয়েছে।' }, { status: 500 })
  }
}
