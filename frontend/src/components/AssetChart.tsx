'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';
import styles from './AssetChart.module.css';

interface AssetData {
  name: string;
  value: number;
}

interface AssetChartProps {
  data: AssetData[];
}

export default function AssetChart({ data }: AssetChartProps) {
  const activeData = data.filter(item => item.value > 0);
  const totalValue = activeData.reduce((acc, curr) => acc + curr.value, 0);
  const totalAssetsCount = activeData.length;

  if (activeData.length === 0) {
    return (
      <div className={styles.container} style={{ alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
        No asset data available
      </div>
    );
  }

  // Colorful palette mapping
  const getColor = (name: string, index: number) => {
    const nameUpper = name.toUpperCase();
    if (nameUpper === 'AVAILABLE CASH' || nameUpper === 'CASH') return '#a855f7'; // vibrant purple
    if (nameUpper === 'BTC') return '#f59e0b'; // amber/orange
    if (nameUpper === 'ETH') return '#3b82f6'; // vibrant blue
    if (nameUpper === 'SOL') return '#10b981'; // emerald green
    if (nameUpper === 'AAPL') return '#ec4899'; // pink
    if (nameUpper === 'TSLA') return '#ef4444'; // red
    if (nameUpper === 'MSFT') return '#06b6d4'; // cyan
    if (nameUpper === 'NVDA') return '#84cc16'; // lime
    
    // Fallback colorful palette
    const fallbacks = ['#6366f1', '#f43f5e', '#14b8a6', '#f97316', '#d946ef'];
    return fallbacks[index % fallbacks.length];
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p style={{ fontWeight: 800, margin: 0 }}>{payload[0].name === 'Available Cash' ? 'CASH' : payload[0].name}</p>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
            ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>Allocation</div>
        <div className={styles.iconBtn}>
          <TrendingUp size={14} />
        </div>
      </div>

      <div className={styles.chartArea}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={activeData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              stroke="var(--color-bg)" /* Dark lines between slices */
              strokeWidth={3}
            >
              {activeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.name, index)} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Absolute Centered Text */}
        <div style={{ position: 'absolute', pointerEvents: 'none', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Assets</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)' }}>{totalAssetsCount}</div>
        </div>
      </div>

      {/* Custom Legend to match screenshot exactly */}
      <div className={styles.legendArea}>
        {activeData.map((entry, index) => {
          const percentage = totalValue > 0 ? (entry.value / totalValue) * 100 : 0;
          const displayName = entry.name === 'Available Cash' ? 'CASH' : entry.name;
          return (
            <div key={index} className={styles.legendItem}>
              <div className={styles.legendTop}>
                <div className={styles.legendDot} style={{ backgroundColor: getColor(entry.name, index) }}></div>
                <div className={styles.legendName}>{displayName}</div>
              </div>
              <div className={styles.legendValue}>{percentage.toFixed(1)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
