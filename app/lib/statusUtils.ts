import type { HeartRateData } from "../types";

export function getAliveStatus(heartRate: HeartRateData | null, isRecentHR: boolean) {
  if (!heartRate) return { text: "未知", color: "text-neutral-500 dark:text-neutral-400" };

  const hr = heartRate.last_non_zero_hr;

  if (hr === 0 || heartRate.is_watch_off) {
    return { text: "可能挂了", color: "text-red-500 dark:text-red-400" };
  }

  if (!isRecentHR) {
    return { text: "掉线了", color: "text-neutral-500 dark:text-neutral-400" };
  }

  if (hr >= 150) {
    return { text: "快死了", color: "text-red-500 dark:text-red-400" };
  } else if (hr >= 100) {
    return { text: "在运动", color: "text-orange-500 dark:text-orange-400" };
  } else if (hr >= 60) {
    return { text: "还没死", color: "text-black dark:text-white" };
  } else if (hr >= 40) {
    return { text: "在睡觉", color: "text-blue-500 dark:text-blue-400" };
  } else {
    return { text: "可能快死了？", color: "text-red-500 dark:text-red-400" };
  }
} 