"use client"

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';

// Hooks
import { useStatus } from './hooks/useStatus';
import { usePageSwitch } from './hooks/usePageSwitch';
import { usePageEffects } from './hooks/usePageEffects';

// Components
import LoadingScreen from './components/LoadingScreen';
import StatusView from './components/StatusView';
import PredictionView from './components/PredictionView';
import SportsView from './components/SportsView';
import FooterBar from './components/FooterBar';
import GlobalStyles from './components/GlobalStyles';
import ActivityDetailModal from './components/ActivityDetailModal';
import HeartRateView from './components/HeartRateView';

// Utils & Types
import { getAliveStatus } from './lib/statusUtils';
import { getActivityDetails, predictAvailability } from './lib/activityUtils';
import type { ActivityDetails } from './types';

export default function StatusPage() {
  const sportsViewRef = useRef<HTMLDivElement>(null);
  const heartRateViewRef = useRef<HTMLDivElement>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);

  // --- HOOKS ---
  const { heartRate, activity, lastUpdate, isLoading } = useStatus();
  const { currentPage, handleTouchStart, handleTouchEnd, handleWheel } = usePageSwitch(0, sportsViewRef as React.RefObject<HTMLElement>);
  const {
    theme,
    backgroundImage,
    setBackgroundImage,
    imageLoading,
    showPage2Content,
    colorPalette,
    setColorPalette,
    loadBackgroundImage,
    getDefaultColors,
  } = usePageEffects(currentPage);

  const [isMobile, setIsMobile] = useState(false);

  // --- DERIVED STATE & MEMOS ---
  const aliveStatus = useMemo(() => {
    const isRecentHR = heartRate ? Date.now() - heartRate.last_timestamp < 300000 : false;
    return getAliveStatus(heartRate, isRecentHR);
  }, [heartRate]);

  const activityDetails: ActivityDetails | null = useMemo(() => 
    activity ? getActivityDetails(activity.window_title, activity.process_name) : null
  , [activity]);

  const currentActivity = useMemo(() => 
    activityDetails ? activityDetails.description : "未知"
  , [activityDetails]);

  const availability = useMemo(() => 
    predictAvailability(heartRate, activityDetails, activity ? activity.mouse_idle_seconds : 0)
  , [heartRate, activityDetails, activity]);


  // --- EFFECTS ---
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- RENDER ---
  if (isLoading) {
    return <LoadingScreen />;
  }

  const handleRefresh = () => {
    setBackgroundImage('');
    setColorPalette(getDefaultColors());
    setTimeout(() => {
      loadBackgroundImage();
    }, 100);
  };

  return (
    <>
    <div
      className="min-h-screen bg-white dark:bg-black text-black dark:text-white overflow-hidden fixed inset-0"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <div
        className="flex flex-col h-screen"
        style={{
            transform: `translateY(-${currentPage * 100}vh)`,
          transition: 'transform 700ms cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform'
        }}
      >
          <StatusView 
            currentActivity={currentActivity}
            aliveStatus={aliveStatus}
            heartRate={heartRate}
            theme={theme}
          />
          <PredictionView
            backgroundImage={backgroundImage}
            imageLoading={imageLoading}
            colorPalette={colorPalette}
            showPage2Content={showPage2Content}
            availability={availability}
            activity={activity}
            heartRate={heartRate}
            isMobile={isMobile}
            onRefresh={handleRefresh}
          />
          <SportsView 
            ref={sportsViewRef} 
            isActive={currentPage === 2} 
            onActivitySelect={setSelectedActivityId}
          />
          <HeartRateView ref={heartRateViewRef} isActive={currentPage === 3} />
        </div>

        <FooterBar 
          activity={activity}
          lastUpdate={lastUpdate}
          currentPage={currentPage}
          theme={theme}
          backgroundImage={backgroundImage}
          colorPalette={colorPalette}
        />
        
        <GlobalStyles />
      </div>

      <AnimatePresence>
        {selectedActivityId && (
          <ActivityDetailModal 
            activityId={selectedActivityId} 
            onClose={() => setSelectedActivityId(null)} 
          />
        )}
      </AnimatePresence>
    </>
  );
}

