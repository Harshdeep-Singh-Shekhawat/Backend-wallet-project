import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../lib/auth';
import { processOrder } from '../lib/matchingEngine';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { asset: true },
    });
    return res.json({ orders });
  } catch (error: any) {
    return res.status(401).json({ error: error.message });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { symbol, type, orderType, quantity, price } = req.body;

    if (!symbol || !type || !orderType || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    if (orderType === 'LIMIT' && (!price || price <= 0)) {
      return res.status(400).json({ error: 'Price required for Limit orders' });
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
    processOrder(newOrder.id).catch(console.error);

    return res.json({ order: newOrder });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const orderId = req.query.orderId as string;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
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

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
