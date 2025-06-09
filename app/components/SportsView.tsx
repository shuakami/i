import React, { useEffect, forwardRef, UIEvent } from 'react';
import { useSportsData } from '../hooks/useSportsData';
import type { SportsActivity } from '../types';
import { AnimatePresence, motion } from 'framer-motion';
import ActivityDetailModal from './ActivityDetailModal';
import StatsSummary from './StatsSummary';
import ActivityItemSkeleton from './ActivityItemSkeleton';

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  return { day, month };
};

// New Pace Calculator for Run/Walk
const formatPace = (speed_mps: number) => {
  if (speed_mps <= 0) return '-';
  const pace_spm = (1 / speed_mps) * 1000; // seconds per meter -> seconds per km
  const pace_min = Math.floor(pace_spm / 60);
  const pace_sec = Math.round(pace_spm % 60);
  return `${pace_min}'${pace_sec.toString().padStart(2, '0')}"`;
};

const SportIcon: React.FC<{ type: string; className?: string }> = ({ type, className = "" }) => {
  let icon;
  switch (type.toLowerCase()) {
    case 'run': icon = '🏃'; break;
    case 'walk': icon = '🚶'; break;
    case 'ride': icon = '🚴'; break;
    default: icon = '🏆';
  }
  return <div className={`text-2xl ${className}`}>{icon}</div>;
};

const ActivityItem: React.FC<{ activity: SportsActivity; onClick: () => void }> = ({ activity, onClick }) => {
  const isRunOrWalk = ['run', 'walk'].includes(activity.type.toLowerCase());
  const { day, month } = formatDate(activity.start_time);

  return (
    <div 
      onClick={onClick}
      className="flex gap-4 items-start py-6 -mx-6 px-6 transition-colors duration-300 hover:bg-neutral-100 dark:hover:bg-neutral-900/50 cursor-pointer"
    >
      {/* Date */}
      <div className="text-center w-14 flex-shrink-0">
        <p className="text-3xl font-bold text-black dark:text-white">{day}</p>
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase">{month}</p>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 w-full">
        {/* Type and secondary stats on top for mobile */}
        <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 text-lg font-bold tracking-tight text-black dark:text-white">
              <SportIcon type={activity.type} />
              {activity.type}
            </div>

            <div className="flex gap-x-4 text-right text-sm">
                <div className="min-w-[4rem]">
                    <div className="font-semibold text-black dark:text-white">{formatDuration(activity.total_time)}</div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase">时长</div>
                </div>
                 <div className="min-w-[4rem]">
                    {isRunOrWalk ? (
                        <>
                            <div className="font-semibold text-black dark:text-white">{formatPace(activity.average_speed)}</div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase">配速</div>
                        </>
                    ) : (
                        <>
                            <div className="font-semibold text-black dark:text-white">{activity.average_heartrate}</div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase">心率</div>
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* Hero stat */}
        <div className="leading-none">
          <span className="text-6xl md:text-7xl font-bold tracking-tighter text-black dark:text-white">
            {(activity.total_distance / 1000).toFixed(2)}
          </span>
          <span className="text-xl ml-1 font-medium text-neutral-500 dark:text-neutral-400">km</span>
        </div>
      </div>
    </div>
  );
};

interface SportsViewProps {
  isActive: boolean;
  onActivitySelect: (id: string) => void;
}

const SportsView = forwardRef<HTMLDivElement, SportsViewProps>(({ isActive, onActivitySelect }, ref) => {
  const { activities, isLoading, hasMore, loadMore, initialLoad, error } = useSportsData();

  useEffect(() => {
    if (isActive) {
      initialLoad();
    }
  }, [isActive, initialLoad]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!ref || typeof ref === 'function' || !ref.current) return;

    const { scrollTop, scrollHeight, clientHeight } = ref.current;
    const isAtTop = scrollTop === 0;
    const isAtBottom = scrollHeight - scrollTop === clientHeight;

    // If scrolling up but not at top, or scrolling down but not at bottom, stop propagation.
    if ((e.deltaY < 0 && !isAtTop) || (e.deltaY > 0 && !isAtBottom)) {
      e.stopPropagation();
    }
  };

  const isInitialLoading = isLoading && activities.length === 0;

  return (
    <div 
      ref={ref} 
      onWheel={handleWheel}
      className="h-screen w-full flex-shrink-0 relative overflow-y-auto bg-neutral-50 dark:bg-black p-4 scroll-smooth"
    >
      <div className="max-w-4xl mx-auto px-6 pt-20 pb-24">
        <div className="mb-8 -mx-6">
          <h1 
            className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter text-black dark:text-white"
            style={{ animation: 'fadeInUp 0.6s ease-out', animationFillMode: 'both' }}
          >
            运动
          </h1>
          <p 
            className="text-lg text-neutral-500 dark:text-neutral-400 mt-4"
            style={{ animation: 'fadeInUp 0.7s ease-out 0.1s', animationFillMode: 'both' }}
          >
            Sports
          </p>
        </div>
        
        {/* Wrap StatsSummary to align with the list items below */}
        <div className="py-8 -mx-6">
          <StatsSummary />
        </div>

        <div className="flex flex-col [&>:first-child]:border-t-0">
          {isInitialLoading ? (
            <>
              <ActivityItemSkeleton />
              <ActivityItemSkeleton />
              <ActivityItemSkeleton />
              <ActivityItemSkeleton />
            </>
          ) : (
            activities.map((act, index) => (
              <motion.div
                key={act.id}
                className="border-t border-neutral-200 dark:border-neutral-800"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.05 }}
              >
                <ActivityItem activity={act} onClick={() => onActivitySelect(act.id)} />
              </motion.div>
            ))
          )}
        </div>
        
        {isLoading && !isInitialLoading && <div className="text-center p-8 text-neutral-500">加载中...</div>}
        
        {error && <div className="text-center p-8 text-red-500">加载失败: {error}</div>}

        {!isLoading && hasMore && (
          <div className="flex justify-center mt-10">
            <button 
              onClick={loadMore}
              className="bg-black dark:bg-white text-white dark:text-black font-semibold py-3 px-6 rounded-full transition-transform hover:scale-105 shadow-lg"
            >
              加载更多
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

SportsView.displayName = 'SportsView';

export default SportsView; 