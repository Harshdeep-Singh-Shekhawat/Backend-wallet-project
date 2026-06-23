import 'dotenv/config';
import { prisma } from './src/lib/prisma';

const DEFAULT_CRYPTO = ['BTC', 'ETH', 'SOL', 'DOGE', 'ADA'];
const DEFAULT_STOCKS = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'GOOGL'];

async function run() {
  try {
    const existing = await prisma.asset.findMany({ select: { symbol: true } });
    const existingSymbols = new Set(existing.map((a: any) => a.symbol));
    console.log("Existing symbols:", Array.from(existingSymbols));

    const toCreate: any[] = [];
    for (const sym of DEFAULT_CRYPTO) {
      if (!existingSymbols.has(sym)) toCreate.push({ symbol: sym, name: sym, type: 'CRYPTO' });
    }
    for (const sym of DEFAULT_STOCKS) {
      if (!existingSymbols.has(sym)) toCreate.push({ symbol: sym, name: sym, type: 'STOCK' });
    }

    console.log("To create:", toCreate);

    if (toCreate.length > 0) {
      const result = await prisma.asset.createMany({ data: toCreate, skipDuplicates: true });
      console.log("Create result:", result);
    }
    
    console.log("Final assets:", await prisma.asset.findMany());
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}
run();
