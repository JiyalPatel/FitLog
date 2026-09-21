// src/services/engine/rollingQueue.ts
import { Routine, RoutineDay, QueueItem, WorkoutSession, WorkoutSet } from '../../types';

/**
 * Formats a Date or ISO string to local date key 'YYYY-MM-DD'
 */
export function toLocalDateKey(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns difference in calendar days between two dates (ignoring hours/minutes/seconds)
 */
export function getCalendarDaysDiff(earlierDate: Date | string, laterDate: Date | string): number {
  const d1 = typeof earlierDate === 'string' ? new Date(earlierDate) : earlierDate;
  const d2 = typeof laterDate === 'string' ? new Date(laterDate) : laterDate;
  const utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Computes the active queue item, handling rolling missed workouts.
 * If days have passed without completing the scheduled workout, it marks it as pending
 * with the exact pending days count instead of skipping it.
 */
export function getNextWorkoutQueue(routine: Routine, lastWorkout?: WorkoutSession): QueueItem | null {
  if (!routine.days || routine.days.length === 0) {
    return null;
  }

  const currentIndex = routine.currentQueueIndex % routine.days.length;
  const currentDay = routine.days[currentIndex];

  let isPending = false;
  let pendingDays = 0;
  let scheduledLabel = 'Today';

  const lastDateStr = routine.lastCompletedDate || lastWorkout?.completedAt;

  if (lastDateStr) {
    const diffDays = getCalendarDaysDiff(lastDateStr, new Date());

    // If more than 1 day has elapsed since last workout, it's pending
    if (diffDays > 1) {
      isPending = true;
      pendingDays = diffDays - 1;
      scheduledLabel = pendingDays === 1 ? 'Pending 1 day' : `Pending ${pendingDays} days`;
    } else if (diffDays === 1) {
      scheduledLabel = 'Scheduled for today';
    } else {
      scheduledLabel = 'Ready for next session';
    }
  }

  return {
    routineDay: currentDay,
    queueIndex: currentIndex,
    isPending,
    pendingDays,
    scheduledLabel,
  };
}

/**
 * Returns the upcoming queue projection (e.g. next N workouts in the cyclical routine)
 */
export function getUpcomingQueue(routine: Routine, count = 4): RoutineDay[] {
  if (!routine.days || routine.days.length === 0) return [];

  const list: RoutineDay[] = [];
  const total = routine.days.length;

  for (let i = 0; i < count; i++) {
    const index = (routine.currentQueueIndex + i) % total;
    list.push(routine.days[index]);
  }

  return list;
}

/**
 * Computes the workout streak (consecutive calendar days with completed workouts).
 * - If user completed a workout today, streak includes today and counts backward consecutive days.
 * - If user completed a workout yesterday (and not yet today), streak remains alive from yesterday.
 * - If 2 or more calendar days have passed without a workout (e.g., worked out Monday, skipped Tuesday, checked Wednesday), streak breaks to 0.
 * - Multiple workouts on the same calendar day count as 1 day in the streak.
 */
export function calculateWorkoutStreak(
  sessions: WorkoutSession[],
  referenceDate: Date = new Date()
): number {
  if (!sessions || sessions.length === 0) return 0;

  const completed = sessions.filter((s) => s.status === 'completed' && s.completedAt);
  if (completed.length === 0) return 0;

  const workoutDateSet = new Set(completed.map((s) => toLocalDateKey(s.completedAt!)));

  const todayStr = toLocalDateKey(referenceDate);
  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = toLocalDateKey(yesterday);

  let checkDate: Date;
  if (workoutDateSet.has(todayStr)) {
    checkDate = new Date(referenceDate);
  } else if (workoutDateSet.has(yesterdayStr)) {
    checkDate = yesterday;
  } else {
    // 2 or more days since last workout - streak is broken
    return 0;
  }

  let streak = 0;
  while (true) {
    const key = toLocalDateKey(checkDate);
    if (workoutDateSet.has(key)) {
      streak += 1;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Finds the most recent completed sets for a given exercise from previous workout sessions.
 * Returns an array of WorkoutSet or null if no previous history is found.
 */
export function getPreviousExerciseSets(
  exerciseName: string,
  previousSessions: WorkoutSession[]
): WorkoutSet[] | null {
  if (!previousSessions || previousSessions.length === 0) return null;

  const targetName = exerciseName.trim().toLowerCase();

  // Sort descending by completion/start time so most recent session is first
  const sorted = [...previousSessions]
    .filter((s) => s.status === 'completed' && s.exercises && s.exercises.length > 0)
    .sort(
      (a, b) =>
        new Date(b.completedAt || b.startedAt).getTime() -
        new Date(a.completedAt || a.startedAt).getTime()
    );

  for (const session of sorted) {
    const matchingExercise = session.exercises.find(
      (ex) => ex.exerciseName.trim().toLowerCase() === targetName
    );

    if (matchingExercise && matchingExercise.sets && matchingExercise.sets.length > 0) {
      // Prioritize completed sets with weight > 0
      const completedSets = matchingExercise.sets.filter((s) => s.isCompleted && s.weight > 0);
      if (completedSets.length > 0) {
        return completedSets;
      }
      const validSets = matchingExercise.sets.filter((s) => s.weight > 0);
      if (validSets.length > 0) {
        return validSets;
      }
      return matchingExercise.sets;
    }
  }

  return null;
}
