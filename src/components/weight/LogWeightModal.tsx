// src/components/weight/LogWeightModal.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Scale, Calendar, Check, Plus, Minus } from 'lucide-react';
import { WeightEntry } from '../../types';

interface LogWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: WeightEntry) => void;
  initialEntry?: WeightEntry | null;
  defaultWeight?: number;
  weightUnit: 'kg' | 'lbs';
}

export const LogWeightModal: React.FC<LogWeightModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <LogWeightModalContent {...props} />;
};

const LogWeightModalContent: React.FC<LogWeightModalProps> = ({
  onClose,
  onSave,
  initialEntry,
  defaultWeight = 70.0,
  weightUnit,
}) => {
  const getTodayString = () => new Date().toISOString().split('T')[0];

  const [weight, setWeight] = useState<number>(() => {
    if (initialEntry) return initialEntry.weight;
    return defaultWeight || 70.0;
  });
  const [date, setDate] = useState<string>(() => {
    if (initialEntry) return initialEntry.date;
    return getTodayString();
  });

  const handleAdjust = (delta: number) => {
    setWeight((prev) => {
      const next = Math.max(10, Math.min(300, Math.round((prev + delta) * 10) / 10));
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (weight <= 0) return;

    const entryToSave: WeightEntry = {
      id: initialEntry ? initialEntry.id : `weight-${Date.now()}`,
      weight: Math.round(weight * 10) / 10,
      unit: weightUnit,
      date: date || getTodayString(),
      createdAt: initialEntry ? initialEntry.createdAt : new Date().toISOString(),
    };

    onSave(entryToSave);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-900">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">
                <Scale className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {initialEntry ? 'Edit Weight' : 'Enter Weight'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 space-y-5">
            {/* Weight Input with Steppers */}
            <div className="space-y-2 text-center">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Weight ({weightUnit})
              </span>

              <div className="flex items-center justify-center space-x-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleAdjust(-0.5)}
                  className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 flex items-center justify-center text-xs font-mono font-bold active:scale-95 transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="flex items-baseline justify-center px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl min-w-[140px]">
                  <input
                    type="number"
                    step="0.1"
                    value={weight || ''}
                    onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                    className="w-24 text-3xl font-bold font-mono text-center text-white bg-transparent focus:outline-none"
                    autoFocus
                  />
                  <span className="text-sm font-mono text-zinc-400 ml-1 font-semibold uppercase">
                    {weightUnit}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleAdjust(0.5)}
                  className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 flex items-center justify-center text-xs font-mono font-bold active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-400" />
                <span>Date</span>
              </label>
              <input
                type="date"
                value={date}
                max={getTodayString()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                required
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors uppercase font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={weight <= 0}
                className="flex-1 py-3 px-4 rounded-xl bg-white text-black font-semibold text-xs font-mono tracking-wider flex items-center justify-center space-x-2 shadow-glow-sm hover:bg-zinc-200 transition-colors uppercase font-bold disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>Save Weight</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
