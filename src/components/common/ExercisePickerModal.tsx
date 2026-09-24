// src/components/common/ExercisePickerModal.tsx
import React, { useState, useMemo } from 'react';
import { X, Search, Plus, Check, Dumbbell } from 'lucide-react';
import { motion } from 'framer-motion';
import { MuscleGroup } from '../../types';
import { STANDARD_EXERCISES, StandardExercise, searchStandardExercises } from '../../services/data/standardExercises';

interface ExercisePickerModalProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  initialMuscleGroup?: MuscleGroup | 'All';
  onSelectExercise: (exercise: StandardExercise) => void;
  onClose: () => void;
}

export const ExercisePickerModal: React.FC<ExercisePickerModalProps> = ({
  isOpen,
  title = 'Select Exercise',
  subtitle = 'Choose from standard gym exercises or create custom',
  initialMuscleGroup = 'All',
  onSelectExercise,
  onClose,
}) => {
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | 'All'>(initialMuscleGroup);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [customMuscle, setCustomMuscle] = useState<MuscleGroup>('Chest');

  const filteredExercises = useMemo(() => {
    return searchStandardExercises(searchQuery, selectedMuscle);
  }, [searchQuery, selectedMuscle]);

  if (!isOpen) return null;

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    onSelectExercise({
      name: customName.trim(),
      muscleGroup: customMuscle,
      defaultSets: 3,
      defaultRepsMin: 8,
      defaultRepsMax: 12,
    });
    setCustomName('');
    setShowCustomForm(false);
  };

  const muscleGroups: (MuscleGroup | 'All')[] = [
    'All',
    'Chest',
    'Back',
    'Shoulders',
    'Legs',
    'Biceps',
    'Triceps',
    'Forearms',
    'Core',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md h-[85vh] max-h-[650px] rounded-3xl bg-zinc-950 border border-zinc-800 p-5 shadow-2xl flex flex-col text-white relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-900 flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">{title}</h2>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="pt-3 flex-shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Search exercise (e.g. Smith Machine, Bench)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white font-mono"
            />
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Muscle Group Filter Pills */}
        <div className="pt-3 pb-2 flex space-x-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
          {muscleGroups.map((muscle) => (
            <button
              key={muscle}
              onClick={() => setSelectedMuscle(muscle)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex-shrink-0 ${
                selectedMuscle === muscle
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {muscle}
            </button>
          ))}
        </div>

        {/* Exercises List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 pt-1">
          {filteredExercises.map((ex) => (
            <button
              key={ex.name}
              onClick={() => onSelectExercise(ex)}
              className="w-full p-3 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 transition-all flex items-center justify-between text-left group"
            >
              <div>
                <div className="text-xs font-semibold text-white group-hover:text-white">
                  {ex.name}
                </div>
                {ex.description && (
                  <p className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                    {ex.description}
                  </p>
                )}
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                    {ex.muscleGroup}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {ex.defaultSets} sets · {ex.defaultRepsMin}–{ex.defaultRepsMax} reps
                  </span>
                </div>
              </div>

              <div className="w-7 h-7 rounded-lg bg-zinc-800 group-hover:bg-white group-hover:text-black flex items-center justify-center text-zinc-400 transition-colors">
                <Check className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}

          {filteredExercises.length === 0 && (
            <div className="py-8 text-center space-y-2">
              <Dumbbell className="w-8 h-8 text-zinc-600 mx-auto" />
              <div className="text-xs font-mono text-zinc-400">No matching standard exercise found</div>
              <button
                onClick={() => {
                  setCustomName(searchQuery);
                  setShowCustomForm(true);
                }}
                className="mt-2 px-3 py-1.5 bg-white text-black text-xs font-mono font-semibold rounded-lg hover:bg-zinc-200"
              >
                Add "{searchQuery}" as Custom Exercise
              </button>
            </div>
          )}
        </div>

        {/* Custom Exercise Drawer / Toggle */}
        <div className="pt-3 border-t border-zinc-900 flex-shrink-0">
          {!showCustomForm ? (
            <button
              onClick={() => setShowCustomForm(true)}
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>CUSTOM EXERCISE (ENTER OWN NAME)</span>
            </button>
          ) : (
            <form onSubmit={handleCreateCustom} className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-zinc-400">Custom Exercise</span>
                <button
                  type="button"
                  onClick={() => setShowCustomForm(false)}
                  className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300"
                >
                  CANCEL
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="Exercise name (e.g. Hex Bar Shrugs)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-white font-mono"
              />
              <div className="flex space-x-2">
                <select
                  value={customMuscle}
                  onChange={(e) => setCustomMuscle(e.target.value as MuscleGroup)}
                  className="flex-1 px-2.5 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-white font-mono"
                >
                  <option value="Chest">Chest</option>
                  <option value="Back">Back</option>
                  <option value="Shoulders">Shoulders</option>
                  <option value="Legs">Legs</option>
                  <option value="Biceps">Biceps</option>
                  <option value="Triceps">Triceps</option>
                  <option value="Forearms">Forearms</option>
                  <option value="Core">Core</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-white text-black font-bold font-mono text-xs rounded-lg hover:bg-zinc-200 uppercase"
                >
                  ADD
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
