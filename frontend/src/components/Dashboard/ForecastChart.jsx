/**
 * ForecastChart — Recharts area chart with 4W / 6W / 12W range tabs.
 *
 * Matches Stitch "dashboard_updated" design:
 * - "6-Week Projection" header with time-range tab pills
 * - Mint green line → turns coral when projected balance goes negative
 * - Dashed $0 reference line
 * - Tooltip with date + balance
 */

import { useState } from 'react';
import { Landmark, ArrowRight, TrendingUp } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import Button from '../Shared/Button';

const RANGE_LABELS = { '4W': '4-Week', '6W': '6-Week', '12W': '12-Week' };
const RANGE_DAYS = { '4W': 28, '6W': 42, '12W': 84 };

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateShort(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date.toDateString() === today.toDateString()) return 'Today';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateFull(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  const isNegative = value < 0;
  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-date">{formatDateFull(label)}</span>
      <span
        className="chart-tooltip-value"
        style={{ color: isNegative ? 'var(--color-danger)' : 'var(--color-primary)' }}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}

export default function ForecastChart({ data, loading, onConnectBank }) {
  const [range, setRange] = useState('6W');

  if (loading) {
    return (
      <div className="card forecast-chart-card">
        <div className="forecast-chart-header">
          <div>
            <h3 className="card-title">6-Week Projection</h3>
            <p className="card-subtitle">Based on known income and upcoming bills.</p>
          </div>
          <div className="forecast-range-tabs skeleton" style={{ width: 160, height: 32, borderRadius: 8 }} />
        </div>
        <div className="skeleton skeleton-chart" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card forecast-chart-card">
        <div className="forecast-chart-header">
          <div>
            <h3 className="card-title">Cash Flow Forecast</h3>
            <p className="card-subtitle">AI-powered 6-week forward projection of your cash balance</p>
          </div>
        </div>
        <div className="chart-empty chart-empty-rich">
          <div className="chart-empty-icon-wrap">
            <TrendingUp size={36} className="chart-empty-icon" />
          </div>
          <h4 className="chart-empty-title">Ready to see your cash flow projection?</h4>
          <p className="chart-empty-text">
            Connect your bank account to automatically analyze income patterns, upcoming expenses, and predict potential shortfalls weeks in advance.
          </p>
          {onConnectBank && (
            <Button
              variant="primary"
              size="md"
              onClick={onConnectBank}
              className="chart-empty-btn"
            >
              <Landmark size={18} />
              Connect Bank Account
              <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Slice data to selected range
  const maxDays = RANGE_DAYS[range];
  const sliced = data.slice(0, maxDays);

  const minBalance = Math.min(...sliced.map((d) => d.projected_balance));
  const hasNegative = minBalance < 0;
  const yMin = hasNegative ? minBalance * 1.2 : 0;

  // Find the crossover point index (where balance first goes negative)
  const crossoverIdx = sliced.findIndex((d) => d.projected_balance < 0);

  return (
    <div className="card forecast-chart-card">
      <div className="forecast-chart-header">
        <div>
          <h3 className="card-title">{RANGE_LABELS[range]} Projection</h3>
          <p className="card-subtitle">Based on known income and upcoming bills.</p>
        </div>
        {/* Range tabs */}
        <div className="forecast-range-tabs">
          {['4W', '6W', '12W'].map((r) => (
            <button
              key={r}
              className={`forecast-range-tab ${range === r ? 'active' : ''}`}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="forecast-chart-container">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={sliced} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={hasNegative ? '#E8943A' : '#4ECDC4'} stopOpacity={0.25} />
                <stop offset="70%" stopColor={hasNegative ? '#E8943A' : '#4ECDC4'} stopOpacity={0.05} />
                <stop offset="100%" stopColor={hasNegative ? '#E8943A' : '#4ECDC4'} stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#F0EFED" vertical={false} />

            <XAxis
              dataKey="date"
              tickFormatter={formatDateShort}
              stroke="#9CA3AF"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />

            <YAxis
              tickFormatter={(v) => formatCurrency(v)}
              stroke="#9CA3AF"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[yMin, 'auto']}
              width={72}
            />

            <Tooltip content={<CustomTooltip />} />

            <ReferenceLine
              y={0}
              stroke="#E07A5F"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{
                value: '$0',
                position: 'right',
                fill: '#E07A5F',
                fontSize: 11,
              }}
            />

            <Area
              type="monotone"
              dataKey="projected_balance"
              stroke={hasNegative ? '#E07A5F' : '#036c50'}
              strokeWidth={2.5}
              fill="url(#balanceGradient)"
              animationDuration={800}
              animationEasing="ease-out"
              dot={hasNegative && crossoverIdx > -1 ? { r: 5, fill: '#E07A5F', strokeWidth: 0 } : false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
