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

router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.systemSetting.findMany();
    const config = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
    res.json({ config });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
