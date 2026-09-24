import React, { useState } from 'react';
import { 
  Play, 
  Flame, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  ChevronRight, 
  Clock, 
  Sparkles, 
  Moon, 
  CheckCircle2, 
  SkipForward, 
  Scale, 
  Plus, 
  Activity 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Routine, WorkoutSession, PersonalRecord, ProgressiveOverloadTip, WeeklySummaryStats, WeightEntry, WeightGoal } from '../../types';
import { getNextWorkoutQueue, getUpcomingQueue } from '../../services/engine/rollingQueue';
import { calculateWeightStats } from '../../services/engine/weightEngine';

interface DashboardViewProps {
  routine: Routine;
  recentSessions: WorkoutSession[];
  prs: PersonalRecord[];
  streak: number;
  weeklyStats: WeeklySummaryStats;
  overloadTips: ProgressiveOverloadTip[];
  weightEntries?: WeightEntry[];
  weightGoal?: WeightGoal | null;
  weightUnit?: 'kg' | 'lbs';
  onStartWorkout: (routineDayId: string) => void;
  onCompleteRestDay?: () => void;
  onSkipRestDay?: () => void;
  onViewProgress: () => void;
  onViewRoutine: () => void;
  onViewWeight?: () => void;
  onQuickLogWeight?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  routine,
  recentSessions,
  prs,
  streak,
  weeklyStats,
  overloadTips,
  weightEntries = [],
  weightGoal = null,
  weightUnit = 'kg',
  onStartWorkout,
  onCompleteRestDay,
  onSkipRestDay,
  onViewProgress,
  onViewRoutine,
  onViewWeight,
  onQuickLogWeight,
}) => {
  const [homeVolumeMode, setHomeVolumeMode] = useState<'daily' | 'trend'>('daily');
  const lastSession = recentSessions[0];
  const nextQueue = getNextWorkoutQueue(routine, lastSession);
  const upcomingList = getUpcomingQueue(routine, 4);
  const weightStats = calculateWeightStats(weightEntries, weightGoal);

  // Calculate This Week's Volume Performance Data (Monday to Sunday)
  const completed = recentSessions.filter((s) => s.status === 'completed');

  const now = new Date();
  const currentMonday = new Date(now);
  const day = currentMonday.getDay();
  const diff = currentMonday.getDate() - day + (day === 0 ? -6 : 1);
  currentMonday.setDate(diff);
  currentMonday.setHours(0, 0, 0, 0);

  const lastWeekMonday = new Date(currentMonday);
  lastWeekMonday.setDate(lastWeekMonday.getDate() - 7);
  const lastWeekSunday = new Date(currentMonday);
  lastWeekSunday.setMilliseconds(-1);

  const lastWeekSessions = completed.filter((s) => {
    const t = new Date(s.completedAt || s.startedAt).getTime();
    return t >= lastWeekMonday.getTime() && t <= lastWeekSunday.getTime();
  });
  const lastWeekTotalVolume = lastWeekSessions.reduce((acc, s) => acc + (s.totalVolume || 0), 0);

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  let runningVolume = 0;
  let thisWeekTotalVolume = 0;
  let workoutsThisWeek = 0;

  const thisWeekDailyPoints = dayNames.map((name, index) => {
    const dayDate = new Date(currentMonday);
    dayDate.setDate(dayDate.getDate() + index);
    const startOfDay = new Date(dayDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dayDate);
    endOfDay.setHours(23, 59, 59, 999);

    const matchingSessions = completed.filter((s) => {
      const t = new Date(s.completedAt || s.startedAt).getTime();
      return t >= startOfDay.getTime() && t <= endOfDay.getTime();
    });

    const dayVol = matchingSessions.reduce((acc, s) => acc + (s.totalVolume || 0), 0);
    thisWeekTotalVolume += dayVol;
    workoutsThisWeek += matchingSessions.length;
    runningVolume += dayVol;

    const isToday = now.toDateString() === dayDate.toDateString();
    const isFuture = dayDate > now && !isToday;
    const isPast = dayDate <= now;

    return {
      day: name,
      dateLabel: dayDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      volume: isFuture ? null : dayVol,
      rawVolume: dayVol,
      cumulativeVolume: isFuture ? null : runningVolume,
      workouts: matchingSessions.length,
      sessionNames: matchingSessions.map((s) => s.name).join(', '),
      isToday,
      isPast,
      isFuture,
    };
  });

  let volumeChangePercent = 0;
  if (lastWeekTotalVolume > 0) {
    volumeChangePercent = Math.round(
      ((thisWeekTotalVolume - lastWeekTotalVolume) / lastWeekTotalVolume) * 100
    );
  } else if (thisWeekTotalVolume > 0) {
    volumeChangePercent = 100;
  }

  // 6-week trend data
  const multiWeekTrend = [];
  for (let i = 5; i >= 0; i--) {
    const wStart = new Date(currentMonday);
    wStart.setDate(wStart.getDate() - i * 7);
    const wEnd = new Date(wStart);
    wEnd.setDate(wEnd.getDate() + 6);
    wEnd.setHours(23, 59, 59, 999);

    const wSessions = completed.filter((s) => {
      const t = new Date(s.completedAt || s.startedAt).getTime();
      return t >= wStart.getTime() && t <= wEnd.getTime();
    });

    const vol = wSessions.reduce((acc, s) => acc + (s.totalVolume || 0), 0);
    const label = i === 0 ? 'This Wk' : i === 1 ? 'Last Wk' : `${i}w ago`;

    multiWeekTrend.push({
      weekLabel: label,
      volume: vol,
      workouts: wSessions.length,
      isCurrent: i === 0,
    });
  }

  return (
    <div className="flex-1 px-4 py-5 pb-24 space-y-6 overflow-y-auto">
      {/* 1. Rolling Queue Next Workout Hero Card */}
      {nextQueue ? (
        nextQueue.routineDay.isRestDay ? (
          /* REST DAY HERO CARD */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800 p-5 shadow-2xl"
          >
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            <div className="mb-4 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-300">
              <Moon className="w-3.5 h-3.5 text-zinc-300" />
              <span>SCHEDULED REST & RECOVERY</span>
            </div>

            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs font-mono tracking-wider uppercase text-zinc-400">
                  Day #{nextQueue.queueIndex + 1}
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-white mt-0.5">
                  {nextQueue.routineDay.name}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-zinc-400">No Workout</span>
                <span className="block text-[11px] font-mono text-zinc-500">Recovery Focus</span>
              </div>
            </div>

            {/* Recovery Focus Pillars */}
            <div className="mt-4 pt-3 border-t border-zinc-900 grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-850">
                <div className="text-xs font-bold text-white font-mono">8+ Hrs</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Sleep</div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-850">
                <div className="text-xs font-bold text-white font-mono">3.0 L</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Hydration</div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-850">
                <div className="text-xs font-bold text-white font-mono">High</div>
                <div className="text-[10px] text-zinc-500 font-mono mt-0.5">Protein</div>
              </div>
            </div>

            <p className="mt-3 text-xs text-zinc-400 font-mono leading-relaxed">
              Muscles rebuild and grow during rest periods. Take time to nourish your body and recharge your CNS.
            </p>

            {/* Rest Day Actions */}
            <div className="mt-5 space-y-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onCompleteRestDay}
                className="w-full py-3.5 px-4 bg-white text-black font-semibold rounded-xl flex items-center justify-center space-x-2 text-sm tracking-wide shadow-glow-sm hover:bg-zinc-100 transition-colors uppercase font-mono"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>MARK REST DAY COMPLETED</span>
              </motion.button>

              <button
                onClick={onSkipRestDay}
                className="w-full py-2.5 px-4 bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-xs rounded-xl hover:text-white hover:border-zinc-700 transition-colors flex items-center justify-center space-x-1.5"
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>Skip to Next Workout</span>
              </button>
            </div>
          </motion.div>
        ) : (
          /* REGULAR WORKOUT HERO CARD */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl bg-zinc-950 border border-zinc-800 p-5 shadow-2xl"
          >
            {/* Subtle Ambient Glow */}
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            {/* Pending / Rolling Status Banner */}
            {nextQueue.isPending ? (
              <div className="mb-4 inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-200">
                <AlertCircle className="w-3.5 h-3.5 text-white animate-pulse" />
                <span>{nextQueue.scheduledLabel}</span>
                <span className="text-[10px] text-zinc-400">· ROLLING FORWARD</span>
              </div>
            ) : (
              <div className="mb-4 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                <span>NEXT IN SEQUENCE</span>
              </div>
            )}

            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs font-mono tracking-wider uppercase text-zinc-400">Workout #{nextQueue.queueIndex + 1}</span>
                <h2 className="text-3xl font-bold tracking-tight text-white mt-0.5">
                  {nextQueue.routineDay.name}
                </h2>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-zinc-400 flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3" /> ~{nextQueue.routineDay.estimatedMinutes}m
                </span>
                <span className="text-xs font-mono text-zinc-500">
                  {nextQueue.routineDay.exercises.length} exercises
                </span>
              </div>
            </div>

            {/* Planned Exercises Preview */}
            <div className="mt-4 pt-3 border-t border-zinc-900 flex flex-wrap gap-1.5">
              {nextQueue.routineDay.exercises.slice(0, 4).map((ex) => (
                <span
                  key={ex.id}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-zinc-900/90 text-zinc-300 border border-zinc-800/80 font-mono"
                >
                  {ex.name}
                </span>
              ))}
              {nextQueue.routineDay.exercises.length > 4 && (
                <span className="text-[11px] px-2 py-1 rounded-md bg-zinc-900/60 text-zinc-500 font-mono">
                  +{nextQueue.routineDay.exercises.length - 4} more
                </span>
              )}
            </div>

            {/* Start CTA Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => onStartWorkout(nextQueue.routineDay.id)}
              className="mt-5 w-full py-3.5 px-4 bg-white text-black font-semibold rounded-xl flex items-center justify-center space-x-2 text-sm tracking-wide shadow-glow-sm hover:bg-zinc-100 transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>START WORKOUT</span>
            </motion.button>
          </motion.div>
        )
      ) : null}

      {/* 2. Consistency & Streak Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Streak */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-mono uppercase tracking-wider">Streak</span>
            <Flame className="w-4 h-4 text-white" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white">
              {streak} <span className="text-xs font-normal text-zinc-400">{streak === 1 ? 'day' : 'days'}</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {streak > 0 ? `${streak} day${streak === 1 ? '' : 's'} in a row` : 'Ready to begin'}
            </p>
          </div>
        </div>

        {/* Weekly Consistency */}
        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-900 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-mono uppercase tracking-wider">This Week</span>
            <TrendingUp className="w-4 h-4 text-white" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-white">
              {weeklyStats.consistencyPercentage}%
            </div>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${weeklyStats.consistencyPercentage}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-500 mt-1.5 font-mono">
              {weeklyStats.workoutsCompleted} / {weeklyStats.targetWorkouts} completed
            </p>
          </div>
        </div>
      </div>

      {/* 2.2 Weekly Performance Volume Line Graph Card */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-900 p-4 space-y-3 shadow-xl">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 whitespace-nowrap">
              <Activity className="w-3.5 h-3.5 text-white" />
              WEEKLY VOLUME
            </span>
            {volumeChangePercent > 0 ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-white border border-zinc-800 flex items-center gap-1 font-bold shrink-0">
                <TrendingUp className="w-3 h-3 text-white" /> +{volumeChangePercent}%
              </span>
            ) : volumeChangePercent < 0 ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 flex items-center gap-1 shrink-0">
                <TrendingDown className="w-3 h-3 text-zinc-400" /> {volumeChangePercent}%
              </span>
            ) : null}
          </div>

          <div className="flex items-center space-x-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[10px] font-mono shrink-0">
            <button
              onClick={() => setHomeVolumeMode('daily')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                homeVolumeMode === 'daily'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setHomeVolumeMode('trend')}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                homeVolumeMode === 'trend'
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              6-Wk Trend
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold font-mono text-white">
              {thisWeekTotalVolume.toLocaleString()}
            </span>
            <span className="text-xs font-mono text-zinc-400 uppercase font-semibold">
              {weightUnit} this week
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
            {workoutsThisWeek} workout{workoutsThisWeek === 1 ? '' : 's'} logged · Last week: {lastWeekTotalVolume.toLocaleString()} {weightUnit}
          </p>
        </div>

        {/* Line Chart */}
        <div className="h-44 w-full pt-1">
          <ResponsiveContainer width="100%" height="100%">
            {homeVolumeMode === 'daily' ? (
              <AreaChart data={thisWeekDailyPoints}>
                <defs>
                  <linearGradient id="homeVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
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
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      if (data.isFuture) {
                        return (
                          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl font-mono text-xs text-white space-y-1">
                            <div className="font-bold flex items-center justify-between gap-3 text-zinc-400">
                              <span>
                                {data.day} ({data.dateLabel})
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800 font-bold">
                                UPCOMING
                              </span>
                            </div>
                            <div className="text-zinc-500 text-[11px] pt-0.5">
                              Upcoming Day
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl font-mono text-xs text-white space-y-1">
                          <div className="font-bold flex items-center justify-between gap-3">
                            <span>
                              {data.day} ({data.dateLabel})
                            </span>
                            {data.isToday && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-white text-black font-bold">
                                TODAY
                              </span>
                            )}
                          </div>
                          <div className="text-white font-bold pt-0.5">
                            {data.volume > 0
                              ? `${data.volume.toLocaleString()} ${weightUnit}`
                              : 'Rest / No workouts'}
                          </div>
                          {data.sessionNames && (
                            <div className="text-[10px] text-zinc-400 truncate max-w-[180px]">
                              {data.sessionNames}
                            </div>
                          )}
                          <div className="text-[9px] text-zinc-500 pt-0.5 border-t border-zinc-900">
                            Cumulative: {data.cumulativeVolume?.toLocaleString() || '0'} {weightUnit}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#ffffff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#homeVolumeGrad)"
                  connectNulls={false}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    if (!payload || payload.isFuture || payload.volume === null) return null;
                    if (payload.volume === 0) {
                      return <circle key={`dot-h-${props.index}`} cx={cx} cy={cy} r={2} fill="#3f3f46" />;
                    }
                    return <circle key={`dot-h-${props.index}`} cx={cx} cy={cy} r={3.5} fill="#ffffff" stroke="#000000" strokeWidth={1.5} />;
                  }}
                  activeDot={{ r: 5, fill: '#ffffff', stroke: '#000000', strokeWidth: 2 }}
                />
              </AreaChart>
            ) : (
              <AreaChart data={multiWeekTrend}>
                <defs>
                  <linearGradient id="homeTrendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="weekLabel"
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
                  tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : `${val}`)}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-xl font-mono text-xs text-white space-y-1">
                          <div className="font-bold flex items-center justify-between gap-3">
                            <span>{data.weekLabel}</span>
                            {data.isCurrent && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-white text-black font-bold">
                                CURRENT
                              </span>
                            )}
                          </div>
                          <div className="text-white font-bold pt-0.5">
                            {data.volume.toLocaleString()} {weightUnit}
                          </div>
                          <div className="text-[10px] text-zinc-400">
                            {data.workouts} workout{data.workouts === 1 ? '' : 's'}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#ffffff"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#homeTrendGrad)"
                  dot={{ fill: '#ffffff', strokeWidth: 1.5, r: 3 }}
                  activeDot={{ r: 5, fill: '#ffffff', stroke: '#000000', strokeWidth: 2 }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Quick Footer Link to Analytics */}
        <div className="pt-2 border-t border-zinc-900 flex items-center justify-between">
          <span className="text-[10px] font-mono text-zinc-500">
            {thisWeekTotalVolume > 0
              ? 'Progressive load tracking active'
              : 'Log your first workout this week to trace your curve'}
          </span>
          <button
            onClick={onViewProgress}
            className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <span>Compare in Analytics</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 2.5 Body Weight Progress Quick-Card */}
      <div className="rounded-2xl bg-zinc-950 border border-zinc-900 p-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-zinc-400" />
              Body Weight
            </span>
            {weightStats.totalChange !== 0 && weightEntries.length > 1 && (
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  weightStats.totalChange < 0
                    ? 'bg-zinc-900 text-emerald-400 border-emerald-500/20'
                    : 'bg-zinc-900 text-amber-400 border-amber-500/20'
                }`}
              >
                {weightStats.totalChange > 0 ? `+${weightStats.totalChange}` : weightStats.totalChange} {weightUnit}
              </span>
            )}
          </div>
          <button
            onClick={onViewWeight}
            className="text-xs text-zinc-400 hover:text-white flex items-center font-mono transition-colors"
          >
            Track <ChevronRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>

        <div className="flex items-end justify-between mt-3">
          <div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold font-mono text-white">
                {weightStats.currentWeight !== null ? weightStats.currentWeight : '--'}
              </span>
              <span className="text-xs font-mono text-zinc-400 uppercase font-semibold">
                {weightUnit}
              </span>
            </div>
            <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
              {weightGoal?.targetWeight
                ? `Target: ${weightGoal.targetWeight} ${weightUnit}`
                : weightStats.currentWeight !== null
                ? 'Current weight'
                : 'No weight entered yet'}
            </p>
          </div>

          <button
            onClick={onQuickLogWeight || onViewWeight}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-white hover:border-zinc-700 transition-colors flex items-center space-x-1.5 font-bold uppercase"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Enter Weight</span>
          </button>
        </div>
      </div>

      {/* 3. Rolling Sequence Queue Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
            Sequential Routine Queue
          </h3>
          <button
            onClick={onViewRoutine}
            className="text-xs text-zinc-400 hover:text-white flex items-center font-mono"
          >
            Edit <ChevronRight className="w-3 h-3 ml-0.5" />
          </button>
        </div>

        <div className="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {upcomingList.map((day, idx) => {
            const isCurrent = idx === 0;
            return (
              <div
                key={`${day.id}-${idx}`}
                className={`min-w-[130px] flex-shrink-0 p-3 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-zinc-900/90 border-white/40 shadow-glow-sm'
                    : 'bg-zinc-950/60 border-zinc-900 text-zinc-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono tracking-wide uppercase">
                    {isCurrent ? 'Up Next' : `+${idx} days`}
                  </span>
                  {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                </div>
                <div className={`font-semibold text-sm ${isCurrent ? 'text-white' : 'text-zinc-300'}`}>
                  {day.name}
                </div>
                <div className="text-[11px] text-zinc-500 mt-1 font-mono">
                  {day.isRestDay ? (
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Moon className="w-3 h-3 text-zinc-400" /> Rest Day
                    </span>
                  ) : (
                    `${day.exercises.length} exercises`
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Progressive Overload Smart Suggestion */}
      {overloadTips.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 relative overflow-hidden"
        >
          <div className="flex items-start space-x-3">
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono tracking-wide uppercase px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 border border-zinc-800">
                  PROGRESSIVE OVERLOAD TIP
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white mt-1.5">
                {overloadTips[0].exerciseName}
              </h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                {overloadTips[0].suggestion}
              </p>
              <div className="mt-2 text-[10px] font-mono text-zinc-500">
                Performance: {overloadTips[0].currentPerformance}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 5. Recent Personal Records Carousel */}
      {prs.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-white" /> Personal Records
            </h3>
            <button
              onClick={onViewProgress}
              className="text-xs text-zinc-400 hover:text-white flex items-center font-mono"
            >
              View All <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          <div className="space-y-2">
            {prs.slice(0, 3).map((pr) => (
              <div
                key={pr.id}
                className="p-3 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-between hover:border-zinc-800 transition-colors"
              >
                <div>
                  <div className="text-sm font-medium text-white">{pr.exerciseName}</div>
                  <div className="text-xs text-zinc-500 font-mono mt-0.5">
                    {new Date(pr.achievedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-white">
                    {pr.prType === 'weight'
                      ? `${pr.weight} kg × ${pr.reps}`
                      : pr.prType === '1rm'
                      ? `~${pr.prValue} kg (1RM)`
                      : `${pr.prValue} kg vol`}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase">
                    {pr.prType} PR
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
