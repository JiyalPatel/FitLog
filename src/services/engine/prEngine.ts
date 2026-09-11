// src/services/engine/prEngine.ts
import { PersonalRecord, PRType, WorkoutSet } from '../../types';

/**
 * Calculates Estimated 1RM (One Rep Max) using the Epley formula:
 * 1RM = Weight * (1 + Reps / 30)
 * Validated for 1 <= reps <= 30
 */
export function calculateEstimated1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  const oneRM = weight * (1 + reps / 30);
  return Math.round(oneRM * 10) / 10;
}

/**
 * Checks if a newly logged set beats existing personal records.
 * Returns the PR details if it is a new record, or null otherwise.
 */
export function evaluateSetForPR(
  exerciseName: string,
  set: WorkoutSet,
  existingPRs: PersonalRecord[]
): PersonalRecord | null {
  if (!set.isCompleted || set.weight <= 0 || set.reps <= 0) {
    return null;
  }

  const exercisePRs = existingPRs.filter(
    (p) => p.exerciseName.toLowerCase() === exerciseName.toLowerCase()
  );

  const estimated1RM = calculateEstimated1RM(set.weight, set.reps);
  const setVolume = set.weight * set.reps;

  // 1. Check Max Weight PR
  const weightPR = exercisePRs.find((p) => p.prType === 'weight');
  if (!weightPR || set.weight > weightPR.prValue) {
    return {
      id: `pr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      exerciseName,
      prType: 'weight',
      prValue: set.weight,
      weight: set.weight,
      reps: set.reps,
      achievedAt: new Date().toISOString(),
    };
  }

  // 2. Check 1RM PR
  const oneRmPR = exercisePRs.find((p) => p.prType === '1rm');
  if (!oneRmPR || estimated1RM > oneRmPR.prValue) {
    return {
      id: `pr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      exerciseName,
      prType: '1rm',
      prValue: estimated1RM,
      weight: set.weight,
      reps: set.reps,
      achievedAt: new Date().toISOString(),
    };
  }

  // 3. Check Max Reps PR for same or higher weight
  const repsPR = exercisePRs.find((p) => p.prType === 'reps' && p.weight === set.weight);
  if (repsPR && set.reps > repsPR.prValue) {
    return {
      id: `pr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      exerciseName,
      prType: 'reps',
      prValue: set.reps,
      weight: set.weight,
      reps: set.reps,
      achievedAt: new Date().toISOString(),
    };
  }

  // 4. Check Set Volume PR
  const volumePR = exercisePRs.find((p) => p.prType === 'volume');
  if (!volumePR || setVolume > volumePR.prValue) {
    return {
      id: `pr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      exerciseName,
      prType: 'volume',
      prValue: setVolume,
      weight: set.weight,
      reps: set.reps,
      achievedAt: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Returns best records summary for a specific exercise
 */
export function getExercisePRSummary(exerciseName: string, prs: PersonalRecord[]) {
  const matches = prs.filter(
    (p) => p.exerciseName.toLowerCase() === exerciseName.toLowerCase()
  );

  const bestWeight = matches.find((p) => p.prType === 'weight');
  const best1RM = matches.find((p) => p.prType === '1rm');
  const bestVolume = matches.find((p) => p.prType === 'volume');

  return {
    bestWeight: bestWeight ? `${bestWeight.weight} kg × ${bestWeight.reps}` : null,
    best1RM: best1RM ? `~${best1RM.prValue} kg` : null,
    bestVolume: bestVolume ? `${bestVolume.prValue} kg` : null,
  };
}
