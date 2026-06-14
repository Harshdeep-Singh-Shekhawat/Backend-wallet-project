import React from 'react';
import { LayoutDashboard, ArrowRightLeft, Wallet, Settings, Bell, Search, User } from 'lucide-react';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function DashboardLayout({ children, activeTab, setActiveTab }: DashboardLayoutProps) {
  const menuItems = [
    { id: 'Portfolio', icon: <LayoutDashboard size={18} />, label: 'Portfolio' },
    { id: 'Trade', icon: <ArrowRightLeft size={18} />, label: 'Trade Markets' },
    { id: 'Wallets', icon: <Wallet size={18} />, label: 'My Wallets' },
    { id: 'Settings', icon: <Settings size={18} />, label: 'Preferences' },
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
        
        <div className={styles.sidebarBottom}>
          <div className={styles.helpCard}>
            <div className={styles.helpLabel}>NEED HELP?</div>
            <div className={styles.helpText}>Contact support 24/7</div>
            <button className={styles.helpBtn}>Chat Now</button>
          </div>

          <div className={styles.userProfile}>
            <div className={styles.userAvatar}>
              <User size={20} color="#888" />
            </div>
            <div>
              <div className={styles.userName}>Alex Doe</div>
              <div className={styles.userStatus}>Verified Account</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.headerTitle}>{activeTab} Overview</h2>
            <div className={styles.headerSubtitle}>Track and manage your crypto assets.</div>
          </div>
          
          <div className={styles.headerRight}>
            <div className={styles.searchContainer}>
              <Search size={16} className={styles.searchIcon} />
              <input type="text" placeholder="Search assets..." className={styles.searchInput} />
            </div>
            <button className={styles.notificationBtn}>
              <Bell size={18} />
              <span className={styles.notificationBadge}></span>
            </button>
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
