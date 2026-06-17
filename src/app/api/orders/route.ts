import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { processOrder } from '@/lib/matchingEngine';

export async function GET() {
  try {
    const userId = await requireAuth();
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { asset: true },
    });
    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireAuth();
    const { symbol, type, orderType, quantity, price } = await request.json();

    if (!symbol || !type || !orderType || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 });
    }

    if (orderType === 'LIMIT' && (!price || price <= 0)) {
      return NextResponse.json({ error: 'Price required for Limit orders' }, { status: 400 });
    }

    // Ensure asset exists
    let asset = await prisma.asset.findUnique({ where: { symbol } });
    if (!asset) {
      asset = await prisma.asset.create({
        data: { symbol, name: symbol, type: 'CRYPTO' }, // default crypto
      });
    }

    // Lock funds / assets
    const newOrder = await prisma.$transaction(async (tx) => {
      if (type === 'BUY') {
        const user = await tx.user.findUnique({ where: { id: userId } });
        const requiredFiat = quantity * price;
        if (!user || user.fiatBalance < requiredFiat) {
          throw new Error('Insufficient fiat balance');
        }

        // Lock fiat
        await tx.user.update({
          where: { id: userId },
          data: {
            fiatBalance: { decrement: requiredFiat },
            lockedFiatBalance: { increment: requiredFiat },
          },
        });
      } else if (type === 'SELL') {
        const portfolio = await tx.portfolio.findUnique({
          where: { userId_assetId: { userId, assetId: asset!.id } },
        });
        if (!portfolio || portfolio.quantity < quantity) {
          throw new Error('Insufficient asset quantity');
        }

        // Lock asset
        await tx.portfolio.update({
          where: { id: portfolio.id },
          data: {
            quantity: { decrement: quantity },
            lockedQuantity: { increment: quantity },
          },
        });
      }

      // Create Order
      return await tx.order.create({
        data: {
          userId,
          assetId: asset!.id,
          type,
          orderType,
          price,
          quantity,
          status: 'PENDING',
        },
      });
    });

    // Fire matching engine asynchronously
    // Don't await it so we can return response instantly (or await it to show fill state immediately)
    await processOrder(newOrder.id);

    return NextResponse.json({ order: newOrder });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await requireAuth();
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id: orderId } });
      if (!order || order.userId !== userId) throw new Error('Order not found');
      if (order.status !== 'PENDING' && order.status !== 'PARTIAL') throw new Error('Order cannot be cancelled');

      const remainingQty = order.quantity - order.filledQuantity;

      // Refund locks
      if (order.type === 'BUY' && order.price) {
        const refundFiat = remainingQty * order.price;
        await tx.user.update({
          where: { id: userId },
          data: {
            lockedFiatBalance: { decrement: refundFiat },
            fiatBalance: { increment: refundFiat },
          },
        });
      } else if (order.type === 'SELL') {
        await tx.portfolio.updateMany({
          where: { userId, assetId: order.assetId },
          data: {
            lockedQuantity: { decrement: remainingQty },
            quantity: { increment: remainingQty },
          },
        });
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
