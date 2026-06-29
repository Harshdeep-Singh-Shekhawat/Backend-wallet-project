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
  onTradeClick?: () => void;
  currencySymbol: string;
}

export default function HoldingsTable({ holdings, onTradeClick, currencySymbol }: HoldingsTableProps) {
  return (
    <div className={`glass-panel ${styles.container}`}>
      <div className={styles.headerArea}>
        <h3 className={styles.title}>Your Assets</h3>
        <button className={styles.tradeLink} onClick={onTradeClick}>
          Trade Markets &gt;
        </button>
      </div>

      {holdings.length === 0 ? (
        <div className={styles.emptyState}>
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
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>ASSET</th>
              <th className={`${styles.th} ${styles.thRight}`}>BALANCE</th>
              <th className={`${styles.th} ${styles.thRight}`}>LIVE PRICE</th>
              <th className={`${styles.th} ${styles.thRight}`}>HOLDINGS</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((holding) => {
              const currentValue = holding.quantity * holding.currentPrice;
              const totalCost = holding.quantity * holding.averagePurchasePrice;
              const pnl = currentValue - totalCost;
              const isProfit = pnl >= 0;

              // Determine specific colors based on symbol
              const sym = holding.symbol.toUpperCase();
              let borderClass = '';
              let dotClass = styles.dotDefault;
              if (sym === 'BTC') { borderClass = styles.borderBTC; dotClass = styles.dotBTC; }
              else if (sym === 'ETH') { borderClass = styles.borderETH; dotClass = styles.dotETH; }
              else if (sym === 'SOL') { borderClass = styles.borderSOL; dotClass = styles.dotSOL; }

              return (
                <tr key={holding.id} className={styles.tr}>
                  <td className={styles.td}>
                    <div className={styles.assetInfo}>
                      <div className={styles.assetIconWrapper}>
                        <div className={`${styles.assetIcon} ${borderClass}`}>
                          {holding.symbol[0]}
                        </div>
                        <div className={`${styles.assetDot} ${dotClass}`}></div>
                      </div>
                      <div>
                        <div className={styles.assetName}>{holding.name || holding.symbol}</div>
                        <div className={styles.assetSymbol}>{holding.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className={`${styles.td} ${styles.tdRight}`}>
                    <div className={styles.valuePrimary}>{holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
                  </td>
                  <td className={`${styles.td} ${styles.tdRight}`}>
                    <div className={styles.valuePrimary}>{currencySymbol}{holding.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </td>
                  <td className={`${styles.td} ${styles.tdRight}`}>
                    <div className={styles.valuePrimary}>{currencySymbol}{currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className={isProfit ? styles.pnlPositive : styles.pnlNegative}>
                      {isProfit ? '+' : '-'}{currencySymbol}{Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
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
