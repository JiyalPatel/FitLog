// src/services/engine/prEngine.ts
import { PersonalRecord, WorkoutSet, WorkoutSession } from '../../types';

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
 * Finds the all-time maximum weight logged for an exercise across:
 * 1. Existing PR records
 * 2. All completed historical workout sessions
 */
export function getHistoricalMaxWeight(
  exerciseName: string,
  existingPRs: PersonalRecord[] = [],
  previousSessions: WorkoutSession[] = []
): { maxWeight: number; repsAtMax: number } {
  const normName = exerciseName.trim().toLowerCase();
  let maxWeight = 0;
  let repsAtMax = 0;

  // 1. From existing PR records
  if (existingPRs && Array.isArray(existingPRs)) {
    for (const pr of existingPRs) {
      if (pr.exerciseName && pr.exerciseName.trim().toLowerCase() === normName) {
        const val = pr.prValue || pr.weight || 0;
        if (val > maxWeight) {
          maxWeight = val;
          repsAtMax = pr.reps || 0;
        }
      }
    }
  }

  // 2. From historical completed workout sessions
  if (previousSessions && Array.isArray(previousSessions)) {
    for (const session of previousSessions) {
      if (session.status !== 'completed' || !session.exercises) continue;
      for (const ex of session.exercises) {
        if (ex.exerciseName && ex.exerciseName.trim().toLowerCase() === normName && ex.sets) {
          for (const s of ex.sets) {
            if (s.isCompleted && s.weight > maxWeight) {
              maxWeight = s.weight;
              repsAtMax = s.reps;
            }
          }
        }
      }
    }
  }

  return { maxWeight, repsAtMax };
}

/**
 * Evaluates whether a newly logged set beats the historical record strictly based on WEIGHT.
 * Returns a PersonalRecord if it strictly exceeds prior records and prior sets in this session.
 */
export function evaluateSetForPR(
  exerciseName: string,
  set: WorkoutSet,
  existingPRs: PersonalRecord[] = [],
  previousSessions: WorkoutSession[] = [],
  currentSessionCompletedSets: WorkoutSet[] = []
): PersonalRecord | null {
  if (!set.isCompleted || set.weight <= 0) {
    return null;
  }

  const { maxWeight: historicalMax } = getHistoricalMaxWeight(
    exerciseName,
    existingPRs,
    previousSessions
  );

  // Highest weight from other already-completed sets in this session for this exercise
  let sessionPriorMax = 0;
  for (const otherSet of currentSessionCompletedSets) {
    if (otherSet.id !== set.id && otherSet.isCompleted && otherSet.weight > sessionPriorMax) {
      sessionPriorMax = otherSet.weight;
    }
  }

  // A PR is achieved strictly when lifting MORE WEIGHT than the previous all-time record
  // AND exceeding any prior set already completed in this session.
  // (If no prior history exists at all, the first workout establishes the initial baseline).
  if (historicalMax > 0 && set.weight > historicalMax && set.weight > sessionPriorMax) {
    return {
      id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      exerciseName,
      prType: 'weight',
      prValue: set.weight,
      weight: set.weight,
      reps: set.reps,
      achievedAt: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Returns best weight record summary for a specific exercise
 */
export function getExercisePRSummary(
  exerciseName: string,
  prs: PersonalRecord[] = [],
  previousSessions: WorkoutSession[] = []
) {
  const { maxWeight, repsAtMax } = getHistoricalMaxWeight(
    exerciseName,
    prs,
    previousSessions
  );

  return {
    bestWeight: maxWeight > 0 ? `${maxWeight} kg${repsAtMax > 0 ? ` × ${repsAtMax}` : ''}` : null,
  };
}
