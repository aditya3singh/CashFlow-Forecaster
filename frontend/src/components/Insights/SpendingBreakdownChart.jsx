/**
 * SpendingBreakdownChart — SVG donut chart with category breakdown.
 *
 * Interactive segments expand on hover.
 * Shows category legend with color indicators and percentages.
 */

import { useState } from 'react';

const CATEGORIES = [
  { name: 'Rent & Housing', amount: 2800, color: '#1B4D4E' },
  { name: 'Payroll', amount: 4200, color: '#4ECDC4' },
  { name: 'Supplies', amount: 1650, color: '#E8943A' },
  { name: 'Utilities', amount: 890, color: '#E07A5F' },
  { name: 'Marketing', amount: 1250, color: '#6B7280' },
  { name: 'Other', amount: 660, color: '#9CA3AF' },
];

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

export default function SpendingBreakdownChart() {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const total = CATEGORIES.reduce((sum, c) => sum + c.amount, 0);

  const cx = 120;
  const cy = 120;
  const radius = 90;
  const strokeWidth = 28;

  let currentAngle = 0;
  const segments = CATEGORIES.map((cat) => {
    const angle = (cat.amount / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle - 0.8; // small gap between segments
    currentAngle += angle;
    return { ...cat, startAngle, endAngle };
  });

  return (
    <div className="spending-breakdown card">
      <h3 className="section-title">Spending Breakdown</h3>
      <p className="section-subtitle">Where your money goes this month</p>

      <div className="spending-breakdown-content">
        {/* Donut chart */}
        <div className="spending-breakdown-chart">
          <svg viewBox="0 0 240 240" className="donut-svg">
            {segments.map((seg, i) => (
              <path
                key={seg.name}
                d={describeArc(cx, cy, radius, seg.startAngle, seg.endAngle)}
                fill="none"
                stroke={seg.color}
                strokeWidth={hoveredIdx === i ? strokeWidth + 6 : strokeWidth}
                strokeLinecap="round"
                className="donut-segment"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            ))}
          </svg>
          <div className="donut-center">
            <span className="donut-center-amount">
              ${(total / 1000).toFixed(1)}k
            </span>
            <span className="donut-center-label">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="spending-breakdown-legend">
          {CATEGORIES.map((cat, i) => {
            const pct = ((cat.amount / total) * 100).toFixed(1);
            return (
              <div
                key={cat.name}
                className={`legend-item ${hoveredIdx === i ? 'legend-item-active' : ''}`}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <span className="legend-dot" style={{ background: cat.color }} />
                <span className="legend-name">{cat.name}</span>
                <span className="legend-pct">{pct}%</span>
                <span className="legend-amount">
                  ${cat.amount.toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
