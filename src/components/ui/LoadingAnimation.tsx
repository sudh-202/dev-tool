import React from 'react';

export const LoadingAnimation = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <div className="relative flex flex-col items-center">
        {/* Outer ring */}
        <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-primary animate-spin shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
        
        {/* Inner ring */}
        <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-r-4 border-l-4 border-secondary animate-spin-reverse opacity-70"></div>
        
        {/* Center pulse */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-4 w-4 bg-primary rounded-full animate-pulse shadow-[0_0_10px_var(--primary)]"></div>
        
        {/* Loading text */}
        <div className="mt-8 text-xl font-medium text-foreground animate-pulse tracking-widest">
          LOADING
        </div>
      </div>
    </div>
  );
};
