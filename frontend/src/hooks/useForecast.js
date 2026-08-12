/**
 * useForecast — data-fetching hook for the forecast endpoint.
 *
 * Returns { forecast, loading, error, refresh }
 * Handles demo data fallback when backend returns empty.
 */

import { useState, useEffect, useCallback } from 'react';
import { forecastAPI } from '../api/client';

// Demo data for when no real forecast exists yet
function generateDemoForecast() {
  const today = new Date();
  const days = [];
  let balance = 12450.3;

  const weekdayPatterns = [-180, -320, -250, -150, -420, 1200, -50];

  for (let i = 0; i < 42; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();

    const variation = (Math.random() - 0.5) * 200;
    balance += weekdayPatterns[dayOfWeek] + variation;

    days.push({
      date: date.toISOString().split('T')[0],
      projected_balance: Math.round(balance * 100) / 100,
    });
  }

  return {
    current_balance: '12450.30',
    days,
    shortfall: balance < 0
      ? { date: days[days.length - 1].date, projected_balance: balance }
      : null,
    needs_onboarding: false,
    _demo: true,
  };
}

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

      // If backend says needs_onboarding or returns empty, use demo data
      if (data.needs_onboarding || !data.days || data.days.length === 0) {
        setForecast(generateDemoForecast());
      } else {
        setForecast(data);
      }
    } catch (err) {
      // On error (e.g. backend not running), fall back to demo data
      console.warn('Forecast API unavailable, using demo data:', err.message);
      setForecast(generateDemoForecast());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  return { forecast, loading, error, refresh: fetchForecast };
}
