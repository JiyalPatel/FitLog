// src/components/analytics/ProgressView.tsx
import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  Cell,
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Award, TrendingUp, TrendingDown, Calendar, Dumbbell, Activity, Filter } from 'lucide-react';
import { WorkoutSession, PersonalRecord } from '../../types';

interface ProgressViewProps {
  sessions: WorkoutSession[];
  prs: PersonalRecord[];
}

export const ProgressView: React.FC<ProgressViewProps> = ({ sessions, prs }) => {
  const [timeframe, setTimeframe] = useState<'1W' | '1M' | '3M' | 'All'>('1M');
  const [selectedExercise, setSelectedExercise] = useState<string>('Pec Dec Fly');
  const [metricType, setMetricType] = useState<'weight' | '1rm' | 'volume'>('weight');
  const [volumeMode, setVolumeMode] = useState<'weekly' | 'sessions'>('weekly');

  // Collect distinct exercises from history
  const allExerciseNames = Array.from(
    new Set(
      sessions.flatMap((s) => s.exercises.map((e) => e.exerciseName))
    )
  );

  if (!allExerciseNames.includes(selectedExercise) && allExerciseNames.length > 0) {
    allExerciseNames.unshift(selectedExercise);
  }

  // Prepare exercise progression chart data
  const exerciseChartData: { date: string; value: number }[] = [];
  const completed = [...sessions]
    .filter((s) => s.status === 'completed')
    .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime());

  completed.forEach((session) => {
    const ex = session.exercises.find(
      (e) => e.exerciseName.toLowerCase() === selectedExercise.toLowerCase()
    );
    if (ex && ex.sets.length > 0) {
      const dateLabel = new Date(session.startedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });

      let val = 0;
      if (metricType === 'weight') {
        val = Math.max(...ex.sets.map((s) => s.weight));
      } else if (metricType === '1rm') {
        val = Math.max(...ex.sets.map((s) => Math.round(s.weight * (1 + s.reps / 30))));
      } else {
        val = ex.sets.reduce((acc, s) => acc + s.weight * s.reps, 0);
      }

      if (val > 0) {
        exerciseChartData.push({ date: dateLabel, value: val });
      }
    }
  });

  // Volume Bar Chart Data (Weekly or per session)
  const volumeChartData = completed.slice(-5).map((s) => ({
    name: s.name,
    date: new Date(s.startedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    volume: s.totalVolume,
  }));

  // Weekly Volume Comparison Data (Grouped by calendar weeks)
  const generateWeeklyVolumeData = () => {
    const now = new Date();
    const currentMonday = new Date(now);
    const day = currentMonday.getDay();
    const diff = currentMonday.getDate() - day + (day === 0 ? -6 : 1);
    currentMonday.setDate(diff);
    currentMonday.setHours(0, 0, 0, 0);

    const weeks = [];
    const numWeeks = 6;

    for (let i = numWeeks - 1; i >= 0; i--) {
      const weekStart = new Date(currentMonday);
      weekStart.setDate(weekStart.getDate() - i * 7);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const isCurrent = i === 0;
      const isPrevious = i === 1;

      let label = `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
      if (isCurrent) label = 'This Week';
      else if (isPrevious) label = 'Last Week';
      else label = `${i}w ago`;

      const weekSessions = completed.filter((s) => {
        const sTime = new Date(s.completedAt || s.startedAt).getTime();
        return sTime >= weekStart.getTime() && sTime <= weekEnd.getTime();
      });

      const volume = weekSessions.reduce((acc, s) => acc + (s.totalVolume || 0), 0);
      const workouts = weekSessions.length;

      weeks.push({
        label,
        shortLabel: isCurrent ? 'This Wk' : isPrevious ? 'Last Wk' : `${i}w ago`,
        volume,
        workouts,
        isCurrent,
        dateRange: `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
      });
    }

    return weeks;
  };

  const weeklyVolumeData = generateWeeklyVolumeData();
  const thisWeekData = weeklyVolumeData.find((w) => w.isCurrent) || { volume: 0, workouts: 0 };
  const lastWeekData = weeklyVolumeData.find((w) => w.label === 'Last Week') || { volume: 0, workouts: 0 };

  let weeklyChangePercent = 0;
  if (lastWeekData.volume > 0) {
    weeklyChangePercent = Math.round(
      ((thisWeekData.volume - lastWeekData.volume) / lastWeekData.volume) * 100
    );
  } else if (thisWeekData.volume > 0) {
    weeklyChangePercent = 100;
  }

  // Muscle Group Analytics calculation
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

  completed.forEach((s) => {
    s.exercises.forEach((e) => {
      if (muscleCounts[e.muscleGroup] !== undefined) {
        muscleCounts[e.muscleGroup] += e.sets.filter((x) => x.isCompleted).length;
      } else if (e.muscleGroup === 'Arms') {
        const nameLower = e.exerciseName.toLowerCase();
        if (
          nameLower.includes('tricep') ||
          nameLower.includes('dip') ||
          nameLower.includes('pushdown') ||
          nameLower.includes('skull') ||
          nameLower.includes('close-grip') ||
          nameLower.includes('extension')
        ) {
          muscleCounts['Triceps'] += e.sets.filter((x) => x.isCompleted).length;
        } else if (
          nameLower.includes('wrist') ||
          nameLower.includes('farmer') ||
          nameLower.includes('hang')
        ) {
          muscleCounts['Forearms'] += e.sets.filter((x) => x.isCompleted).length;
        } else {
          muscleCounts['Biceps'] += e.sets.filter((x) => x.isCompleted).length;
        }
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

      {/* Timeframe Filter Pills */}
      <div className="flex items-center space-x-1 p-1 rounded-xl bg-zinc-950 border border-zinc-900">
        {(['1W', '1M', '3M', 'All'] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              timeframe === tf
                ? 'bg-white text-black shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* 1. Exercise Progression Chart Card */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-900 p-4 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <select
            value={selectedExercise}
            onChange={(e) => setSelectedExercise(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs font-mono font-semibold text-white focus:outline-none focus:border-zinc-500"
          >
            {allExerciseNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

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

        {/* Chart View */}
        <div className="h-44 w-full pt-2">
          {exerciseChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={exerciseChartData}>
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
              No session data for this exercise yet.
            </div>
          )}
        </div>
      </div>

      {/* 2. Weekly Training Volume Comparison Card */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-900 p-4 space-y-4 shadow-xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                WEEKLY LOAD OVERLOAD
              </span>
              {weeklyChangePercent > 0 ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-white border border-zinc-800 flex items-center gap-1 font-bold">
                  <TrendingUp className="w-3 h-3 text-white" /> +{weeklyChangePercent}% vs Last Wk
                </span>
              ) : weeklyChangePercent < 0 ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3 text-zinc-400" /> {weeklyChangePercent}% vs Last Wk
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800">
                  Matched Last Wk
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white mt-1">This Week vs Previous Weeks</h3>
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              This Week: <span className="text-white font-bold">{thisWeekData.volume.toLocaleString()} kg</span> across {thisWeekData.workouts} workout{thisWeekData.workouts === 1 ? '' : 's'}
            </p>
          </div>

          {/* Toggle View: Weekly vs Session */}
          <div className="flex items-center space-x-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[10px] font-mono">
            <button
              onClick={() => setVolumeMode('weekly')}
              className={`px-2 py-1 rounded transition-colors ${
                volumeMode === 'weekly' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setVolumeMode('sessions')}
              className={`px-2 py-1 rounded transition-colors ${
                volumeMode === 'sessions' ? 'bg-white text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Sessions
            </button>
          </div>
        </div>

        {/* Chart View */}
        <div className="h-44 w-full pt-1">
          {volumeMode === 'weekly' ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyVolumeData}>
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
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl font-mono text-xs text-white space-y-1">
                          <div className="font-bold text-white flex items-center justify-between gap-2">
                            <span>{data.label}</span>
                            {data.isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-white text-black font-bold">CURRENT</span>
                            )}
                          </div>
                          <div className="text-[10px] text-zinc-400">{data.dateRange}</div>
                          <div className="text-white font-bold pt-1">
                            {data.volume.toLocaleString()} kg total
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
                  {weeklyVolumeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isCurrent ? '#ffffff' : '#52525b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeChartData}>
                <XAxis
                  dataKey="name"
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
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09090b',
                    borderColor: '#27272a',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                  }}
                  formatter={(val: any) => [`${val} kg`, 'Total Volume']}
                />
                <Bar dataKey="volume" fill="#ffffff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Legend */}
        {volumeMode === 'weekly' && (
          <div className="flex items-center justify-center space-x-4 pt-1 border-t border-zinc-900 text-[11px] font-mono text-zinc-400">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-white inline-block" />
              <span>This Week</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-zinc-600 inline-block" />
              <span>Previous Weeks</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Muscle Group Analytics Distribution */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-900 p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            MUSCLE GROUP ANALYTICS
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
          Insight: Push & Pull distribution is balanced. Consider adding core work to improve stability.
        </div>
      </div>

      {/* 4. Personal Record (PR) Trophy Wall */}
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
                      ? `${pr.weight} kg × ${pr.reps}`
                      : pr.prType === '1rm'
                      ? `~${pr.prValue} kg 1RM`
                      : `${pr.prValue} kg`}
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
