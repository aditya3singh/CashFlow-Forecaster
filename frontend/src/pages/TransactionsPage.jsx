/**
 * TransactionsPage — transaction list with date filtering and category pills.
 *
 * Groups by date, shows amount coloring and manual override badges.
 */

import { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import useTransactions from '../hooks/useTransactions';
import AddOverrideModal from '../components/Dashboard/AddOverrideModal';
import Button from '../components/Shared/Button';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
}

function formatDateHeading(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

const categoryColors = {
  Income: 'badge-success',
  Supplies: 'badge-neutral',
  Utilities: 'badge-neutral',
  Rent: 'badge-warning',
  Payroll: 'badge-warning',
  Insurance: 'badge-neutral',
  Other: 'badge-neutral',
};

export default function TransactionsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  const params = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const { transactions, total, loading, refresh } = useTransactions(params);

  // Group transactions by date
  const grouped = useMemo(() => {
    const groups = {};
    transactions.forEach((txn) => {
      const date = txn.date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(txn);
    });
    // Sort dates descending
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [transactions]);

  return (
    <div className="transactions-page">
      <div className="transactions-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">{total} transactions</p>
        </div>
        <div className="transactions-actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filter
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowOverrideModal(true)}
          >
            + Add Override
          </Button>
        </div>
      </div>

      {/* Date filters */}
      {showFilters && (
        <div className="transactions-filters card">
          <div className="filter-row">
            <div className="form-group">
              <label className="form-label" htmlFor="filter-start">From</label>
              <input
                id="filter-start"
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="filter-end">To</label>
              <input
                id="filter-end"
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Transaction list */}
      {loading ? (
        <div className="card">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: '56px', marginBottom: '0.5rem', borderRadius: '8px' }}
            />
          ))}
        </div>
      ) : (
        <div className="transactions-list">
          {grouped.map(([date, txns]) => (
            <div key={date} className="transaction-group">
              <h3 className="transaction-date-heading">{formatDateHeading(date)}</h3>
              <div className="card card-flat">
                {txns.map((txn) => (
                  <div key={txn.id} className="transaction-row">
                    <div className="transaction-icon-wrap">
                      {txn.amount >= 0 ? (
                        <ArrowUpRight size={18} className="txn-icon-in" />
                      ) : (
                        <ArrowDownRight size={18} className="txn-icon-out" />
                      )}
                    </div>
                    <div className="transaction-info">
                      <span className="transaction-name">
                        {txn.merchant_name || txn.description || 'Transaction'}
                      </span>
                      <div className="transaction-tags">
                        {txn.category && (
                          <span
                            className={`badge ${categoryColors[txn.category] || 'badge-neutral'}`}
                          >
                            {txn.category}
                          </span>
                        )}
                        {txn.is_manual_override && (
                          <span className="badge badge-manual">Manual</span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`transaction-amount ${
                        txn.amount >= 0 ? 'amount-positive' : 'amount-negative'
                      }`}
                    >
                      {txn.amount >= 0 ? '+' : '-'}
                      {formatCurrency(txn.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showOverrideModal && (
        <AddOverrideModal
          onClose={() => setShowOverrideModal(false)}
          onSuccess={refresh}
        />
      )}
    </div>
  );
}
