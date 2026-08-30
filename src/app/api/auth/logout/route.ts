import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession, deleteSession, SESSION_COOKIE_NAME } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const session = await getSession()

    if (session) {
      const cookieStore = await cookies()
      const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
      if (token) {
        await deleteSession(token)
      }
      await db.auditLog.create({
        data: { userId: session.userId, action: 'USER_LOGOUT', details: 'ব্যবহারকারী লগআউট' }
      })
    }

    const response = NextResponse.json({ success: true, message: 'সফলভাবে লগআউট হয়েছে।' })
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'দুঃখিত, একটি সমস্যা হয়েছে।' },
      { status: 500 }
    )
  }
}