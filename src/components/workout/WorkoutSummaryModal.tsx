// src/components/workout/WorkoutSummaryModal.tsx
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Award, Clock, Flame, Dumbbell, TrendingUp, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { WorkoutSession, WorkoutSession as SessionType } from '../../types';
import { calculateWorkoutScore, calculateBestImprovement } from '../../services/engine/scoringEngine';

interface WorkoutSummaryModalProps {
  session: WorkoutSession;
  previousSessions: SessionType[];
  onClose: () => void;
}

export const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  session,
  previousSessions,
  onClose,
}) => {
  const scoreBreakdown = calculateWorkoutScore(session, previousSessions);
  const bestImprovement = calculateBestImprovement(session, previousSessions);

  useEffect(() => {
    // Monochrome celebration confetti (white, silver, slate particles)
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffffff', '#e4e4e7', '#a1a1aa', '#71717a'],
    });
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    return `${mins} min`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl space-y-6 text-white text-center relative overflow-hidden"
      >
        {/* Glow Header */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        {/* Celebration Title */}
        <div>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white text-black mb-3 shadow-glow-sm">
            <Award className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Workout Complete</h2>
          <p className="text-xs font-mono text-zinc-400 mt-1 uppercase tracking-wider">
            {session.name} Session
          </p>
        </div>

        {/* Workout Score Badge (0 - 100) */}
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <span className="text-[10px] font-mono text-zinc-400 tracking-wider uppercase">
            SESSION SCORE
          </span>
          <div className="text-4xl font-black font-mono text-white tracking-tight mt-1">
            {scoreBreakdown.totalScore}
            <span className="text-lg text-zinc-500 font-normal"> / 100</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
            {scoreBreakdown.summaryNotes.map((note, idx) => (
              <span
                key={idx}
                className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-950 text-zinc-300 border border-zinc-800"
              >
                {note}
              </span>
            ))}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <Clock className="w-4 h-4 text-zinc-400 mx-auto mb-1" />
            <div className="text-sm font-bold font-mono text-white">
              {formatDuration(session.durationSeconds)}
            </div>
            <div className="text-[10px] font-mono text-zinc-500">Duration</div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <Dumbbell className="w-4 h-4 text-zinc-400 mx-auto mb-1" />
            <div className="text-sm font-bold font-mono text-white">
              {session.totalVolume} kg
            </div>
            <div className="text-[10px] font-mono text-zinc-500">Volume</div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <Award className="w-4 h-4 text-zinc-400 mx-auto mb-1" />
            <div className="text-sm font-bold font-mono text-white">
              {session.prsAchieved?.length || 0}
            </div>
            <div className="text-[10px] font-mono text-zinc-500">New PRs</div>
          </div>
        </div>

        {/* Best Improvement Callout */}
        <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-900 text-left flex items-start space-x-3">
          <TrendingUp className="w-4 h-4 text-white mt-0.5 flex-shrink-0" />
          <div className="text-xs flex-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-white">Best Improvement</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                {bestImprovement.headline}
              </span>
            </div>
            <div className="text-zinc-400 mt-1 leading-relaxed font-mono text-[11px]">
              {bestImprovement.detail}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="w-full py-3.5 px-4 bg-white text-black font-semibold rounded-xl flex items-center justify-center space-x-2 text-sm tracking-wide shadow-glow-sm hover:bg-zinc-100 transition-colors"
        >
          <span>DONE & SAVE PROGRESS</span>
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </div>
  );
};
