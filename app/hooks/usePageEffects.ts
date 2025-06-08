import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from 'next-themes';
import type { ColorPalette } from '../types';
import { extractColorsFromImage } from '../lib/imageUtils';

export function usePageEffects(currentPage: number) {
  const { theme } = useTheme();

  const getDefaultColors = useCallback((): ColorPalette => {
    const isDarkTheme = theme === 'dark';
    return {
      primary: "rgba(0, 0, 0, 0.4)",
      secondary: "rgba(0, 0, 0, 0.3)",
      text: isDarkTheme ? "white" : "black",
      textSecondary: isDarkTheme ? "rgba(255, 255, 255, 0.9)" : "rgba(0, 0, 0, 0.9)",
      isDark: true,
    };
  }, [theme]);

  const [backgroundImage, setBackgroundImage] = useState<string>("");
  const [imageLoading, setImageLoading] = useState(false);
  const [initialPage2LoadAttempted, setInitialPage2LoadAttempted] = useState(false);
  const [showPage2Content, setShowPage2Content] = useState(false);
  const [colorPalette, setColorPalette] = useState<ColorPalette>(getDefaultColors());
  const imageProcessingTimerRef = useRef<NodeJS.Timeout | null>(null);

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
        setBackgroundImage(imageUrl);
        imageProcessingTimerRef.current = setTimeout(async () => {
          try {
            const colors = await extractColorsFromImage(imageUrl);
            setColorPalette(colors);
          } catch (error) {
            console.error("Failed to extract colors:", error);
            setColorPalette(getDefaultColors());
          }
          setImageLoading(false);
        }, 200);
      };
      img.onerror = () => {
        if (imageProcessingTimerRef.current) clearTimeout(imageProcessingTimerRef.current);
        setImageLoading(false);
        console.error("Image loading failed.");
        setColorPalette(getDefaultColors());
      };
      img.src = imageUrl;
    } catch (error) {
      if (imageProcessingTimerRef.current) clearTimeout(imageProcessingTimerRef.current);
      setImageLoading(false);
      console.error("Failed to initiate background image loading:", error);
      setColorPalette(getDefaultColors());
    }
  }, [getDefaultColors]);

  // Reset default colors when theme changes and no background is set
  useEffect(() => {
    if (!backgroundImage) {
      setColorPalette(getDefaultColors());
    }
  }, [theme, backgroundImage, getDefaultColors]);

  // Handle content visibility and background loading for page 2
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (currentPage === 1) {
      if (!initialPage2LoadAttempted) {
        loadBackgroundImage();
        setInitialPage2LoadAttempted(true);
      }
      timer = setTimeout(() => setShowPage2Content(true), 150);
    } else {
      setShowPage2Content(false);
    }
    return () => { if (timer) clearTimeout(timer) };
  }, [currentPage, initialPage2LoadAttempted, loadBackgroundImage]);
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (imageProcessingTimerRef.current) {
        clearTimeout(imageProcessingTimerRef.current);
      }
    };
  }, []);

  return {
    theme,
    backgroundImage,
    setBackgroundImage,
    imageLoading,
    showPage2Content,
    colorPalette,
    setColorPalette,
    loadBackgroundImage,
    getDefaultColors,
  };
}
