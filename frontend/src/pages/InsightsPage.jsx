/**
 * InsightsPage — spending insights with trend chart, donut breakdown, and tips.
 *
 * Sections:
 * 1. Insight of the Week — highlighted recommendation
 * 2. 30-Day Spending Trend — SVG area chart
 * 3. Spending Breakdown — SVG donut chart
 * 4. Financial Health Tips — 3-column bento grid
 */

import { Shield, Leaf, Wallet, Lightbulb } from 'lucide-react';
import SpendingTrendChart from '../components/Insights/SpendingTrendChart';
import SpendingBreakdownChart from '../components/Insights/SpendingBreakdownChart';
import InsightCard from '../components/Insights/InsightCard';

const TIPS = [
  {
    icon: <Shield size={22} />,
    title: 'Build Cash Reserves',
    description:
      'Aim for 3–6 months of operating expenses to shield against market fluctuations.',
    variant: 'default',
  },
  {
    icon: <Leaf size={22} />,
    title: 'Optimize Subscriptions',
    description:
      'Review recurring SaaS expenses quarterly to cut unused services and foster growth.',
    variant: 'success',
  },
  {
    icon: <Wallet size={22} />,
    title: 'Diversify Revenue',
    description:
      'Relying on a single major client? Consider exploring secondary income streams.',
    variant: 'default',
  },
];

export default function InsightsPage() {
  return (
    <div className="insights-page">
      <div className="insights-header">
        <h1 className="page-title">Insights</h1>
        <p className="page-subtitle">
          Understand your spending patterns and optimize your cash flow.
        </p>
      </div>

      {/* Section 1: Insight of the Week */}
      <section className="insight-of-week card">
        <div className="insight-of-week-blob" />
        <div className="insight-of-week-content">
          <div className="insight-of-week-icon">
            <Lightbulb size={28} />
          </div>
          <div>
            <span className="insight-of-week-label">Insight of the Week</span>
            <p className="insight-of-week-text">
              Your marketing spend is 15% lower than last month. Consider
              reinvesting these funds into your Q4 customer acquisition strategy.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: 30-Day Spending Trend */}
      <section>
        <h3 className="section-title">30-Day Spending Trend</h3>
        <SpendingTrendChart />
      </section>

      {/* Section 3: Spending Breakdown */}
      <section>
        <SpendingBreakdownChart />
      </section>

      {/* Section 4: Financial Health Tips */}
      <section>
        <h3 className="section-title">Financial Health Tips</h3>
        <div className="health-tips-grid">
          {TIPS.map((tip) => (
            <InsightCard
              key={tip.title}
              icon={tip.icon}
              title={tip.title}
              description={tip.description}
              variant={tip.variant}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
