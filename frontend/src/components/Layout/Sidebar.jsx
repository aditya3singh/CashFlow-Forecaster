/**
 * Sidebar — navigation with all screens.
 *
 * Features:
 * - CashFlow Forecaster branding
 * - Dashboard / Transactions / Insights / Subscriptions / Goals / Settings
 * - "+ Add transaction" CTA at bottom
 */

import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowRightLeft,
  Settings,
  LogOut,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Target,
  Plus,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowRightLeft, label: 'Transactions' },
  { to: '/insights', icon: BarChart3, label: 'Insights' },
  { to: '/subscriptions', icon: RefreshCw, label: 'Subscriptions' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/payment-methods', icon: CreditCard, label: 'Payments' },
  { to: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ onAddTransaction }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <TrendingUp size={22} />
        </div>
        <div className="sidebar-brand">
          <span className="sidebar-app-name">CashFlow</span>
          <span className="sidebar-tagline">Forecaster</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="sidebar-add-btn"
          onClick={onAddTransaction || (() => navigate('/transactions'))}
          id="sidebar-add-transaction"
        >
          <Plus size={16} />
          <span>Add transaction</span>
        </button>

        <button className="sidebar-link sidebar-logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
