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
import ordersRoutes from './routes/orders';
import orderbookRoutes from './routes/orderbook';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/prices', pricesRoutes);
app.use('/api/trade', tradeRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/orderbook', orderbookRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
