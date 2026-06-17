'use client';

import useSWR from 'swr';
import { Loader2, Trash2 } from 'lucide-react';
import styles from './TradeWidget.module.css';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TradeWidgetProps {
  fiatBalance: number;
  prices: Record<string, number>;
  symbol: string;
  setSymbol: (symbol: string) => void;
  onTradeSuccess: () => void;
}

export default function TradeWidget({ fiatBalance, prices, symbol, setSymbol, onTradeSuccess }: TradeWidgetProps) {
  const [activeTab, setActiveTab] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('LIMIT');
  const [inputValue, setInputValue] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch Order Book
  const { data: orderBookData } = useSWR(`/api/orderbook?symbol=${symbol}`, fetcher, { refreshInterval: 2000 });
  const bids = orderBookData?.bids || [];
  const asks = orderBookData?.asks || [];

  // Fetch My Open Orders
  const { data: myOrdersData, mutate: mutateMyOrders } = useSWR('/api/orders', fetcher, { refreshInterval: 5000 });
  const myOpenOrders = myOrdersData?.orders?.filter((o: any) => o.asset?.symbol === symbol && (o.status === 'PENDING' || o.status === 'PARTIAL')) || [];

  const currentPrice = prices[symbol] || 0;
  const numInput = parseFloat(inputValue) || 0;
  const numLimitPrice = parseFloat(limitPrice) || 0;
  
  // For MARKET orders, calculate amount based on live price.
  // For LIMIT orders, calculate amount based on user-defined limit price.
  const executionPrice = orderType === 'LIMIT' ? numLimitPrice : currentPrice;
  
  // Assume input is always Quantity for simplicity in this advanced engine
  const calculatedQuantity = numInput;
  const calculatedAmount = calculatedQuantity * executionPrice;

  const balanceAfterTrade = activeTab === 'BUY' ? fiatBalance - calculatedAmount : fiatBalance + calculatedAmount;

  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !inputValue || calculatedQuantity <= 0) return;
    if (orderType === 'LIMIT' && executionPrice <= 0) {
      setError('Limit price must be greater than 0');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const endpoint = orderType === 'LIMIT' ? '/api/orders' : `/api/trade/${activeTab.toLowerCase()}`;
      
      const payload = orderType === 'LIMIT' 
        ? { symbol, type: activeTab, orderType, quantity: calculatedQuantity, price: executionPrice }
        : { symbol, quantity: calculatedQuantity, currentPrice };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Trade failed');
      }

      setInputValue('');
      setSuccessMsg(orderType === 'LIMIT' ? 'Limit order placed!' : `Successfully ${activeTab === 'BUY' ? 'bought' : 'sold'} ${symbol}`);
      onTradeSuccess();
      mutateMyOrders();
      
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

      {/* Order Type Toggle */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button type="button" onClick={() => setOrderType('LIMIT')} style={{ flex: 1, padding: '8px', background: orderType === 'LIMIT' ? '#333' : 'transparent', border: '1px solid #444', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
          Limit
        </button>
        <button type="button" onClick={() => setOrderType('MARKET')} style={{ flex: 1, padding: '8px', background: orderType === 'MARKET' ? '#333' : 'transparent', border: '1px solid #444', borderRadius: '4px', color: 'white', cursor: 'pointer' }}>
          Market
        </button>
      </div>

      <form onSubmit={handleTrade} className={styles.form}>
        {orderType === 'LIMIT' && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Limit Price (USD)</label>
            <input
              type="number"
              step="any"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder={`Live: $${currentPrice}`}
              className={styles.input}
              required
            />
          </div>
        )}

        <div className={styles.formGroup}>
          <div className={styles.labelWrapper}>
            <label className={styles.label}>Quantity</label>
            <span className={styles.priceBadge}>
              {currentPrice ? `Live: $${currentPrice.toLocaleString()}` : 'Loading...'}
            </span>
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
              {activeTab === 'BUY' ? 'Total Cost' : 'Total Return'}
            </span>
            <span className={styles.summaryValueBig}>
              ${calculatedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          disabled={isLoading || executionPrice <= 0 || calculatedQuantity <= 0}
          className={`${styles.submitBtn} ${activeTab === 'BUY' ? styles.submitBtnBuy : styles.submitBtnSell}`}
        >
          {isLoading && <Loader2 className={styles.loader} size={20} />}
          {orderType === 'LIMIT' ? `Place Limit ${activeTab}` : `${activeTab} Now`}
        </button>
      </form>

      {/* Order Book Section */}
      <div style={{ marginTop: '30px' }}>
        <h4 style={{ fontSize: '14px', marginBottom: '10px', color: '#ccc' }}>Order Book ({symbol})</h4>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888', marginBottom: '5px', padding: '0 5px' }}>
          <span>Price</span>
          <span>Quantity</span>
        </div>
        
        {/* Asks (Sells) - Red */}
        <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '2px', marginBottom: '5px' }}>
          {asks.slice(-5).map((ask: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 5px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>
              <span style={{ color: '#ef4444' }}>${ask.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <span style={{ color: '#ccc' }}>{ask.quantity.toFixed(4)}</span>
            </div>
          ))}
          {asks.length === 0 && <div style={{ textAlign: 'center', color: '#555', padding: '10px 0', fontSize: '12px' }}>No asks</div>}
        </div>
        
        <div style={{ padding: '8px 5px', color: 'white', fontWeight: 'bold', fontSize: '16px', textAlign: 'center', borderTop: '1px solid #333', borderBottom: '1px solid #333', margin: '5px 0' }}>
          ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </div>
        
        {/* Bids (Buys) - Green */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '5px' }}>
          {bids.slice(0, 5).map((bid: any, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 5px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '4px' }}>
              <span style={{ color: '#22c55e' }}>${bid.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              <span style={{ color: '#ccc' }}>{bid.quantity.toFixed(4)}</span>
            </div>
          ))}
          {bids.length === 0 && <div style={{ textAlign: 'center', color: '#555', padding: '10px 0', fontSize: '12px' }}>No bids</div>}
        </div>
      </div>

      {/* Open Orders Section */}
      {myOpenOrders.length > 0 && (
        <div style={{ marginTop: '30px' }}>
          <h4 style={{ fontSize: '14px', marginBottom: '10px', color: '#ccc' }}>Open Orders</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {myOpenOrders.map((o: any) => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '12px' }}>
                <div>
                  <span style={{ color: o.type === 'BUY' ? '#22c55e' : '#ef4444', fontWeight: 'bold', marginRight: '5px' }}>{o.type}</span>
                  <span style={{ color: '#ccc' }}>${o.price.toLocaleString()}</span>
                  <div style={{ color: '#888', marginTop: '2px' }}>{(o.quantity - o.filledQuantity).toFixed(4)} pending</div>
                </div>
                <button 
                  onClick={async () => {
                    await fetch(`/api/orders?orderId=${o.id}`, { method: 'DELETE' });
                    mutateMyOrders();
                    onTradeSuccess();
                  }}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
