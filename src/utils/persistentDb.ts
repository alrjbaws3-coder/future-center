/**
 * Persistent Storage Layer for Future Center Platform
 * Uses browser IndexedDB (hundreds of MBs capacity, never quota limited, persists indefinitely)
 * to store full snapshots of programs, students, curriculum, lectures, and site settings.
 */

import { EducationalProgram, StudentUser, SiteSettings, ShamCashRequest, AppNotification } from '../types';

const DB_NAME = 'FutureCenterPermanentDB';
const DB_VERSION = 2;
const STORE_NAME = 'platform_snapshots';

export interface PlatformSnapshot {
  id: string; // e.g. 'latest' or 'snapshot-172777...'
  timestamp: string;
  label?: string;
  source: 'auto_save' | 'manual_backup' | 'server_sync';
  data: {
    programs: EducationalProgram[];
    students: StudentUser[];
    siteSettings?: SiteSettings;
    shamCashRequests?: ShamCashRequest[];
    notifications?: AppNotification[];
    lastUpdatedAt?: string;
  };
  stats: {
    programsCount: number;
    coursesCount: number;
    lecturesCount: number;
    studentsCount: number;
  };
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function countTotalCoursesAndLectures(programs: EducationalProgram[]): { coursesCount: number; lecturesCount: number } {
  let coursesCount = 0;
  let lecturesCount = 0;

  if (Array.isArray(programs)) {
    for (const p of programs) {
      for (const s of p.specialties || []) {
        for (const c of s.courses || []) {
          coursesCount++;
          for (const sem of c.semesters || []) {
            lecturesCount += sem.lectures?.length || 0;
          }
        }
      }
    }
  }

  return { coursesCount, lecturesCount };
}

/**
 * Saves a full snapshot to IndexedDB.
 * Maintains 'latest' and a rolling history of the last 15 snapshots.
 * CRITICAL PROTECTION: Never overwrites a richer existing snapshot with an empty/default one!
 */
export async function saveSnapshotToIndexedDB(
  data: {
    programs: EducationalProgram[];
    students: StudentUser[];
    siteSettings?: SiteSettings;
    shamCashRequests?: ShamCashRequest[];
    notifications?: AppNotification[];
    lastUpdatedAt?: string;
  },
  source: 'auto_save' | 'manual_backup' | 'server_sync' = 'auto_save',
  label?: string,
  allowDeletion: boolean = false
): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    // 1. Fetch current 'latest' to perform deep non-destructive merge
    const existingReq = store.get('latest');

    return new Promise((resolve) => {
      existingReq.onsuccess = () => {
        const existing: PlatformSnapshot | undefined = existingReq.result;

        let finalStudents = data.students || [];
        let finalPrograms = data.programs || [];

        if (existing && existing.data && !allowDeletion) {
          // Merge students: preserve any student that was in existing
          const studentMap = new Map<string, StudentUser>();
          for (const s of existing.data.students || []) {
            if (s && s.username) studentMap.set(s.username.toLowerCase(), s);
            else if (s && s.id) studentMap.set(s.id, s);
          }
          for (const s of data.students || []) {
            if (s && s.username) {
              const old = studentMap.get(s.username.toLowerCase());
              studentMap.set(s.username.toLowerCase(), old ? { ...old, ...s } : s);
            } else if (s && s.id) {
              const old = studentMap.get(s.id);
              studentMap.set(s.id, old ? { ...old, ...s } : s);
            }
          }
          finalStudents = Array.from(studentMap.values());

          // If incoming programs has 0 specialties or fewer courses, preserve existing
          const existingCoursesCount = countTotalCoursesAndLectures(existing.data.programs || []).coursesCount;
          const incomingCoursesCount = countTotalCoursesAndLectures(data.programs || []).coursesCount;
          if (existingCoursesCount > incomingCoursesCount && incomingCoursesCount === 0) {
            finalPrograms = existing.data.programs;
          }
        }

        const now = new Date().toISOString();
        const { coursesCount, lecturesCount } = countTotalCoursesAndLectures(finalPrograms);

        const mergedData = {
          ...data,
          programs: finalPrograms,
          students: finalStudents
        };

        const snapshotPayload: PlatformSnapshot = {
          id: 'latest',
          timestamp: now,
          label: label || `حفظ تلقائي (${new Date().toLocaleTimeString('ar-SA')})`,
          source,
          data: mergedData,
          stats: {
            programsCount: finalPrograms.length,
            coursesCount,
            lecturesCount,
            studentsCount: finalStudents.length
          }
        };

        store.put(snapshotPayload);

        // Also save as timestamped snapshot for historical recovery
        const historySnapshot: PlatformSnapshot = {
          ...snapshotPayload,
          id: `snap-${Date.now()}`
        };
        store.put(historySnapshot);

        // Prune old snapshots to keep newest 20
        const allKeysReq = store.getAllKeys();
        allKeysReq.onsuccess = () => {
          const keys = (allKeysReq.result as string[]).filter(k => k.startsWith('snap-'));
          if (keys.length > 20) {
            keys.sort();
            const toDelete = keys.slice(0, keys.length - 20);
            for (const k of toDelete) {
              store.delete(k);
            }
          }
        };
      };

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('Failed to save snapshot to IndexedDB:', err);
    return false;
  }
}

/**
 * Retrieves the latest persistent snapshot from IndexedDB.
 */
export async function getLatestSnapshotFromIndexedDB(): Promise<PlatformSnapshot | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get('latest');

    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Failed to get latest snapshot from IndexedDB:', err);
    return null;
  }
}

/**
 * Retrieves all stored snapshots for display in the Backup Recovery Center.
 */
export async function getAllSnapshotsFromIndexedDB(): Promise<PlatformSnapshot[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    return new Promise((resolve) => {
      req.onsuccess = () => {
        const results = (req.result as PlatformSnapshot[] || [])
          .filter(s => s.id !== 'latest')
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(results);
      };
      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('Failed to get all snapshots from IndexedDB:', err);
    return [];
  }
}

/**
 * Restores a specific snapshot by its ID.
 */
export async function getSnapshotByIdFromIndexedDB(id: string): Promise<PlatformSnapshot | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);

    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn(`Failed to get snapshot ${id} from IndexedDB:`, err);
    return null;
  }
}

/**
 * Clears all snapshots from IndexedDB for a complete clean reset.
 */
export async function clearAllSnapshotsFromIndexedDB(): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('Failed to clear snapshots from IndexedDB:', err);
    return false;
  }
}

/**
 * Exports the entire database to a downloadable JSON file.
 */
export function downloadDatabaseJsonFile(data: any, fileNamePrefix = 'future_center_backup') {
  try {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
    const filename = `${fileNamePrefix}_${dateStr}_${timeStr}.json`;

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  } catch (e) {
    console.error('Error downloading database JSON file:', e);
    return false;
  }
}
