import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@neotrade.com';
  const hashedPassword = '$2b$10$D2idLzlD5qav/Kkw/zpkMe88QZI9yMyP1fqZBDe0Ln8NZA5CLodgy';
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, role: 'ADMIN' }
    });
    console.log('Updated admin password to admin123');
  } else {
    await prisma.user.create({
      data: { email, name: 'Admin', password: hashedPassword, role: 'ADMIN', fiatBalance: 10000 }
    });
    console.log('Created admin account with password admin123');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
