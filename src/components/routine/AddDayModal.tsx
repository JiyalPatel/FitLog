// src/components/routine/AddDayModal.tsx
import React, { useState } from 'react';
import { X, CalendarPlus, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface AddDayModalProps {
  isOpen: boolean;
  onAddDay: (name: string, estimatedMinutes: number) => void;
  onClose: () => void;
}

const PRESET_DAY_NAMES = [
  'Push',
  'Pull',
  'Legs',
  'Upper Body',
  'Lower Body',
  'Full Body',
  'Arms & Delts',
  'Chest & Triceps',
  'Back & Biceps',
  'Core & Conditioning',
];

export const AddDayModal: React.FC<AddDayModalProps> = ({
  isOpen,
  onAddDay,
  onClose,
}) => {
  const [dayName, setDayName] = useState<string>('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(50);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dayName.trim()) return;

    onAddDay(dayName.trim(), estimatedMinutes);
    setDayName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl space-y-5 text-white relative"
      >
        <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <CalendarPlus className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white">Add Workout Day</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-400">Workout Day Name</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Upper Body or Push B"
              value={dayName}
              onChange={(e) => setDayName(e.target.value)}
              className="w-full mt-1.5 px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white font-mono"
            />
          </div>

          {/* Quick Preset Name Chips */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase text-zinc-500">Quick Suggestions</label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_DAY_NAMES.map((name) => (
                <button
                  type="button"
                  key={name}
                  onClick={() => setDayName(name)}
                  className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border transition-all ${
                    dayName === name
                      ? 'bg-white text-black font-semibold border-white'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* Duration Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-zinc-500" /> Estimated Duration
            </label>
            <div className="flex space-x-1.5">
              {[30, 45, 50, 60, 75].map((mins) => (
                <button
                  type="button"
                  key={mins}
                  onClick={() => setEstimatedMinutes(mins)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono border transition-all ${
                    estimatedMinutes === mins
                      ? 'bg-white text-black font-bold border-white'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="flex-1 py-3 bg-white text-black font-bold font-mono text-xs rounded-xl shadow-glow-sm hover:bg-zinc-200 transition-colors uppercase"
            >
              ADD TO ROUTINE
            </motion.button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-xs rounded-xl hover:text-white"
            >
              CANCEL
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
