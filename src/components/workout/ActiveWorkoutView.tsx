// src/components/workout/ActiveWorkoutView.tsx
import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Plus, 
  Trash2, 
  Clock, 
  Award, 
  ChevronDown, 
  ChevronUp, 
  Volume2, 
  VolumeX, 
  X,
  Repeat,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkoutSession, WorkoutExerciseLog, WorkoutSet, PersonalRecord, UserProfile } from '../../types';
import { evaluateSetForPR, getHistoricalMaxWeight } from '../../services/engine/prEngine';
import { getPreviousExerciseSets } from '../../services/engine/rollingQueue';
import { soundEffects } from '../../services/audio/soundEffects';
import { ExercisePickerModal } from '../common/ExercisePickerModal';
import { ConfirmDialogModal } from '../common/ConfirmDialogModal';
import { StandardExercise } from '../../services/data/standardExercises';

interface ActiveWorkoutViewProps {
  session: WorkoutSession;
  previousSessions: WorkoutSession[];
  prs: PersonalRecord[];
  profile?: UserProfile;
  onUpdateSession: (session: WorkoutSession) => void;
  onFinishWorkout: () => void;
  onCancelWorkout: () => void;
}

export const ActiveWorkoutView: React.FC<ActiveWorkoutViewProps> = ({
  session,
  previousSessions,
  prs,
  profile,
  onUpdateSession,
  onFinishWorkout,
  onCancelWorkout,
}) => {
  const weightUnit = profile?.weightUnit || 'kg';
  // Elapsed Workout Time
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(session.durationSeconds || 0);

  // Rest Timer State
  const defaultRestSeconds = profile?.restTimerDefaultSeconds ?? 90;
  const [restTimerSeconds, setRestTimerSeconds] = useState<number | null>(null);
  const [restTimerTotal, setRestTimerTotal] = useState<number>(defaultRestSeconds > 0 ? defaultRestSeconds : 90);
  const [isRestTimerPaused, setIsRestTimerPaused] = useState<boolean>(false);

  // Sound enabled state
  const [soundEnabled, setSoundEnabled] = useState<boolean>(profile?.soundEnabled ?? true);

  // Recent PR Alert state
  const [newPRAlert, setNewPRAlert] = useState<{ exercise: string; details: string } | null>(null);

  // Expanded notes per exercise
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});

  // Swap exercise state
  const [swapExerciseIdx, setSwapExerciseIdx] = useState<number | null>(null);

  // Add bonus exercise for today
  const [isAddExerciseForTodayOpen, setIsAddExerciseForTodayOpen] = useState<boolean>(false);

  // Discard workout confirm modal
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState<boolean>(false);

  // Toast feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Elapsed workout timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Rest Timer Countdown effect
  useEffect(() => {
    if (restTimerSeconds === null || isRestTimerPaused) return;

    if (restTimerSeconds <= 0) {
      if (soundEnabled) soundEffects.playTimerDone();
      setRestTimerSeconds(null);
      return;
    }

    const interval = setInterval(() => {
      setRestTimerSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(interval);
  }, [restTimerSeconds, isRestTimerPaused, soundEnabled]);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Get previous performance for an exercise
  const getPreviousPerformance = (exerciseName: string) => {
    for (const prev of previousSessions) {
      const ex = prev.exercises.find(
        (e) => e.exerciseName.toLowerCase() === exerciseName.toLowerCase()
      );
      if (ex && ex.sets.length > 0) {
        return ex.sets.map((s) => `${s.weight}${weightUnit} × ${s.reps}`).join(' · ');
      }
    }
    return null;
  };

  // Get PR for an exercise
  const getExercisePR = (exerciseName: string) => {
    const { maxWeight, repsAtMax } = getHistoricalMaxWeight(exerciseName, prs, previousSessions);
    return maxWeight > 0 ? `${maxWeight}${weightUnit}${repsAtMax > 0 ? ` × ${repsAtMax}` : ''}` : null;
  };

  // Handle Set Toggle Completed
  const handleToggleSetComplete = (exerciseIdx: number, setIdx: number) => {
    const updatedExercises = [...session.exercises];
    const targetSet = { ...updatedExercises[exerciseIdx].sets[setIdx] };
    const willBeCompleted = !targetSet.isCompleted;

    targetSet.isCompleted = willBeCompleted;

    if (willBeCompleted) {
      if (soundEnabled) soundEffects.playSetComplete();

      // Check for PR strictly based on weight
      const exerciseName = updatedExercises[exerciseIdx].exerciseName;
      const currentSessionCompletedSets = updatedExercises[exerciseIdx].sets.filter(
        (s, idx) => idx !== setIdx && s.isCompleted
      );
      const detectedPR = evaluateSetForPR(
        exerciseName,
        targetSet,
        prs,
        previousSessions,
        currentSessionCompletedSets
      );

      if (detectedPR) {
        targetSet.isPR = true;
        if (soundEnabled) soundEffects.playPRCelebration();

        setNewPRAlert({
          exercise: exerciseName,
          details: `${targetSet.weight} ${weightUnit} × ${targetSet.reps} reps`,
        });

        setTimeout(() => setNewPRAlert(null), 4000);

        const currentPrs = session.prsAchieved || [];
        if (!currentPrs.some((p) => p.id === detectedPR.id)) {
          session.prsAchieved = [...currentPrs, detectedPR];
        }
      } else {
        targetSet.isPR = false;
      }

      // Trigger Rest Timer (only if rest interval is enabled, i.e. > 0)
      if (defaultRestSeconds > 0) {
        setRestTimerTotal(defaultRestSeconds);
        setRestTimerSeconds(defaultRestSeconds);
        setIsRestTimerPaused(false);
      }
    } else {
      targetSet.isPR = false;
      if (session.prsAchieved) {
        const exNameNorm = updatedExercises[exerciseIdx].exerciseName.toLowerCase();
        session.prsAchieved = session.prsAchieved.filter(
          (p) => !(p.exerciseName.toLowerCase() === exNameNorm && p.weight === targetSet.weight)
        );
      }
    }

    updatedExercises[exerciseIdx].sets[setIdx] = targetSet;

    // Recalculate total volume and completed sets
    let totalVol = 0;
    let completedCount = 0;
    updatedExercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.isCompleted) {
          totalVol += s.weight * s.reps;
          completedCount++;
        }
      });
    });

    onUpdateSession({
      ...session,
      exercises: updatedExercises,
      totalVolume: totalVol,
      totalSets: completedCount,
    });
  };

  // Update Set Weight or Reps
  const handleUpdateSet = (
    exerciseIdx: number,
    setIdx: number,
    field: 'weight' | 'reps',
    value: number
  ) => {
    const updatedExercises = [...session.exercises];
    const targetSet = { ...updatedExercises[exerciseIdx].sets[setIdx], [field]: Math.max(0, value) };
    updatedExercises[exerciseIdx].sets[setIdx] = targetSet;

    let totalVol = 0;
    updatedExercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.isCompleted) totalVol += s.weight * s.reps;
      });
    });

    onUpdateSession({
      ...session,
      exercises: updatedExercises,
      totalVolume: totalVol,
    });
  };

  // Add Set to Exercise
  const handleAddSet = (exerciseIdx: number) => {
    const updatedExercises = [...session.exercises];
    const sets = updatedExercises[exerciseIdx].sets;
    const lastSet = sets[sets.length - 1];

    const newSet: WorkoutSet = {
      id: `s-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      setNumber: sets.length + 1,
      weight: lastSet ? lastSet.weight : 20,
      reps: lastSet ? lastSet.reps : 10,
      isCompleted: false,
    };

    updatedExercises[exerciseIdx].sets.push(newSet);
    onUpdateSession({ ...session, exercises: updatedExercises });
  };

  // Remove Set
  const handleRemoveSet = (exerciseIdx: number, setIdx: number) => {
    const updatedExercises = [...session.exercises];
    if (updatedExercises[exerciseIdx].sets.length <= 1) return;

    updatedExercises[exerciseIdx].sets.splice(setIdx, 1);
    updatedExercises[exerciseIdx].sets.forEach((s, idx) => {
      s.setNumber = idx + 1;
    });

    onUpdateSession({ ...session, exercises: updatedExercises });
  };

  // Swap Exercise for Today
  const handleSwapExerciseSelect = (newEx: StandardExercise) => {
    if (swapExerciseIdx === null) return;

    const updatedExercises = [...session.exercises];
    const oldName = updatedExercises[swapExerciseIdx].exerciseName;
    const prevSets = getPreviousExerciseSets(newEx.name, previousSessions);

    // Adapt existing uncompleted sets to swapped exercise's previous weights/reps
    const updatedSets = updatedExercises[swapExerciseIdx].sets.map((set, idx) => {
      if (set.isCompleted) return set;
      const prevSet = prevSets ? (prevSets[idx] || prevSets[prevSets.length - 1]) : null;
      return {
        ...set,
        weight: prevSet?.weight ?? 20,
        reps: prevSet?.reps ?? newEx.defaultRepsMin,
      };
    });

    updatedExercises[swapExerciseIdx] = {
      ...updatedExercises[swapExerciseIdx],
      exerciseName: newEx.name,
      muscleGroup: newEx.muscleGroup,
      sets: updatedSets,
    };

    onUpdateSession({ ...session, exercises: updatedExercises });
    setToastMessage(`Swapped ${oldName} → ${newEx.name} for today!`);
    setTimeout(() => setToastMessage(null), 3500);
    setSwapExerciseIdx(null);
  };

  // Add Bonus Exercise for Today
  const handleAddExerciseToToday = (exercise: StandardExercise) => {
    const prevSets = getPreviousExerciseSets(exercise.name, previousSessions);
    const sets: WorkoutSet[] = [];
    for (let i = 1; i <= exercise.defaultSets; i++) {
      const prevSet = prevSets ? (prevSets[i - 1] || prevSets[prevSets.length - 1]) : null;
      sets.push({
        id: `s-${Date.now()}-${i}`,
        setNumber: i,
        weight: prevSet?.weight ?? 20,
        reps: prevSet?.reps ?? exercise.defaultRepsMin,
        isCompleted: false,
      });
    }

    const newLog: WorkoutExerciseLog = {
      id: `log-${Date.now()}`,
      exerciseName: exercise.name,
      muscleGroup: exercise.muscleGroup,
      sets,
    };

    onUpdateSession({ ...session, exercises: [...session.exercises, newLog] });
    setIsAddExerciseForTodayOpen(false);
    setToastMessage(`Added ${exercise.name} to today's workout!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Remove Exercise from Today's Session
  const handleRemoveExerciseFromToday = (exerciseIdx: number) => {
    if (session.exercises.length <= 1) {
      setToastMessage('Workout session must have at least 1 exercise.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const removedName = session.exercises[exerciseIdx].exerciseName;
    const updatedExercises = session.exercises.filter((_, i) => i !== exerciseIdx);
    onUpdateSession({ ...session, exercises: updatedExercises });
    setToastMessage(`Removed ${removedName} from today's workout.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-black text-white pb-24">
      {/* Top Sticky Workout Header */}
      <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-md border-b border-zinc-900 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              ACTIVE WORKOUT
            </span>
            <h2 className="text-lg font-bold tracking-tight text-white leading-tight">
              {session.name}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            {/* Workout Elapsed Time */}
            <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>{formatTime(elapsedSeconds)}</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Finish CTA */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                onUpdateSession({ ...session, durationSeconds: elapsedSeconds });
                onFinishWorkout();
              }}
              className="px-3.5 py-1.5 bg-white text-black font-semibold text-xs font-mono rounded-lg shadow-glow-sm hover:bg-zinc-200 transition-colors"
            >
              FINISH
            </motion.button>
          </div>
        </div>
      </div>

      {/* Floating Rest Timer */}
      <AnimatePresence>
        {restTimerSeconds !== null && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="sticky top-14 z-20 mx-4 mt-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 shadow-glow-md flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="relative w-9 h-9 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-zinc-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-white transition-all duration-300"
                    strokeDasharray={`${(restTimerSeconds / restTimerTotal) * 100}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <Clock className="w-3.5 h-3.5 absolute text-white" />
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  REST TIMER
                </span>
                <div className="text-xl font-mono font-bold text-white tracking-wider">
                  {formatTime(restTimerSeconds)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setRestTimerSeconds((s) => (s ? s + 30 : 30))}
                className="px-2.5 py-1 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 hover:text-white"
              >
                +30s
              </button>
              <button
                onClick={() => setIsRestTimerPaused(!isRestTimerPaused)}
                className="px-2.5 py-1 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 hover:text-white"
              >
                {isRestTimerPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={() => setRestTimerSeconds(null)}
                className="p-1 text-xs text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toast Message */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="mx-4 mt-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs font-mono text-white flex items-center justify-between shadow-lg"
          >
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="p-1 text-zinc-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New PR Celebratory Notification */}
      <AnimatePresence>
        {newPRAlert && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mx-4 mt-3 p-3 rounded-xl bg-white text-black font-semibold flex items-center justify-between shadow-glow-white"
          >
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-black" />
              <div>
                <div className="text-xs font-mono uppercase tracking-wider">NEW PERSONAL RECORD!</div>
                <div className="text-sm font-bold">{newPRAlert.exercise} — {newPRAlert.details}</div>
              </div>
            </div>
            <button onClick={() => setNewPRAlert(null)} className="p-1 text-black hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercises List */}
      <div className="px-4 py-4 space-y-4 overflow-y-auto">
        {session.exercises.map((exercise, exerciseIdx) => {
          const prevMemory = getPreviousPerformance(exercise.exerciseName);
          const prMemory = getExercisePR(exercise.exerciseName);
          const isNoteOpen = expandedNotes[exercise.id];

          return (
            <div
              key={exercise.id}
              className="rounded-2xl bg-zinc-950 border border-zinc-900 p-4 space-y-3 shadow-lg"
            >
              {/* Exercise Header with Swap & Remove for Today */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {exercise.muscleGroup}
                    </span>
                    {prMemory && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center gap-1">
                        <Award className="w-2.5 h-2.5" /> PR: {prMemory}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    {exercise.exerciseName}
                  </h3>
                </div>

                <div className="flex items-center space-x-1">
                  {/* Swap Exercise for Today Button */}
                  <button
                    onClick={() => setSwapExerciseIdx(exerciseIdx)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[11px] font-mono text-zinc-300 hover:text-white flex items-center space-x-1 transition-colors"
                    title="Swap this exercise just for today"
                  >
                    <Repeat className="w-3 h-3" />
                    <span>Swap</span>
                  </button>

                  <button
                    onClick={() =>
                      setExpandedNotes({ ...expandedNotes, [exercise.id]: !isNoteOpen })
                    }
                    className="text-xs text-zinc-400 hover:text-white p-1"
                    title="Exercise notes"
                  >
                    {isNoteOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {session.exercises.length > 1 && (
                    <button
                      onClick={() => handleRemoveExerciseFromToday(exerciseIdx)}
                      className="p-1 text-zinc-600 hover:text-zinc-400"
                      title="Skip this exercise today"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Previous Performance Memory Chip */}
              {prevMemory && (
                <div className="px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800/60 text-xs font-mono text-zinc-400 flex items-center justify-between">
                  <span>Last: {prevMemory}</span>
                </div>
              )}

              {/* Notes Drawer */}
              {isNoteOpen && (
                <div className="pt-2">
                  <textarea
                    placeholder="Notes (e.g., seat position 4, machine feels heavy)..."
                    value={exercise.notes || ''}
                    onChange={(e) => {
                      const updated = [...session.exercises];
                      updated[exerciseIdx].notes = e.target.value;
                      onUpdateSession({ ...session, exercises: updated });
                    }}
                    className="w-full text-xs bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                    rows={2}
                  />
                </div>
              )}

              {/* Sets Table Header */}
              <div className="grid grid-cols-12 gap-2 text-[10px] font-mono uppercase text-zinc-400 px-1">
                <div className="col-span-2">Set</div>
                <div className="col-span-5 text-center">Weight ({weightUnit})</div>
                <div className="col-span-3 text-center">Reps</div>
                <div className="col-span-2 text-center">Done</div>
              </div>

              {/* Sets Rows */}
              <div className="space-y-2">
                {exercise.sets.map((set, setIdx) => (
                  <div
                    key={set.id}
                    className={`grid grid-cols-12 gap-2 items-center p-2 rounded-xl border transition-all ${
                      set.isCompleted
                        ? 'bg-zinc-900/90 border-zinc-700'
                        : 'bg-zinc-900/30 border-zinc-900'
                    }`}
                  >
                    {/* Set Number */}
                    <div className="col-span-2 flex items-center space-x-1 font-mono text-xs font-semibold text-zinc-400 pl-1">
                      <span>#{set.setNumber}</span>
                      {set.isPR && <Award className="w-3 h-3 text-white" />}
                    </div>

                    {/* Weight Stepper & Input */}
                    <div className="col-span-5 flex items-center justify-center space-x-1">
                      <button
                        onClick={() =>
                          handleUpdateSet(exerciseIdx, setIdx, 'weight', Math.max(0, set.weight - 2.5))
                        }
                        className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-xs font-mono"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        step="0.5"
                        value={set.weight || ''}
                        onChange={(e) =>
                          handleUpdateSet(exerciseIdx, setIdx, 'weight', parseFloat(e.target.value) || 0)
                        }
                        className="w-14 text-center bg-zinc-950 border border-zinc-800 rounded py-1 text-sm font-mono font-bold text-white focus:outline-none focus:border-white"
                      />
                      <button
                        onClick={() =>
                          handleUpdateSet(exerciseIdx, setIdx, 'weight', set.weight + 2.5)
                        }
                        className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-xs font-mono"
                      >
                        +
                      </button>
                    </div>

                    {/* Reps Stepper & Input */}
                    <div className="col-span-3 flex items-center justify-center space-x-1">
                      <button
                        onClick={() =>
                          handleUpdateSet(exerciseIdx, setIdx, 'reps', Math.max(0, set.reps - 1))
                        }
                        className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-xs font-mono"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        value={set.reps || ''}
                        onChange={(e) =>
                          handleUpdateSet(exerciseIdx, setIdx, 'reps', parseInt(e.target.value) || 0)
                        }
                        className="w-10 text-center bg-zinc-950 border border-zinc-800 rounded py-1 text-sm font-mono font-bold text-white focus:outline-none focus:border-white"
                      />
                      <button
                        onClick={() =>
                          handleUpdateSet(exerciseIdx, setIdx, 'reps', set.reps + 1)
                        }
                        className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center text-xs font-mono"
                      >
                        +
                      </button>
                    </div>

                    {/* Complete Button */}
                    <div className="col-span-2 flex items-center justify-center">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={() => handleToggleSetComplete(exerciseIdx, setIdx)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                          set.isCompleted
                            ? 'bg-white border-white text-black shadow-glow-sm'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-600'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </motion.button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Set Actions: Add Set / Remove Last */}
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => handleAddSet(exerciseIdx)}
                  className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white hover:border-zinc-700 flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ADD SET</span>
                </button>

                {exercise.sets.length > 1 && (
                  <button
                    onClick={() => handleRemoveSet(exerciseIdx, exercise.sets.length - 1)}
                    className="p-1.5 text-zinc-600 hover:text-zinc-400"
                    title="Remove last set"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Exercise for Today Button */}
        <button
          onClick={() => setIsAddExerciseForTodayOpen(true)}
          className="w-full py-3.5 rounded-2xl border border-dashed border-zinc-800 hover:border-zinc-700 bg-zinc-950/60 hover:bg-zinc-900 text-xs font-mono text-zinc-300 hover:text-white flex items-center justify-center space-x-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>ADD EXERCISE FOR TODAY</span>
        </button>
      </div>

      {/* Cancel Workout Action */}
      <div className="p-4 text-center">
        <button
          onClick={() => setIsDiscardConfirmOpen(true)}
          className="text-xs font-mono text-zinc-600 hover:text-zinc-400 tracking-wider uppercase"
        >
          Discard Workout Session
        </button>
      </div>

      {/* Swap Exercise Modal (Just for Today) */}
      {swapExerciseIdx !== null && (
        <ExercisePickerModal
          isOpen={true}
          title={`Swap "${session.exercises[swapExerciseIdx]?.exerciseName}" for Today`}
          subtitle="Replaces this movement for today's session only"
          initialMuscleGroup={session.exercises[swapExerciseIdx]?.muscleGroup}
          onSelectExercise={handleSwapExerciseSelect}
          onClose={() => setSwapExerciseIdx(null)}
        />
      )}

      {/* Add Exercise to Today Modal */}
      <ExercisePickerModal
        isOpen={isAddExerciseForTodayOpen}
        title="Add Exercise to Today's Workout"
        subtitle="Add a movement for this session"
        onSelectExercise={handleAddExerciseToToday}
        onClose={() => setIsAddExerciseForTodayOpen(false)}
      />

      {/* Discard Workout Confirm Modal */}
      <ConfirmDialogModal
        isOpen={isDiscardConfirmOpen}
        title="Discard Workout Session?"
        message="Are you sure you want to discard this workout? Any sets logged in this session will not be saved."
        confirmLabel="DISCARD WORKOUT"
        isDestructive={true}
        onConfirm={() => {
          setIsDiscardConfirmOpen(false);
          onCancelWorkout();
        }}
        onCancel={() => setIsDiscardConfirmOpen(false)}
      />
    </div>
  );
};
