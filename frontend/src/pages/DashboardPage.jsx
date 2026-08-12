/**
 * DashboardPage — the core screen with balance, chart, shortfall, and upcoming.
 *
 * Composes BalanceCard, ForecastChart, ShortfallBanner, UpcomingTransactions,
 * and AddOverrideModal into the main dashboard layout.
 */

import { useState } from 'react';
import BalanceCard from '../components/Dashboard/BalanceCard';
import ForecastChart from '../components/Dashboard/ForecastChart';
import ShortfallBanner from '../components/Dashboard/ShortfallBanner';
import UpcomingTransactions from '../components/Dashboard/UpcomingTransactions';
import AddOverrideModal from '../components/Dashboard/AddOverrideModal';
import useForecast from '../hooks/useForecast';
import useTransactions from '../hooks/useTransactions';

export default function DashboardPage() {
  const { forecast, loading: forecastLoading, refresh: refreshForecast } = useForecast();
  const { transactions, loading: txnLoading, refresh: refreshTxn } = useTransactions();
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // Get upcoming transactions (manual overrides or future-dated)
  const today = new Date().toISOString().split('T')[0];
  const upcoming = transactions.filter(
    (t) => t.is_manual_override || t.date >= today
  );

  const handleOverrideSuccess = () => {
    refreshForecast();
    refreshTxn();
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="page-title">Dashboard</h1>
        {forecast?._demo && (
          <span className="badge badge-neutral">Demo Data</span>
        )}
      </div>

      {/* Shortfall banner */}
      <ShortfallBanner shortfall={forecast?.shortfall} />

      {/* Top row: balance + upcoming */}
      <div className="dashboard-top">
        <BalanceCard
          balance={forecast?.current_balance ? parseFloat(forecast.current_balance) : null}
          bankName="Connected Account"
          lastSynced={new Date().toISOString()}
          loading={forecastLoading}
        />
        <UpcomingTransactions
          transactions={upcoming}
          onAddOverride={() => setShowOverrideModal(true)}
          loading={txnLoading}
        />
      </div>

      {/* Chart */}
      <ForecastChart data={forecast?.days} loading={forecastLoading} />

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
