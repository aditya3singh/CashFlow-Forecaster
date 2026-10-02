/**
 * ConnectBankModal — real Plaid Link integration.
 *
 * Flow:
 *   1. Fetch a link_token from the backend
 *   2. Open Plaid Link widget (hosted by Plaid)
 *   3. On success, exchange the real public_token via backend
 *   4. Show success state and close
 *
 * In sandbox mode, Plaid shows test banks — use user_good / pass_good.
 */

import { useState, useEffect, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import {
  X,
  Landmark,
  Shield,
  CheckCircle,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { accountsAPI } from '../../api/client';

export default function ConnectBankModal({ onClose, onSuccess }) {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [stepText, setStepText] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // ── Step 1: Fetch link_token on mount ──
  useEffect(() => {
    let cancelled = false;

    async function fetchLinkToken() {
      try {
        const res = await accountsAPI.createLinkToken();
        if (!cancelled) {
          setLinkToken(res.data.link_token);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to create link token:', err);
          setError(
            err.response?.data?.message ||
            'Plaid credentials not configured. Set PLAID_CLIENT_ID and PLAID_SECRET in .env'
          );
          setLoading(false);
        }
      }
    }

    fetchLinkToken();
    return () => { cancelled = true; };
  }, []);

  // ── Step 3: Handle Plaid Link success ──
  const onPlaidSuccess = useCallback(
    async (publicToken, metadata) => {
      setConnecting(true);
      setError(null);

      try {
        const institutionName = metadata?.institution?.name || null;
        const accountName =
          metadata?.accounts?.[0]?.name ||
          metadata?.accounts?.[0]?.mask
            ? `Account (...${metadata.accounts[0].mask})`
            : null;

        setStepText('Exchanging credentials securely...');
        await accountsAPI.exchangeToken(
          publicToken,
          institutionName,
          accountName
        );

        setSuccess(true);
        setStepText('Bank connected successfully!');

        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1200);
      } catch (err) {
        console.error('Token exchange failed:', err);
        setError(
          err.response?.data?.message ||
          'Could not complete bank connection. Please try again.'
        );
        setConnecting(false);
        setStepText('');
      }
    },
    [onClose, onSuccess]
  );

  // ── Step 2: Configure Plaid Link ──
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: (err) => {
      if (err) {
        console.error('Plaid Link exited with error:', err);
        setError('Bank connection was interrupted. Please try again.');
      }
    },
  });

  // Auto-open Plaid Link once the token is ready
  useEffect(() => {
    if (linkToken && ready && !connecting && !success) {
      open();
    }
  }, [linkToken, ready, connecting, success, open]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content connect-bank-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h2
              className="modal-title"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Landmark size={20} style={{ color: 'var(--color-primary)' }} />
              Connect Bank Account
            </h2>
            <p
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
                marginTop: '2px',
              }}
            >
              Link your financial institution via Plaid's secure widget
            </p>
          </div>
          <button
            className="modal-close"
            onClick={onClose}
            disabled={connecting}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body States */}
        {success ? (
          <div className="connect-bank-success">
            <CheckCircle size={52} className="connect-bank-success-icon" />
            <h3>Bank Connected Successfully!</h3>
            <p>
              We've synced your transactions and updated your 6-week forecast.
            </p>
          </div>
        ) : connecting ? (
          <div className="connect-bank-loading">
            <div className="connect-bank-spinner-wrap">
              <RefreshCw
                size={36}
                className="spin-icon"
                style={{ color: 'var(--color-primary)' }}
              />
            </div>
            <h4>{stepText}</h4>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
              }}
            >
              Establishing 256-bit encrypted connection with Plaid...
            </p>
          </div>
        ) : loading ? (
          <div className="connect-bank-loading">
            <div className="connect-bank-spinner-wrap">
              <RefreshCw
                size={36}
                className="spin-icon"
                style={{ color: 'var(--color-primary)' }}
              />
            </div>
            <h4>Preparing secure connection...</h4>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-muted)',
              }}
            >
              Loading Plaid Link widget...
            </p>
          </div>
        ) : error ? (
          <div className="connect-bank-body">
            <p className="form-error" style={{ marginTop: '0.75rem' }}>
              {error}
            </p>
            <div className="connect-bank-footer">
              <div className="connect-bank-trust">
                <Lock size={14} />
                <span>Encrypted & Read-only. Passwords never stored.</span>
              </div>
              <div className="connect-bank-actions">
                <button
                  className="btn btn-secondary btn-md"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-md"
                  onClick={() => {
                    setError(null);
                    if (linkToken && ready) {
                      open();
                    }
                  }}
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="connect-bank-body">
            <div className="connect-bank-loading">
              <Landmark
                size={48}
                style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}
              />
              <h4>Opening Plaid Link...</h4>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-muted)',
                }}
              >
                The secure bank connection widget should open automatically.
                <br />
                <button
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: 'inherit',
                    marginTop: '0.5rem',
                  }}
                  onClick={() => open()}
                >
                  Click here if it didn't open
                </button>
              </p>
            </div>
            <div className="connect-bank-footer">
              <div className="connect-bank-trust">
                <Shield size={14} />
                <span>Encrypted & Read-only. Passwords never stored.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
