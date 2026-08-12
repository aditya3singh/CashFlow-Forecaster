/**
 * SpendingTrendChart — SVG area chart showing 30-day spending trend.
 *
 * Renders a smooth bezier curve with gradient fill,
 * grid lines, and X-axis date labels.
 */

const DEMO_DATA = [
  { label: 'Aug 1', value: 480 },
  { label: 'Aug 4', value: 520 },
  { label: 'Aug 7', value: 390 },
  { label: 'Aug 10', value: 610 },
  { label: 'Aug 13', value: 450 },
  { label: 'Aug 16', value: 380 },
  { label: 'Aug 19', value: 520 },
  { label: 'Aug 22', value: 290 },
  { label: 'Aug 25', value: 410 },
  { label: 'Aug 28', value: 350 },
  { label: 'Aug 31', value: 320 },
];

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

export default function SpendingTrendChart() {
  const width = 1000;
  const height = 280;
  const padding = 20;

  const totalSpend = DEMO_DATA.reduce((sum, d) => sum + d.value, 0);
  const { linePath, areaPath } = buildPath(DEMO_DATA, width, height, padding);

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
            <span className="badge badge-success">
              ↓ 8.2%
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
          {DEMO_DATA.filter((_, i) => i % 2 === 0).map((d) => (
            <span key={d.label}>{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
