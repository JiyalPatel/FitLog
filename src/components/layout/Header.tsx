// src/components/layout/Header.tsx
import React from 'react';
import { Flame, User, ShieldCheck } from 'lucide-react';
import { UserProfile } from '../../types';

interface HeaderProps {
  profile: UserProfile;
  streak: number;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ profile, streak, onOpenProfile }) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-black/80 backdrop-blur-md border-b border-surface-300 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center font-mono font-black text-black text-base shadow-glow-sm">
          N
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-wider uppercase text-white font-mono leading-none m-0">
            NOIR FIT
          </h1>
          <span className="text-[10px] text-zinc-500 font-mono">
            {profile.isGuest ? 'GUEST MODE' : 'CLOUD SYNC'}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Streak Counter */}
        <div 
          className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono font-medium text-zinc-200"
          title="Sequential Workout Streak"
        >
          <Flame className={`w-3.5 h-3.5 ${streak > 0 ? 'text-white fill-white' : 'text-zinc-600'}`} />
          <span>{streak}</span>
          <span className="text-[10px] text-zinc-500">STREAK</span>
        </div>

        {/* Profile Button */}
        <button
          onClick={onOpenProfile}
          className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
          aria-label="Profile and Settings"
        >
          {profile.isGuest ? (
            <User className="w-4 h-4" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-zinc-300" />
          )}
        </button>
      </div>
    </header>
  );
};
