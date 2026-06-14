'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface TradeWidgetProps {
  fiatBalance: number;
  prices: Record<string, number>;
  symbol: string;
  setSymbol: (symbol: string) => void;
  onTradeSuccess: () => void;
}

export default function TradeWidget({ fiatBalance, prices, symbol, setSymbol, onTradeSuccess }: TradeWidgetProps) {
  const [activeTab, setActiveTab] = useState<'BUY' | 'SELL'>('BUY');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const currentPrice = prices[symbol] || 0;
  const numAmount = parseFloat(amount) || 0;
  const estimatedValue = numAmount * currentPrice;

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !amount || numAmount <= 0) return;
    if (currentPrice <= 0) {
      setError('Price data unavailable');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await fetch(`/api/trade/${activeTab.toLowerCase()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol,
          quantity: numAmount,
          currentPrice,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Trade failed');
      }

      setAmount('');
      setSuccessMsg(`Successfully ${activeTab === 'BUY' ? 'bought' : 'sold'} ${numAmount} ${symbol}`);
      onTradeSuccess();
      
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-slate-900">Trade</h3>
        <div className="text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          Available: <span className="text-slate-900 font-bold">${fiatBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
        <button
          onClick={() => { setActiveTab('BUY'); setError(''); setSuccessMsg(''); }}
          className={cn(
            "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all",
            activeTab === 'BUY' ? "bg-green-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
          )}
        >
          Buy
        </button>
        <button
          onClick={() => { setActiveTab('SELL'); setError(''); setSuccessMsg(''); }}
          className={cn(
            "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all",
            activeTab === 'SELL' ? "bg-red-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
          )}
        >
          Sell
        </button>
      </div>

      <form onSubmit={handleTrade} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Asset Symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="e.g. BTC"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 text-[15px] font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all uppercase placeholder:text-slate-400 placeholder:font-normal"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-semibold text-slate-700">Quantity</label>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              {currentPrice ? `@ $${currentPrice.toLocaleString()}` : 'Loading...'}
            </span>
          </div>
          <input
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 text-[15px] font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-400 placeholder:font-normal"
            required
          />
        </div>

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-center">
          <span className="text-sm text-slate-500 font-medium">Estimated Cost</span>
          <span className="font-bold text-lg text-slate-900">
            ${estimatedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {error && (
          <div className="text-red-600 text-sm font-medium bg-red-50 p-3.5 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="text-green-700 text-sm font-medium bg-green-50 p-3.5 rounded-xl border border-green-100">
            {successMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || currentPrice <= 0 || numAmount <= 0}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-[15px] flex items-center justify-center transition-all shadow-md",
            activeTab === 'BUY' 
              ? "bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300 shadow-green-600/20" 
              : "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300 shadow-red-600/20",
            (isLoading || currentPrice <= 0 || numAmount <= 0) && "cursor-not-allowed opacity-70"
          )}
        >
          {isLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
          {activeTab === 'BUY' ? 'Buy Now' : 'Sell Now'}
        </button>
      </form>
    </div>
  );
}
