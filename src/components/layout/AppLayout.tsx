// src/components/layout/AppLayout.tsx
import React from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-black text-white flex justify-center selection:bg-white selection:text-black">
      <div className="w-full max-w-md min-h-screen flex flex-col relative sm:border-x sm:border-zinc-900 shadow-2xl bg-black">
        {children}
      </div>
    </div>
  );
};
