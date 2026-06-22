import React, { useState } from 'react';
import useSWR from 'swr';
import { Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch, apiFetcher } from '@/lib/api';
import styles from '../app/page.module.css';

export default function AdminTab() {
  const { data, mutate, isLoading } = useSWR('/api/admin/assets', apiFetcher);
  
  const [symbol, setSymbol] = useState('');
  const [supply, setSupply] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol) return toast.error('Symbol is required');

    setIsUpdating(true);
    try {
      const res = await apiFetch('/api/admin/assets/supply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: symbol.toUpperCase(), availableSupply: supply }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to update supply');

      toast.success(`Successfully updated ${symbol.toUpperCase()} supply`);
      setSymbol('');
      setSupply('');
      mutate();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <div className={styles.loading}><Loader2 className={styles.loader} /></div>;

  return (
    <div className={styles.sectionSpace}>
      <div className={`glass-panel ${styles.card}`}>
        <h3 className={styles.cardTitleBig}>Admin Console</h3>
        <p className={styles.cardDesc}>Manage global market configurations and asset liquidity.</p>
        
        <form onSubmit={handleUpdateSupply} className={styles.formBox} style={{ maxWidth: '100%', marginBottom: '32px', display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
          <div className={styles.inputGroup} style={{ marginBottom: 0, flex: 1 }}>
            <label className={styles.inputLabel}>Asset Symbol</label>
            <input 
              type="text" 
              value={symbol} 
              onChange={(e) => setSymbol(e.target.value.toUpperCase())} 
              className={styles.input} 
              placeholder="e.g. BTC, AAPL"
              required
            />
          </div>
          <div className={styles.inputGroup} style={{ marginBottom: 0, flex: 1 }}>
            <label className={styles.inputLabel}>Available Market Supply</label>
            <input 
              type="number" 
              step="any"
              value={supply} 
              onChange={(e) => setSupply(e.target.value)} 
              className={styles.input} 
              placeholder="Leave empty for infinite"
            />
          </div>
          <button type="submit" className={styles.btnSubmit} disabled={isUpdating} style={{ flex: 'none', padding: '14px 24px' }}>
            {isUpdating ? <Loader2 className={styles.loader} size={18} style={{ marginRight: '8px' }} /> : <Save size={18} style={{ marginRight: '8px' }} />}
            Set Supply
          </button>
        </form>

        <h4 className={styles.sectionTitle} style={{ marginBottom: '16px' }}>Current Market Assets</h4>
        <div className={styles.marketList}>
          {data?.assets?.length === 0 && <div style={{ color: 'var(--color-text-secondary)' }}>No assets in the database yet.</div>}
          {data?.assets?.map((asset: any) => (
            <div key={asset.id} className={styles.marketRow}>
              <div className={styles.marketIconArea}>
                <div className={styles.marketIcon}>{asset.symbol[0]}</div>
                <div>
                  <div className={styles.marketSymbol}>{asset.symbol}</div>
                  <div className={styles.marketType}>{asset.type}</div>
                </div>
              </div>
              <div className={styles.marketPriceArea}>
                <div className={styles.marketPrice} style={{ color: asset.availableSupply === null ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}>
                  {asset.availableSupply === null ? 'Infinite (∞)' : `${asset.availableSupply.toLocaleString(undefined, { maximumFractionDigits: 8 })} Available`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
