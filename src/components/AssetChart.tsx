'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import styles from './AssetChart.module.css';

interface AssetData {
  name: string;
  value: number;
}

interface AssetChartProps {
  data: AssetData[];
}

// Monochrome/Grayscale palette for the minimalist black & white theme
const COLORS = ['#ffffff', '#cccccc', '#999999', '#666666', '#333333', '#1a1a1a'];

export default function AssetChart({ data }: AssetChartProps) {
  // Filter out zero values so they don't clutter the chart
  const activeData = data.filter(item => item.value > 0);

  if (activeData.length === 0) {
    return (
      <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
        No asset data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p style={{ fontWeight: 800, margin: 0 }}>{payload[0].name}</p>
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
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={activeData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            stroke="var(--color-border)"
            strokeWidth={1}
          >
            {activeData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
