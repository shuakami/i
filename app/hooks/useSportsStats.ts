import { useState, useEffect } from 'react';

export interface SportStats {
    totalActivities: number;
    totalDistance: number; // in meters
    totalTime: number; // in seconds
}

export interface AllSportStats {
    allTime: SportStats;
    year: SportStats;
    month: SportStats;
}

interface SportsStatsState {
  stats: AllSportStats | null;
  isLoading: boolean;
  error: string | null;
}

export function useSportsStats() {
  const [state, setState] = useState<SportsStatsState>({
    stats: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      setState(prevState => ({ ...prevState, isLoading: true, error: null }));
      try {
        const response = await fetch('/api/sports/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch sports statistics');
        }
        const data: AllSportStats = await response.json();
        
        setState({
          isLoading: false,
          stats: data,
          error: null,
        });

      } catch (err: any) {
        setState({ stats: null, isLoading: false, error: err.message });
      }
    };

    fetchStats();
  }, []); // Runs once on component mount

  return state;
} 