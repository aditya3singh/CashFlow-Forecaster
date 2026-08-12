/**
 * useTransactions — data-fetching hook for the transactions endpoint.
 *
 * Returns { transactions, total, loading, error, refresh }
 * Supports date filtering and pagination.
 */

import { useState, useEffect, useCallback } from 'react';
import { transactionsAPI } from '../api/client';

// Demo transactions for when backend is unavailable
function generateDemoTransactions() {
  const today = new Date();
  const items = [
    { merchant_name: 'Sysco Foods', category: 'Supplies', amount: -842.5 },
    { merchant_name: 'Square Payments', category: 'Income', amount: 2340.0 },
    { merchant_name: 'PG&E', category: 'Utilities', amount: -287.35 },
    { merchant_name: 'Costco Business', category: 'Supplies', amount: -456.78 },
    { merchant_name: 'Stripe Payout', category: 'Income', amount: 1890.0 },
    { merchant_name: 'Rent - 425 Main St', category: 'Rent', amount: -3200.0 },
    { merchant_name: 'ADP Payroll', category: 'Payroll', amount: -4250.0 },
    { merchant_name: 'Shopify Payout', category: 'Income', amount: 3100.5 },
    { merchant_name: 'Comcast Business', category: 'Utilities', amount: -189.99 },
    { merchant_name: 'Cash Deposit', category: 'Income', amount: 500.0 },
    { merchant_name: 'Office Depot', category: 'Supplies', amount: -125.43 },
    { merchant_name: 'Insurance Premium', category: 'Insurance', amount: -475.0 },
  ];

  return items.map((item, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - i - 1);
    return {
      id: `demo-${i}`,
      ...item,
      date: date.toISOString().split('T')[0],
      is_manual_override: false,
      _demo: true,
    };
  });
}

export default function useTransactions(params = {}) {
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await transactionsAPI.list(params);
      const data = response.data;
      setTransactions(data.transactions || data.items || []);
      setTotal(data.total || 0);

      // Fall back to demo if empty
      if ((!data.transactions || data.transactions.length === 0) && (!data.items || data.items.length === 0)) {
        const demo = generateDemoTransactions();
        setTransactions(demo);
        setTotal(demo.length);
      }
    } catch (err) {
      console.warn('Transactions API unavailable, using demo data:', err.message);
      const demo = generateDemoTransactions();
      setTransactions(demo);
      setTotal(demo.length);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, total, loading, error, refresh: fetchTransactions };
}
