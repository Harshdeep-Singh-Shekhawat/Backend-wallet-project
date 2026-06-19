import { Router } from 'express';
import yahooFinanceModule from 'yahoo-finance2';

const router = Router();
const YahooFinance = ((yahooFinanceModule as any).default || yahooFinanceModule) as new () => any;
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });
const CRYPTO_SYMBOLS = new Set(['BTC', 'ETH', 'SOL', 'DOGE', 'ADA']);

const toYahooSymbol = (symbol: string) => {
  const cleanSymbol = symbol.trim().toUpperCase();
  return CRYPTO_SYMBOLS.has(cleanSymbol) ? `${cleanSymbol}-USD` : cleanSymbol;
};

router.get('/', async (req, res) => {
  try {
    const symbolsParam = req.query.symbols as string;
    if (!symbolsParam) {
      return res.status(400).json({ error: 'Symbols parameter is required' });
    }

    const symbols = symbolsParam
      .split(',')
      .map((symbol) => symbol.trim().toUpperCase())
      .filter(Boolean);
    
    // Fetch quotes in parallel
    const quotes = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const result = await yahooFinance.quote(toYahooSymbol(symbol)) as any;
          return {
            symbol,
            price: result.regularMarketPrice,
            change: result.regularMarketChange,
            changePercent: result.regularMarketChangePercent,
            name: result.shortName || result.longName || symbol,
          };
        } catch (e) {
          console.error(`Failed to fetch quote for ${symbol}:`, e);
          return null;
        }
      })
    );

    // Filter out failed quotes
    const validQuotes = quotes.filter(Boolean);

    // Format as a map: { AAPL: 150, BTC: 63165 }, which is what the frontend reads.
    const priceMap = validQuotes.reduce((acc, quote: any) => {
      if (typeof quote.price === 'number') {
        acc[quote.symbol] = quote.price;
      }
      return acc;
    }, {} as Record<string, number>);

    return res.json({ prices: priceMap });
  } catch (error) {
    console.error('Prices GET Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/history', async (req, res) => {
  try {
    const symbol = req.query.symbol as string;
    const range = req.query.range as string || '1mo';

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol parameter is required' });
    }

    const now = new Date();
    let period1 = new Date();
    let interval: '1m' | '5m' | '15m' | '1d' | '1wk' | '1mo' = '1d';

    switch (range) {
      case '1d':
        period1.setDate(now.getDate() - 1);
        interval = '15m';
        break;
      case '5d':
        period1.setDate(now.getDate() - 5);
        interval = '15m';
        break;
      case '1mo':
        period1.setMonth(now.getMonth() - 1);
        interval = '1d';
        break;
      case '3mo':
        period1.setMonth(now.getMonth() - 3);
        interval = '1d';
        break;
      case '1y':
        period1.setFullYear(now.getFullYear() - 1);
        interval = '1wk';
        break;
      default:
        period1.setMonth(now.getMonth() - 1);
        interval = '1d';
    }

    const result = (await yahooFinance.chart(toYahooSymbol(symbol), {
      period1,
      period2: now,
      interval,
    })) as { quotes?: any[] };

    const formattedData = (result.quotes || [])
      .map((item: any) => ({
        date: item.date,
        price: item.close,
      }))
      .filter((item) => item.date && typeof item.price === 'number');

    return res.json({ history: formattedData });
  } catch (error) {
    console.error('Prices History Error:', error);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
});

export default router;
