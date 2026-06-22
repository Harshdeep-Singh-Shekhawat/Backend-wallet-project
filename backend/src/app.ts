import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth';
import portfolioRoutes from './routes/portfolio';
import pricesRoutes from './routes/prices';
import tradeRoutes from './routes/trade';
import walletRoutes from './routes/wallet';
import watchlistRoutes from './routes/watchlist';
import alertsRoutes from './routes/alerts';
import adminRoutes from './routes/admin';

export const app = express();

app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
import { prisma } from './lib/prisma';
app.get('/api/health', async (req, res) => {
  try {
    const c = await prisma.alert.count();
    res.json({ count: c, ok: true, dbUrl: process.env.DATABASE_URL });
  } catch (e: any) {
    res.status(500).json({ error: e.message, dbUrl: process.env.DATABASE_URL });
  }
});
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/prices', pricesRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/admin', adminRoutes);
