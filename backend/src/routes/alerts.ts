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
        priceAlerts: {
          include: { asset: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ alerts: user.priceAlerts });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { symbol, targetPrice, condition } = req.body;

    if (!symbol || !targetPrice || !condition) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let asset = await prisma.asset.findUnique({ where: { symbol } });
    if (!asset) {
      asset = await prisma.asset.create({
        data: { symbol, name: symbol, type: 'CRYPTO' },
      });
    }

    const alert = await prisma.priceAlert.create({
      data: {
        userId,
        assetId: asset.id,
        targetPrice,
        condition,
        isActive: true,
      },
      include: { asset: true },
    });

    return res.json({ alert });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const id = req.query.id as string;

    if (!id) {
      return res.status(400).json({ error: 'Alert ID is required' });
    }

    await prisma.priceAlert.deleteMany({
      where: {
        id,
        userId,
      },
    });

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
