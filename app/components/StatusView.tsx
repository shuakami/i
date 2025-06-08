import React, { useRef } from 'react';
import { useAdaptiveText } from '../hooks/useAdaptiveText';
import type { HeartRateData } from '../types';

interface StatusViewProps {
  currentActivity: string;
  aliveStatus: {
    text: string;
    color: string;
  };
  heartRate: HeartRateData | null;
  theme: string | undefined;
}

const StatusView: React.FC<StatusViewProps> = ({ currentActivity, aliveStatus, heartRate, theme }) => {
  const activityTextRef = useRef<HTMLDivElement>(null);
  
  useAdaptiveText({
    ref: activityTextRef,
    text: currentActivity,
    minFontSize: 36,
  });

  return (
    <div className="h-screen w-full flex-shrink-0 overflow-hidden relative">
      <div className="max-w-4xl mx-auto px-8 py-20">
        <div className="space-y-16">
          <div className="space-y-4 mt-20">
            <div 
              className="text-lg font-medium text-neutral-500 dark:text-neutral-400 tracking-wide"
              style={{
                animation: 'fadeInUp 0.6s ease-out',
                animationFillMode: 'both'
              }}
            >
              现在在
            </div>
            <div 
              ref={activityTextRef}
              className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light leading-none tracking-tight"
              style={{
                animation: 'fadeInUp 0.8s ease-out 0.1s',
                animationFillMode: 'both'
              }}
            >
              {currentActivity}
            </div>
          </div>

          <div className="space-y-4">
            <div 
              className="text-lg font-medium text-neutral-500 dark:text-neutral-400 tracking-wide"
              style={{
                animation: 'fadeInUp 1s ease-out 0.2s',
                animationFillMode: 'both'
              }}
            >
              状态
            </div>
            <div 
              className={`text-6xl md:text-7xl font-light leading-none ${aliveStatus.color}`}
              style={{
                animation: 'fadeInUp 1.2s ease-out 0.3s',
                animationFillMode: 'both'
              }}
            >
              {aliveStatus.text}
              {heartRate && heartRate.last_non_zero_hr > 0 && (
                <span className="text-2xl sm:text-3xl md:text-4xl text-neutral-400 dark:text-neutral-500 ml-8">
                  {heartRate.last_non_zero_hr} bpm
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusView; 