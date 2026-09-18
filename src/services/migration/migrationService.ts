// src/services/migration/migrationService.ts
import { localStore } from '../storage/localStorageStore';
import { firebaseStore } from '../storage/firebaseStore';
import { dataRepository } from '../storage/dataRepository';

export interface MigrationResult {
  success: boolean;
  routinesMigrated: number;
  sessionsMigrated: number;
  prsMigrated: number;
  weightsMigrated: number;
  error?: string;
}

export async function migrateGuestDataToCloud(
  userId: string,
  userEmail?: string,
  onProgress?: (status: string) => void
): Promise<MigrationResult> {
  try {
    onProgress?.('Reading local workouts and records...');
    const localProfile = localStore.getProfile();
    const localRoutine = localStore.getRoutine();
    const localSessions = localStore.getSessions();
    const localPRs = localStore.getPRs();
    const localWeights = localStore.getWeightEntries();

    // 1. Save Profile
    onProgress?.('Syncing athlete profile...');
    await firebaseStore.saveProfile({
      ...localProfile,
      id: userId,
      email: userEmail,
      isGuest: false,
    });

    // 2. Save Routine
    onProgress?.('Syncing workout routine sequence...');
    await firebaseStore.saveRoutine(userId, localRoutine);

    // 3. Save Workout Sessions
    if (localSessions.length > 0) {
      onProgress?.(`Transferring ${localSessions.length} recorded workouts...`);
      for (const session of localSessions) {
        await firebaseStore.saveSession(userId, session);
      }
    }

    // 4. Save PRs
    if (localPRs.length > 0) {
      onProgress?.(`Transferring ${localPRs.length} personal records...`);
      for (const pr of localPRs) {
        await firebaseStore.savePR(userId, pr);
      }
    }

    // 5. Save Weight Entries
    if (localWeights.length > 0) {
      onProgress?.(`Transferring ${localWeights.length} weight check-ins...`);
      for (const w of localWeights) {
        await firebaseStore.saveWeightEntry(userId, w);
      }
    }

    onProgress?.('Cloud backup complete!');
    dataRepository.notify();

    return {
      success: true,
      routinesMigrated: 1,
      sessionsMigrated: localSessions.length,
      prsMigrated: localPRs.length,
      weightsMigrated: localWeights.length,
    };
  } catch (err: any) {
    console.error('Migration failed:', err);
    return {
      success: false,
      routinesMigrated: 0,
      sessionsMigrated: 0,
      prsMigrated: 0,
      weightsMigrated: 0,
      error: err.message || 'Unknown error during migration',
    };
  }
}
