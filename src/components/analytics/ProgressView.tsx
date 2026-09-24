// src/components/analytics/ProgressView.tsx
import React, { useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  Cell,
  LineChart, 
  Line, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Award, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Dumbbell, 
  Activity, 
  Filter,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Layers,
  BarChart3,
  Flame
} from 'lucide-react';
import { WorkoutSession, PersonalRecord } from '../../types';

interface ProgressViewProps {
  sessions: WorkoutSession[];
  prs: PersonalRecord[];
  weightUnit?: 'kg' | 'lbs';
}

export const ProgressView: React.FC<ProgressViewProps> = ({ 
  sessions, 
  prs,
  weightUnit = 'kg'
}) => {
  const [timeframe, setTimeframe] = useState<'1W' | '1M' | '3M' | 'All'>('1M');
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [metricType, setMetricType] = useState<'weight' | '1rm' | 'volume'>('weight');

  // Week Comparison State
  const [selectedWeekIndexA, setSelectedWeekIndexA] = useState<number>(0); // 0 = This Week
  const [selectedWeekIndexB, setSelectedWeekIndexB] = useState<number>(1); // 1 = Last Week
  const [comparisonGraphMode, setComparisonGraphMode] = useState<'daily' | 'cumulative' | 'history'>('daily');
  const [showDailyBreakdown, setShowDailyBreakdown] = useState<boolean>(true);
  const [showMuscleComparison, setShowMuscleComparison] = useState<boolean>(false);

  // All completed sessions sorted chronologically
  const completedAll = useMemo(() => {
    return [...sessions]
      .filter((s) => s.status === 'completed')
      .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());
  }, [sessions]);

  // Filter completed sessions by selected timeframe for exercise progression
  const filteredCompleted = useMemo(() => {
    if (timeframe === 'All') return completedAll;
    const now = Date.now();
    const daysLimit = timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 90;
    const cutoff = now - daysLimit * 24 * 60 * 60 * 1000;
    return completedAll.filter((s) => new Date(s.completedAt || s.startedAt).getTime() >= cutoff);
  }, [completedAll, timeframe]);

  // Collect distinct exercises from history
  const allExerciseNames = useMemo(() => {
    return Array.from(
      new Set(
        completedAll.flatMap((s) => s.exercises.map((e) => e.exerciseName))
      )
    );
  }, [completedAll]);

  // Set default selected exercise if none or invalid
  const currentExercise = useMemo(() => {
    if (selectedExercise && allExerciseNames.includes(selectedExercise)) {
      return selectedExercise;
    }
    return allExerciseNames[0] || 'Barbell Bench Press';
  }, [selectedExercise, allExerciseNames]);

  // Prepare exercise progression chart data
  const exerciseChartData = useMemo(() => {
    const data: { date: string; value: number }[] = [];
    filteredCompleted.forEach((session) => {
      const ex = session.exercises.find(
        (e) => e.exerciseName.toLowerCase() === currentExercise.toLowerCase()
      );
      if (ex && ex.sets.length > 0) {
        const dateLabel = new Date(session.startedAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });

        let val = 0;
        if (metricType === 'weight') {
          val = Math.max(...ex.sets.map((s) => s.weight || 0));
        } else if (metricType === '1rm') {
          val = Math.max(...ex.sets.map((s) => Math.round((s.weight || 0) * (1 + (s.reps || 0) / 30))));
        } else {
          val = ex.sets.reduce((acc, s) => acc + (s.weight || 0) * (s.reps || 0), 0);
        }

        if (val > 0) {
          data.push({ date: dateLabel, value: val });
        }
      }
    });
    return data;
  }, [filteredCompleted, currentExercise, metricType]);

  // --- FULL WEEK VOLUME COMPARATOR DATA ---
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const allWeeks = useMemo(() => {
    const now = new Date();
    const currentMonday = new Date(now);
    const day = currentMonday.getDay();
    const diff = currentMonday.getDate() - day + (day === 0 ? -6 : 1);
    currentMonday.setDate(diff);
    currentMonday.setHours(0, 0, 0, 0);

    const weeks = [];
    const totalWeeksCount = 8; // Past 8 weeks

    for (let i = 0; i < totalWeeksCount; i++) {
      const weekStart = new Date(currentMonday);
      weekStart.setDate(weekStart.getDate() - i * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const isCurrent = i === 0;
      const isPrevious = i === 1;

      let label = 'This Week';
      if (isCurrent) label = 'This Week';
      else if (isPrevious) label = 'Last Week';
      else label = `${i} Wks Ago`;

      let shortLabel = 'This Wk';
      if (isCurrent) shortLabel = 'This Wk';
      else if (isPrevious) shortLabel = 'Last Wk';
      else shortLabel = `${i}w ago`;

      const weekSessions = completedAll.filter((s) => {
        const sTime = new Date(s.completedAt || s.startedAt).getTime();
        return sTime >= weekStart.getTime() && sTime <= weekEnd.getTime();
      });

      const totalVolume = weekSessions.reduce((acc, s) => acc + (s.totalVolume || 0), 0);
      const totalSets = weekSessions.reduce((acc, s) => acc + (s.totalSets || 0), 0);
      const workoutsCount = weekSessions.length;
      const avgVolumePerWorkout = workoutsCount > 0 ? Math.round(totalVolume / workoutsCount) : 0;

      // Muscle group breakdown for this week
      const muscleBreakdown: Record<string, { sets: number; volume: number }> = {
        Chest: { sets: 0, volume: 0 },
        Back: { sets: 0, volume: 0 },
        Shoulders: { sets: 0, volume: 0 },
        Legs: { sets: 0, volume: 0 },
        Biceps: { sets: 0, volume: 0 },
        Triceps: { sets: 0, volume: 0 },
        Forearms: { sets: 0, volume: 0 },
        Core: { sets: 0, volume: 0 },
      };

      weekSessions.forEach((s) => {
        s.exercises?.forEach((ex) => {
          let mg = ex.muscleGroup as string;
          if (mg === 'Arms') {
            const nameLower = ex.exerciseName.toLowerCase();
            if (nameLower.includes('tricep') || nameLower.includes('dip') || nameLower.includes('pushdown')) {
              mg = 'Triceps';
            } else if (nameLower.includes('wrist') || nameLower.includes('farmer') || nameLower.includes('hang')) {
              mg = 'Forearms';
            } else {
              mg = 'Biceps';
            }
          }
          if (!muscleBreakdown[mg]) {
            muscleBreakdown[mg] = { sets: 0, volume: 0 };
          }
          const setsCount = ex.sets?.filter((st) => st.isCompleted !== false).length || ex.sets?.length || 0;
          const exVol = ex.sets?.reduce((acc, st) => acc + (st.weight || 0) * (st.reps || 0), 0) || 0;
          muscleBreakdown[mg].sets += setsCount;
          muscleBreakdown[mg].volume += exVol;
        });
      });

      // Daily points Mon..Sun
      let runningVolume = 0;
      const dailyPoints = dayNames.map((name, dayIdx) => {
        const dayDate = new Date(weekStart);
        dayDate.setDate(dayDate.getDate() + dayIdx);
        const startOfDay = new Date(dayDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(dayDate);
        endOfDay.setHours(23, 59, 59, 999);

        const matchingSessions = weekSessions.filter((s) => {
          const t = new Date(s.completedAt || s.startedAt).getTime();
          return t >= startOfDay.getTime() && t <= endOfDay.getTime();
        });

        const dayVol = matchingSessions.reduce((acc, s) => acc + (s.totalVolume || 0), 0);
        runningVolume += dayVol;

        const isToday = now.toDateString() === dayDate.toDateString();
        const isFuture = isCurrent && dayDate > now && !isToday;

        return {
          dayIndex: dayIdx,
          dayName: name,
          dateLabel: dayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          volume: isFuture ? null : dayVol,
          rawVolume: dayVol,
          cumulativeVolume: isFuture ? null : runningVolume,
          workoutsCount: matchingSessions.length,
          sessionNames: matchingSessions.map((s) => s.name),
          isToday,
          isFuture,
        };
      });

      weeks.push({
        id: `week-${i}`,
        index: i,
        label,
        shortLabel,
        isCurrent,
        isPrevious,
        dateRange: `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
        weekStart,
        weekEnd,
        sessions: weekSessions,
        totalVolume,
        totalSets,
        workoutsCount,
        avgVolumePerWorkout,
        dailyPoints,
        muscleBreakdown,
      });
    }

    return weeks;
  }, [completedAll]);

  // Selected weeks for head-to-head comparison
  const weekA = allWeeks[selectedWeekIndexA] || allWeeks[0];
  const weekB = allWeeks[selectedWeekIndexB] || allWeeks[1] || allWeeks[0];

  // Head-to-Head Comparison Metrics
  const volumeDelta = weekA.totalVolume - weekB.totalVolume;
  let volumeDeltaPercent = 0;
  if (weekB.totalVolume > 0) {
    volumeDeltaPercent = Math.round((volumeDelta / weekB.totalVolume) * 100);
  } else if (weekA.totalVolume > 0) {
    volumeDeltaPercent = 100;
  }

  const workoutsDelta = weekA.workoutsCount - weekB.workoutsCount;
  const setsDelta = weekA.totalSets - weekB.totalSets;
  const avgVolDelta = weekA.avgVolumePerWorkout - weekB.avgVolumePerWorkout;

  // Combined daily comparison chart data (Mon - Sun)
  const combinedDailyChartData = useMemo(() => {
    return dayNames.map((name, idx) => {
      const ptA = weekA.dailyPoints[idx];
      const ptB = weekB.dailyPoints[idx];
      const isFutureA = !!ptA.isFuture;
      const isFutureB = !!ptB.isFuture;
      return {
        day: name,
        weekADate: ptA.dateLabel,
        weekBDate: ptB.dateLabel,
        // Daily volume
        volumeA: isFutureA ? null : ptA.volume,
        volumeB: isFutureB ? null : ptB.volume,
        // Cumulative volume
        cumVolumeA: isFutureA ? null : ptA.cumulativeVolume,
        cumVolumeB: isFutureB ? null : ptB.cumulativeVolume,
        // Details
        sessionNamesA: ptA.sessionNames.length > 0 ? ptA.sessionNames.join(', ') : 'Rest Day',
        sessionNamesB: ptB.sessionNames.length > 0 ? ptB.sessionNames.join(', ') : 'Rest Day',
        workoutsA: ptA.workoutsCount,
        workoutsB: ptB.workoutsCount,
        delta: (ptA.volume || 0) - (ptB.volume || 0),
        cumDelta: (ptA.cumulativeVolume || 0) - (ptB.cumulativeVolume || 0),
        isFutureA,
        isFutureB,
      };
    });
  }, [weekA, weekB]);

  // Macro 6-week historical chart data
  const macroChartData = useMemo(() => {
    return allWeeks
      .slice(0, 6)
      .reverse()
      .map((w) => ({
        shortLabel: w.shortLabel,
        label: w.label,
        dateRange: w.dateRange,
        volume: w.totalVolume,
        workouts: w.workoutsCount,
        isSelectedA: w.index === weekA.index,
        isSelectedB: w.index === weekB.index,
      }));
  }, [allWeeks, weekA.index, weekB.index]);

  // Overall Muscle Group Analytics calculation across all history
  const muscleCounts: Record<string, number> = {
    Chest: 0,
    Back: 0,
    Shoulders: 0,
    Legs: 0,
    Biceps: 0,
    Triceps: 0,
    Forearms: 0,
    Core: 0,
  };

  completedAll.forEach((s) => {
    s.exercises?.forEach((e) => {
      let mg = e.muscleGroup as string;
      if (mg === 'Arms') {
        const nameLower = e.exerciseName.toLowerCase();
        if (nameLower.includes('tricep') || nameLower.includes('dip') || nameLower.includes('pushdown')) {
          mg = 'Triceps';
        } else if (nameLower.includes('wrist') || nameLower.includes('farmer') || nameLower.includes('hang')) {
          mg = 'Forearms';
        } else {
          mg = 'Biceps';
        }
      }
      if (muscleCounts[mg] !== undefined) {
        muscleCounts[mg] += e.sets.filter((x) => x.isCompleted).length;
      }
    });
  });

  const maxMuscleSets = Math.max(...Object.values(muscleCounts), 1);

  return (
    <div className="flex-1 px-4 py-5 pb-24 space-y-6 overflow-y-auto">
      {/* Header */}
      <div>
        <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
          PERFORMANCE & ANALYTICS
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-white mt-1">
          Visual Progress
        </h2>
      </div>

      {/* 1. WEEKLY FULL VOLUME COMPARATOR (PRIMARY REQUEST) */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-900 p-4 space-y-4 shadow-xl">
        {/* Comparator Header & Week Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 whitespace-nowrap min-w-0">
              <Activity className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="truncate">VOLUME COMPARATOR</span>
            </span>

            {/* Quick Presets */}
            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={() => {
                  setSelectedWeekIndexA(0);
                  setSelectedWeekIndexB(1);
                }}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors whitespace-nowrap ${
                  selectedWeekIndexA === 0 && selectedWeekIndexB === 1
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                This vs Last
              </button>
              <button
                onClick={() => {
                  setSelectedWeekIndexA(0);
                  setSelectedWeekIndexB(2);
                }}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors whitespace-nowrap ${
                  selectedWeekIndexA === 0 && selectedWeekIndexB === 2
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                This vs 2w Ago
              </button>
            </div>
          </div>

          {/* Week Selectors Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-850">
            {/* Week A (Primary) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-white inline-block shadow-glow-sm" />
                  Primary Week
                </span>
                <span className="text-[9px] font-mono text-zinc-500">{weekA.dateRange}</span>
              </div>
              <select
                value={selectedWeekIndexA}
                onChange={(e) => setSelectedWeekIndexA(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-white focus:outline-none focus:border-zinc-500 cursor-pointer"
              >
                {allWeeks.map((w) => (
                  <option key={w.id} value={w.index}>
                    {w.label} ({w.dateRange})
                  </option>
                ))}
              </select>
            </div>

            {/* Week B (Comparison) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-zinc-400 flex items-center gap-1 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" />
                  Compare Against
                </span>
                <span className="text-[9px] font-mono text-zinc-500">{weekB.dateRange}</span>
              </div>
              <select
                value={selectedWeekIndexB}
                onChange={(e) => setSelectedWeekIndexB(Number(e.target.value))}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono font-semibold text-white focus:outline-none focus:border-zinc-500 cursor-pointer"
              >
                {allWeeks.map((w) => (
                  <option key={w.id} value={w.index}>
                    {w.label} ({w.dateRange})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Head-to-Head Comparison Scorecard */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Total Full Volume Comparison */}
          <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-850 space-y-1.5 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 truncate">Total Volume</span>
              {volumeDeltaPercent > 0 ? (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-white border border-zinc-700 font-bold flex items-center gap-0.5 shrink-0">
                  <TrendingUp className="w-3 h-3 text-white" /> +{volumeDeltaPercent}%
                </span>
              ) : volumeDeltaPercent < 0 ? (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 flex items-center gap-0.5 shrink-0">
                  <TrendingDown className="w-3 h-3 text-zinc-400" /> {volumeDeltaPercent}%
                </span>
              ) : (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500 border border-zinc-800 shrink-0">
                  Equal
                </span>
              )}
            </div>

            <div>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-bold font-mono text-white">
                  {weekA.totalVolume.toLocaleString()}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">{weightUnit}</span>
              </div>
              <div className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">
                vs {weekB.totalVolume.toLocaleString()} {weightUnit}
              </div>
            </div>

            {/* Visual Balance Bar */}
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden flex mt-2">
              <div
                className="bg-white h-full transition-all duration-500"
                style={{
                  width: `${
                    weekA.totalVolume + weekB.totalVolume > 0
                      ? Math.min(
                          100,
                          Math.max(
                            5,
                            (weekA.totalVolume / (weekA.totalVolume + weekB.totalVolume)) * 100
                          )
                        )
                      : 50
                  }%`,
                }}
              />
              <div
                className="bg-zinc-700 h-full transition-all duration-500"
                style={{
                  width: `${
                    weekA.totalVolume + weekB.totalVolume > 0
                      ? Math.min(
                          100,
                          Math.max(
                            5,
                            (weekB.totalVolume / (weekA.totalVolume + weekB.totalVolume)) * 100
                          )
                        )
                      : 50
                  }%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-zinc-500">
              <span className="truncate">{weekA.shortLabel}: {volumeDelta >= 0 ? `+${volumeDelta.toLocaleString()}` : `${volumeDelta.toLocaleString()}`}</span>
              <span className="shrink-0 ml-1">{weekB.shortLabel}</span>
            </div>
          </div>

          {/* Workouts & Consistency */}
          <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-850 space-y-1.5 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 truncate">Workouts</span>
              <span className="text-[10px] font-mono text-zinc-400 truncate shrink-0">
                {workoutsDelta > 0 ? `+${workoutsDelta}` : workoutsDelta < 0 ? `${workoutsDelta}` : 'Matched'}
              </span>
            </div>
            <div>
              <div className="flex items-baseline space-x-1">
                <span className="text-xl font-bold font-mono text-white">
                  {weekA.workoutsCount}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">sessions</span>
              </div>
              <div className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">
                vs {weekB.workoutsCount} sessions
              </div>
            </div>
            <p className="text-[10px] font-mono text-zinc-500 pt-1 border-t border-zinc-900/80 truncate">
              Sets: <span className="text-zinc-300 font-bold">{weekA.totalSets}</span> vs <span className="text-zinc-400">{weekB.totalSets}</span> ({setsDelta >= 0 ? `+${setsDelta}` : setsDelta})
            </p>
          </div>
        </div>

        {/* Graph Mode Navigation Tabs */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-white">
              {comparisonGraphMode === 'daily' && 'Day-by-Day Volume Overlay'}
              {comparisonGraphMode === 'cumulative' && 'Weekly Cumulative Load Curve'}
              {comparisonGraphMode === 'history' && '6-Week Volume Trajectory'}
            </div>
          </div>

          <div className="grid grid-cols-3 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-[11px] font-mono gap-1">
            <button
              onClick={() => setComparisonGraphMode('daily')}
              className={`py-1.5 px-2 rounded-lg text-center transition-colors whitespace-nowrap font-medium ${
                comparisonGraphMode === 'daily'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Day-by-Day
            </button>
            <button
              onClick={() => setComparisonGraphMode('cumulative')}
              className={`py-1.5 px-2 rounded-lg text-center transition-colors whitespace-nowrap font-medium ${
                comparisonGraphMode === 'cumulative'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Cumulative
            </button>
            <button
              onClick={() => setComparisonGraphMode('history')}
              className={`py-1.5 px-2 rounded-lg text-center transition-colors whitespace-nowrap font-medium ${
                comparisonGraphMode === 'history'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Macro Trend
            </button>
          </div>
        </div>

        {/* Chart View */}
        <div className="h-52 w-full pt-1">
          {comparisonGraphMode === 'daily' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedDailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="day"
                  stroke="#52525b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                />
                <YAxis
                  stroke="#52525b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const diff = data.delta;
                      return (
                        <div className="p-3 rounded-xl bg-zinc-950/95 border border-zinc-800 shadow-2xl font-mono text-xs space-y-1.5 backdrop-blur-md">
                          <div className="font-bold text-white flex items-center justify-between border-b border-zinc-800/80 pb-1">
                            <span>{data.day}</span>
                            <span className="text-[10px] text-zinc-400">{data.weekADate} vs {data.weekBDate}</span>
                          </div>
                          
                          {/* Week A */}
                          <div className="flex items-center justify-between gap-3 text-white">
                            <span className="flex items-center gap-1.5 font-bold">
                              <span className="w-2 h-2 rounded-full bg-white inline-block" />
                              {weekA.label}:
                            </span>
                            <span className="font-bold">
                              {data.isFutureA
                                ? 'Upcoming'
                                : `${data.volumeA?.toLocaleString() || 0} ${weightUnit}`}
                            </span>
                          </div>
                          {!data.isFutureA && data.sessionNamesA && (
                            <div className="text-[10px] text-zinc-400 pl-3.5">
                              {data.sessionNamesA}
                            </div>
                          )}

                          {/* Week B */}
                          <div className="flex items-center justify-between gap-3 text-zinc-400 pt-0.5">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" />
                              {weekB.label}:
                            </span>
                            <span>{data.volumeB?.toLocaleString() || 0} {weightUnit}</span>
                          </div>
                          {data.sessionNamesB && (
                            <div className="text-[10px] text-zinc-500 pl-3.5">
                              {data.sessionNamesB}
                            </div>
                          )}

                          {/* Daily Delta */}
                          {!data.isFutureA && (
                            <div className="pt-1 border-t border-zinc-850 flex items-center justify-between text-[11px]">
                              <span className="text-zinc-500">Day Difference:</span>
                              <span className={`font-bold ${diff > 0 ? 'text-white' : diff < 0 ? 'text-zinc-400' : 'text-zinc-500'}`}>
                                {diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()} {weightUnit}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                {/* Primary Week Line */}
                <Line
                  type="monotone"
                  dataKey="volumeA"
                  name={weekA.label}
                  stroke="#ffffff"
                  strokeWidth={2.5}
                  connectNulls={false}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (!payload || payload.isFutureA || payload.volumeA === null) return null;
                    if (payload.volumeA === 0) {
                      return <circle key={`dot-a-${props.index}`} cx={cx} cy={cy} r={2} fill="#3f3f46" />;
                    }
                    return <circle key={`dot-a-${props.index}`} cx={cx} cy={cy} r={3.5} fill="#ffffff" stroke="#000000" strokeWidth={1.5} />;
                  }}
                  activeDot={{ r: 6, fill: '#ffffff', stroke: '#000000', strokeWidth: 2 }}
                />
                {/* Comparison Week Line */}
                <Line
                  type="monotone"
                  dataKey="volumeB"
                  name={weekB.label}
                  stroke="#71717a"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  connectNulls={false}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (!payload || payload.volumeB === null) return null;
                    if (payload.volumeB === 0) {
                      return <circle key={`dot-b-${props.index}`} cx={cx} cy={cy} r={2} fill="#27272a" />;
                    }
                    return <circle key={`dot-b-${props.index}`} cx={cx} cy={cy} r={3} fill="#71717a" />;
                  }}
                  activeDot={{ r: 5, fill: '#71717a', stroke: '#000000', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}

          {comparisonGraphMode === 'cumulative' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedDailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cumVolumeGradA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="#52525b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                />
                <YAxis
                  stroke="#52525b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const cumDiff = (data.cumVolumeA || 0) - (data.cumVolumeB || 0);
                      return (
                        <div className="p-3 rounded-xl bg-zinc-950/95 border border-zinc-800 shadow-2xl font-mono text-xs space-y-1.5 backdrop-blur-md">
                          <div className="font-bold text-white flex items-center justify-between border-b border-zinc-800/80 pb-1">
                            <span>Running Total by {data.day}</span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-white">
                            <span className="flex items-center gap-1.5 font-bold">
                              <span className="w-2 h-2 rounded-full bg-white inline-block" />
                              {weekA.label}:
                            </span>
                            <span className="font-bold">
                              {data.isFutureA
                                ? 'Upcoming'
                                : `${data.cumVolumeA?.toLocaleString() || 0} ${weightUnit}`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-3 text-zinc-400">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" />
                              {weekB.label}:
                            </span>
                            <span>{data.cumVolumeB?.toLocaleString() || 0} {weightUnit}</span>
                          </div>
                          {!data.isFutureA && (
                            <div className="pt-1 border-t border-zinc-850 flex items-center justify-between text-[11px]">
                              <span className="text-zinc-500">Cumulative Lead:</span>
                              <span className={`font-bold ${cumDiff >= 0 ? 'text-white' : 'text-zinc-400'}`}>
                                {cumDiff >= 0 ? `+${cumDiff.toLocaleString()}` : cumDiff.toLocaleString()} {weightUnit}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cumVolumeA"
                  name={weekA.label}
                  stroke="#ffffff"
                  strokeWidth={2.5}
                  fill="url(#cumVolumeGradA)"
                  connectNulls={false}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (!payload || payload.isFutureA || payload.cumVolumeA === null) return null;
                    return <circle key={`dot-ca-${props.index}`} cx={cx} cy={cy} r={3.5} fill="#ffffff" stroke="#000000" strokeWidth={1.5} />;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="cumVolumeB"
                  name={weekB.label}
                  stroke="#71717a"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ fill: '#71717a', strokeWidth: 2, r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {comparisonGraphMode === 'history' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={macroChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="shortLabel"
                  stroke="#52525b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                />
                <YAxis
                  stroke="#52525b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl font-mono text-xs text-white space-y-1">
                          <div className="font-bold text-white flex items-center justify-between gap-2">
                            <span>{data.label}</span>
                            {data.isSelectedA && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-white text-black font-bold">PRIMARY</span>
                            )}
                            {data.isSelectedB && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-700 text-white font-bold">COMPARE</span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400">{data.dateRange}</div>
                          <div className="text-white font-bold pt-1">
                            {data.volume.toLocaleString()} {weightUnit} total
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            {data.workouts} workout{data.workouts === 1 ? '' : 's'}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                  {macroChartData.map((entry, index) => (
                    <Cell
                      key={`macro-cell-${index}`}
                      fill={
                        entry.isSelectedA
                          ? '#ffffff'
                          : entry.isSelectedB
                          ? '#a1a1aa'
                          : '#3f3f46'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 pt-2 border-t border-zinc-900 text-[11px] font-mono text-zinc-400">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-1 rounded bg-white inline-block shadow-glow-sm" />
            <span className="text-white font-medium">{weekA.label}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-zinc-500 inline-block" />
            <span className="text-zinc-400">{weekB.label}</span>
          </div>
        </div>

        {/* Expandable Day-by-Day Matrix Breakdown */}
        <div className="pt-2 border-t border-zinc-900 space-y-2">
          <button
            onClick={() => setShowDailyBreakdown(!showDailyBreakdown)}
            className="w-full flex items-center justify-between text-xs font-mono text-zinc-400 hover:text-white py-1 transition-colors"
          >
            <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              Day-by-Day Volume Breakdown
            </span>
            <span className="flex items-center gap-1 text-[11px] text-zinc-500">
              {showDailyBreakdown ? 'Hide Matrix' : 'View Matrix'}
              {showDailyBreakdown ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {showDailyBreakdown && (
            <div className="space-y-1.5 pt-1">
              {combinedDailyChartData.map((row) => (
                <div
                  key={row.day}
                  className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-850 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-8 font-bold text-zinc-200">{row.day}</span>
                    <div>
                      <div className="text-[11px] text-zinc-400">
                        <span className="text-white font-semibold">
                          {row.isFutureA
                            ? 'Upcoming'
                            : (row.volumeA && row.volumeA > 0)
                            ? `${row.volumeA.toLocaleString()} ${weightUnit}`
                            : 'Rest'}
                        </span>
                        {!row.isFutureA && row.volumeA && row.volumeA > 0 ? (
                          <span className="text-[10px] text-zinc-500 ml-1.5">({row.sessionNamesA})</span>
                        ) : null}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {weekB.shortLabel}: {row.isFutureB
                          ? 'Upcoming'
                          : (row.volumeB && row.volumeB > 0)
                          ? `${row.volumeB.toLocaleString()} ${weightUnit}`
                          : 'Rest'}
                        {!row.isFutureB && row.volumeB && row.volumeB > 0 ? <span className="ml-1">({row.sessionNamesB})</span> : null}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    {row.isFutureA ? (
                      <span className="text-[10px] text-zinc-600 font-mono">--</span>
                    ) : row.delta > 0 ? (
                      <span className="text-[11px] font-bold text-white bg-zinc-900 border border-zinc-750 px-2 py-0.5 rounded-full">
                        +{row.delta.toLocaleString()} {weightUnit}
                      </span>
                    ) : row.delta < 0 ? (
                      <span className="text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                        {row.delta.toLocaleString()} {weightUnit}
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-600 font-mono">Matched</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Muscle Group Comparison Toggle */}
        <div className="pt-2 border-t border-zinc-900 space-y-2">
          <button
            onClick={() => setShowMuscleComparison(!showMuscleComparison)}
            className="w-full flex items-center justify-between text-xs font-mono text-zinc-400 hover:text-white py-1 transition-colors"
          >
            <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              Compare Muscle Focus (Week A vs Week B)
            </span>
            <span className="flex items-center gap-1 text-[11px] text-zinc-500">
              {showMuscleComparison ? 'Hide' : 'Compare'}
              {showMuscleComparison ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </span>
          </button>

          {showMuscleComparison && (
            <div className="space-y-2 pt-1">
              {['Chest', 'Back', 'Legs', 'Shoulders', 'Biceps', 'Triceps', 'Forearms', 'Core'].map((mg) => {
                const mA = weekA.muscleBreakdown[mg] || { sets: 0, volume: 0 };
                const mB = weekB.muscleBreakdown[mg] || { sets: 0, volume: 0 };
                const maxVal = Math.max(mA.sets, mB.sets, 1);
                const sDiff = mA.sets - mB.sets;
                return (
                  <div key={mg} className="space-y-1 p-2 rounded-lg bg-zinc-900/30 border border-zinc-850/60">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-zinc-200 font-semibold">{mg}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-bold">{mA.sets} sets ({mA.volume.toLocaleString()} {weightUnit})</span>
                        <span className="text-zinc-500 text-[10px]">vs</span>
                        <span className="text-zinc-400">{mB.sets} sets</span>
                        <span className={`text-[10px] px-1 py-0.2 rounded ${sDiff > 0 ? 'bg-zinc-800 text-white font-bold' : sDiff < 0 ? 'bg-zinc-900 text-zinc-400' : 'text-zinc-600'}`}>
                          {sDiff > 0 ? `+${sDiff}s` : sDiff < 0 ? `${sDiff}s` : '='}
                        </span>
                      </div>
                    </div>
                    {/* Dual comparison bars */}
                    <div className="space-y-0.5">
                      <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-white h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.round((mA.sets / maxVal) * 100)}%` }}
                        />
                      </div>
                      <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
                        <div
                          className="bg-zinc-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.round((mB.sets / maxVal) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 2. EXERCISE PROGRESSION CHART CARD */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-900 p-4 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              EXERCISE PROGRESSION
            </span>
            <div className="mt-1">
              <select
                value={currentExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs font-mono font-semibold text-white focus:outline-none focus:border-zinc-500 max-w-[190px] truncate"
              >
                {allExerciseNames.length > 0 ? (
                  allExerciseNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))
                ) : (
                  <option value={currentExercise}>{currentExercise}</option>
                )}
              </select>
            </div>
          </div>

          {/* Metric Selector */}
          <div className="flex items-center space-x-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[10px] font-mono">
            {(['weight', '1rm', 'volume'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetricType(m)}
                className={`px-2 py-0.5 rounded uppercase ${
                  metricType === m ? 'bg-white text-black font-bold' : 'text-zinc-400'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Timeframe Filter Pills */}
        <div className="flex items-center space-x-1 p-0.5 rounded-lg bg-zinc-900 border border-zinc-800">
          {(['1W', '1M', '3M', 'All'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`flex-1 py-1 rounded text-[10px] font-mono font-medium transition-all ${
                timeframe === tf
                  ? 'bg-white text-black shadow-sm font-bold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart View */}
        <div className="h-44 w-full pt-1">
          {exerciseChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={exerciseChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  stroke="#52525b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                />
                <YAxis
                  stroke="#52525b"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#27272a' }}
                  domain={['dataMin - 5', 'dataMax + 5']}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09090b',
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                  itemStyle={{ color: '#ffffff' }}
                  formatter={(val: any) => [
                    `${val} ${metricType === 'volume' ? weightUnit : weightUnit}`,
                    metricType.toUpperCase(),
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                  dot={{ fill: '#ffffff', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, fill: '#ffffff', stroke: '#000000', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs font-mono text-zinc-500">
              No session data for this exercise in {timeframe}.
            </div>
          )}
        </div>
      </div>

      {/* 3. MUSCLE GROUP ANALYTICS DISTRIBUTION */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-900 p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            OVERALL MUSCLE DISTRIBUTION
          </span>
          <Activity className="w-4 h-4 text-zinc-400" />
        </div>

        <div className="space-y-2.5 pt-1">
          {Object.entries(muscleCounts).map(([muscle, count]) => {
            const percentage = Math.round((count / maxMuscleSets) * 100);
            return (
              <div key={muscle} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-300">{muscle}</span>
                  <span className="text-zinc-500">{count} sets</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-white h-full rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-[11px] text-zinc-400 border-t border-zinc-900 leading-relaxed font-mono">
          Weekly volume and muscle distribution track your compound and isolation workload.
        </div>
      </div>

      {/* 4. PERSONAL RECORD (PR) TROPHY WALL */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-900 p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-white" /> Personal Records Wall
          </span>
          <span className="text-xs font-mono text-zinc-500">{prs.length} Records</span>
        </div>

        <div className="space-y-2 pt-1">
          {prs.length === 0 ? (
            <div className="py-6 px-4 text-center rounded-xl bg-zinc-900/30 border border-zinc-900">
              <Award className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
              <div className="text-xs font-semibold text-zinc-400">No Personal Records Yet</div>
              <p className="text-[11px] font-mono text-zinc-600 mt-1 max-w-xs mx-auto">
                Log your sets during workouts. When you lift a heavier weight or more reps, your personal records will appear here!
              </p>
            </div>
          ) : (
            prs.map((pr) => (
              <div
                key={pr.id}
                className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-850 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-white">{pr.exerciseName}</div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">
                    Achieved{' '}
                    {new Date(pr.achievedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-white">
                    {pr.prType === 'weight'
                      ? `${pr.weight} ${weightUnit} × ${pr.reps}`
                      : pr.prType === '1rm'
                      ? `~${pr.prValue} ${weightUnit} 1RM`
                      : `${pr.prValue} ${weightUnit}`}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">
                    {pr.prType} record
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
