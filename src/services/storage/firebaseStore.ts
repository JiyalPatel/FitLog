// src/services/storage/firebaseStore.ts
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../../lib/firebase';
import { Routine, WorkoutSession, PersonalRecord, UserProfile, WeightEntry } from '../../types';

export class FirebaseStore {
  // --- Profile ---
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!isFirebaseConfigured || !db) return null;

    try {
      const docRef = doc(db, 'users', userId, 'profile', 'athlete');
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) return null;
      const data = docSnap.data();

      return {
        id: userId,
        email: data.email,
        displayName: data.displayName || 'Athlete',
        isGuest: false,
        weightUnit: data.weightUnit || 'kg',
        restTimerDefaultSeconds: data.restTimerDefaultSeconds || 90,
        soundEnabled: data.soundEnabled ?? true,
        createdAt: data.createdAt || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching profile from Firebase:', error);
      return null;
    }
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    if (!isFirebaseConfigured || !db || !profile.id) return;

    try {
      const docRef = doc(db, 'users', profile.id, 'profile', 'athlete');
      await setDoc(docRef, {
        displayName: profile.displayName,
        email: profile.email || null,
        weightUnit: profile.weightUnit,
        restTimerDefaultSeconds: profile.restTimerDefaultSeconds,
        soundEnabled: profile.soundEnabled,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving profile to Firebase:', error);
    }
  }

  // --- Routine ---
  async getActiveRoutine(userId: string): Promise<Routine | null> {
    if (!isFirebaseConfigured || !db) return null;

    try {
      const routinesRef = collection(db, 'users', userId, 'routines');
      const snapshot = await getDocs(routinesRef);

      if (snapshot.empty) return null;

      // Pick first active routine
      const docData = snapshot.docs[0].data() as Routine;
      return {
        ...docData,
        id: snapshot.docs[0].id,
      };
    } catch (error) {
      console.error('Error getting routine from Firebase:', error);
      return null;
    }
  }

  async saveRoutine(userId: string, routine: Routine): Promise<void> {
    if (!isFirebaseConfigured || !db) return;

    try {
      const routineDoc = doc(db, 'users', userId, 'routines', routine.id);
      await setDoc(routineDoc, {
        ...routine,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving routine to Firebase:', error);
    }
  }

  // --- Workout Sessions ---
  async getSessions(userId: string): Promise<WorkoutSession[]> {
    if (!isFirebaseConfigured || !db) return [];

    try {
      const sessionsRef = collection(db, 'users', userId, 'workout_sessions');
      const q = query(sessionsRef, orderBy('startedAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((d) => ({
        ...(d.data() as WorkoutSession),
        id: d.id,
      }));
    } catch (error) {
      console.error('Error getting sessions from Firebase:', error);
      return [];
    }
  }

  async saveSession(userId: string, session: WorkoutSession): Promise<void> {
    if (!isFirebaseConfigured || !db) return;

    try {
      const sessionDoc = doc(db, 'users', userId, 'workout_sessions', session.id);
      await setDoc(sessionDoc, {
        ...session,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving session to Firebase:', error);
    }
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    if (!isFirebaseConfigured || !db) return;

    try {
      const sessionDoc = doc(db, 'users', userId, 'workout_sessions', sessionId);
      await deleteDoc(sessionDoc);
    } catch (error) {
      console.error('Error deleting session from Firebase:', error);
    }
  }

  // --- Personal Records (PRs) ---
  async getPRs(userId: string): Promise<PersonalRecord[]> {
    if (!isFirebaseConfigured || !db) return [];

    try {
      const prsRef = collection(db, 'users', userId, 'exercise_prs');
      const q = query(prsRef, orderBy('achievedAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((d) => ({
        ...(d.data() as PersonalRecord),
        id: d.id,
      }));
    } catch (error) {
      console.error('Error getting PRs from Firebase:', error);
      return [];
    }
  }

  async savePR(userId: string, pr: PersonalRecord): Promise<void> {
    if (!isFirebaseConfigured || !db) return;

    try {
      const prDoc = doc(db, 'users', userId, 'exercise_prs', pr.id);
      await setDoc(prDoc, {
        ...pr,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving PR to Firebase:', error);
    }
  }

  // --- Weight Entries ---
  async getWeightEntries(userId: string): Promise<WeightEntry[]> {
    if (!isFirebaseConfigured || !db) return [];

    try {
      const weightRef = collection(db, 'users', userId, 'weight_entries');
      const q = query(weightRef, orderBy('date', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((d) => ({
        ...(d.data() as WeightEntry),
        id: d.id,
      }));
    } catch (error) {
      console.error('Error getting weight entries from Firebase:', error);
      return [];
    }
  }

  async saveWeightEntry(userId: string, entry: WeightEntry): Promise<void> {
    if (!isFirebaseConfigured || !db) return;

    try {
      const entryDoc = doc(db, 'users', userId, 'weight_entries', entry.id);
      await setDoc(entryDoc, {
        ...entry,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving weight entry to Firebase:', error);
    }
  }

  async deleteWeightEntry(userId: string, entryId: string): Promise<void> {
    if (!isFirebaseConfigured || !db) return;

    try {
      const entryDoc = doc(db, 'users', userId, 'weight_entries', entryId);
      await deleteDoc(entryDoc);
    } catch (error) {
      console.error('Error deleting weight entry from Firebase:', error);
    }
  }
}

export const firebaseStore = new FirebaseStore();
