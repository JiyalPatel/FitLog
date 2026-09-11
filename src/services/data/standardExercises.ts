// src/services/data/standardExercises.ts
import { MuscleGroup } from '../../types';

export interface StandardExercise {
  name: string;
  muscleGroup: MuscleGroup;
  defaultSets: number;
  defaultRepsMin: number;
  defaultRepsMax: number;
  description?: string;
}

export const STANDARD_EXERCISES: StandardExercise[] = [
  // CHEST
  { name: 'Barbell Bench Press', muscleGroup: 'Chest', defaultSets: 4, defaultRepsMin: 6, defaultRepsMax: 10 },
  { name: 'Incline Dumbbell Press', muscleGroup: 'Chest', defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  { name: 'Smith Machine Bench Press', muscleGroup: 'Chest', defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  { name: 'Smith Machine Incline Press', muscleGroup: 'Chest', defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  { name: 'Incline Barbell Bench Press', muscleGroup: 'Chest', defaultSets: 3, defaultRepsMin: 6, defaultRepsMax: 10 },
  { name: 'Pec Dec Fly', muscleGroup: 'Chest', defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15 },
  { name: 'Cable Crossover', muscleGroup: 'Chest', defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15 },
  { name: 'Machine Chest Press', muscleGroup: 'Chest', defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  { name: 'Dumbbell Flat Bench Press', muscleGroup: 'Chest', defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  { name: 'Dips (Chest Focus)', muscleGroup: 'Chest', defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  { name: 'Push-ups', muscleGroup: 'Chest', defaultSets: 3, defaultRepsMin: 15, defaultRepsMax: 25 },
  { name: 'Decline Barbell Bench Press', muscleGroup: 'Chest', defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },

  // BACK
  { name: 'Lat Pulldown', muscleGroup: 'Back', defaultSets: 4, defaultRepsMin: 8, defaultRepsMax: 12 },
  { name: 'Barbell Bent Over Row', muscleGroup: 'Back', defaultSets: 4, defaultRepsMin: 8, defaultRepsMax: 10 },
  { name: 'Seated Cable Row', muscleGroup: 'Back', defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12 },
  { name: 'Pull-ups', muscleGroup: 'Back', defaultSets: 3, defaultRepsMin: 6, defaultRepsMax: 10 },
  { name: 'Chin-ups', muscleGroup: 'Back', defaultSets: 3, defaultRepsMin: 6, defaultRepsMax: 10 },
  { name: 'One-Arm Dumbbell Row', muscleGroup: 'Back', defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  { name: 'T-Bar Row', muscleGroup: 'Back', defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  { name: 'Close-Grip Lat Pulldown', muscleGroup: 'Back', defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12 },
  { name: 'Straight-Arm Cable Pulldown', muscleGroup: 'Back', defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15 },
  { name: 'Chest-Supported Machine Row', muscleGroup: 'Back', defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12 },
  { name: 'Conventional Deadlift', muscleGroup: 'Back', defaultSets: 3, defaultRepsMin: 5, defaultRepsMax: 8 },

  // SHOULDERS
  { name: 'Dumbbell Shoulder Press', muscleGroup: 'Shoulders', defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  { name: 'Barbell Overhead Press (OHP)', muscleGroup: 'Shoulders', defaultSets: 4, defaultRepsMin: 6, defaultRepsMax: 10 },
  { name: 'Smith Machine Shoulder Press', muscleGroup: 'Shoulders', defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  { name: 'Lateral Raise (Dumbbell)', muscleGroup: 'Shoulders', defaultSets: 4, defaultRepsMin: 12, defaultRepsMax: 15 },
  { name: 'Cable Lateral Raise', muscleGroup: 'Shoulders', defaultSets: 4, defaultRepsMin: 12, defaultRepsMax: 15 },
  { name: 'Face Pull', muscleGroup: 'Shoulders', defaultSets: 3, defaultRepsMin: 15, defaultRepsMax: 20 },
  { name: 'Rear Delt Fly (Machine/Pec Dec)', muscleGroup: 'Shoulders', defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15 },
  { name: 'Arnold Press', muscleGroup: 'Shoulders', defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  { name: 'Machine Shoulder Press', muscleGroup: 'Shoulders', defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12 },
  { name: 'Upright Row', muscleGroup: 'Shoulders', defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12 },

  // LEGS
  { name: 'Barbell Back Squat', muscleGroup: 'Legs', defaultSets: 4, defaultRepsMin: 6, defaultRepsMax: 10 },
  { name: 'Leg Press', muscleGroup: 'Legs', defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  { name: 'Romanian Deadlift (RDL)', muscleGroup: 'Legs', defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  { name: 'Bulgarian Split Squat', muscleGroup: 'Legs', defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  { name: 'Leg Extension', muscleGroup: 'Legs', defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15 },
  { name: 'Lying Leg Curl', muscleGroup: 'Legs', defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15 },
  { name: 'Seated Leg Curl', muscleGroup: 'Legs', defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15 },
  { name: 'Hack Squat', muscleGroup: 'Legs', defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  { name: 'Hip Thrust (Barbell/Machine)', muscleGroup: 'Legs', defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  { name: 'Standing Calf Raise', muscleGroup: 'Legs', defaultSets: 4, defaultRepsMin: 15, defaultRepsMax: 20 },
  { name: 'Seated Calf Raise', muscleGroup: 'Legs', defaultSets: 4, defaultRepsMin: 12, defaultRepsMax: 15 },
  { name: 'Walking Lunges', muscleGroup: 'Legs', defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12 },
  { name: 'Goblet Squat', muscleGroup: 'Legs', defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },

  // ARMS
  { name: 'Incline Dumbbell Curl', muscleGroup: 'Arms', defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12 },
  { name: 'Barbell Bicep Curl', muscleGroup: 'Arms', defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  { name: 'Hammer Curl', muscleGroup: 'Arms', defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  { name: 'Preacher Curl', muscleGroup: 'Arms', defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12 },
  { name: 'Cable Bicep Curl', muscleGroup: 'Arms', defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15 },
  { name: 'Triceps Pushdown (Rope)', muscleGroup: 'Arms', defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  { name: 'Triceps Pushdown (Straight Bar)', muscleGroup: 'Arms', defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12 },
  { name: 'Skull Crushers (EZ Bar)', muscleGroup: 'Arms', defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },
  { name: 'Overhead Cable Triceps Extension', muscleGroup: 'Arms', defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15 },
  { name: 'Dumbbell Overhead Triceps Extension', muscleGroup: 'Arms', defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 12 },
  { name: 'Close-Grip Bench Press', muscleGroup: 'Arms', defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 10 },
  { name: 'Triceps Dips', muscleGroup: 'Arms', defaultSets: 3, defaultRepsMin: 8, defaultRepsMax: 12 },

  // CORE
  { name: 'Hanging Leg Raise', muscleGroup: 'Core', defaultSets: 3, defaultRepsMin: 12, defaultRepsMax: 15 },
  { name: 'Cable Crunch', muscleGroup: 'Core', defaultSets: 3, defaultRepsMin: 15, defaultRepsMax: 20 },
  { name: 'Ab Wheel Rollout', muscleGroup: 'Core', defaultSets: 3, defaultRepsMin: 10, defaultRepsMax: 15 },
  { name: 'Decline Bench Crunch', muscleGroup: 'Core', defaultSets: 3, defaultRepsMin: 15, defaultRepsMax: 20 },
  { name: 'Plank', muscleGroup: 'Core', defaultSets: 3, defaultRepsMin: 45, defaultRepsMax: 60 },
  { name: 'Russian Twists', muscleGroup: 'Core', defaultSets: 3, defaultRepsMin: 20, defaultRepsMax: 30 },
];

export function searchStandardExercises(query: string, muscleGroup?: MuscleGroup | 'All'): StandardExercise[] {
  let list = STANDARD_EXERCISES;

  if (muscleGroup && muscleGroup !== 'All') {
    list = list.filter((ex) => ex.muscleGroup === muscleGroup);
  }

  if (query && query.trim()) {
    const q = query.toLowerCase().trim();
    list = list.filter(
      (ex) => ex.name.toLowerCase().includes(q) || ex.muscleGroup.toLowerCase().includes(q)
    );
  }

  return list;
}
