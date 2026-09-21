// src/services/engine/scoringEngine.ts
import { WorkoutSession, WeeklySummaryStats } from '../../types';

export interface ScoreBreakdown {
  totalScore: number;
  completionPoints: number; // max 40
  progressionPoints: number; // max 30
  volumePoints: number; // max 15
  prBonusPoints: number; // max 15
  summaryNotes: string[];
}

/**
 * Calculates a comprehensive Workout Score (0 - 100) based on:
 * - Workout Completion (all target exercises & sets completed): up to 40 pts
 * - Progression (weights/reps matched or beat prior session): up to 30 pts
 * - Volume (total session load vs typical): up to 15 pts
 * - PR Bonus (new records broken): up to 15 pts
 */
export function calculateWorkoutScore(
  session: WorkoutSession,
  previousSessions: WorkoutSession[]
): ScoreBreakdown {
  const summaryNotes: string[] = [];

  // 1. Completion Score (Max 40 pts)
  let totalSetsCount = 0;
  let completedSetsCount = 0;

  session.exercises.forEach((ex) => {
    ex.sets.forEach((s) => {
      totalSetsCount++;
      if (s.isCompleted) completedSetsCount++;
    });
  });

  const completionRatio = totalSetsCount > 0 ? completedSetsCount / totalSetsCount : 1;
  const completionPoints = Math.round(completionRatio * 40);

  if (completionPoints >= 38) {
    summaryNotes.push('Workout 100% completed');
  }

  // 2. Volume Comparison (Max 15 pts)
  let volumePoints = 12; // Baseline decent volume
  if (previousSessions.length > 0) {
    const avgVolume =
      previousSessions.reduce((acc, s) => acc + (s.totalVolume || 0), 0) /
      previousSessions.length;

    if (session.totalVolume > avgVolume * 1.05) {
      volumePoints = 15;
      summaryNotes.push('Volume increased vs previous average');
    } else if (session.totalVolume >= avgVolume * 0.95) {
      volumePoints = 12;
    } else {
      volumePoints = 8;
    }
  }

  // 3. Progression Points (Max 30 pts)
  let progressionPoints = 25;
  if (previousSessions.length > 0) {
    const lastSession = previousSessions[0];
    if (session.totalVolume >= lastSession.totalVolume) {
      progressionPoints = 30;
      summaryNotes.push('Progression target maintained');
    }
  }

  // 4. PR Bonus (Max 15 pts)
  const prCount = session.prsAchieved?.length || 0;
  const prBonusPoints = Math.min(15, prCount * 8);

  if (prCount > 0) {
    summaryNotes.push(`${prCount} new Personal Record${prCount > 1 ? 's' : ''} achieved!`);
  }

  const totalScore = Math.min(100, completionPoints + progressionPoints + volumePoints + prBonusPoints);

  return {
    totalScore,
    completionPoints,
    progressionPoints,
    volumePoints,
    prBonusPoints,
    summaryNotes,
  };
}

/**
 * Calculates weekly summary stats and consistency based on calendar weeks starting on Monday.
 * Monday 00:00:00 to Sunday 23:59:59.999 is one calendar week.
 */
export function calculateWeeklyStats(
  sessions: WorkoutSession[],
  targetPerWeek = 5,
  referenceDate: Date = new Date()
): WeeklySummaryStats {
  const ref = new Date(referenceDate);
  const day = ref.getDay();
  // Monday is 1, Sunday is 0 -> (day + 6) % 7 gives days elapsed since this week's Monday
  const daysSinceMonday = (day + 6) % 7;

  // Start of this week: Monday 00:00:00.000
  const startOfThisWeek = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() - daysSinceMonday, 0, 0, 0, 0);
  // End of this week: Sunday 23:59:59.999
  const endOfThisWeek = new Date(startOfThisWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

  // Start of previous week: Previous Monday 00:00:00.000
  const startOfPrevWeek = new Date(startOfThisWeek.getTime() - 7 * 24 * 60 * 60 * 1000);
  // End of previous week: Previous Sunday 23:59:59.999
  const endOfPrevWeek = new Date(startOfThisWeek.getTime() - 1);

  const thisWeekSessions = sessions.filter((s) => {
    if (!s.completedAt) return false;
    const time = new Date(s.completedAt).getTime();
    return time >= startOfThisWeek.getTime() && time <= endOfThisWeek.getTime();
  });

  const prevWeekSessions = sessions.filter((s) => {
    if (!s.completedAt) return false;
    const time = new Date(s.completedAt).getTime();
    return time >= startOfPrevWeek.getTime() && time <= endOfPrevWeek.getTime();
  });

  const thisWeekVolume = thisWeekSessions.reduce((acc, s) => acc + (s.totalVolume || 0), 0);
  const prevWeekVolume = prevWeekSessions.reduce((acc, s) => acc + (s.totalVolume || 0), 0);

  let volumeChangePercent = 0;
  if (prevWeekVolume > 0) {
    volumeChangePercent = Math.round(((thisWeekVolume - prevWeekVolume) / prevWeekVolume) * 100);
  } else if (thisWeekVolume > 0) {
    volumeChangePercent = 100;
  }

  const prsCount = thisWeekSessions.reduce(
    (acc, s) => acc + (s.prsAchieved?.length || 0),
    0
  );

  const avgScore =
    thisWeekSessions.length > 0
      ? Math.round(
          thisWeekSessions.reduce((acc, s) => acc + (s.workoutScore || 80), 0) /
            thisWeekSessions.length
        )
      : 0;

  const workoutsCompleted = thisWeekSessions.length;
  const consistencyPercentage = Math.min(100, Math.round((workoutsCompleted / targetPerWeek) * 100));

  return {
    weekNumber: getWeekNumber(ref),
    workoutsCompleted,
    targetWorkouts: targetPerWeek,
    consistencyPercentage,
    totalVolume: thisWeekVolume,
    volumeChangePercent,
    prsCount,
    averageWorkoutScore: avgScore,
    bestImprovement: undefined,
  };
}

export interface BestImprovement {
  exerciseName: string;
  headline: string;
  detail: string;
}

/**
 * Dynamically computes the best improvement in a finished session
 * by comparing each exercise against the most recent session containing it.
 */
export function calculateBestImprovement(
  session: WorkoutSession,
  previousSessions: WorkoutSession[] = []
): BestImprovement {
  if (!session.exercises || session.exercises.length === 0) {
    return {
      exerciseName: 'Great Effort',
      headline: 'Session Complete',
      detail: 'Consistent training is the foundation of progressive overload.',
    };
  }

  // Filter valid completed past sessions (excluding current session if present)
  const pastSessions = (previousSessions || [])
    .filter((s) => s.id !== session.id && s.status === 'completed' && s.exercises)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

  let bestCandidate: {
    score: number;
    exerciseName: string;
    headline: string;
    detail: string;
  } | null = null;

  for (const currEx of session.exercises) {
    const completedSets = currEx.sets?.filter((s) => s.isCompleted && s.weight > 0) || [];
    if (completedSets.length === 0) continue;

    const currentMaxWeight = Math.max(...completedSets.map((s) => s.weight));
    const maxWeightSet = completedSets.find((s) => s.weight === currentMaxWeight);
    const currentRepsAtMax = maxWeightSet ? maxWeightSet.reps : 0;
    const currentVolume = completedSets.reduce((acc, s) => acc + s.weight * s.reps, 0);

    // Check if a PR was achieved on this exercise
    const prAchieved = session.prsAchieved?.find(
      (p) => p.exerciseName.toLowerCase() === currEx.exerciseName.toLowerCase()
    );

    if (prAchieved) {
      const prScore = 500 + prAchieved.weight;
      if (!bestCandidate || prScore > bestCandidate.score) {
        bestCandidate = {
          score: prScore,
          exerciseName: currEx.exerciseName,
          headline: 'New Personal Record',
          detail: `${currEx.exerciseName} — Broke all-time record with ${prAchieved.weight} kg × ${prAchieved.reps} reps!`,
        };
      }
      continue;
    }

    // Find the most recent previous session that included this exercise
    let priorEx: { sets: { weight: number; reps: number; isCompleted: boolean }[] } | null = null;
    for (const prevS of pastSessions) {
      const match = prevS.exercises.find(
        (e) => e.exerciseName.toLowerCase() === currEx.exerciseName.toLowerCase()
      );
      if (match && match.sets && match.sets.some((s) => s.isCompleted && s.weight > 0)) {
        priorEx = match;
        break;
      }
    }

    if (priorEx) {
      const priorCompleted = priorEx.sets.filter((s) => s.isCompleted && s.weight > 0);
      const priorMaxWeight = Math.max(...priorCompleted.map((s) => s.weight));
      const priorMaxSet = priorCompleted.find((s) => s.weight === priorMaxWeight);
      const priorRepsAtMax = priorMaxSet ? priorMaxSet.reps : 0;
      const priorVolume = priorCompleted.reduce((acc, s) => acc + s.weight * s.reps, 0);

      const weightDiff = Math.round((currentMaxWeight - priorMaxWeight) * 10) / 10;
      const volDiff = currentVolume - priorVolume;

      // 1. Weight Overload
      if (weightDiff > 0) {
        const score = 200 + weightDiff * 10;
        if (!bestCandidate || score > bestCandidate.score) {
          bestCandidate = {
            score,
            exerciseName: currEx.exerciseName,
            headline: 'Weight Overload',
            detail: `${currEx.exerciseName} — +${weightDiff} kg overload (${currentMaxWeight} kg vs ${priorMaxWeight} kg last time).`,
          };
        }
      }
      // 2. Rep Overload at same weight
      else if (weightDiff === 0 && currentRepsAtMax > priorRepsAtMax) {
        const repDiff = currentRepsAtMax - priorRepsAtMax;
        const score = 100 + repDiff * 5;
        if (!bestCandidate || score > bestCandidate.score) {
          bestCandidate = {
            score,
            exerciseName: currEx.exerciseName,
            headline: 'Rep Progression',
            detail: `${currEx.exerciseName} — +${repDiff} extra rep${repDiff > 1 ? 's' : ''} at ${currentMaxWeight} kg (${currentRepsAtMax} vs ${priorRepsAtMax}).`,
          };
        }
      }
      // 3. Volume Overload
      else if (volDiff > 0) {
        const score = 50 + Math.min(40, Math.round(volDiff / 20));
        if (!bestCandidate || score > bestCandidate.score) {
          bestCandidate = {
            score,
            exerciseName: currEx.exerciseName,
            headline: 'Volume Increase',
            detail: `${currEx.exerciseName} — +${volDiff} kg total volume progression vs last session.`,
          };
        }
      }
    } else {
      // First time performing this exercise - baseline
      const score = 10 + currentVolume / 100;
      if (!bestCandidate || score > bestCandidate.score) {
        bestCandidate = {
          score,
          exerciseName: currEx.exerciseName,
          headline: 'Benchmark Established',
          detail: `${currEx.exerciseName} — Solid baseline established at ${currentMaxWeight} kg (${completedSets.length} sets).`,
        };
      }
    }
  }

  return (
    bestCandidate || {
      exerciseName: session.name,
      headline: 'Target Maintained',
      detail: `${session.name} completed with high consistency and discipline.`,
    }
  );
}

export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
