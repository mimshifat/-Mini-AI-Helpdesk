import { useState, useEffect, useCallback } from 'react';
import { dashboardApi } from '../api/dashboard';
import { ticketsApi } from '../api/tickets';

/**
 * useDashboard
 * Fetches and manages aggregated stats and recent tickets for the dashboard.
 */
export function useDashboard() {
  const [stats, setStats] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, ticketsData] = await Promise.all([
        dashboardApi.getStats(),
        ticketsApi.getTickets({ page: 1 }),
      ]);
      setStats(statsData);
      setRecentTickets(ticketsData.results ? ticketsData.results.slice(0, 5) : []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError(err.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    stats,
    recentTickets,
    loading,
    error,
    refresh: loadData,
  };
}
