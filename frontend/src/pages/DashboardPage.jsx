/**
 * DashboardPage — the core screen with balance, chart, shortfall, and upcoming.
 *
 * New users see clean empty states with CTAs to connect bank / add transactions.
 */

import { useState } from 'react';
import { Landmark, Plus, Sparkles } from 'lucide-react';
import BalanceCard from '../components/Dashboard/BalanceCard';
import ForecastChart from '../components/Dashboard/ForecastChart';
import ShortfallBanner from '../components/Dashboard/ShortfallBanner';
import UpcomingTransactions from '../components/Dashboard/UpcomingTransactions';
import AddOverrideModal from '../components/Dashboard/AddOverrideModal';
import ConnectBankModal from '../components/Dashboard/ConnectBankModal';
import Button from '../components/Shared/Button';
import useForecast from '../hooks/useForecast';
import useTransactions from '../hooks/useTransactions';

export default function DashboardPage() {
  const { forecast, loading: forecastLoading, refresh: refreshForecast } = useForecast();
  const { transactions, loading: txnLoading, refresh: refreshTxn } = useTransactions();
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showConnectBankModal, setShowConnectBankModal] = useState(false);

  // Get upcoming transactions (manual overrides or future-dated)
  const today = new Date().toISOString().split('T')[0];
  const upcoming = transactions.filter(
    (t) => t.is_manual_override || t.date >= today
  );

  const handleOverrideSuccess = () => {
    refreshForecast();
    refreshTxn();
  };

  const handleBankConnectSuccess = () => {
    refreshForecast();
    refreshTxn();
  };

  const hasConnectedBank = !!(forecast && forecast.days && forecast.days.length > 0);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="page-title">Dashboard</h1>
        <div className="dashboard-header-actions">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowConnectBankModal(true)}
            id="dashboard-connect-bank-btn"
          >
            <Landmark size={15} />
            {hasConnectedBank ? 'Connect another bank' : 'Connect bank'}
          </Button>
        </div>
      </div>

      {/* Unconnected Welcome Banner */}
      {!forecastLoading && !hasConnectedBank && (
        <div className="dashboard-connect-banner">
          <div className="connect-banner-icon">
            <Sparkles size={20} />
          </div>
          <div className="connect-banner-info">
            <h4>Connect your bank to unlock automated 6-week forecasting</h4>
            <p>Link your account in seconds. Read-only access, bank-grade 256-bit encryption.</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowConnectBankModal(true)}
            className="connect-banner-btn"
          >
            <Landmark size={15} />
            Connect bank now
          </Button>
        </div>
      )}

      {/* Shortfall banner */}
      <ShortfallBanner shortfall={forecast?.shortfall} />

      {/* Top row: balance + upcoming */}
      <div className="dashboard-top">
        <BalanceCard
          balance={forecast?.current_balance ? parseFloat(forecast.current_balance) : null}
          bankName={forecast ? 'Connected Account' : null}
          lastSynced={forecast ? new Date().toISOString() : null}
          loading={forecastLoading}
          onConnectBank={() => setShowConnectBankModal(true)}
        />
        <UpcomingTransactions
          transactions={upcoming}
          onAddOverride={() => setShowOverrideModal(true)}
          loading={txnLoading}
        />
      </div>

      {/* Chart */}
      <ForecastChart
        data={forecast?.days}
        loading={forecastLoading}
        onConnectBank={() => setShowConnectBankModal(true)}
      />

      {/* Connect Bank Modal */}
      {showConnectBankModal && (
        <ConnectBankModal
          onClose={() => setShowConnectBankModal(false)}
          onSuccess={handleBankConnectSuccess}
        />
      )}

      {/* Override modal */}
      {showOverrideModal && (
        <AddOverrideModal
          onClose={() => setShowOverrideModal(false)}
          onSuccess={handleOverrideSuccess}
        />
      )}
    </div>
  );
}
