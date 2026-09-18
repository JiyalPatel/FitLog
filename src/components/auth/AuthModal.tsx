// src/components/auth/AuthModal.tsx
import React, { useState } from 'react';
import { X, Mail, Lock, User, CloudUpload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { migrateGuestDataToCloud } from '../../services/migration/migrationService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Migration status
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!isSupabaseConfigured || !supabase) {
      setMessage({
        text: 'Cloud sync is currently unavailable in this environment. Your data is stored safely on this device.',
        isError: true,
      });
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
          setMessage({
            text: 'Account created! Backing up data...',
            isError: false,
          });

          // Prompt migration
          setIsMigrating(true);
          await migrateGuestDataToCloud(data.user!.id, email, (status) => {
            setMigrationStatus(status);
          });
          setIsMigrating(false);
          onAuthSuccess();
        } else if (data.user) {
          setMessage({
            text: 'Confirmation email sent! Please check your inbox to verify your account.',
            isError: false,
          });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          setMessage({ text: 'Signed in successfully!', isError: false });
          // Auto migrate guest data if available
          setIsMigrating(true);
          await migrateGuestDataToCloud(data.user.id, email, (status) => {
            setMigrationStatus(status);
          });
          setIsMigrating(false);
          onAuthSuccess();
          setTimeout(() => onClose(), 1000);
        }
      }
    } catch (err: any) {
      setMessage({
        text: err.message || 'Authentication failed. Please check your credentials.',
        isError: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl space-y-5 text-white relative"
      >
        <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              ACCOUNT & BACKUP
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
              {isSignUp ? 'Create Free Account' : 'Sign In'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest Migration Notice */}
        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400 flex items-start space-x-2.5">
          <CloudUpload className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold text-white">Safe & Automatic Backup</span>
            <p className="mt-0.5 leading-relaxed text-[11px]">
              All workouts, personal records, and routines on this device will be automatically saved to your account so you never lose your progress.
            </p>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`p-3 rounded-xl text-xs font-mono border ${
              message.isError
                ? 'bg-zinc-900 border-zinc-700 text-zinc-300'
                : 'bg-zinc-900 border-zinc-700 text-white'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Migration In Progress */}
        {isMigrating && (
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-2">
            <Loader2 className="w-5 h-5 text-white animate-spin mx-auto" />
            <div className="text-xs font-mono text-zinc-300">{migrationStatus}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-400">Email Address</label>
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
            disabled={loading || isMigrating}
            className="w-full py-3 bg-white text-black font-semibold font-mono text-xs tracking-wider rounded-xl shadow-glow-sm hover:bg-zinc-100 transition-colors uppercase disabled:opacity-50"
          >
            {loading ? 'SAVING...' : isSignUp ? 'CREATE ACCOUNT & BACK UP' : 'SIGN IN & RESTORE'}
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
    </div>
  );
};
