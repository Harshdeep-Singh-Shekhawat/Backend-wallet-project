import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import Decimal from 'decimal.js';

export async function POST(request: Request) {
  try {
    const { symbol, quantity, currentPrice } = await request.json();

    if (!symbol || !quantity || !currentPrice || quantity <= 0 || currentPrice <= 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const qty = new Decimal(quantity);
    const price = new Decimal(currentPrice);
    const totalProceeds = qty.mul(price);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get User
      const userId = await requireAuth();
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      // 2. Get Asset
      const asset = await tx.asset.findUnique({
        where: { symbol: symbol.toUpperCase() },
      });
      if (!asset) throw new Error('Asset not found');

      // 3. Get Portfolio
      const portfolio = await tx.portfolio.findUnique({
        where: { userId_assetId: { userId: user.id, assetId: asset.id } },
      });

      if (!portfolio) throw new Error('You do not own this asset');

      const existingQty = new Decimal(portfolio.quantity);
      if (existingQty.lessThan(qty)) {
        throw new Error('Insufficient asset quantity to sell');
      }

      // 4. Update Portfolio (remove or reduce)
      const newTotalQty = existingQty.minus(qty);
      if (newTotalQty.isZero()) {
        await tx.portfolio.delete({ where: { id: portfolio.id } });
      } else {
        await tx.portfolio.update({
          where: { id: portfolio.id },
          data: { quantity: newTotalQty.toNumber() },
          // Note: Avg purchase price remains the same on partial sell
        });
      }

      // 5. Add fiat
      const userBalance = new Decimal(user.fiatBalance);
      const newBalance = userBalance.plus(totalProceeds).toNumber();
      await tx.user.update({
        where: { id: user.id },
        data: { fiatBalance: newBalance },
      });

      // 6. Record Transaction
      await tx.transaction.create({
        data: {
          userId: user.id,
          assetId: asset.id,
          type: 'SELL',
          quantity: qty.toNumber(),
          pricePerUnit: price.toNumber(),
          totalValue: totalProceeds.toNumber(),
        },
      });

      return { newBalance, newQuantity: newTotalQty.toNumber() };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Sell Order Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
