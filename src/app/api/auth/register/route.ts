import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSession, SESSION_COOKIE_NAME } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, mobile, email, password } = body

    if (!name || !mobile || !password) {
      return NextResponse.json(
        { error: 'নাম, মোবাইল নম্বর এবং পাসওয়ার্ড দিতে হবে।' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' },
        { status: 400 }
      )
    }

    const mobileRegex = /^01[3-9]\d{8}$/
    if (!mobileRegex.test(mobile)) {
      return NextResponse.json(
        { error: 'সঠিক মোবাইল নম্বর দিন (যেমন: ০১৭XXXXXXXX)।' },
        { status: 400 }
      )
    }

    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ mobile }, ...(email ? [{ email }] : [])]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'এই মোবাইল নম্বর বা ইমেইল দিয়ে আগেই একাউন্ট তৈরি হয়েছে।' },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)

    const user = await db.user.create({
      data: { name, mobile, email: email || null, passwordHash }
    })

    await db.auditLog.create({
      data: { userId: user.id, action: 'USER_REGISTERED', details: `নতুন ব্যবহারকারী নিবন্ধন: ${mobile}` }
    })

    const token = await createSession(user.id)

    const response = NextResponse.json({
      success: true,
      message: 'নিবন্ধন সফল হয়েছে!',
      user: { id: user.id, name: user.name, mobile: user.mobile, role: user.role }
    })

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    })

    return response
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'দুঃখিত, একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' },
      { status: 500 }
    )
  }
}
