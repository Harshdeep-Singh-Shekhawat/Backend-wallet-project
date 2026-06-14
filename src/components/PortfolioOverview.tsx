import { TrendingUp, Wallet, LineChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import styles from './PortfolioOverview.module.css';
import globalStyles from '../app/globals.css'; // Just to ensure globals are loaded if needed, though Nextjs does this

interface PortfolioOverviewProps {
  totalValue: number;
  fiatBalance: number;
  totalPnL: number;
  pnlPercentage: number;
}

export default function PortfolioOverview({ totalValue, fiatBalance, totalPnL, pnlPercentage }: PortfolioOverviewProps) {
  const isProfit = totalPnL >= 0;
  const totalBalance = totalValue + fiatBalance;

  return (
    <div className={styles.grid}>
      {/* Total Balance */}
      <div className={`glass-panel ${styles.card}`}>
        <div className={styles.cardHeader}>
          <div className={styles.iconWrapper}>
            <Wallet size={20} />
          </div>
          <span className={styles.cardTitle}>Total Balance</span>
        </div>
        <div className={styles.cardValue}>
          ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Buying Power (Fiat) */}
      <div className={`glass-panel ${styles.card}`}>
        <div className={styles.cardHeader}>
          <div className={styles.iconWrapper}>
            <LineChart size={20} />
          </div>
          <span className={styles.cardTitle}>Buying Power</span>
        </div>
        <div className={styles.cardValue}>
          ${fiatBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Total Returns */}
      <div className={`glass-panel ${styles.card}`}>
        <div className={styles.cardHeader}>
          <div className={styles.iconWrapper}>
            <TrendingUp size={20} />
          </div>
          <span className={styles.cardTitle}>Total Returns</span>
        </div>
        <div className={styles.cardValue}>
          {isProfit ? '+' : '-'}${Math.abs(totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={`${styles.pnlInfo} ${isProfit ? styles.positive : styles.negative}`}>
          {isProfit ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
          {Math.abs(pnlPercentage).toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
