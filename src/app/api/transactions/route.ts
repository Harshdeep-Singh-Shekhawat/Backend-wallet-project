import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await requireAuth();
    const user = await prisma.user.findUnique({ where: { id: userId } });
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
