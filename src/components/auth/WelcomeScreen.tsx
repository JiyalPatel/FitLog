// src/components/auth/WelcomeScreen.tsx
import React, { useState } from 'react';
import { Mail, Lock, Dumbbell, ShieldCheck, ArrowRight, Loader2, Sparkles, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { migrateGuestDataToCloud } from '../../services/migration/migrationService';

interface WelcomeScreenProps {
  onContinueAsGuest: () => void;
  onAuthSuccess: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onContinueAsGuest,
  onAuthSuccess,
}) => {
  const [showAuthForm, setShowAuthForm] = useState<boolean>(false);
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!isSupabaseConfigured || !supabase) {
      // Graceful offline fallback
      setStatusMessage({
        text: 'Cloud sync is currently in local offline mode. Entering app in offline mode.',
        isError: false,
      });
      setTimeout(() => {
        onContinueAsGuest();
      }, 1000);
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;

        if (data.session) {
          setStatusMessage({
            text: 'Account created! Signing you in...',
            isError: false,
          });
          await migrateGuestDataToCloud(data.user!.id, email);
          setTimeout(() => onAuthSuccess(), 800);
        } else if (data.user) {
          setStatusMessage({
            text: 'Confirmation link sent! Please check your email inbox to verify your account.',
            isError: false,
          });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data.user) {
          setStatusMessage({ text: 'Signed in successfully!', isError: false });
          await migrateGuestDataToCloud(data.user.id, email);
          setTimeout(() => onAuthSuccess(), 600);
        }
      }
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Authentication error. Please verify your email and password.',
        isError: true,
      });
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
                <span className="font-semibold text-white">Rolling Workout Routine</span>
                <p className="text-zinc-400 mt-0.5 leading-relaxed">
                  Never lose a workout when you miss a day. Your routine rolls forward automatically.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-start space-x-3 shadow-md">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-white">Workout Memory & PRs</span>
                <p className="text-zinc-400 mt-0.5 leading-relaxed">
                  Instantly see what you lifted last session, hit personal records, and build strength.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-start space-x-3 shadow-md">
              <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Smartphone className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="text-xs">
                <span className="font-semibold text-white">Offline Journal or Cloud Account</span>
                <p className="text-zinc-400 mt-0.5 leading-relaxed">
                  Use offline with zero account needed, or sign in to safely back up your workouts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-3 pt-2">
          <AnimatePresence mode="wait">
            {!showAuthForm ? (
              <motion.div
                key="welcome-buttons"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2.5"
              >
                {/* Guest CTA */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={onContinueAsGuest}
                  className="w-full py-4 px-4 bg-white text-black font-bold font-mono text-sm tracking-wider rounded-2xl shadow-glow-sm hover:bg-zinc-100 transition-colors flex items-center justify-center space-x-2 uppercase"
                >
                  <span>CONTINUE AS GUEST</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
                <div className="text-center">
                  <span className="text-[11px] font-mono text-zinc-500">
                    No sign-up needed · Works 100% offline on this phone
                  </span>
                </div>

                {/* Sign In Trigger */}
                <div className="pt-2">
                  <button
                    onClick={() => setShowAuthForm(true)}
                    className="w-full py-3.5 px-4 bg-zinc-950 border border-zinc-800 text-zinc-300 font-semibold font-mono text-xs tracking-wider rounded-2xl hover:text-white hover:border-zinc-750 transition-colors uppercase flex items-center justify-center space-x-2"
                  >
                    <ShieldCheck className="w-4 h-4 text-zinc-400" />
                    <span>SIGN IN / CREATE ACCOUNT</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="auth-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-xl"
              >
                <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
                  <h3 className="text-sm font-bold font-mono text-white uppercase tracking-wider">
                    {isSignUp ? 'Create Free Account' : 'Sign In to FitLog'}
                  </h3>
                  <button
                    onClick={() => setShowAuthForm(false)}
                    className="text-xs font-mono text-zinc-500 hover:text-zinc-300"
                  >
                    BACK
                  </button>
                </div>

                {statusMessage && (
                  <div
                    className={`p-2.5 rounded-xl text-xs font-mono border ${
                      statusMessage.isError
                        ? 'bg-zinc-900 border-zinc-700 text-zinc-300'
                        : 'bg-zinc-900 border-zinc-700 text-white'
                    }`}
                  >
                    {statusMessage.text}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-zinc-400">Email</label>
                    <div className="mt-1 relative">
                      <input
                        type="email"
                        required
                        placeholder="athlete@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white font-mono"
                      />
                      <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-zinc-400">Password</label>
                    <div className="mt-1 relative">
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white font-mono"
                      />
                      <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-white text-black font-bold font-mono text-xs tracking-wider rounded-xl shadow-glow-sm hover:bg-zinc-100 transition-colors uppercase disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isSignUp ? (
                      <span>CREATE ACCOUNT</span>
                    ) : (
                      <span>SIGN IN</span>
                    )}
                  </motion.button>
                </form>

                <div className="text-center pt-1">
                  <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-xs font-mono text-zinc-400 hover:text-white"
                  >
                    {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Create one"}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
