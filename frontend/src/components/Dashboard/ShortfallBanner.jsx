/**
 * ShortfallBanner — calm amber warning when a shortfall is projected.
 *
 * "Heads up — you're projected to be short by $420 on Sep 3"
 */

import { AlertTriangle } from 'lucide-react';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ShortfallBanner({ shortfall }) {
  if (!shortfall) return null;

  return (
    <div className="banner banner-warning shortfall-banner">
      <AlertTriangle size={20} />
      <div className="shortfall-content">
        <span className="shortfall-text">
          <strong>Heads up</strong> — you're projected to be short by{' '}
          <strong>{formatCurrency(shortfall.projected_balance)}</strong> on{' '}
          <strong>{formatDate(shortfall.date)}</strong>
        </span>
      </div>
    </div>
  );
}
