import React, { useRef } from 'react';
import { useAdaptiveText } from '../hooks/useAdaptiveText';
import type { ActivityData, HeartRateData, ColorPalette } from '../types';

interface PredictionViewProps {
  backgroundImage: string;
  imageLoading: boolean;
  colorPalette: ColorPalette;
  showPage2Content: boolean;
  availability: {
    status: string;
    reason: string;
  };
  activity: ActivityData | null;
  heartRate: HeartRateData | null;
  isMobile: boolean;
  onRefresh: () => void;
}

const PredictionView: React.FC<PredictionViewProps> = ({
  backgroundImage,
  imageLoading,
  colorPalette,
  showPage2Content,
  availability,
  activity,
  heartRate,
  isMobile,
  onRefresh
}) => {
  const reasonTextRef = useRef<HTMLDivElement>(null);
  
  useAdaptiveText({
    ref: reasonTextRef,
    text: availability.reason,
    minFontSize: 16,
    isMobile: isMobile,
    maxLines: 2,
  });

  return (
    <div className="h-screen w-full flex-shrink-0 relative overflow-hidden bg-white dark:bg-black">
      {/* Background Image */}
      {backgroundImage && (
        <div 
          className="absolute inset-0 transition-opacity duration-1000"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            opacity: imageLoading ? 0 : 1,
          }}
        />
      )}

      {/* Background Overlay */}
      {backgroundImage && (
        <div
          className="absolute inset-0 backdrop-blur-[2px] transition-opacity duration-1000"
          style={{ 
            backgroundColor: colorPalette.primary,
            opacity: imageLoading ? 0 : 1,
          }}
        />
      )}

      {/* Content */}
      <div
        className="relative z-10 max-w-4xl mx-auto px-8 py-20"
        style={{ 
          opacity: showPage2Content ? 1 : 0,
          transform: showPage2Content ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform, opacity'
        }}
      >
        <div className="space-y-16 mt-15">
          <div className="space-y-4">
            <div
              className="text-lg font-medium tracking-wide"
              style={{ 
                color: colorPalette.textSecondary,
                transition: 'color 0.5s ease',
                animation: 'fadeInUp 0.6s ease-out',
                animationFillMode: 'both'
              }}
            >
              预测
            </div>
            <div
              className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-light leading-none tracking-tight"
              style={{
                color: colorPalette.text,
                transition: 'color 0.5s ease',
                animation: 'fadeInUp 0.8s ease-out 0.1s',
                animationFillMode: 'both',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {availability.status}
            </div>
          </div>

          <div className="space-y-4">
            <div
              className="text-lg font-medium tracking-wide"
              style={{ 
                color: colorPalette.textSecondary,
                transition: 'color 0.5s ease',
                animation: 'fadeInUp 1s ease-out 0.2s',
                animationFillMode: 'both'
              }}
            >
              原因
            </div>
            <div
              ref={reasonTextRef}
              className="text-3xl md:text-4xl font-light leading-relaxed"
              style={{ 
                color: colorPalette.textSecondary,
                transition: 'color 0.5s ease',
                animation: 'fadeInUp 1.2s ease-out 0.3s',
                animationFillMode: 'both'
              }}
            >
              {availability.reason}
            </div>
          </div>

          {/* Details */}
          {activity && (
            <div
              className="space-y-6"
              style={{ 
                color: colorPalette.textSecondary,
                transition: 'color 0.5s ease',
                animation: 'fadeInUp 1.4s ease-out 0.4s',
                animationFillMode: 'both'
              }}
            >
              <div className="text-lg">
                {activity.mouse_idle_seconds < 60
                  ? "鼠标状态: 活跃中"
                  : `鼠标闲置: ${Math.floor(activity.mouse_idle_seconds / 60)}分钟`}
              </div>
              {heartRate && <div className="text-lg">心率: {heartRate.last_non_zero_hr} BPM</div>}
            </div>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        disabled={imageLoading}
        className="absolute top-8 left-8 z-20 p-3 rounded-full transition-all hover:scale-110 disabled:opacity-50 hidden md:block"
        style={{ 
          color: colorPalette.text,
          transition: 'all 0.3s ease',
          opacity: showPage2Content ? 1 : 0,
        }}
      >
        <svg
          className={`w-5 h-5 ${imageLoading ? "animate-spin" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
      </button>
    </div>
  );
};

export default PredictionView; 