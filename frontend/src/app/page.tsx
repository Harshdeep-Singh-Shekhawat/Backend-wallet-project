'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { useWebSocketPrices } from '@/hooks/useWebSocketPrices';
import DashboardLayout from '@/components/DashboardLayout';
import PortfolioOverview from '@/components/PortfolioOverview';
import HoldingsTable, { Holding } from '@/components/HoldingsTable';
import TradeWidget from '@/components/TradeWidget';
import AssetChart from '@/components/AssetChart';
import TrendChart from '@/components/TrendChart';
import AuthScreen from '@/components/AuthScreen';
import WatchlistTab from '@/components/WatchlistTab';
import AlertsTab from '@/components/AlertsTab';
import { Loader2, ArrowUpRight, ArrowDownRight, Wallet as WalletIcon, Clock, Shield, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { apiFetch, apiFetcher, clearAuthToken } from '@/lib/api';
import styles from './page.module.css';

const DEFAULT_CRYPTO = ['BTC', 'ETH', 'SOL', 'DOGE', 'ADA'];
const DEFAULT_STOCKS = ['AAPL', 'MSFT', 'TSLA', 'NVDA', 'GOOGL'];

export default function App() {
  const [activeTab, setActiveTab] = useState('Portfolio');
  const [tradeSymbolCrypto, setTradeSymbolCrypto] = useState('BTC');
  const [tradeSymbolStock, setTradeSymbolStock] = useState('AAPL');

  // Wallet form state
  const [walletAction, setWalletAction] = useState<'deposit' | 'withdraw' | null>(null);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState('');

  // Auth state
  const { data: authData, mutate: mutateAuth, isLoading: authLoading } = useSWR('/api/auth/me', apiFetcher);
  const isAuthenticated = authData?.authenticated;

  // Fetch user portfolio & transactions only if authenticated
  const { data: portfolioData, mutate: mutatePortfolio } = useSWR(isAuthenticated ? '/api/portfolio' : null, apiFetcher);
  const { data: transactionsData, mutate: mutateTransactions } = useSWR(isAuthenticated ? '/api/transactions' : null, apiFetcher);

  // Fetch watchlists & alerts
  const { data: watchlistData } = useSWR(isAuthenticated ? '/api/watchlist' : null, apiFetcher);
  const { data: alertsData, mutate: mutateAlerts } = useSWR(isAuthenticated ? '/api/alerts' : null, apiFetcher);

  // Extract unique symbols from portfolio + default symbols for widget
  const holdings: any[] = portfolioData?.holdings || [];
  const holdingSymbols = holdings.map((h: any) => h.symbol);
  const watchlistSymbols = watchlistData?.watchlists?.map((w: any) => w.symbol) || [];
  const alertSymbols = alertsData?.alerts?.map((a: any) => a.symbol) || [];
  
  // Track default symbols + current holdings + whatever is in the trade widgets
  const trackSymbols = Array.from(new Set([
    ...holdingSymbols, 
    ...DEFAULT_CRYPTO, 
    ...DEFAULT_STOCKS, 
    ...watchlistSymbols,
    ...alertSymbols,
    tradeSymbolCrypto, 
    tradeSymbolStock
  ]));
  
  // Connect to Binance WebSocket for ultra-fast crypto prices
  const wsPrices = useWebSocketPrices(trackSymbols);

  // Fetch live prices every 15 seconds (primarily for stocks now, and as a fallback)
  const { data: pricesData } = useSWR(
    trackSymbols.length > 0 ? `/api/prices?symbols=${trackSymbols.join(',')}` : null,
    apiFetcher,
    { refreshInterval: 15000 }
  );

  // Merge fast WS prices over HTTP polled prices
  const prices = { ...(pricesData?.prices || {}), ...wsPrices };
  const fiatBalance = portfolioData?.fiatBalance || 0;
  const lockedFiatBalance = portfolioData?.lockedFiatBalance || 0;
  const transactions = transactionsData?.transactions || [];

  // Alert Engine (Client-Side)
  useEffect(() => {
    const activeAlerts = alertsData?.alerts?.filter((a: any) => a.status === 'ACTIVE') || [];
    
    activeAlerts.forEach((alert: any) => {
      const currentPrice = prices[alert.symbol];
      if (!currentPrice) return;

      let triggered = false;
      if (alert.direction === 'ABOVE' && currentPrice >= alert.targetPrice) triggered = true;
      if (alert.direction === 'BELOW' && currentPrice <= alert.targetPrice) triggered = true;

      if (triggered) {
        toast.success(`🎯 ${alert.symbol} just crossed $${alert.targetPrice.toLocaleString()}!`, { duration: 6000 });
        
        if (alert.autoTradeType && alert.autoTradeQuantity) {
          apiFetch(`/api/trade/${alert.autoTradeType.toLowerCase()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              symbol: alert.symbol,
              quantity: alert.autoTradeQuantity,
              currentPrice
            })
          }).then(async (res) => {
            const data = await res.json();
            if (res.ok) {
              toast.success(`🤖 Auto-Trade Executed: ${alert.autoTradeType} ${alert.autoTradeQuantity} ${alert.symbol}`, { duration: 8000 });
              mutatePortfolio();
              mutateTransactions();
            } else {
              toast.error(`❌ Auto-Trade Failed: ${data.error}`, { duration: 8000 });
            }
          }).catch((err) => {
            toast.error(`❌ Auto-Trade Error: ${err.message}`, { duration: 8000 });
          });
        }

        // Mark as triggered in DB to prevent infinite firing
        apiFetch('/api/alerts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alertId: alert.id, status: 'TRIGGERED' }),
        }).then(() => mutateAlerts());
      }
    });
  }, [prices, alertsData, mutateAlerts, mutatePortfolio, mutateTransactions]);

  // Calculate totals
  let totalHoldingsValue = 0;
  let totalCost = 0;

  const enrichedHoldings: Holding[] = holdings.map((h: any) => {
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
    ...enrichedHoldings.map((h) => ({ name: h.symbol, value: h.quantity * h.currentPrice }))
  ];

  const handleWalletAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAction || !walletAmount || parseFloat(walletAmount) <= 0) return;

    setWalletLoading(true);
    setWalletError('');

    try {
      const res = await apiFetch('/api/wallet', {
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

  if (authLoading || (isAuthenticated && !portfolioData)) {
    return (
      <div className={styles.loading}>
        <Loader2 className={styles.loader} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onSuccess={() => mutateAuth()} />;
  }

  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    clearAuthToken();
    mutateAuth();
  };

  return (
    <DashboardLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      user={authData?.user} 
      onLogout={handleLogout}
    >
      <div className={styles.container}>
        
        {activeTab === 'Portfolio' && (
          <div className={styles.sectionSpace}>
            <PortfolioOverview
              totalValue={totalHoldingsValue}
              fiatBalance={fiatBalance}
              lockedFiatBalance={lockedFiatBalance}
              totalCost={totalCost}
              totalPnL={totalPnL}
              pnlPercentage={pnlPercentage}
            />
            
            <div className={styles.grid}>
              <div className={styles.colSpan2}>
                <HoldingsTable holdings={enrichedHoldings} onTradeClick={() => setActiveTab('Trade Crypto')} />
              </div>
              <div>
                <div className={`glass-panel ${styles.card}`} style={{height: '100%'}}>
                  <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <AssetChart data={chartData} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Watchlist' && (
          <WatchlistTab prices={prices} onAddSymbol={() => {}} />
        )}

        {activeTab === 'Alerts' && (
          <AlertsTab prices={prices} onAddSymbol={() => {}} />
        )}

        {(activeTab === 'Trade Crypto' || activeTab === 'Trade Stocks') && (
          <div className={styles.grid}>
            <div className={styles.colSpan2}>
              <div className={`glass-panel ${styles.card}`}>
                 <h3 className={styles.cardTitleBig}>Live Markets ({activeTab.split(' ')[1]})</h3>
                 <p className={styles.cardDesc}>Real-time quotes powered by Yahoo Finance. Click an asset to select it for trading.</p>
                 
                 <div className={styles.marketList}>
                    {Array.from(new Set([
                      ...(activeTab === 'Trade Crypto' ? DEFAULT_CRYPTO : DEFAULT_STOCKS),
                      ...(activeTab === 'Trade Crypto' ? [tradeSymbolCrypto] : [tradeSymbolStock])
                    ])).map((sym) => {
                      if (!sym) return null;
                      // Determine if price is up or down pseudo-randomly for visual demo 
                      // (in a real app, we'd fetch previous close price to compare)
                      const isUp = prices[sym] ? (prices[sym].toString().charCodeAt(0) % 2 === 0) : true;
                      const isSelected = activeTab === 'Trade Crypto' ? sym === tradeSymbolCrypto : sym === tradeSymbolStock;
                      
                      return (
                      <div 
                        key={sym} 
                        onClick={() => activeTab === 'Trade Crypto' ? setTradeSymbolCrypto(sym) : setTradeSymbolStock(sym)} 
                        className={`${styles.marketRow} ${isSelected ? styles.marketRowSelected : ''}`}
                      >
                        <div className={styles.marketIconArea}>
                          <div className={styles.marketIcon}>
                            {sym[0]}
                          </div>
                          <div>
                            <div className={styles.marketSymbol}>{sym}</div>
                            <div className={styles.marketType}>{activeTab === 'Trade Crypto' ? 'Crypto' : 'Stock'}</div>
                          </div>
                        </div>
                        <div className={styles.marketPriceArea}>
                          <div className={styles.marketPrice}>${prices[sym]?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '---'}</div>
                          <div className={`${styles.marketTrend} ${isUp ? styles.trendUp : styles.trendDown}`}>
                            {isUp ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>} LIVE
                          </div>
                        </div>
                      </div>
                    )})}
                 </div>
              </div>
              <div className={`glass-panel ${styles.card}`} style={{ marginTop: '24px' }}>
                <TrendChart symbol={activeTab === 'Trade Crypto' ? tradeSymbolCrypto : tradeSymbolStock} />
              </div>
            </div>
            <div>
              <div className={styles.stickyWidget}>
                <TradeWidget 
                  fiatBalance={fiatBalance}
                  prices={prices}
                  symbol={activeTab === 'Trade Crypto' ? tradeSymbolCrypto : tradeSymbolStock}
                  setSymbol={activeTab === 'Trade Crypto' ? setTradeSymbolCrypto : setTradeSymbolStock}
                  onTradeSuccess={() => { mutatePortfolio(); mutateTransactions(); }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Wallets' && (
          <div className={styles.sectionSpace}>
            <div className={`glass-panel ${styles.card} ${styles.walletCard}`}>
               <div className={styles.walletBgIcon}>
                 <WalletIcon size={250} />
               </div>
               <div className={styles.walletLabelArea}>
                 <h3 className={styles.walletLabel}>Available Cash</h3>
               </div>
               <p className={styles.walletDesc}>This is your fiat balance used to buy assets. Add funds to start trading.</p>
               <div className={styles.walletBalance}>
                 ${fiatBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </div>
               
               {!walletAction ? (
                 <div className={styles.walletActions}>
                   <button onClick={() => setWalletAction('deposit')} className={styles.btnPrimary}>
                     Add Funds
                   </button>
                   <button onClick={() => setWalletAction('withdraw')} className={styles.btnSecondary}>
                     Withdraw
                   </button>
                 </div>
               ) : (
                 <form onSubmit={handleWalletAction} className={styles.formBox}>
                   <h4 className={styles.formTitle}>{walletAction} Funds</h4>
                   <div className={styles.inputGroup}>
                     <label className={styles.inputLabel}>Amount (USD)</label>
                     <input
                       type="number"
                       step="any"
                       value={walletAmount}
                       onChange={(e) => setWalletAmount(e.target.value)}
                       placeholder="0.00"
                       className={styles.input}
                       required
                     />
                   </div>
                   {walletError && (
                     <div className={styles.formError}>
                       {walletError}
                     </div>
                   )}
                   <div className={styles.formButtons}>
                     <button
                       type="submit"
                       disabled={walletLoading}
                       className={styles.btnSubmit}
                     >
                       {walletLoading && <Loader2 className={styles.loader} size={20} />}
                       Confirm {walletAction}
                     </button>
                     <button
                       type="button"
                       onClick={() => { setWalletAction(null); setWalletError(''); setWalletAmount(''); }}
                       className={styles.btnCancel}
                     >
                       Cancel
                     </button>
                   </div>
                 </form>
               )}
            </div>

            <div className={`glass-panel ${styles.card}`}>
              <h3 className={styles.cardTitleBig} style={{fontSize: '18px', marginBottom: '24px'}}>Recent Activity</h3>
              
              {transactions.length === 0 ? (
                <div className={styles.activityEmpty}>
                  <Clock size={40} opacity={0.5} />
                  <span>No recent transfers.</span>
                </div>
              ) : (
                <div className={styles.activityList}>
                  {transactions.map((tx: any) => {
                    const isDeposit = tx.type === 'DEPOSIT' || tx.type === 'SELL';
                    const icon = isDeposit ? <ArrowDownCircle size={24} className={styles.iconDeposit} /> : <ArrowUpCircle size={24} className={styles.iconWithdraw} />;
                    
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
                      <div key={tx.id} className={styles.activityRow}>
                        <div className={styles.activityIconArea}>
                          <div className={styles.activityIcon}>
                            {icon}
                          </div>
                          <div>
                            <div className={styles.activityTitle}>{title}</div>
                            <div className={styles.activitySub}>{subTitle}</div>
                          </div>
                        </div>
                        <div className={styles.activityRight}>
                          <div className={isDeposit ? styles.activityAmountDeposit : styles.activityAmountWithdraw}>
                            {isDeposit ? '+' : '-'}${tx.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className={styles.activityDate}>
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

      </div>
    </DashboardLayout>
  );
}
