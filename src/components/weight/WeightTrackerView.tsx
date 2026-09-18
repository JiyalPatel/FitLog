// src/components/weight/WeightTrackerView.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Scale,
  Plus,
  Target,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { WeightEntry, WeightGoal, UserProfile } from '../../types';
import { WeightChart } from './WeightChart';
import { LogWeightModal } from './LogWeightModal';
import { WeightGoalModal } from './WeightGoalModal';
import { ConfirmDialogModal } from '../common/ConfirmDialogModal';

interface WeightTrackerViewProps {
  entries: WeightEntry[];
  goal: WeightGoal | null;
  profile: UserProfile;
  onSaveEntry: (entry: WeightEntry) => void;
  onDeleteEntry: (id: string) => void;
  onSaveGoal: (goal: WeightGoal | null) => void;
}

export const WeightTrackerView: React.FC<WeightTrackerViewProps> = ({
  entries,
  goal,
  profile,
  onSaveEntry,
  onDeleteEntry,
  onSaveGoal,
}) => {
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<WeightEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const weightUnit = profile.weightUnit || 'kg';

  // Sort entries newest first
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const currentWeight = sortedEntries[0]?.weight ?? null;
  const targetWeight = goal?.targetWeight ?? null;

  // Calculate difference to target
  let diffToTarget: number | null = null;
  let isAtTarget = false;
  if (currentWeight !== null && targetWeight !== null) {
    diffToTarget = Math.round(Math.abs(currentWeight - targetWeight) * 10) / 10;
    isAtTarget = diffToTarget === 0;
  }

  const handleOpenLogModal = (entry?: WeightEntry) => {
    setEditingEntry(entry || null);
    setIsLogModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (entryToDelete) {
      onDeleteEntry(entryToDelete);
      setEntryToDelete(null);
    }
  };

  return (
    <div className="flex-1 px-4 py-5 pb-28 space-y-5 overflow-y-auto">
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-zinc-400">
            SIMPLE WEIGHT TRACKER
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white mt-0.5">
            Weight Tracker
          </h2>
        </div>

        <button
          onClick={() => handleOpenLogModal()}
          className="px-3.5 py-2 rounded-xl bg-white text-black font-mono text-xs font-bold tracking-wide flex items-center space-x-1.5 shadow-glow-sm hover:bg-zinc-200 transition-colors uppercase"
        >
          <Plus className="w-4 h-4" />
          <span>ENTER WEIGHT</span>
        </button>
      </div>

      {/* 2. Target Weight & Current Weight Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Current Weight Card */}
        <div
          onClick={() => handleOpenLogModal()}
          className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-colors cursor-pointer flex flex-col justify-between shadow-lg"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">
              Current Weight
            </span>
            <Scale className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-2.5">
            <div className="text-3xl font-extrabold font-mono text-white">
              {currentWeight !== null ? currentWeight : '--'}
              <span className="text-xs font-mono text-zinc-400 ml-1 font-semibold uppercase">
                {weightUnit}
              </span>
            </div>
            <p className="text-[11px] font-mono text-zinc-500 mt-1">
              {sortedEntries[0]
                ? new Date(sortedEntries[0].date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Tap to enter'}
            </p>
          </div>
        </div>

        {/* Target Weight Card */}
        <div
          onClick={() => setIsGoalModalOpen(true)}
          className="p-4 rounded-2xl bg-zinc-950 border border-zinc-900 hover:border-zinc-800 transition-colors cursor-pointer flex flex-col justify-between shadow-lg"
        >
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-mono uppercase tracking-wider">
              Target Weight
            </span>
            <Target className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="mt-2.5">
            <div className="text-3xl font-extrabold font-mono text-white">
              {targetWeight !== null ? targetWeight : '--'}
              <span className="text-xs font-mono text-zinc-400 ml-1 font-semibold uppercase">
                {weightUnit}
              </span>
            </div>
            <p className="text-[11px] font-mono text-zinc-500 mt-1">
              {targetWeight !== null ? 'Tap to edit target' : 'Tap to set target'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Status Banner */}
      {currentWeight !== null && targetWeight !== null && (
        <div className="px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2">
            {isAtTarget ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Target className="w-4 h-4 text-zinc-400" />
            )}
            <span className="text-zinc-300">
              {isAtTarget
                ? 'Target reached! Congratulations! 🎉'
                : `${diffToTarget} ${weightUnit} ${
                    currentWeight > targetWeight ? 'to lose to reach target' : 'to gain to reach target'
                  }`}
            </span>
          </div>
          <button
            onClick={() => setIsGoalModalOpen(true)}
            className="text-[11px] text-zinc-500 hover:text-white transition-colors"
          >
            Change
          </button>
        </div>
      )}

      {/* 3. Visual Analysis Chart */}
      <WeightChart
        entries={entries}
        targetWeight={targetWeight}
        weightUnit={weightUnit}
      />

      {/* 4. Weight Entries History */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            WEIGHT LOGS
          </span>
          <span className="text-xs font-mono text-zinc-500">
            {sortedEntries.length} {sortedEntries.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>

        {sortedEntries.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-zinc-950 border border-zinc-900 space-y-2">
            <Scale className="w-8 h-8 text-zinc-700 mx-auto mb-1" />
            <div className="text-sm font-semibold text-zinc-300">No Weight Entered Yet</div>
            <p className="text-xs font-mono text-zinc-500 max-w-xs mx-auto">
              Tap "ENTER WEIGHT" above whenever you weigh yourself to see your progress on the graph.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedEntries.map((entry, idx) => {
              const prev = sortedEntries[idx + 1];
              const diff = prev ? Math.round((entry.weight - prev.weight) * 10) / 10 : null;

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-between shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center justify-center text-xs font-mono text-zinc-400 font-bold">
                      #{sortedEntries.length - idx}
                    </div>
                    <div>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-base font-bold font-mono text-white">
                          {entry.weight} {weightUnit}
                        </span>
                        {diff !== null && (
                          <span
                            className={`text-xs font-mono ${
                              diff < 0
                                ? 'text-emerald-400'
                                : diff > 0
                                ? 'text-amber-400'
                                : 'text-zinc-500'
                            }`}
                          >
                            {diff > 0 ? `+${diff}` : diff}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        {new Date(entry.date).toLocaleDateString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenLogModal(entry)}
                      className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setEntryToDelete(entry.id)}
                      className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-900 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log Weight Modal */}
      <LogWeightModal
        isOpen={isLogModalOpen}
        onClose={() => {
          setIsLogModalOpen(false);
          setEditingEntry(null);
        }}
        onSave={onSaveEntry}
        initialEntry={editingEntry}
        defaultWeight={currentWeight || 70.0}
        weightUnit={weightUnit}
      />

      {/* Target Weight Modal */}
      <WeightGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={onSaveGoal}
        currentGoal={goal}
        currentWeight={currentWeight}
        weightUnit={weightUnit}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialogModal
        isOpen={Boolean(entryToDelete)}
        title="Delete Weight Entry?"
        message="Are you sure you want to delete this weight log?"
        confirmLabel="DELETE"
        cancelLabel="CANCEL"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setEntryToDelete(null)}
      />
    </div>
  );
};
