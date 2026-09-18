// src/services/storage/dataRepository.ts
import { Routine, WorkoutSession, PersonalRecord, UserProfile, WeightEntry, WeightGoal } from '../../types';
import { localStore } from './localStorageStore';
import { supabaseStore } from './supabaseStore';
import { supabase } from '../../lib/supabase';

type Listener = () => void;

class DataRepository {
  private currentUserId: string | null = null;
  private listeners: Set<Listener> = new Set();

  constructor() {
    // Check if user session exists in Supabase
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          this.currentUserId = session.user.id;
          this.notify();
        }
      });

      supabase.auth.onAuthStateChange((_event, session) => {
        this.currentUserId = session?.user ? session.user.id : null;
        this.notify();
      });
    }
  }

  isGuest(): boolean {
    return !this.currentUserId;
  }

  getUserId(): string | null {
    return this.currentUserId;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(): void {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.error('Listener error in DataRepository', e);
      }
    });
  }

  async getProfile(): Promise<UserProfile> {
    if (this.currentUserId) {
      const profile = await supabaseStore.getProfile(this.currentUserId);
      if (profile) return profile;
    }
    return localStore.getProfile();
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    if (this.currentUserId) {
      await supabaseStore.saveProfile(profile);
    }
    localStore.saveProfile(profile);
    this.notify();
  }

  async getRoutine(): Promise<Routine> {
    if (this.currentUserId) {
      const cloudRoutine = await supabaseStore.getActiveRoutine(this.currentUserId);
      if (cloudRoutine) return cloudRoutine;
    }
    return localStore.getRoutine();
  }

  async saveRoutine(routine: Routine): Promise<void> {
    if (this.currentUserId) {
      await supabaseStore.saveRoutine(this.currentUserId, routine);
    }
    localStore.saveRoutine(routine);
    this.notify();
  }

  async getSessions(): Promise<WorkoutSession[]> {
    if (this.currentUserId) {
      const cloudSessions = await supabaseStore.getSessions(this.currentUserId);
      if (cloudSessions.length > 0) return cloudSessions;
    }
    return localStore.getSessions();
  }

  async saveSession(session: WorkoutSession): Promise<void> {
    if (this.currentUserId) {
      await supabaseStore.saveSession(this.currentUserId, session);
    }
    localStore.saveSession(session);
    this.notify();
  }

  async deleteSession(sessionId: string): Promise<void> {
    localStore.deleteSession(sessionId);
    this.notify();
  }

  async getPRs(): Promise<PersonalRecord[]> {
    if (this.currentUserId) {
      const cloudPRs = await supabaseStore.getPRs(this.currentUserId);
      if (cloudPRs.length > 0) return cloudPRs;
    }
    return localStore.getPRs();
  }

  async savePR(pr: PersonalRecord): Promise<void> {
    if (this.currentUserId) {
      await supabaseStore.savePR(this.currentUserId, pr);
    }
    localStore.savePR(pr);
    this.notify();
  }

  getActiveSession(): WorkoutSession | null {
    return localStore.getActiveSession();
  }

  saveActiveSession(session: WorkoutSession | null): void {
    localStore.saveActiveSession(session);
    this.notify();
  }

  async getWeightEntries(): Promise<WeightEntry[]> {
    if (this.currentUserId) {
      const cloudEntries = await supabaseStore.getWeightEntries(this.currentUserId);
      if (cloudEntries.length > 0) return cloudEntries;
    }
    return localStore.getWeightEntries();
  }

  async saveWeightEntry(entry: WeightEntry): Promise<void> {
    if (this.currentUserId) {
      await supabaseStore.saveWeightEntry(this.currentUserId, entry);
    }
    localStore.saveWeightEntry(entry);
    this.notify();
  }

  async deleteWeightEntry(entryId: string): Promise<void> {
    if (this.currentUserId) {
      await supabaseStore.deleteWeightEntry(this.currentUserId, entryId);
    }
    localStore.deleteWeightEntry(entryId);
    this.notify();
  }

  getWeightGoal(): WeightGoal | null {
    return localStore.getWeightGoal();
  }

  saveWeightGoal(goal: WeightGoal | null): void {
    localStore.saveWeightGoal(goal);
    this.notify();
  }
}

export const dataRepository = new DataRepository();
