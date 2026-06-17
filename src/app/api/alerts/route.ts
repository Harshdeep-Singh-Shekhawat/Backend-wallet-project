import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await requireAuth();
    const alerts = await prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ alerts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireAuth();
    const { symbol, targetPrice, direction } = await request.json();

    if (!symbol || !targetPrice || !direction) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const alert = await prisma.alert.create({
      data: {
        userId,
        symbol: symbol.toUpperCase(),
        targetPrice: parseFloat(targetPrice),
        direction: direction.toUpperCase(), // ABOVE or BELOW
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({ alert });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await requireAuth();
    const { alertId, status } = await request.json();

    if (!alertId || !status) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Verify ownership
    const alert = await prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert || alert.userId !== userId) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const updated = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status,
        triggeredAt: status === 'TRIGGERED' ? new Date() : null,
      },
    });

    return NextResponse.json({ alert: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('alertId');

    if (!alertId) {
      return NextResponse.json({ error: 'alertId is required' }, { status: 400 });
    }

    // Verify ownership
    const alert = await prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert || alert.userId !== userId) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    await prisma.alert.delete({
      where: { id: alertId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
