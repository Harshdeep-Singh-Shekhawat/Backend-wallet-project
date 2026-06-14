import { NextResponse } from 'next/server';
import yahooFinancePkg from 'yahoo-finance2';
const yahooFinance = new (yahooFinancePkg as any)({ suppressNotices: ['yahooSurvey'] });

// Simple in-memory cache to prevent rate limits
const cache: Record<string, { price: number; timestamp: number }> = {};
const CACHE_TTL_MS = 15 * 1000; // 15 seconds to keep it "live" but prevent spam

const COINGECKO_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  DOGE: 'dogecoin',
  ADA: 'cardano',
  XRP: 'ripple',
  DOT: 'polkadot',
  LTC: 'litecoin',
  LINK: 'chainlink'
};

async function fetchCryptoPrices(symbols: string[]) {
  const ids = symbols.map((s) => COINGECKO_MAP[s.toUpperCase()]).filter(Boolean);
  if (ids.length === 0) return {};

  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd`);
    if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
    const data = await res.json();
    
    const result: Record<string, number> = {};
    for (const sym of symbols) {
      const id = COINGECKO_MAP[sym.toUpperCase()];
      if (id && data[id] && data[id].usd) {
        result[sym.toUpperCase()] = data[id].usd;
      }
    }
    return result;
  } catch (err) {
    console.error('Error fetching crypto:', err);
    return {};
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbolsParam = searchParams.get('symbols');
  if (!symbolsParam) {
    return NextResponse.json({ error: 'Missing symbols parameter' }, { status: 400 });
  }

  const symbols = symbolsParam.split(',').map((s) => s.trim().toUpperCase());
  const now = Date.now();
  const result: Record<string, number> = {};
  
  const toFetchCrypto: string[] = [];
  const toFetchStock: string[] = [];

  for (const sym of symbols) {
    if (cache[sym] && now - cache[sym].timestamp < CACHE_TTL_MS) {
      result[sym] = cache[sym].price;
    } else {
      if (COINGECKO_MAP[sym]) {
        toFetchCrypto.push(sym);
      } else {
        toFetchStock.push(sym);
      }
    }
  }

  // Fetch from CoinGecko for Crypto
  if (toFetchCrypto.length > 0) {
    const cryptoPrices = await fetchCryptoPrices(toFetchCrypto);
    for (const [sym, price] of Object.entries(cryptoPrices)) {
      result[sym] = price;
      cache[sym] = { price, timestamp: now };
    }
  }

  // Fetch from Yahoo Finance for Stocks
  if (toFetchStock.length > 0) {
    try {
      const quotes = await yahooFinance.quote(toFetchStock);
      const quotesArray = (Array.isArray(quotes) ? quotes : [quotes]) as any[];
      
      for (const quote of quotesArray) {
        if (quote && quote.symbol && quote.regularMarketPrice) {
          result[quote.symbol.toUpperCase()] = quote.regularMarketPrice;
          cache[quote.symbol.toUpperCase()] = { price: quote.regularMarketPrice, timestamp: now };
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
