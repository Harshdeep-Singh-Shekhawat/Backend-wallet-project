import 'dotenv/config';
import { prisma } from './src/lib/prisma';

async function main() {
  const res = await prisma.user.updateMany({
    where: { NOT: { email: 'admin@neotrade.com' } },
    data: { role: 'USER' }
  });
  console.log(`Reverted ${res.count} users to USER`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
