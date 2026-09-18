// src/services/storage/dataRepository.ts
import { Routine, WorkoutSession, PersonalRecord, UserProfile, WeightEntry, WeightGoal } from '../../types';
import { localStore } from './localStorageStore';
import { firebaseStore } from './firebaseStore';
import { auth, googleProvider, isFirebaseConfigured } from '../../lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut as fbSignOut, User as FirebaseUser } from 'firebase/auth';

type Listener = () => void;

class DataRepository {
  private currentUserId: string | null = null;
  private currentUser: FirebaseUser | null = null;
  private listeners: Set<Listener> = new Set();

  constructor() {
    if (auth) {
      onAuthStateChanged(auth, (user) => {
        this.currentUserId = user ? user.uid : null;
        this.currentUser = user;
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

  getCurrentUser(): FirebaseUser | null {
    return this.currentUser;
  }

  async signInWithGoogle(): Promise<FirebaseUser | null> {
    if (!auth || !isFirebaseConfigured) {
      throw new Error('Firebase is not configured. Please add your Firebase keys in .env.');
    }
    const result = await signInWithPopup(auth, googleProvider);
    this.currentUserId = result.user.uid;
    this.currentUser = result.user;
    this.notify();
    return result.user;
  }

  async signOut(): Promise<void> {
    if (auth) {
      await fbSignOut(auth);
    }
    this.currentUserId = null;
    this.currentUser = null;
    this.notify();
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
      const profile = await firebaseStore.getProfile(this.currentUserId);
      if (profile) return profile;

      // If newly signed in with Google and no profile document yet, create one from Google user
      if (this.currentUser) {
        const newProfile: UserProfile = {
          id: this.currentUser.uid,
          email: this.currentUser.email || undefined,
          displayName: this.currentUser.displayName || 'Athlete',
          isGuest: false,
          weightUnit: localStore.getProfile().weightUnit || 'kg',
          restTimerDefaultSeconds: localStore.getProfile().restTimerDefaultSeconds || 90,
          soundEnabled: true,
          createdAt: new Date().toISOString(),
        };
        await firebaseStore.saveProfile(newProfile);
        return newProfile;
      }
    }
    return localStore.getProfile();
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    if (this.currentUserId) {
      await firebaseStore.saveProfile(profile);
    }
    localStore.saveProfile(profile);
    this.notify();
  }

  async getRoutine(): Promise<Routine> {
    if (this.currentUserId) {
      const cloudRoutine = await firebaseStore.getActiveRoutine(this.currentUserId);
      if (cloudRoutine) return cloudRoutine;
    }
    return localStore.getRoutine();
  }

  async saveRoutine(routine: Routine): Promise<void> {
    if (this.currentUserId) {
      await firebaseStore.saveRoutine(this.currentUserId, routine);
    }
    localStore.saveRoutine(routine);
    this.notify();
  }

  async getSessions(): Promise<WorkoutSession[]> {
    if (this.currentUserId) {
      const cloudSessions = await firebaseStore.getSessions(this.currentUserId);
      if (cloudSessions.length > 0) return cloudSessions;
    }
    return localStore.getSessions();
  }

  async saveSession(session: WorkoutSession): Promise<void> {
    if (this.currentUserId) {
      await firebaseStore.saveSession(this.currentUserId, session);
    }
    localStore.saveSession(session);
    this.notify();
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (this.currentUserId) {
      await firebaseStore.deleteSession(this.currentUserId, sessionId);
    }
    localStore.deleteSession(sessionId);
    this.notify();
  }

  async getPRs(): Promise<PersonalRecord[]> {
    if (this.currentUserId) {
      const cloudPRs = await firebaseStore.getPRs(this.currentUserId);
      if (cloudPRs.length > 0) return cloudPRs;
    }
    return localStore.getPRs();
  }

  async savePR(pr: PersonalRecord): Promise<void> {
    if (this.currentUserId) {
      await firebaseStore.savePR(this.currentUserId, pr);
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
      const cloudEntries = await firebaseStore.getWeightEntries(this.currentUserId);
      if (cloudEntries.length > 0) return cloudEntries;
    }
    return localStore.getWeightEntries();
  }

  async saveWeightEntry(entry: WeightEntry): Promise<void> {
    if (this.currentUserId) {
      await firebaseStore.saveWeightEntry(this.currentUserId, entry);
    }
    localStore.saveWeightEntry(entry);
    this.notify();
  }

  async deleteWeightEntry(entryId: string): Promise<void> {
    if (this.currentUserId) {
      await firebaseStore.deleteWeightEntry(this.currentUserId, entryId);
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
