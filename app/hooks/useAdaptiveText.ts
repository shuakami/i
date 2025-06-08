import { useEffect, RefObject } from 'react';

interface AdaptiveTextOptions {
  ref: RefObject<HTMLElement>;
  text: string | null | undefined;
  minFontSize: number;
  maxIterations?: number;
  isMobile?: boolean; // For mobile-specific logic
  maxLines?: number; // For multiline truncation
}

export function useAdaptiveText({
  ref,
  text,
  minFontSize,
  maxIterations = 50,
  isMobile = false,
  maxLines = 1,
}: AdaptiveTextOptions) {
  useEffect(() => {
    const element = ref.current;
    if (!element || !text) return;

    // Reset styles
    element.style.fontSize = '';
    element.style.whiteSpace = maxLines > 1 ? 'normal' : 'nowrap';
    element.style.overflow = 'visible';
    element.style.textOverflow = 'clip';
    element.style.display = '';
    element.style.webkitLineClamp = '';
    element.style.webkitBoxOrient = '';


    let currentFontSize = parseFloat(window.getComputedStyle(element).fontSize);
    
    // Single-line logic
    if (maxLines === 1) {
      let iterations = 0;
      while (element.scrollWidth > element.clientWidth && currentFontSize > minFontSize && iterations < maxIterations) {
        currentFontSize -= 1;
        element.style.fontSize = `${currentFontSize}px`;
        iterations++;
      }
      if (element.scrollWidth > element.clientWidth) {
        element.style.overflow = 'hidden';
        element.style.textOverflow = 'ellipsis';
      }
    } 
    // Multi-line logic (for mobile)
    else if (isMobile) {
      const initialLineHeight = parseFloat(window.getComputedStyle(element).lineHeight) || currentFontSize * 1.2;
      const maxHeight = initialLineHeight * maxLines;
      let iterations = 0;

      while (element.scrollHeight > maxHeight && currentFontSize > minFontSize && iterations < maxIterations) {
        currentFontSize -= 1;
        element.style.fontSize = `${currentFontSize}px`;
        // Recalculate based on new font size to be more accurate
        const newComputedLineHeight = parseFloat(window.getComputedStyle(element).lineHeight);
        const newMaxHeight = newComputedLineHeight * maxLines;
        if (element.scrollHeight <= newMaxHeight) break;
        iterations++;
      }

      if (element.scrollHeight > maxHeight) {
        element.style.overflow = 'hidden';
        element.style.textOverflow = 'ellipsis';
        element.style.display = '-webkit-box';
        element.style.webkitLineClamp = String(maxLines);
        element.style.webkitBoxOrient = 'vertical';
      }
    }
  }, [text, ref, minFontSize, maxIterations, isMobile, maxLines]);
} 