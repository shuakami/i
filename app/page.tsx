"use client"

import type React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useTheme } from "next-themes"
import type { HeartRateData, ActivityData, ColorPalette, ActivityDetails } from "./types"
import { getActivityDetails, predictAvailability } from "./lib/activityUtils"
import { extractColorsFromImage } from "./lib/imageUtils"
import { getAliveStatus } from "./lib/statusUtils"

export default function StatusPage() {
  const { theme } = useTheme()
  
  // 根据主题动态设置默认颜色
  const getDefaultColors = useCallback((): ColorPalette => {
    const isDarkTheme = theme === 'dark'
    return {
      primary: "rgba(0, 0, 0, 0.4)",
      secondary: "rgba(0, 0, 0, 0.3)",
      text: isDarkTheme ? "white" : "black",
      textSecondary: isDarkTheme ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)",
      isDark: true,
    }
  }, [theme])

  const [heartRate, setHeartRate] = useState<HeartRateData | null>(null)
  const [activity, setActivity] = useState<ActivityData | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [backgroundImage, setBackgroundImage] = useState<string>("")
  const [imageLoading, setImageLoading] = useState(false)
  const [initialPage2LoadAttempted, setInitialPage2LoadAttempted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // 使用动态默认颜色
  const [colorPalette, setColorPalette] = useState<ColorPalette>(getDefaultColors())
  
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const imageProcessingTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  const activityTextRef = useRef<HTMLDivElement>(null); // 新增 Ref
  const reasonTextRef = useRef<HTMLDivElement>(null); // 新增原因文本 Ref

  // 简化状态管理
  const [showPage2Content, setShowPage2Content] = useState(false)

  // 当主题改变时更新默认颜色
  useEffect(() => {
    if (!backgroundImage) {
      setColorPalette(getDefaultColors())
    }
  }, [theme, backgroundImage, getDefaultColors])

  // 新增 useEffect 来检测移动端
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize() // 初始化时设置一次
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const fetchStatus = async () => {
    try {
      const [heartResponse, activityResponse] = await Promise.all([fetch("/api/status"), fetch("/api/activity")])

      const heartData = await heartResponse.json()
      const activityData = await activityResponse.json()

      if (heartData.length > 0) {
        setHeartRate(heartData[0])
      }

      if (activityData.length > 0) {
        setActivity(activityData[0])
      }

      setLastUpdate(new Date())
      setIsLoading(false)
    } catch (error) {
      console.error("Failed to fetch status:", error)
      setIsLoading(false)
    }
  }

  const loadBackgroundImage = useCallback(async () => {
    if (imageProcessingTimerRef.current) {
      clearTimeout(imageProcessingTimerRef.current);
    }
    setImageLoading(true);
    
    try {
      const rawUrl = `https://app.zichen.zone/api/acg/api.php?t=${Date.now()}`;
      const imageUrl = `/api/proxy-image?url=${encodeURIComponent(rawUrl)}`;

      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        setBackgroundImage(imageUrl); // Set background image src immediately
        
        imageProcessingTimerRef.current = setTimeout(async () => {
          try {
            const colors = await extractColorsFromImage(imageUrl);
            setColorPalette(colors); // This will trigger color animation
          } catch (error) {
            console.error("Failed to extract colors:", error);
            // Consider setting default colors: setColorPalette(getDefaultColors());
          }
          setImageLoading(false); // This will trigger background opacity animation
        }, 200); // Delay of 200ms
      };

      img.onerror = () => {
        if (imageProcessingTimerRef.current) {
          clearTimeout(imageProcessingTimerRef.current);
        }
        setImageLoading(false);
        console.error("Image loading failed.");
        // Consider setting default colors: setColorPalette(getDefaultColors());
      };

      img.src = imageUrl;
    } catch (error) {
      // This catch is for errors before img.src (e.g. URL creation)
      if (imageProcessingTimerRef.current) { // Ensure cleanup if error occurs after timer might have been set by a rapid previous call
        clearTimeout(imageProcessingTimerRef.current);
      }
      setImageLoading(false); // Ensure loading is false if setup fails
      console.error("Failed to initiate background image loading:", error);
      // Consider setting default colors: setColorPalette(getDefaultColors());
    }
  }, [setColorPalette, setImageLoading /*, getDefaultColors if used */]);

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let timerId1: NodeJS.Timeout | undefined;
    let timerId2: NodeJS.Timeout | undefined;

    if (currentPage === 1) {
      if (!initialPage2LoadAttempted) {
        // 第一次进入第二页
        timerId1 = setTimeout(() => {
          setShowPage2Content(true);
        }, 150); // 稍微延迟，让页面切换动画先开始
        
        loadBackgroundImage();
        setInitialPage2LoadAttempted(true);
      } else {
        // 再次进入第二页
        timerId2 = setTimeout(() => {
          setShowPage2Content(true);
        }, 150);
      }
    }

    return () => {
      if (timerId1) clearTimeout(timerId1);
      if (timerId2) clearTimeout(timerId2);
    };
  }, [currentPage, initialPage2LoadAttempted, loadBackgroundImage]);

  // 页面切换时重置
  useEffect(() => {
    if (currentPage === 0) {
      // 立即隐藏内容，这样下次进入时可以重新触发动画
      setShowPage2Content(false);
    }
  }, [currentPage]);

  // Cleanup for imageProcessingTimerRef on component unmount
  useEffect(() => {
    return () => {
      if (imageProcessingTimerRef.current) {
        clearTimeout(imageProcessingTimerRef.current);
      }
    };
  }, []);

  const isAlive = heartRate && heartRate.last_non_zero_hr > 0 && !heartRate.is_watch_off

  const timeSinceLastHR = heartRate ? Date.now() - heartRate.last_timestamp : 0
  const isRecentHR = timeSinceLastHR < 300000

  const aliveStatus = getAliveStatus(heartRate, isRecentHR)
  
  // Updated currentActivity and availability logic
  const activityDetails: ActivityDetails | null = activity ? getActivityDetails(activity.window_title, activity.process_name) : null;
  const currentActivity = activityDetails ? activityDetails.description : "未知";
  const availability = predictAvailability(heartRate, activityDetails, activity ? activity.mouse_idle_seconds : 0);

  // The MOVED useEffect for dynamic font sizing is now PLACED HERE:
  useEffect(() => {
    if (currentPage === 0 && activityTextRef.current && currentActivity) {
      const element = activityTextRef.current;
      
      element.style.fontSize = ''; 
      element.style.whiteSpace = 'nowrap';
      element.style.overflow = 'visible'; 
      element.style.textOverflow = 'clip'; 

      let currentFontSize = parseFloat(window.getComputedStyle(element).fontSize);
      const MIN_FONT_SIZE = 36; 
      
      let iterations = 0;
      const maxIterations = 150;

      while (element.scrollWidth > element.clientWidth && currentFontSize > MIN_FONT_SIZE && iterations < maxIterations) {
        currentFontSize -= 1;
        element.style.fontSize = `${currentFontSize}px`;
        iterations++;
      }

      if (element.scrollWidth > element.clientWidth) {
        element.style.overflow = 'hidden';
        element.style.textOverflow = 'ellipsis';
      } else {
        element.style.overflow = 'visible'; 
        element.style.textOverflow = 'clip';
      }

    } 
  }, [currentActivity, currentPage, theme]);

  // 为"原因"文本添加自适应字体逻辑
  useEffect(() => {
    if (isMobile && reasonTextRef.current && availability.reason) {
      const element = reasonTextRef.current;
      element.style.fontSize = ''; // 重置字体大小
      element.style.whiteSpace = 'normal'; // 允许换行
      element.style.overflow = 'visible';
      element.style.textOverflow = 'clip';

      let currentFontSize = parseFloat(window.getComputedStyle(element).fontSize);
      const initialLineHeight = parseFloat(window.getComputedStyle(element).lineHeight);
      const maxLines = 2;
      const maxHeight = initialLineHeight * maxLines;
      const MIN_FONT_SIZE = 16; // 最小字体大小
      
      let iterations = 0;
      const maxIterations = 50;

      while (element.scrollHeight > maxHeight && currentFontSize > MIN_FONT_SIZE && iterations < maxIterations) {
        currentFontSize -= 1;
        element.style.fontSize = `${currentFontSize}px`;
        // 重新计算行高以避免在字体缩小时行高不变导致的问题
        const newComputedLineHeight = parseFloat(window.getComputedStyle(element).lineHeight);
        const newMaxHeight = newComputedLineHeight * maxLines;
        if (element.scrollHeight <= newMaxHeight) break; // 如果缩小后适应，则退出循环
        iterations++;
      }

      // 如果最终还是超出两行，则强制显示省略号
      if (element.scrollHeight > maxHeight) {
        element.style.overflow = 'hidden';
        element.style.textOverflow = 'ellipsis';
        element.style.display = '-webkit-box';
        element.style.webkitLineClamp = String(maxLines);
        element.style.webkitBoxOrient = 'vertical';
      }

    } else if (!isMobile && reasonTextRef.current) {
      // 如果不是移动端，重置样式
      const element = reasonTextRef.current;
      element.style.fontSize = '';
      element.style.whiteSpace = 'normal';
      element.style.overflow = 'visible';
      element.style.textOverflow = 'clip';
      element.style.webkitLineClamp = '';
      element.style.webkitBoxOrient = '';
    }
  }, [availability.reason, isMobile]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || isScrolling) return;

    const touch = e.changedTouches[0];
    const finalDiffX = touchStart.x - touch.clientX;
    const finalDiffY = touchStart.y - touch.clientY;
    const touchThreshold = 10;

    if (Math.abs(finalDiffX) > Math.abs(finalDiffY)) {
      if (Math.abs(finalDiffX) > touchThreshold) {
        if (finalDiffX > 0 && currentPage === 0) {
          setCurrentPage(1);
        } else if (finalDiffX < 0 && currentPage === 1) {
          setCurrentPage(0);
        }
      }
    } else {
      if (Math.abs(finalDiffY) > touchThreshold) {
        if (currentPage === 0 && finalDiffY < 0) {
          setTouchStart(null);
          return;
        }
        if (currentPage === 1 && finalDiffY > 0) {
          setTouchStart(null);
          return;
        }
        if (finalDiffY > 0 && currentPage === 0) {
          setCurrentPage(1);
        } else if (finalDiffY < 0 && currentPage === 1) {
          setCurrentPage(0);
        }
      }
    }
    setTouchStart(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (isScrolling) return;

    if (currentPage === 0 && e.deltaY < 0) return;
    if (currentPage === 1 && e.deltaY > 0) return;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    setIsScrolling(true);

    const wheelThreshold = 20;
    if (Math.abs(e.deltaY) > wheelThreshold) {
      if (e.deltaY > 0 && currentPage === 0) {
        setCurrentPage(1);
      } else if (e.deltaY < 0 && currentPage === 1) {
        setCurrentPage(0);
      }
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
        <div className="text-4xl font-light text-neutral-400 dark:text-neutral-500 animate-pulse">
          Loading
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-white dark:bg-black text-black dark:text-white overflow-hidden fixed inset-0"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onWheel={handleWheel}
    >
      <div
        className="flex flex-col h-screen"
        style={{
          transform: `translateY(-${Math.max(0, Math.min(1, currentPage)) * 100}vh)`,
          transition: 'transform 700ms cubic-bezier(0.4, 0, 0.2, 1)',
          willChange: 'transform'
        }}
      >
        {/* 第一页 - 当前状态 */}
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

        {/* 第二页 - 可用性预测 */}
        <div className="h-screen w-full flex-shrink-0 relative overflow-hidden bg-white dark:bg-black">
          {/* 背景图层 - 简化，移除不必要的动画 */}
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

          {/* 背景遮罩 - 只在有图片时显示 */}
          {backgroundImage && (
            <div
              className="absolute inset-0 backdrop-blur-[2px] transition-opacity duration-1000"
              style={{ 
                backgroundColor: colorPalette.primary,
                opacity: imageLoading ? 0 : 1,
              }}
            />
          )}

          {/* 内容 */}
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

              {/* 详细信息 */}
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

          {/* 刷新按钮 */}
          <button
            onClick={() => {
              // 重新加载图片
              setBackgroundImage('') // 清空当前图片
              setColorPalette(getDefaultColors()) // 重置为默认颜色
              setTimeout(() => {
                loadBackgroundImage()
              }, 100)
            }}
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
      </div>

      {/* 底部信息和页面指示器 */}
      <div className="fixed bottom-8 left-8 right-8 z-20">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex flex-col">
            <div 
              className="max-w-md truncate text-sm text-neutral-400 dark:text-neutral-500"
              style={{
                opacity: 0.8,
                animation: 'fadeIn 1s ease-out 1s',
                animationFillMode: 'both'
              }}
            >
              {activity?.window_title || ""}
            </div>
            <div 
              className="text-xs text-neutral-400 dark:text-neutral-500 mt-1"
              style={{
                opacity: 0.7,
                animation: 'fadeIn 1s ease-out 1.2s',
                animationFillMode: 'both'
              }}
            >
              算法版本: v0.8.2
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* 页面指示器 */}
            <div className="flex space-x-2">
              <div
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: currentPage === 0 
                    ? (theme === 'dark' ? 'white' : 'black')
                    : 'rgba(156, 163, 175, 0.5)',
                  transform: currentPage === 0 ? 'scale(1.2)' : 'scale(1)',
                }}
              />
              <div
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  backgroundColor: currentPage === 1 
                    ? (backgroundImage ? colorPalette.text : (theme === 'dark' ? 'white' : 'black'))
                    : 'rgba(156, 163, 175, 0.5)',
                  transform: currentPage === 1 ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            </div>
            <div className="flex items-center">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm text-neutral-400 dark:text-neutral-500">
                {lastUpdate.toLocaleTimeString("zh-CN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 添加全局样式 */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fadeInUp { /* Re-added this class definition */
          animation: fadeInUp 0.8s ease-out;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  )
}

