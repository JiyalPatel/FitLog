// src/services/storage/supabaseStore.ts
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { Routine, WorkoutSession, PersonalRecord, UserProfile, WeightEntry } from '../../types';

export class SupabaseStore {
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      email: data.email,
      displayName: data.display_name || 'Athlete',
      isGuest: false,
      weightUnit: data.weight_unit || 'kg',
      restTimerDefaultSeconds: data.rest_timer_default || 90,
      soundEnabled: true,
      createdAt: data.created_at,
    };
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    await supabase.from('profiles').upsert({
      id: profile.id,
      email: profile.email,
      display_name: profile.displayName,
      weight_unit: profile.weightUnit,
      rest_timer_default: profile.restTimerDefaultSeconds,
      updated_at: new Date().toISOString(),
    });
  }

  async getActiveRoutine(userId: string): Promise<Routine | null> {
    if (!isSupabaseConfigured || !supabase) return null;

    const { data: routineData, error: routineError } = await supabase
      .from('routines')
      .select('*, routine_days(*, routine_exercises(*))')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (routineError || !routineData) return null;

    const days = (routineData.routine_days || [])
      .sort((a: { day_order: number }, b: { day_order: number }) => a.day_order - b.day_order)
      .map((d: any) => ({
        id: d.id,
        name: d.name,
        dayOrder: d.day_order,
        estimatedMinutes: d.estimated_minutes || 50,
        exercises: (d.routine_exercises || [])
          .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
          .map((e: any) => ({
            id: e.id,
            name: e.exercise_name,
            muscleGroup: e.muscle_group,
            targetSets: e.target_sets,
            targetRepsMin: e.target_reps_min,
            targetRepsMax: e.target_reps_max,
            notes: e.notes,
            orderIndex: e.order_index,
          })),
      }));

    return {
      id: routineData.id,
      name: routineData.name,
      description: routineData.description || '',
      days,
      currentQueueIndex: routineData.current_queue_index || 0,
      lastCompletedDate: routineData.last_completed_at,
      targetDaysPerWeek: 5,
      createdAt: routineData.created_at,
    };
  }

  async saveRoutine(userId: string, routine: Routine): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    // 1. Upsert routine
    const { data: rData, error: rErr } = await supabase
      .from('routines')
      .upsert({
        id: routine.id.startsWith('routine-') ? undefined : routine.id,
        user_id: userId,
        name: routine.name,
        description: routine.description,
        current_queue_index: routine.currentQueueIndex,
        last_completed_at: routine.lastCompletedDate,
        is_active: true,
      })
      .select()
      .single();

    if (rErr || !rData) return;

    const routineId = rData.id;

    // 2. Upsert routine days & exercises
    for (const day of routine.days) {
      const { data: dayData } = await supabase
        .from('routine_days')
        .upsert({
          id: day.id.startsWith('day-') ? undefined : day.id,
          routine_id: routineId,
          name: day.name,
          day_order: day.dayOrder,
          estimated_minutes: day.estimatedMinutes,
        })
        .select()
        .single();

      if (dayData) {
        for (const ex of day.exercises) {
          await supabase.from('routine_exercises').upsert({
            id: ex.id.startsWith('ex-') ? undefined : ex.id,
            routine_day_id: dayData.id,
            exercise_name: ex.name,
            muscle_group: ex.muscleGroup,
            target_sets: ex.targetSets,
            target_reps_min: ex.targetRepsMin,
            target_reps_max: ex.targetRepsMax,
            order_index: ex.orderIndex,
            notes: ex.notes,
          });
        }
      }
    }
  }

  async getSessions(userId: string): Promise<WorkoutSession[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('workout_sessions')
      .select('*, workout_sets(*)')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error || !data) return [];

    return data.map((s: any) => {
      // Group sets by exercise
      const exercisesMap: Record<string, any> = {};

      (s.workout_sets || []).forEach((set: any) => {
        if (!exercisesMap[set.exercise_name]) {
          exercisesMap[set.exercise_name] = {
            id: `log-${set.exercise_name}`,
            exerciseName: set.exercise_name,
            muscleGroup: set.muscle_group,
            sets: [],
          };
        }
        exercisesMap[set.exercise_name].sets.push({
          id: set.id,
          setNumber: set.set_number,
          weight: Number(set.weight),
          reps: set.reps,
          rir: set.rir,
          isPR: set.is_pr,
          isCompleted: set.is_completed,
          notes: set.notes,
        });
      });

      return {
        id: s.id,
        routineId: s.routine_id,
        routineDayId: s.routine_day_id,
        name: s.name,
        startedAt: s.started_at,
        completedAt: s.completed_at,
        durationSeconds: s.duration_seconds,
        totalVolume: Number(s.total_volume),
        totalSets: s.total_sets,
        workoutScore: s.workout_score,
        status: s.status,
        notes: s.notes,
        exercises: Object.values(exercisesMap),
        prsAchieved: [],
      };
    });
  }

  async saveSession(userId: string, session: WorkoutSession): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    const { data: sData, error: sErr } = await supabase
      .from('workout_sessions')
      .upsert({
        id: session.id.startsWith('session-') ? undefined : session.id,
        user_id: userId,
        name: session.name,
        started_at: session.startedAt,
        completed_at: session.completedAt,
        duration_seconds: session.durationSeconds,
        total_volume: session.totalVolume,
        total_sets: session.totalSets,
        workout_score: session.workoutScore,
        status: session.status,
        notes: session.notes,
      })
      .select()
      .single();

    if (sErr || !sData) return;

    const sessionId = sData.id;

    // Insert sets
    for (const ex of session.exercises) {
      for (const set of ex.sets) {
        await supabase.from('workout_sets').upsert({
          id: set.id.startsWith('s-') ? undefined : set.id,
          workout_session_id: sessionId,
          exercise_name: ex.exerciseName,
          muscle_group: ex.muscleGroup,
          set_number: set.setNumber,
          weight: set.weight,
          reps: set.reps,
          rir: set.rir,
          is_pr: set.isPR || false,
          is_completed: set.isCompleted,
          notes: set.notes,
        });
      }
    }
  }

  async getPRs(userId: string): Promise<PersonalRecord[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('exercise_prs')
      .select('*')
      .eq('user_id', userId)
      .order('achieved_at', { ascending: false });

    if (error || !data) return [];

    return data.map((p: any) => ({
      id: p.id,
      exerciseName: p.exercise_name,
      prType: p.pr_type,
      prValue: Number(p.pr_value),
      weight: Number(p.weight || p.pr_value),
      reps: p.reps || 1,
      achievedAt: p.achieved_at,
      workoutSessionId: p.workout_session_id,
    }));
  }

  async savePR(userId: string, pr: PersonalRecord): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    await supabase.from('exercise_prs').upsert({
      id: pr.id.startsWith('pr-') ? undefined : pr.id,
      user_id: userId,
      exercise_name: pr.exerciseName,
      pr_type: pr.prType,
      pr_value: pr.prValue,
      weight: pr.weight,
      reps: pr.reps,
      achieved_at: pr.achievedAt,
      workout_session_id: pr.workoutSessionId,
    });
  }

  async getWeightEntries(userId: string): Promise<WeightEntry[]> {
    if (!isSupabaseConfigured || !supabase) return [];

    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      weight: Number(row.weight),
      unit: 'kg',
      date: row.date,
      notes: row.notes || undefined,
      createdAt: row.created_at || new Date().toISOString(),
    }));
  }

  async saveWeightEntry(userId: string, entry: WeightEntry): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    await supabase.from('body_measurements').upsert({
      id: entry.id.startsWith('weight-') ? undefined : entry.id,
      user_id: userId,
      date: entry.date,
      weight: entry.weight,
      notes: entry.notes || null,
      created_at: entry.createdAt,
    });
  }

  async deleteWeightEntry(userId: string, entryId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;

    await supabase
      .from('body_measurements')
      .delete()
      .eq('user_id', userId)
      .eq('id', entryId);
  }
}

export const supabaseStore = new SupabaseStore();
