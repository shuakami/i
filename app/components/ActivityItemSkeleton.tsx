import React from 'react';

const ActivityItemSkeleton = () => {
  return (
    <div className="flex gap-4 items-start py-6 border-t border-neutral-200/75 dark:border-neutral-800/75 -mx-6 px-6">
      {/* Date Skeleton */}
      <div className="text-center w-14 flex-shrink-0">
        <div className="h-8 w-10 bg-neutral-200 dark:bg-neutral-800 rounded-md mx-auto animate-pulse"></div>
        <div className="h-4 w-12 bg-neutral-200 dark:bg-neutral-800 rounded-md mx-auto mt-2 animate-pulse"></div>
      </div>
      
      {/* Main Content Skeleton */}
      <div className="flex-1 w-full animate-pulse">
        {/* Top line skeleton */}
        <div className="flex items-start justify-between mb-3">
            <div className="h-5 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
            <div className="flex gap-x-4 text-right text-sm">
                <div className="flex flex-col items-end gap-y-1">
                    <div className="h-4 w-12 bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
                    <div className="h-3 w-8 bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
                </div>
                <div className="flex flex-col items-end gap-y-1">
                    <div className="h-4 w-12 bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
                    <div className="h-3 w-8 bg-neutral-200 dark:bg-neutral-800 rounded-md"></div>
                </div>
            </div>
        </div>

        {/* Hero stat skeleton */}
        <div className="leading-none">
          <div className="h-14 w-40 bg-neutral-200 dark:bg-neutral-800 rounded-lg mt-1"></div>
        </div>
      </div>
    </div>
  );
};

export default ActivityItemSkeleton; 