"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import type { SportsActivityDetailed } from '../types';

const ClientMap = dynamic(() => import('./ClientMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center"><p className="text-neutral-500 animate-pulse">地图加载中...</p></div>
});

// Helper for formatting time
const formatTime = (dateString: string) => new Date(dateString).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};
const formatPace = (speed_mps: number) => {
    if (speed_mps <= 0) return '–';
    const pace_spm = (1 / speed_mps) * 1000;
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
  return <div className={`text-3xl ${className}`}>{icon}</div>;
};


const Stat: React.FC<{ value: string | number; label: string; className?: string }> = ({ value, label, className }) => (
  <div className={`py-3 ${className}`}>
    <p className="text-3xl font-bold tracking-tight text-black dark:text-white">{value}</p>
    <p className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400 mt-1">{label}</p>
  </div>
);

const NoTrackDataState: React.FC<{ activity: SportsActivityDetailed }> = ({ activity }) => (
  <div className="h-full w-full bg-neutral-100 dark:bg-neutral-800/50 rounded-2xl flex flex-col items-center justify-center p-8 relative overflow-hidden">
    <div className="absolute -bottom-1/4 -right-1/4 text-[12rem] text-neutral-200/50 dark:text-neutral-900/50 opacity-50">
       <SportIcon type={activity.type} />
    </div>
    <p className="text-neutral-500 mb-4">本次运动无轨迹记录</p>
    <div className='text-center'>
       <p className="text-7xl font-bold tracking-tighter text-black dark:text-white">{(activity.total_distance / 1000).toFixed(2)}<span className='text-2xl font-medium text-neutral-500 ml-2'>km</span></p>
    </div>
  </div>
);


interface ActivityDetailModalProps {
  activityId: string;
  onClose: () => void;
}

const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({ activityId, onClose }) => {
  const [activity, setActivity] = useState<SportsActivityDetailed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!activityId) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/sports/${activityId}`);
        if (!res.ok) throw new Error('无法加载活动详情');
        const data = await res.json();
        setActivity(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [activityId]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const isRunOrWalk = activity?.type && ['run', 'walk'].includes(activity.type.toLowerCase());

  return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-6xl h-[85vh] max-h-[700px] shadow-2xl flex flex-col overflow-hidden"
        >
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center"><p className="text-neutral-500 animate-pulse">加载中...</p></div>
          ) : error || !activity ? (
            <div className="flex-1 flex items-center justify-center"><p className="text-red-500">{error || '加载失败'}</p></div>
          ) : (
            <>
              {/* Header */}
              <div className="p-6 flex justify-between items-center border-b border-neutral-200 dark:border-neutral-800 flex-shrink-0">
                <div className="flex items-center gap-3">
                   <SportIcon type={activity.type} />
                   <h2 className="text-2xl font-bold text-black dark:text-white">{activity.type}</h2>
                </div>
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  {new Date(activity.start_time).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              
              {/* Content */}
              <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                <div className="md:col-span-2 h-full w-full">
                  {activity.track_points && activity.track_points.length > 0 ? (
                      <ClientMap trackPoints={activity.track_points} />
                  ) : (
                      <NoTrackDataState activity={activity}/>
                  )}
                </div>
                <div className="flex flex-col justify-start divide-y divide-neutral-200 dark:divide-neutral-800 overflow-y-auto">
                  <Stat value={(activity.total_distance / 1000).toFixed(2)} label="公里 (km)" />
                  <Stat value={formatDuration(activity.total_time)} label="总时长" />
                  <Stat value={formatDuration(activity.moving_time)} label="移动时长" />
                  <Stat value={activity.average_heartrate > 0 ? activity.average_heartrate : '–'} label="平均心率 (bpm)" />
                   {isRunOrWalk && <Stat value={formatPace(activity.average_speed)} label="平均配速" />}
                  <Stat value={activity.elevation_gain > 0 ? `${activity.elevation_gain.toFixed(0)}m` : '–'} label="累计爬升" />
                  <Stat value={`${formatTime(activity.start_time)} - ${formatTime(activity.end_time)}`} label="起止时间" />
                </div>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
  );
};

export default ActivityDetailModal; 