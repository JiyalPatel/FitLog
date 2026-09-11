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
 * Calculates weekly summary stats and consistency
 */
export function calculateWeeklyStats(
  sessions: WorkoutSession[],
  targetPerWeek = 5
): WeeklySummaryStats {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const thisWeekSessions = sessions.filter(
    (s) => s.completedAt && new Date(s.completedAt) >= oneWeekAgo
  );

  const prevWeekSessions = sessions.filter(
    (s) =>
      s.completedAt &&
      new Date(s.completedAt) >= twoWeeksAgo &&
      new Date(s.completedAt) < oneWeekAgo
  );

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
    weekNumber: getWeekNumber(now),
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

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
