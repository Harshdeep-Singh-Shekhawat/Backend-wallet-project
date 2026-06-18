import { useState, useEffect, useRef } from 'react';

// A simple throttle utility to prevent thousands of renders per second
function useThrottle<T>(value: T, interval = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastUpdated = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now >= lastUpdated.current + interval) {
      lastUpdated.current = now;
      setThrottledValue(value);
    } else {
      const id = window.setTimeout(() => {
        lastUpdated.current = Date.now();
        setThrottledValue(value);
      }, interval - (now - lastUpdated.current));
      return () => window.clearTimeout(id);
    }
  }, [value, interval]);

  return throttledValue;
}

export function useWebSocketPrices(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const wsRef = useRef<WebSocket | null>(null);

  // We only throttle the prices going out to the UI
  const throttledPrices = useThrottle(prices, 500);

  useEffect(() => {
    if (!symbols || symbols.length === 0) return;

    // Filter crypto symbols (assuming 3-5 letter uppercase strings, e.g., BTC, ETH, SOL)
    // We ignore stocks like AAPL for now since Binance only tracks crypto.
    const cryptoSymbols = symbols.filter(s => ['BTC', 'ETH', 'SOL', 'DOGE', 'ADA'].includes(s.toUpperCase()));
    
    if (cryptoSymbols.length === 0) return;

    // Build the stream parameters for Binance (e.g., btcusdt@ticker)
    const streams = cryptoSymbols.map(s => `${s.toLowerCase()}usdt@ticker`);

    const ws = new WebSocket('wss://stream.binance.com:9443/ws');
    wsRef.current = ws;

    ws.onopen = () => {
      // Subscribe to all symbols
      ws.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: streams,
        id: 1,
      }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Binance ticker format has 's' for symbol (e.g., BTCUSDT) and 'c' for current close price
        if (data && data.e === '24hrTicker' && data.s && data.c) {
          const rawSymbol = data.s as string;
          // Strip 'USDT' to match our internal symbols (e.g., 'BTC')
          const symbol = rawSymbol.replace('USDT', '');
          const price = parseFloat(data.c);

          if (!isNaN(price)) {
            setPrices((prev) => {
              // Only update state if price actually changed to save renders
              if (prev[symbol] === price) return prev;
              return { ...prev, [symbol]: price };
            });
          }
        }
      } catch (err) {
        console.error('Failed to parse websocket message', err);
      }
    };

    ws.onerror = (error) => {
      console.error('Binance WebSocket Error:', error);
    };

    return () => {
      // Unsubscribe and close
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          method: 'UNSUBSCRIBE',
          params: streams,
          id: 1,
        }));
        ws.close();
      }
    };
  }, [symbols.join(',')]); // re-run only if the list of symbols changes

  return throttledPrices;
}
