import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../lib/auth';

const router = Router();

router.get('/assets', requireAuth, async (req, res) => {
  try {
    const assets = await prisma.asset.findMany();
    return res.json({ assets });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/buy', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { symbol, quantity, currentPrice } = req.body;

    if (!symbol || !quantity || !currentPrice || quantity <= 0) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    const totalCost = quantity * currentPrice;

    // Check if asset exists, otherwise create it
    let asset = await prisma.asset.findUnique({ where: { symbol } });
    if (!asset) {
      asset = await prisma.asset.create({
        data: { symbol, name: symbol, type: 'CRYPTO' }, // defaulting to CRYPTO for unknown
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Get User
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      if (user.status !== 'ACTIVE') throw new Error(`Your account is ${user.status.toLowerCase()}`);
      if (user.walletStatus !== 'ACTIVE') throw new Error('Your wallet is frozen');

      // 2. Check asset status
      if (asset!.status === 'DELISTED') throw new Error('This asset is delisted and cannot be traded');
      if (asset!.status === 'SUSPENDED') throw new Error('Trading is suspended for this asset (buying disabled)');

      // 3. Check balance
      if (user.fiatBalance < totalCost) {
        throw new Error('Insufficient fiat balance');
      }

      // 3. Deduct balance
      await tx.user.update({
        where: { id: userId },
        data: { fiatBalance: { decrement: totalCost } },
      });

      // 3.5 Check and deduct market supply
      const txAsset = await tx.asset.findUnique({ where: { id: asset!.id } });
      if (txAsset && txAsset.availableSupply !== null) {
        if (txAsset.availableSupply < quantity) {
          throw new Error(`Insufficient market supply. Only ${txAsset.availableSupply} ${symbol} available.`);
        }
        await tx.asset.update({
          where: { id: txAsset.id },
          data: { availableSupply: { decrement: quantity } }
        });
      }

      // 4. Add to portfolio
      const portfolio = await tx.portfolio.findUnique({
        where: { userId_assetId: { userId, assetId: asset!.id } },
      });

      if (portfolio) {
        // Recalculate average purchase price
        const currentTotalCost = portfolio.quantity * portfolio.averagePurchasePrice;
        const newTotalCost = currentTotalCost + totalCost;
        const newQuantity = portfolio.quantity + quantity;
        const newAveragePrice = newTotalCost / newQuantity;

        await tx.portfolio.update({
          where: { id: portfolio.id },
          data: {
            quantity: newQuantity,
            averagePurchasePrice: newAveragePrice,
          },
        });
      } else {
        await tx.portfolio.create({
          data: {
            userId,
            assetId: asset!.id,
            quantity,
            averagePurchasePrice: currentPrice,
          },
        });
      }

      // 5. Log Transaction
      await tx.transaction.create({
        data: {
          userId,
          assetId: asset!.id,
          type: 'BUY',
          quantity,
          pricePerUnit: currentPrice,
          totalValue: totalCost,
        },
      });

      return { success: true };
    });

    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Trade failed' });
  }
});

router.post('/sell', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { symbol, quantity, currentPrice } = req.body;

    if (!symbol || !quantity || !currentPrice || quantity <= 0) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    const totalReturn = quantity * currentPrice;

    const result = await prisma.$transaction(async (tx) => {
      // 0. Get User and check status
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');
      if (user.status !== 'ACTIVE') throw new Error(`Your account is ${user.status.toLowerCase()}`);
      if (user.walletStatus !== 'ACTIVE') throw new Error('Your wallet is frozen');

      // 1. Get Asset
      const asset = await tx.asset.findUnique({ where: { symbol } });
      if (!asset) throw new Error('Asset not found in portfolio');

      if (asset.status === 'DELISTED') {
        throw new Error('This asset is delisted and cannot be traded');
      }

      // 2. Check portfolio
      const portfolio = await tx.portfolio.findUnique({
        where: { userId_assetId: { userId, assetId: asset.id } },
      });

      if (!portfolio || portfolio.quantity < quantity) {
        throw new Error('Insufficient asset quantity');
      }

      // 3. Deduct from portfolio
      await tx.portfolio.update({
        where: { id: portfolio.id },
        data: {
          quantity: { decrement: quantity },
        },
      });

      // 4. Add fiat balance
      await tx.user.update({
        where: { id: userId },
        data: { fiatBalance: { increment: totalReturn } },
      });

      // 5. Log Transaction
      await tx.transaction.create({
        data: {
          userId,
          assetId: asset.id,
          type: 'SELL',
          quantity,
          pricePerUnit: currentPrice,
          totalValue: totalReturn,
        },
      });

      // 6. Increase market supply
      if (asset.availableSupply !== null) {
        await tx.asset.update({
          where: { id: asset.id },
          data: { availableSupply: { increment: quantity } }
        });
      }

      return { success: true };
    });

    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || 'Trade failed' });
  }
});

export default router;
