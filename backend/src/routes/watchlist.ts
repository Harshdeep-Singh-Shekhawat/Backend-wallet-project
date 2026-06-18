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
        watchlist: {
          include: { asset: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ watchlist: user.watchlist });
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

    let asset = await prisma.asset.findUnique({ where: { symbol } });
    if (!asset) {
      asset = await prisma.asset.create({
        data: { symbol, name: symbol, type: 'CRYPTO' },
      });
    }

    const watchlistItem = await prisma.watchlistItem.create({
      data: {
        userId,
        assetId: asset.id,
      },
      include: { asset: true },
    });

    return res.json({ watchlistItem });
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

    const asset = await prisma.asset.findUnique({ where: { symbol } });
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    await prisma.watchlistItem.deleteMany({
      where: {
        userId,
        assetId: asset.id,
      },
    });

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
