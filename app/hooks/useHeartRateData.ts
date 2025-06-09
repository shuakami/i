import { useState, useEffect, useCallback } from 'react';

export interface HourlyHeartRate {
    hour: number;
    min_hr: number | null;
    max_hr: number | null;
}

export interface HeartRateStats {
    min: number;
    max: number;
    avg: number;
}

export interface HeartRateData {
    date: string;
    hourlyData: HourlyHeartRate[];
    stats: HeartRateStats;
}

interface HeartRateState {
    data: HeartRateData | null;
    isLoading: boolean;
    error: string | null;
}

export function useHeartRateData(date?: string) {
    const [state, setState] = useState<HeartRateState>({
        data: null,
        isLoading: true,
        error: null,
    });

    const fetchData = useCallback(async () => {
        setState(prevState => ({ ...prevState, isLoading: true, error: null }));
        try {
            const url = date ? `/api/heartrate?date=${date}` : '/api/heartrate';
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error('Failed to fetch heart rate data');
            }

            const data: HeartRateData = await response.json();
            
            setState({
                data,
                isLoading: false,
                error: null,
            });

        } catch (err: any) {
            setState({ data: null, isLoading: false, error: err.message });
        }
    }, [date]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { ...state, refetch: fetchData };
} 