'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
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
  const [inputType, setInputType] = useState<'QUANTITY' | 'AMOUNT'>('QUANTITY');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const currentPrice = prices[symbol] || 0;
  const numInput = parseFloat(inputValue) || 0;
  
  let calculatedQuantity = 0;
  let calculatedAmount = 0;

  if (currentPrice > 0) {
    if (inputType === 'QUANTITY') {
      calculatedQuantity = numInput;
      calculatedAmount = calculatedQuantity * currentPrice;
    } else {
      calculatedAmount = numInput;
      calculatedQuantity = calculatedAmount / currentPrice;
    }
  }

  const balanceAfterTrade = activeTab === 'BUY' ? fiatBalance - calculatedAmount : fiatBalance + calculatedAmount;

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !inputValue || calculatedQuantity <= 0) return;

    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const endpoint = `/api/trade/${activeTab.toLowerCase()}`;
      const payload = { symbol, quantity: calculatedQuantity, currentPrice };

      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Trade failed');
      }

      setInputValue('');
      setSuccessMsg(`Successfully ${activeTab === 'BUY' ? 'bought' : 'sold'} ${symbol}`);
      onTradeSuccess();
      
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIncrement = () => {
    setInputValue((prev) => {
      const val = parseFloat(prev) || 0;
      const step = inputType === 'QUANTITY' ? 1 : 10;
      return (val + step).toString();
    });
  };

  const handleDecrement = () => {
    setInputValue((prev) => {
      const val = parseFloat(prev) || 0;
      const step = inputType === 'QUANTITY' ? 1 : 10;
      const newVal = val - step;
      return newVal > 0 ? newVal.toString() : '0';
    });
  };

  return (
    <div className={`glass-panel ${styles.widget}`}>
      
      <div className={styles.header}>
        <h3 className={styles.title}>Trade {symbol}</h3>
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
          <div className={styles.labelWrapper}>
            <label className={styles.label}>
              {inputType === 'QUANTITY' ? 'Quantity' : 'Amount (USD)'}
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                className={styles.modeToggleBtn}
                onClick={() => setInputType(inputType === 'QUANTITY' ? 'AMOUNT' : 'QUANTITY')}
              >
                Switch to {inputType === 'QUANTITY' ? 'Amount' : 'Quantity'}
              </button>
              <span className={styles.priceBadge}>
                {currentPrice ? `Live: $${currentPrice.toLocaleString()}` : 'Loading...'}
              </span>
            </div>
          </div>
          
          <div className={styles.inputWithButtons}>
            <button type="button" className={styles.qtyBtn} onClick={handleDecrement}>-</button>
            <input
              type="number"
              step="any"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="0.00"
              required
            />
            <button type="button" className={styles.qtyBtn} onClick={handleIncrement}>+</button>
          </div>
        </div>

        <div className={styles.summaryBox}>
          {inputType === 'AMOUNT' ? (
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Calculated Quantity</span>
              <span className={styles.summaryValueSmall}>
                {calculatedQuantity.toLocaleString(undefined, { maximumFractionDigits: 8 })} {symbol}
              </span>
            </div>
          ) : (
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>
                {activeTab === 'BUY' ? 'Total Cost' : 'Total Return'}
              </span>
              <span className={styles.summaryValueBig}>
                ${calculatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          
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
          disabled={isLoading || currentPrice <= 0 || calculatedQuantity <= 0}
          className={`${styles.submitBtn} ${activeTab === 'BUY' ? styles.submitBtnBuy : styles.submitBtnSell}`}
        >
          {isLoading && <Loader2 className={styles.loader} size={20} />}
          {`${activeTab} Now`}
        </button>
      </form>
    </div>
  );
}
