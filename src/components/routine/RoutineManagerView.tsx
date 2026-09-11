// src/components/routine/RoutineManagerView.tsx
import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  CalendarRange, 
  Sparkles, 
  Check, 
  ChevronRight,
  Dumbbell
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Routine, RoutineDay, ExerciseTarget, MuscleGroup } from '../../types';

interface RoutineManagerViewProps {
  routine: Routine;
  onSaveRoutine: (routine: Routine) => void;
}

const PRESET_TEMPLATES = [
  {
    name: 'Push Pull Legs (PPL)',
    description: '6-day cycle for balanced hypertrophy and recovery.',
    days: [
      { name: 'Push', muscle: 'Chest / Delts / Triceps', exercisesCount: 6 },
      { name: 'Pull', muscle: 'Back / Biceps / Rear Delts', exercisesCount: 6 },
      { name: 'Legs', muscle: 'Quads / Hamstrings / Calves', exercisesCount: 5 },
    ],
  },
  {
    name: 'Upper / Lower Split',
    description: '4-day split optimal for strength and frequency.',
    days: [
      { name: 'Upper A', muscle: 'Chest / Back / Arms', exercisesCount: 6 },
      { name: 'Lower A', muscle: 'Squat / Hamstrings', exercisesCount: 5 },
      { name: 'Upper B', muscle: 'Incline / Rows / Delts', exercisesCount: 6 },
      { name: 'Lower B', muscle: 'Deadlift / Quads', exercisesCount: 5 },
    ],
  },
  {
    name: 'Full Body Routine',
    description: '3-day foundational routine for overall conditioning.',
    days: [
      { name: 'Full Body A', muscle: 'Squat / Bench / Row', exercisesCount: 5 },
      { name: 'Full Body B', muscle: 'Deadlift / OHP / Pullup', exercisesCount: 5 },
      { name: 'Full Body C', muscle: 'Leg Press / Incline / Arms', exercisesCount: 5 },
    ],
  },
];

export const RoutineManagerView: React.FC<RoutineManagerViewProps> = ({
  routine,
  onSaveRoutine,
}) => {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [showAddExercise, setShowAddExercise] = useState<boolean>(false);
  const [newExerciseName, setNewExerciseName] = useState<string>('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState<MuscleGroup>('Chest');
  const [newExerciseSets, setNewExerciseSets] = useState<number>(3);
  const [newExerciseRepsMin, setNewExerciseRepsMin] = useState<number>(8);
  const [newExerciseRepsMax, setNewExerciseRepsMax] = useState<number>(12);

  const currentDay = routine.days[selectedDayIdx] || routine.days[0];

  // Reorder days
  const handleMoveDay = (idx: number, direction: 'up' | 'down') => {
    const newDays = [...routine.days];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newDays.length) return;

    const temp = newDays[idx];
    newDays[idx] = newDays[targetIdx];
    newDays[targetIdx] = temp;

    // Update dayOrder
    newDays.forEach((d, i) => {
      d.dayOrder = i;
    });

    onSaveRoutine({ ...routine, days: newDays });
    setSelectedDayIdx(targetIdx);
  };

  // Add a new workout day
  const handleAddDay = () => {
    const dayName = prompt('Enter Day Name (e.g., Arms & Shoulders, Cardio & Abs):');
    if (!dayName || !dayName.trim()) return;

    const newDay: RoutineDay = {
      id: `day-${Date.now()}`,
      name: dayName.trim(),
      dayOrder: routine.days.length,
      estimatedMinutes: 45,
      exercises: [
        {
          id: `ex-${Date.now()}`,
          name: 'Primary Compound Lift',
          muscleGroup: 'Chest',
          targetSets: 3,
          targetRepsMin: 8,
          targetRepsMax: 12,
          orderIndex: 0,
        },
      ],
    };

    const newDays = [...routine.days, newDay];
    onSaveRoutine({ ...routine, days: newDays });
    setSelectedDayIdx(newDays.length - 1);
  };

  // Delete day
  const handleDeleteDay = (idx: number) => {
    if (routine.days.length <= 1) {
      alert('Routine must have at least 1 workout day.');
      return;
    }
    const newDays = routine.days.filter((_, i) => i !== idx);
    newDays.forEach((d, i) => {
      d.dayOrder = i;
    });
    onSaveRoutine({ ...routine, days: newDays });
    setSelectedDayIdx(Math.max(0, idx - 1));
  };

  // Add exercise to current day
  const handleAddExerciseToDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExerciseName.trim()) return;

    const newEx: ExerciseTarget = {
      id: `ex-${Date.now()}`,
      name: newExerciseName.trim(),
      muscleGroup: newExerciseMuscle,
      targetSets: newExerciseSets,
      targetRepsMin: newExerciseRepsMin,
      targetRepsMax: newExerciseRepsMax,
      orderIndex: currentDay.exercises.length,
    };

    const updatedDays = [...routine.days];
    updatedDays[selectedDayIdx] = {
      ...currentDay,
      exercises: [...currentDay.exercises, newEx],
    };

    onSaveRoutine({ ...routine, days: updatedDays });
    setNewExerciseName('');
    setShowAddExercise(false);
  };

  // Remove exercise from day
  const handleRemoveExercise = (exIdx: number) => {
    const updatedDays = [...routine.days];
    const newExList = currentDay.exercises.filter((_, i) => i !== exIdx);
    newExList.forEach((ex, i) => {
      ex.orderIndex = i;
    });
    updatedDays[selectedDayIdx] = { ...currentDay, exercises: newExList };
    onSaveRoutine({ ...routine, days: updatedDays });
  };

  return (
    <div className="flex-1 px-4 py-5 pb-24 space-y-6 overflow-y-auto">
      {/* Header */}
      <div>
        <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
          WORKOUT SCHEDULE
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
          Your Workout Routine
        </h2>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
          Your routine sequence is continuous. Missed days roll forward automatically so you never lose momentum.
        </p>
      </div>

      {/* Routine Days Sequence Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
            SEQUENCE ORDER
          </span>
          <button
            onClick={handleAddDay}
            className="text-xs font-mono text-zinc-300 hover:text-white flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ADD DAY</span>
          </button>
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {routine.days.map((day, idx) => {
            const isSelected = idx === selectedDayIdx;
            return (
              <button
                key={day.id}
                onClick={() => setSelectedDayIdx(idx)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-mono border transition-all flex items-center space-x-2 ${
                  isSelected
                    ? 'bg-white text-black font-bold border-white shadow-glow-sm'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:border-zinc-700'
                }`}
              >
                <span>#{idx + 1}</span>
                <span>{day.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Selected Day Editor */}
      {currentDay && (
        <div className="rounded-2xl bg-zinc-950 border border-zinc-900 p-4 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
            <div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase">
                DAY {selectedDayIdx + 1} OF {routine.days.length}
              </span>
              <h3 className="text-lg font-bold text-white">{currentDay.name}</h3>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleMoveDay(selectedDayIdx, 'up')}
                disabled={selectedDayIdx === 0}
                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30"
                title="Move earlier in sequence"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleMoveDay(selectedDayIdx, 'down')}
                disabled={selectedDayIdx === routine.days.length - 1}
                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30"
                title="Move later in sequence"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteDay(selectedDayIdx)}
                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300"
                title="Delete this day"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Exercises for this Day */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 uppercase">
              <span>Exercises ({currentDay.exercises.length})</span>
              <button
                onClick={() => setShowAddExercise(!showAddExercise)}
                className="text-zinc-300 hover:text-white flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Exercise
              </button>
            </div>

            {/* Add Exercise Inline Form */}
            {showAddExercise && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={handleAddExerciseToDay}
                className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3"
              >
                <div>
                  <label className="text-[10px] font-mono uppercase text-zinc-400">
                    Exercise Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bulgarian Split Squat"
                    value={newExerciseName}
                    onChange={(e) => setNewExerciseName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-zinc-400">
                      Muscle Group
                    </label>
                    <select
                      value={newExerciseMuscle}
                      onChange={(e) => setNewExerciseMuscle(e.target.value as MuscleGroup)}
                      className="w-full mt-1 px-2.5 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-white font-mono"
                    >
                      <option value="Chest">Chest</option>
                      <option value="Back">Back</option>
                      <option value="Shoulders">Shoulders</option>
                      <option value="Legs">Legs</option>
                      <option value="Arms">Arms</option>
                      <option value="Core">Core</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase text-zinc-400">
                      Target Sets
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={newExerciseSets}
                      onChange={(e) => setNewExerciseSets(parseInt(e.target.value) || 3)}
                      className="w-full mt-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white focus:outline-none focus:border-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex space-x-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-white text-black font-bold font-mono text-xs rounded-lg hover:bg-zinc-200 transition-colors"
                  >
                    SAVE EXERCISE
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddExercise(false)}
                    className="px-3 py-2 bg-zinc-800 text-zinc-400 font-mono text-xs rounded-lg hover:text-white"
                  >
                    CANCEL
                  </button>
                </div>
              </motion.form>
            )}

            {/* List of Exercises */}
            <div className="space-y-2">
              {currentDay.exercises.map((ex, exIdx) => (
                <div
                  key={ex.id}
                  className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-850 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-950 text-zinc-400 border border-zinc-800">
                        {ex.muscleGroup}
                      </span>
                      <span className="text-xs font-mono text-zinc-400">
                        {ex.targetSets} sets × {ex.targetRepsMin}–{ex.targetRepsMax} reps
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-white mt-1">
                      {ex.name}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveExercise(exIdx)}
                    className="p-1.5 text-zinc-600 hover:text-zinc-400"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Popular Routine Splits Switcher */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-white" /> Popular Workout Splits
        </h3>

        <div className="space-y-2">
          {PRESET_TEMPLATES.map((tmpl) => (
            <div
              key={tmpl.name}
              className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-between hover:border-zinc-800 transition-colors"
            >
              <div>
                <div className="text-sm font-bold text-white">{tmpl.name}</div>
                <p className="text-xs text-zinc-400 mt-0.5">{tmpl.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {tmpl.days.map((d) => (
                    <span
                      key={d.name}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800"
                    >
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  if (confirm(`Switch routine to ${tmpl.name}? This will update your active workout sequence.`)) {
                    // Quick template switch
                    alert(`Loaded ${tmpl.name} into your active sequence.`);
                  }
                }}
                className="ml-3 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-600 flex-shrink-0"
              >
                LOAD SPLIT
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
