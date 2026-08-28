import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'এই পেজটি দেখার অনুমতি আপনার নেই।' }, { status: 403 })
    }

    const applications = await db.loanApplication.findMany({
      include: {
        user: { select: { id: true, name: true, mobile: true, email: true } },
        plan: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ applications })
  } catch (error) {
    console.error('Admin fetch applications error:', error)
    return NextResponse.json({ error: 'দুঃখিত, একটি সমস্যা হয়েছে।' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'এই পেজটি দেখার অনুমতি আপনার নেই।' }, { status: 403 })
    }

    const { applicationId, status, rejectionReason } = await request.json()

    if (!applicationId || !status) {
      return NextResponse.json({ error: 'এই তথ্যটি অবশ্যই দিতে হবে।' }, { status: 400 })
    }

    const validStatuses = ['PENDING', 'VERIFYING', 'APPROVED', 'REJECTED', 'COMPLETED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'অবৈধ অবস্থা।' }, { status: 400 })
    }

    const application = await db.loanApplication.findUnique({ where: { id: applicationId } })
    if (!application) {
      return NextResponse.json({ error: 'আবেদন পাওয়া যায়নি।' }, { status: 404 })
    }

    const updated = await db.loanApplication.update({
      where: { id: applicationId },
      data: {
        status,
        rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        reviewedBy: session.userId,
        reviewedAt: new Date()
      }
    })

    const statusBn: Record<string, string> = {
      VERIFYING: 'যাচাই চলছে',
      APPROVED: 'অনুমোদিত',
      REJECTED: 'প্রত্যাখ্যাত',
      COMPLETED: 'সম্পন্ন'
    }

    await db.notification.create({
      data: {
        userId: application.userId,
        title: `আবেদন ${statusBn[status] || status}`,
        message: `আপনার ৳${application.amount} ঋণের আবেদনের অবস্থা এখন "${statusBn[status] || status}"।${status === 'REJECTED' && rejectionReason ? ` কারণ: ${rejectionReason}` : ''}`
      }
    })

    if (status === 'APPROVED') {
      await db.transaction.create({
        data: {
          userId: application.userId,
          applicationId: application.id,
          type: 'DISBURSEMENT',
          amount: application.amount,
          description: `ঋণ অব্যবহৃত: ৳${application.amount}`
        }
      })

      const installmentAmount = application.totalRepayable / application.installmentCount
      for (let i = 1; i <= application.installmentCount; i++) {
        const dueDate = new Date()
        dueDate.setMonth(dueDate.getMonth() + i)
        await db.repayment.create({
          data: {
            userId: application.userId,
            applicationId: application.id,
            amount: installmentAmount,
            installmentNumber: i,
            dueDate,
            status: 'PENDING'
          }
        })
      }
    }

    await db.auditLog.create({
      data: { userId: session.userId, action: 'APPLICATION_STATUS_UPDATED', details: `আবেদন ${applicationId} অবস্থা: ${status}` }
    })

    return NextResponse.json({ success: true, application: updated })
  } catch (error) {
    console.error('Admin update application error:', error)
    return NextResponse.json({ error: 'দুঃখিত, একটি সমস্যা হয়েছে।' }, { status: 500 })
  }
}
