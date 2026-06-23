import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch, apiFetcher } from '@/lib/api';
import styles from '../app/page.module.css';

export default function AdminSettings() {
  const { data, mutate, isLoading } = useSWR('/api/system/settings', apiFetcher);
  const [settings, setSettings] = useState<any>({});
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (data?.config) {
      setSettings(data.config);
    }
  }, [data]);

  const handleSave = async () => {
    setIsUpdating(true);
    try {
      const payload = Object.keys(settings).map(key => ({ key, value: String(settings[key]) }));
      const res = await apiFetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload }),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      toast.success('System settings saved!');
      mutate();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggle = (key: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: prev[key] === 'true' ? 'false' : 'true' }));
  };

  const handleChange = (key: string, value: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  if (isLoading) return <div className={styles.loading}><Loader2 className={styles.loader} /></div>;

  return (
    <div className={styles.sectionSpace}>
      <div className={`glass-panel ${styles.card}`}>
        <h3 className={styles.cardTitleBig}>System Settings</h3>
        <p className={styles.cardDesc}>Configure global platform toggles and maintenance controls.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Maintenance Mode</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Disable platform access for regular users</div>
            </div>
            <button 
              className={settings['MAINTENANCE_MODE'] === 'true' ? styles.btnDanger : styles.btnSecondary} 
              onClick={() => handleToggle('MAINTENANCE_MODE')}
              style={{ flex: 'none', minWidth: '100px', padding: '8px 16px' }}
            >
              {settings['MAINTENANCE_MODE'] === 'true' ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {settings['MAINTENANCE_MODE'] === 'true' && (
            <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
              <label className={styles.inputLabel}>Maintenance Message</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  value={settings['MAINTENANCE_MESSAGE'] || ''} 
                  onChange={(e) => handleChange('MAINTENANCE_MESSAGE', e.target.value)} 
                  className={styles.input} 
                  placeholder="e.g., We're upgrading our systems..."
                  style={{ flex: 1 }}
                />
                <button onClick={handleSave} className={styles.btnSubmit} disabled={isUpdating} style={{ flex: 'none', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isUpdating ? <Loader2 className={styles.loader} size={18} /> : 'Send'}
                </button>
              </div>
            </div>
          )}

          <div style={{ height: '1px', background: 'var(--color-border)' }}></div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Crypto Trading</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Allow buying and selling of cryptocurrencies</div>
            </div>
            <button 
              className={settings['CRYPTO_TRADING_ENABLED'] !== 'false' ? styles.btnSubmit : styles.btnSecondary} 
              onClick={() => handleToggle('CRYPTO_TRADING_ENABLED')}
              style={{ flex: 'none', minWidth: '100px', padding: '8px 16px' }}
            >
              {settings['CRYPTO_TRADING_ENABLED'] !== 'false' ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>Stock Trading</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Allow buying and selling of stocks</div>
            </div>
            <button 
              className={settings['STOCK_TRADING_ENABLED'] !== 'false' ? styles.btnSubmit : styles.btnSecondary} 
              onClick={() => handleToggle('STOCK_TRADING_ENABLED')}
              style={{ flex: 'none', minWidth: '100px', padding: '8px 16px' }}
            >
              {settings['STOCK_TRADING_ENABLED'] !== 'false' ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>New Registrations</div>
              <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Allow new users to sign up</div>
            </div>
            <button 
              className={settings['REGISTRATIONS_ENABLED'] !== 'false' ? styles.btnSubmit : styles.btnSecondary} 
              onClick={() => handleToggle('REGISTRATIONS_ENABLED')}
              style={{ flex: 'none', minWidth: '100px', padding: '8px 16px' }}
            >
              {settings['REGISTRATIONS_ENABLED'] !== 'false' ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div style={{ marginTop: '16px' }}>
            <button onClick={handleSave} className={styles.btnSubmit} disabled={isUpdating} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isUpdating ? <Loader2 className={styles.loader} size={18} /> : <Save size={18} />}
              Save Changes
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
