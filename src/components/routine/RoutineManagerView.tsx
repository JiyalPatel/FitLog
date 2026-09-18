// src/components/routine/RoutineManagerView.tsx
import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  Share2,
  Dumbbell,
  Moon
} from 'lucide-react';
import { Routine, RoutineDay, ExerciseTarget } from '../../types';
import { ExercisePickerModal } from '../common/ExercisePickerModal';
import { AddDayModal } from './AddDayModal';
import { RoutineImportExportModal } from './RoutineImportExportModal';
import { ConfirmDialogModal } from '../common/ConfirmDialogModal';
import { StandardExercise } from '../../services/data/standardExercises';

interface RoutineManagerViewProps {
  routine: Routine;
  onSaveRoutine: (routine: Routine) => void;
}

const PRESET_TEMPLATES = [
  {
    name: 'Push Pull Legs (PPL)',
    description: '6-day cycle for balanced hypertrophy and recovery.',
    days: [
      {
        name: 'Push',
        muscle: 'Chest / Delts / Triceps',
        exercises: [
          { name: 'Barbell Bench Press', muscleGroup: 'Chest', sets: 4, minReps: 6, maxReps: 10 },
          { name: 'Incline Dumbbell Press', muscleGroup: 'Chest', sets: 3, minReps: 8, maxReps: 12 },
          { name: 'Pec Dec Fly', muscleGroup: 'Chest', sets: 3, minReps: 12, maxReps: 15 },
          { name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', sets: 3, minReps: 8, maxReps: 12 },
          { name: 'Lateral Raise (Dumbbell)', muscleGroup: 'Shoulders', sets: 4, minReps: 12, maxReps: 15 },
          { name: 'Triceps Pushdown (Rope)', muscleGroup: 'Arms', sets: 3, minReps: 10, maxReps: 15 },
        ],
      },
      {
        name: 'Pull',
        muscle: 'Back / Biceps / Rear Delts',
        exercises: [
          { name: 'Lat Pulldown', muscleGroup: 'Back', sets: 4, minReps: 8, maxReps: 12 },
          { name: 'Barbell Bent Over Row', muscleGroup: 'Back', sets: 4, minReps: 8, maxReps: 10 },
          { name: 'Seated Cable Row', muscleGroup: 'Back', sets: 3, minReps: 10, maxReps: 12 },
          { name: 'Face Pull', muscleGroup: 'Shoulders', sets: 3, minReps: 15, maxReps: 20 },
          { name: 'Incline Dumbbell Curl', muscleGroup: 'Arms', sets: 3, minReps: 10, maxReps: 12 },
          { name: 'Hammer Curl', muscleGroup: 'Arms', sets: 3, minReps: 10, maxReps: 15 },
        ],
      },
      {
        name: 'Legs',
        muscle: 'Quads / Hamstrings / Calves',
        exercises: [
          { name: 'Barbell Back Squat', muscleGroup: 'Legs', sets: 4, minReps: 6, maxReps: 10 },
          { name: 'Romanian Deadlift (RDL)', muscleGroup: 'Legs', sets: 3, minReps: 8, maxReps: 12 },
          { name: 'Leg Press', muscleGroup: 'Legs', sets: 3, minReps: 10, maxReps: 15 },
          { name: 'Lying Leg Curl', muscleGroup: 'Legs', sets: 3, minReps: 12, maxReps: 15 },
          { name: 'Standing Calf Raise', muscleGroup: 'Legs', sets: 4, minReps: 15, maxReps: 20 },
        ],
      },
    ],
  },
  {
    name: 'Upper / Lower Split',
    description: '4-day split optimal for strength and frequency.',
    days: [
      {
        name: 'Upper Body A',
        muscle: 'Chest / Back / Arms',
        exercises: [
          { name: 'Barbell Bench Press', muscleGroup: 'Chest', sets: 4, minReps: 6, maxReps: 10 },
          { name: 'Barbell Bent Over Row', muscleGroup: 'Back', sets: 4, minReps: 6, maxReps: 10 },
          { name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', sets: 3, minReps: 8, maxReps: 12 },
          { name: 'Lat Pulldown', muscleGroup: 'Back', sets: 3, minReps: 8, maxReps: 12 },
          { name: 'Triceps Pushdown (Rope)', muscleGroup: 'Arms', sets: 3, minReps: 10, maxReps: 12 },
          { name: 'Incline Dumbbell Curl', muscleGroup: 'Arms', sets: 3, minReps: 10, maxReps: 12 },
        ],
      },
      {
        name: 'Lower Body A',
        muscle: 'Squat / Hamstrings / Calves',
        exercises: [
          { name: 'Barbell Back Squat', muscleGroup: 'Legs', sets: 4, minReps: 6, maxReps: 8 },
          { name: 'Romanian Deadlift (RDL)', muscleGroup: 'Legs', sets: 3, minReps: 8, maxReps: 12 },
          { name: 'Leg Extension', muscleGroup: 'Legs', sets: 3, minReps: 12, maxReps: 15 },
          { name: 'Lying Leg Curl', muscleGroup: 'Legs', sets: 3, minReps: 12, maxReps: 15 },
          { name: 'Standing Calf Raise', muscleGroup: 'Legs', sets: 4, minReps: 15, maxReps: 20 },
        ],
      },
    ],
  },
  {
    name: 'Full Body Foundational',
    description: '3-day foundational routine for overall strength.',
    days: [
      {
        name: 'Full Body A',
        muscle: 'Squat / Bench / Row',
        exercises: [
          { name: 'Barbell Back Squat', muscleGroup: 'Legs', sets: 3, minReps: 6, maxReps: 8 },
          { name: 'Barbell Bench Press', muscleGroup: 'Chest', sets: 3, minReps: 8, maxReps: 10 },
          { name: 'Lat Pulldown', muscleGroup: 'Back', sets: 3, minReps: 8, maxReps: 12 },
          { name: 'Lateral Raise (Dumbbell)', muscleGroup: 'Shoulders', sets: 3, minReps: 12, maxReps: 15 },
          { name: 'Triceps Pushdown (Rope)', muscleGroup: 'Arms', sets: 2, minReps: 12, maxReps: 15 },
        ],
      },
    ],
  },
];

export const RoutineManagerView: React.FC<RoutineManagerViewProps> = ({
  routine,
  onSaveRoutine,
}) => {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);

  // Modals state
  const [isAddDayOpen, setIsAddDayOpen] = useState<boolean>(false);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState<boolean>(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState<boolean>(false);
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);
  const [confirmSplitTemplate, setConfirmSplitTemplate] = useState<any | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const currentDay = routine.days[selectedDayIdx] || routine.days[0];

  // Reorder days
  const handleMoveDay = (idx: number, direction: 'up' | 'down') => {
    const newDays = [...routine.days];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= newDays.length) return;

    const temp = newDays[idx];
    newDays[idx] = newDays[targetIdx];
    newDays[targetIdx] = temp;

    newDays.forEach((d, i) => {
      d.dayOrder = i;
    });

    onSaveRoutine({ ...routine, days: newDays });
    setSelectedDayIdx(targetIdx);
  };

  // Add a new workout day or rest day
  const handleAddDay = (name: string, estimatedMinutes: number, isRestDay?: boolean) => {
    const newDay: RoutineDay = {
      id: `day-${Date.now()}`,
      name,
      dayOrder: routine.days.length,
      estimatedMinutes: isRestDay ? 0 : estimatedMinutes,
      exercises: [],
      isRestDay: Boolean(isRestDay),
    };

    const newDays = [...routine.days, newDay];
    onSaveRoutine({ ...routine, days: newDays });
    setSelectedDayIdx(newDays.length - 1);
  };

  // Toggle Day Type between Workout and Rest Day
  const handleToggleRestDay = (idx: number) => {
    const newDays = [...routine.days];
    const current = newDays[idx];
    const willBeRest = !current.isRestDay;
    newDays[idx] = {
      ...current,
      isRestDay: willBeRest,
      estimatedMinutes: willBeRest ? 0 : 50,
      name: willBeRest && (current.name.toLowerCase().includes('day') || current.name.toLowerCase().includes('workout'))
        ? 'Rest & Recovery'
        : current.name,
    };
    onSaveRoutine({ ...routine, days: newDays });
  };

  // Confirm delete day
  const handleDeleteDayConfirm = () => {
    if (confirmDeleteIdx === null) return;

    if (routine.days.length <= 1) {
      setInfoMessage('Your routine must have at least 1 workout day.');
      setConfirmDeleteIdx(null);
      return;
    }

    const newDays = routine.days.filter((_, i) => i !== confirmDeleteIdx);
    newDays.forEach((d, i) => {
      d.dayOrder = i;
    });

    onSaveRoutine({ ...routine, days: newDays });
    setSelectedDayIdx(Math.max(0, confirmDeleteIdx - 1));
    setConfirmDeleteIdx(null);
  };

  // Add exercise from picker modal
  const handleSelectExercise = (exercise: StandardExercise) => {
    const newEx: ExerciseTarget = {
      id: `ex-${Date.now()}`,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      targetSets: exercise.defaultSets,
      targetRepsMin: exercise.defaultRepsMin,
      targetRepsMax: exercise.defaultRepsMax,
      orderIndex: currentDay.exercises.length,
    };

    const updatedDays = [...routine.days];
    updatedDays[selectedDayIdx] = {
      ...currentDay,
      exercises: [...currentDay.exercises, newEx],
    };

    onSaveRoutine({ ...routine, days: updatedDays });
    setIsExercisePickerOpen(false);
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

  // Apply preset template
  const handleApplyTemplate = () => {
    if (!confirmSplitTemplate) return;

    const newDays: RoutineDay[] = confirmSplitTemplate.days.map((d: any, dIdx: number) => ({
      id: `day-${Date.now()}-${dIdx}`,
      name: d.name,
      dayOrder: dIdx,
      estimatedMinutes: 50,
      exercises: d.exercises.map((e: any, eIdx: number) => ({
        id: `ex-${Date.now()}-${dIdx}-${eIdx}`,
        name: e.name,
        muscleGroup: e.muscleGroup,
        targetSets: e.sets,
        targetRepsMin: e.minReps,
        targetRepsMax: e.maxReps,
        orderIndex: eIdx,
      })),
    }));

    const updatedRoutine: Routine = {
      ...routine,
      name: confirmSplitTemplate.name,
      description: confirmSplitTemplate.description,
      currentQueueIndex: 0,
      days: newDays,
    };

    onSaveRoutine(updatedRoutine);
    setSelectedDayIdx(0);
    setConfirmSplitTemplate(null);
  };

  return (
    <div className="flex-1 px-4 py-5 pb-24 space-y-6 overflow-y-auto">
      {/* Header & Export / Import Action */}
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
            WORKOUT SCHEDULE
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
            Your Routine
          </h2>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Your workouts follow a continuous sequence. Missed days roll forward so you never lose momentum.
          </p>
        </div>

        <button
          onClick={() => setIsImportExportOpen(true)}
          className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-300 hover:text-white flex items-center space-x-1.5 text-xs font-mono flex-shrink-0"
          title="Export / Import Routine"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>SHARE / BACKUP</span>
        </button>
      </div>

      {/* Routine Days Sequence Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
            SEQUENCE ORDER
          </span>
          <button
            onClick={() => setIsAddDayOpen(true)}
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
                className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-mono border transition-all flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-white text-black font-bold border-white shadow-glow-sm'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:border-zinc-700'
                }`}
              >
                <span>#{idx + 1}</span>
                {day.isRestDay && (
                  <Moon className={`w-3 h-3 ${isSelected ? 'text-black' : 'text-zinc-400'}`} />
                )}
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
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">
                  DAY {selectedDayIdx + 1} OF {routine.days.length}
                </span>
                {currentDay.isRestDay && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 flex items-center gap-1">
                    <Moon className="w-2.5 h-2.5" /> REST DAY
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">{currentDay.name}</h3>
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
                onClick={() => setConfirmDeleteIdx(selectedDayIdx)}
                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300"
                title="Delete this day"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* If Rest Day: Show Recovery Card */}
          {currentDay.isRestDay ? (
            <div className="py-8 px-4 text-center rounded-xl bg-zinc-900/30 border border-zinc-900 space-y-3">
              <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-200">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Scheduled Rest & Recovery</h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed font-mono">
                  No workouts scheduled for this day. Rest allows muscle tissue to repair and build stronger. Take time to hydrate, stretch, and get quality sleep.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => handleToggleRestDay(selectedDayIdx)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1.5 mx-auto transition-colors"
                >
                  <Dumbbell className="w-3.5 h-3.5" /> Convert to Workout Day
                </button>
              </div>
            </div>
          ) : (
            /* Exercises for this Workout Day */
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400 uppercase">
                <span>Exercises ({currentDay.exercises.length})</span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleRestDay(selectedDayIdx)}
                    className="text-[11px] font-mono text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                    title="Change to Rest Day"
                  >
                    <Moon className="w-3 h-3" /> Make Rest Day
                  </button>
                  <button
                    onClick={() => setIsExercisePickerOpen(true)}
                    className="text-zinc-300 hover:text-white flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Select Exercise
                  </button>
                </div>
              </div>

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
                        {ex.targetSets} sets · {ex.targetRepsMin}–{ex.targetRepsMax} reps
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

              {currentDay.exercises.length === 0 && (
                <div className="py-6 text-center rounded-xl bg-zinc-900/30 border border-dashed border-zinc-800 space-y-2">
                  <Dumbbell className="w-6 h-6 text-zinc-600 mx-auto" />
                  <p className="text-xs font-mono text-zinc-400">No exercises added to this day yet.</p>
                  <button
                    onClick={() => setIsExercisePickerOpen(true)}
                    className="px-3.5 py-1.5 bg-white text-black font-semibold font-mono text-xs rounded-lg hover:bg-zinc-200"
                  >
                    + Pick from Standard Exercises
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
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
                      {d.name} ({d.exercises.length} ex)
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setConfirmSplitTemplate(tmpl)}
                className="ml-3 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-600 flex-shrink-0"
              >
                LOAD SPLIT
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add Day Modal (replaces browser prompt) */}
      <AddDayModal
        isOpen={isAddDayOpen}
        onAddDay={handleAddDay}
        onClose={() => setIsAddDayOpen(false)}
      />

      {/* Exercise Picker Modal (Pre-loaded standard library) */}
      <ExercisePickerModal
        isOpen={isExercisePickerOpen}
        title="Add Exercise to Routine"
        subtitle="Search pre-loaded standard gym exercises"
        onSelectExercise={handleSelectExercise}
        onClose={() => setIsExercisePickerOpen(false)}
      />

      {/* Import & Export Modal */}
      <RoutineImportExportModal
        isOpen={isImportExportOpen}
        routine={routine}
        onImportRoutine={(newRoutine) => {
          onSaveRoutine(newRoutine);
          setSelectedDayIdx(0);
        }}
        onClose={() => setIsImportExportOpen(false)}
      />

      {/* Confirm Delete Day Dialog */}
      <ConfirmDialogModal
        isOpen={confirmDeleteIdx !== null}
        title="Delete Workout Day"
        message={`Are you sure you want to remove "${routine.days[confirmDeleteIdx || 0]?.name}" from your routine sequence?`}
        confirmLabel="DELETE DAY"
        isDestructive={true}
        onConfirm={handleDeleteDayConfirm}
        onCancel={() => setConfirmDeleteIdx(null)}
      />

      {/* Confirm Template Switch Dialog */}
      <ConfirmDialogModal
        isOpen={confirmSplitTemplate !== null}
        title={`Switch to ${confirmSplitTemplate?.name}?`}
        message="This will update your workout routine sequence with the pre-loaded exercises for this split. Your historical workouts and PRs will remain safe."
        confirmLabel="LOAD THIS SPLIT"
        onConfirm={handleApplyTemplate}
        onCancel={() => setConfirmSplitTemplate(null)}
      />

      {/* Info message notification */}
      {infoMessage && (
        <ConfirmDialogModal
          isOpen={true}
          title="Notice"
          message={infoMessage}
          confirmLabel="OK"
          onConfirm={() => setInfoMessage(null)}
          onCancel={() => setInfoMessage(null)}
        />
      )}
    </div>
  );
};
