import { Wallet, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import styles from './PortfolioOverview.module.css';

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
        <div className={styles.iconWrapper}>
          <Wallet size={18} strokeWidth={2.5} />
        </div>
        <div className={styles.cardTitle}>Total Balance</div>
        <div className={styles.cardValue}>
          ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Buying Power (Fiat) */}
      <div className={`glass-panel ${styles.card}`}>
        <div className={styles.iconWrapper}>
          <CreditCard size={18} strokeWidth={2.5} />
        </div>
        <div className={styles.cardTitle}>Buying Power</div>
        <div className={styles.cardValue}>
          ${fiatBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Total Returns */}
      <div className={`glass-panel ${styles.card}`}>
        <div className={styles.iconWrapper}>
          <TrendingUp size={18} strokeWidth={2.5} />
        </div>
        
        <div className={`${styles.pnlBadge} ${isProfit ? styles.positive : styles.negative}`}>
          {isProfit ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
          {Math.abs(pnlPercentage).toFixed(2)}%
        </div>

        <div className={styles.cardTitle}>Total Returns</div>
        <div className={styles.cardValue}>
          {isProfit ? '+' : '-'}${Math.abs(totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={isProfit ? styles.pnlText : styles.pnlTextNegative}>
          Past 24 Hours
        </div>
      </div>
    </div>
  );
}
