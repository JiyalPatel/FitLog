// src/services/migration/migrationService.ts
import { localStore } from '../storage/localStorageStore';
import { supabaseStore } from '../storage/supabaseStore';
import { dataRepository } from '../storage/dataRepository';

export interface MigrationResult {
  success: boolean;
  routinesMigrated: number;
  sessionsMigrated: number;
  prsMigrated: number;
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

    // 1. Save Profile
    onProgress?.('Syncing athlete profile...');
    await supabaseStore.saveProfile({
      ...localProfile,
      id: userId,
      email: userEmail,
      isGuest: false,
    });

    // 2. Save Routine
    onProgress?.('Syncing workout routine sequence...');
    await supabaseStore.saveRoutine(userId, localRoutine);

    // 3. Save Workout Sessions
    onProgress?.(`Transferring ${localSessions.length} recorded workouts...`);
    for (const session of localSessions) {
      await supabaseStore.saveSession(userId, session);
    }

    // 4. Save PRs
    onProgress?.(`Transferring ${localPRs.length} personal records...`);
    for (const pr of localPRs) {
      await supabaseStore.savePR(userId, pr);
    }

    onProgress?.('Migration complete!');
    dataRepository.notify();

    return {
      success: true,
      routinesMigrated: 1,
      sessionsMigrated: localSessions.length,
      prsMigrated: localPRs.length,
    };
  } catch (err: any) {
    console.error('Migration failed:', err);
    return {
      success: false,
      routinesMigrated: 0,
      sessionsMigrated: 0,
      prsMigrated: 0,
      error: err.message || 'Unknown error during migration',
    };
  }
}
