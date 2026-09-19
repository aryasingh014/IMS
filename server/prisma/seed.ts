import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/passwordUtils.js';

const prisma = new PrismaClient();

// ponytail: clean database initialization keeping only standard Admin account
async function main() {
  console.log('🧹 Clearing all dummy data from database...');

  await prisma.alert.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.whatsAppMessage.deleteMany();
  await prisma.syncLog.deleteMany();
  await prisma.googleSheetConfig.deleteMany();
  await prisma.fTEvaluation.deleteMany();
  await prisma.performanceReview.deleteMany();
  await prisma.blocker.deleteMany();
  await prisma.dailyUpdate.deleteMany();
  await prisma.task.deleteMany();
  await prisma.intern.deleteMany();
  await prisma.project.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  // Create clean System Administrator
  const admin = await prisma.user.create({
    data: {
      email: 'admin@company.com',
      name: 'Arya Singh',
      password: hashPassword('adminpassword123'),
      role: 'ADMIN',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  console.log('✅ Clean database ready! Admin created: admin@company.com');
}

main()
  .catch((e) => {
    console.error('Error during database reset:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
