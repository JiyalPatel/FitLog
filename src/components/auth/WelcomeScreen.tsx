// src/components/auth/WelcomeScreen.tsx
import React, { useState } from 'react';
import { Dumbbell, ArrowRight, Loader2, Sparkles, Scale } from 'lucide-react';
import { motion } from 'framer-motion';
import { dataRepository } from '../../services/storage/dataRepository';
import { isFirebaseConfigured } from '../../lib/firebase';
import { migrateGuestDataToCloud } from '../../services/migration/migrationService';

interface WelcomeScreenProps {
  onContinueAsGuest: () => void;
  onAuthSuccess: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onContinueAsGuest,
  onAuthSuccess,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleGoogleSignIn = async () => {
    setStatusMessage(null);

    if (!isFirebaseConfigured) {
      setStatusMessage({
        text: 'Firebase is in offline demo mode. You can continue as Guest or add your Firebase keys in .env.',
        isError: true,
      });
      return;
    }

    setLoading(true);
    try {
      const user = await dataRepository.signInWithGoogle();
      if (user) {
        setStatusMessage({ text: 'Signed in! Backing up your workouts...', isError: false });
        await migrateGuestDataToCloud(user.uid, user.email || undefined);
        setTimeout(() => onAuthSuccess(), 500);
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setStatusMessage(null);
      } else {
        setStatusMessage({
          text: err.message || 'Failed to sign in with Google. Please try again.',
          isError: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex justify-center p-4 selection:bg-white selection:text-black">
      <div className="w-full max-w-md min-h-screen flex flex-col justify-between py-6 space-y-6">
        {/* Brand & Hero */}
        <div className="space-y-6 text-center pt-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white text-black font-mono font-black text-3xl shadow-glow-md mx-auto">
            F
          </div>

          <div>
            <h1 className="text-3xl font-black tracking-tight text-white font-mono m-0">
              FITLOG
            </h1>
            <p className="text-xs font-mono text-zinc-400 mt-1 uppercase tracking-wider">
              Minimalist Workout Journal
            </p>
          </div>

          {/* Value Propositions */}
          <div className="space-y-2.5 text-left pt-2">
            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-start space-x-3 shadow-md">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Dumbbell className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-white">Rolling Workout Queue</span>
                <p className="text-zinc-400 mt-0.5 leading-relaxed">
                  Never lose a workout when life gets busy. Missed sessions roll forward smoothly.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-start space-x-3 shadow-md">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-white">Previous Weights & Live PRs</span>
                <p className="text-zinc-400 mt-0.5 leading-relaxed">
                  Instantly recall what you lifted last session and celebrate new personal records.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-start space-x-3 shadow-md">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Scale className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-white">Target Weight & Visual Graph</span>
                <p className="text-zinc-400 mt-0.5 leading-relaxed">
                  Set target milestones, log check-ins anytime, and view your weight trajectory.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls - Exactly 2 Logins: Google & Guest */}
        <div className="space-y-3 pt-2">
          {statusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-mono border ${
                statusMessage.isError
                  ? 'bg-zinc-950 border-red-900/50 text-red-400'
                  : 'bg-zinc-950 border-zinc-800 text-white'
              }`}
            >
              {statusMessage.text}
            </div>
          )}

          <div className="space-y-3">
            {/* 1. Login with Google */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3.5 px-4 bg-white text-black font-bold font-mono text-xs tracking-wider rounded-2xl shadow-glow-sm hover:bg-zinc-100 transition-colors flex items-center justify-center space-x-3 uppercase disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>CONTINUE WITH GOOGLE</span>
            </motion.button>

            {/* 2. Login as Guest */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={onContinueAsGuest}
              className="w-full py-3.5 px-4 bg-zinc-950 border border-zinc-800 text-zinc-300 font-semibold font-mono text-xs tracking-wider rounded-2xl hover:text-white hover:border-zinc-700 transition-colors flex items-center justify-center space-x-2 uppercase"
            >
              <span>CONTINUE AS GUEST</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
            </motion.button>
          </div>

          <p className="text-center text-[11px] font-mono text-zinc-500 pt-1">
            Guest mode works 100% offline. Sign in with Google anytime to sync across devices.
          </p>
        </div>
      </div>
    </div>
  );
};
