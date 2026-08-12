/**
 * AppLayout — sidebar + main content area.
 *
 * Wraps all authenticated pages. Sidebar on the left,
 * scrollable content on the right.
 */

import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import LoadingSkeleton from '../Shared/LoadingSkeleton';

export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <LoadingSkeleton variant="card" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
