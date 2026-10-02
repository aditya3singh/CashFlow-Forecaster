/**
 * InsightsPage — Spending Insights.
 *
 * Derives all data from real transactions. Empty state when no data exists.
 * Sections:
 * 1. Top Merchant card + Category Breakdown donut chart
 * 2. Budget Performance bars
 * 3. Financial Health Tips (static — always shown as helpful guidance)
 */

import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, ChevronRight, Shield, Leaf, Wallet, BarChart3 } from 'lucide-react';
import useTransactions from '../hooks/useTransactions';

const TIPS = [
  {
    icon: Shield,
    title: 'Build Cash Reserves',
    desc: 'Aim for 3–6 months of operating expenses to shield against market fluctuations.',
    bg: '#f3f4f6',
    color: '#1B4D4E',
  },
  {
    icon: Leaf,
    title: 'Optimize Subscriptions',
    desc: 'Review recurring SaaS expenses quarterly to cut unused services and foster growth.',
    bg: '#EEFBFA',
    color: '#036c50',
  },
  {
    icon: Wallet,
    title: 'Diversify Revenue',
    desc: 'Relying on a single major client? Consider exploring secondary income streams.',
    bg: '#f3f4f6',
    color: '#1B4D4E',
  },
];

const CATEGORY_COLORS = {
  Payroll: '#001820',
  Supplies: '#03506b',
  Utilities: '#9ca3af',
  Rent: '#2A6F6F',
  Income: '#036c50',
  Insurance: '#9ef4d0',
  Other: '#e5e7eb',
};

/* ── Donut Chart ── */
function DonutChart({ categories, total, activeIdx, onHover }) {
  const cx = 100, cy = 100, r = 72, stroke = 26;

  let cumulativeAngle = -90;
  const segments = categories.map((cat) => {
    const angle = (cat.pct / 100) * 360;
    const startAngle = cumulativeAngle;
    cumulativeAngle += angle;
    return { ...cat, startAngle, sweepAngle: angle };
  });

  const polarToXY = (angle, rad) => ({
    x: cx + rad * Math.cos((angle * Math.PI) / 180),
    y: cy + rad * Math.sin((angle * Math.PI) / 180),
  });

  const describeArc = (startAngle, sweepAngle, radius) => {
    const start = polarToXY(startAngle, radius);
    const end = polarToXY(startAngle + sweepAngle, radius);
    const largeArcFlag = sweepAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  const fmtUSD = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="donut-container">
      <svg viewBox="0 0 200 200" className="donut-svg" aria-label="Spending by category">
        {segments.map((seg, i) => (
          <path
            key={seg.label}
            d={describeArc(seg.startAngle, Math.max(seg.sweepAngle - 1.5, 0.5), r)}
            fill="none"
            stroke={seg.color}
            strokeWidth={activeIdx === i ? stroke + 4 : stroke}
            strokeLinecap="round"
            style={{ cursor: 'pointer', transition: 'stroke-width 0.2s ease' }}
            onMouseEnter={() => onHover(i)}
            onMouseLeave={() => onHover(null)}
          />
        ))}
      </svg>
      <div className="donut-center">
        {activeIdx !== null && activeIdx !== undefined ? (
          <>
            <span className="donut-center-label">{categories[activeIdx].label}</span>
            <span className="donut-center-amount">{fmtUSD(categories[activeIdx].amount)}</span>
            <span className="donut-center-pct">{categories[activeIdx].pct}%</span>
          </>
        ) : (
          <>
            <span className="donut-center-label">Total Outflow</span>
            <span className="donut-center-amount">{fmtUSD(total)}</span>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Page ── */
export default function InsightsPage() {
  const { transactions, loading } = useTransactions();
  const [activeDonut, setActiveDonut] = useState(null);

  // Derive insights from real transaction data
  const { categories, totalOutflow, topMerchant } = useMemo(() => {
    const expenses = transactions.filter(t => t.amount < 0);
    if (expenses.length === 0) {
      return { categories: [], totalOutflow: 0, topMerchant: null };
    }

    // Group by category
    const catMap = {};
    const merchantMap = {};
    let total = 0;

    expenses.forEach(t => {
      const cat = t.category || 'Other';
      const merchant = t.merchant_name || t.description || 'Unknown';
      const absAmt = Math.abs(t.amount);
      total += absAmt;
      catMap[cat] = (catMap[cat] || 0) + absAmt;
      merchantMap[merchant] = (merchantMap[merchant] || 0) + absAmt;
    });

    const catList = Object.entries(catMap)
      .map(([label, amount]) => ({
        label,
        amount,
        pct: Math.round((amount / total) * 100),
        color: CATEGORY_COLORS[label] || '#9ca3af',
      }))
      .sort((a, b) => b.amount - a.amount);

    // Top merchant
    const topEntry = Object.entries(merchantMap).sort((a, b) => b[1] - a[1])[0];

    return {
      categories: catList,
      totalOutflow: total,
      topMerchant: topEntry ? { name: topEntry[0], totalSpent: topEntry[1] } : null,
    };
  }, [transactions]);

  const fmtUSD = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const hasData = categories.length > 0;

  return (
    <div className="insights-page2">
      <div className="insights-page2-header">
        <h1 className="page-title">Spending Insights</h1>
        <p className="page-subtitle">
          A detailed analysis of your cash outflow — identify trends and optimise your operational budget.
        </p>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
        </div>
      ) : !hasData ? (
        <div className="empty-state card">
          <BarChart3 size={48} className="empty-state-icon" />
          <h2 className="empty-state-title">No spending data yet</h2>
          <p className="empty-state-desc">
            Once you connect your bank or add transactions, your spending insights will appear here automatically.
          </p>
        </div>
      ) : (
        <>
          {/* Row 1: Top Merchant + Category Breakdown */}
          <div className="insights-top-row">
            {/* Top Merchant */}
            {topMerchant && (
              <div className="card insights-merchant-card">
                <span className="insights-section-label">TOP MERCHANT</span>
                <div className="insights-merchant-row">
                  <div className="insights-merchant-avatar">
                    {topMerchant.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="insights-merchant-name">{topMerchant.name}</p>
                  </div>
                </div>
                <hr className="divider" />
                <span className="insights-merchant-spent-label">Total Spent This Month</span>
                <p className="insights-merchant-spent">{fmtUSD(topMerchant.totalSpent)}</p>
              </div>
            )}

            {/* Category Breakdown */}
            <div className="card insights-donut-card">
              <div className="insights-donut-header">
                <h2 className="insights-card-title">Category Breakdown</h2>
              </div>
              <div className="insights-donut-body">
                <DonutChart
                  categories={categories}
                  total={totalOutflow}
                  activeIdx={activeDonut}
                  onHover={setActiveDonut}
                />
                <div className="insights-donut-legend">
                  {categories.map((cat, i) => (
                    <div
                      key={cat.label}
                      className={`donut-legend-item ${activeDonut === i ? 'donut-legend-active' : ''}`}
                      onMouseEnter={() => setActiveDonut(i)}
                      onMouseLeave={() => setActiveDonut(null)}
                    >
                      <span className="donut-legend-dot" style={{ background: cat.color }} />
                      <span className="donut-legend-name">{cat.label}</span>
                      <div className="donut-legend-right">
                        <span className="donut-legend-amount">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cat.amount)}
                        </span>
                        <span className="donut-legend-pct">{cat.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Financial Health Tips — always shown */}
      <div>
        <h2 className="insights-card-title" style={{ marginBottom: '1rem' }}>Financial Health Tips</h2>
        <div className="insights-tips-grid">
          {TIPS.map((tip) => (
            <div key={tip.title} className="card insights-tip-card">
              <div className="insights-tip-icon" style={{ background: tip.bg, color: tip.color }}>
                <tip.icon size={20} />
              </div>
              <h3 className="insights-tip-title">{tip.title}</h3>
              <p className="insights-tip-desc">{tip.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
