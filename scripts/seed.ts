import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const db = new PrismaClient()

async function seed() {
  console.log('Seeding database...')

  // Connect to database (PostgreSQL)
  await db.$connect()
  console.log('Connected to database')

  // Seed admin user
  const existingAdmin = await db.user.findFirst({ where: { mobile: '01700000000' } })
  if (existingAdmin) {
    console.log('Admin already exists, skipping...')
  } else {
    const adminPassword = await bcrypt.hash('admin123', 12)
    const admin = await db.user.create({
      data: {
        name: 'প্রশাসক',
        mobile: '01700000000',
        email: 'admin@kisti.com',
        passwordHash: adminPassword,
        role: 'ADMIN'
      }
    })
    console.log(`Admin created: ${admin.mobile}`)
  }

  // Seed loan plans
  const existingPlans = await db.loanPlan.count()
  if (existingPlans > 0) {
    console.log(`Plans already exist (${existingPlans}), skipping...`)
  } else {
    const plans = [
      { id: 'plan-5650', name: 'বেসিক প্ল্যান', amount: 5650, interest: 500, totalRepayable: 6150, installmentCount: 3 },
      { id: 'plan-12550', name: 'স্ট্যান্ডার্ড প্ল্যান', amount: 12550, interest: 1352, totalRepayable: 13902, installmentCount: 6 },
      { id: 'plan-25000', name: 'প্রিমিয়াম প্ল্যান', amount: 25000, interest: 2200, totalRepayable: 27200, installmentCount: 12 }
    ]

    for (const plan of plans) {
      const p = await db.loanPlan.create({ data: plan })
      console.log(`Plan created: ${p.name}`)
    }
  }

  console.log('Seeding complete!')
}

seed()
  .catch(console.error)
  .finally(() => db.$disconnect())
