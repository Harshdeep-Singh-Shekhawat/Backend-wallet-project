'use client';

import { useState } from 'react';
import useSWR from 'swr';
import DashboardLayout from '@/components/DashboardLayout';
import PortfolioOverview from '@/components/PortfolioOverview';
import HoldingsTable, { Holding } from '@/components/HoldingsTable';
import TradeWidget from '@/components/TradeWidget';
import AssetChart from '@/components/AssetChart';
import { Loader2, ArrowUpRight, ArrowDownRight, Wallet as WalletIcon, Clock, Shield, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import styles from './page.module.css';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

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
      <div className={styles.loading}>
        <Loader2 className={styles.loader} />
      </div>
    );
  }

  return (
    <DashboardLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className={styles.container}>
        
        {activeTab === 'Portfolio' && (
          <div className={styles.sectionSpace}>
            <PortfolioOverview
              totalValue={totalHoldingsValue}
              fiatBalance={fiatBalance}
              totalPnL={totalPnL}
              pnlPercentage={pnlPercentage}
            />
            
            <div className={styles.grid}>
              <div className={styles.colSpan2}>
                <div className={styles.sectionHeader}>
                  <h3 className={styles.sectionTitle}>Your Assets</h3>
                  <button onClick={() => setActiveTab('Trade')} className={styles.tradeBtn}>
                    Trade Now
                  </button>
                </div>
                <HoldingsTable holdings={enrichedHoldings} />
              </div>
              <div>
                <div className={`glass-panel ${styles.card}`} style={{height: '100%'}}>
                  <h3 className={styles.cardTitleBig} style={{fontSize: '18px'}}>Asset Allocation</h3>
                  <div style={{flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <AssetChart data={chartData} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Trade' && (
          <div className={styles.grid}>
            <div className={styles.colSpan2}>
              <div className={`glass-panel ${styles.card}`}>
                 <h3 className={styles.cardTitleBig}>Live Markets</h3>
                 <p className={styles.cardDesc}>Real-time quotes. Click an asset to select it for trading.</p>
                 
                 <div className={styles.marketList}>
                    {Array.from(new Set(['BTC', 'ETH', 'SOL', tradeSymbol])).map((sym) => {
                      if (!sym) return null;
                      const isUp = Math.random() > 0.5; // mocked direction
                      const isSelected = sym === tradeSymbol;
                      
                      return (
                      <div 
                        key={sym} 
                        onClick={() => setTradeSymbol(sym)} 
                        className={`${styles.marketRow} ${isSelected ? styles.marketRowSelected : ''}`}
                      >
                        <div className={styles.marketIconArea}>
                          <div className={styles.marketIcon}>
                            {sym[0]}
                          </div>
                          <div>
                            <div className={styles.marketSymbol}>{sym}</div>
                            <div className={styles.marketType}>Market</div>
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
            </div>
            <div>
              <div className={styles.stickyWidget}>
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

        {activeTab === 'Settings' && (
          <div className={styles.settingsGrid}>
            <div className={styles.settingsSidebar}>
              <div className={styles.settingsMenu}>
                <button className={`${styles.settingsMenuBtn} ${styles.settingsMenuBtnActive}`}>Profile</button>
                <button className={styles.settingsMenuBtn}>Security</button>
                <button className={styles.settingsMenuBtn}>Linked Banks</button>
              </div>
            </div>
            <div className={styles.settingsContent}>
               <div className={`glass-panel ${styles.card}`}>
                 <h3 className={styles.cardTitleBig} style={{fontSize: '18px', marginBottom: '24px'}}>Personal Information</h3>
                 <div className={styles.settingsGroup}>
                   <div className={styles.settingsItem}>
                     <label className={styles.settingsLabel}>Email Address</label>
                     <div className={styles.settingsValue}>alex@neotrade.app</div>
                   </div>
                   <div className={styles.settingsItem}>
                     <label className={styles.settingsLabel}>Account Status</label>
                     <div><span className={styles.badgeVerified}>Verified</span></div>
                   </div>
                 </div>
               </div>
               
               <div className={`glass-panel ${styles.card} ${styles.securityBox}`}>
                 <div className={styles.securityInfo}>
                   <div className={styles.securityIcon}>
                     <Shield size={24} />
                   </div>
                   <div>
                     <h4 className={styles.securityTitle}>Two-Factor Authentication</h4>
                     <p className={styles.securityDesc}>Protect your assets with an authenticator app.</p>
                   </div>
                 </div>
                 <button className={styles.btnSecondary}>Enable 2FA</button>
               </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
