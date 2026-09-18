// src/components/auth/AuthModal.tsx
import React, { useState } from 'react';
import { X, CloudUpload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isFirebaseConfigured } from '../../lib/firebase';
import { dataRepository } from '../../services/storage/dataRepository';
import { migrateGuestDataToCloud } from '../../services/migration/migrationService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setMessage(null);

    if (!isFirebaseConfigured) {
      setMessage({
        text: 'Firebase is not yet configured. Please add your Firebase configuration in .env.',
        isError: true,
      });
      return;
    }

    setLoading(true);

    try {
      const user = await dataRepository.signInWithGoogle();

      if (user) {
        setMessage({
          text: 'Google account connected! Backing up workouts to cloud...',
          isError: false,
        });

        await migrateGuestDataToCloud(user.uid, user.email || undefined, (status) => {
          setMigrationStatus(status);
        });

        onAuthSuccess();
        setTimeout(() => onClose(), 800);
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setMessage(null);
      } else {
        setMessage({
          text: err.message || 'Google sign-in failed. Please try again.',
          isError: true,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 p-5 space-y-4 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
                <CloudUpload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-mono">
                  Cloud Backup
                </h3>
                <span className="text-[11px] font-mono text-zinc-400">
                  Sync across devices
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Migration status or alerts */}
          {migrationStatus && (
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white flex items-center space-x-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{migrationStatus}</span>
            </div>
          )}

          {message && (
            <div
              className={`p-3 rounded-xl text-xs font-mono border flex items-start space-x-2 ${
                message.isError
                  ? 'bg-zinc-900 border-red-900/50 text-red-400'
                  : 'bg-zinc-900 border-zinc-800 text-emerald-400'
              }`}
            >
              {message.isError ? (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <p className="text-xs text-zinc-400 font-mono leading-relaxed">
            Link your Google account to automatically back up all your routines, logged workouts, personal records, and weight history to Firebase Cloud.
          </p>

          {/* 1-Click Google Sign In */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-white text-black font-bold font-mono text-xs tracking-wider rounded-xl shadow-glow-sm hover:bg-zinc-100 transition-colors flex items-center justify-center space-x-3 uppercase disabled:opacity-50"
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
            <span>SIGN IN WITH GOOGLE</span>
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
