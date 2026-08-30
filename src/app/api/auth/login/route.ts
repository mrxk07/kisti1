import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSession, SESSION_COOKIE_NAME } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { identifier, password } = body

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'মোবাইল নম্বর অথবা পাসওয়ার্ড সঠিক নয়।' },
        { status: 400 }
      )
    }

    const user = await db.user.findFirst({
      where: {
        OR: [
          { mobile: identifier },
          ...(identifier.includes('@') ? [{ email: identifier }] : [])
        ]
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'মোবাইল নম্বর অথবা পাসওয়ার্ড সঠিক নয়।' },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'মোবাইল নম্বর অথবা পাসওয়ার্ড সঠিক নয়।' },
        { status: 401 }
      )
    }

    const token = await createSession(user.id)

    await db.auditLog.create({
      data: { userId: user.id, action: 'USER_LOGIN', details: `ব্যবহারকারী লগইন: ${user.mobile}` }
    })

    const response = NextResponse.json({
      success: true,
      message: 'লগইন সফল!',
      user: { id: user.id, name: user.name, mobile: user.mobile, email: user.email, role: user.role }
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
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'দুঃখিত, একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' },
      { status: 500 }
    )
  }
}
