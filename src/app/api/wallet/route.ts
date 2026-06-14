import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Decimal from 'decimal.js';

export async function POST(request: Request) {
  try {
    const { action, amount } = await request.json();

    if (!action || !['deposit', 'withdraw'].includes(action) || !amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const txAmount = new Decimal(amount);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get User
      const user = await tx.user.findFirst();
      if (!user) throw new Error('User not found');

      const userBalance = new Decimal(user.fiatBalance);
      let newBalance: Decimal;

      if (action === 'withdraw') {
        if (userBalance.lessThan(txAmount)) {
          throw new Error('Insufficient funds');
        }
        newBalance = userBalance.minus(txAmount);
      } else {
        newBalance = userBalance.plus(txAmount);
      }

      // 2. Update fiat
      await tx.user.update({
        where: { id: user.id },
        data: { fiatBalance: newBalance.toNumber() },
      });

      // 3. Record Transaction
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: action === 'deposit' ? 'DEPOSIT' : 'WITHDRAW',
          quantity: txAmount.toNumber(),
          pricePerUnit: 1, // Fiat is 1:1
          totalValue: txAmount.toNumber(),
        },
      });

      return { newBalance: newBalance.toNumber() };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('Wallet Action Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
