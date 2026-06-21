import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../lib/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

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
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
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
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
