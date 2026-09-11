// src/services/engine/overloadEngine.ts
import { ProgressiveOverloadTip, WorkoutSession } from '../../types';

/**
 * Analyzes recent workout sessions and identifies opportunities for progressive overload.
 * Generates encouraging, actionable suggestions (e.g. "Consistently hitting 15 reps. Step up weight.")
 */
export function generateOverloadTips(sessions: WorkoutSession[]): ProgressiveOverloadTip[] {
  const tips: ProgressiveOverloadTip[] = [];
  const completed = sessions.filter((s) => s.status === 'completed');

  if (completed.length === 0) {
    return [];
  }

  // Aggregate exercise performance across sessions
  const exerciseHistory: Record<string, { weight: number; reps: number; date: string }[]> = {};

  completed.forEach((session) => {
    session.exercises.forEach((ex) => {
      const name = ex.exerciseName;
      if (!exerciseHistory[name]) exerciseHistory[name] = [];

      ex.sets.forEach((set) => {
        if (set.isCompleted && set.weight > 0 && set.reps > 0) {
          exerciseHistory[name].push({
            weight: set.weight,
            reps: set.reps,
            date: session.completedAt || session.startedAt,
          });
        }
      });
    });
  });

  // Evaluate each exercise
  Object.entries(exerciseHistory).forEach(([exerciseName, sets]) => {
    if (sets.length >= 3) {
      const recentSets = sets.slice(-3);
      const allHighReps = recentSets.every((s) => s.reps >= 12);
      const sameWeight = recentSets.every((s) => s.weight === recentSets[0].weight);

      if (allHighReps && sameWeight) {
        tips.push({
          id: `tip-${exerciseName.toLowerCase().replace(/\s+/g, '-')}`,
          exerciseName,
          currentPerformance: `${recentSets[0].weight} kg × ${recentSets[0].reps} reps`,
          suggestion: `You have mastered your target reps at ${recentSets[0].weight} kg. Step up to ${(
            recentSets[0].weight + 2.5
          ).toFixed(1)} kg on your next workout!`,
          reason: 'Consistently hitting 12+ reps across consecutive sets',
          type: 'increase_weight',
        });
      }
    }
  });

  return tips.slice(0, 3);
}
