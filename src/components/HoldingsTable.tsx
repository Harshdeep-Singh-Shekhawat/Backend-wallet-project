import { cn } from '@/lib/utils';

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
      <div className="bg-white p-16 rounded-2xl flex flex-col items-center justify-center text-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h4 className="text-lg font-bold text-slate-900 mb-2">No assets yet</h4>
        <p className="text-slate-500 font-medium max-w-sm">
          Your portfolio is empty. Head over to the Trade tab to buy your first cryptocurrency or stock!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="py-4 pl-6 pr-4 text-slate-500 font-semibold text-sm">Asset</th>
              <th className="p-4 text-slate-500 font-semibold text-sm text-right">Balance</th>
              <th className="p-4 text-slate-500 font-semibold text-sm text-right">Live Price</th>
              <th className="p-4 text-slate-500 font-semibold text-sm text-right">Current Value</th>
              <th className="p-4 text-slate-500 font-semibold text-sm text-right">Purchase Price</th>
              <th className="py-4 pr-6 pl-4 text-slate-500 font-semibold text-sm text-right">Total Returns</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {holdings.map((holding) => {
              const currentValue = holding.quantity * holding.currentPrice;
              const totalCost = holding.quantity * holding.averagePurchasePrice;
              const pnl = currentValue - totalCost;
              const pnlPercent = totalCost > 0 ? (pnl / totalCost) * 100 : 0;
              const isProfit = pnl >= 0;

              return (
                <tr key={holding.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 pl-6 pr-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                        {holding.symbol[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{holding.symbol}</div>
                        <div className="text-xs text-slate-500 font-medium">{holding.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="text-slate-900 font-semibold">{holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="text-slate-900 font-semibold">${holding.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="text-slate-900 font-bold">${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="text-slate-500 font-medium">${holding.averagePurchasePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </td>
                  <td className="py-4 pr-6 pl-4 text-right">
                    <div className={cn("font-bold text-[15px]", isProfit ? "text-emerald-600" : "text-rose-600")}>
                      {isProfit ? '+' : '-'}${Math.abs(pnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={cn("text-xs font-semibold", isProfit ? "text-emerald-500" : "text-rose-500")}>
                      {isProfit ? '+' : ''}{pnlPercent.toFixed(2)}%
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
