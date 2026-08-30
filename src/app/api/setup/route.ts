import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Auto-setup endpoint for Vercel deployment
// After deploy, visit: YOUR_DOMAIN/api/setup?secret=kisti-setup-2026
// Or set SETUP_SECRET env var for custom secret

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (!secret || secret !== (process.env.SETUP_SECRET || 'kisti-setup-2026')) {
      return NextResponse.json({ error: 'অনুমতি নেই।' }, { status: 403 })
    }

    const db = new PrismaClient()

    // Test database connection
    await db.$connect()
    await db.$queryRaw`SELECT 1 as ok`

    // Seed admin user if not exists
    const existingAdmin = await db.user.findFirst({ where: { mobile: '01700000000' } })
    if (!existingAdmin) {
      const adminPassword = await bcrypt.hash('admin123', 12)
      await db.user.create({
        data: {
          name: 'প্রশাসক',
          mobile: '01700000000',
          email: 'admin@kisti.com',
          passwordHash: adminPassword,
          role: 'ADMIN'
        }
      })
    }

    // Seed loan plans if none exist
    const planCount = await db.loanPlan.count()
    if (planCount === 0) {
      const plans = [
        { id: 'plan-5650', name: 'বেসিক প্ল্যান', amount: 5650, interest: 500, totalRepayable: 6150, installmentCount: 3 },
        { id: 'plan-12550', name: 'স্ট্যান্ডার্ড প্ল্যান', amount: 12550, interest: 1352, totalRepayable: 13902, installmentCount: 6 },
        { id: 'plan-25000', name: 'প্রিমিয়াম প্ল্যান', amount: 25000, interest: 2200, totalRepayable: 27200, installmentCount: 12 }
      ]
      for (const plan of plans) {
        await db.loanPlan.create({ data: plan })
      }
    }

    await db.$disconnect()

    return NextResponse.json({
      success: true,
      message: 'ডাটাবেস সফলভাবে সেটআপ হয়েছে!'
    })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({
      success: false,
      error: 'সেটআপ ব্যর্থ হয়েছে। DATABASE_URL এবং Prisma schema চেক করুন।',
      details: String(error)
    }, { status: 500 })
  }
}
