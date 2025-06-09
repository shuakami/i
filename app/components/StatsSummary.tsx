"use client";

import { useState, useEffect } from 'react';
import { useSportsStats } from '../hooks/useSportsStats';
import type { SportStats } from '../hooks/useSportsStats';
import { motion, useAnimation, useMotionValue, animate } from 'framer-motion';

// Custom hook for animating a number
function useAnimatedCounter(to: number, isInteger: boolean = false, duration: number = 0.5) {
    const count = useMotionValue(0);
    const rounded = useMotionValue(0);

    useEffect(() => {
        const controls = animate(count, to, {
            duration,
            ease: 'circOut',
            onUpdate: latest => {
                 rounded.set(isInteger ? Math.round(latest) : parseFloat(latest.toFixed(1)));
            }
        });
        return controls.stop;
    }, [to, count, rounded, isInteger, duration]);

    return rounded;
}

const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

const StatCard: React.FC<{ label: string; value: number; unit: string; isVisible: boolean; isInteger?: boolean; isTime?: boolean; }> = ({ label, value, unit, isVisible, isInteger = false, isTime = false }) => {
    const animatedValue = useAnimatedCounter(value, isInteger);
    const controls = useAnimation();

    // Animate the blur effect on the number
    useEffect(() => {
        if (!isVisible) {
            controls.start({ filter: 'blur(5px)', opacity: 0.5, transition: { duration: 0.15 } });
        } else {
            controls.start({ filter: 'blur(0px)', opacity: 1, transition: { duration: 0.2, delay: 0.1 } });
        }
    }, [isVisible, controls]);

    return (
        <div className="flex flex-row justify-between items-center rounded-lg bg-neutral-100 dark:bg-neutral-900 p-4 sm:flex-col sm:justify-center sm:p-4">
            <p className="text-sm sm:text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</p>
            <div className="flex items-baseline sm:mt-1">
                <motion.p 
                    className="text-2xl sm:text-3xl font-bold text-black dark:text-white"
                    animate={controls}
                >
                    {isTime ? formatDuration(value) : animatedValue}
                </motion.p>
                <p className="text-xs sm:text-sm font-medium text-neutral-500 dark:text-neutral-400 ml-0.5 sm:ml-1">{unit}</p>
            </div>
        </div>
    );
};

const StatsDisplay: React.FC<{ stats: SportStats; isVisible: boolean }> = ({ stats, isVisible }) => {
    return (
        <motion.div
            className="flex flex-col gap-3 sm:grid sm:grid-cols-3 sm:gap-4"
        >
            <StatCard label="距离" value={stats.totalDistance / 1000} unit="km" isVisible={isVisible} />
            <StatCard label="时长" value={stats.totalTime} unit="" isTime={true} isVisible={isVisible} />
            <StatCard label="次数" value={stats.totalActivities} unit="次" isInteger={true} isVisible={isVisible} />
        </motion.div>
    );
};

const StatsSummary = () => {
    const { stats, isLoading, error } = useSportsStats();
    const [activeTab, setActiveTab] = useState<'month' | 'year' | 'allTime'>('month');
    const [isAnimating, setIsAnimating] = useState(false);
    
    const handleTabClick = (tab: 'month' | 'year' | 'allTime') => {
        if (tab === activeTab || isAnimating) return;

        setIsAnimating(true);
        // Let the blur animation run
        setTimeout(() => {
            setActiveTab(tab);
            // After setting the new tab, wait for the content to re-render and then unblur
            setTimeout(() => {
                setIsAnimating(false);
            }, 50); // A short delay for re-render
        }, 150);
    };

    if (isLoading) {
        return (
            <div className="mb-12 animate-pulse">
                <div className="h-8 w-48 bg-neutral-200 dark:bg-neutral-800 rounded-md mb-4"></div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="h-20 bg-neutral-200 dark:bg-neutral-800 rounded-lg"></div>
                    <div className="h-20 bg-neutral-200 dark:bg-neutral-800 rounded-lg"></div>
                    <div className="h-20 bg-neutral-200 dark:bg-neutral-800 rounded-lg"></div>
                </div>
            </div>
        );
    }
    
    if (error || !stats) {
        return <div className="text-center text-red-500">统计数据加载失败。</div>;
    }
    
    const tabs = [
        { id: 'month', label: '本月' },
        { id: 'year', label: '今年' },
        { id: 'allTime', label: '全部' },
    ] as const;

    const currentStats = stats[activeTab];

    return (
        <div style={{ animation: 'fadeInUp 0.8s ease-out 0.2s', animationFillMode: 'both' }}>
            <div className="flex justify-start mb-6">
                <div className="flex items-center p-1 rounded-full bg-neutral-200/75 dark:bg-neutral-800/75">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabClick(tab.id)}
                            className={`${
                                activeTab === tab.id ? 'text-black dark:text-white' : 'text-neutral-500 dark:text-neutral-400'
                            } relative rounded-full px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus:outline-none`}
                            style={{ WebkitTapHighlightColor: "transparent" }}
                        >
                            {activeTab === tab.id && (
                                <motion.span
                                    layoutId="stats_bubble"
                                    className="absolute inset-0 z-10 bg-white dark:bg-neutral-900/75"
                                    style={{ borderRadius: 9999 }}
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                                />
                            )}
                            <span className="relative z-20">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            <StatsDisplay stats={currentStats} isVisible={!isAnimating} />
        </div>
    );
};

export default StatsSummary; 