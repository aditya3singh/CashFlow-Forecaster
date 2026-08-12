/**
 * LandingPage — marketing hero with features and trust section.
 *
 * Designed for non-technical SMB owners. Calm, reassuring, premium fintech aesthetic.
 */

import { useNavigate } from 'react-router-dom';
import { TrendingUp, Bell, PenLine, Shield, Lock, Eye } from 'lucide-react';
import Button from '../components/Shared/Button';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: TrendingUp,
    title: 'See your future balance',
    description:
      'Our forecast engine analyzes your spending patterns and projects your bank balance 2-6 weeks ahead.',
  },
  {
    icon: Bell,
    title: 'Get alerted before you\'re short',
    description:
      'Receive a friendly heads-up when your balance is projected to dip below your comfort zone.',
  },
  {
    icon: PenLine,
    title: 'Add expected income manually',
    description:
      'Know about an upcoming invoice or payment? Add it so the forecast factors it in.',
  },
];

const trustItems = [
  { icon: Shield, text: 'Bank-level encryption' },
  { icon: Eye, text: 'Read-only access' },
  { icon: Lock, text: 'We can never move your money' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => {
    navigate(user ? '/dashboard' : '/signup');
  };

  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-inner">
          <div className="landing-logo">
            <TrendingUp size={24} />
            <span>CashFlow</span>
          </div>
          <nav className="landing-nav">
            {user ? (
              <Button variant="primary" size="sm" onClick={() => navigate('/dashboard')}>
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/login')}>
                  Log in
                </Button>
                <Button variant="primary" size="sm" onClick={() => navigate('/signup')}>
                  Get started
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-content">
            <h1 className="landing-headline">
              Know your cash flow
              <br />
              <span className="landing-headline-accent">before it's a problem</span>
            </h1>
            <p className="landing-subheadline">
              CashFlow Forecaster predicts your bank balance 2-6 weeks ahead and warns you
              before a shortfall — so you can focus on running your business, not
              spreadsheets.
            </p>
            <Button variant="primary" size="lg" onClick={handleCTA}>
              Connect your bank — it's free to try
            </Button>
            <p className="landing-microcopy">
              Free 30-day trial · No credit card required · 2-minute setup
            </p>
          </div>
          <div className="landing-hero-visual">
            <div className="landing-chart-preview">
              <svg viewBox="0 0 400 200" className="landing-chart-svg">
                <defs>
                  <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4ECDC4" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#4ECDC4" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,120 C30,110 60,95 100,85 C140,75 170,70 200,80 C230,90 260,60 300,55 C340,50 370,65 400,45 L400,200 L0,200 Z"
                  fill="url(#heroGradient)"
                />
                <path
                  d="M0,120 C30,110 60,95 100,85 C140,75 170,70 200,80 C230,90 260,60 300,55 C340,50 370,65 400,45"
                  fill="none"
                  stroke="#2A6F6F"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <line x1="0" y1="160" x2="400" y2="160" stroke="#E07A5F" strokeWidth="1" strokeDasharray="6 4" />
              </svg>
              <div className="landing-chart-labels">
                <span>Today</span>
                <span>6 weeks</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-features">
        <div className="landing-features-inner">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="landing-feature-card card">
              <div className="landing-feature-icon">
                <Icon size={28} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="landing-trust">
        <div className="landing-trust-inner">
          <h2>Your data is safe with us</h2>
          <div className="landing-trust-items">
            {trustItems.map(({ icon: Icon, text }) => (
              <div key={text} className="landing-trust-item">
                <Icon size={20} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <TrendingUp size={18} />
            <span>CashFlow Forecaster</span>
          </div>
          <p>© {new Date().getFullYear()} CashFlow Forecaster. Built for small businesses.</p>
        </div>
      </footer>
    </div>
  );
}
