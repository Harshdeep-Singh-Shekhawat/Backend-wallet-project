import { Wallet, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight, Briefcase } from 'lucide-react';
import styles from './PortfolioOverview.module.css';

interface PortfolioOverviewProps {
  totalValue: number;
  fiatBalance: number;

  totalCost: number;
  totalPnL: number;
  pnlPercentage: number;
  currencySymbol: string;
}

export default function PortfolioOverview({ totalValue, fiatBalance, totalCost, totalPnL, pnlPercentage, currencySymbol }: PortfolioOverviewProps) {
  const isProfit = totalPnL >= 0;
  const totalBalance = totalValue;

  return (
    <div className={styles.grid}>
      {/* Invested Amount */}
      <div className={`glass-panel ${styles.card}`}>
        <div className={styles.iconWrapper}>
          <Briefcase size={18} strokeWidth={2.5} />
        </div>
        <div className={styles.cardTitle}>Invested Amount</div>
        <div className={styles.cardValue}>
          {currencySymbol}{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Portfolio Value */}
      <div className={`glass-panel ${styles.card}`}>
        <div className={styles.iconWrapper}>
          <Wallet size={18} strokeWidth={2.5} />
        </div>
        <div className={styles.cardTitle}>Portfolio Value</div>
        <div className={styles.cardValue}>
          {currencySymbol}{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          {isProfit ? '+' : '-'}{currencySymbol}{Math.abs(totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={isProfit ? styles.pnlText : styles.pnlTextNegative}>
          Past 24 Hours
        </div>
      </div>

      {/* Available Cash */}
      <div className={`glass-panel ${styles.card}`}>
        <div className={styles.iconWrapper}>
          <CreditCard size={18} strokeWidth={2.5} />
        </div>
        <div className={styles.cardTitle}>Available Cash</div>
        <div className={styles.cardValue}>
          {currencySymbol}{fiatBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>
    </div>
  );
}
