/**
 * UpcomingTransactions — card showing upcoming known transactions.
 *
 * Lists manual overrides and recent items. Matches Stitch dashboard design:
 * - Each item shows merchant name + category/source label
 * - Positive amounts in green
 * - "Manual" badge on overrides
 * - "Add expected income or expense" footer link
 */

import { Plus, Calendar } from 'lucide-react';
import Button from '../Shared/Button';

function formatCurrency(amount) {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
  return amount >= 0 ? `+${formatted}` : `-${formatted}`;
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Category→icon mapping (emoji fallback)
const CATEGORY_ICONS = {
  Income: '↙',
  Payroll: '👤',
  Rent: '🏢',
  Other: '📋',
  Supplies: '📦',
  Utilities: '⚡',
  Default: '📄',
};

function TxnIcon({ category, amount }) {
  const emoji = CATEGORY_ICONS[category] || (amount > 0 ? '↙' : '📄');
  return (
    <div className={`upcoming-item-icon ${amount > 0 ? 'upcoming-icon-income' : 'upcoming-icon-expense'}`}>
      <span style={{ fontSize: '0.9rem' }}>{emoji}</span>
    </div>
  );
}

export default function UpcomingTransactions({ transactions = [], onAddOverride, loading }) {
  if (loading) {
    return (
      <div className="card upcoming-card">
        <h3 className="card-title">Upcoming known</h3>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton" style={{ height: '52px', marginBottom: '0.5rem', borderRadius: '8px' }} />
        ))}
      </div>
    );
  }

  return (
    <div className="card upcoming-card">
      <div className="upcoming-header">
        <h3 className="card-title">Upcoming known</h3>
        <Button variant="ghost" size="sm" onClick={onAddOverride}>
          <Plus size={16} />
          Add
        </Button>
      </div>

      {transactions.length === 0 ? (
        <div className="upcoming-empty">
          <Calendar size={24} className="upcoming-empty-icon" />
          <p>No upcoming transactions</p>
          <button className="upcoming-add-link" onClick={onAddOverride}>
            Add expected income or expense
          </button>
        </div>
      ) : (
        <>
          <ul className="upcoming-list">
            {transactions.slice(0, 5).map((txn) => (
              <li key={txn.id} className="upcoming-item">
                <TxnIcon category={txn.category} amount={txn.amount} />
                <div className="upcoming-item-info">
                  <span className="upcoming-item-name">
                    {txn.description || txn.merchant_name || 'Transaction'}
                  </span>
                  <span className="upcoming-item-category">
                    {formatDate(txn.date)}
                    {txn.is_manual_override && <span className="badge badge-manual" style={{ marginLeft: '0.4rem' }}>MANUAL</span>}
                  </span>
                </div>
                <div className="upcoming-item-right">
                  <span
                    className={`upcoming-item-amount ${
                      txn.amount >= 0 ? 'amount-positive' : 'amount-negative'
                    }`}
                  >
                    {formatCurrency(txn.amount)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <button className="upcoming-add-link" onClick={onAddOverride}>
            <Plus size={14} />
            Add expected income or expense
          </button>
        </>
      )}
    </div>
  );
}
