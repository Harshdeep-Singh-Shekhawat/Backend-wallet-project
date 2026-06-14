import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('User not found');

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: {
        asset: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 20,
    });

    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error('Transactions Fetch Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
