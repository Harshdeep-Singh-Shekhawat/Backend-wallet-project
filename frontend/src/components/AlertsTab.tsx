import React, { useState } from 'react';
import useSWR from 'swr';
import { Loader2, Trash2, Plus, BellRing, CheckCircle2 } from 'lucide-react';
import { apiFetch, apiFetcher } from '@/lib/api';
import styles from '../app/page.module.css';

interface AlertsTabProps {
  prices: Record<string, number>;
  onAddSymbol: (symbol: string) => void;
}

export default function AlertsTab({ prices, onAddSymbol }: AlertsTabProps) {
  const [newSymbol, setNewSymbol] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [tradeAction, setTradeAction] = useState('NONE');
  const [tradeQuantity, setTradeQuantity] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTargetPrice, setEditTargetPrice] = useState('');
  const [editTradeAction, setEditTradeAction] = useState('NONE');
  const [editTradeQuantity, setEditTradeQuantity] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const { data, mutate, isLoading } = useSWR('/api/alerts', apiFetcher);
  const alerts = data?.alerts || [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol || !targetPrice) return;
    
    setAdding(true);
    setError('');
    
    const currentPrice = prices[newSymbol.toUpperCase()] || 0;
    const target = parseFloat(targetPrice);
    
    if (target <= 0) {
      setError('Target price must be greater than 0');
      setAdding(false);
      return;
    }

    const condition = currentPrice > 0 && target > currentPrice ? 'ABOVE' : 'BELOW';

    try {
      const payload: any = {
        symbol: newSymbol.toUpperCase(), 
        targetPrice: target, 
        condition
      };

      if (tradeAction !== 'NONE' && tradeQuantity) {
        payload.autoTradeType = tradeAction;
        payload.autoTradeQuantity = parseFloat(tradeQuantity);
      }

      const res = await apiFetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      
      setNewSymbol('');
      setTargetPrice('');
      setTradeAction('NONE');
      setTradeQuantity('');
      onAddSymbol(result.alert.symbol); // Track this symbol for live prices
      mutate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (alertId: string) => {
    try {
      await apiFetch(`/api/alerts?alertId=${alertId}`, { method: 'DELETE' });
      mutate();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSave = async (alertId: string) => {
    setSavingId(alertId);
    try {
      const payload: any = {
        alertId,
        targetPrice: parseFloat(editTargetPrice),
        autoTradeType: editTradeAction,
        autoTradeQuantity: editTradeAction !== 'NONE' && editTradeQuantity ? parseFloat(editTradeQuantity) : null,
      };

      const res = await apiFetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setEditingId(null);
        mutate();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  const startEdit = (a: any) => {
    setEditingId(a.id);
    setEditTargetPrice(a.targetPrice.toString());
    setEditTradeAction(a.autoTradeType || 'NONE');
    setEditTradeQuantity(a.autoTradeQuantity ? a.autoTradeQuantity.toString() : '');
  };

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="spin" /></div>;

  return (
    <div className={styles.sectionSpace}>
      <div className={`glass-panel ${styles.card}`}>
        <h3 className={styles.cardTitleBig} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BellRing size={24} /> Price Alerts
        </h3>
        <p className={styles.cardDesc}>Get notified instantly when an asset crosses your target price.</p>
        
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Symbol (e.g. BTC)"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #444', background: 'rgba(255,255,255,0.05)', color: 'white', flex: 1, minWidth: '150px' }}
          />
          <input
            type="number"
            step="any"
            placeholder="Target Price USD"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #444', background: 'rgba(255,255,255,0.05)', color: 'white', flex: 1, minWidth: '150px' }}
          />
          <select
            value={tradeAction}
            onChange={(e) => setTradeAction(e.target.value)}
            style={{ padding: '10px', borderRadius: '8px', border: '1px solid #444', background: 'rgba(255,255,255,0.05)', color: 'white', flex: 1, minWidth: '150px' }}
          >
            <option value="NONE" style={{ color: 'black' }}>Notify Only</option>
            <option value="BUY" style={{ color: 'black' }}>Auto-Buy</option>
            <option value="SELL" style={{ color: 'black' }}>Auto-Sell</option>
          </select>
          {tradeAction !== 'NONE' && (
            <input
              type="number"
              step="any"
              placeholder="Quantity to Trade"
              value={tradeQuantity}
              onChange={(e) => setTradeQuantity(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid #444', background: 'rgba(255,255,255,0.05)', color: 'white', flex: 1, minWidth: '150px' }}
            />
          )}
          <button type="submit" disabled={adding || !newSymbol || !targetPrice || (tradeAction !== 'NONE' && !tradeQuantity)} style={{ padding: '10px 20px', borderRadius: '8px', background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
            {adding ? <Loader2 size={16} className="spin" /> : <Plus size={16} />} Create Alert
          </button>
        </form>
        {error && <p style={{ color: '#ef4444', marginBottom: '10px' }}>{error}</p>}

        {alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
            You have no active price alerts.
          </div>
        ) : (
          <div className={styles.marketList}>
            {alerts.map((a: any) => {
              const sym = a.symbol;
              const price = prices[sym];
              const isTriggered = a.status === 'TRIGGERED';

              if (editingId === a.id) {
                return (
                  <div key={a.id} className={styles.marketRow} style={{ padding: '16px', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '10px', width: '100%', flexWrap: 'wrap' }}>
                      <div style={{ padding: '10px', color: 'white', fontWeight: 'bold' }}>{sym}</div>
                      <input
                        type="number"
                        step="any"
                        placeholder="Target Price USD"
                        value={editTargetPrice}
                        onChange={(e) => setEditTargetPrice(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #444', background: 'rgba(255,255,255,0.05)', color: 'white', flex: 1, minWidth: '100px' }}
                      />
                      <select
                        value={editTradeAction}
                        onChange={(e) => setEditTradeAction(e.target.value)}
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid #444', background: 'rgba(255,255,255,0.05)', color: 'white', flex: 1, minWidth: '120px' }}
                      >
                        <option value="NONE" style={{ color: 'black' }}>Notify Only</option>
                        <option value="BUY" style={{ color: 'black' }}>Auto-Buy</option>
                        <option value="SELL" style={{ color: 'black' }}>Auto-Sell</option>
                      </select>
                      {editTradeAction !== 'NONE' && (
                        <input
                          type="number"
                          step="any"
                          placeholder="Quantity"
                          value={editTradeQuantity}
                          onChange={(e) => setEditTradeQuantity(e.target.value)}
                          style={{ padding: '10px', borderRadius: '8px', border: '1px solid #444', background: 'rgba(255,255,255,0.05)', color: 'white', flex: 1, minWidth: '100px' }}
                        />
                      )}
                      <button onClick={() => handleEditSave(a.id)} disabled={savingId === a.id} style={{ padding: '10px 15px', borderRadius: '8px', background: '#22c55e', color: 'white', border: 'none', cursor: 'pointer' }}>
                        {savingId === a.id ? 'Saving...' : 'Save'}
                      </button>
                      <button onClick={() => setEditingId(null)} style={{ padding: '10px 15px', borderRadius: '8px', background: '#ef4444', color: 'white', border: 'none', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={a.id} className={styles.marketRow} style={{ padding: '16px', opacity: isTriggered ? 0.6 : 1 }}>
                  <div className={styles.marketIconArea}>
                    <div className={styles.marketIcon} style={{ background: isTriggered ? '#22c55e' : undefined }}>
                      {isTriggered ? <CheckCircle2 size={20} color="white" /> : sym[0]}
                    </div>
                    <div>
                      <div className={styles.marketSymbol}>{sym}</div>
                      <div className={styles.marketType}>
                        {a.direction} ${a.targetPrice.toLocaleString()}
                        {a.autoTradeType && (
                          <span style={{ marginLeft: '10px', color: '#3b82f6', fontWeight: 'bold' }}>
                            | AUTO {a.autoTradeType} {a.autoTradeQuantity}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={styles.marketPriceArea} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {!isTriggered && price && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: '#888' }}>Current</div>
                        <div className={styles.marketPrice}>${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      </div>
                    )}
                    {isTriggered && (
                      <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: 'bold' }}>
                        TRIGGERED
                      </div>
                    )}
                    {!isTriggered && (
                      <button onClick={() => startEdit(a)} style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '5px', fontSize: '14px' }}>
                        Edit
                      </button>
                    )}
                    <button onClick={() => handleRemove(a.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
