// src/components/weight/WeightChart.tsx
import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { WeightEntry } from '../../types';

interface WeightChartProps {
  entries: WeightEntry[];
  targetWeight?: number | null;
  weightUnit: 'kg' | 'lbs';
}

export const WeightChart: React.FC<WeightChartProps> = ({
  entries,
  targetWeight,
  weightUnit,
}) => {
  // Sort entries ascending by date for chronological visualization
  const sortedData = [...entries]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((e) => {
      const d = new Date(e.date);
      const displayDate = d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      return {
        id: e.id,
        date: e.date,
        displayDate,
        weight: Math.round(e.weight * 10) / 10,
      };
    });

  // Calculate suitable Y-axis bounds
  const allValues: number[] = sortedData.map((d) => d.weight);
  if (targetWeight) {
    allValues.push(targetWeight);
  }

  const minY = allValues.length > 0 ? Math.floor(Math.min(...allValues) - 2) : 50;
  const maxY = allValues.length > 0 ? Math.ceil(Math.max(...allValues) + 2) : 100;

  return (
    <div className="rounded-2xl bg-zinc-950 border border-zinc-900 p-4 space-y-3 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            VISUAL ANALYSIS
          </span>
          <h3 className="text-base font-bold text-white tracking-tight">
            Weight Over Time
          </h3>
        </div>
        {targetWeight && (
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
            Target: <strong className="text-white">{targetWeight} {weightUnit}</strong>
          </span>
        )}
      </div>

      {/* Chart Canvas */}
      <div className="h-56 w-full pt-2">
        {sortedData.length >= 2 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={sortedData}
              margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
            >
              <XAxis
                dataKey="displayDate"
                stroke="#52525b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#27272a' }}
              />
              <YAxis
                stroke="#52525b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#27272a' }}
                domain={[minY, maxY]}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 shadow-2xl font-mono text-xs text-white space-y-1">
                        <div className="text-[10px] text-zinc-400">
                          {new Date(data.date).toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-base font-bold text-white flex items-baseline gap-1">
                          <span>{data.weight}</span>
                          <span className="text-xs text-zinc-400 font-normal">{weightUnit}</span>
                        </div>
                        {targetWeight && (
                          <div className="text-[10px] text-zinc-400 pt-1 border-t border-zinc-900">
                            {data.weight === targetWeight ? (
                              <span className="text-emerald-400 font-semibold">At target weight!</span>
                            ) : (
                              <span>
                                {Math.abs(Math.round((data.weight - targetWeight) * 10) / 10)} {weightUnit}{' '}
                                {data.weight > targetWeight ? 'above' : 'below'} target
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />

              {/* Target Weight Dashed Reference Line */}
              {targetWeight && (
                <ReferenceLine
                  y={targetWeight}
                  stroke="#a1a1aa"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Target (${targetWeight} ${weightUnit})`,
                    fill: '#d4d4d8',
                    fontSize: 10,
                    position: 'insideTopRight',
                    fontFamily: 'monospace',
                  }}
                />
              )}

              {/* User's Actual Weight Progress Line */}
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#ffffff"
                strokeWidth={2.5}
                dot={{ fill: '#ffffff', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#ffffff', stroke: '#000000', strokeWidth: 2 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : sortedData.length === 1 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="text-3xl font-bold font-mono text-white mb-1">
              {sortedData[0].weight} {weightUnit}
            </div>
            <p className="text-xs font-mono text-zinc-400 max-w-xs mt-1">
              1 check-in logged ({sortedData[0].displayDate}). Enter another weight entry whenever you want to see your progress graph!
            </p>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-xs font-mono text-zinc-500">
            No weight entries logged yet. Tap "Enter Weight" below to start.
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-5 pt-2 border-t border-zinc-900 text-[11px] font-mono text-zinc-400">
        <div className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-white inline-block" />
          <span>Your Weight</span>
        </div>
        {targetWeight && (
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-0.5 border-t border-dashed border-zinc-400 inline-block" />
            <span>Target ({targetWeight} {weightUnit})</span>
          </div>
        )}
      </div>
    </div>
  );
};
