/**
 * SettingsPage — connected bank, alert preferences, account settings.
 *
 * Shows real bank accounts from API. Empty state with CTA if none connected.
 * Alert preferences persist to localStorage.
 * Two-column layout for alert settings with category-level toggles.
 */

import { useState, useEffect } from 'react';
import { Landmark, Bell, User, LogOut, RefreshCw, CheckCircle, Wifi, Mail, Smartphone, Plus } from 'lucide-react';
import Button from '../components/Shared/Button';
import { useAuth } from '../context/AuthContext';
import { accountsAPI } from '../api/client';
import { useNavigate } from 'react-router-dom';

const CATEGORY_NOTIFICATIONS = [
  { id: 'payroll', label: 'Payroll', description: 'Salaries, bonuses, contractors', defaultOn: true },
  { id: 'rent', label: 'Rent & Lease', description: 'Office space, equipment leasing', defaultOn: false },
  { id: 'utilities', label: 'Utilities', description: 'Power, water, internet services', defaultOn: false },
  { id: 'software', label: 'Software & SaaS', description: 'Cloud services, software subscriptions', defaultOn: true },
  { id: 'marketing', label: 'Marketing', description: 'Ads, promotions, agency fees', defaultOn: false },
  { id: 'travel', label: 'Travel & Expense', description: 'Flights, hotels, client meals', defaultOn: true },
];

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);

  // Load persisted preferences from localStorage
  const [alertThreshold, setAlertThreshold] = useState(() => {
    return localStorage.getItem('cf_alert_threshold') || '1000';
  });
  const [alertsEnabled, setAlertsEnabled] = useState(() => {
    return localStorage.getItem('cf_alerts_enabled') !== 'false';
  });
  const [emailNotif, setEmailNotif] = useState(() => {
    return localStorage.getItem('cf_email_notif') !== 'false';
  });
  const [pushNotif, setPushNotif] = useState(() => {
    return localStorage.getItem('cf_push_notif') !== 'false';
  });
  const [categoryToggles, setCategoryToggles] = useState(() => {
    try {
      const saved = localStorage.getItem('cf_category_toggles');
      return saved ? JSON.parse(saved) : Object.fromEntries(
        CATEGORY_NOTIFICATIONS.map(c => [c.id, c.defaultOn])
      );
    } catch {
      return Object.fromEntries(CATEGORY_NOTIFICATIONS.map(c => [c.id, c.defaultOn]));
    }
  });

  const [saved, setSaved] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');

  // Load real accounts from API
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await accountsAPI.listAccounts();
        const real = response.data.accounts || response.data || [];
        setAccounts(real);
      } catch {
        setAccounts([]);
      } finally {
        setAccountsLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  // Load alert_threshold from user profile if available
  useEffect(() => {
    if (user?.alert_threshold != null) {
      setAlertThreshold(String(user.alert_threshold));
    }
  }, [user]);

  const handleSavePreferences = () => {
    // Persist everything to localStorage
    localStorage.setItem('cf_alert_threshold', alertThreshold);
    localStorage.setItem('cf_alerts_enabled', String(alertsEnabled));
    localStorage.setItem('cf_email_notif', String(emailNotif));
    localStorage.setItem('cf_push_notif', String(pushNotif));
    localStorage.setItem('cf_category_toggles', JSON.stringify(categoryToggles));

    setSavedMessage('Preferences saved');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleCategory = (id) => {
    setCategoryToggles(prev => ({ ...prev, [id]: !prev[id] }));
    setSaved(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="settings-page">
      <h1 className="page-title">Settings</h1>

      {/* ── Connected Banks ── */}
      <section className="settings-section card">
        <div className="settings-section-header">
          <Landmark size={20} />
          <h2>Connected Banks</h2>
        </div>

        {accountsLoading ? (
          <div style={{ padding: '1rem 0' }}>
            <div className="skeleton" style={{ height: 60, borderRadius: 8 }} />
          </div>
        ) : accounts.length === 0 ? (
          <div className="settings-empty-banks">
            <Landmark size={32} style={{ color: 'var(--color-text-light)', marginBottom: '0.75rem' }} />
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              No bank accounts connected yet. Connect your bank to start tracking transactions automatically.
            </p>
            <Button variant="primary" size="sm" onClick={() => navigate('/onboarding')}>
              <Plus size={16} /> Connect Your Bank
            </Button>
          </div>
        ) : (
          <>
            <ul className="settings-accounts">
              {accounts.map((acct) => (
                <li key={acct.id} className="settings-account-row">
                  <div className="settings-account-icon">
                    <Landmark size={18} />
                  </div>
                  <div className="settings-account-info">
                    <span className="settings-account-name">{acct.institution_name}</span>
                    <span className="settings-account-detail">
                      {acct.account_name}
                      {acct.last_synced_at && (
                        <>
                          {' · '}
                          <RefreshCw size={11} style={{ display: 'inline', verticalAlign: 'middle' }} />
                          {' '}Synced {timeAgo(acct.last_synced_at)}
                        </>
                      )}
                    </span>
                  </div>
                  <div className="settings-account-actions">
                    <span className={`badge ${acct.status === 'active' ? 'badge-success' : acct.status === 'reauth_required' ? 'badge-warning' : 'badge-danger'}`}>
                      {acct.status === 'active' ? 'Active' : acct.status === 'reauth_required' ? 'Reconnect' : 'Error'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="settings-bank-footer">
              <Button variant="secondary" size="sm" onClick={() => navigate('/onboarding')}>
                + Connect Another Bank
              </Button>
            </div>
          </>
        )}
      </section>

      {/* ── Alert Preferences (2-col) ── */}
      <section className="settings-section card">
        <div className="settings-section-header">
          <Bell size={20} />
          <h2>Alert Preferences</h2>
        </div>

        <div className="settings-alerts-grid">
          {/* Left col: threshold + delivery */}
          <div className="settings-alerts-left">
            <div className="settings-threshold-card">
              <p className="settings-threshold-desc">
                Get notified when your projected balance drops below your threshold.
              </p>

              <div className="settings-row">
                <div className="settings-row-info">
                  <span className="settings-row-label">Enable shortfall alerts</span>
                </div>
                <label className="toggle" htmlFor="alerts-toggle">
                  <input
                    id="alerts-toggle"
                    type="checkbox"
                    checked={alertsEnabled}
                    onChange={(e) => { setAlertsEnabled(e.target.checked); setSaved(false); }}
                  />
                  <span className="toggle-slider" />
                </label>
              </div>

              {alertsEnabled && (
                <div className="settings-row settings-threshold-row">
                  <div className="settings-row-info">
                    <span className="settings-row-label">Alert threshold</span>
                    <span className="settings-row-detail">Alert me if balance drops below this amount</span>
                  </div>
                  <div className="input-with-prefix settings-threshold-input">
                    <span className="input-prefix">$</span>
                    <input
                      type="number"
                      className="form-input input-prefixed"
                      value={alertThreshold}
                      onChange={(e) => { setAlertThreshold(e.target.value); setSaved(false); }}
                      min="0"
                      step="100"
                      style={{ width: '140px' }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Delivery Methods */}
            <div className="settings-delivery-card">
              <h3 className="settings-delivery-title">Delivery Methods</h3>
              <div className="settings-delivery-row">
                <div className="settings-delivery-info">
                  <Mail size={16} className="settings-delivery-icon" />
                  <div>
                    <span className="settings-row-label">Email Notifications</span>
                    <span className="settings-row-detail">Daily digests and critical alerts</span>
                  </div>
                </div>
                <label className="toggle" htmlFor="email-toggle">
                  <input id="email-toggle" type="checkbox" checked={emailNotif}
                    onChange={(e) => { setEmailNotif(e.target.checked); setSaved(false); }} />
                  <span className="toggle-slider" />
                </label>
              </div>
              <div className="settings-delivery-row">
                <div className="settings-delivery-info">
                  <Smartphone size={16} className="settings-delivery-icon" />
                  <div>
                    <span className="settings-row-label">Push Notifications</span>
                    <span className="settings-row-detail">Real-time mobile alerts</span>
                  </div>
                </div>
                <label className="toggle" htmlFor="push-toggle">
                  <input id="push-toggle" type="checkbox" checked={pushNotif}
                    onChange={(e) => { setPushNotif(e.target.checked); setSaved(false); }} />
                  <span className="toggle-slider" />
                </label>
              </div>
            </div>
          </div>

          {/* Right col: Category Notifications */}
          <div className="settings-alerts-right">
            <h3 className="settings-category-title">Category Notifications</h3>
            <p className="settings-category-desc">
              Enable alerts for specific spending categories when unusually high transactions occur.
            </p>
            <div className="settings-category-list">
              {CATEGORY_NOTIFICATIONS.map((cat) => (
                <div key={cat.id} className="settings-category-row">
                  <div className="settings-row-info">
                    <span className="settings-row-label">{cat.label}</span>
                    <span className="settings-row-detail">{cat.description}</span>
                  </div>
                  <label className="toggle" htmlFor={`cat-${cat.id}`}>
                    <input
                      id={`cat-${cat.id}`}
                      type="checkbox"
                      checked={!!categoryToggles[cat.id]}
                      onChange={() => toggleCategory(cat.id)}
                    />
                    <span className="toggle-slider" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save button + feedback */}
        <div className="settings-save-row">
          <Button variant="primary" size="sm" onClick={handleSavePreferences}>
            {saved ? (
              <>
                <CheckCircle size={15} />
                {savedMessage}
              </>
            ) : (
              'Save Preferences'
            )}
          </Button>
          {saved && (
            <span className="settings-saved-hint">
              Your notification preferences have been saved.
            </span>
          )}
        </div>
      </section>

      {/* ── Account ── */}
      <section className="settings-section card">
        <div className="settings-section-header">
          <User size={20} />
          <h2>Account</h2>
        </div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Email</span>
            <span className="settings-row-detail">{user?.email || '—'}</span>
          </div>
        </div>

        {user?.business_name && (
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">Business</span>
              <span className="settings-row-detail">{user.business_name}</span>
            </div>
          </div>
        )}

        <hr className="divider" />

        <Button variant="danger" size="sm" onClick={handleLogout}>
          <LogOut size={16} />
          Log out
        </Button>
      </section>
    </div>
  );
}
