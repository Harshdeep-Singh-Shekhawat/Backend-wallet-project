import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface PortfolioOverviewProps {
  totalValue: number;
  fiatBalance: number;
  totalPnL: number;
  pnlPercentage: number;
}

export default function PortfolioOverview({ totalValue, fiatBalance, totalPnL, pnlPercentage }: PortfolioOverviewProps) {
  const isProfit = totalPnL >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
        <div className="text-slate-500 text-sm font-medium mb-2">
          Total Balance
        </div>
        <div className="text-4xl font-bold text-slate-900 tracking-tight">
          ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
        <div className="text-slate-500 text-sm font-medium mb-2 flex items-center gap-2">
          <Wallet size={16} className="text-blue-500" /> Buying Power
        </div>
        <div className="text-4xl font-bold text-slate-900 tracking-tight">
          ${fiatBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
        <div className="text-slate-500 text-sm font-medium mb-2">
          Total Returns
        </div>
        <div className="flex items-end gap-3">
          <div className={cn("text-4xl font-bold tracking-tight", isProfit ? "text-emerald-600" : "text-rose-600")}>
            {isProfit ? '+' : '-'}${Math.abs(totalPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={cn("flex items-center text-sm font-semibold mb-1.5 px-2 py-1 rounded-lg", isProfit ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50")}>
            {isProfit ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
            {Math.abs(pnlPercentage).toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
}
