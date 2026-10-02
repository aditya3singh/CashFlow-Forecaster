/**
 * AddPaymentModal — tabbed modal for adding payment methods.
 *
 * Three tabs: Card / UPI / Bank Account
 * Real-time validation, card number formatting (groups of 4),
 * Luhn validation on client side, UPI format validation.
 */

import { useState, useEffect } from 'react';
import { X, CreditCard, Smartphone, Landmark, AlertCircle, Check } from 'lucide-react';
import Button from '../Shared/Button';

// ── Luhn Validation ──
function luhnCheck(num) {
  const digits = num.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let total = 0;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if ((digits.length - 1 - i) % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    total += n;
  }
  return total % 10 === 0;
}

// ── Card Brand Detection ──
function detectBrand(num) {
  const cleaned = num.replace(/\D/g, '');
  if (/^4/.test(cleaned)) return 'visa';
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
  if (/^3[47]/.test(cleaned)) return 'amex';
  if (/^6(?:011|5|4[4-9]|22)/.test(cleaned)) return 'discover';
  if (/^6/.test(cleaned)) return 'rupay';
  if (/^35/.test(cleaned)) return 'jcb';
  return '';
}

// ── Format card number into groups of 4 ──
function formatCardNumber(value) {
  const cleaned = value.replace(/\D/g, '').slice(0, 19);
  return cleaned.replace(/(.{4})/g, '$1 ').trim();
}

// ── UPI Validation ──
function isValidUPI(upi) {
  return /^[a-zA-Z0-9._\-]+@[a-zA-Z0-9]+$/.test(upi.trim());
}

// ── IFSC Validation ──
function isValidIFSC(ifsc) {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.trim().toUpperCase());
}

const TABS = [
  { id: 'card', label: 'Card', icon: CreditCard },
  { id: 'upi', label: 'UPI', icon: Smartphone },
  { id: 'bank', label: 'Bank Account', icon: Landmark },
];

export default function AddPaymentModal({ isOpen, onClose, onAdd }) {
  const [activeTab, setActiveTab] = useState('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // ── Card Form State ──
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardBrand, setCardBrand] = useState('');
  const [cardErrors, setCardErrors] = useState({});

  // ── UPI Form State ──
  const [upiId, setUpiId] = useState('');
  const [upiError, setUpiError] = useState('');

  // ── Bank Form State ──
  const [bankAccNum, setBankAccNum] = useState('');
  const [bankConfirmNum, setBankConfirmNum] = useState('');
  const [bankIFSC, setBankIFSC] = useState('');
  const [bankHolder, setBankHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankErrors, setBankErrors] = useState({});

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setActiveTab('card');
      setError(null);
      setSuccess(false);
      setCardNumber('');
      setCardExpiry('');
      setCardCVV('');
      setCardHolder('');
      setCardBrand('');
      setCardErrors({});
      setUpiId('');
      setUpiError('');
      setBankAccNum('');
      setBankConfirmNum('');
      setBankIFSC('');
      setBankHolder('');
      setBankName('');
      setBankErrors({});
    }
  }, [isOpen]);

  // ── Card number handling ──
  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
    const cleaned = formatted.replace(/\s/g, '');
    setCardBrand(detectBrand(cleaned));
    if (cleaned.length >= 13) {
      if (!luhnCheck(cleaned)) {
        setCardErrors((prev) => ({ ...prev, number: 'Invalid card number' }));
      } else {
        setCardErrors((prev) => ({ ...prev, number: null }));
      }
    } else {
      setCardErrors((prev) => ({ ...prev, number: null }));
    }
  };

  // ── Expiry formatting (MM/YY) ──
  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = val.slice(0, 2) + '/' + val.slice(2);
    }
    setCardExpiry(val);
  };

  // ── Card Submission ──
  const handleCardSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    const cleaned = cardNumber.replace(/\s/g, '');

    if (!cleaned || !luhnCheck(cleaned)) errors.number = 'Invalid card number';
    if (!cardExpiry || cardExpiry.length < 5) errors.expiry = 'Invalid expiry (MM/YY)';
    else {
      const [m, y] = cardExpiry.split('/');
      const month = parseInt(m, 10);
      const year = 2000 + parseInt(y, 10);
      if (month < 1 || month > 12) errors.expiry = 'Invalid month';
      else if (year < new Date().getFullYear()) errors.expiry = 'Card expired';
      else if (
        year === new Date().getFullYear() &&
        month < new Date().getMonth() + 1
      )
        errors.expiry = 'Card expired';
    }
    if (!cardCVV || !/^\d{3,4}$/.test(cardCVV)) errors.cvv = 'Invalid CVV';
    if (!cardHolder.trim()) errors.holder = 'Name required';

    setCardErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    const [m, y] = cardExpiry.split('/');

    setLoading(true);
    setError(null);
    try {
      await onAdd('card', {
        card_number: cleaned,
        expiry_month: parseInt(m, 10),
        expiry_year: 2000 + parseInt(y, 10),
        cvv: cardCVV,
        cardholder_name: cardHolder.trim(),
      });
      setSuccess(true);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          'Failed to add card'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── UPI Submission ──
  const handleUPISubmit = async (e) => {
    e.preventDefault();
    if (!isValidUPI(upiId)) {
      setUpiError('Invalid UPI ID (e.g., user@upi)');
      return;
    }
    setUpiError('');
    setLoading(true);
    setError(null);
    try {
      await onAdd('upi', { upi_id: upiId.trim().toLowerCase() });
      setSuccess(true);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(
        err.response?.data?.detail || err.message || 'Failed to add UPI'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Bank Account Submission ──
  const handleBankSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    const accCleaned = bankAccNum.replace(/\s/g, '');
    const confirmCleaned = bankConfirmNum.replace(/\s/g, '');

    if (!accCleaned || accCleaned.length < 8 || accCleaned.length > 18)
      errors.accNum = 'Account number must be 8-18 digits';
    if (accCleaned !== confirmCleaned)
      errors.confirmNum = 'Account numbers do not match';
    if (!isValidIFSC(bankIFSC)) errors.ifsc = 'Invalid IFSC (e.g., HDFC0001234)';
    if (!bankHolder.trim()) errors.holder = 'Account holder name required';

    setBankErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setLoading(true);
    setError(null);
    try {
      await onAdd('bank_account', {
        account_number: accCleaned,
        confirm_account_number: confirmCleaned,
        ifsc_code: bankIFSC.trim().toUpperCase(),
        account_holder_name: bankHolder.trim(),
        bank_name: bankName.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          'Failed to add bank account'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="pm-modal-overlay" onClick={onClose}>
      <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="pm-modal-header">
          <h2>Add Payment Method</h2>
          <button className="pm-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Success State */}
        {success ? (
          <div className="pm-modal-success">
            <div className="pm-success-icon">
              <Check size={32} />
            </div>
            <h3>Payment method added!</h3>
            <p>Your new payment method has been saved securely.</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="pm-modal-tabs">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className={`pm-modal-tab ${activeTab === id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(id);
                    setError(null);
                  }}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Error */}
            {error && (
              <div className="pm-modal-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Card Form */}
            {activeTab === 'card' && (
              <form className="pm-modal-form" onSubmit={handleCardSubmit}>
                <div className="pm-form-group">
                  <label htmlFor="pm-card-number">Card Number</label>
                  <div className="pm-input-wrapper">
                    <input
                      id="pm-card-number"
                      type="text"
                      className={`form-input ${cardErrors.number ? 'input-error' : ''}`}
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      maxLength={23}
                      autoComplete="cc-number"
                    />
                    {cardBrand && (
                      <span className={`pm-brand-badge pm-brand-${cardBrand}`}>
                        {cardBrand.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {cardErrors.number && (
                    <span className="pm-field-error">{cardErrors.number}</span>
                  )}
                </div>

                <div className="pm-form-row">
                  <div className="pm-form-group">
                    <label htmlFor="pm-card-expiry">Expiry</label>
                    <input
                      id="pm-card-expiry"
                      type="text"
                      className={`form-input ${cardErrors.expiry ? 'input-error' : ''}`}
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      maxLength={5}
                      autoComplete="cc-exp"
                    />
                    {cardErrors.expiry && (
                      <span className="pm-field-error">{cardErrors.expiry}</span>
                    )}
                  </div>
                  <div className="pm-form-group">
                    <label htmlFor="pm-card-cvv">CVV</label>
                    <input
                      id="pm-card-cvv"
                      type="password"
                      className={`form-input ${cardErrors.cvv ? 'input-error' : ''}`}
                      placeholder="•••"
                      value={cardCVV}
                      onChange={(e) =>
                        setCardCVV(e.target.value.replace(/\D/g, '').slice(0, 4))
                      }
                      maxLength={4}
                      autoComplete="cc-csc"
                    />
                    {cardErrors.cvv && (
                      <span className="pm-field-error">{cardErrors.cvv}</span>
                    )}
                  </div>
                </div>

                <div className="pm-form-group">
                  <label htmlFor="pm-card-holder">Cardholder Name</label>
                  <input
                    id="pm-card-holder"
                    type="text"
                    className={`form-input ${cardErrors.holder ? 'input-error' : ''}`}
                    placeholder="Full name on card"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    autoComplete="cc-name"
                  />
                  {cardErrors.holder && (
                    <span className="pm-field-error">{cardErrors.holder}</span>
                  )}
                </div>

                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  loading={loading}
                  disabled={loading}
                >
                  <CreditCard size={16} />
                  Add Card
                </Button>
              </form>
            )}

            {/* UPI Form */}
            {activeTab === 'upi' && (
              <form className="pm-modal-form" onSubmit={handleUPISubmit}>
                <div className="pm-form-group">
                  <label htmlFor="pm-upi-id">UPI ID</label>
                  <input
                    id="pm-upi-id"
                    type="text"
                    className={`form-input ${upiError ? 'input-error' : ''}`}
                    placeholder="yourname@upi"
                    value={upiId}
                    onChange={(e) => {
                      setUpiId(e.target.value);
                      setUpiError('');
                    }}
                  />
                  {upiError && (
                    <span className="pm-field-error">{upiError}</span>
                  )}
                  <span className="pm-form-hint">
                    Enter your UPI ID linked to any bank — Google Pay, PhonePe,
                    Paytm, BHIM, etc.
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  loading={loading}
                  disabled={loading}
                >
                  <Smartphone size={16} />
                  Add UPI
                </Button>
              </form>
            )}

            {/* Bank Account Form */}
            {activeTab === 'bank' && (
              <form className="pm-modal-form" onSubmit={handleBankSubmit}>
                <div className="pm-form-group">
                  <label htmlFor="pm-bank-name">Bank Name</label>
                  <input
                    id="pm-bank-name"
                    type="text"
                    className="form-input"
                    placeholder="e.g., HDFC Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>

                <div className="pm-form-group">
                  <label htmlFor="pm-bank-accnum">Account Number</label>
                  <input
                    id="pm-bank-accnum"
                    type="text"
                    className={`form-input ${bankErrors.accNum ? 'input-error' : ''}`}
                    placeholder="Enter account number"
                    value={bankAccNum}
                    onChange={(e) =>
                      setBankAccNum(e.target.value.replace(/\D/g, ''))
                    }
                    maxLength={18}
                  />
                  {bankErrors.accNum && (
                    <span className="pm-field-error">{bankErrors.accNum}</span>
                  )}
                </div>

                <div className="pm-form-group">
                  <label htmlFor="pm-bank-confirm">Confirm Account Number</label>
                  <input
                    id="pm-bank-confirm"
                    type="text"
                    className={`form-input ${bankErrors.confirmNum ? 'input-error' : ''}`}
                    placeholder="Re-enter account number"
                    value={bankConfirmNum}
                    onChange={(e) =>
                      setBankConfirmNum(e.target.value.replace(/\D/g, ''))
                    }
                    maxLength={18}
                  />
                  {bankErrors.confirmNum && (
                    <span className="pm-field-error">
                      {bankErrors.confirmNum}
                    </span>
                  )}
                </div>

                <div className="pm-form-row">
                  <div className="pm-form-group">
                    <label htmlFor="pm-bank-ifsc">IFSC Code</label>
                    <input
                      id="pm-bank-ifsc"
                      type="text"
                      className={`form-input ${bankErrors.ifsc ? 'input-error' : ''}`}
                      placeholder="e.g., HDFC0001234"
                      value={bankIFSC}
                      onChange={(e) =>
                        setBankIFSC(e.target.value.toUpperCase().slice(0, 11))
                      }
                      maxLength={11}
                    />
                    {bankErrors.ifsc && (
                      <span className="pm-field-error">{bankErrors.ifsc}</span>
                    )}
                  </div>
                  <div className="pm-form-group">
                    <label htmlFor="pm-bank-holder">Account Holder</label>
                    <input
                      id="pm-bank-holder"
                      type="text"
                      className={`form-input ${bankErrors.holder ? 'input-error' : ''}`}
                      placeholder="Full name"
                      value={bankHolder}
                      onChange={(e) => setBankHolder(e.target.value)}
                    />
                    {bankErrors.holder && (
                      <span className="pm-field-error">
                        {bankErrors.holder}
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  loading={loading}
                  disabled={loading}
                >
                  <Landmark size={16} />
                  Add Bank Account
                </Button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
