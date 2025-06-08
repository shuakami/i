import { useState, useEffect } from 'react';
import type { HeartRateData, ActivityData } from '../types';

export function useStatus() {
  const [heartRate, setHeartRate] = useState<HeartRateData | null>(null);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const [heartResponse, activityResponse] = await Promise.all([
        fetch("/api/status"),
        fetch("/api/activity"),
      ]);

      const heartData = await heartResponse.json();
      const activityData = await activityResponse.json();

      if (heartData.length > 0) {
        setHeartRate(heartData[0]);
      }

      if (activityData.length > 0) {
        setActivity(activityData[0]);
      }

      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch status:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  return { heartRate, activity, lastUpdate, isLoading };
} 