// src/services/engine/weightEngine.ts
import { WeightEntry, WeightGoal } from '../../types';

export type WeightTimeframe = '1W' | '1M' | '3M' | '6M' | '1Y' | 'All';

export interface WeightChartPoint {
  id?: string;
  date: string;
  displayDate: string;
  weight: number;
  movingAvg: number | null;
  notes?: string;
}

export interface WeightStats {
  currentWeight: number | null;
  latestDate: string | null;
  startWeight: number | null;
  totalChange: number;
  totalChangePercent: number;
  weeklyRate: number; // kg or lbs per week
  sevenDayAverage: number | null;
  minWeight: number | null;
  maxWeight: number | null;
  goalProgress: {
    targetWeight: number;
    startWeight: number;
    currentWeight: number;
    remaining: number;
    percent: number;
    isCompleted: boolean;
    goalType: 'lose' | 'gain' | 'maintain';
  } | null;
}

/**
 * Filter entries by the selected timeframe
 */
export function filterEntriesByTimeframe(
  entries: WeightEntry[],
  timeframe: WeightTimeframe
): WeightEntry[] {
  if (timeframe === 'All' || entries.length === 0) {
    return entries;
  }

  const now = new Date();
  let daysCutoff = 30;

  switch (timeframe) {
    case '1W':
      daysCutoff = 7;
      break;
    case '1M':
      daysCutoff = 30;
      break;
    case '3M':
      daysCutoff = 90;
      break;
    case '6M':
      daysCutoff = 180;
      break;
    case '1Y':
      daysCutoff = 365;
      break;
  }

  const cutoffTime = now.getTime() - daysCutoff * 24 * 60 * 60 * 1000;
  return entries.filter((e) => new Date(e.date).getTime() >= cutoffTime);
}

/**
 * Prepare chart data with 7-day moving average and chronological order
 */
export function prepareWeightChartData(
  entries: WeightEntry[],
  timeframe: WeightTimeframe = '1M'
): WeightChartPoint[] {
  if (!entries || entries.length === 0) return [];

  // Sort ascending chronologically
  const sortedAsc = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Compute 7-day moving average for each entry
  const fullChartData: WeightChartPoint[] = sortedAsc.map((entry, index) => {
    // Window of up to 7 days ending at current entry's date
    const currentDate = new Date(entry.date).getTime();
    const sevenDaysPrior = currentDate - 7 * 24 * 60 * 60 * 1000;

    const windowEntries = sortedAsc
      .slice(0, index + 1)
      .filter((e) => {
        const t = new Date(e.date).getTime();
        return t >= sevenDaysPrior && t <= currentDate;
      });

    let movingAvg: number | null = null;
    if (windowEntries.length >= 2 || index === 0) {
      const sum = windowEntries.reduce((acc, curr) => acc + curr.weight, 0);
      movingAvg = Math.round((sum / windowEntries.length) * 10) / 10;
    }

    const d = new Date(entry.date);
    const displayDate = d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

    return {
      id: entry.id,
      date: entry.date,
      displayDate,
      weight: Math.round(entry.weight * 10) / 10,
      movingAvg,
      notes: entry.notes,
    };
  });

  // Filter according to timeframe
  if (timeframe === 'All') {
    return fullChartData;
  }

  const filteredRaw = filterEntriesByTimeframe(entries, timeframe);
  const allowedDates = new Set(filteredRaw.map((e) => e.date));

  return fullChartData.filter((pt) => allowedDates.has(pt.date));
}

/**
 * Calculate core athlete weight statistics
 */
export function calculateWeightStats(
  entries: WeightEntry[],
  goal?: WeightGoal | null
): WeightStats {
  if (!entries || entries.length === 0) {
    return {
      currentWeight: null,
      latestDate: null,
      startWeight: null,
      totalChange: 0,
      totalChangePercent: 0,
      weeklyRate: 0,
      sevenDayAverage: null,
      minWeight: null,
      maxWeight: null,
      goalProgress: null,
    };
  }

  // Sorted latest first
  const sortedDesc = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const latest = sortedDesc[0];
  const oldest = sortedDesc[sortedDesc.length - 1];

  const currentWeight = Math.round(latest.weight * 10) / 10;
  const startWeight = Math.round(oldest.weight * 10) / 10;
  const totalChange = Math.round((currentWeight - startWeight) * 10) / 10;
  const totalChangePercent =
    startWeight > 0 ? Math.round(((currentWeight - startWeight) / startWeight) * 1000) / 10 : 0;

  // 7-day average of recent entries
  const now = new Date(latest.date).getTime();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const recentWeekEntries = sortedDesc.filter(
    (e) => new Date(e.date).getTime() >= sevenDaysAgo
  );

  const sevenDayAverage =
    recentWeekEntries.length > 0
      ? Math.round(
          (recentWeekEntries.reduce((acc, e) => acc + e.weight, 0) / recentWeekEntries.length) * 10
        ) / 10
      : currentWeight;

  // Weekly Rate: Difference over days between first and last, normalized to 7 days
  let weeklyRate = 0;
  const daysDiff = Math.max(
    1,
    Math.round((now - new Date(oldest.date).getTime()) / (1000 * 60 * 60 * 24))
  );

  if (daysDiff >= 7) {
    weeklyRate = Math.round((totalChange / daysDiff) * 7 * 10) / 10;
  } else if (sortedDesc.length >= 2) {
    const prev = sortedDesc[1];
    const dDays = Math.max(
      1,
      Math.round((now - new Date(prev.date).getTime()) / (1000 * 60 * 60 * 24))
    );
    weeklyRate = Math.round(((currentWeight - prev.weight) / dDays) * 7 * 10) / 10;
  }

  // Min and Max
  const allWeights = entries.map((e) => e.weight);
  const minWeight = Math.min(...allWeights);
  const maxWeight = Math.max(...allWeights);

  // Goal Progress Calculation
  let goalProgress = null;
  if (goal && goal.targetWeight) {
    const baseWeight = goal.startWeight || startWeight;
    const target = goal.targetWeight;
    const goalType = goal.goalType;

    let percent = 0;
    const totalDistance = Math.abs(target - baseWeight);

    if (totalDistance > 0) {
      if (goalType === 'lose') {
        const lost = baseWeight - currentWeight;
        percent = Math.min(100, Math.max(0, Math.round((lost / totalDistance) * 100)));
      } else if (goalType === 'gain') {
        const gained = currentWeight - baseWeight;
        percent = Math.min(100, Math.max(0, Math.round((gained / totalDistance) * 100)));
      } else {
        // Maintain
        const diff = Math.abs(currentWeight - target);
        percent = diff <= 1.0 ? 100 : Math.max(0, 100 - Math.round(diff * 20));
      }
    }

    const remaining = Math.round(Math.abs(target - currentWeight) * 10) / 10;
    const isCompleted =
      (goalType === 'lose' && currentWeight <= target) ||
      (goalType === 'gain' && currentWeight >= target) ||
      (goalType === 'maintain' && Math.abs(currentWeight - target) <= 0.5);

    goalProgress = {
      targetWeight: target,
      startWeight: baseWeight,
      currentWeight,
      remaining,
      percent,
      isCompleted,
      goalType,
    };
  }

  return {
    currentWeight,
    latestDate: latest.date,
    startWeight,
    totalChange,
    totalChangePercent,
    weeklyRate,
    sevenDayAverage,
    minWeight,
    maxWeight,
    goalProgress,
  };
}
