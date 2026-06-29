import React from 'react';
import useSWR from 'swr';
import { Loader2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { getAuthToken } from '@/lib/api';
import styles from '../app/page.module.css';

// Using standard fetch since this route is hosted on Next.js directly
const fetcher = async (url: string) => {
  const token = getAuthToken();
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(url, { headers });
  return res.json();
};

export default function AdminTransactions() {
  const { data, error, isLoading } = useSWR('/api/admin/transactions', fetcher);

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Loader2 className={styles.loader} /></div>;
  if (error) return <div className={styles.formError}>Failed to load transactions.</div>;
  if (data?.error) return <div className={styles.formError}>{data.error}</div>;

  const transactions = data?.transactions || [];

  return (
    <div className={`glass-panel ${styles.card}`}>
      <h3 className={styles.cardTitleBig} style={{ marginBottom: '24px' }}>Global Transaction Feed</h3>
      
      {transactions.length === 0 ? (
        <div className={styles.activityEmpty}>
          <span>No transactions found in the system.</span>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Type</th>
              <th>Asset</th>
              <th>Quantity / Price</th>
              <th>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx: any) => {
              const isDeposit = tx.type === 'DEPOSIT' || tx.type === 'SELL';
              const icon = isDeposit ? <ArrowDownCircle size={16} className={styles.iconDeposit} /> : <ArrowUpCircle size={16} className={styles.iconWithdraw} />;
              
              return (
                <tr key={tx.id}>
                  <td>{new Date(tx.timestamp).toLocaleString()}</td>
                  <td>
                    <div>{tx.userName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{tx.userEmail}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {icon} {tx.type}
                    </div>
                  </td>
                  <td>{tx.assetSymbol || 'USD'}</td>
                  <td>
                    {tx.quantity ? `${tx.quantity} @ $${Number(tx.pricePerUnit).toLocaleString()}` : '---'}
                  </td>
                  <td style={{ color: isDeposit ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                    {isDeposit ? '+' : '-'}${Number(tx.totalValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
