// src/components/weight/WeightGoalModal.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Check, Trash2, Plus, Minus } from 'lucide-react';
import { WeightGoal } from '../../types';

interface WeightGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goal: WeightGoal | null) => void;
  currentGoal?: WeightGoal | null;
  currentWeight?: number | null;
  weightUnit: 'kg' | 'lbs';
}

export const WeightGoalModal: React.FC<WeightGoalModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <WeightGoalModalContent {...props} />;
};

const WeightGoalModalContent: React.FC<WeightGoalModalProps> = ({
  onClose,
  onSave,
  currentGoal,
  currentWeight = 70.0,
  weightUnit,
}) => {
  const [targetWeight, setTargetWeight] = useState<number>(() => {
    if (currentGoal?.targetWeight) return currentGoal.targetWeight;
    const cur = currentWeight || 70.0;
    return cur > 70 ? cur - 5 : cur + 5;
  });

  const handleAdjust = (delta: number) => {
    setTargetWeight((prev) => {
      const next = Math.max(10, Math.min(300, Math.round((prev + delta) * 10) / 10));
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetWeight <= 0) return;

    const goalToSave: WeightGoal = {
      targetWeight: Math.round(targetWeight * 10) / 10,
      startWeight: currentWeight || targetWeight,
      goalType: targetWeight < (currentWeight || targetWeight) ? 'lose' : 'gain',
    };

    onSave(goalToSave);
    onClose();
  };

  const handleClearGoal = () => {
    onSave(null);
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
                <Target className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Set Target Weight
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
            <div className="space-y-2 text-center">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Target Weight ({weightUnit})
              </span>

              <div className="flex items-center justify-center space-x-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleAdjust(-1)}
                  className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 flex items-center justify-center text-xs font-mono font-bold active:scale-95 transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="flex items-baseline justify-center px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl min-w-[140px]">
                  <input
                    type="number"
                    step="0.1"
                    value={targetWeight || ''}
                    onChange={(e) => setTargetWeight(parseFloat(e.target.value) || 0)}
                    className="w-24 text-3xl font-bold font-mono text-center text-white bg-transparent focus:outline-none"
                    autoFocus
                  />
                  <span className="text-sm font-mono text-zinc-400 ml-1 font-semibold uppercase">
                    {weightUnit}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleAdjust(1)}
                  className="w-11 h-11 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 flex items-center justify-center text-xs font-mono font-bold active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {currentWeight && (
                <p className="text-xs font-mono text-zinc-500 pt-1">
                  Current Weight: <span className="text-zinc-300 font-semibold">{currentWeight} {weightUnit}</span>
                  {targetWeight !== currentWeight && (
                    <span className="ml-1.5 text-zinc-400">
                      ({Math.abs(Math.round((targetWeight - currentWeight) * 10) / 10)} {weightUnit}{' '}
                      {targetWeight < currentWeight ? 'to lose' : 'to gain'})
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors uppercase font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={targetWeight <= 0}
                  className="flex-1 py-3 px-4 rounded-xl bg-white text-black font-semibold text-xs font-mono tracking-wider flex items-center justify-center space-x-2 shadow-glow-sm hover:bg-zinc-200 transition-colors uppercase font-bold disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Target</span>
                </button>
              </div>

              {currentGoal && (
                <button
                  type="button"
                  onClick={handleClearGoal}
                  className="w-full py-2 text-center text-xs font-mono text-zinc-500 hover:text-red-400 flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Target</span>
                </button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
