import React, { useState } from 'react';
import useSWR from 'swr';
import { Loader2, Save, Database, Settings, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiFetch, apiFetcher } from '@/lib/api';
import styles from '../app/page.module.css';

import AdminSettings from './AdminSettings';
import AdminAnnouncements from './AdminAnnouncements';
import AdminUsers from './AdminUsers';
import AdminAssets from './AdminAssets';
export default function AdminTab() {
  const [activeSubTab, setActiveSubTab] = useState('Settings');

  const tabs = [
    { id: 'Settings', label: 'System Settings', icon: <Settings size={16} /> },
    { id: 'Announcements', label: 'Announcements', icon: <Megaphone size={16} /> },
    { id: 'Users', label: 'User & Wallet Mgmt', icon: <Database size={16} /> },
    { id: 'Assets', label: 'Asset Management', icon: <Database size={16} /> },
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', paddingBottom: '16px' }}>
        {tabs.map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              background: activeSubTab === tab.id ? 'var(--color-accent)' : 'rgba(255,255,255,0.05)', 
              color: activeSubTab === tab.id ? 'var(--color-bg)' : 'var(--color-text-primary)',
              border: '1px solid',
              borderColor: activeSubTab === tab.id ? 'var(--color-accent)' : 'var(--color-border)',
              padding: '12px 24px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'all 0.2s',
              boxShadow: activeSubTab === tab.id ? '0 4px 12px rgba(255,255,255,0.1)' : 'none'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'Settings' && <AdminSettings />}
      {activeSubTab === 'Announcements' && <AdminAnnouncements />}
      {activeSubTab === 'Users' && <AdminUsers />}
      {activeSubTab === 'Assets' && <AdminAssets />}
    </div>
  );
}
