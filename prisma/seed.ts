import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/security';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@kisti.demo';
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || 'Admin@123456';
  const adminHash = hashPassword(adminPassword);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin',
      role: 'ADMIN',
      passwordHash: adminHash,
      isDemo: false,
      balance: 0,
    },
  });
  console.log(`Admin user created: ${admin.email}`);

  // Create 3 loan plans
  const plans = [
    { name: 'Starter Kisti', principalAmount: 5650, interestAmount: 500, totalAmount: 6150, active: true },
    { name: 'Standard Kisti', principalAmount: 12550, interestAmount: 1352, totalAmount: 13902, active: true },
    { name: 'Premium Kisti', principalAmount: 25000, interestAmount: 2200, totalAmount: 27200, active: true },
  ];

  for (const plan of plans) {
    const created = await prisma.loanPlan.upsert({
      where: { id: `plan-${plan.principalAmount}` },
      update: {},
      create: { ...plan },
    });
    // Use update to set the id if needed
    if (created.id !== `plan-${plan.principalAmount}`) {
      await prisma.loanPlan.update({ where: { id: created.id }, data: { id: `plan-${plan.principalAmount}` } }).catch(() => {});
    }
    console.log(`Plan created: ${plan.name}`);
  }

  // Create sample demo user with data
  const demoUser = await prisma.user.create({
    data: {
      name: 'Demo User Sample',
      role: 'DEMO',
      isDemo: true,
      balance: 5650,
      ipHash: 'sample_hash',
    },
  });

  // Create demo session
  await prisma.demoSession.create({
    data: {
      userId: demoUser.id,
      token: 'demo-sample-session-token',
      ipHash: 'sample_hash',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Get first plan
  const starterPlan = await prisma.loanPlan.findFirst({ where: { principalAmount: 5650 } });

  if (starterPlan) {
    // Create sample application
    const app = await prisma.application.create({
      data: {
        userId: demoUser.id,
        planId: starterPlan.id,
        status: 'APPROVED',
        principalAmount: starterPlan.principalAmount,
        interestAmount: starterPlan.interestAmount,
        totalAmount: starterPlan.totalAmount,
      },
    });

    // Create sample transactions
    await prisma.transaction.createMany({
      data: [
        { userId: demoUser.id, type: 'DEMO_LOAN_CREDIT', amount: 5650, description: 'Demo Loan Credit - Starter Kisti', status: 'COMPLETED', referenceId: app.id },
        { userId: demoUser.id, type: 'DEMO_INTEREST', amount: -500, description: 'Demo Interest - Starter Kisti', status: 'COMPLETED', referenceId: app.id },
        { userId: demoUser.id, type: 'DEMO_REPAYMENT', amount: -1025, description: 'Demo Repayment - Installment 1', status: 'COMPLETED', referenceId: app.id },
      ],
    });

    // Create repayment schedule (6 installments)
    const totalPayable = starterPlan.totalAmount;
    const installmentAmount = Math.round((totalPayable / 6) * 100) / 100;
    const repayments = [];
    for (let i = 1; i <= 6; i++) {
      repayments.push({
        userId: demoUser.id,
        applicationId: app.id,
        installmentNumber: i,
        dueAmount: i === 6 ? Math.round((totalPayable - installmentAmount * 5) * 100) / 100 : installmentAmount,
        paidAmount: i === 1 ? installmentAmount : 0,
        status: i === 1 ? 'DEMO_PAID' : 'PENDING',
        dueDate: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000),
        paidAt: i === 1 ? new Date() : null,
      });
    }
    await prisma.repayment.createMany({ data: repayments });
  }

  // Create sample verification
  await prisma.verification.create({
    data: {
      userId: demoUser.id,
      frontDocumentKey: 'demo/front-sample.jpg',
      backDocumentKey: 'demo/back-sample.jpg',
      status: 'VERIFIED',
    },
  });

  // Create sample notifications
  await prisma.notification.createMany({
    data: [
      { userId: demoUser.id, title: 'Application Approved', message: 'Your demo application for Starter Kisti has been approved.', read: false },
      { userId: demoUser.id, title: 'Balance Credited', message: 'Your demo balance has been credited with ৳5,650.00.', read: true },
      { userId: demoUser.id, title: 'Installment Due', message: 'Your next demo installment of ৳1,025.00 is due.', read: false },
    ],
  });

  // Create sample support ticket
  const ticket = await prisma.supportTicket.create({
    data: {
      userId: demoUser.id,
      subject: 'Question about repayment schedule',
      status: 'OPEN',
    },
  });
  await prisma.supportMessage.create({
    data: {
      ticketId: ticket.id,
      userId: demoUser.id,
      message: 'Can you explain how the repayment schedule works?',
      isAdmin: false,
    },
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SEED_DATA',
      details: 'Database seeded with initial data',
    },
  });

  console.log('Seeding complete!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
