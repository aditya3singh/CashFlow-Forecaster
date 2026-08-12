/**
 * OnboardingPage — focused screen to connect a bank account.
 *
 * 3-step progress indicator, single CTA, trust text.
 * Simulates Plaid Link (backend is sandboxed).
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleConnect = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Get link token (in production this opens Plaid Link)
      setCurrentStep(0);
      await accountsAPI.createLinkToken();

      // Simulate Plaid Link completion (sandbox mode)
      setCurrentStep(1);
      await accountsAPI.exchangeToken('public-sandbox-demo-token');

      // Step 3: Done — redirect to dashboard
      setCurrentStep(2);
      setTimeout(() => navigate('/dashboard'), 1200);
    } catch (err) {
      console.warn('Onboarding API call failed (backend may not be running):', err.message);
      // Still proceed to dashboard for demo purposes
      setCurrentStep(2);
      setTimeout(() => navigate('/dashboard'), 1200);
    } finally {
      setLoading(false);
    }
  };

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
        </div>

        {/* Skip option */}
        <button className="onboarding-skip" onClick={() => navigate('/dashboard')}>
          Skip for now — explore with demo data
        </button>
      </div>
    </div>
  );
}
