/**
 * TransactionsPage — Stitch-aligned transaction list.
 *
 * Features:
 * - Live search bar (filter by merchant/description)
 * - Date group headers with daily totals (Stitch style)
 * - Category icons + MANUAL badge
 * - Transaction detail slide-in drawer on click
 * - "+ Add transaction" button
 * - Date range filter panel
 */

import { useState, useMemo } from 'react';
import {
  Search, Filter, X, Copy, ExternalLink, ShoppingBag,
  Coffee, Zap, Home, Briefcase, TrendingUp, DollarSign,
  Monitor, Car, ChevronRight, Plus,
} from 'lucide-react';
import useTransactions from '../hooks/useTransactions';
import AddOverrideModal from '../components/Dashboard/AddOverrideModal';
import Button from '../components/Shared/Button';

/* ─── Helpers ─── */

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
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString())
    return `Today, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}`;
  if (date.toDateString() === yesterday.toDateString())
    return `Yesterday, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}`;
  if (date >= tomorrow)
    return `Expected (Upcoming)`;

  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();
}

function formatDetailDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// Category → icon mapping
function CategoryIcon({ category, size = 18 }) {
  const props = { size, strokeWidth: 1.8 };
  const map = {
    Income: <TrendingUp {...props} />,
    Dining: <Coffee {...props} />,
    Utilities: <Zap {...props} />,
    Rent: <Home {...props} />,
    Housing: <Home {...props} />,
    Payroll: <Briefcase {...props} />,
    Software: <Monitor {...props} />,
    'Software & SaaS': <Monitor {...props} />,
    Marketing: <ExternalLink {...props} />,
    Travel: <Car {...props} />,
    Shopping: <ShoppingBag {...props} />,
  };
  return map[category] || <DollarSign {...props} />;
}

/* ─── Transaction Detail Drawer ─── */

function TransactionDrawer({ txn, onClose }) {
  const [copied, setCopied] = useState(false);
  const txnId = `TXN_${txn.id?.toString().toUpperCase().slice(0, 8) || '00000000'}`;

  const copyId = () => {
    navigator.clipboard.writeText(txnId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-top">
          <button className="drawer-close" onClick={onClose}><X size={20} /></button>
          <button className="drawer-share"><ExternalLink size={18} /></button>
        </div>

        <div className="drawer-hero">
          <div className="drawer-merchant-icon">
            <CategoryIcon category={txn.category} size={28} />
          </div>
          <h2 className="drawer-merchant-name">
            {txn.merchant_name || txn.description || 'Transaction'}
          </h2>
          <p className={`drawer-amount ${txn.amount >= 0 ? 'amount-positive' : 'drawer-amount-neg'}`}>
            {txn.amount >= 0 ? '+' : '-'}{formatCurrency(txn.amount)}
          </p>
          <span className={`badge ${txn.amount >= 0 ? 'badge-success' : 'badge-neutral'}`}>
            {txn.is_manual_override ? '● Pending' : '● Completed'}
          </span>
        </div>

        <div className="drawer-details">
          <div className="drawer-detail-row">
            <span className="drawer-detail-label">DATE</span>
            <span className="drawer-detail-value">{formatDetailDate(txn.date)}</span>
          </div>
          <hr className="divider" style={{ margin: '0' }} />

          {txn.category && (
            <>
              <div className="drawer-detail-row">
                <span className="drawer-detail-label">CATEGORY</span>
                <span className="drawer-detail-value drawer-category">
                  <CategoryIcon category={txn.category} size={15} />
                  {txn.category}
                </span>
              </div>
              <hr className="divider" style={{ margin: '0' }} />
            </>
          )}

          <div className="drawer-detail-row">
            <span className="drawer-detail-label">PAYMENT METHOD</span>
            <span className="drawer-detail-value drawer-bank">
              <span className="drawer-bank-icon">🏦</span>
              Bank Account
            </span>
          </div>
          <hr className="divider" style={{ margin: '0' }} />

          <div className="drawer-detail-row">
            <span className="drawer-detail-label">TRANSACTION ID</span>
            <span className="drawer-detail-value drawer-id-row">
              <span className="drawer-id">{txnId}</span>
              <button className="drawer-copy-btn" onClick={copyId}>
                {copied ? '✓' : <Copy size={14} />}
              </button>
            </span>
          </div>
          {txn.is_manual_override && (
            <>
              <hr className="divider" style={{ margin: '0' }} />
              <div className="drawer-detail-row">
                <span className="drawer-detail-label">TYPE</span>
                <span className="badge badge-manual">MANUAL OVERRIDE</span>
              </div>
            </>
          )}
        </div>

        <button className="drawer-report">
          <ExternalLink size={15} /> Report Issue
        </button>
      </div>
    </>
  );
}

/* ─── Main Page ─── */

export default function TransactionsPage() {
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);

  const params = {};
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;

  const { transactions, loading, refresh } = useTransactions(params);

  // Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) return transactions;
    const q = search.toLowerCase();
    return transactions.filter(
      (t) =>
        (t.merchant_name || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
    );
  }, [transactions, search]);

  // Group by date
  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((txn) => {
      const date = txn.date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(txn);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const handleAddSuccess = () => {
    refresh();
  };

  return (
    <div className="transactions-page">
      {/* Header */}
      <div className="transactions-header">
        <div>
          <h1 className="page-title">Transactions</h1>
          <p className="page-subtitle">Review and manage your cash flow history.</p>
        </div>
        <div className="transactions-search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="txn-search"
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>
              <X size={14} />
            </button>
          )}
        </div>
        <button
          className={`txn-filter-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          title="Filter by date"
        >
          <Filter size={16} />
        </button>
      </div>

      {/* Date filters */}
      {showFilters && (
        <div className="transactions-filters card">
          <div className="filter-row">
            <div className="form-group">
              <label className="form-label" htmlFor="filter-start">From</label>
              <input id="filter-start" type="date" className="form-input"
                value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="filter-end">To</label>
              <input id="filter-end" type="date" className="form-input"
                value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setStartDate(''); setEndDate(''); }}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Transaction list */}
      {loading ? (
        <div className="card">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton"
              style={{ height: '60px', marginBottom: '0.5rem', borderRadius: '8px' }} />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="empty-state card">
          <DollarSign size={48} className="empty-state-icon" />
          <h2 className="empty-state-title">{search ? `No results for "${search}"` : 'No transactions yet'}</h2>
          <p className="empty-state-desc">
            {search
              ? 'Try a different search term or clear the filter.'
              : 'Connect your bank account or add transactions manually to see them here.'}
          </p>
          {!search && (
            <button className="btn btn-primary" onClick={() => setShowOverrideModal(true)}>
              <Plus size={16} /> Add Your First Transaction
            </button>
          )}
        </div>
      ) : (
        <div className="transactions-list">
          {grouped.map(([date, txns]) => {
            const dailyTotal = txns.reduce((sum, t) => sum + t.amount, 0);
            const heading = formatDateHeading(date);
            const isUpcoming = heading.startsWith('Expected');
            return (
              <div key={date} className={`transaction-group ${isUpcoming ? 'transaction-group-upcoming' : ''}`}>
                <div className="transaction-date-header">
                  <span className="transaction-date-heading">{heading}</span>
                  <span className={`transaction-date-total ${dailyTotal >= 0 ? 'amount-positive' : ''}`}>
                    {dailyTotal >= 0 ? '+' : '-'}{formatCurrency(dailyTotal)}
                  </span>
                </div>
                <div className="card card-flat transactions-card">
                  {txns.map((txn, idx) => (
                    <div
                      key={txn.id}
                      className={`transaction-row clickable ${idx < txns.length - 1 ? 'transaction-row-bordered' : ''}`}
                      onClick={() => setSelectedTxn(txn)}
                    >
                      <div className="transaction-icon-wrap">
                        <CategoryIcon category={txn.category} size={17} />
                      </div>
                      <div className="transaction-info">
                        <span className="transaction-name">
                          {txn.merchant_name || txn.description || 'Transaction'}
                        </span>
                        <div className="transaction-tags">
                          {txn.category && (
                            <span className="txn-category-tag">{txn.category}</span>
                          )}
                          {txn.is_manual_override && (
                            <span className="badge badge-manual" style={{ fontSize: '0.68rem' }}>MANUAL</span>
                          )}
                          {isUpcoming && txn.date && (
                            <span className="txn-date-tag">📅 {txn.date}</span>
                          )}
                        </div>
                      </div>
                      <span className={`transaction-amount ${txn.amount >= 0 ? 'amount-positive' : ''}`}>
                        {txn.amount >= 0 ? '+' : ''}{new Intl.NumberFormat('en-US', {
                          style: 'currency', currency: 'USD'
                        }).format(txn.amount)}
                      </span>
                      <ChevronRight size={14} className="txn-chevron" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Load more hint */}
          <div className="txn-load-more">
            <button className="btn btn-secondary btn-sm txn-load-btn">
              Load previous transactions
            </button>
          </div>
        </div>
      )}

      {/* Add transaction FAB shown when sidebar button is not visible */}
      <button className="txn-add-fab" onClick={() => setShowOverrideModal(true)} title="Add transaction">
        <Plus size={20} />
      </button>

      {/* Modals / Drawers */}
      {showOverrideModal && (
        <AddOverrideModal
          onClose={() => setShowOverrideModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      {selectedTxn && (
        <TransactionDrawer txn={selectedTxn} onClose={() => setSelectedTxn(null)} />
      )}
    </div>
  );
}
