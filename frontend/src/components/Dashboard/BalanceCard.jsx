/**
 * BalanceCard — hero display for current bank balance.
 *
 * Large, bold balance number with bank name and last sync time.
 */

import { RefreshCw } from 'lucide-react';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatRelativeTime(dateStr) {
  if (!dateStr) return 'Never';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export default function BalanceCard({ balance, bankName, lastSynced, loading }) {
  if (loading) {
    return (
      <div className="card balance-card">
        <div className="skeleton skeleton-text" style={{ width: '40%', marginBottom: '0.5rem' }} />
        <div className="skeleton" style={{ height: '3rem', width: '60%', marginBottom: '0.75rem' }} />
        <div className="skeleton skeleton-text" style={{ width: '50%' }} />
      </div>
    );
  }

  return (
    <div className="card balance-card">
      <span className="balance-label">Current balance</span>
      <h2 className="balance-amount">{formatCurrency(balance ?? 0)}</h2>
      <div className="balance-meta">
        {bankName && <span className="balance-bank">{bankName}</span>}
        {lastSynced && (
          <span className="balance-synced">
            <RefreshCw size={12} />
            Synced {formatRelativeTime(lastSynced)}
          </span>
        )}
      </div>
    </div>
  );
}
