"use client";
import React, { forwardRef, useEffect, useState, useMemo } from 'react';
import { useHeartRateData } from '../hooks/useHeartRateData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, useMotionValue, animate, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// --- Custom Hook for Number Animation ---
function useAnimatedCounter(to: number) {
    const count = useMotionValue(to);

    useEffect(() => {
        const controls = animate(count, to, {
            duration: 0.6,
            ease: 'easeOut',
        });
        return controls.stop;
    }, [to, count]);

    return count;
}

// --- Live HR Display ---
const LiveHeartRateDisplay = ({ value, isHovering }: { value: number, isHovering: boolean }) => {
    const animatedValue = useAnimatedCounter(value);
    const roundedValue = useMotionValue(value.toFixed(0));

    useEffect(() => {
        const unsubscribe = animatedValue.on("change", (latest) => {
            roundedValue.set(latest.toFixed(0));
        });
        return unsubscribe;
    }, [animatedValue, roundedValue]);

    return (
        <div className="absolute top-20 right-6 md:right-10 text-right pointer-events-none">
             <motion.p 
                className="text-7xl lg:text-8xl font-bold tracking-tighter text-black dark:text-white"
                animate={{ 
                    color: isHovering ? '#f87171' : (document.documentElement.classList.contains('dark') ? '#FFFFFF' : '#000000'),
                    scale: isHovering ? 1.05 : 1
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
                {roundedValue}
            </motion.p>
            <p className="text-lg text-neutral-500 dark:text-neutral-400 -mt-2">bpm</p>
        </div>
    );
};


// --- Custom Tooltip ---
const CustomTooltip = () => null; // We use the live display, so no tooltip needed


// --- Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
            ease: 'easeOut',
        },
    },
};


// --- Main Component ---
interface HeartRateViewProps {
    isActive: boolean;
}

const HeartRateView = forwardRef<HTMLDivElement, HeartRateViewProps>(({ isActive }, ref) => {
    const [targetDate, setTargetDate] = useState(dayjs());
    const { data, isLoading, error, refetch } = useHeartRateData(targetDate.format('YYYYMMDD'));
    const [activeHr, setActiveHr] = useState<number | null>(null);

    useEffect(() => {
        if (isActive) refetch();
    }, [isActive, refetch]);
    
    const chartData = useMemo(() => {
        return data?.hourlyData.map(d => ({
            hour: d.hour,
            hrRange: [d.min_hr, d.max_hr],
            avgHr: d.min_hr && d.max_hr ? (d.min_hr + d.max_hr) / 2 : null,
        })) || [];
    }, [data]);

    const overallAvgHr = data?.stats.avg || 0;
    const displayHr = activeHr ?? overallAvgHr;

    const handleDateChange = (direction: 'prev' | 'next') => {
        setTargetDate(current => direction === 'prev' ? current.subtract(1, 'day') : current.add(1, 'day'));
    };
    
    const isToday = targetDate.isSame(dayjs(), 'day');

    return (
        <div ref={ref} className="h-screen w-full flex-shrink-0 relative bg-neutral-50 dark:bg-black overflow-hidden">
            {/* Live HR Display is outside the scrollable area */}
            {!isLoading && data && <LiveHeartRateDisplay value={displayHr} isHovering={activeHr !== null} />}

            <div className="h-full w-full overflow-y-auto p-4 scroll-smooth">
                <motion.div 
                    className="max-w-4xl mx-auto px-6 pt-20 pb-24 min-h-full flex flex-col justify-between"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.div variants={itemVariants}>
                        <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tighter text-black dark:text-white">心率</h1>
                        <p className="text-lg text-neutral-500 dark:text-neutral-400 mt-2">{targetDate.format('YYYY年MM月DD日')}</p>
                    </motion.div>

                    <div className="flex-grow flex items-center justify-center -mx-6">
                        {isLoading ? (
                            <div className="w-full h-96 bg-neutral-200 dark:bg-neutral-800 rounded-2xl animate-pulse" />
                        ) : error ? (
                             <div className="text-center text-red-500">无法加载心率数据: {error}</div>
                        ) : (
                            <AnimatePresence mode="wait">
                                <motion.div 
                                    key={targetDate.toString()}
                                    className="w-full h-[45vh] relative overflow-hidden" 
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={chartData}
                                            onMouseMove={(state) => {
                                                if (state.isTooltipActive && state.activePayload) {
                                                    const avgHr = state.activePayload[1]?.payload?.avgHr;
                                                    if(avgHr) setActiveHr(avgHr);
                                                }
                                            }}
                                            onMouseLeave={() => setActiveHr(null)}
                                        >
                                            <defs>
                                                <linearGradient id="hrFill" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="currentColor" stopOpacity={0.15} />
                                                    <stop offset="100%" stopColor="currentColor" stopOpacity={0.0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="hour" hide />
                                            <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'currentColor', strokeOpacity: 0.5, strokeWidth: 1, strokeDasharray: '3 3' }} />
                                            <Area type="monotone" dataKey="hrRange" stroke="none" fill="url(#hrFill)" />
                                            <Area type="monotone" dataKey="avgHr" stroke="currentColor" strokeWidth={2} fill="none" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                    
                                    <motion.div
                                        className="absolute inset-0 bg-neutral-50 dark:bg-black"
                                        initial={{ x: '0%' }}
                                        animate={{ x: '100%' }}
                                        transition={{ duration: 1, ease: 'easeIn' }}
                                    />
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                    
                    <motion.div className="flex justify-between items-center" variants={itemVariants}>
                        <button onClick={() => handleDateChange('prev')} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors">
                            <ChevronLeft className="w-6 h-6 text-neutral-500" />
                        </button>
                        <p className="text-sm text-neutral-400">每日心率区间</p>
                        <button onClick={() => handleDateChange('next')} disabled={isToday} className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent">
                            <ChevronRight className="w-6 h-6 text-neutral-500" />
                        </button>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
});

HeartRateView.displayName = "HeartRateView";
export default HeartRateView;
