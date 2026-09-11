// src/components/profile/ProfileView.tsx
import React from 'react';
import { 
  User, 
  ShieldCheck, 
  CloudUpload, 
  Sliders, 
  Clock, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Database,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { UserProfile } from '../../types';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { localStore } from '../../services/storage/localStorageStore';

interface ProfileViewProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onOpenAuth: () => void;
  onSignOut?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onUpdateProfile,
  onOpenAuth,
  onSignOut,
}) => {
  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    onSignOut?.();
  };

  const handleResetData = () => {
    if (confirm('Reset your workout data? This will give you a clean slate.')) {
      localStore.clearAllData();
      window.location.reload();
    }
  };

  return (
    <div className="flex-1 px-4 py-5 pb-24 space-y-6 overflow-y-auto">
      {/* Header */}
      <div>
        <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
          ATHLETE PROFILE & SETTINGS
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
          Settings
        </h2>
      </div>

      {/* Account Status Card */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-900 p-4 space-y-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-white text-lg">
            {profile.isGuest ? 'A' : profile.displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white">{profile.displayName}</h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  profile.isGuest
                    ? 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    : 'bg-white text-black font-semibold border-white'
                }`}
              >
                {profile.isGuest ? 'OFFLINE JOURNAL' : 'SAVED TO ACCOUNT'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              {profile.email || 'Saved on this phone · Always ready'}
            </p>
          </div>
        </div>

        {profile.isGuest ? (
          <button
            onClick={onOpenAuth}
            className="w-full py-3 px-4 rounded-xl bg-white text-black font-semibold text-xs font-mono tracking-wider flex items-center justify-center space-x-2 shadow-glow-sm hover:bg-zinc-200 transition-colors uppercase"
          >
            <CloudUpload className="w-4 h-4" />
            <span>SAVE WORKOUTS TO FREE ACCOUNT</span>
          </button>
        ) : (
          <button
            onClick={handleSignOut}
            className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono text-xs flex items-center justify-center space-x-2 hover:text-white hover:border-zinc-700 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>SIGN OUT</span>
          </button>
        )}
      </div>

      {/* Training Preferences */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-900 p-4 space-y-4 shadow-xl">
        <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-white" /> Training Preferences
        </h3>

        {/* Weight Unit Toggle */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="text-sm font-semibold text-white">Weight Units</div>
            <div className="text-xs text-zinc-500 font-mono">Kilograms or Pounds</div>
          </div>
          <div className="flex items-center p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono">
            {(['kg', 'lbs'] as const).map((unit) => (
              <button
                key={unit}
                onClick={() => onUpdateProfile({ ...profile, weightUnit: unit })}
                className={`px-3 py-1 rounded uppercase font-bold transition-all ${
                  profile.weightUnit === unit
                    ? 'bg-white text-black shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>

        {/* Default Rest Timer */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
          <div>
            <div className="text-sm font-semibold text-white">Default Rest Interval</div>
            <div className="text-xs text-zinc-500 font-mono">Countdown starts after each finished set</div>
          </div>
          <div className="flex items-center space-x-1 text-xs font-mono">
            {[60, 90, 120, 180].map((sec) => (
              <button
                key={sec}
                onClick={() => onUpdateProfile({ ...profile, restTimerDefaultSeconds: sec })}
                className={`px-2.5 py-1 rounded-lg border transition-all ${
                  profile.restTimerDefaultSeconds === sec
                    ? 'bg-white text-black font-bold border-white'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        {/* Sound Effects Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-900">
          <div>
            <div className="text-sm font-semibold text-white">Sound Effects & Chimes</div>
            <div className="text-xs text-zinc-500 font-mono">Timer alerts and Personal Record chimes</div>
          </div>
          <button
            onClick={() => onUpdateProfile({ ...profile, soundEnabled: !profile.soundEnabled })}
            className={`w-10 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
              profile.soundEnabled ? 'bg-white' : 'bg-zinc-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full transition-transform ${
                profile.soundEnabled
                  ? 'translate-x-4 bg-black'
                  : 'translate-x-0 bg-zinc-500'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Backup & Sync Status Banner */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-900 p-4 space-y-2 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-white" /> Workout Backup Status
          </span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              !profile.isGuest
                ? 'bg-zinc-900 text-zinc-300 border-zinc-700'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}
          >
            {!profile.isGuest ? 'BACKED UP ONLINE' : 'SAVED ON THIS DEVICE'}
          </span>
        </div>
        <p className="text-xs text-zinc-400 leading-relaxed">
          {!profile.isGuest
            ? 'All your workouts, personal records, and routines are safely backed up to your account.'
            : 'Your workout history is currently saved on this phone. Create a free account to back up your progress and sync it across any device.'}
        </p>
      </div>

      {/* Reset Data Danger Zone */}
      <div className="pt-2">
        <button
          onClick={handleResetData}
          className="w-full py-2.5 rounded-xl border border-zinc-900 bg-zinc-950 text-xs font-mono text-zinc-500 hover:text-zinc-300 hover:border-zinc-800 flex items-center justify-center space-x-2 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>RESET TO SAMPLE DEMO DATA</span>
        </button>
      </div>
    </div>
  );
};
