/**
 * SpendingBreakdownChart — SVG donut chart with category breakdown.
 *
 * Interactive segments expand on hover.
 * Shows category legend with color indicators and percentages.
 * Derives all data from real transactions passed as props.
 */

import { useState, useMemo } from 'react';
import { PieChart } from 'lucide-react';

const CATEGORY_COLORS = {
  'Rent & Housing': '#1B4D4E',
  Rent: '#1B4D4E',
  Housing: '#1B4D4E',
  Payroll: '#4ECDC4',
  Supplies: '#E8943A',
  Utilities: '#E07A5F',
  Marketing: '#6B7280',
  Income: '#036c50',
  Insurance: '#9ef4d0',
  'Software & SaaS': '#3B82F6',
  Software: '#3B82F6',
  Travel: '#8B5CF6',
  Dining: '#F59E0B',
  Shopping: '#EC4899',
  Other: '#9CA3AF',
};

function getColor(name) {
  return CATEGORY_COLORS[name] || '#9CA3AF';
}

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

export default function SpendingBreakdownChart({ transactions = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const categories = useMemo(() => {
    const expenses = transactions.filter((t) => t.amount < 0);
    if (expenses.length === 0) return [];

    const catMap = {};
    expenses.forEach((t) => {
      const cat = t.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + Math.abs(t.amount);
    });

    return Object.entries(catMap)
      .map(([name, amount]) => ({ name, amount, color: getColor(name) }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const total = categories.reduce((sum, c) => sum + c.amount, 0);

  // Empty state
  if (categories.length === 0) {
    return (
      <div className="spending-breakdown card">
        <h3 className="section-title">Spending Breakdown</h3>
        <p className="section-subtitle">Where your money goes this month</p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem 1rem', color: 'var(--color-text-muted)' }}>
          <PieChart size={36} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
          <p style={{ margin: 0 }}>Your spending breakdown will appear here once you have transactions.</p>
        </div>
      </div>
    );
  }

  const cx = 120;
  const cy = 120;
  const radius = 90;
  const strokeWidth = 28;

  let currentAngle = 0;
  const segments = categories.map((cat) => {
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
          {categories.map((cat, i) => {
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
