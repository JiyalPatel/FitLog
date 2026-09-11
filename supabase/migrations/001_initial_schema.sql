-- 001_initial_schema.sql
-- Fitness Tracker Minimalist Database Schema with Row-Level Security (RLS)

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    display_name TEXT,
    weight_unit TEXT DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
    rest_timer_default INTEGER DEFAULT 90,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Routines Table
CREATE TABLE IF NOT EXISTS public.routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    current_queue_index INTEGER DEFAULT 0,
    last_completed_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own routines" ON public.routines
    FOR ALL USING (auth.uid() = user_id);

-- 3. Routine Days Table (e.g., Push, Pull, Legs)
CREATE TABLE IF NOT EXISTS public.routine_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    day_order INTEGER NOT NULL,
    estimated_minutes INTEGER DEFAULT 50,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.routine_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view routine days" ON public.routine_days
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.routines
            WHERE routines.id = routine_days.routine_id
            AND routines.user_id = auth.uid()
        )
    );

-- 4. Routine Exercises Table
CREATE TABLE IF NOT EXISTS public.routine_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_day_id UUID NOT NULL REFERENCES public.routine_days(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    target_sets INTEGER DEFAULT 3,
    target_reps_min INTEGER DEFAULT 8,
    target_reps_max INTEGER DEFAULT 12,
    order_index INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage routine exercises" ON public.routine_exercises
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.routine_days
            JOIN public.routines ON routines.id = routine_days.routine_id
            WHERE routine_days.id = routine_exercises.routine_day_id
            AND routines.user_id = auth.uid()
        )
    );

-- 5. Workout Sessions Table
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    routine_id UUID REFERENCES public.routines(id) ON DELETE SET NULL,
    routine_day_id UUID REFERENCES public.routine_days(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    total_volume NUMERIC(10,2) DEFAULT 0,
    total_sets INTEGER DEFAULT 0,
    workout_score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workout sessions" ON public.workout_sessions
    FOR ALL USING (auth.uid() = user_id);

-- 6. Workout Sets Table
CREATE TABLE IF NOT EXISTS public.workout_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workout_session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    set_number INTEGER NOT NULL,
    weight NUMERIC(8,2) NOT NULL DEFAULT 0,
    reps INTEGER NOT NULL DEFAULT 0,
    rir INTEGER,
    is_pr BOOLEAN DEFAULT FALSE,
    is_completed BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.workout_sets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workout sets" ON public.workout_sets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.workout_sessions
            WHERE workout_sessions.id = workout_sets.workout_session_id
            AND workout_sessions.user_id = auth.uid()
        )
    );

-- 7. Exercise PRs Table (Personal Records)
CREATE TABLE IF NOT EXISTS public.exercise_prs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    exercise_name TEXT NOT NULL,
    pr_type TEXT NOT NULL CHECK (pr_type IN ('weight', 'reps', '1rm', 'volume')),
    pr_value NUMERIC(10,2) NOT NULL,
    weight NUMERIC(8,2),
    reps INTEGER,
    workout_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
    achieved_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.exercise_prs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own exercise prs" ON public.exercise_prs
    FOR ALL USING (auth.uid() = user_id);

-- 8. Body Measurements Table
CREATE TABLE IF NOT EXISTS public.body_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight NUMERIC(6,2),
    waist NUMERIC(6,2),
    chest NUMERIC(6,2),
    arms NUMERIC(6,2),
    thighs NUMERIC(6,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own body measurements" ON public.body_measurements
    FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date ON public.workout_sessions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sets_session_exercise ON public.workout_sets(workout_session_id, exercise_name);
CREATE INDEX IF NOT EXISTS idx_exercise_prs_user_exercise ON public.exercise_prs(user_id, exercise_name);
