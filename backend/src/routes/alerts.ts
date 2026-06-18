import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../lib/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    
    const alerts = await prisma.alert.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ alerts });
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

    const alert = await prisma.alert.create({
      data: {
        userId,
        symbol,
        targetPrice,
        direction: condition,
      },
    });

    return res.json({ alert });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const id = (req.query.alertId || req.query.id) as string;

    if (!id) {
      return res.status(400).json({ error: 'Alert ID is required' });
    }

    await prisma.alert.deleteMany({
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
