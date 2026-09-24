// src/services/data/onboardingPresets.ts
import { Routine, RoutineDay } from '../../types';
import { defaultRoutine } from '../storage/mockInitialData';

export interface SplitPreset {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  recommendedDaysPerWeek: number;
  daysCount: number;
  previewDays: string[];
}

export const ONBOARDING_SPLITS: SplitPreset[] = [
  {
    id: 'ppl',
    name: 'Push Pull Legs (PPL)',
    subtitle: 'Hypertrophy & Aesthetics',
    description: '3-workout split targeting complementary muscle groups for progressive overload.',
    recommendedDaysPerWeek: 5,
    daysCount: 3,
    previewDays: ['Push (Chest/Shoulders/Triceps)', 'Pull (Back/Biceps)', 'Legs (Quads/Hamstrings/Calves)'],
  },
  {
    id: 'upper_lower',
    name: 'Upper / Lower Split',
    subtitle: 'Strength & Athleticism',
    description: '2-workout split alternating upper and lower body for balanced recovery and frequency.',
    recommendedDaysPerWeek: 4,
    daysCount: 2,
    previewDays: ['Upper Body (Chest/Back/Biceps & Triceps)', 'Lower Body (Squats/Hamstrings/Calves)'],
  },
  {
    id: 'full_body',
    name: 'Full Body Foundational',
    subtitle: 'Efficiency & Core Compound Lifts',
    description: '1 balanced high-yield workout hitting all major muscle groups.',
    recommendedDaysPerWeek: 3,
    daysCount: 1,
    previewDays: ['Full Body (Squat, Bench, Row, Shoulders, Biceps & Triceps)'],
  },
];

export function createRoutineFromSplit(
  splitId: string,
  targetDaysPerWeek = 5
): Routine {
  if (splitId === 'upper_lower') {
    return {
      id: `routine-ul-${Date.now()}`,
      name: 'Upper / Lower Split',
      description: '4-day split optimal for strength and frequency.',
      currentQueueIndex: 0,
      targetDaysPerWeek,
      createdAt: new Date().toISOString(),
      days: [
        {
          id: `day-upper-${Date.now()}`,
          name: 'Upper Body',
          dayOrder: 0,
          estimatedMinutes: 50,
          exercises: [
            {
              id: 'ex-ul-bench',
              name: 'Barbell Bench Press',
              muscleGroup: 'Chest',
              targetSets: 4,
              targetRepsMin: 6,
              targetRepsMax: 10,
              orderIndex: 0,
              notes: 'Focus on explosive press and smooth bar path.',
            },
            {
              id: 'ex-ul-row',
              name: 'Barbell Bent Over Row',
              muscleGroup: 'Back',
              targetSets: 4,
              targetRepsMin: 6,
              targetRepsMax: 10,
              orderIndex: 1,
              notes: 'Hinge at hips, pull elbows to hips.',
            },
            {
              id: 'ex-ul-ohp',
              name: 'Dumbbell Shoulder Press',
              muscleGroup: 'Shoulders',
              targetSets: 3,
              targetRepsMin: 8,
              targetRepsMax: 12,
              orderIndex: 2,
              notes: 'Elbows slightly tucked.',
            },
            {
              id: 'ex-ul-lat',
              name: 'Lat Pulldown',
              muscleGroup: 'Back',
              targetSets: 3,
              targetRepsMin: 8,
              targetRepsMax: 12,
              orderIndex: 3,
              notes: 'Full stretch at the top.',
            },
            {
              id: 'ex-ul-tricep',
              name: 'Triceps Pushdown',
              muscleGroup: 'Triceps',
              targetSets: 3,
              targetRepsMin: 10,
              targetRepsMax: 12,
              orderIndex: 4,
              notes: 'Keep elbows pinned to sides.',
            },
            {
              id: 'ex-ul-curl',
              name: 'Incline Dumbbell Curl',
              muscleGroup: 'Biceps',
              targetSets: 3,
              targetRepsMin: 10,
              targetRepsMax: 12,
              orderIndex: 5,
              notes: 'Supinate wrists at top.',
            },
          ],
        },
        {
          id: `day-lower-${Date.now()}`,
          name: 'Lower Body',
          dayOrder: 1,
          estimatedMinutes: 50,
          exercises: [
            {
              id: 'ex-ul-squat',
              name: 'Barbell Back Squat',
              muscleGroup: 'Legs',
              targetSets: 4,
              targetRepsMin: 6,
              targetRepsMax: 8,
              orderIndex: 0,
              notes: 'Hit parallel depth with knees tracking toes.',
            },
            {
              id: 'ex-ul-rdl',
              name: 'Romanian Deadlift (RDL)',
              muscleGroup: 'Legs',
              targetSets: 3,
              targetRepsMin: 8,
              targetRepsMax: 12,
              orderIndex: 1,
              notes: 'Hinge hips backwards until hamstring stretch.',
            },
            {
              id: 'ex-ul-press',
              name: 'Leg Press',
              muscleGroup: 'Legs',
              targetSets: 3,
              targetRepsMin: 10,
              targetRepsMax: 15,
              orderIndex: 2,
              notes: 'Controlled descent.',
            },
            {
              id: 'ex-ul-curl-leg',
              name: 'Lying Leg Curl',
              muscleGroup: 'Legs',
              targetSets: 3,
              targetRepsMin: 12,
              targetRepsMax: 15,
              orderIndex: 3,
              notes: 'Pause 1s at contraction.',
            },
            {
              id: 'ex-ul-calf',
              name: 'Standing Calf Raise',
              muscleGroup: 'Legs',
              targetSets: 4,
              targetRepsMin: 15,
              targetRepsMax: 20,
              orderIndex: 4,
              notes: '2-second hold at bottom stretch.',
            },
          ],
        },
      ],
    };
  }

  if (splitId === 'full_body') {
    return {
      id: `routine-fb-${Date.now()}`,
      name: 'Full Body Foundational',
      description: 'Foundational routine for overall strength and athletic hypertrophy.',
      currentQueueIndex: 0,
      targetDaysPerWeek,
      createdAt: new Date().toISOString(),
      days: [
        {
          id: `day-fb-${Date.now()}`,
          name: 'Full Body',
          dayOrder: 0,
          estimatedMinutes: 55,
          exercises: [
            {
              id: 'ex-fb-squat',
              name: 'Barbell Back Squat',
              muscleGroup: 'Legs',
              targetSets: 3,
              targetRepsMin: 6,
              targetRepsMax: 8,
              orderIndex: 0,
            },
            {
              id: 'ex-fb-bench',
              name: 'Barbell Bench Press',
              muscleGroup: 'Chest',
              targetSets: 3,
              targetRepsMin: 8,
              targetRepsMax: 10,
              orderIndex: 1,
            },
            {
              id: 'ex-fb-lat',
              name: 'Lat Pulldown',
              muscleGroup: 'Back',
              targetSets: 3,
              targetRepsMin: 8,
              targetRepsMax: 12,
              orderIndex: 2,
            },
            {
              id: 'ex-fb-raise',
              name: 'Lateral Raise',
              muscleGroup: 'Shoulders',
              targetSets: 3,
              targetRepsMin: 12,
              targetRepsMax: 15,
              orderIndex: 3,
            },
            {
              id: 'ex-fb-tricep',
              name: 'Triceps Pushdown',
              muscleGroup: 'Triceps',
              targetSets: 2,
              targetRepsMin: 12,
              targetRepsMax: 15,
              orderIndex: 4,
            },
            {
              id: 'ex-fb-curl',
              name: 'Dumbbell Bicep Curl',
              muscleGroup: 'Biceps',
              targetSets: 2,
              targetRepsMin: 10,
              targetRepsMax: 12,
              orderIndex: 5,
            },
          ],
        },
      ],
    };
  }

  // Default to Push Pull Legs
  return {
    ...defaultRoutine,
    id: `routine-ppl-${Date.now()}`,
    targetDaysPerWeek,
    createdAt: new Date().toISOString(),
  };
}
