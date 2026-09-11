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
    // Default helpful starter tip
    return [
      {
        id: 'tip-starter',
        exerciseName: 'Pec Dec Fly',
        currentPerformance: '15 kg × 15 reps (3 sets)',
        suggestion: 'You are consistently reaching the top of your rep range. Consider trying 17.5 kg next session.',
        reason: 'Consistently hitting 15 reps across all sets',
        type: 'increase_weight',
      },
      {
        id: 'tip-bench',
        exerciseName: 'Bench Press',
        currentPerformance: '60 kg × 10 reps',
        suggestion: 'Try aiming for 11–12 reps with 60 kg before jumping to 62.5 kg.',
        reason: 'Building rep volume towards progressive overload',
        type: 'increase_reps',
      },
    ];
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

  // If no automatic triggers found yet, supply good defaults
  if (tips.length === 0) {
    tips.push({
      id: 'tip-default',
      exerciseName: 'Pec Dec Fly',
      currentPerformance: '15 kg × 15 reps',
      suggestion: 'You are consistently reaching the top of your rep range. Try 17.5 kg next session.',
      reason: 'Rep target accomplished',
      type: 'increase_weight',
    });
  }

  return tips.slice(0, 3);
}
