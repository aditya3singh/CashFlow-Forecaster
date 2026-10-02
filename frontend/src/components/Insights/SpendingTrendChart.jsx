/**
 * SpendingTrendChart — SVG area chart showing 30-day spending trend.
 *
 * Renders a smooth bezier curve with gradient fill,
 * grid lines, and X-axis date labels.
 * Derives data from real transactions passed as props.
 */

import { useMemo } from 'react';
import { TrendingDown } from 'lucide-react';

function buildPath(data, width, height, padding) {
  const maxVal = Math.max(...data.map((d) => d.value));
  const minVal = Math.min(...data.map((d) => d.value)) * 0.8;
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => ({
    x: padding + (i / (data.length - 1)) * (width - padding * 2),
    y: padding + (1 - (d.value - minVal) / range) * (height - padding * 2),
  }));

  // Build smooth bezier curve
  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    path += ` C${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
  }

  // Closed area path
  const lastPt = points[points.length - 1];
  const firstPt = points[0];
  const areaPath = `${path} L${lastPt.x},${height - padding} L${firstPt.x},${height - padding} Z`;

  return { linePath: path, areaPath, points };
}

/**
 * Aggregates transactions into daily spending buckets for the last 30 days.
 */
function aggregateSpending(transactions) {
  if (!transactions || transactions.length === 0) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Create daily buckets
  const dailyMap = {};
  for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split('T')[0];
    dailyMap[key] = 0;
  }

  // Sum expenses per day
  transactions.forEach((t) => {
    if (t.amount < 0 && t.date && dailyMap.hasOwnProperty(t.date)) {
      dailyMap[t.date] += Math.abs(t.amount);
    }
  });

  // Convert to array, sample every ~3 days for readability
  const entries = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b));
  const step = Math.max(1, Math.floor(entries.length / 10));
  const sampled = entries.filter((_, i) => i % step === 0 || i === entries.length - 1);

  return sampled.map(([date, value]) => ({
    label: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value,
  }));
}

export default function SpendingTrendChart({ transactions = [] }) {
  const width = 1000;
  const height = 280;
  const padding = 20;

  const chartData = useMemo(() => aggregateSpending(transactions), [transactions]);

  // Empty state
  if (chartData.length < 2) {
    return (
      <div className="spending-trend card">
        <div className="spending-trend-header">
          <div>
            <p className="spending-trend-label">Total Spend (30 days)</p>
            <div className="spending-trend-value-row">
              <span className="spending-trend-value" style={{ color: 'var(--color-text-muted)' }}>—</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem', color: 'var(--color-text-muted)' }}>
          <TrendingDown size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
          <p style={{ margin: 0 }}>Spending trends will appear once you have transaction data.</p>
        </div>
      </div>
    );
  }

  const totalSpend = chartData.reduce((sum, d) => sum + d.value, 0);
  const { linePath, areaPath } = buildPath(chartData, width, height, padding);

  // Grid line Y positions
  const gridYs = [0.25, 0.5, 0.75].map(
    (pct) => padding + pct * (height - padding * 2)
  );

  return (
    <div className="spending-trend card">
      <div className="spending-trend-header">
        <div>
          <p className="spending-trend-label">Total Spend (30 days)</p>
          <div className="spending-trend-value-row">
            <span className="spending-trend-value">
              ${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        <div className="spending-trend-legend">
          <span className="spending-trend-legend-dot" />
          <span className="spending-trend-legend-text">Daily spend</span>
        </div>
      </div>

      <div className="spending-trend-chart">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="spending-trend-svg">
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridYs.map((y, i) => (
            <line
              key={i}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="var(--color-border-light)"
              strokeWidth="1"
              strokeDasharray="6,4"
            />
          ))}

          {/* Area fill */}
          <path d={areaPath} fill="url(#trendGradient)" />

          {/* Trend line */}
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* X-axis labels */}
        <div className="spending-trend-labels">
          {chartData.filter((_, i) => i % 2 === 0).map((d) => (
            <span key={d.label}>{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
