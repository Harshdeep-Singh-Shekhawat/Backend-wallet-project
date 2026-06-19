'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import { apiFetcher } from '@/lib/api';

interface TrendChartProps {
  symbol: string;
}

export default function TrendChart({ symbol }: TrendChartProps) {
  const [range, setRange] = useState('1mo');
  
  const { data, error, isLoading } = useSWR(
    symbol ? `/api/prices/history?symbol=${encodeURIComponent(symbol)}&range=${range}` : null,
    apiFetcher,
  );
  
  const history = data?.history || [];

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    if (range === '1d' || range === '5d') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const dateStr = range === '1d' || range === '5d' 
        ? date.toLocaleString() 
        : date.toLocaleDateString();
        
      return (
        <div style={{
          backgroundColor: 'var(--color-bg-alt)',
          border: '1px solid var(--color-border)',
          padding: '8px 12px',
          borderRadius: '8px',
          color: 'var(--color-text-primary)'
        }}>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-text-muted)' }}>{dateStr}</p>
          <p style={{ margin: '4px 0 0', fontWeight: 'bold' }}>
            ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  const minPrice = history.length > 0 ? Math.min(...history.map((d: any) => d.price)) : 0;
  const maxPrice = history.length > 0 ? Math.max(...history.map((d: any) => d.price)) : 0;
  const domainPadding = (maxPrice - minPrice) * 0.1;

  // Determine if trend is up or down to color the chart
  const isUp = history.length >= 2 ? history[history.length - 1].price >= history[0].price : true;
  const strokeColor = isUp ? '#10b981' : '#ef4444'; // Emerald for up, Red for down
  const gradientId = `colorPrice-${symbol}-${range}`.replace(/[^a-zA-Z0-9_-]/g, '-');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '350px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {symbol} Trend
        </h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['1d', '5d', '1mo', '3mo', '1y'].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                background: range === r ? '#10b981' : 'transparent',
                color: range === r ? '#031712' : 'var(--color-text-secondary)',
                border: 'none',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: range === r ? 'bold' : 'normal',
                transition: 'all 0.2s'
              }}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {isLoading ? (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <Loader2 className="animate-spin" size={24} color="var(--color-text-muted)" />
          </div>
        ) : error || data?.error ? (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--color-text-muted)', fontSize: '14px', textAlign: 'center' }}>
            {data?.error || 'Trend data could not be loaded'}
          </div>
        ) : history.length === 0 ? (
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: 'var(--color-text-muted)', fontSize: '14px' }}>
            No trend data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis} 
                stroke="var(--color-border)" 
                tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis 
                domain={[Math.max(0, minPrice - domainPadding), maxPrice + domainPadding]} 
                hide 
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke={strokeColor} 
                strokeWidth={2}
                fillOpacity={1} 
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
