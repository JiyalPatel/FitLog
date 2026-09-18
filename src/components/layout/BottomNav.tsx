// src/components/layout/BottomNav.tsx
import React from 'react';
import { Home, Dumbbell, Scale, BarChart3, CalendarRange } from 'lucide-react';
import { motion } from 'framer-motion';

export type TabType = 'home' | 'workout' | 'weight' | 'progress' | 'routine';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  hasActiveSession: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  hasActiveSession,
}) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'workout' as TabType, label: 'Workout', icon: Dumbbell, hasBadge: hasActiveSession },
    { id: 'weight' as TabType, label: 'Weight', icon: Scale },
    { id: 'progress' as TabType, label: 'Progress', icon: BarChart3 },
    { id: 'routine' as TabType, label: 'Routine', icon: CalendarRange },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-lg border-t border-zinc-900 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className="relative flex flex-col items-center justify-center flex-1 max-w-[68px] py-1 text-xs transition-colors"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'text-white scale-110' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                />
                {tab.hasBadge && (
                  <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                  </span>
                )}
              </div>
              <span
                className={`mt-1 text-[11px] font-mono tracking-tight ${
                  isActive ? 'text-white font-medium' : 'text-zinc-500'
                }`}
              >
                {tab.label}
              </span>

              {isActive && (
                <motion.div
                  layoutId="bottom-nav-indicator"
                  className="absolute bottom-0 w-8 h-[2px] bg-white rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
