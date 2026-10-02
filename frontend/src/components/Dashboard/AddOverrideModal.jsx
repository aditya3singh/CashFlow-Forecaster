/**
 * AddOverrideModal — modal form for creating manual override transactions.
 *
 * Allows user to add expected income/expenses for forecast accuracy.
 */

import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import Button from '../Shared/Button';
import { transactionsAPI } from '../../api/client';

export default function AddOverrideModal({ bankAccountId, onClose, onSuccess }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [expectedDate, setExpectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!amount || !expectedDate) {
      setError('Please fill in all required fields.');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    setLoading(true);
    try {
      await transactionsAPI.createOverride({
        description: description || undefined,
        amount: type === 'income' ? numericAmount : -numericAmount,
        expected_date: expectedDate,
        bank_account_id: bankAccountId,
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 800);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.detail ||
        'Failed to create transaction. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Expected Transaction</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="override-success">
            <CheckCircle size={48} className="override-success-icon" />
            <p className="override-success-text">Transaction added successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="override-form">
            {/* Type toggle */}
            <div className="override-type-toggle">
              <button
                type="button"
                className={`override-type-btn ${type === 'expense' ? 'active' : ''}`}
                onClick={() => setType('expense')}
              >
                Expense
              </button>
              <button
                type="button"
                className={`override-type-btn ${type === 'income' ? 'active' : ''}`}
                onClick={() => setType('income')}
              >
                Income
              </button>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="override-description">
                Description
              </label>
              <input
                id="override-description"
                type="text"
                className="form-input"
                placeholder="e.g., Invoice #204D"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Amount */}
            <div className="form-group">
              <label className="form-label" htmlFor="override-amount">
                Amount *
              </label>
              <div className="input-with-prefix">
                <span className="input-prefix">$</span>
                <input
                  id="override-amount"
                  type="number"
                  className="form-input input-prefixed"
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label" htmlFor="override-date">
                Date *
              </label>
              <input
                id="override-date"
                type="date"
                className="form-input"
                value={expectedDate}
                onChange={(e) => setExpectedDate(e.target.value)}
                required
              />
              <span className="form-hint">Can be a past, current, or future date</span>
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="override-actions">
              <Button variant="secondary" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={loading}>
                {type === 'income' ? 'Add Income' : 'Add Expense'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
