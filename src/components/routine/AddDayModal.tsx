// src/components/routine/AddDayModal.tsx
import React, { useState } from 'react';
import { X, CalendarPlus, Clock, Dumbbell, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

interface AddDayModalProps {
  isOpen: boolean;
  onAddDay: (name: string, estimatedMinutes: number, isRestDay?: boolean) => void;
  onClose: () => void;
}

const PRESET_WORKOUT_NAMES = [
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

const PRESET_REST_NAMES = [
  'Rest & Recovery',
  'Active Recovery',
  'Mobility & Stretch',
  'Walk & Recovery',
];

export const AddDayModal: React.FC<AddDayModalProps> = ({
  isOpen,
  onAddDay,
  onClose,
}) => {
  const [dayType, setDayType] = useState<'workout' | 'rest'>('workout');
  const [dayName, setDayName] = useState<string>('');
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(50);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = dayName.trim() || (dayType === 'rest' ? 'Rest & Recovery' : 'Workout');

    onAddDay(finalName, dayType === 'rest' ? 0 : estimatedMinutes, dayType === 'rest');
    setDayName('');
    setDayType('workout');
    onClose();
  };

  const suggestions = dayType === 'workout' ? PRESET_WORKOUT_NAMES : PRESET_REST_NAMES;

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
              {dayType === 'workout' ? (
                <CalendarPlus className="w-4 h-4 text-white" />
              ) : (
                <Moon className="w-4 h-4 text-white" />
              )}
            </div>
            <h2 className="text-lg font-bold tracking-tight text-white">
              {dayType === 'workout' ? 'Add Workout Day' : 'Add Rest Day'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Day Type Toggle */}
        <div className="flex rounded-xl bg-zinc-900 p-1 border border-zinc-800 text-xs font-mono">
          <button
            type="button"
            onClick={() => {
              setDayType('workout');
              if (dayName === 'Rest & Recovery' || PRESET_REST_NAMES.includes(dayName)) {
                setDayName('');
              }
            }}
            className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all ${
              dayType === 'workout'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5" />
            <span>Workout Day</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setDayType('rest');
              if (!dayName || PRESET_WORKOUT_NAMES.includes(dayName)) {
                setDayName('Rest & Recovery');
              }
            }}
            className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all ${
              dayType === 'rest'
                ? 'bg-white text-black font-bold shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Rest Day</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[10px] font-mono uppercase text-zinc-400">
              {dayType === 'workout' ? 'Workout Day Name' : 'Rest Day Label'}
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder={dayType === 'workout' ? 'e.g. Upper Body or Push B' : 'e.g. Rest & Recovery'}
              value={dayName}
              onChange={(e) => setDayName(e.target.value)}
              className="w-full mt-1.5 px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-white font-mono"
            />
          </div>

          {/* Quick Preset Name Chips */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase text-zinc-500">Quick Suggestions</label>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((name) => (
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

          {/* Duration Selector (Only for Workout Day) */}
          {dayType === 'workout' ? (
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
          ) : (
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-xs font-mono text-zinc-400 flex items-start gap-2">
              <Moon className="w-4 h-4 text-zinc-300 mt-0.5 flex-shrink-0" />
              <span>No exercises will be scheduled for this day. It will serve as an active recovery marker in your continuous cycle.</span>
            </div>
          )}

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
