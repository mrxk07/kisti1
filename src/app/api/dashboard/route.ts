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

    const [applications, transactions, repayments, unreadNotifications] = await Promise.all([
      db.loanApplication.findMany({
        where: { userId: session.userId },
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      db.transaction.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      db.repayment.findMany({
        where: { userId: session.userId, status: 'PENDING' },
        orderBy: { dueDate: 'asc' },
        take: 3
      }),
      db.notification.count({
        where: { userId: session.userId, isRead: false }
      })
    ])

    const activeApp = applications.find(a => a.status === 'APPROVED')
    let balance = 0
    if (activeApp) {
      const paidRepayments = await db.repayment.findMany({
        where: { applicationId: activeApp.id, status: 'PAID' }
      })
      const totalPaid = paidRepayments.reduce((sum, r) => sum + r.amount, 0)
      balance = activeApp.amount - totalPaid
    }

    const totalTransactions = await db.transaction.count({
      where: { userId: session.userId }
    })

    return NextResponse.json({
      user: session.user,
      balance,
      recentApplications: applications,
      recentTransactions: transactions,
      upcomingRepayments: repayments,
      unreadNotifications,
      totalTransactions
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'দুঃখিত, একটি সমস্যা হয়েছে।' }, { status: 500 })
  }
}
