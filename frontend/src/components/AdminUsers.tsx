import React, { useState } from 'react';
import useSWR from 'swr';
import { Loader2, Search, UserMinus, UserCheck, ShieldOff, Wallet, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch, apiFetcher } from '@/lib/api';
import styles from '../app/page.module.css';

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, mutate, isLoading } = useSWR(`/api/admin/users?page=${page}&search=${search}`, apiFetcher);
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateStatus = async (userId: string, status: string) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success(`User marked as ${status}`);
      mutate();
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, status });
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateWalletStatus = async (userId: string, walletStatus: string) => {
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/wallet/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletStatus }),
      });
      if (!res.ok) throw new Error('Failed to update wallet status');
      toast.success(`Wallet marked as ${walletStatus}`);
      mutate();
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, walletStatus });
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleFunds = async (userId: string, action: 'CREDIT' | 'DEBIT') => {
    if (!fundAmount || isNaN(Number(fundAmount))) return toast.error('Enter a valid amount');
    setIsUpdating(true);
    try {
      const res = await apiFetch(`/api/admin/users/${userId}/wallet/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(fundAmount), action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update balance');
      toast.success(`Successfully ${action === 'CREDIT' ? 'credited' : 'debited'} $${fundAmount}`);
      setFundAmount('');
      mutate();
      if (selectedUser?.id === userId) {
        setSelectedUser(data.user);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  if (selectedUser) {
    return (
      <div className={styles.sectionSpace}>
        <button onClick={() => setSelectedUser(null)} className={styles.btnSecondary} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ChevronLeft size={16} /> Back to Users
        </button>

        <div className={`glass-panel ${styles.card}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 className={styles.cardTitleBig}>{selectedUser.name}</h3>
              <p className={styles.cardDesc}>{selectedUser.email} • Joined {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, background: selectedUser.status === 'ACTIVE' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)', color: selectedUser.status === 'ACTIVE' ? '#2ecc71' : '#e74c3c' }}>
                Account: {selectedUser.status}
              </span>
              <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, background: selectedUser.walletStatus === 'ACTIVE' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)', color: selectedUser.walletStatus === 'ACTIVE' ? '#2ecc71' : '#e74c3c' }}>
                Wallet: {selectedUser.walletStatus}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', marginTop: '32px' }}>
            
            {/* Account Actions */}
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldOff size={18} /> Account Controls</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedUser.status !== 'ACTIVE' && (
                  <button onClick={() => handleUpdateStatus(selectedUser.id, 'ACTIVE')} className={styles.btnSubmit} style={{ width: '100%' }}>Activate Account</button>
                )}
                {selectedUser.status !== 'SUSPENDED' && (
                  <button onClick={() => handleUpdateStatus(selectedUser.id, 'SUSPENDED')} className={styles.btnSecondary} style={{ width: '100%' }}>Suspend Account</button>
                )}
                {selectedUser.status !== 'BANNED' && (
                  <button onClick={() => handleUpdateStatus(selectedUser.id, 'BANNED')} className={styles.btnDanger} style={{ width: '100%' }}>Ban Account</button>
                )}
              </div>
            </div>

            {/* Wallet Actions */}
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', padding: '24px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <h4 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><Wallet size={18} /> Wallet Controls</h4>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '16px' }}>
                ${selectedUser.fiatBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                {selectedUser.walletStatus === 'ACTIVE' ? (
                  <button onClick={() => handleUpdateWalletStatus(selectedUser.id, 'FROZEN')} className={styles.btnDanger} style={{ flex: 1 }}>Freeze Wallet</button>
                ) : (
                  <button onClick={() => handleUpdateWalletStatus(selectedUser.id, 'ACTIVE')} className={styles.btnSubmit} style={{ flex: 1 }}>Unfreeze Wallet</button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                <div className={styles.inputGroup} style={{ marginBottom: 0, flex: 1 }}>
                  <label className={styles.inputLabel}>Manual Fund Adjustment</label>
                  <input 
                    type="number" 
                    value={fundAmount} 
                    onChange={(e) => setFundAmount(e.target.value)} 
                    className={styles.input} 
                    placeholder="Amount in USD"
                  />
                </div>
                <button onClick={() => handleFunds(selectedUser.id, 'CREDIT')} className={styles.btnSubmit} disabled={isUpdating} style={{ padding: '0', height: '48px', flex: 'none', minWidth: '100px' }}>
                  Credit
                </button>
                <button onClick={() => handleFunds(selectedUser.id, 'DEBIT')} className={styles.btnSecondary} disabled={isUpdating} style={{ padding: '0', height: '48px', flex: 'none', minWidth: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Debit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sectionSpace}>
      <div className={`glass-panel ${styles.card}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 className={styles.cardTitleBig}>User & Wallet Management</h3>
            <p className={styles.cardDesc}>Manage all registered users, their access, and manual fund adjustments.</p>
          </div>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
            <input 
              type="text" 
              placeholder="Search name or email..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className={styles.input}
              style={{ paddingLeft: '40px', marginBottom: 0 }}
            />
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loading}><Loader2 className={styles.loader} /></div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>User</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Balance</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.users?.map((user: any) => (
                    <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600 }}>{user.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{user.email}</div>
                      </td>
                      <td style={{ padding: '16px', fontWeight: 500 }}>
                        ${user.fiatBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, background: user.status === 'ACTIVE' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)', color: user.status === 'ACTIVE' ? '#2ecc71' : '#e74c3c' }}>
                          {user.status}
                        </span>
                        {user.walletStatus === 'FROZEN' && (
                          <span style={{ marginLeft: '8px', padding: '4px 8px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(52, 152, 219, 0.2)', color: '#3498db' }}>
                            WALLET FROZEN
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button onClick={() => setSelectedUser(user)} className={styles.btnSecondary} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                          Manage User
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data?.users?.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data?.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1}
                  className={styles.btnSecondary}
                  style={{ padding: '8px', display: 'flex', alignItems: 'center' }}
                >
                  <ChevronLeft size={18} />
                </button>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                  Page {page} of {data.totalPages}
                </span>
                <button 
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))} 
                  disabled={page === data.totalPages}
                  className={styles.btnSecondary}
                  style={{ padding: '8px', display: 'flex', alignItems: 'center' }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
