'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Loader2 } from 'lucide-react';
import { apiFetch, apiFetcher } from '@/lib/api';
import styles from './TradeWidget.module.css';

interface TradeWidgetProps {
  fiatBalance: number;
  prices: Record<string, number>;
  symbol: string;
  setSymbol: (symbol: string) => void;
  onTradeSuccess: () => void;
  currencySymbol: string;
  exchangeRate: number;
  userRole?: string;
}

export default function TradeWidget({ fiatBalance, prices, symbol, setSymbol, onTradeSuccess, currencySymbol, exchangeRate, userRole }: TradeWidgetProps) {
  const [activeTab, setActiveTab] = useState<'BUY' | 'SELL'>('BUY');
  const [inputType, setInputType] = useState<'QUANTITY' | 'AMOUNT'>('QUANTITY');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { data: assetsData, mutate: mutateAssets } = useSWR('/api/trade/assets', apiFetcher);
  const currentAsset = assetsData?.assets?.find((a: any) => a.symbol === symbol);
  const marketSupply = currentAsset?.availableSupply;

  const currentPrice = (prices[symbol] || 0) * exchangeRate;
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
  const exceedsSupply = activeTab === 'BUY' && marketSupply !== null && marketSupply !== undefined && calculatedQuantity > marketSupply;

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !inputValue || calculatedQuantity <= 0 || exceedsSupply) return;

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
      mutateAssets();
      
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
          Available: <span className={styles.availableAmount}>{currencySymbol}{fiatBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
              {inputType === 'QUANTITY' ? 'Quantity' : `Amount (${currencySymbol})`}
            </label>
            <span className={styles.priceBadge}>
              {currentPrice ? `Live: ${currencySymbol}${currentPrice.toLocaleString()}` : 'Loading...'}
            </span>
            {userRole === 'ADMIN' && marketSupply !== null && marketSupply !== undefined && (
              <span className={styles.priceBadge} style={{ marginLeft: '8px', background: 'rgba(234, 179, 8, 0.1)', color: '#eab308' }}>
                Supply: {marketSupply.toLocaleString(undefined, { maximumFractionDigits: 8 })}
              </span>
            )}
          </div>
          
          <div className={styles.segmentedToggle}>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${inputType === 'QUANTITY' ? styles.segmentedBtnActive : ''}`}
              onClick={() => setInputType('QUANTITY')}
            >
              Quantity
            </button>
            <button
              type="button"
              className={`${styles.segmentedBtn} ${inputType === 'AMOUNT' ? styles.segmentedBtnActive : ''}`}
              onClick={() => setInputType('AMOUNT')}
            >
              Amount ({currencySymbol})
            </button>
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
                {currencySymbol}{calculatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          
          <div className={styles.summaryRowDivider}>
            <span className={styles.summaryLabel}>Balance After Trade</span>
            <span className={balanceAfterTrade < 0 ? styles.summaryValueNegative : styles.summaryValueSmall}>
              {currencySymbol}{balanceAfterTrade.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {error && (
          <div className={styles.messageError}>
            {error}
          </div>
        )}

        {exceedsSupply && !error && (
          <div className={styles.messageError}>
            Exceeds available market supply of {marketSupply.toLocaleString(undefined, { maximumFractionDigits: 8 })}.
          </div>
        )}

        {successMsg && (
          <div className={styles.messageSuccess}>
            {successMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || currentPrice <= 0 || calculatedQuantity <= 0 || exceedsSupply}
          className={`${styles.submitBtn} ${activeTab === 'BUY' ? styles.submitBtnBuy : styles.submitBtnSell}`}
        >
          {isLoading && <Loader2 className={styles.loader} size={20} />}
          {`${activeTab} Now`}
        </button>
      </form>
    </div>
  );
}
