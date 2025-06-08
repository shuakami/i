import { useState, useCallback } from 'react';
import type { SportsActivity } from '../types';

interface SportsDataState {
  activities: SportsActivity[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
}

export function useSportsData() {
  const [state, setState] = useState<SportsDataState>({
    activities: [],
    isLoading: false,
    error: null,
    hasMore: true,
  });
  const [page, setPage] = useState(0);

  const fetchActivities = useCallback(async (pageNum: number) => {
    setState(prevState => ({ ...prevState, isLoading: true, error: null }));
    try {
      const response = await fetch(`/api/sports?page=${pageNum}`);
      if (!response.ok) {
        throw new Error('Failed to fetch sports data');
      }
      const data = await response.json();
      
      setState(prevState => ({
        ...prevState,
        isLoading: false,
        activities: pageNum === 0 ? data.activities : [...prevState.activities, ...data.activities],
        hasMore: data.nextPage !== null,
      }));
      setPage(pageNum + 1);

    } catch (err: any) {
      setState(prevState => ({ ...prevState, isLoading: false, error: err.message }));
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!state.isLoading && state.hasMore) {
      fetchActivities(page);
    }
  }, [state.isLoading, state.hasMore, page, fetchActivities]);
  
  // Initial load
  const initialLoad = useCallback(() => {
    if(state.activities.length === 0) {
        fetchActivities(0);
    }
  }, [fetchActivities, state.activities.length]);


  return { ...state, loadMore, initialLoad };
} 