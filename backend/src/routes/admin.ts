import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../lib/auth';

const router = Router();

// Middleware to ensure user is ADMIN
const requireAdmin = async (req: AuthRequest, res: any, next: any) => {
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

router.use(requireAuth);
router.use(requireAdmin);

// Get all assets and their supplies
router.get('/assets', async (req, res) => {
  try {
    const assets = await prisma.asset.findMany({
      orderBy: { symbol: 'asc' }
    });
    return res.json({ assets });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Update the available supply of an asset
router.post('/assets/supply', async (req, res) => {
  try {
    const { symbol, availableSupply } = req.body;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    // Convert availableSupply to float or null
    const supplyValue = availableSupply === null || availableSupply === '' 
      ? null 
      : parseFloat(availableSupply);

    if (supplyValue !== null && isNaN(supplyValue)) {
      return res.status(400).json({ error: 'Invalid supply value' });
    }

    let asset = await prisma.asset.findUnique({ where: { symbol } });
    
    if (asset) {
      asset = await prisma.asset.update({
        where: { symbol },
        data: { availableSupply: supplyValue }
      });
    } else {
      asset = await prisma.asset.create({
        data: { 
          symbol, 
          name: symbol, 
          type: 'CRYPTO', // defaulting to CRYPTO
          availableSupply: supplyValue
        }
      });
    }

    return res.json({ success: true, asset });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
