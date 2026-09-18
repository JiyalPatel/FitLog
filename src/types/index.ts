// src/types/index.ts

export type MuscleGroup = 'Chest' | 'Back' | 'Shoulders' | 'Legs' | 'Arms' | 'Core';

export interface ExerciseTarget {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  notes?: string;
  orderIndex: number;
}

export interface RoutineDay {
  id: string;
  name: string;
  dayOrder: number;
  estimatedMinutes: number;
  exercises: ExerciseTarget[];
  isRestDay?: boolean;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  days: RoutineDay[];
  currentQueueIndex: number;
  lastCompletedDate?: string; // ISO string
  targetDaysPerWeek: number;
  createdAt: string;
}

export interface WorkoutSet {
  id: string;
  setNumber: number;
  weight: number;
  reps: number;
  rir?: number; // Reps in reserve
  isPR?: boolean;
  isCompleted: boolean;
  notes?: string;
}

export interface WorkoutExerciseLog {
  id: string;
  exerciseName: string;
  muscleGroup: MuscleGroup;
  sets: WorkoutSet[];
  notes?: string;
}

export interface WorkoutSession {
  id: string;
  routineId?: string;
  routineDayId?: string;
  name: string;
  startedAt: string; // ISO string
  completedAt?: string; // ISO string
  durationSeconds: number;
  totalVolume: number; // in current weight unit (kg or lbs)
  totalSets: number;
  workoutScore: number; // 0 - 100
  status: 'in_progress' | 'completed' | 'abandoned';
  notes?: string;
  exercises: WorkoutExerciseLog[];
  prsAchieved: PersonalRecord[];
}

export type PRType = 'weight' | 'reps' | '1rm' | 'volume';

export interface PersonalRecord {
  id: string;
  exerciseName: string;
  prType: PRType;
  prValue: number;
  weight: number;
  reps: number;
  achievedAt: string; // ISO string
  workoutSessionId?: string;
}

export interface ProgressiveOverloadTip {
  id: string;
  exerciseName: string;
  currentPerformance: string; // e.g., "15 kg × 15 reps (3 sets)"
  suggestion: string; // e.g., "Consider stepping up to 17.5 kg next session."
  reason: string;
  type: 'increase_weight' | 'increase_reps' | 'form_focus';
}

export interface WeightEntry {
  id: string;
  weight: number;
  unit: 'kg' | 'lbs';
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string; // ISO string
}

export type WeightGoalType = 'lose' | 'gain' | 'maintain';

export interface WeightGoal {
  targetWeight: number;
  startWeight: number;
  goalType: WeightGoalType;
  targetDate?: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  displayName: string;
  isGuest: boolean;
  weightUnit: 'kg' | 'lbs';
  restTimerDefaultSeconds: number;
  soundEnabled: boolean;
  createdAt: string;
  targetWeight?: number;
  weightGoal?: WeightGoal;
}

export interface QueueItem {
  routineDay: RoutineDay;
  queueIndex: number;
  isPending: boolean;
  pendingDays: number;
  scheduledLabel: string;
}

export interface WeeklySummaryStats {
  weekNumber: number;
  workoutsCompleted: number;
  targetWorkouts: number;
  consistencyPercentage: number;
  totalVolume: number;
  volumeChangePercent: number;
  prsCount: number;
  averageWorkoutScore: number;
  bestImprovement?: {
    exerciseName: string;
    previous: string;
    current: string;
  };
}
