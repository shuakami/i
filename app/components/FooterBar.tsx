import React from 'react';
import type { ActivityData, ColorPalette } from '../types';

interface FooterBarProps {
  activity: ActivityData | null;
  lastUpdate: Date;
  currentPage: number;
  theme: string | undefined;
  backgroundImage: string;
  colorPalette: ColorPalette;
}

const FooterBar: React.FC<FooterBarProps> = ({ activity, lastUpdate, currentPage, theme, backgroundImage, colorPalette }) => {
  return (
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
          {/* Page Indicator */}
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
            <div
              className="w-2 h-2 rounded-full transition-all duration-300"
              style={{
                backgroundColor: currentPage === 2
                  ? (theme === 'dark' ? 'white' : 'black')
                  : 'rgba(156, 163, 175, 0.5)',
                transform: currentPage === 2 ? 'scale(1.2)' : 'scale(1)',
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
  );
};

export default FooterBar; 