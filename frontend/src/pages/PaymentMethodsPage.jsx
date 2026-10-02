/**
 * PaymentMethodsPage — manage saved payment methods.
 *
 * Sections for Cards, UPI, and Bank Accounts.
 * Add Payment Method modal, set default, toggle auto-pay, delete.
 * Premium UI with glassmorphism cards and gradient backgrounds.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Smartphone,
  Landmark,
  Plus,
  Shield,
  Zap,
  Loader,
} from 'lucide-react';
import Button from '../components/Shared/Button';
import PaymentMethodCard from '../components/Payment/PaymentMethodCard';
import AddPaymentModal from '../components/Payment/AddPaymentModal';
import { paymentMethodsAPI } from '../api/client';

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // ── Fetch payment methods ──
  const fetchMethods = useCallback(async () => {
    try {
      const response = await paymentMethodsAPI.listMethods();
      const data = response.data;
      setMethods(data.methods || []);
    } catch {
      setMethods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  // ── Split by type ──
  const cards = methods.filter((m) => m.method_type === 'card');
  const upis = methods.filter((m) => m.method_type === 'upi');
  const bankAccounts = methods.filter((m) => m.method_type === 'bank_account');
  const defaultMethod = methods.find((m) => m.is_default);
  const autoPayMethods = methods.filter((m) => m.is_auto_pay_enabled);

  // ── Handlers ──
  const handleAdd = async (type, data) => {
    if (type === 'card') {
      await paymentMethodsAPI.addCard(data);
    } else if (type === 'upi') {
      await paymentMethodsAPI.addUPI(data);
    } else if (type === 'bank_account') {
      await paymentMethodsAPI.addBankAccount(data);
    }
    await fetchMethods();
  };

  const handleSetDefault = async (id) => {
    setActionLoading(id);
    try {
      await paymentMethodsAPI.setDefault(id);
      await fetchMethods();
    } catch (err) {
      console.error('Failed to set default:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAutoPay = async (id, enabled) => {
    setActionLoading(id);
    try {
      await paymentMethodsAPI.toggleAutoPay(id, enabled);
      await fetchMethods();
    } catch (err) {
      console.error('Failed to toggle auto-pay:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this payment method?')) return;
    setActionLoading(id);
    try {
      await paymentMethodsAPI.deleteMethod(id);
      await fetchMethods();
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="pm-page">
      {/* ── Page Header ── */}
      <div className="pm-page-header">
        <div className="pm-page-header-left">
          <h1 className="page-title">Payment Methods</h1>
          <p className="pm-page-subtitle">
            Manage your cards, UPI IDs, and bank accounts for automatic and manual payments.
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setModalOpen(true)}>
          <Plus size={16} />
          Add Payment Method
        </Button>
      </div>

      {/* ── Summary Strip ── */}
      <div className="pm-summary-strip">
        <div className="pm-summary-item">
          <div className="pm-summary-icon pm-summary-icon-total">
            <CreditCard size={18} />
          </div>
          <div className="pm-summary-info">
            <span className="pm-summary-value">{methods.length}</span>
            <span className="pm-summary-label">Total Methods</span>
          </div>
        </div>
        <div className="pm-summary-item">
          <div className="pm-summary-icon pm-summary-icon-default">
            <Shield size={18} />
          </div>
          <div className="pm-summary-info">
            <span className="pm-summary-value">
              {defaultMethod ? defaultMethod.label : 'None'}
            </span>
            <span className="pm-summary-label">Default Method</span>
          </div>
        </div>
        <div className="pm-summary-item">
          <div className="pm-summary-icon pm-summary-icon-autopay">
            <Zap size={18} />
          </div>
          <div className="pm-summary-info">
            <span className="pm-summary-value">{autoPayMethods.length}</span>
            <span className="pm-summary-label">Auto-pay Enabled</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="pm-loading">
          <Loader size={28} className="pm-spinner" />
          <span>Loading payment methods...</span>
        </div>
      ) : methods.length === 0 ? (
        /* ── Empty State ── */
        <div className="pm-empty-state card">
          <div className="pm-empty-icon-group">
            <CreditCard size={32} className="pm-empty-icon" />
            <Smartphone size={28} className="pm-empty-icon" />
            <Landmark size={28} className="pm-empty-icon" />
          </div>
          <h2>No payment methods yet</h2>
          <p>
            Add a debit/credit card, UPI ID, or bank account to enable automatic
            and manual payments for your bills and subscriptions.
          </p>
          <Button variant="primary" size="lg" onClick={() => setModalOpen(true)}>
            <Plus size={18} />
            Add Your First Payment Method
          </Button>
          <div className="pm-empty-trust">
            <Shield size={14} />
            <span>
              Your payment information is encrypted and stored securely. We never
              store full card numbers.
            </span>
          </div>
        </div>
      ) : (
        /* ── Payment Methods Grid ── */
        <div className="pm-sections">
          {/* Cards Section */}
          {cards.length > 0 && (
            <section className="pm-section">
              <div className="pm-section-header">
                <CreditCard size={18} />
                <h2>Cards</h2>
                <span className="pm-section-count">{cards.length}</span>
              </div>
              <div className="pm-cards-grid">
                {cards.map((m) => (
                  <PaymentMethodCard
                    key={m.id}
                    method={m}
                    onSetDefault={handleSetDefault}
                    onToggleAutoPay={handleToggleAutoPay}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}

          {/* UPI Section */}
          {upis.length > 0 && (
            <section className="pm-section">
              <div className="pm-section-header">
                <Smartphone size={18} />
                <h2>UPI</h2>
                <span className="pm-section-count">{upis.length}</span>
              </div>
              <div className="pm-cards-grid">
                {upis.map((m) => (
                  <PaymentMethodCard
                    key={m.id}
                    method={m}
                    onSetDefault={handleSetDefault}
                    onToggleAutoPay={handleToggleAutoPay}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Bank Accounts Section */}
          {bankAccounts.length > 0 && (
            <section className="pm-section">
              <div className="pm-section-header">
                <Landmark size={18} />
                <h2>Bank Accounts</h2>
                <span className="pm-section-count">{bankAccounts.length}</span>
              </div>
              <div className="pm-cards-grid">
                {bankAccounts.map((m) => (
                  <PaymentMethodCard
                    key={m.id}
                    method={m}
                    onSetDefault={handleSetDefault}
                    onToggleAutoPay={handleToggleAutoPay}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Add Payment Modal ── */}
      <AddPaymentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          fetchMethods();
        }}
        onAdd={handleAdd}
      />
    </div>
  );
}
