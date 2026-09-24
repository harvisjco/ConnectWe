import React from 'react';

export const ViewLoadingSkeleton: React.FC = () => {
  return (
    <div className="w-full space-y-4 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 flex items-center justify-between">
        <div className="space-y-3 w-1/2">
          <div className="h-6 w-3/4 bg-slate-800 rounded-lg" />
          <div className="h-4 w-full bg-slate-800/60 rounded" />
        </div>
        <div className="h-10 w-28 bg-slate-800 rounded-xl" />
      </div>

      {/* Grid Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-48 rounded-xl bg-slate-900/40 border border-slate-800/60 p-4 space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-20 bg-slate-800 rounded" />
                <div className="h-4 w-12 bg-slate-800/80 rounded" />
              </div>
              <div className="h-5 w-32 bg-slate-800 rounded" />
              <div className="h-3 w-40 bg-slate-800/60 rounded" />
            </div>
            <div className="h-8 w-full bg-slate-800/40 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
};
