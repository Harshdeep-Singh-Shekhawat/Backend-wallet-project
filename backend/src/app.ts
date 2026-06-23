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
import systemRoutes from './routes/system';

export const app = express();

app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

import { prisma } from './lib/prisma';

// Maintenance Mode Middleware
app.use(async (req, res, next) => {
  // Allow admin, auth, and system routes to bypass maintenance
  if (req.path.startsWith('/api/admin') || req.path.startsWith('/api/auth') || req.path.startsWith('/api/system')) {
    return next();
  }

  try {
    const maintenanceMode = await prisma.systemSetting.findUnique({ where: { key: 'MAINTENANCE_MODE' } });
    if (maintenanceMode?.value === 'true') {
      const maintenanceMessage = await prisma.systemSetting.findUnique({ where: { key: 'MAINTENANCE_MESSAGE' } });
      return res.status(503).json({ 
        error: 'Service Unavailable', 
        message: maintenanceMessage?.value || 'The system is currently undergoing maintenance. Please try again later.',
        maintenance: true 
      });
    }
  } catch (err) {
    // silently ignore DB errors in middleware
  }

  next();
});

app.use('/api/auth', authRoutes);
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
app.use('/api/system', systemRoutes);
