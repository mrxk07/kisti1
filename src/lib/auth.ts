import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { db } from './db'
import { cookies } from 'next/headers'

const SESSION_COOKIE_NAME = 'kisti_session'
const SESSION_EXPIRY_DAYS = 7

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS)

  await db.session.create({
    data: { userId, token, expiresAt }
  })

  return token
}

export async function getSession(): Promise<{ id: string; userId: string; user: { id: string; name: string; mobile: string; email: string | null; role: string } } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) return null

  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
        select: { id: true, name: true, mobile: true, email: true, role: true }
      }
    }
  })

  if (!session) return null
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } })
    return null
  }

  return {
    id: session.id,
    userId: session.user.id,
    user: session.user
  }
}

export async function deleteSession(token: string): Promise<void> {
  await db.session.deleteMany({ where: { token } })
}

export { SESSION_COOKIE_NAME }
