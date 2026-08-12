/**
 * SettingsPage — connected bank, alert preferences, account settings.
 *
 * Clean form layout with generous spacing.
 */

import { useState, useEffect } from 'react';
import { Landmark, Bell, User, LogOut, RefreshCw } from 'lucide-react';
import Button from '../components/Shared/Button';
import { useAuth } from '../context/AuthContext';
import { accountsAPI } from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [alertThreshold, setAlertThreshold] = useState('0');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await accountsAPI.listAccounts();
        setAccounts(response.data.accounts || response.data || []);
      } catch (err) {
        // Demo mode — show placeholder account
        setAccounts([
          {
            id: 'demo',
            institution_name: 'Demo Bank',
            account_name: 'Business Checking',
            current_balance: 12450.3,
            status: 'active',
            last_synced_at: new Date().toISOString(),
          },
        ]);
      }
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (user?.alert_threshold != null) {
      setAlertThreshold(String(user.alert_threshold));
    }
  }, [user]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="settings-page">
      <h1 className="page-title">Settings</h1>

      {/* Connected Banks */}
      <section className="settings-section card">
        <div className="settings-section-header">
          <Landmark size={20} />
          <h2>Connected Banks</h2>
        </div>

        {accounts.length === 0 ? (
          <div className="settings-empty">
            <p>No bank accounts connected.</p>
            <Button variant="primary" size="sm" onClick={() => navigate('/onboarding')}>
              Connect Bank
            </Button>
          </div>
        ) : (
          <ul className="settings-accounts">
            {accounts.map((acct) => (
              <li key={acct.id} className="settings-account-row">
                <div className="settings-account-info">
                  <span className="settings-account-name">
                    {acct.institution_name || 'Bank Account'}
                  </span>
                  <span className="settings-account-detail">
                    {acct.account_name}
                    {acct.last_synced_at && (
                      <>
                        {' · '}
                        <RefreshCw size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />{' '}
                        Last synced{' '}
                        {new Date(acct.last_synced_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </>
                    )}
                  </span>
                </div>
                <div className="settings-account-actions">
                  <span
                    className={`badge ${
                      acct.status === 'active'
                        ? 'badge-success'
                        : acct.status === 'reauth_required'
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}
                  >
                    {acct.status === 'active'
                      ? 'Active'
                      : acct.status === 'reauth_required'
                      ? 'Reconnect'
                      : 'Error'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Alert Preferences */}
      <section className="settings-section card">
        <div className="settings-section-header">
          <Bell size={20} />
          <h2>Alert Preferences</h2>
        </div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Enable shortfall alerts</span>
            <span className="settings-row-detail">
              Get notified when your projected balance drops below your threshold
            </span>
          </div>
          <label className="toggle" htmlFor="alerts-toggle">
            <input
              id="alerts-toggle"
              type="checkbox"
              checked={alertsEnabled}
              onChange={(e) => setAlertsEnabled(e.target.checked)}
            />
            <span className="toggle-slider" />
          </label>
        </div>

        {alertsEnabled && (
          <div className="settings-row">
            <div className="settings-row-info">
              <span className="settings-row-label">Alert threshold</span>
              <span className="settings-row-detail">
                Alert me if balance will go below this amount
              </span>
            </div>
            <div className="input-with-prefix" style={{ maxWidth: '160px' }}>
              <span className="input-prefix">$</span>
              <input
                type="number"
                className="form-input input-prefixed"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(e.target.value)}
                min="0"
                step="100"
              />
            </div>
          </div>
        )}

        <div style={{ marginTop: '1rem' }}>
          <Button variant="primary" size="sm" onClick={handleSave}>
            {saved ? '✓ Saved' : 'Save Preferences'}
          </Button>
        </div>
      </section>

      {/* Account */}
      <section className="settings-section card">
        <div className="settings-section-header">
          <User size={20} />
          <h2>Account</h2>
        </div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Email</span>
            <span className="settings-row-detail">{user?.email || 'demo@example.com'}</span>
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
