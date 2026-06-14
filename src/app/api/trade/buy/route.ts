import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Decimal from 'decimal.js';

export async function POST(request: Request) {
  try {
    const { symbol, quantity, currentPrice } = await request.json();

    if (!symbol || !quantity || !currentPrice || quantity <= 0 || currentPrice <= 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const qty = new Decimal(quantity);
    const price = new Decimal(currentPrice);
    const totalCost = qty.mul(price);

    // Using transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Get User
      const user = await tx.user.findFirst();
      if (!user) throw new Error('User not found');

      const userBalance = new Decimal(user.fiatBalance);
      if (userBalance.lessThan(totalCost)) {
        throw new Error('Insufficient fiat balance');
      }

      // 2. Get or Create Asset
      let asset = await tx.asset.findUnique({
        where: { symbol: symbol.toUpperCase() },
      });

      if (!asset) {
        // Assume it's a crypto or stock based on some logic, or default to CRYPTO
        asset = await tx.asset.create({
          data: {
            symbol: symbol.toUpperCase(),
            name: symbol.toUpperCase(),
            type: 'CRYPTO', // Simplified for prototype
          },
        });
      }

      // 3. Deduct fiat
      const newBalance = userBalance.minus(totalCost).toNumber();
      await tx.user.update({
        where: { id: user.id },
        data: { fiatBalance: newBalance },
      });

      // 4. Update Portfolio
      let portfolio = await tx.portfolio.findUnique({
        where: { userId_assetId: { userId: user.id, assetId: asset.id } },
      });

      if (portfolio) {
        const existingQty = new Decimal(portfolio.quantity);
        const existingAvgPrice = new Decimal(portfolio.averagePurchasePrice);
        const existingTotalCost = existingQty.mul(existingAvgPrice);
        
        const newTotalQty = existingQty.plus(qty);
        const newTotalCost = existingTotalCost.plus(totalCost);
        const newAvgPrice = newTotalCost.div(newTotalQty);

        portfolio = await tx.portfolio.update({
          where: { id: portfolio.id },
          data: {
            quantity: newTotalQty.toNumber(),
            averagePurchasePrice: newAvgPrice.toNumber(),
          },
        });
      } else {
        portfolio = await tx.portfolio.create({
          data: {
            userId: user.id,
            assetId: asset.id,
            quantity: qty.toNumber(),
            averagePurchasePrice: price.toNumber(),
          },
        });
      }

      // 5. Record Transaction
      await tx.transaction.create({
        data: {
          userId: user.id,
          assetId: asset.id,
          type: 'BUY',
          quantity: qty.toNumber(),
          pricePerUnit: price.toNumber(),
          totalValue: totalCost.toNumber(),
        },
      });

      return { newBalance, portfolio };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Buy Order Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
