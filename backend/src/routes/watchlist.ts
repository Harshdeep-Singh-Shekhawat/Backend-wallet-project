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
        watchlists: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ watchlists: user.watchlists });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { symbol } = req.body;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const watchlist = await prisma.watchlist.create({
      data: {
        userId,
        symbol,
      },
    });

    return res.json({ watchlist });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const symbol = req.query.symbol as string;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    await prisma.watchlist.deleteMany({
      where: {
        userId,
        symbol,
      },
    });

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
