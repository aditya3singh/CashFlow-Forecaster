/**
 * GoalsPage — Savings Goals.
 *
 * New users: empty state with CTA to add their first goal.
 * User-added goals persist to localStorage.
 */

import { useState, useEffect } from 'react';
import { Plus, MoreHorizontal, Target, Trash2 } from 'lucide-react';

function GoalCard({ goal, onQuickAdd, onDelete }) {
  const pct = Math.min((goal.saved / goal.target) * 100, 100);
  const fmtUSD = (n) => `$${n.toLocaleString('en-US')}`;

  return (
    <div className="goal-card card">
      <div className="goal-card-top">
        <div className="goal-card-icon">
          <span style={{ fontSize: '1.1rem' }}>{goal.icon || '🎯'}</span>
        </div>
        <button className="goal-card-menu" onClick={() => onDelete(goal.id)} title="Delete goal">
          <Trash2 size={16} />
        </button>
      </div>

      <h3 className="goal-card-name">{goal.name}</h3>

      <div className="goal-card-amounts">
        <span className="goal-saved">{fmtUSD(goal.saved)}</span>
        <span className="goal-target">of {fmtUSD(goal.target)}</span>
      </div>

      <div className="goal-progress-track">
        <div
          className="goal-progress-fill"
          style={{ width: `${pct}%`, background: '#036c50' }}
        />
      </div>

      <div className="goal-card-footer">
        <span className="goal-pct">{pct.toFixed(0)}% reached</span>
      </div>

      <button className="goal-quick-add" onClick={() => onQuickAdd(goal)}>
        <Plus size={15} />
        Quick Add
      </button>
    </div>
  );
}

function QuickAddModal({ goal, onClose, onSave }) {
  const [amount, setAmount] = useState('');

  const handleAdd = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return;
    onSave(goal.id, num);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Quick Add — {goal.name}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="form-group">
          <label className="form-label">Amount to Add</label>
          <div className="input-with-prefix">
            <span className="input-prefix">$</span>
            <input
              type="number"
              className="form-input input-prefixed"
              placeholder="0.00"
              min="1"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              autoFocus
            />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAdd}>Add ${amount || '0'}</button>
        </div>
      </div>
    </div>
  );
}

function NewGoalModal({ onClose, onCreate }) {
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [icon, setIcon] = useState('🎯');

  const icons = ['🎯', '✈️', '🏠', '🛡️', '🚗', '💻', '📚', '💰'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !target) return;
    onCreate({
      id: `goal-${Date.now()}`,
      name,
      target: parseFloat(target),
      saved: 0,
      icon,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Savings Goal</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Goal Name *</label>
            <input className="form-input" placeholder="e.g., Emergency Fund" value={name} onChange={e => setName(e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Target Amount *</label>
            <div className="input-with-prefix">
              <span className="input-prefix">$</span>
              <input className="form-input input-prefixed" type="number" placeholder="10000" min="1" value={target} onChange={e => setTarget(e.target.value)} required />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Icon</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {icons.map(ic => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => setIcon(ic)}
                  style={{
                    fontSize: '1.3rem',
                    padding: '0.4rem',
                    border: ic === icon ? '2px solid #036c50' : '2px solid transparent',
                    borderRadius: '8px',
                    background: ic === icon ? '#EEFBFA' : 'transparent',
                    cursor: 'pointer',
                  }}
                >{ic}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create Goal</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem('cf_goals');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [quickAddGoal, setQuickAddGoal] = useState(null);
  const [showNewGoal, setShowNewGoal] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('cf_goals', JSON.stringify(goals));
  }, [goals]);

  const totalSaved = goals.reduce((t, g) => t + g.saved, 0);

  const addGoal = (newGoal) => {
    setGoals(prev => [...prev, newGoal]);
  };

  const deleteGoal = (id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const quickAdd = (goalId, amount) => {
    setGoals(prev =>
      prev.map(g => g.id === goalId ? { ...g, saved: g.saved + amount } : g)
    );
  };

  // Empty state
  if (goals.length === 0 && !showNewGoal) {
    return (
      <div className="goals-page">
        <div className="empty-state card">
          <Target size={48} className="empty-state-icon" />
          <h2 className="empty-state-title">No savings goals yet</h2>
          <p className="empty-state-desc">
            Set savings targets for things that matter — emergency fund, equipment, vacation, or anything else.
          </p>
          <button className="btn btn-primary" onClick={() => setShowNewGoal(true)}>
            <Plus size={16} /> Create Your First Goal
          </button>
        </div>
        {showNewGoal && <NewGoalModal onClose={() => setShowNewGoal(false)} onCreate={addGoal} />}
      </div>
    );
  }

  return (
    <div className="goals-page">
      {/* Hero banner */}
      <div className="goals-hero card">
        <div>
          <span className="goals-hero-label">TOTAL SAVED</span>
          <p className="goals-hero-amount">
            ${totalSaved.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewGoal(true)}>
          <Plus size={16} />
          New Goal
        </button>
      </div>

      {/* Goal cards */}
      <div className="goals-grid">
        {goals.map(goal => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onQuickAdd={setQuickAddGoal}
            onDelete={deleteGoal}
          />
        ))}

        {/* Add Goal CTA card */}
        <div className="goal-card goal-card-add" onClick={() => setShowNewGoal(true)}>
          <div className="goal-add-icon">
            <Target size={28} />
          </div>
          <p className="goal-add-text">Add a new savings goal</p>
          <button className="btn btn-secondary btn-sm">
            <Plus size={14} /> New Goal
          </button>
        </div>
      </div>

      {/* Quick Add Modal */}
      {quickAddGoal && (
        <QuickAddModal
          goal={quickAddGoal}
          onClose={() => setQuickAddGoal(null)}
          onSave={quickAdd}
        />
      )}

      {/* New Goal Modal */}
      {showNewGoal && <NewGoalModal onClose={() => setShowNewGoal(false)} onCreate={addGoal} />}
    </div>
  );
}
