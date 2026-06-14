'use client';

import { useState } from 'react';
import useSWR from 'swr';
import DashboardLayout from '@/components/DashboardLayout';
import PortfolioOverview from '@/components/PortfolioOverview';
import HoldingsTable, { Holding } from '@/components/HoldingsTable';
import TradeWidget from '@/components/TradeWidget';
import AssetChart from '@/components/AssetChart';
import { Loader2, ArrowUpRight, ArrowDownRight, Wallet as WalletIcon, Clock, Shield, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Distinct soft colors for the live markets rows
const rowColors = [
  "bg-blue-50/70 border-blue-100 hover:bg-blue-100/70",
  "bg-emerald-50/70 border-emerald-100 hover:bg-emerald-100/70",
  "bg-purple-50/70 border-purple-100 hover:bg-purple-100/70",
  "bg-amber-50/70 border-amber-100 hover:bg-amber-100/70",
  "bg-rose-50/70 border-rose-100 hover:bg-rose-100/70",
  "bg-indigo-50/70 border-indigo-100 hover:bg-indigo-100/70",
  "bg-teal-50/70 border-teal-100 hover:bg-teal-100/70"
];

export default function App() {
  const [activeTab, setActiveTab] = useState('Portfolio');
  const [tradeSymbol, setTradeSymbol] = useState('BTC');

  // Wallet form state
  const [walletAction, setWalletAction] = useState<'deposit' | 'withdraw' | null>(null);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState('');

  // Fetch user portfolio & transactions
  const { data: portfolioData, mutate: mutatePortfolio } = useSWR('/api/portfolio', fetcher);
  const { data: transactionsData, mutate: mutateTransactions } = useSWR('/api/transactions', fetcher);

  // Extract unique symbols from portfolio + default symbols for widget
  const holdings: any[] = portfolioData?.holdings || [];
  const holdingSymbols = holdings.map((h) => h.symbol);
  
  // Track default symbols + current holdings + whatever is in the trade widget
  const trackSymbols = Array.from(new Set([...holdingSymbols, 'BTC', 'ETH', 'SOL', tradeSymbol]));
  
  // Fetch live prices every 30 seconds
  const { data: pricesData } = useSWR(
    trackSymbols.length > 0 ? `/api/prices?symbols=${trackSymbols.join(',')}` : null,
    fetcher,
    { refreshInterval: 30000 }
  );

  const prices = pricesData?.prices || {};
  const fiatBalance = portfolioData?.fiatBalance || 0;
  const transactions = transactionsData?.transactions || [];

  // Calculate totals
  let totalHoldingsValue = 0;
  let totalCost = 0;

  const enrichedHoldings: Holding[] = holdings.map((h) => {
    const currentPrice = prices[h.symbol] || h.averagePurchasePrice || 0;
    const value = h.quantity * currentPrice;
    const cost = h.quantity * h.averagePurchasePrice;
    
    totalHoldingsValue += value;
    totalCost += cost;

    return {
      ...h,
      currentPrice,
    };
  });

  const totalPnL = totalHoldingsValue - totalCost;
  const pnlPercentage = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  // Prepare data for the pie chart
  const chartData = [
    { name: 'Available Cash', value: fiatBalance },
    ...enrichedHoldings.map((h) => ({ name: h.symbol, value: h.quantity * h.currentPrice }))
  ];

  const handleWalletAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAction || !walletAmount || parseFloat(walletAmount) <= 0) return;

    setWalletLoading(true);
    setWalletError('');

    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: walletAction,
          amount: parseFloat(walletAmount),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transaction failed');

      setWalletAmount('');
      setWalletAction(null);
      mutatePortfolio();
      mutateTransactions();
    } catch (err: any) {
      setWalletError(err.message);
    } finally {
      setWalletLoading(false);
    }
  };

  if (!portfolioData) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="max-w-6xl mx-auto pb-20">
        
        {activeTab === 'Portfolio' && (
          <div className="space-y-8">
            <PortfolioOverview
              totalValue={totalHoldingsValue}
              fiatBalance={fiatBalance}
              totalPnL={totalPnL}
              pnlPercentage={pnlPercentage}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-slate-900">Your Assets</h3>
                  <button onClick={() => setActiveTab('Trade')} className="text-sm text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 font-semibold transition-colors px-4 py-2 rounded-lg">
                    Trade Now
                  </button>
                </div>
                <HoldingsTable holdings={enrichedHoldings} />
              </div>
              <div className="lg:col-span-1">
                <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full flex flex-col">
                  <h3 className="text-lg font-bold text-slate-900 mb-6">Asset Allocation</h3>
                  <div className="flex-1 flex items-center justify-center">
                    <AssetChart data={chartData} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Trade' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                 <h3 className="text-2xl font-bold text-slate-900 mb-2">Live Markets</h3>
                 <p className="text-slate-500 text-sm mb-6 font-medium">Real-time quotes. Click an asset to select it for trading.</p>
                 
                 <div className="flex flex-col gap-3">
                    {Array.from(new Set(['BTC', 'ETH', 'SOL', tradeSymbol])).map((sym, index) => {
                      if (!sym) return null;
                      const isUp = Math.random() > 0.5; // mocked direction
                      
                      const rowColorClass = rowColors[index % rowColors.length];
                      const isSelected = sym === tradeSymbol;
                      
                      return (
                      <div 
                        key={sym} 
                        onClick={() => setTradeSymbol(sym)} 
                        className={cn(
                          "p-4 rounded-xl border flex items-center justify-between transition-all cursor-pointer group", 
                          rowColorClass,
                          isSelected && "ring-2 ring-blue-500 ring-offset-2 scale-[1.01]"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white/60 shadow-sm flex items-center justify-center font-bold text-sm text-slate-800">
                            {sym[0]}
                          </div>
                          <div>
                            <div className="font-bold text-[15px] text-slate-900">{sym}</div>
                            <div className="text-[11px] font-medium text-slate-600 uppercase tracking-wider">Market</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[15px] text-slate-900">${prices[sym]?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '---'}</div>
                          <div className={cn("text-[11px] font-bold flex items-center justify-end gap-0.5", isUp ? "text-green-600" : "text-red-600")}>
                            {isUp ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>} LIVE
                          </div>
                        </div>
                      </div>
                    )})}
                 </div>
              </div>
            </div>
            <div>
              <div className="sticky top-24">
                <TradeWidget 
                  fiatBalance={fiatBalance}
                  prices={prices}
                  symbol={tradeSymbol}
                  setSymbol={setTradeSymbol}
                  onTradeSuccess={() => { mutatePortfolio(); mutateTransactions(); }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Wallets' && (
          <div className="space-y-8">
            <div className="bg-white border border-slate-100 rounded-2xl p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
               <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none text-blue-600">
                 <WalletIcon size={250} />
               </div>
               <div className="flex items-center gap-2 mb-2">
                 <h3 className="text-sm font-semibold text-slate-500">Available Cash</h3>
               </div>
               <p className="text-xs text-slate-400 font-medium mb-4 max-w-sm">This is your fiat balance used to buy assets. Add funds to start trading.</p>
               <div className="text-5xl font-bold text-slate-900 tracking-tight mb-8">
                 ${fiatBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </div>
               
               {!walletAction ? (
                 <div className="flex gap-4">
                   <button onClick={() => setWalletAction('deposit')} className="bg-blue-600 text-white hover:bg-blue-700 font-bold text-[15px] px-8 py-3.5 rounded-xl transition-colors shadow-md shadow-blue-600/20">
                     Add Funds
                   </button>
                   <button onClick={() => setWalletAction('withdraw')} className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-[15px] px-8 py-3.5 rounded-xl transition-colors">
                     Withdraw
                   </button>
                 </div>
               ) : (
                 <form onSubmit={handleWalletAction} className="max-w-md bg-slate-50 p-6 rounded-2xl border border-slate-100 relative z-10">
                   <h4 className="text-lg font-bold text-slate-900 mb-4 capitalize">{walletAction} Funds</h4>
                   <div className="mb-4">
                     <label className="block text-sm font-semibold text-slate-700 mb-2">Amount (USD)</label>
                     <input
                       type="number"
                       step="any"
                       value={walletAmount}
                       onChange={(e) => setWalletAmount(e.target.value)}
                       placeholder="0.00"
                       className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 text-[15px] font-semibold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                       required
                     />
                   </div>
                   {walletError && (
                     <div className="text-red-600 text-sm font-medium bg-red-50 p-3 rounded-lg border border-red-100 mb-4">
                       {walletError}
                     </div>
                   )}
                   <div className="flex gap-3">
                     <button
                       type="submit"
                       disabled={walletLoading}
                       className="flex-1 bg-blue-600 text-white hover:bg-blue-700 font-bold py-3.5 rounded-xl transition-colors shadow-md shadow-blue-600/20 disabled:opacity-70 flex justify-center items-center"
                     >
                       {walletLoading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
                       Confirm {walletAction}
                     </button>
                     <button
                       type="button"
                       onClick={() => { setWalletAction(null); setWalletError(''); setWalletAmount(''); }}
                       className="px-6 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors"
                     >
                       Cancel
                     </button>
                   </div>
                 </form>
               )}
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Activity</h3>
              
              {transactions.length === 0 ? (
                <div className="text-center text-slate-500 py-16 flex flex-col items-center justify-center gap-4 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                  <Clock className="w-10 h-10 text-slate-400" />
                  <span className="text-[15px] font-medium text-slate-600">No recent transfers.</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactions.map((tx: any) => {
                    const isDeposit = tx.type === 'DEPOSIT' || tx.type === 'SELL';
                    const icon = isDeposit ? <ArrowDownCircle className="w-6 h-6 text-emerald-500" /> : <ArrowUpCircle className="w-6 h-6 text-rose-500" />;
                    
                    let title = '';
                    let subTitle = '';
                    
                    if (tx.type === 'DEPOSIT') {
                      title = 'Fiat Deposit';
                      subTitle = 'Added to balance';
                    } else if (tx.type === 'WITHDRAW') {
                      title = 'Fiat Withdrawal';
                      subTitle = 'Sent to bank account';
                    } else if (tx.type === 'BUY') {
                      title = `Bought ${tx.asset?.symbol}`;
                      subTitle = `${tx.quantity} @ $${tx.pricePerUnit.toLocaleString()}`;
                    } else if (tx.type === 'SELL') {
                      title = `Sold ${tx.asset?.symbol}`;
                      subTitle = `${tx.quantity} @ $${tx.pricePerUnit.toLocaleString()}`;
                    }

                    return (
                      <div key={tx.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm", isDeposit ? "text-emerald-500" : "text-rose-500")}>
                            {icon}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{title}</div>
                            <div className="text-xs font-medium text-slate-500">{subTitle}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn("font-bold text-[15px]", isDeposit ? "text-emerald-600" : "text-rose-600")}>
                            {isDeposit ? '+' : '-'}${tx.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs font-medium text-slate-400">
                            {new Date(tx.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1 space-y-1.5">
              <button className="w-full text-left px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg font-bold text-[15px]">Profile</button>
              <button className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg transition-colors text-[15px] font-medium">Security</button>
              <button className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg transition-colors text-[15px] font-medium">Linked Banks</button>
            </div>
            <div className="md:col-span-3 space-y-6">
               <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                 <h3 className="text-lg font-bold text-slate-900 mb-6">Personal Information</h3>
                 <div className="space-y-6">
                   <div>
                     <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">Email Address</label>
                     <div className="text-[15px] font-medium text-slate-900">alex@neotrade.app</div>
                   </div>
                   <div>
                     <label className="text-xs font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">Account Status</label>
                     <div className="inline-flex px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-md">Verified</div>
                   </div>
                 </div>
               </div>
               
               <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                 <div className="flex items-center gap-5">
                   <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                     <Shield className="text-blue-600 w-6 h-6" />
                   </div>
                   <div>
                     <h4 className="text-base font-bold text-slate-900 mb-1">Two-Factor Authentication</h4>
                     <p className="text-slate-500 text-sm font-medium">Protect your assets with an authenticator app.</p>
                   </div>
                 </div>
                 <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 px-6 py-2.5 rounded-xl text-[15px] font-bold transition-colors whitespace-nowrap shadow-sm">Enable 2FA</button>
               </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
