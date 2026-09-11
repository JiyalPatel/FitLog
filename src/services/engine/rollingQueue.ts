// src/services/engine/rollingQueue.ts
import { Routine, RoutineDay, QueueItem, WorkoutSession } from '../../types';

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
    const lastDate = new Date(lastDateStr);
    const now = new Date();
    // Calculate calendar days difference
    const diffTime = now.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

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
 * Computes the workout streak.
 * Focuses on completed workouts sequentially.
 */
export function calculateWorkoutStreak(sessions: WorkoutSession[]): number {
  if (!sessions || sessions.length === 0) return 0;

  const completed = sessions
    .filter((s) => s.status === 'completed' && s.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  if (completed.length === 0) return 0;

  let streak = 0;
  const now = new Date();
  const lastSessionDate = new Date(completed[0].completedAt!);
  
  // If the last completed workout was more than 4 days ago, streak resets
  const daysSinceLast = Math.floor((now.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSinceLast > 5) {
    return 0;
  }

  // Count sequential workouts
  streak = completed.length;
  return streak;
}
