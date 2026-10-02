/**
 * useTransactions — data-fetching hook for the transactions endpoint.
 *
 * Returns { transactions, total, loading, error, refresh }
 * Returns empty array for new users with no transactions.
 */

import { useState, useEffect, useCallback } from 'react';
import { transactionsAPI } from '../api/client';

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
    } catch (err) {
      console.warn('Transactions API error:', err.message);
      setError(err.message);
      setTransactions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, total, loading, error, refresh: fetchTransactions };
}
