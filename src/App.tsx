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
import { WeightTrackerView } from './components/weight/WeightTrackerView';
import { LogWeightModal } from './components/weight/LogWeightModal';
import { AuthModal } from './components/auth/AuthModal';
import { WelcomeScreen, OnboardingData } from './components/auth/WelcomeScreen';
import { createRoutineFromSplit } from './services/data/onboardingPresets';

import { Routine, WorkoutSession, PersonalRecord, UserProfile, WeightEntry, WeightGoal } from './types';
import { dataRepository } from './services/storage/dataRepository';
import { localStore } from './services/storage/localStorageStore';
import { calculateWorkoutStreak, getPreviousExerciseSets } from './services/engine/rollingQueue';
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

  // Body weight tracking state
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [weightGoal, setWeightGoal] = useState<WeightGoal | null>(null);
  const [isDashboardLogWeightOpen, setIsDashboardLogWeightOpen] = useState<boolean>(false);

  // Active workout state
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [completedSummarySession, setCompletedSummarySession] = useState<WorkoutSession | null>(null);

  // Auth & Profile Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Load all repository data
  const loadData = useCallback(async () => {
    const [p, r, s, records, weights] = await Promise.all([
      dataRepository.getProfile(),
      dataRepository.getRoutine(),
      dataRepository.getSessions(),
      dataRepository.getPRs(),
      dataRepository.getWeightEntries(),
    ]);

    setProfile(p);
    setRoutine(r);
    setSessions(s);
    setPRs(records);
    setWeightEntries(weights);
    setWeightGoal(dataRepository.getWeightGoal());

    const currentActive = dataRepository.getActiveSession();
    setActiveSession(currentActive);
  }, []);


  useEffect(() => {
    loadData();
    const unsubscribe = dataRepository.subscribe(() => {
      loadData();
      if (!dataRepository.isGuest()) {
        localStore.setOnboardingCompleted(true);
        setIsOnboardingDone(true);
      }
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
        // Query previous completed sets for this exercise
        const prevSets = getPreviousExerciseSets(ex.name, sessions);

        // Pre-fill sets based on target sets and previous performance
        const sets = [];
        for (let i = 1; i <= ex.targetSets; i++) {
          const prevSet = prevSets ? (prevSets[i - 1] || prevSets[prevSets.length - 1]) : null;
          sets.push({
            id: `s-${Date.now()}-${ex.id}-${i}`,
            setNumber: i,
            weight: prevSet?.weight ?? 20,
            reps: prevSet?.reps ?? (ex.targetRepsMin || 10),
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

    // Save any PRs broken during this workout, plus record baselines for new exercises
    const prsToSave = [...(finishedSession.prsAchieved || [])];
    for (const ex of finishedSession.exercises) {
      const hasPrior = prs.some(
        (p) => p.exerciseName.toLowerCase() === ex.exerciseName.toLowerCase() && p.prType === 'weight'
      );
      if (!hasPrior && !prsToSave.some((p) => p.exerciseName.toLowerCase() === ex.exerciseName.toLowerCase())) {
        const completedSets = ex.sets.filter((s) => s.isCompleted && s.weight > 0);
        if (completedSets.length > 0) {
          const maxWeight = Math.max(...completedSets.map((s) => s.weight));
          const maxSet = completedSets.find((s) => s.weight === maxWeight);
          if (maxSet) {
            prsToSave.push({
              id: `pr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
              exerciseName: ex.exerciseName,
              prType: 'weight',
              prValue: maxSet.weight,
              weight: maxSet.weight,
              reps: maxSet.reps,
              achievedAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    for (const pr of prsToSave) {
      await dataRepository.savePR(pr);
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

    // Refresh state
    await loadData();

    // Trigger celebratory summary modal
    setCompletedSummarySession(finishedSession);
  };

  // Advance routine day (for Rest Days)
  const handleAdvanceRoutineDay = async (markAsCompleted = false) => {
    const nextIndex = (routine.currentQueueIndex + 1) % routine.days.length;
    const updatedRoutine: Routine = {
      ...routine,
      currentQueueIndex: nextIndex,
      lastCompletedDate: markAsCompleted ? new Date().toISOString() : routine.lastCompletedDate,
    };
    await dataRepository.saveRoutine(updatedRoutine);
    setRoutine(updatedRoutine);
    await loadData();
  };

  // Cancel workout
  const handleCancelWorkout = () => {
    dataRepository.saveActiveSession(null);
    setActiveSession(null);
    setActiveTab('home');
  };

  // Body weight tracking handlers
  const handleSaveWeightEntry = async (entry: WeightEntry) => {
    await dataRepository.saveWeightEntry(entry);
    await loadData();
  };

  const handleDeleteWeightEntry = async (id: string) => {
    await dataRepository.deleteWeightEntry(id);
    await loadData();
  };

  const handleSaveWeightGoal = async (goal: WeightGoal | null) => {
    dataRepository.saveWeightGoal(goal);
    setWeightGoal(goal);
  };

  const handleCompleteOnboarding = async (data: OnboardingData) => {
    // 1. Build and save profile
    const currentP = profile || initialGuestProfile;
    const updatedProfile: UserProfile = {
      ...currentP,
      displayName: data.displayName,
      isGuest: data.accountMode === 'guest',
      weightUnit: data.weightUnit,
      restTimerDefaultSeconds: data.restTimerSeconds,
      soundEnabled: true,
    };
    await dataRepository.saveProfile(updatedProfile);
    setProfile(updatedProfile);

    // 2. Build and save custom or preset routine
    const newRoutine = data.customRoutine
      ? data.customRoutine
      : createRoutineFromSplit(data.splitId, data.targetDaysPerWeek);
    await dataRepository.saveRoutine(newRoutine);
    setRoutine(newRoutine);

    // 3. Save initial weight entry and goal if specified
    if (data.currentWeight && data.currentWeight > 0) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      const initialEntry: WeightEntry = {
        id: `weight-${Date.now()}`,
        weight: data.currentWeight,
        unit: data.weightUnit,
        date: dateKey,
        notes: 'Initial setup check-in',
        createdAt: now.toISOString(),
      };
      await dataRepository.saveWeightEntry(initialEntry);
      setWeightEntries([initialEntry]);

      if (data.goalType && data.targetWeight) {
        const goal: WeightGoal = {
          startWeight: data.currentWeight,
          targetWeight: data.targetWeight,
          goalType: data.goalType,
        };
        await dataRepository.saveWeightGoal(goal);
        setWeightGoal(goal);
      }
    }

    localStore.setOnboardingCompleted(true);
    setIsOnboardingDone(true);
    await loadData();
  };

  const handleSkipToDefaults = async (isGoogleUser: boolean) => {
    const currentP = profile || initialGuestProfile;
    const updatedProfile: UserProfile = {
      ...currentP,
      isGuest: !isGoogleUser,
      weightUnit: 'kg',
      restTimerDefaultSeconds: 90,
      soundEnabled: true,
    };
    await dataRepository.saveProfile(updatedProfile);
    setProfile(updatedProfile);

    await dataRepository.saveRoutine(defaultRoutine);
    setRoutine(defaultRoutine);

    localStore.setOnboardingCompleted(true);
    setIsOnboardingDone(true);
    await loadData();
  };

  // If user hasn't chosen a mode yet, show Welcome / Setup wizard
  if (!isOnboardingDone) {
    return (
      <WelcomeScreen
        onCompleteOnboarding={handleCompleteOnboarding}
        onSkipToDefaults={handleSkipToDefaults}
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
        onGoHome={() => setActiveTab('home')}
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
            weightEntries={weightEntries}
            weightGoal={weightGoal}
            weightUnit={profile.weightUnit || 'kg'}
            onStartWorkout={handleStartWorkout}
            onCompleteRestDay={() => handleAdvanceRoutineDay(true)}
            onSkipRestDay={() => handleAdvanceRoutineDay(false)}
            onViewProgress={() => setActiveTab('progress')}
            onViewRoutine={() => setActiveTab('routine')}
            onViewWeight={() => setActiveTab('weight')}
            onQuickLogWeight={() => setIsDashboardLogWeightOpen(true)}
          />
        )}

        {activeTab === 'workout' && (
          activeSession ? (
            <ActiveWorkoutView
              session={activeSession}
              previousSessions={sessions}
              prs={prs}
              profile={profile}
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

        {activeTab === 'weight' && (
          <WeightTrackerView
            entries={weightEntries}
            goal={weightGoal}
            profile={profile}
            onSaveEntry={handleSaveWeightEntry}
            onDeleteEntry={handleDeleteWeightEntry}
            onSaveGoal={handleSaveWeightGoal}
          />
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

      {/* Cloud Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={() => {
          loadData();
          setIsAuthOpen(false);
        }}
      />

      {/* Quick Log Weight Modal for Dashboard */}
      <LogWeightModal
        isOpen={isDashboardLogWeightOpen}
        onClose={() => setIsDashboardLogWeightOpen(false)}
        onSave={handleSaveWeightEntry}
        defaultWeight={weightEntries[0]?.weight || 70.0}
        weightUnit={profile.weightUnit || 'kg'}
      />
    </AppLayout>
  );
}

export default App;
