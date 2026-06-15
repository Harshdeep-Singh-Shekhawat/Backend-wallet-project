import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        portfolios: {
          include: {
            asset: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      fiatBalance: user.fiatBalance,
      holdings: user.portfolios.map((p) => ({
        id: p.id,
        symbol: p.asset.symbol,
        name: p.asset.name,
        type: p.asset.type,
        quantity: p.quantity,
        averagePurchasePrice: p.averagePurchasePrice,
      })),
    });
  } catch (error) {
    console.error('Portfolio GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
