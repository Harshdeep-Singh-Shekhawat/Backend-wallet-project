import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ArrowRightLeft, TrendingUp, Wallet, User, LogOut, Eye, BellRing, Settings, Sun, Moon, Building, Zap } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user?: { name: string; email: string; role?: string };
  systemConfig?: any;
  announcements?: any[];
  onLogout?: () => void;
}

export default function DashboardLayout({ children, activeTab, setActiveTab, user, systemConfig, announcements, onLogout }: DashboardLayoutProps) {
  let menuItems = [
    { id: 'Portfolio', icon: <LayoutDashboard size={18} />, label: 'Portfolio Overview' },
    { id: 'Watchlist', icon: <Eye size={18} />, label: 'Watchlist' },
    { id: 'Trade Crypto', icon: <ArrowRightLeft size={18} />, label: 'Trade Crypto' },
    { id: 'Trade Stocks', icon: <TrendingUp size={18} />, label: 'Trade Stocks' },
    { id: 'Trade RWA', icon: <Building size={18} />, label: 'Trade RWA' },
    { id: 'Wallets', icon: <Wallet size={18} />, label: 'My Wallets' },
    { id: 'Alerts', icon: <BellRing size={18} />, label: 'Price Alerts' },
    { id: 'Settings', icon: <Settings size={18} />, label: 'Settings' },
  ];

  if (user?.role === 'ADMIN') {
    menuItems = [
      { id: 'Admin Console', icon: <Settings size={18} />, label: 'Admin Console' },
      { id: 'Settings', icon: <Settings size={18} />, label: 'Settings' },
    ];
  }

  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || localStorage.getItem('theme') || 'dark';
    setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <div className={styles.layout}>
      <Toaster position="top-right" toastOptions={{ style: { background: '#333', color: '#fff', border: '1px solid #444' } }} />
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logoArea} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className={styles.logoIcon} style={{ background: 'var(--color-accent)', padding: '6px', borderRadius: '8px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={20} fill="currentColor" /></div>
            <span className={styles.logoText}>Strike</span>
          </div>
          <button 
            onClick={toggleTheme} 
            style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }} 
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
        
        <nav className={styles.nav}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`${styles.navItem} ${activeTab === item.id ? styles.active : ''}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className={styles.sidebarBottom}>
          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>
              <User size={20} color="#888" />
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div className={styles.userName} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name || 'User'}</div>
              <div className={styles.userStatus} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || 'user@example.com'}</div>
            </div>
            {onLogout && (
              <button onClick={onLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }} title="Log out">
                <LogOut size={16} color="#888" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.headerTitle}>{activeTab}</h2>
            <div className={styles.headerSubtitle}>Track and manage your assets.</div>
          </div>
        </header>

        {systemConfig?.['MAINTENANCE_MODE'] === 'true' && (
          <div style={{ background: 'rgba(231, 76, 60, 0.2)', border: '1px solid #e74c3c', color: '#e74c3c', padding: '12px 24px', borderRadius: '8px', margin: '0 32px 24px 32px', fontWeight: 600 }}>
            🚨 System is currently in MAINTENANCE MODE. {systemConfig['MAINTENANCE_MESSAGE']}
          </div>
        )}

        {(announcements?.length || 0) > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '0 32px 24px 32px' }}>
            {announcements?.map((ann: any) => (
              <div key={ann.id} style={{ background: 'rgba(52, 152, 219, 0.1)', border: '1px solid #3498db', color: 'var(--color-text-primary)', padding: '16px 24px', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 600, color: '#3498db', marginBottom: '4px' }}>📢 {ann.title}</div>
                <div style={{ fontSize: '0.9rem' }}>{ann.content}</div>
              </div>
            ))}
          </div>
        )}

        {/* Page Content */}
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
