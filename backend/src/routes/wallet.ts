import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../lib/auth';

const router = Router();

router.post('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { action, amount } = req.body;

    if (!action || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid action or amount' });
    }

    const userId = req.userId!;

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      
      if (!user) {
        throw new Error('User not found');
      }

      if (action === 'withdraw' && user.fiatBalance < amount) {
        throw new Error('Insufficient funds');
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          fiatBalance: action === 'deposit' 
            ? { increment: amount }
            : { decrement: amount },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: action === 'deposit' ? 'DEPOSIT' : 'WITHDRAW',
          quantity: 0,
          pricePerUnit: 1,
          totalValue: amount,
        },
      });

      return { balance: updatedUser.fiatBalance, transaction };
    });

    return res.json(result);
  } catch (error: any) {
    console.error('Wallet Action Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
});

export default router;
