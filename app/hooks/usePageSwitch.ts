import { useState, useRef, useEffect, useCallback, RefObject } from 'react';

const MAX_PAGES = 4;

export function usePageSwitch(initialPage = 0, scrollableContainerRef: RefObject<HTMLElement>) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart || isScrolling) return;

    const touch = e.changedTouches[0];
    const finalDiffY = touchStart.y - touch.clientY;
    
    // On scrollable pages (page 2), only allow swipe up if scroll is at top
    if (currentPage === 2 && finalDiffY < 0) { // Swiping down (to go up a page)
        if (scrollableContainerRef.current && scrollableContainerRef.current.scrollTop > 0) {
            setTouchStart(null);
            return; // Don't switch page, allow native scroll
        }
    }

    const finalDiffX = touchStart.x - touch.clientX;
    const touchThreshold = 10;

    const swipeDirection = Math.abs(finalDiffX) > Math.abs(finalDiffY) ? 'horizontal' : 'vertical';

    if (swipeDirection === 'horizontal') {
        if (Math.abs(finalDiffX) > touchThreshold) {
            const newPage = finalDiffX > 0 ? currentPage + 1 : currentPage - 1;
            setCurrentPage(Math.max(0, Math.min(newPage, MAX_PAGES - 1)));
        }
    } else { // Vertical swipe
        if (Math.abs(finalDiffY) > touchThreshold) {
            const newPage = finalDiffY > 0 ? currentPage + 1 : currentPage - 1;
            setCurrentPage(Math.max(0, Math.min(newPage, MAX_PAGES - 1)));
        }
    }
    setTouchStart(null);
  }, [touchStart, isScrolling, currentPage, scrollableContainerRef]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    // On scrollable pages (page 2), only allow scroll up if scroll is at top
    if (currentPage === 2 && e.deltaY < 0) {
        if (scrollableContainerRef.current && scrollableContainerRef.current.scrollTop > 0) {
            return; // Don't prevent default, allow native scroll
        }
    }
    
    if (isScrolling) return;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    setIsScrolling(true);

    const wheelThreshold = 20;
    if (Math.abs(e.deltaY) > wheelThreshold) {
      const newPage = e.deltaY > 0 ? currentPage + 1 : currentPage - 1;
      setCurrentPage(Math.max(0, Math.min(newPage, MAX_PAGES - 1)));
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 800);
  }, [isScrolling, currentPage, scrollableContainerRef]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return { currentPage, setCurrentPage, handleTouchStart, handleTouchEnd, handleWheel };
} 