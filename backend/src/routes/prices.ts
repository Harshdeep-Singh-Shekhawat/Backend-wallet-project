import { Router } from 'express';
import yahooFinance from 'yahoo-finance2';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const symbolsParam = req.query.symbols as string;
    if (!symbolsParam) {
      return res.status(400).json({ error: 'Symbols parameter is required' });
    }

    const symbols = symbolsParam.split(',');
    
    // Fetch quotes in parallel
    const quotes = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const result = await yahooFinance.quote(symbol);
          return {
            symbol: result.symbol,
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

    // Format as a map: { 'AAPL': { price: 150, change: 1.5, ... } }
    const priceMap = validQuotes.reduce((acc, quote: any) => {
      acc[quote.symbol] = quote;
      return acc;
    }, {} as Record<string, any>);

    return res.json({ prices: priceMap });
  } catch (error) {
    console.error('Prices GET Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
