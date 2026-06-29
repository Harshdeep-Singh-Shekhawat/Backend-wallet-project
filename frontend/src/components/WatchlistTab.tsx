import React, { useState } from 'react';
import useSWR from 'swr';
import { Eye, Plus, Trash2, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { apiFetch, apiFetcher } from '@/lib/api';
import styles from '../app/page.module.css';

interface WatchlistTabProps {
  prices: Record<string, number>;
  onAddSymbol: (symbol: string) => void;
  exchangeRate: number;
  currencySymbol: string;
}

export default function WatchlistTab({ prices, onAddSymbol, exchangeRate, currencySymbol }: WatchlistTabProps) {
  const [newSymbol, setNewSymbol] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');

  const { data, mutate, isLoading } = useSWR('/api/watchlist', apiFetcher);
  const watchlists = data?.watchlists || [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol) return;
    
    setAdding(true);
    setError('');
    try {
      const res = await apiFetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: newSymbol.toUpperCase() }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      setNewSymbol('');
      onAddSymbol(result.watchlist.symbol); // Tell parent to track this symbol via WS
      mutate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const addSpecific = async (symbol: string) => {
    setAdding(true);
    setError('');
    try {
      const res = await apiFetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbol.toUpperCase() }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      onAddSymbol(result.watchlist.symbol);
      mutate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (symbol: string) => {
    try {
      await apiFetch(`/api/watchlist?symbol=${symbol}`, { method: 'DELETE' });
      mutate();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="spin" /></div>;

  return (
    <div className={styles.sectionSpace}>
      <div className={`glass-panel ${styles.card}`}>
        <h3 className={styles.cardTitleBig} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Eye size={24} /> My Watchlist
        </h3>
        <p className={styles.cardDesc}>Track real-time prices of assets you are interested in.</p>
        
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Enter Symbol (e.g. SOL)"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #444', background: 'rgba(255,255,255,0.05)', color: 'white', flex: 1 }}
          />
          <button type="submit" disabled={adding || !newSymbol} style={{ padding: '10px 20px', borderRadius: '8px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {adding ? <Loader2 size={16} className="spin" /> : <Plus size={16} />} Add to Watchlist
          </button>
        </form>
        {error && <p style={{ color: '#ef4444', marginBottom: '10px' }}>{error}</p>}

        {watchlists.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            Your watchlist is empty. Add a symbol above to start tracking.
          </div>
        ) : (
          <div className={styles.marketList}>
            {watchlists.map((w: any) => {
              const sym = w.symbol;
              const price = prices[sym];
              const isUp = price ? (price.toString().charCodeAt(0) % 2 === 0) : true; // visual demo

              return (
                <div key={w.id} className={styles.marketRow} style={{ padding: '16px' }}>
                  <div className={styles.marketIconArea}>
                    <div className={styles.marketIcon}>{sym[0]}</div>
                    <div>
                      <div className={styles.marketSymbol}>{sym}</div>
                    </div>
                  </div>
                  <div className={styles.marketPriceArea} style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div>
                      <div className={styles.marketPrice}>{currencySymbol}{(price * exchangeRate)?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '---'}</div>
                      <div className={`${styles.marketTrend} ${isUp ? styles.trendUp : styles.trendDown}`}>
                        {isUp ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>} LIVE
                      </div>
                    </div>
                    <button onClick={() => handleRemove(sym)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={`glass-panel ${styles.card}`} style={{ marginTop: '24px' }}>
        <h3 className={styles.cardTitleBig}>Recommended for You</h3>
        <p className={styles.cardDesc}>Popular assets you might want to track.</p>
        <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
          {['BTC', 'ETH', 'AAPL', 'TSLA', 'GOLD', 'RELEST'].filter(sym => !watchlists.some((w: any) => w.symbol === sym)).map(sym => (
            <div key={sym} style={{ flex: '0 0 auto', background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', minWidth: '160px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div className={styles.marketIcon} style={{ width: '32px', height: '32px', fontSize: '14px' }}>{sym[0]}</div>
                <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{sym}</div>
              </div>
              <button 
                onClick={() => addSpecific(sym)}
                disabled={adding}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)', cursor: 'pointer' }}
              >
                + Watch
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
