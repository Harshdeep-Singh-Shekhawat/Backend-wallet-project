'use client';

import { ReactNode } from 'react';
import { Wallet, PieChart, ArrowLeftRight, Settings, LogOut, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface DashboardLayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function DashboardLayout({ children, activeTab, setActiveTab }: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white flex flex-col z-10 shadow-sm relative">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-blue-200">
              N
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">NeoTrade</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1.5 mt-4 relative">
          <NavItem icon={<PieChart size={20} />} label="Portfolio" active={activeTab === 'Portfolio'} onClick={() => setActiveTab('Portfolio')} />
          <NavItem icon={<ArrowLeftRight size={20} />} label="Trade" active={activeTab === 'Trade'} onClick={() => setActiveTab('Trade')} />
          <NavItem icon={<Wallet size={20} />} label="Wallets" active={activeTab === 'Wallets'} onClick={() => setActiveTab('Wallets')} />
          <NavItem icon={<Settings size={20} />} label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button className="flex items-center gap-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors w-full p-3 rounded-xl font-medium">
            <LogOut size={20} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 border-b border-slate-200 flex items-center justify-end px-8 bg-white z-10 sticky top-0 shadow-sm">
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative">
               <Bell size={20} />
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="flex flex-col items-end">
                 <span className="text-sm font-semibold text-slate-900">Hi, Alex</span>
                 <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Verified Account</span>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-8 z-10">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-8">{activeTab}</h2>
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }: { icon: ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all relative text-[15px]",
        active 
          ? "text-blue-700 font-semibold bg-blue-50 shadow-sm" 
          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
      )}
    >
      <div className={cn("relative z-10", active ? "text-blue-600" : "text-slate-400")}>
        {icon}
      </div>
      <span className="relative z-10">{label}</span>
    </button>
  );
}
