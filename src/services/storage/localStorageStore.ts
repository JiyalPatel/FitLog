import { Routine, WorkoutSession, PersonalRecord, UserProfile, WeightEntry, WeightGoal } from '../../types';
import { defaultRoutine, initialHistoricalSessions, initialPRs, initialGuestProfile } from './mockInitialData';

const STORAGE_KEYS = {
  PROFILE: 'fitlog_profile',
  ROUTINE: 'fitlog_routine',
  SESSIONS: 'fitlog_sessions',
  PRS: 'fitlog_prs',
  ACTIVE_SESSION: 'fitlog_active_session',
  ONBOARDING_COMPLETED: 'fitlog_onboarding_completed',
  WEIGHT_ENTRIES: 'fitlog_weight_entries',
  WEIGHT_GOAL: 'fitlog_weight_goal',
};

export class LocalStorageStore {
  isOnboardingCompleted(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED) === 'true';
    } catch {
      return false;
    }
  }

  setOnboardingCompleted(completed: boolean): void {
    if (completed) {
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
    }
  }

  getProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? JSON.parse(data) : initialGuestProfile;
    } catch {
      return initialGuestProfile;
    }
  }

  saveProfile(profile: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }

  getRoutine(): Routine {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROUTINE);
      return data ? JSON.parse(data) : defaultRoutine;
    } catch {
      return defaultRoutine;
    }
  }

  saveRoutine(routine: Routine): void {
    localStorage.setItem(STORAGE_KEYS.ROUTINE, JSON.stringify(routine));
  }

  getSessions(): WorkoutSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      return data ? JSON.parse(data) : initialHistoricalSessions;
    } catch {
      return initialHistoricalSessions;
    }
  }

  saveSession(session: WorkoutSession): void {
    const sessions = this.getSessions();
    const existingIndex = sessions.findIndex((s) => s.id === session.id);
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.unshift(session);
    }
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }

  deleteSession(sessionId: string): void {
    const sessions = this.getSessions().filter((s) => s.id !== sessionId);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }

  getPRs(): PersonalRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRS);
      return data ? JSON.parse(data) : initialPRs;
    } catch {
      return initialPRs;
    }
  }

  savePR(pr: PersonalRecord): void {
    const prs = this.getPRs();
    const existingIndex = prs.findIndex(
      (p) => p.exerciseName.toLowerCase() === pr.exerciseName.toLowerCase() && p.prType === pr.prType
    );
    if (existingIndex >= 0) {
      prs[existingIndex] = pr;
    } else {
      prs.unshift(pr);
    }
    localStorage.setItem(STORAGE_KEYS.PRS, JSON.stringify(prs));
  }

  getActiveSession(): WorkoutSession | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  saveActiveSession(session: WorkoutSession | null): void {
    if (session) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    }
  }

  getWeightEntries(): WeightEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WEIGHT_ENTRIES);
      if (data) {
        const entries: WeightEntry[] = JSON.parse(data);
        return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
      return [];
    } catch {
      return [];
    }
  }

  saveWeightEntry(entry: WeightEntry): void {
    const entries = this.getWeightEntries();
    const existingIndex = entries.findIndex((e) => e.id === entry.id);
    if (existingIndex >= 0) {
      entries[existingIndex] = entry;
    } else {
      entries.unshift(entry);
    }
    // Keep entries sorted descending by date
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    localStorage.setItem(STORAGE_KEYS.WEIGHT_ENTRIES, JSON.stringify(entries));
  }

  deleteWeightEntry(entryId: string): void {
    const entries = this.getWeightEntries().filter((e) => e.id !== entryId);
    localStorage.setItem(STORAGE_KEYS.WEIGHT_ENTRIES, JSON.stringify(entries));
  }

  getWeightGoal(): WeightGoal | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WEIGHT_GOAL);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  saveWeightGoal(goal: WeightGoal | null): void {
    if (goal) {
      localStorage.setItem(STORAGE_KEYS.WEIGHT_GOAL, JSON.stringify(goal));
    } else {
      localStorage.removeItem(STORAGE_KEYS.WEIGHT_GOAL);
    }
  }

  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  }
}

export const localStore = new LocalStorageStore();
