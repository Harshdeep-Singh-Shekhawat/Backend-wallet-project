'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import styles from './TradeWidget.module.css';

interface TradeWidgetProps {
  fiatBalance: number;
  prices: Record<string, number>;
  symbol: string;
  setSymbol: (symbol: string) => void;
  onTradeSuccess: () => void;
}

export default function TradeWidget({ fiatBalance, prices, symbol, setSymbol, onTradeSuccess }: TradeWidgetProps) {
  const [activeTab, setActiveTab] = useState<'BUY' | 'SELL'>('BUY');
  const [tradeMode, setTradeMode] = useState<'QUANTITY' | 'AMOUNT'>('QUANTITY');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const currentPrice = prices[symbol] || 0;
  const numInput = parseFloat(inputValue) || 0;
  
  const calculatedQuantity = tradeMode === 'QUANTITY' 
    ? numInput 
    : (currentPrice > 0 ? numInput / currentPrice : 0);

  const calculatedAmount = tradeMode === 'QUANTITY'
    ? numInput * currentPrice
    : numInput;

  const balanceAfterTrade = activeTab === 'BUY' ? fiatBalance - calculatedAmount : fiatBalance + calculatedAmount;

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !inputValue || numInput <= 0) return;
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
          quantity: calculatedQuantity,
          currentPrice,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Trade failed');
      }

      setInputValue('');
      setSuccessMsg(`Successfully ${activeTab === 'BUY' ? 'bought' : 'sold'} ${calculatedQuantity.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${symbol}`);
      onTradeSuccess();
      
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`glass-panel ${styles.widget}`}>
      
      <div className={styles.header}>
        <h3 className={styles.title}>Trade</h3>
        <div className={styles.availableBadge}>
          Available: <span className={styles.availableAmount}>${fiatBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          onClick={() => { setActiveTab('BUY'); setError(''); setSuccessMsg(''); }}
          className={`${styles.tab} ${activeTab === 'BUY' ? styles.tabBuyActive : ''}`}
        >
          Buy
        </button>
        <button
          onClick={() => { setActiveTab('SELL'); setError(''); setSuccessMsg(''); }}
          className={`${styles.tab} ${activeTab === 'SELL' ? styles.tabSellActive : ''}`}
        >
          Sell
        </button>
      </div>

      <form onSubmit={handleTrade} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Asset Symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="e.g. BTC"
            className={`${styles.input} ${styles.inputUpperCase}`}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <div className={styles.labelWrapper}>
            <label className={styles.label}>
              {tradeMode === 'QUANTITY' ? 'Quantity' : 'Amount ($)'}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={styles.priceBadge}>
                {currentPrice ? `@ $${currentPrice.toLocaleString()}` : 'Loading...'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setTradeMode(tradeMode === 'QUANTITY' ? 'AMOUNT' : 'QUANTITY');
                  setInputValue('');
                }}
                className={styles.modeToggleBtn}
              >
                Switch to {tradeMode === 'QUANTITY' ? 'Amount' : 'Quantity'}
              </button>
            </div>
          </div>
          <input
            type="number"
            step="any"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="0.00"
            className={styles.input}
            required
          />
        </div>

        <div className={styles.summaryBox}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>
              {tradeMode === 'QUANTITY' ? (activeTab === 'BUY' ? 'Estimated Cost' : 'Estimated Return') : 'Estimated Quantity'}
            </span>
            <span className={styles.summaryValueBig}>
              {tradeMode === 'QUANTITY' 
                ? `$${calculatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `${calculatedQuantity.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${symbol}`}
            </span>
          </div>
          <div className={styles.summaryRowDivider}>
            <span className={styles.summaryLabel}>Balance After Trade</span>
            <span className={balanceAfterTrade < 0 ? styles.summaryValueNegative : styles.summaryValueSmall}>
              ${balanceAfterTrade.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {error && (
          <div className={styles.messageError}>
            {error}
          </div>
        )}

        {successMsg && (
          <div className={styles.messageSuccess}>
            {successMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || currentPrice <= 0 || numInput <= 0}
          className={`${styles.submitBtn} ${activeTab === 'BUY' ? styles.submitBtnBuy : styles.submitBtnSell}`}
        >
          {isLoading && <Loader2 className={styles.loader} size={20} />}
          {activeTab === 'BUY' ? 'Buy Now' : 'Sell Now'}
        </button>
      </form>
    </div>
  );
}
