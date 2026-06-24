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

// SYSTEM SETTINGS
router.post('/settings', async (req, res) => {
  try {
    const { settings } = req.body; // Array of {key, value}
    
    for (const setting of settings) {
      await prisma.systemSetting.upsert({
        where: { key: setting.key },
        update: { value: String(setting.value) },
        create: { key: setting.key, value: String(setting.value) }
      });
    }
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ANNOUNCEMENTS
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json({ announcements });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/announcements', async (req, res) => {
  try {
    const { title, content, type, status, scheduledFor } = req.body;
    const announcement = await prisma.announcement.create({
      data: { title, content, type, status, scheduledFor }
    });
    return res.json({ announcement });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, type, status, scheduledFor } = req.body;
    const announcement = await prisma.announcement.update({
      where: { id },
      data: { title, content, type, status, scheduledFor }
    });
    return res.json({ announcement });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/announcements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.announcement.delete({ where: { id } });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// USER MANAGEMENT
router.get('/users', async (req, res) => {
  try {
    const { search = '', page = '1', limit = '10' } = req.query;
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const skip = (pageNumber - 1) * limitNumber;

    const whereClause = search ? {
      OR: [
        { name: { contains: String(search), mode: 'insensitive' as const } },
        { email: { contains: String(search), mode: 'insensitive' as const } }
      ]
    } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take: limitNumber,
        orderBy: { createdAt: 'desc' },
        include: { portfolios: true }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    // calculate portfolio value simply by quantity (real portfolio value requires current prices, which might be too heavy for admin list)
    // we'll just send raw portfolio back
    return res.json({ users, total, page: pageNumber, totalPages: Math.ceil(total / limitNumber) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.patch('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['ACTIVE', 'SUSPENDED', 'BANNED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const user = await prisma.user.update({
      where: { id },
      data: { status }
    });
    return res.json({ user });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// WALLET MANAGEMENT
router.patch('/users/:id/wallet/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { walletStatus } = req.body;
    if (!['ACTIVE', 'FROZEN'].includes(walletStatus)) {
      return res.status(400).json({ error: 'Invalid wallet status' });
    }
    const user = await prisma.user.update({
      where: { id },
      data: { walletStatus }
    });
    return res.json({ user });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/users/:id/wallet/balance', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, action } = req.body; // action: 'CREDIT' or 'DEBIT'
    
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let newBalance = user.fiatBalance;
    if (action === 'CREDIT') newBalance += amount;
    else if (action === 'DEBIT') newBalance -= amount;
    else return res.status(400).json({ error: 'Invalid action' });

    if (newBalance < 0) return res.status(400).json({ error: 'Insufficient funds' });

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { fiatBalance: newBalance }
    });

    return res.json({ user: updatedUser });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// ASSET MANAGEMENT
const DEFAULT_CRYPTO = ['BTC', 'ETH', 'SOL', 'DOGE', 'ADA'];
const DEFAULT_STOCKS = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'GOOGL'];

router.get('/assets', async (req, res) => {
  try {
    const existing = await prisma.asset.findMany({ select: { symbol: true } });
    const existingSymbols = new Set(existing.map(a => a.symbol));

    const toCreate = [];
    for (const sym of DEFAULT_CRYPTO) {
      if (!existingSymbols.has(sym)) toCreate.push({ symbol: sym, name: sym, type: 'CRYPTO' });
    }
    for (const sym of DEFAULT_STOCKS) {
      if (!existingSymbols.has(sym)) toCreate.push({ symbol: sym, name: sym, type: 'STOCK' });
    }

    if (toCreate.length > 0) {
      await prisma.asset.createMany({ data: toCreate, skipDuplicates: true });
    }

    const assets = await prisma.asset.findMany({
      orderBy: { symbol: 'asc' }
    });
    return res.json({ assets });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/assets/upsert', async (req, res) => {
  try {
    const { symbol, name, type, availableSupply, status } = req.body;
    
    if (!symbol || !name || !type || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const supplyValue = availableSupply === '' || availableSupply === null || availableSupply === undefined ? null : parseFloat(availableSupply);

    const asset = await prisma.asset.upsert({
      where: { symbol: symbol.toUpperCase() },
      update: {
        name,
        type: type.toUpperCase(),
        availableSupply: supplyValue,
        status: status.toUpperCase()
      },
      create: {
        symbol: symbol.toUpperCase(),
        name,
        type: type.toUpperCase(),
        availableSupply: supplyValue,
        status: status.toUpperCase()
      }
    });

    return res.json({ asset });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const { settings } = req.body;
    if (!Array.isArray(settings)) {
      return res.status(400).json({ error: 'Settings must be an array' });
    }

    for (const { key, value } of settings) {
      await prisma.systemSetting.upsert({
        where: { key: String(key) },
        update: { value: String(value) },
        create: { key: String(key), value: String(value) }
      });
    }

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
