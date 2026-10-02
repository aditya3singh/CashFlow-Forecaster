/**
 * SubscriptionsPage — Recurring Subscriptions.
 *
 * New users: empty state with CTA to add their first subscription.
 * User-added subscriptions are stored in localStorage for persistence.
 */

import { useState, useEffect } from 'react';
import { Plus, Calendar, RefreshCw, Trash2 } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Toggle({ checked, onChange, id }) {
  return (
    <label className="toggle" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} />
      <span className="toggle-slider" />
    </label>
  );
}

function AddSubscriptionModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [nextBill, setNextBill] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !amount) return;
    onAdd({
      id: `sub-${Date.now()}`,
      name,
      amount: parseFloat(amount),
      nextBill: nextBill || null,
      active: true,
      icon: '📦',
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Subscription</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" placeholder="e.g., AWS Hosting" value={name} onChange={e => setName(e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Monthly Amount *</label>
            <div className="input-with-prefix">
              <span className="input-prefix">$</span>
              <input className="form-input input-prefixed" type="number" placeholder="0.00" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Next Bill Date</label>
            <input className="form-input" type="date" value={nextBill} onChange={e => setNextBill(e.target.value)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Subscription</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState(() => {
    try {
      const saved = localStorage.getItem('cf_subscriptions');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [showAdd, setShowAdd] = useState(false);
  const [sortHigh, setSortHigh] = useState(true);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('cf_subscriptions', JSON.stringify(subs));
  }, [subs]);

  const sorted = [...subs].sort((a, b) =>
    sortHigh ? b.amount - a.amount : a.amount - b.amount
  );

  const monthlyActive = subs.filter(s => s.active).reduce((t, s) => t + s.amount, 0);

  const toggleSub = (id) => {
    setSubs(prev =>
      prev.map(s => s.id === id ? { ...s, active: !s.active } : s)
    );
  };

  const deleteSub = (id) => {
    setSubs(prev => prev.filter(s => s.id !== id));
  };

  const addSub = (newSub) => {
    setSubs(prev => [...prev, newSub]);
  };

  // Empty state
  if (subs.length === 0 && !showAdd) {
    return (
      <div className="subs-page">
        <div className="subs-header">
          <div>
            <h1 className="page-title">Recurring Subscriptions</h1>
            <p className="page-subtitle">Manage your fixed monthly expenses</p>
          </div>
        </div>

        <div className="empty-state card">
          <RefreshCw size={48} className="empty-state-icon" />
          <h2 className="empty-state-title">No subscriptions yet</h2>
          <p className="empty-state-desc">
            Add your recurring expenses like SaaS tools, rent, and services to track your fixed monthly costs.
          </p>
          <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add First Subscription
          </button>
        </div>

        {showAdd && <AddSubscriptionModal onClose={() => setShowAdd(false)} onAdd={addSub} />}
      </div>
    );
  }

  return (
    <div className="subs-page">
      <div className="subs-header">
        <div>
          <h1 className="page-title">Recurring Subscriptions</h1>
          <p className="page-subtitle">Manage your fixed monthly expenses</p>
        </div>
        <div className="subs-header-right">
          <div className="subs-total-pill">
            <span className="subs-total-label">Monthly Total</span>
            <span className="subs-total-value">
              ${monthlyActive.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <button className="subs-sort-btn" onClick={() => setSortHigh(p => !p)}>
            Sort by: Cost ({sortHigh ? 'High to Low' : 'Low to High'}) ▾
          </button>
        </div>
      </div>

      <div className="subs-list card card-flat" style={{ padding: 0 }}>
        {sorted.map((sub, idx) => (
          <div
            key={sub.id}
            className={`subs-row ${!sub.active ? 'subs-row-paused' : ''} ${idx < sorted.length - 1 ? 'subs-row-bordered' : ''}`}
          >
            <div className="subs-icon">{sub.icon || '📦'}</div>
            <div className="subs-info">
              <div className="subs-name-row">
                <span className="subs-name">{sub.name}</span>
                {!sub.active && <span className="subs-paused-badge">Paused</span>}
              </div>
              <span className="subs-next-bill">
                <Calendar size={12} />
                Next bill: {formatDate(sub.nextBill)}
              </span>
            </div>
            <div className="subs-amount-col">
              <span className="subs-amount">
                ${sub.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="subs-per-mo">/mo</span>
            </div>
            <div className="subs-manage">
              <button className="subs-manage-btn" onClick={() => deleteSub(sub.id)} title="Delete">
                <Trash2 size={14} />
              </button>
              <Toggle
                id={`sub-toggle-${sub.id}`}
                checked={sub.active}
                onChange={() => toggleSub(sub.id)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom action card */}
      <div className="subs-bottom-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="card subs-add-card" onClick={() => setShowAdd(true)}>
          <div className="subs-add-icon">
            <Plus size={24} />
          </div>
          <h3 className="subs-add-title">Add Subscription</h3>
          <p className="subs-add-desc">Track a new recurring expense.</p>
        </div>
      </div>

      {showAdd && <AddSubscriptionModal onClose={() => setShowAdd(false)} onAdd={addSub} />}
    </div>
  );
}
