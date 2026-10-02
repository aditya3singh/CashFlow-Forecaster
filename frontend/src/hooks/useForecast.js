/**
 * useForecast — data-fetching hook for the forecast endpoint.
 *
 * Returns { forecast, loading, error, refresh }
 * Returns null forecast when no data exists (new user).
 */

import { useState, useEffect, useCallback } from 'react';
import { forecastAPI } from '../api/client';

export default function useForecast() {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await forecastAPI.getForecast();
      const data = response.data;

      if (data.needs_onboarding || !data.days || data.days.length === 0) {
        // New user with no bank connected — return null
        setForecast(null);
      } else {
        setForecast(data);
      }
    } catch (err) {
      console.warn('Forecast API error:', err.message);
      setError(err.message);
      setForecast(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  return { forecast, loading, error, refresh: fetchForecast };
}
