/**
 * PaymentMethodCard — visual representation of a saved payment method.
 *
 * Renders as a premium glassmorphism card with:
 * - Card brand gradient backgrounds (Visa=blue, MC=red, RuPay=purple, etc.)
 * - UPI provider icon and verified badge
 * - Bank account masked details
 * - Default badge, auto-pay toggle, and action buttons
 */

import { CreditCard, Smartphone, Landmark, Star, Zap, Trash2, Check } from 'lucide-react';

const BRAND_GRADIENTS = {
  visa: 'linear-gradient(135deg, #1a1f71 0%, #2557d6 50%, #4a90d9 100%)',
  mastercard: 'linear-gradient(135deg, #eb001b 0%, #f79e1b 100%)',
  rupay: 'linear-gradient(135deg, #2d2d7f 0%, #7b2ff7 50%, #c77dff 100%)',
  amex: 'linear-gradient(135deg, #006fcf 0%, #00aeef 100%)',
  discover: 'linear-gradient(135deg, #ff6000 0%, #ffb347 100%)',
  jcb: 'linear-gradient(135deg, #003087 0%, #009934 50%, #cc9900 100%)',
  diners: 'linear-gradient(135deg, #004e98 0%, #006bb5 100%)',
  unknown: 'linear-gradient(135deg, #2d3748 0%, #4a5568 100%)',
};

const BRAND_LABELS = {
  visa: 'VISA',
  mastercard: 'MASTERCARD',
  rupay: 'RuPay',
  amex: 'AMEX',
  discover: 'DISCOVER',
  jcb: 'JCB',
  diners: 'DINERS',
  unknown: 'CARD',
};

const UPI_HANDLES = {
  '@okhdfcbank': { label: 'HDFC', color: '#004b87' },
  '@oksbi': { label: 'SBI', color: '#1a237e' },
  '@okicici': { label: 'ICICI', color: '#f58220' },
  '@okaxis': { label: 'Axis', color: '#97144d' },
  '@paytm': { label: 'Paytm', color: '#00b9f1' },
  '@upi': { label: 'UPI', color: '#5f259f' },
  '@ybl': { label: 'PhonePe', color: '#5f259f' },
  '@ibl': { label: 'PhonePe', color: '#5f259f' },
};

function getUPIProvider(upiId) {
  if (!upiId) return { label: 'UPI', color: '#5f259f' };
  for (const [handle, info] of Object.entries(UPI_HANDLES)) {
    if (upiId.endsWith(handle)) return info;
  }
  return { label: 'UPI', color: '#5f259f' };
}

export default function PaymentMethodCard({
  method,
  onSetDefault,
  onToggleAutoPay,
  onDelete,
}) {
  const isCard = method.method_type === 'card';
  const isUPI = method.method_type === 'upi';
  const isBankAccount = method.method_type === 'bank_account';

  // ── Card Rendering ──
  if (isCard) {
    const gradient = BRAND_GRADIENTS[method.card_brand] || BRAND_GRADIENTS.unknown;
    const brandLabel = BRAND_LABELS[method.card_brand] || 'CARD';

    return (
      <div className="pm-card-wrapper">
        <div className="pm-card pm-card-type-card" style={{ background: gradient }}>
          {method.is_default && (
            <div className="pm-default-badge">
              <Star size={10} /> Default
            </div>
          )}
          <div className="pm-card-top">
            <CreditCard size={24} className="pm-card-chip-icon" />
            <span className="pm-card-brand-label">{brandLabel}</span>
          </div>
          <div className="pm-card-number">
            <span className="pm-card-dots">•••• •••• ••••</span>
            <span className="pm-card-last4">{method.last_four}</span>
          </div>
          <div className="pm-card-bottom">
            <div className="pm-card-holder">
              <span className="pm-card-holder-label">CARDHOLDER</span>
              <span className="pm-card-holder-name">{method.cardholder_name || 'Card Holder'}</span>
            </div>
            <div className="pm-card-expiry">
              <span className="pm-card-expiry-label">EXPIRES</span>
              <span className="pm-card-expiry-value">
                {String(method.card_expiry_month).padStart(2, '0')}/{String(method.card_expiry_year).slice(-2)}
              </span>
            </div>
          </div>
        </div>
        <div className="pm-card-actions">
          <button
            className={`pm-action-btn pm-action-autopay ${method.is_auto_pay_enabled ? 'active' : ''}`}
            onClick={() => onToggleAutoPay(method.id, !method.is_auto_pay_enabled)}
            title={method.is_auto_pay_enabled ? 'Disable auto-pay' : 'Enable auto-pay'}
          >
            <Zap size={14} />
            <span>{method.is_auto_pay_enabled ? 'Auto-pay ON' : 'Auto-pay'}</span>
          </button>
          {!method.is_default && (
            <button
              className="pm-action-btn pm-action-default"
              onClick={() => onSetDefault(method.id)}
              title="Set as default"
            >
              <Star size={14} />
              <span>Set default</span>
            </button>
          )}
          <button
            className="pm-action-btn pm-action-delete"
            onClick={() => onDelete(method.id)}
            title="Remove"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  }

  // ── UPI Rendering ──
  if (isUPI) {
    const provider = getUPIProvider(method.upi_id);
    return (
      <div className="pm-card-wrapper">
        <div className="pm-card pm-card-type-upi">
          {method.is_default && (
            <div className="pm-default-badge">
              <Star size={10} /> Default
            </div>
          )}
          <div className="pm-upi-content">
            <div className="pm-upi-icon" style={{ background: provider.color }}>
              <Smartphone size={20} />
            </div>
            <div className="pm-upi-details">
              <span className="pm-upi-provider">{provider.label}</span>
              <span className="pm-upi-id">{method.upi_id}</span>
            </div>
            <div className="pm-upi-verified">
              <Check size={14} />
              <span>Linked</span>
            </div>
          </div>
        </div>
        <div className="pm-card-actions">
          <button
            className={`pm-action-btn pm-action-autopay ${method.is_auto_pay_enabled ? 'active' : ''}`}
            onClick={() => onToggleAutoPay(method.id, !method.is_auto_pay_enabled)}
          >
            <Zap size={14} />
            <span>{method.is_auto_pay_enabled ? 'Auto-pay ON' : 'Auto-pay'}</span>
          </button>
          {!method.is_default && (
            <button
              className="pm-action-btn pm-action-default"
              onClick={() => onSetDefault(method.id)}
            >
              <Star size={14} />
              <span>Set default</span>
            </button>
          )}
          <button className="pm-action-btn pm-action-delete" onClick={() => onDelete(method.id)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  }

  // ── Bank Account Rendering ──
  if (isBankAccount) {
    return (
      <div className="pm-card-wrapper">
        <div className="pm-card pm-card-type-bank">
          {method.is_default && (
            <div className="pm-default-badge">
              <Star size={10} /> Default
            </div>
          )}
          <div className="pm-bank-content">
            <div className="pm-bank-icon">
              <Landmark size={22} />
            </div>
            <div className="pm-bank-details">
              <span className="pm-bank-name">{method.bank_name || 'Bank Account'}</span>
              <span className="pm-bank-masked">{method.bank_account_number_masked}</span>
              {method.bank_ifsc && (
                <span className="pm-bank-ifsc">IFSC: {method.bank_ifsc}</span>
              )}
            </div>
            <div className="pm-bank-holder">
              <span>{method.account_holder_name}</span>
            </div>
          </div>
        </div>
        <div className="pm-card-actions">
          <button
            className={`pm-action-btn pm-action-autopay ${method.is_auto_pay_enabled ? 'active' : ''}`}
            onClick={() => onToggleAutoPay(method.id, !method.is_auto_pay_enabled)}
          >
            <Zap size={14} />
            <span>{method.is_auto_pay_enabled ? 'Auto-pay ON' : 'Auto-pay'}</span>
          </button>
          {!method.is_default && (
            <button
              className="pm-action-btn pm-action-default"
              onClick={() => onSetDefault(method.id)}
            >
              <Star size={14} />
              <span>Set default</span>
            </button>
          )}
          <button className="pm-action-btn pm-action-delete" onClick={() => onDelete(method.id)}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
