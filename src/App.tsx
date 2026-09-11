// src/App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { Header } from './components/layout/Header';
import { BottomNav, TabType } from './components/layout/BottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { ActiveWorkoutView } from './components/workout/ActiveWorkoutView';
import { WorkoutSummaryModal } from './components/workout/WorkoutSummaryModal';
import { RoutineManagerView } from './components/routine/RoutineManagerView';
import { ProgressView } from './components/analytics/ProgressView';
import { ProfileView } from './components/profile/ProfileView';
import { AuthModal } from './components/auth/AuthModal';
import { WelcomeScreen } from './components/auth/WelcomeScreen';

import { Routine, WorkoutSession, PersonalRecord, UserProfile } from './types';
import { dataRepository } from './services/storage/dataRepository';
import { localStore } from './services/storage/localStorageStore';
import { calculateWorkoutStreak } from './services/engine/rollingQueue';
import { calculateWeeklyStats } from './services/engine/scoringEngine';
import { generateOverloadTips } from './services/engine/overloadEngine';
import { defaultRoutine, initialGuestProfile } from './services/storage/mockInitialData';

export function App() {
  const [isOnboardingDone, setIsOnboardingDone] = useState<boolean>(() => localStore.isOnboardingCompleted());
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [profile, setProfile] = useState<UserProfile>(initialGuestProfile);
  const [routine, setRoutine] = useState<Routine>(defaultRoutine);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [prs, setPRs] = useState<PersonalRecord[]>([]);

  // Active workout state
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [completedSummarySession, setCompletedSummarySession] = useState<WorkoutSession | null>(null);

  // Auth & Profile Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Load all repository data
  const loadData = useCallback(async () => {
    const [p, r, s, records] = await Promise.all([
      dataRepository.getProfile(),
      dataRepository.getRoutine(),
      dataRepository.getSessions(),
      dataRepository.getPRs(),
    ]);

    setProfile(p);
    setRoutine(r);
    setSessions(s);
    setPRs(records);

    const currentActive = dataRepository.getActiveSession();
    setActiveSession(currentActive);
  }, []);

  useEffect(() => {
    loadData();
    const unsubscribe = dataRepository.subscribe(() => {
      loadData();
    });
    return () => unsubscribe();
  }, [loadData]);

  // Derived stats
  const streak = calculateWorkoutStreak(sessions);
  const weeklyStats = calculateWeeklyStats(sessions, routine.targetDaysPerWeek || 5);
  const overloadTips = generateOverloadTips(sessions);

  // Start a new workout session from a routine day
  const handleStartWorkout = (routineDayId?: string) => {
    const targetDay =
      routine.days.find((d) => d.id === routineDayId) ||
      routine.days[routine.currentQueueIndex % routine.days.length];

    if (!targetDay) return;

    const newSession: WorkoutSession = {
      id: `session-${Date.now()}`,
      routineId: routine.id,
      routineDayId: targetDay.id,
      name: targetDay.name,
      startedAt: new Date().toISOString(),
      durationSeconds: 0,
      totalVolume: 0,
      totalSets: 0,
      workoutScore: 0,
      status: 'in_progress',
      prsAchieved: [],
      exercises: targetDay.exercises.map((ex) => {
        // Pre-fill sets based on target sets
        const sets = [];
        for (let i = 1; i <= ex.targetSets; i++) {
          sets.push({
            id: `s-${Date.now()}-${ex.id}-${i}`,
            setNumber: i,
            weight: 20,
            reps: ex.targetRepsMin || 10,
            isCompleted: false,
          });
        }
        return {
          id: `log-${ex.id}`,
          exerciseName: ex.name,
          muscleGroup: ex.muscleGroup,
          sets,
          notes: ex.notes,
        };
      }),
    };

    dataRepository.saveActiveSession(newSession);
    setActiveSession(newSession);
    setActiveTab('workout');
  };

  // Update in-progress session
  const handleUpdateActiveSession = (updated: WorkoutSession) => {
    setActiveSession(updated);
    dataRepository.saveActiveSession(updated);
  };

  // Finish Workout Session
  const handleFinishWorkout = async () => {
    if (!activeSession) return;

    const finishedSession: WorkoutSession = {
      ...activeSession,
      completedAt: new Date().toISOString(),
      status: 'completed',
    };

    // Save session
    await dataRepository.saveSession(finishedSession);

    // Save any PRs broken during this workout
    if (finishedSession.prsAchieved && finishedSession.prsAchieved.length > 0) {
      for (const pr of finishedSession.prsAchieved) {
        await dataRepository.savePR(pr);
      }
    }

    // Advance Sequential Routine Queue
    const nextIndex = (routine.currentQueueIndex + 1) % routine.days.length;
    const updatedRoutine: Routine = {
      ...routine,
      currentQueueIndex: nextIndex,
      lastCompletedDate: new Date().toISOString(),
    };
    await dataRepository.saveRoutine(updatedRoutine);

    // Clear active session
    dataRepository.saveActiveSession(null);
    setActiveSession(null);

    // Trigger celebratory summary modal
    setCompletedSummarySession(finishedSession);
  };

  // Cancel workout
  const handleCancelWorkout = () => {
    dataRepository.saveActiveSession(null);
    setActiveSession(null);
    setActiveTab('home');
  };

  // If user hasn't chosen a mode yet, show Welcome / Login screen
  if (!isOnboardingDone) {
    return (
      <WelcomeScreen
        onContinueAsGuest={() => {
          localStore.setOnboardingCompleted(true);
          setIsOnboardingDone(true);
        }}
        onAuthSuccess={() => {
          localStore.setOnboardingCompleted(true);
          setIsOnboardingDone(true);
          loadData();
        }}
      />
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <Header
        profile={profile}
        streak={streak}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Tab Views */}
      <main className="flex-1 flex flex-col">
        {activeTab === 'home' && (
          <DashboardView
            routine={routine}
            recentSessions={sessions}
            prs={prs}
            streak={streak}
            weeklyStats={weeklyStats}
            overloadTips={overloadTips}
            onStartWorkout={handleStartWorkout}
            onViewProgress={() => setActiveTab('progress')}
            onViewRoutine={() => setActiveTab('routine')}
          />
        )}

        {activeTab === 'workout' && (
          activeSession ? (
            <ActiveWorkoutView
              session={activeSession}
              previousSessions={sessions}
              prs={prs}
              onUpdateSession={handleUpdateActiveSession}
              onFinishWorkout={handleFinishWorkout}
              onCancelWorkout={handleCancelWorkout}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white font-mono text-2xl shadow-glow-sm">
                🏋️
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">No Workout in Progress</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                  Ready to train? Start your next scheduled session from your sequential routine queue.
                </p>
              </div>
              <button
                onClick={() => handleStartWorkout()}
                className="px-6 py-3 bg-white text-black font-semibold font-mono text-xs tracking-wider rounded-xl shadow-glow-sm hover:bg-zinc-200 transition-colors uppercase"
              >
                START NEXT WORKOUT ({routine.days[routine.currentQueueIndex % routine.days.length]?.name || 'Routine'})
              </button>
            </div>
          )
        )}

        {activeTab === 'progress' && (
          <ProgressView sessions={sessions} prs={prs} />
        )}

        {activeTab === 'routine' && (
          <RoutineManagerView
            routine={routine}
            onSaveRoutine={(newRoutine) => dataRepository.saveRoutine(newRoutine)}
          />
        )}
      </main>

      {/* Sticky Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        hasActiveSession={Boolean(activeSession)}
      />

      {/* Celebratory Workout Summary Modal */}
      {completedSummarySession && (
        <WorkoutSummaryModal
          session={completedSummarySession}
          previousSessions={sessions}
          onClose={() => {
            setCompletedSummarySession(null);
            setActiveTab('home');
          }}
        />
      )}

      {/* Profile & Settings Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col max-w-md mx-auto">
          <div className="p-4 border-b border-zinc-900 flex justify-end">
            <button
              onClick={() => setIsProfileOpen(false)}
              className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono text-zinc-400 hover:text-white"
            >
              CLOSE
            </button>
          </div>
          <ProfileView
            profile={profile}
            onUpdateProfile={(p) => dataRepository.saveProfile(p)}
            onOpenAuth={() => {
              setIsProfileOpen(false);
              setIsAuthOpen(true);
            }}
            onSignOut={() => {
              localStore.setOnboardingCompleted(false);
              setIsOnboardingDone(false);
              setIsProfileOpen(false);
            }}
          />
        </div>
      )}

      {/* Supabase Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={() => {
          loadData();
          setIsAuthOpen(false);
        }}
      />
    </AppLayout>
  );
}

export default App;
