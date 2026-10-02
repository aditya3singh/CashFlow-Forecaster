/**
 * OnboardingPage — focused screen to connect a bank account.
 *
 * 3-step progress indicator, single CTA, trust text.
 * Uses real Plaid Link (react-plaid-link) instead of fake token.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlaidLink } from 'react-plaid-link';
import { Landmark, ArrowRight, RefreshCw, BarChart3, Shield } from 'lucide-react';
import Button from '../components/Shared/Button';
import { accountsAPI } from '../api/client';

const steps = [
  { label: 'Connect', icon: Landmark },
  { label: 'Sync', icon: RefreshCw },
  { label: 'Forecast', icon: BarChart3 },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [linkToken, setLinkToken] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // ── Plaid Link success handler ──
  const onPlaidSuccess = useCallback(
    async (publicToken, metadata) => {
      try {
        // Step 2: Exchange public token
        setCurrentStep(1);
        const institutionName = metadata?.institution?.name || null;
        const accountName =
          metadata?.accounts?.[0]?.name ||
          (metadata?.accounts?.[0]?.mask
            ? `Account (...${metadata.accounts[0].mask})`
            : null);

        await accountsAPI.exchangeToken(
          publicToken,
          institutionName,
          accountName
        );

        // Step 3: Done — redirect to dashboard
        setCurrentStep(2);
        setTimeout(() => navigate('/dashboard'), 1200);
      } catch (err) {
        console.error('Token exchange failed:', err);
        setError(
          err.response?.data?.message ||
          'Could not complete bank connection. Please try again.'
        );
        setCurrentStep(0);
        setLoading(false);
      }
    },
    [navigate]
  );

  // ── Plaid Link configuration ──
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: onPlaidSuccess,
    onExit: (err) => {
      if (err) {
        console.error('Plaid Link exited with error:', err);
        setError('Bank connection was interrupted. Please try again.');
      }
      setLoading(false);
    },
  });

  // ── Handle Connect button click ──
  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Get link token
      setCurrentStep(0);
      const res = await accountsAPI.createLinkToken();
      const token = res.data.link_token;
      setLinkToken(token);

      // We need to wait for usePlaidLink to pick up the new token.
      // Since usePlaidLink is reactive, we'll open it via useEffect-like
      // pattern. But since the hook re-renders, we can open directly
      // after a brief tick.
    } catch (err) {
      console.error('Onboarding failed:', err.message);
      setError(
        err.response?.data?.message ||
        'Could not connect to bank. Please check your connection and try again.'
      );
      setCurrentStep(0);
      setLoading(false);
    }
  };

  // Auto-open Plaid Link once token is ready
  // (usePlaidLink re-creates `open` when `token` changes)
  // We use a useEffect-like approach by checking in render:
  if (linkToken && ready && loading && currentStep === 0) {
    // Open Plaid Link on next tick to avoid calling during render
    setTimeout(() => open(), 0);
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-card card">
        {/* Progress steps */}
        <div className="onboarding-steps">
          {steps.map(({ label, icon: Icon }, i) => (
            <div
              key={label}
              className={`onboarding-step ${
                i < currentStep ? 'completed' : i === currentStep ? 'active' : ''
              }`}
            >
              <div className="onboarding-step-icon">
                <Icon size={18} />
              </div>
              <span className="onboarding-step-label">{label}</span>
              {i < steps.length - 1 && <div className="onboarding-step-line" />}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="onboarding-content">
          <Landmark size={48} className="onboarding-hero-icon" />
          <h1>Connect your bank to see your forecast</h1>
          <p className="onboarding-description">
            We'll securely connect to your bank, pull your recent transactions, and
            generate your first cash flow forecast in seconds.
          </p>

          <Button
            variant="primary"
            size="lg"
            onClick={handleConnect}
            loading={loading}
            disabled={currentStep === 2}
          >
            {currentStep === 2 ? (
              'All set! Redirecting...'
            ) : (
              <>
                Connect bank account
                <ArrowRight size={18} />
              </>
            )}
          </Button>

          {error && <p className="form-error">{error}</p>}

          <div className="onboarding-trust">
            <Shield size={16} />
            <span>
              Read-only access. We never store your bank password. You can disconnect
              anytime.
            </span>
          </div>

          <button
            type="button"
            className="onboarding-skip"
            onClick={() => navigate('/dashboard')}
          >
            Skip for now — I'll connect later
          </button>
        </div>
      </div>
    </div>
  );
}
