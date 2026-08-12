/**
 * ForecastChart — Recharts area chart for projected balances.
 *
 * Gradient fill: mint when healthy, amber when dipping near zero.
 * Dashed $0 reference line. Tooltip with date + balance.
 */

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

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const value = payload[0].value;
  const isNegative = value < 0;

  return (
    <div className="chart-tooltip">
      <span className="chart-tooltip-date">{formatDate(label)}</span>
      <span
        className="chart-tooltip-value"
        style={{ color: isNegative ? 'var(--color-danger)' : 'var(--color-primary)' }}
      >
        {formatCurrency(value)}
      </span>
    </div>
  );
}

export default function ForecastChart({ data, loading }) {
  if (loading) {
    return (
      <div className="card forecast-chart-card">
        <h3 className="card-title">Cash Flow Forecast</h3>
        <div className="skeleton skeleton-chart" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card forecast-chart-card">
        <h3 className="card-title">Cash Flow Forecast</h3>
        <div className="chart-empty">
          <p>Connect your bank to see your forecast</p>
        </div>
      </div>
    );
  }

  const minBalance = Math.min(...data.map((d) => d.projected_balance));
  const hasNegative = minBalance < 0;
  const yMin = hasNegative ? minBalance * 1.2 : 0;

  return (
    <div className="card forecast-chart-card">
      <h3 className="card-title">Cash Flow Forecast</h3>
      <p className="card-subtitle">Projected balance over the next 6 weeks</p>

      <div className="forecast-chart-container">
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ECDC4" stopOpacity={0.3} />
                <stop offset="70%" stopColor="#4ECDC4" stopOpacity={0.05} />
                <stop offset="100%" stopColor={hasNegative ? '#E8943A' : '#4ECDC4'} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#F0EFED" vertical={false} />

            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />

            <YAxis
              tickFormatter={(v) => formatCurrency(v)}
              stroke="#9CA3AF"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[yMin, 'auto']}
              width={75}
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
                fontSize: 12,
              }}
            />

            <Area
              type="monotone"
              dataKey="projected_balance"
              stroke="#2A6F6F"
              strokeWidth={2.5}
              fill="url(#balanceGradient)"
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
