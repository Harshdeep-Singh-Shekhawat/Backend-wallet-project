import React, { useState } from 'react';
import useSWR from 'swr';
import { Loader2, Database, Plus, Edit2, Ban, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch, apiFetcher } from '@/lib/api';
import styles from '../app/page.module.css';

export default function AdminAssets() {
  const { data, mutate, isLoading } = useSWR('/api/admin/assets', apiFetcher);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    type: 'CRYPTO',
    status: 'ACTIVE',
    availableSupply: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const openModal = (asset?: any) => {
    if (asset) {
      setFormData({
        symbol: asset.symbol,
        name: asset.name,
        type: asset.type,
        status: asset.status,
        availableSupply: asset.availableSupply !== null ? String(asset.availableSupply) : ''
      });
    } else {
      setFormData({
        symbol: '',
        name: '',
        type: 'CRYPTO',
        status: 'ACTIVE',
        availableSupply: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.symbol || !formData.name) return toast.error('Symbol and Name are required');

    setIsUpdating(true);
    try {
      const res = await apiFetch('/api/admin/assets/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to save asset');

      toast.success(`Successfully saved ${formData.symbol}`);
      setIsModalOpen(false);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 className={styles.cardTitleBig}>Asset Restrictions</h3>
            <p className={styles.cardDesc}>Control the exact assets and supply constraints available on the platform.</p>
          </div>
          <button onClick={() => openModal()} className={styles.btnSubmit} style={{ flex: 'none', padding: '12px 24px', display: 'flex', gap: '8px' }}>
            <Plus size={18} /> Add Asset
          </button>
        </div>
        
        <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', position: 'relative' }}>
            <thead style={{ position: 'sticky', top: 0, background: '#111111', zIndex: 10 }}>
              <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Asset</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Type</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Available Supply</th>
                <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.assets?.map((asset: any) => (
                <tr key={asset.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', opacity: asset.status !== 'ACTIVE' ? 0.6 : 1 }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 800 }}>{asset.symbol}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{asset.name}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)' }}>
                      {asset.type}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontWeight: 500 }}>
                    {asset.availableSupply === null ? '∞ Infinite' : asset.availableSupply.toLocaleString()}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, 
                      background: asset.status === 'ACTIVE' ? 'rgba(46, 204, 113, 0.2)' : asset.status === 'SUSPENDED' ? 'rgba(241, 196, 15, 0.2)' : 'rgba(231, 76, 60, 0.2)', 
                      color: asset.status === 'ACTIVE' ? '#2ecc71' : asset.status === 'SUSPENDED' ? '#f1c40f' : '#e74c3c' 
                    }}>
                      {asset.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button onClick={() => openModal(asset)} className={styles.btnSecondary} style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Edit2 size={14} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
              {data?.assets?.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No assets tracked yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
          <div className={`glass-panel ${styles.card}`} style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
              <X size={24} />
            </button>
            <h3 className={styles.cardTitleBig} style={{ marginBottom: '24px' }}>{formData.symbol ? 'Edit Asset' : 'Add New Asset'}</h3>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className={styles.inputGroup} style={{ flex: 1, marginBottom: 0 }}>
                  <label className={styles.inputLabel}>Symbol</label>
                  <input type="text" value={formData.symbol} onChange={e => setFormData({...formData, symbol: e.target.value.toUpperCase()})} className={styles.input} placeholder="BTC" required disabled={!!data?.assets?.find((a: any) => a.symbol === formData.symbol)} />
                </div>
                <div className={styles.inputGroup} style={{ flex: 2, marginBottom: 0 }}>
                  <label className={styles.inputLabel}>Name</label>
                  <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={styles.input} placeholder="Bitcoin" required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div className={styles.inputGroup} style={{ flex: 1, marginBottom: 0 }}>
                  <label className={styles.inputLabel}>Asset Type</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className={styles.input}>
                    <option value="CRYPTO">Crypto</option>
                    <option value="STOCK">Stock</option>
                  </select>
                </div>
                <div className={styles.inputGroup} style={{ flex: 1, marginBottom: 0 }}>
                  <label className={styles.inputLabel}>Trading Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className={styles.input}>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended (No Buying)</option>
                    <option value="DELISTED">Delisted (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
                <label className={styles.inputLabel}>Global Available Supply (Optional)</label>
                <input type="number" value={formData.availableSupply} onChange={e => setFormData({...formData, availableSupply: e.target.value})} className={styles.input} placeholder="Leave empty for infinite supply" />
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                  If set, users cannot buy more of this asset globally once this supply is exhausted across all portfolios.
                </p>
              </div>

              <button type="submit" className={styles.btnSubmit} disabled={isUpdating} style={{ marginTop: '16px' }}>
                {isUpdating ? <Loader2 className={styles.loader} /> : 'Save Asset Configuration'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
