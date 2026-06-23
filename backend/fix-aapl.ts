import 'dotenv/config';
import { prisma } from './src/lib/prisma';

async function run() {
  try {
    await prisma.asset.update({
      where: { symbol: 'AAPL' },
      data: { type: 'STOCK' }
    });
    console.log("Fixed AAPL to STOCK");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}
run();
