import styles from './HoldingsTable.module.css';

export interface Holding {
  id: string;
  symbol: string;
  name: string;
  type: string;
  quantity: number;
  averagePurchasePrice: number;
  currentPrice: number;
}

interface HoldingsTableProps {
  holdings: Holding[];
}

export default function HoldingsTable({ holdings }: HoldingsTableProps) {
  if (holdings.length === 0) {
    return (
      <div className={`glass-panel ${styles.emptyState}`}>
        <div className={styles.emptyIcon}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h4 className={styles.emptyTitle}>No assets yet</h4>
        <p className={styles.emptyDesc}>
          Your portfolio is empty. Head over to the Trade tab to buy your first cryptocurrency or stock!
        </p>
      </div>
    );
  }

  return (
    <div className={`glass-panel ${styles.container}`}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Asset</th>
            <th className={`${styles.th} ${styles.thRight}`}>Balance</th>
            <th className={`${styles.th} ${styles.thRight}`}>Live Price</th>
            <th className={`${styles.th} ${styles.thRight}`}>Current Value</th>
            <th className={`${styles.th} ${styles.thRight}`}>Purchase Price</th>
            <th className={`${styles.th} ${styles.thRight}`}>Total Returns</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((holding) => {
            const currentValue = holding.quantity * holding.currentPrice;
            const totalCost = holding.quantity * holding.averagePurchasePrice;
            const pnl = currentValue - totalCost;
            const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
            const isProfit = pnl >= 0;

            return (
              <tr key={holding.id} className={styles.tr}>
                <td className={styles.td}>
                  <div className={styles.assetInfo}>
                    <div className={styles.assetIcon}>
                      {holding.symbol[0]}
                    </div>
                    <div>
                      <div className={styles.assetSymbol}>{holding.symbol}</div>
                      <div className={styles.assetName}>{holding.name}</div>
                    </div>
                  </div>
                </td>
                <td className={`${styles.td} ${styles.tdRight}`}>
                  <div className={styles.valuePrimary}>{holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
                </td>
                <td className={`${styles.td} ${styles.tdRight}`}>
                  <div className={styles.valuePrimary}>${holding.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </td>
                <td className={`${styles.td} ${styles.tdRight}`}>
                  <div className={styles.valuePrimary}>${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </td>
                <td className={`${styles.td} ${styles.tdRight}`}>
                  <div className={styles.valueSecondary}>${holding.averagePurchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </td>
                <td className={`${styles.td} ${styles.tdRight}`}>
                  <div className={isProfit ? styles.pnlPositive : styles.pnlNegative}>
                    {isProfit ? '+' : '-'}${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={isProfit ? styles.pnlPercentPositive : styles.pnlPercentNegative}>
                    {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
