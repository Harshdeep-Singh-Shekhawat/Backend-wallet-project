import { Router } from 'express';
import { prisma } from '../lib/prisma';
import jwt from 'jsonwebtoken';
import 'dotenv/config';

const router = Router();

router.get('/token', async (req, res) => {
  const admin = await prisma.user.findUnique({ where: { email: 'admin@neotrade.com' } });
  if (!admin) return res.json({ error: 'No admin' });
  const token = jwt.sign({ userId: admin.id }, process.env.JWT_SECRET || '');
  res.json({ token });
});

export default router;
