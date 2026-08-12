/**
 * SignupPage — clean centered card with email, password, business name.
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import Button from '../components/Shared/Button';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await signup(email, password, businessName);
    setLoading(false);
    if (result.success) {
      navigate('/onboarding');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-logo">
          <TrendingUp size={32} />
          <span>CashFlow</span>
        </div>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start forecasting in under 2 minutes</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="signup-business">Business name</label>
            <input
              id="signup-business"
              type="text"
              className="form-input"
              placeholder="Acme Bakery"
              value={businessName}
              onChange={(e) => { setBusinessName(e.target.value); clearError(); }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              className="form-input"
              placeholder="you@business.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              className="form-input"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError(); }}
              required
              minLength={8}
            />
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <Button
            variant="primary"
            type="submit"
            fullWidth
            loading={loading}
          >
            Create account
          </Button>

          <p className="auth-microcopy">
            Takes less than 2 minutes. No credit card required.
          </p>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
