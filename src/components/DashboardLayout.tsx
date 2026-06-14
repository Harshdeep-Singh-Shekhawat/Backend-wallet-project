import React from 'react';
import { LayoutDashboard, ArrowRightLeft, Wallet, Settings, LogOut, Bell } from 'lucide-react';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function DashboardLayout({ children, activeTab, setActiveTab }: DashboardLayoutProps) {
  const menuItems = [
    { id: 'Portfolio', icon: <LayoutDashboard size={20} />, label: 'Portfolio' },
    { id: 'Trade', icon: <ArrowRightLeft size={20} />, label: 'Trade' },
    { id: 'Wallets', icon: <Wallet size={20} />, label: 'Wallets' },
    { id: 'Settings', icon: <Settings size={20} />, label: 'Settings' },
  ];

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon}>N</div>
          <span className={styles.logoText}>NeoTrade</span>
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
        
        <div className={styles.footer}>
          <button className={styles.logoutBtn}>
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <h2 className={styles.headerTitle}>{activeTab}</h2>
          <div className={styles.userMenu}>
            <button className={styles.notificationBtn}>
              <Bell size={22} />
              <span className={styles.notificationBadge}></span>
            </button>
            <div className={styles.userInfo}>
              <div className={styles.userName}>Hi, Alex</div>
              <div className={styles.userStatus}>VERIFIED ACCOUNT</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
