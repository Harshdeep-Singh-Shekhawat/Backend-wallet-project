import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

// Simple in-memory cache to prevent rate limits
const cache: Record<string, { price: number; timestamp: number }> = {};
const CACHE_TTL_MS = 15 * 1000; // 15 seconds to keep it "live" but prevent spam

// Identify known crypto symbols so we can append "-USD" for Yahoo Finance
const CRYPTO_SYMBOLS = new Set(['BTC', 'ETH', 'SOL', 'DOGE', 'ADA', 'XRP', 'DOT', 'LTC', 'LINK']);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');
  if (!symbolsParam) {
    return NextResponse.json({ error: 'Missing symbols parameter' }, { status: 400 });
  }

  const symbols = symbolsParam.split(',').map((s) => s.trim().toUpperCase());
  const now = Date.now();
  const result: Record<string, number> = {};
  
  const toFetch: { original: string; yahooSymbol: string }[] = [];

  // Determine what needs fetching
  for (const sym of symbols) {
    if (cache[sym] && now - cache[sym].timestamp < CACHE_TTL_MS) {
      result[sym] = cache[sym].price;
    } else {
      const isCrypto = CRYPTO_SYMBOLS.has(sym);
      const yahooSymbol = isCrypto ? `${sym}-USD` : sym;
      toFetch.push({ original: sym, yahooSymbol });
    }
  }

  // Fetch from Yahoo Finance
  if (toFetch.length > 0) {
    // Yahoo finance quote can take an array
    const querySymbols = toFetch.map(item => item.yahooSymbol);
    
    try {
      const quotes = await yahooFinance.quote(querySymbols);
      // quote returns array if multiple, object if single
      const quotesArray = (Array.isArray(quotes) ? quotes : [quotes]) as any[];
      
      for (const quote of quotesArray) {
        if (quote && quote.symbol && quote.regularMarketPrice) {
          // Find the original symbol mapping
          const fetchItem = toFetch.find(item => item.yahooSymbol === quote.symbol);
          if (fetchItem) {
            result[fetchItem.original] = quote.regularMarketPrice;
            cache[fetchItem.original] = { price: quote.regularMarketPrice, timestamp: now };
          }
        }
      }
    } catch (err) {
      console.error(`Error fetching from Yahoo Finance:`, err);
    }
  }

  // Fallback for failed fetches if they were previously cached
  for (const sym of symbols) {
    if (result[sym] === undefined && cache[sym]) {
      result[sym] = cache[sym].price;
    }
  }

  return NextResponse.json({ prices: result });
}
