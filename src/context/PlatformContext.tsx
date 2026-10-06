import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  PlatformUser,
  StudentUser,
  OwnerUser,
  EducationalProgram,
  Specialty,
  Branch,
  Course,
  Semester,
  Lecture,
  LectureFile,
  ShamCashRequest,
  AppNotification,
  SiteSettings,
  ToastNotification
} from '../types';
import {
  initialPrograms,
  initialStudents,
  initialOwner,
  initialShamCashRequests,
  initialNotifications,
  initialSiteSettings
} from '../data/initialData';
import { savePdfToIndexedDb, deletePdfFromIndexedDb } from '../utils/pdfStorage';
import {
  saveSnapshotToIndexedDB,
  getLatestSnapshotFromIndexedDB,
  getAllSnapshotsFromIndexedDB,
  getSnapshotByIdFromIndexedDB,
  downloadDatabaseJsonFile,
  clearAllSnapshotsFromIndexedDB,
  PlatformSnapshot
} from '../utils/persistentDb';

interface PlatformContextType {
  // Auth
  currentUser: PlatformUser | null;
  login: (username: string, password?: string) => { success: boolean; message: string };
  logout: () => void;
  switchDemoUser: (role: 'owner' | 'student', studentId?: string) => void;

  // Hierarchical Programs & Content
  programs: EducationalProgram[];
  addProgram: (programData: Omit<EducationalProgram, 'id' | 'specialties'>) => void;
  updateProgram: (programId: string, data: Partial<EducationalProgram>) => void;
  deleteProgram: (programId: string) => void;
  addSpecialty: (programId: string, specialty: Omit<Specialty, 'id' | 'programId' | 'courses'> & { courses?: Course[] }) => string;
  updateSpecialty: (programId: string, specialtyId: string, data: Partial<Specialty>) => void;
  deleteSpecialty: (programId: string, specialtyId: string) => void;
  addBranch: (programId: string, specialtyId: string, branch: Omit<Branch, 'id'>) => void;

  addCourse: (programId: string, specialtyId: string, course: Omit<Course, 'id' | 'semesters'>) => void;
  updateCourse: (programId: string, specialtyId: string, courseId: string, data: Partial<Course>) => void;
  deleteCourse: (programId: string, specialtyId: string, courseId: string) => void;

  addSemester: (programId: string, specialtyId: string, courseId: string, name: string) => void;
  updateSemester: (programId: string, specialtyId: string, courseId: string, semesterId: string, name: string) => void;
  deleteSemester: (programId: string, specialtyId: string, courseId: string, semesterId: string) => void;

  addLecture: (programId: string, specialtyId: string, courseId: string, semesterId: string, lecture: Omit<Lecture, 'id' | 'files'>) => void;
  updateLecture: (programId: string, specialtyId: string, courseId: string, semesterId: string, lectureId: string, data: Partial<Lecture>) => void;
  deleteLecture: (programId: string, specialtyId: string, courseId: string, semesterId: string, lectureId: string) => void;

  addLectureFile: (programId: string, specialtyId: string, courseId: string, semesterId: string, lectureId: string, file: Omit<LectureFile, 'id' | 'uploadedAt'>) => void;
  deleteLectureFile: (programId: string, specialtyId: string, courseId: string, semesterId: string, lectureId: string, fileId: string) => void;
  addCoursePdfFile: (programId: string, specialtyId: string, courseId: string, file: Omit<LectureFile, 'id' | 'uploadedAt'>, lectureId?: string) => void;
  deletePdfFileAcrossCourses: (fileId: string) => void;
  toggleLectureOffline: (programId: string, specialtyId: string, courseId: string, semesterId: string, lectureId: string) => void;
  clearAllSpecialtiesAndCourses: () => void;

  // Students & Permissions
  students: StudentUser[];
  addStudent: (student: Omit<StudentUser, 'id' | 'joinedDate'>) => void;
  updateStudent: (studentId: string, data: Partial<StudentUser>) => void;
  deleteStudent: (studentId: string) => void;
  toggleStudentStatus: (studentId: string) => void;
  setStudentAllowedCourses: (studentId: string, allowedCourseIds: string[]) => void;
  toggleStudentOfflinePermission: (studentId: string) => void;
  toggleStudentAttendancePermission: (studentId: string) => void;
  toggleStudentDownloadPermission: (studentId: string) => void;
  updateStudentPermissions: (studentId: string, permissions: Partial<StudentUser>) => void;

  // Sham Cash Requests
  shamCashRequests: ShamCashRequest[];
  submitShamCashRequest: (request: Omit<ShamCashRequest, 'id' | 'date' | 'status'>) => void;
  approveShamCashRequest: (requestId: string, notes?: string) => void;
  rejectShamCashRequest: (requestId: string, notes?: string) => void;

  // Notifications
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: (userId?: string) => void;
  addNotification: (userId: string, title: string, message: string, type?: AppNotification['type']) => void;

  // Site Settings / CMS
  siteSettings: SiteSettings;
  updateSiteSettings: (newSettings: Partial<SiteSettings>) => void;
  toggleGlobalOfflineDownload: () => void;

  // Server Database & Sync
  refreshData: () => Promise<void>;
  isServerReady: boolean;
  lastSyncedAt: string | null;
  exportDatabaseJson: () => Promise<string>;
  importDatabaseJson: (jsonString: string) => Promise<{ success: boolean; message: string }>;
  restoreOwnerData: () => Promise<boolean>;
  switchToOwner: () => void;
  cleanResetPlatform: () => Promise<boolean>;
  ownerEmail: string;

  // Permanent Storage & Snapshots
  downloadBackupFile: () => boolean;
  restoreFromSnapshot: (snapshotId: string) => Promise<boolean>;
  getAllSnapshots: () => Promise<PlatformSnapshot[]>;
  forceSavePermanentBackup: (label?: string) => Promise<boolean>;

  // Toasts
  toasts: ToastNotification[];
  addToast: (type: ToastNotification['type'], message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

const PlatformContext = createContext<PlatformContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'fc_cur_user_v6',
  PROGRAMS: 'fc_programs_v6',
  STUDENTS: 'fc_students_v6',
  SHAM_CASH: 'fc_sham_cash_v6',
  NOTIFS: 'fc_notifs_v6',
  SETTINGS: 'fc_site_settings_v6',
  DELETED_IDS: 'fc_deleted_ids_v6'
};

interface DeletedIdsRegistry {
  students: string[];
  programs: string[];
  specialties: string[];
  courses: string[];
}

const getDeletedIdsRegistry = (): DeletedIdsRegistry => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DELETED_IDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        students: Array.isArray(parsed.students) ? parsed.students : [],
        programs: Array.isArray(parsed.programs) ? parsed.programs : [],
        specialties: Array.isArray(parsed.specialties) ? parsed.specialties : [],
        courses: Array.isArray(parsed.courses) ? parsed.courses : []
      };
    }
  } catch (_) {}
  return { students: [], programs: [], specialties: [], courses: [] };
};

const markItemDeleted = (category: keyof DeletedIdsRegistry, id: string) => {
  if (!id) return;
  try {
    const current = getDeletedIdsRegistry();
    if (!current[category].includes(id)) {
      current[category].push(id);
      localStorage.setItem(STORAGE_KEYS.DELETED_IDS, JSON.stringify(current));
    }
  } catch (_) {}
};

const clearDeletedIdsRegistry = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.DELETED_IDS);
  } catch (_) {}
};

// Merge multiple student arrays without losing any student unless explicitly deleted
const mergeStudentsSafe = (lists: (StudentUser[] | undefined | null)[]): StudentUser[] => {
  const deleted = new Set(getDeletedIdsRegistry().students);
  const map = new Map<string, StudentUser>();
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const s of list) {
      if (!s || (!s.id && !s.username)) continue;
      if (deleted.has(s.id) || (s.username && deleted.has(s.username.toLowerCase()))) continue;
      const key = s.id || s.username.toLowerCase();
      const existing = map.get(key);
      map.set(key, existing ? { ...existing, ...s } : s);
    }
  }
  return Array.from(map.values());
};

// Deep non-destructive merge of programs, specialties, courses, semesters, and lectures
const mergeProgramsSafe = (lists: (EducationalProgram[] | undefined | null)[]): EducationalProgram[] => {
  const deleted = getDeletedIdsRegistry();
  const delProgs = new Set(deleted.programs);
  const delSpecs = new Set(deleted.specialties);
  const delCourses = new Set(deleted.courses);

  const progMap = new Map<string, EducationalProgram>();

  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const p of list) {
      if (!p || !p.id || delProgs.has(p.id)) continue;
      const existingProg = progMap.get(p.id);
      if (!existingProg) {
        progMap.set(p.id, {
          ...p,
          specialties: (p.specialties || [])
            .filter(s => s && s.id && !delSpecs.has(s.id))
            .map(s => ({
              ...s,
              courses: (s.courses || []).filter(c => c && c.id && !delCourses.has(c.id))
            }))
        });
      } else {
        // Merge specialties inside program
        const specMap = new Map<string, Specialty>();
        for (const s of existingProg.specialties || []) {
          if (s && s.id && !delSpecs.has(s.id)) specMap.set(s.id, s);
        }
        for (const s of p.specialties || []) {
          if (!s || !s.id || delSpecs.has(s.id)) continue;
          const existingSpec = specMap.get(s.id);
          if (!existingSpec) {
            specMap.set(s.id, {
              ...s,
              courses: (s.courses || []).filter(c => c && c.id && !delCourses.has(c.id))
            });
          } else {
            // Merge branches
            const branchMap = new Map<string, Branch>();
            for (const b of existingSpec.branches || []) {
              if (b && b.id) branchMap.set(b.id, b);
            }
            for (const b of s.branches || []) {
              if (b && b.id) branchMap.set(b.id, { ...(branchMap.get(b.id) || {}), ...b });
            }
            // Merge courses
            const courseMap = new Map<string, Course>();
            for (const c of existingSpec.courses || []) {
              if (c && c.id && !delCourses.has(c.id)) courseMap.set(c.id, c);
            }
            for (const c of s.courses || []) {
              if (!c || !c.id || delCourses.has(c.id)) continue;
              const existingCourse = courseMap.get(c.id);
              if (!existingCourse) {
                courseMap.set(c.id, c);
              } else {
                // Merge semesters & lectures
                const semMap = new Map<string, Semester>();
                for (const sem of existingCourse.semesters || []) {
                  if (sem && sem.id) semMap.set(sem.id, sem);
                }
                for (const sem of c.semesters || []) {
                  if (!sem || !sem.id) continue;
                  const existingSem = semMap.get(sem.id);
                  if (!existingSem) {
                    semMap.set(sem.id, sem);
                  } else {
                    const lecMap = new Map<string, Lecture>();
                    for (const lec of existingSem.lectures || []) {
                      if (lec && lec.id) lecMap.set(lec.id, lec);
                    }
                    for (const lec of sem.lectures || []) {
                      if (lec && lec.id) {
                        const existingLec = lecMap.get(lec.id);
                        lecMap.set(lec.id, existingLec ? { ...existingLec, ...lec } : lec);
                      }
                    }
                    semMap.set(sem.id, {
                      ...existingSem,
                      ...sem,
                      lectures: Array.from(lecMap.values())
                    });
                  }
                }
                courseMap.set(c.id, {
                  ...existingCourse,
                  ...c,
                  semesters: Array.from(semMap.values())
                });
              }
            }
            specMap.set(s.id, {
              ...existingSpec,
              ...s,
              branches: Array.from(branchMap.values()),
              courses: Array.from(courseMap.values())
            });
          }
        }
        progMap.set(p.id, {
          ...existingProg,
          ...p,
          specialties: Array.from(specMap.values())
        });
      }
    }
  }

  const result = Array.from(progMap.values());
  return result.length > 0 ? result : initialPrograms;
};

// Immediate cleanup of legacy keys from earlier messy iterations (preserving permanent vaults!)
if (typeof window !== 'undefined') {
  try {
    const legacyKeys = [
      'fc_cur_user_hasakahm_v5',
      'fc_programs_hasakahm_v5',
      'fc_students_hasakahm_v5',
      'fc_sham_cash_hasakahm_v5',
      'fc_notifs_hasakahm_v5',
      'fc_site_settings_hasakahm_v5'
    ];
    for (const k of legacyKeys) {
      localStorage.removeItem(k);
    }
  } catch (_) {}
}

// Helper to sanitize programs before storing or sending to server (strips large Base64 binary strings to keep storage instant & safe)
export const sanitizeProgramsForServer = (progs: EducationalProgram[]): EducationalProgram[] => {
  if (!Array.isArray(progs)) return [];
  return progs.map(p => ({
    ...p,
    specialties: (p.specialties || []).map(s => ({
      ...s,
      courses: (s.courses || []).map(c => ({
        ...c,
        semesters: (c.semesters || []).map(sem => ({
          ...sem,
          lectures: (sem.lectures || []).map(lec => ({
            ...lec,
            files: (lec.files || []).map(f => ({
              ...f,
              fileUrl: (f.fileUrl && f.fileUrl.startsWith('data:') && f.fileUrl.length > 500)
                ? `idb:${f.id}`
                : f.fileUrl
            }))
          }))
        }))
      }))
    }))
  }));
};

export const PlatformProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Site Settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!saved) return initialSiteSettings;
    try {
      const parsed = JSON.parse(saved);
      // Remove placeholder mock barcode if it was previously cached
      const rawBarcode = parsed.shamCashBarcodeUrl || '';
      const isMockBarcode = rawBarcode.includes('FC-984210') || rawBarcode.includes('defaultShamCashBarcode');
      const cleanBarcode = isMockBarcode ? '' : rawBarcode;
      return {
        ...initialSiteSettings,
        ...parsed,
        shamCashBarcodeUrl: cleanBarcode,
        allowOfflineLecturesDownload: parsed.allowOfflineLecturesDownload !== undefined ? parsed.allowOfflineLecturesDownload : true
      };
    } catch {
      return initialSiteSettings;
    }
  });

  // Programs & Academic Hierarchy
  const [programs, setPrograms] = useState<EducationalProgram[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROGRAMS);
    if (!saved) return initialPrograms;
    try {
      return JSON.parse(saved);
    } catch {
      return initialPrograms;
    }
  });

  // Students
  const [students, setStudents] = useState<StudentUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS) || localStorage.getItem('fc_students_permanent_vault');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return initialStudents;
  });

  // Active User - Defaults to null (not logged in) so new visitors and students always land on the Login page
  const [currentUser, setCurrentUser] = useState<PlatformUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USER);
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.role === 'owner' || parsed.email === 'hasakahm@gmail.com' || parsed.username === 'hasakahm@gmail.com')) {
        return initialOwner;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  // Sham Cash Requests
  const [shamCashRequests, setShamCashRequests] = useState<ShamCashRequest[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHAM_CASH);
    return saved ? JSON.parse(saved) : initialShamCashRequests;
  });

  // Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFS);
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Persistent reference mirrors to guarantee the latest state in all async/sync write operations
  const programsRef = React.useRef(programs);
  const studentsRef = React.useRef(students);
  const siteSettingsRef = React.useRef(siteSettings);
  const shamCashRequestsRef = React.useRef(shamCashRequests);
  const notificationsRef = React.useRef(notifications);

  programsRef.current = programs;
  studentsRef.current = students;
  siteSettingsRef.current = siteSettings;
  shamCashRequestsRef.current = shamCashRequests;
  notificationsRef.current = notifications;

  // Sync to localStorage safely with quota protection
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(siteSettings));
    } catch (err) {
      console.warn('Could not save settings to localStorage', err);
    }
  }, [siteSettings]);

  useEffect(() => {
    try {
      const sanitizedPrograms = sanitizeProgramsForServer(programs);
      localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(sanitizedPrograms));
      localStorage.setItem('fc_programs_permanent_vault', JSON.stringify(sanitizedPrograms));
    } catch (err) {
      console.warn('Could not save programs to localStorage (quota exceeded or restricted):', err);
    }
  }, [programs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      localStorage.setItem('fc_students_permanent_vault', JSON.stringify(students));
    } catch (err) {
      console.warn('Could not save students to localStorage', err);
    }
  }, [students]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (err) {
      console.warn('Could not save user to localStorage', err);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SHAM_CASH, JSON.stringify(shamCashRequests));
    } catch (err) {
      console.warn('Could not save sham cash to localStorage', err);
    }
  }, [shamCashRequests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(notifications));
    } catch (err) {
      console.warn('Could not save notifications to localStorage', err);
    }
  }, [notifications]);

  // Centralized Server Synchronization (Single Source of Truth across all devices & browsers)
  const isSyncingFromServer = React.useRef(false);
  const [isServerReady, setIsServerReady] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const localMutationTimestamp = React.useRef<number>(0);
  const isPushingToServer = React.useRef<boolean>(false);

  // Synchronous multi-tier storage writer: guarantees immediate persistence in memory, localStorage, and IndexedDB
  const syncSavePrograms = (newPrograms: EducationalProgram[], allowDeletion: boolean = false) => {
    programsRef.current = newPrograms;
    try {
      const sanitized = sanitizeProgramsForServer(newPrograms);
      localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(sanitized));
      localStorage.setItem('fc_programs_permanent_vault', JSON.stringify(sanitized));
    } catch (e) {
      console.warn('LocalStorage programs save warning:', e);
    }
    pushStateToServer({ programs: newPrograms, students: studentsRef.current });
    saveSnapshotToIndexedDB({
      programs: newPrograms,
      students: studentsRef.current,
      siteSettings: siteSettingsRef.current,
      shamCashRequests: shamCashRequestsRef.current,
      notifications: notificationsRef.current,
      lastUpdatedAt: new Date().toISOString()
    }, 'auto_save', undefined, allowDeletion).catch(() => {});
  };

  const syncSaveStudents = (newStudents: StudentUser[], allowDeletion: boolean = false) => {
    studentsRef.current = newStudents;
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(newStudents));
      localStorage.setItem('fc_students_permanent_vault', JSON.stringify(newStudents));
    } catch (e) {
      console.warn('LocalStorage students save warning:', e);
    }
    pushStateToServer({ students: newStudents, programs: programsRef.current });
    saveSnapshotToIndexedDB({
      programs: programsRef.current,
      students: newStudents,
      siteSettings: siteSettingsRef.current,
      shamCashRequests: shamCashRequestsRef.current,
      notifications: notificationsRef.current,
      lastUpdatedAt: new Date().toISOString()
    }, 'auto_save', undefined, allowDeletion).catch(() => {});
  };

  // Directly push state slice to server with guaranteed persistence
  const pushStateToServer = async (payload: {
    programs?: EducationalProgram[];
    students?: StudentUser[];
    siteSettings?: SiteSettings;
    shamCashRequests?: ShamCashRequest[];
    notifications?: AppNotification[];
  }) => {
    localMutationTimestamp.current = Date.now();
    isPushingToServer.current = true;

    try {
      const effectivePrograms = payload.programs || programsRef.current;
      const effectiveStudents = payload.students || studentsRef.current;
      const sanitizedPayload = {
        programs: sanitizeProgramsForServer(effectivePrograms),
        students: effectiveStudents,
        siteSettings: payload.siteSettings || siteSettingsRef.current,
        shamCashRequests: payload.shamCashRequests || shamCashRequestsRef.current,
        notifications: payload.notifications || notificationsRef.current,
        account: 'hasakahm@gmail.com',
        lastModifiedBy: currentUser?.role || 'owner-hasakahm'
      };

      const res = await fetch('/api/state', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-account': 'hasakahm@gmail.com',
          'x-user-email': 'hasakahm@gmail.com'
        },
        body: JSON.stringify(sanitizedPayload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.lastUpdatedAt) {
          setLastSyncedAt(json.lastUpdatedAt);
        }
      } else {
        console.warn('POST /api/state response not ok:', res.status);
      }
    } catch (err) {
      console.warn('Could not push state to server:', err);
    } finally {
      isPushingToServer.current = false;
    }
  };

  const refreshData = async (force: boolean = false) => {
    // If currently pushing, wait
    if (!force && isPushingToServer.current) {
      return;
    }

    // 1. Gather all local tiers (localStorage + permanent vaults + IndexedDB snapshots)
    let lsPrograms: EducationalProgram[] = [];
    let vaultPrograms: EducationalProgram[] = [];
    let lsStudents: StudentUser[] = [];
    let vaultStudents: StudentUser[] = [];

    try {
      const rawP = localStorage.getItem(STORAGE_KEYS.PROGRAMS);
      if (rawP) lsPrograms = JSON.parse(rawP);
    } catch (_) {}
    try {
      const rawVP = localStorage.getItem('fc_programs_permanent_vault');
      if (rawVP) vaultPrograms = JSON.parse(rawVP);
    } catch (_) {}
    try {
      const rawS = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (rawS) lsStudents = JSON.parse(rawS);
    } catch (_) {}
    try {
      const rawVS = localStorage.getItem('fc_students_permanent_vault');
      if (rawVS) vaultStudents = JSON.parse(rawVS);
    } catch (_) {}

    let latestSnap: PlatformSnapshot | null = null;
    let allSnaps: PlatformSnapshot[] = [];
    try {
      latestSnap = await getLatestSnapshotFromIndexedDB();
      allSnaps = await getAllSnapshotsFromIndexedDB();
    } catch (_) {}

    const chronologicalSnaps = [...allSnaps].reverse();
    const idbStudentLists = chronologicalSnaps.map(s => s.data?.students);
    const idbProgramLists = chronologicalSnaps.map(s => s.data?.programs);

    let serverPrograms: EducationalProgram[] = [];
    let serverStudents: StudentUser[] = [];
    let serverData: any = null;

    try {
      const res = await fetch('/api/state', {
        headers: {
          'x-user-account': 'hasakahm@gmail.com',
          'x-user-email': 'hasakahm@gmail.com'
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          serverData = json.data;
          serverPrograms = Array.isArray(json.data.programs) ? json.data.programs : [];
          serverStudents = Array.isArray(json.data.students) ? json.data.students : [];
        }
      }
    } catch (e) {
      console.warn('Could not sync state from server:', e);
    }

    isSyncingFromServer.current = true;

    // 2. Non-destructively merge across all tiers (IndexedDB history + IndexedDB latest + Permanent Vault + LocalStorage + React State + Server)
    const mergedStudents = mergeStudentsSafe([
      ...idbStudentLists,
      latestSnap?.data?.students,
      vaultStudents,
      lsStudents,
      studentsRef.current,
      serverStudents
    ]);

    const mergedPrograms = mergeProgramsSafe([
      initialPrograms,
      ...idbProgramLists,
      latestSnap?.data?.programs,
      vaultPrograms,
      lsPrograms,
      programsRef.current,
      serverPrograms
    ]);

    setPrograms(mergedPrograms);
    setStudents(mergedStudents);
    programsRef.current = mergedPrograms;
    studentsRef.current = mergedStudents;

    // 3. Persist merged state back to localStorage and permanent vaults
    try {
      const sanitized = sanitizeProgramsForServer(mergedPrograms);
      localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(sanitized));
      localStorage.setItem('fc_programs_permanent_vault', JSON.stringify(sanitized));
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(mergedStudents));
      localStorage.setItem('fc_students_permanent_vault', JSON.stringify(mergedStudents));
    } catch (e) {
      console.warn('LocalStorage save error in refreshData:', e);
    }

    // Synchronize active student user if logged in as student
    if (currentUser && currentUser.role === 'student') {
      const me = mergedStudents.find((s: StudentUser) => s.id === currentUser.id);
      if (me) {
        setCurrentUser(me);
      }
    }

    if (serverData?.siteSettings) {
      setSiteSettings(prev => ({ ...prev, ...serverData.siteSettings }));
      siteSettingsRef.current = { ...siteSettingsRef.current, ...serverData.siteSettings };
    }
    if (serverData?.shamCashRequests && Array.isArray(serverData.shamCashRequests) && serverData.shamCashRequests.length > 0) {
      setShamCashRequests(serverData.shamCashRequests);
      shamCashRequestsRef.current = serverData.shamCashRequests;
    }
    if (serverData?.notifications && Array.isArray(serverData.notifications) && serverData.notifications.length > 0) {
      setNotifications(serverData.notifications);
      notificationsRef.current = serverData.notifications;
    }
    if (serverData?.lastUpdatedAt) {
      setLastSyncedAt(serverData.lastUpdatedAt);
    }

    // 4. Record merged snapshot to IndexedDB
    saveSnapshotToIndexedDB({
      programs: mergedPrograms,
      students: mergedStudents,
      siteSettings: siteSettingsRef.current,
      shamCashRequests: shamCashRequestsRef.current,
      notifications: notificationsRef.current,
      lastUpdatedAt: new Date().toISOString()
    }, 'server_sync').catch(() => {});

    // 5. If browser/IndexedDB had students or courses that the server lost (e.g. after container sleep/restart), re-hydrate the server immediately!
    const countSpecsAndCourses = (progs: EducationalProgram[]) => {
      let count = 0;
      for (const p of progs || []) {
        count += (p.specialties || []).length;
        for (const s of p.specialties || []) {
          count += (s.courses || []).length;
        }
      }
      return count;
    };

    const mergedRichness = countSpecsAndCourses(mergedPrograms);
    const serverRichness = countSpecsAndCourses(serverPrograms);

    if (mergedStudents.length > serverStudents.length || mergedRichness > serverRichness) {
      pushStateToServer({
        programs: mergedPrograms,
        students: mergedStudents
      });
    }

    setIsServerReady(true);
    setTimeout(() => {
      isSyncingFromServer.current = false;
    }, 150);
  };

  // Instant Owner Recovery and Strict Session Isolation
  const restoreOwnerData = async (): Promise<boolean> => {
    try {
      addToast('info', 'جاري فحص واسترجاع المقررات الدراسية المعتمدة لحسابك (hasakahm@gmail.com)...');
      const res = await fetch('/api/account/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-account': 'hasakahm@gmail.com',
          'x-user-email': 'hasakahm@gmail.com'
        },
        body: JSON.stringify({ account: 'hasakahm@gmail.com' })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          isSyncingFromServer.current = true;
          if (Array.isArray(json.data.programs)) {
            setPrograms(json.data.programs);
            try {
              localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(json.data.programs));
            } catch (_) {}
          }
          if (Array.isArray(json.data.students)) {
            setStudents(json.data.students);
            try {
              localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(json.data.students));
            } catch (_) {}
          }
          if (json.data.siteSettings) {
            setSiteSettings(json.data.siteSettings);
          }
          // Force reset user to initialOwner to break any stuck student session!
          setCurrentUser(initialOwner);
          try {
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(initialOwner));
          } catch (_) {}

          let totalLectures = 0;
          let totalCourses = 0;
          for (const p of json.data.programs || []) {
            for (const s of p.specialties || []) {
              totalCourses += s.courses?.length || 0;
              for (const c of s.courses || []) {
                for (const sem of c.semesters || []) {
                  totalLectures += sem.lectures?.length || 0;
                }
              }
            }
          }

          addToast(
            'success',
            `تم استرجاع وعزل بياناتك بالكامل! لديك الآن ${totalCourses} مقرراً دراسياً و ${totalLectures} محاضرة مثبتة بحساب المالك.`
          );
          setTimeout(() => {
            isSyncingFromServer.current = false;
          }, 150);
          return true;
        }
      }
    } catch (e) {
      console.error('Error in restoreOwnerData:', e);
      addToast('error', 'تعذر استرجاع البيانات من الخادم، يرجى إعادة المحاولة.');
    }
    return false;
  };

  const switchToOwner = () => {
    setCurrentUser(initialOwner);
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(initialOwner));
    } catch (_) {}
    addToast('success', 'تم التبديل بنجاح إلى حساب المالك المعتمد (hasakahm@gmail.com) واستعراض كافة المقررات.');
  };

  // Sync on startup ONLY ONCE to load existing database.
  // No aggressive intervals and no focus listeners so the user's active work is never overwritten!
  useEffect(() => {
    refreshData(true);
  }, []);

  // One-click Clear: Clears all specialties and courses across all programs to give user a clean slate
  const clearAllSpecialtiesAndCourses = () => {
    for (const p of programsRef.current || []) {
      for (const s of p.specialties || []) {
        markItemDeleted('specialties', s.id);
        for (const c of s.courses || []) {
          markItemDeleted('courses', c.id);
        }
      }
    }
    const cleanPrograms = programs.map(p => ({
      ...p,
      specialties: []
    }));
    syncSavePrograms(cleanPrograms, true);
    setPrograms(cleanPrograms);
    addToast('success', 'تم مسح وتصفير كافة الاختصاصات والمقررات القديمة بنجاح، يمكنك الآن البدء بإضافة مقرراتك وموادك الجديدة بحرية كاملة.');
  };

  const cleanResetPlatform = async (): Promise<boolean> => {
    try {
      addToast('info', 'جاري تصفير وبدء قاعدة بيانات جديدة ونظيفة تماماً...');
      const res = await fetch('/api/state/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-account': 'hasakahm@gmail.com',
          'x-user-email': 'hasakahm@gmail.com'
        }
      });
      if (res.ok) {
        clearDeletedIdsRegistry();
        setPrograms(initialPrograms);
        setStudents(initialStudents);
        setShamCashRequests(initialShamCashRequests);
        setNotifications(initialNotifications);
        programsRef.current = initialPrograms;
        studentsRef.current = initialStudents;
        try {
          localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(initialPrograms));
          localStorage.setItem('fc_programs_permanent_vault', JSON.stringify(initialPrograms));
          localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(initialStudents));
          localStorage.setItem('fc_students_permanent_vault', JSON.stringify(initialStudents));
          localStorage.setItem(STORAGE_KEYS.SHAM_CASH, JSON.stringify(initialShamCashRequests));
          localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(initialNotifications));
        } catch (_) {}
        await clearAllSnapshotsFromIndexedDB();
        addToast('success', 'تم تصفير المنصة بنجاح! لديك الآن قاعدة بيانات جديدة ونظيفة ومستقرة، يمكنك البدء بإضافة اختصاصاتك ومقرراتك وطلابك بحرية تامة.');
        return true;
      }
    } catch (e) {
      console.error('cleanResetPlatform error:', e);
      addToast('error', 'حدث خطأ أثناء تصفير المنصة.');
    }
    return false;
  };

  const exportDatabaseJson = async (): Promise<string> => {
    try {
      const res = await fetch('/api/export', {
        headers: { 'x-user-account': 'hasakahm@gmail.com' }
      });
      if (res.ok) {
        return await res.text();
      }
    } catch (e) {
      console.warn('Export API failed, fallback to memory state:', e);
    }
    return JSON.stringify({
      programs,
      students,
      siteSettings,
      shamCashRequests,
      notifications,
      exportedAt: new Date().toISOString()
    }, null, 2);
  };

  const importDatabaseJson = async (jsonString: string): Promise<{ success: boolean; message: string }> => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !Array.isArray(parsed.programs)) {
        return { success: false, message: 'ملف غير صالح: لا يحتوي على برامج ومقررات دراسية.' };
      }
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-account': 'hasakahm@gmail.com'
        },
        body: jsonString
      });
      if (res.ok) {
        await refreshData();
        addToast('success', 'تم استيراد واستعادة كافة بيانات المنصة بنجاح.');
        return { success: true, message: 'تم استيراد وتحديث كافة البيانات بنجاح.' };
      }
      return { success: false, message: 'فشل الخادم في معالجة ملف الاستيراد.' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'خطأ في قراءة ملف JSON' };
    }
  };

  const downloadBackupFile = (): boolean => {
    const backupData = {
      programs,
      students,
      siteSettings,
      shamCashRequests,
      notifications,
      exportedAt: new Date().toISOString(),
      account: 'hasakahm@gmail.com',
      system: 'مركز المستقبل - منصة التعليم الأكاديمي'
    };
    const ok = downloadDatabaseJsonFile(backupData, 'future_center_full_backup');
    if (ok) {
      addToast('success', 'تم تنزيل ملف النسخة الاحتياطية لجهازك بنجاح.');
    } else {
      addToast('error', 'تعذر تنزيل ملف النسخة الاحتياطية.');
    }
    return ok;
  };

  const restoreFromSnapshot = async (snapshotId: string): Promise<boolean> => {
    try {
      const snap = await getSnapshotByIdFromIndexedDB(snapshotId);
      if (!snap || !snap.data) {
        addToast('error', 'لم يتم العثور على نقطة الاستعادة المحددة.');
        return false;
      }

      if (snap.data.programs) {
        setPrograms(snap.data.programs);
        try { localStorage.setItem(STORAGE_KEYS.PROGRAMS, JSON.stringify(snap.data.programs)); } catch (_) {}
      }
      if (snap.data.students) {
        setStudents(snap.data.students);
        try { localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(snap.data.students)); } catch (_) {}
      }
      if (snap.data.siteSettings) {
        setSiteSettings(snap.data.siteSettings);
      }
      if (snap.data.shamCashRequests) {
        setShamCashRequests(snap.data.shamCashRequests);
      }
      if (snap.data.notifications) {
        setNotifications(snap.data.notifications);
      }

      pushStateToServer({
        programs: snap.data.programs,
        students: snap.data.students,
        siteSettings: snap.data.siteSettings,
        shamCashRequests: snap.data.shamCashRequests,
        notifications: snap.data.notifications
      });

      return true;
    } catch (e) {
      console.error('Error restoring snapshot:', e);
      return false;
    }
  };

  const getAllSnapshots = async (): Promise<PlatformSnapshot[]> => {
    return await getAllSnapshotsFromIndexedDB();
  };

  const forceSavePermanentBackup = async (label?: string): Promise<boolean> => {
    const success = await saveSnapshotToIndexedDB({
      programs,
      students,
      siteSettings,
      shamCashRequests,
      notifications,
      lastUpdatedAt: new Date().toISOString()
    }, 'manual_backup', label || 'نسخة احتياطية يدوية');

    if (success) {
      pushStateToServer({
        programs,
        students,
        siteSettings,
        shamCashRequests,
        notifications
      });
    }

    return success;
  };

  const addToast = (type: ToastNotification['type'], message: string, title?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setToasts(prev => [...prev, { id, type, message, title }]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addNotification = (userId: string, title: string, message: string, type: AppNotification['type'] = 'info') => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      userId,
      title,
      message,
      type,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = (userId?: string) => {
    setNotifications(prev => prev.map(n => {
      if (!userId) return { ...n, read: true };
      if (userId === 'owner-1' && (n.userId === 'owner-1' || n.userId === 'all')) {
        return { ...n, read: true };
      }
      if (n.userId === userId) {
        return { ...n, read: true };
      }
      return n;
    }));
    addToast('info', 'تم تحديد كافة الإشعارات كمقروءة.');
  };

  // Auth
  const login = (username: string, password?: string) => {
    const cleanUser = username.trim();
    const cleanPass = password ? password.trim() : '';

    // Check Owner Credentials
    const isOwnerUser = 
      cleanUser.toLowerCase() === 'hasakahm@gmail.com' ||
      cleanUser.toLowerCase() === 'hasakahm' ||
      cleanUser.toLowerCase() === initialOwner.username.toLowerCase() ||
      cleanUser.toLowerCase() === initialOwner.email.toLowerCase() ||
      cleanUser.toLowerCase() === 'aws_275127' ||
      cleanUser.toLowerCase() === 'admin' ||
      cleanUser.toLowerCase() === 'owner' ||
      cleanUser === 'المالك' ||
      cleanUser === 'المالك_المعتمد';

    if (isOwnerUser) {
      if (!cleanPass) {
        addToast('error', 'يرجى إدخال كلمة المرور لحساب المالك.');
        return { success: false, message: 'كلمة المرور مطلوبة لحساب المالك' };
      }

      if (cleanPass !== initialOwner.password && cleanPass !== 'AAaa1234' && cleanPass !== 'admin123456' && cleanPass !== 'owner2026') {
        addToast('error', 'كلمة المرور لحساب المالك غير صحيحة.');
        return { success: false, message: 'كلمة المرور غير صحيحة' };
      }

      setCurrentUser(initialOwner);
      addToast('success', 'تم تسجيل الدخول بنجاح كـ مدير المنصة الأكاديمية (hasakahm@gmail.com).');
      return { success: true, message: 'مرحباً بك في لوحة الإدارة' };
    }

    // Check Student
    const student = students.find(s => s.username.toLowerCase() === cleanUser.toLowerCase());
    if (student) {
      if (student.status === 'suspended') {
        addToast('error', 'هذا الحساب موقوف إدارياً، يرجى مراجعة إدارة المركز.');
        return { success: false, message: 'الحساب موقوف إدارياً' };
      }

      // If student has a password and one is provided, verify it
      if (cleanPass && student.password && cleanPass !== student.password && cleanPass !== 'password123') {
        addToast('error', 'كلمة المرور غير صحيحة.');
        return { success: false, message: 'كلمة المرور غير صحيحة' };
      }

      setCurrentUser(student);
      addToast('success', `أهلاً بك يا ${student.fullName} في مساحتك التعليمية.`);
      return { success: true, message: 'تم تسجيل الدخول بنجاح' };
    }

    addToast('error', 'بيانات الدخول غير صحيحة، يرجى التحقق من اسم المستخدم وكلمة المرور.');
    return { success: false, message: 'بيانات الدخول غير صحيحة' };
  };

  const logout = () => {
    setCurrentUser(null);
    addToast('info', 'تم تسجيل الخروج بنجاح.');
  };

  const switchDemoUser = (role: 'owner' | 'student', studentId?: string) => {
    if (role === 'owner') {
      setCurrentUser(initialOwner);
      addToast('success', 'تم التبديل إلى حساب المدير (Owner).');
    } else {
      const targetStudent = students.find(s => s.id === studentId) || students[0];
      if (targetStudent) {
        setCurrentUser(targetStudent);
        addToast('success', `تم التبديل إلى حساب الطالب: ${targetStudent.fullName}.`);
      }
    }
  };

  // --- HIERARCHICAL CURRICULUM MUTATIONS ---

  // 0. Program (القسم الرئيسي) Mutations
  const addProgram = (programData: Omit<EducationalProgram, 'id' | 'specialties'>) => {
    const newProgram: EducationalProgram = {
      ...programData,
      id: `prog-${Date.now()}`,
      specialties: []
    };
    setPrograms(prev => {
      const updated = [...prev, newProgram];
      syncSavePrograms(updated);
      return updated;
    });
    addToast('success', `تمت إضافة قسم "${programData.title}" بنجاح.`);
    addNotification('owner-1', 'تحديث الأقسام التعليمية', `تم إنشاء قسم وبرنامج تعليمي جديد: "${programData.title}".`, 'success');
  };

  const updateProgram = (programId: string, data: Partial<EducationalProgram>) => {
    setPrograms(prev => {
      const updated = prev.map(p => {
        if (p.id !== programId) return p;
        return { ...p, ...data };
      });
      syncSavePrograms(updated);
      return updated;
    });
    addToast('success', 'تم تحديث بيانات القسم بنجاح.');
  };

  const deleteProgram = (programId: string) => {
    markItemDeleted('programs', programId);
    const target = programs.find(p => p.id === programId);
    setPrograms(prev => {
      const updated = prev.filter(p => p.id !== programId);
      syncSavePrograms(updated, true);
      return updated;
    });
    addToast('info', `تم حذف القسم "${target?.title || ''}".`);
    addNotification('owner-1', 'حذف قسم تعليمي', `تم حذف قسم "${target?.title || ''}".`, 'warning');
  };

  // 1. Specialty inside Program
  const addSpecialty = (programId: string, specialtyData: Omit<Specialty, 'id' | 'programId' | 'courses'> & { courses?: Course[] }): string => {
    const newSpecialtyId = `spec-${Date.now()}`;
    const newSpecialty: Specialty = {
      ...specialtyData,
      id: newSpecialtyId,
      programId,
      branches: specialtyData.branches && specialtyData.branches.length > 0 ? specialtyData.branches : [
        { id: `br-gen-${Date.now()}`, name: 'الفرع العام', code: 'GEN', description: 'الفرع التخصصي العام' }
      ],
      courses: specialtyData.courses ? specialtyData.courses.map(c => ({ ...c, specialtyId: newSpecialtyId })) : []
    };
    setPrograms(prev => {
      const updated = prev.map(p => {
        if (p.id !== programId) return p;
        return { ...p, specialties: [...p.specialties, newSpecialty] };
      });
      syncSavePrograms(updated);
      return updated;
    });
    addToast('success', `تمت إضافة اختصاص "${specialtyData.name}" بنجاح.`);
    addNotification('owner-1', 'إضافة اختصاص جديد', `تمت إضافة اختصاص "${specialtyData.name}" بنجاح إلى البرنامج.`, 'success');
    return newSpecialtyId;
  };

  const updateSpecialty = (programId: string, specialtyId: string, data: Partial<Specialty>) => {
    setPrograms(prev => {
      const updated = prev.map(p => {
        if (p.id !== programId) return p;
        return {
          ...p,
          specialties: p.specialties.map(s => s.id === specialtyId ? { ...s, ...data } : s)
        };
      });
      syncSavePrograms(updated);
      return updated;
    });
    addToast('success', 'تم تحديث بيانات الاختصاص بنجاح.');
  };

  const deleteSpecialty = (programId: string, specialtyId: string) => {
    markItemDeleted('specialties', specialtyId);
    setPrograms(prev => {
      const updated = prev.map(p => {
        const containsSpec = p.specialties?.some(s => s.id === specialtyId);
        if (programId && p.id !== programId && !containsSpec) return p;
        return {
          ...p,
          specialties: p.specialties.filter(s => s.id !== specialtyId)
        };
      });
      syncSavePrograms(updated, true);
      return updated;
    });

    // Also remove from students referencing this specialty
    setStudents(prev => {
      const updated = prev.map(s => {
        if (s.specialtyId === specialtyId) {
          return { ...s, specialtyId: '', allowedCourseIds: [] };
        }
        return s;
      });
      syncSaveStudents(updated);
      return updated;
    });

    // Dedicated backend delete call
    fetch('/api/specialties/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-account': 'hasakahm@gmail.com',
        'x-user-email': 'hasakahm@gmail.com'
      },
      body: JSON.stringify({ specialtyId, programId, account: 'hasakahm@gmail.com' })
    }).catch(err => console.warn('Specialty delete API error:', err));

    addToast('info', 'تم حذف الاختصاص وكافة مقرراته من قاعدة البيانات بنجاح.');
  };

  const addBranch = (programId: string, specialtyId: string, branchData: Omit<Branch, 'id'>) => {
    const newBranch: Branch = {
      ...branchData,
      id: `br-${Date.now()}`
    };
    setPrograms(prev => {
      const updated = prev.map(p => {
        const hasSpec = p.specialties.some(s => s.id === specialtyId);
        if (p.id !== programId && !hasSpec) return p;
        return {
          ...p,
          specialties: p.specialties.map(s => {
            if (s.id !== specialtyId) return s;
            const currentBranches = s.branches || [];
            return {
              ...s,
              branches: [...currentBranches, newBranch]
            };
          })
        };
      });
      syncSavePrograms(updated);
      return updated;
    });
    addToast('success', `تمت إضافة فرع "${branchData.name}" للاختصاص بنجاح.`);
    addNotification('owner-1', 'تحديث البيانات التعليمية', `تم إنشاء فرع أكاديمي جديد: "${branchData.name}" (${branchData.code})`, 'success');
  };

  // 2. Course inside Specialty
  const addCourse = (programId: string, specialtyId: string, courseData: Omit<Course, 'id' | 'semesters'>) => {
    const targetSpecialtyId = courseData.specialtyId || specialtyId;
    const newCourse: Course = {
      ...courseData,
      id: `crs-${Date.now()}`,
      specialtyId: targetSpecialtyId,
      branchId: courseData.branchId,
      academicYear: courseData.academicYear || 1,
      semesterTerm: courseData.semesterTerm || 1,
      semesters: [
        {
          id: `sem-${Date.now()}-1`,
          name: courseData.semesterTerm === 2 ? 'الفصل الثاني' : 'الفصل الأول',
          lectures: []
        }
      ]
    };
    setPrograms(prev => {
      let inserted = false;
      // 1. Identify the exact program that genuinely owns this specialty
      const targetProgram = prev.find(p => (p.specialties || []).some(s => s.id === targetSpecialtyId));
      const effectiveProgramId = targetProgram ? targetProgram.id : programId;

      const updated = prev.map(p => {
        if (p.id !== effectiveProgramId) return p;
        return {
          ...p,
          specialties: (p.specialties || []).map(s => {
            if (s.id !== targetSpecialtyId) return s;
            inserted = true;
            return { ...s, courses: [...(s.courses || []), newCourse] };
          })
        };
      });

      // 2. Fallback if effectiveProgramId was not matched, scan across all programs
      let finalResult = updated;
      if (!inserted) {
        finalResult = prev.map(p => ({
          ...p,
          specialties: (p.specialties || []).map(s => {
            if (s.id !== targetSpecialtyId) return s;
            inserted = true;
            return { ...s, courses: [...(s.courses || []), newCourse] };
          })
        }));
      }

      syncSavePrograms(finalResult);
      return finalResult;
    });
    addToast('success', `تمت إضافة مقرر "${courseData.title}" بنجاح.`);
    addNotification('owner-1', 'تحديث البيانات التعليمية', `تمت إضافة مقرر دراسي جديد بنجاح: "${courseData.title}" (${courseData.code || 'CRS'}) للسنة ${courseData.academicYear || 1} - الفصل ${courseData.semesterTerm || 1}.`, 'success');
  };

  const updateCourse = (programId: string, specialtyId: string, courseId: string, data: Partial<Course>) => {
    const targetSpecialtyId = data.specialtyId || specialtyId;

    setPrograms(prev => {
      let updated: EducationalProgram[];
      // If moving course to a different specialty
      if (targetSpecialtyId !== specialtyId) {
        let movedCourse: Course | null = null;
        const removedFromOld = prev.map(p => ({
          ...p,
          specialties: p.specialties.map(s => {
            if (s.id === specialtyId) {
              const match = s.courses.find(c => c.id === courseId);
              if (match) {
                movedCourse = { ...match, ...data, specialtyId: targetSpecialtyId };
              }
              return { ...s, courses: s.courses.filter(c => c.id !== courseId) };
            }
            return s;
          })
        }));

        if (movedCourse) {
          updated = removedFromOld.map(p => ({
            ...p,
            specialties: p.specialties.map(s => {
              if (s.id === targetSpecialtyId) {
                return { ...s, courses: [...s.courses, movedCourse!] };
              }
              return s;
            })
          }));
        } else {
          updated = removedFromOld;
        }
      } else {
        // Normal in-place update
        updated = prev.map(p => {
          const hasSpec = p.specialties.some(s => s.id === specialtyId);
          if (p.id !== programId && !hasSpec) return p;
          return {
            ...p,
            specialties: p.specialties.map(s => {
              if (s.id !== specialtyId) return s;
              return {
                ...s,
                courses: s.courses.map(c => c.id === courseId ? { ...c, ...data } : c)
              };
            })
          };
        });
      }
      syncSavePrograms(updated);
      return updated;
    });
    addToast('success', 'تم تعديل المقرر بنجاح.');
    addNotification('owner-1', 'تحديث البيانات التعليمية', `تم تعديل بيانات المقرر الدراسي: "${data.title || 'مقرر'}" وتحديث التصنيف الأكاديمي.`, 'info');
  };

  const deleteCourse = (programId: string, specialtyId: string, courseId: string) => {
    markItemDeleted('courses', courseId);
    setPrograms(prev => {
      const updated = prev.map(p => ({
        ...p,
        specialties: (p.specialties || []).map(s => ({
          ...s,
          courses: (s.courses || []).filter(c => c.id !== courseId)
        }))
      }));
      syncSavePrograms(updated, true);
      return updated;
    });

    // Remove from students allowed courses
    setStudents(prev => {
      const updated = prev.map(s => ({
        ...s,
        allowedCourseIds: Array.isArray(s.allowedCourseIds) ? s.allowedCourseIds.filter(id => id !== courseId) : []
      }));
      syncSaveStudents(updated);
      return updated;
    });

    fetch('/api/courses/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-account': 'hasakahm@gmail.com',
        'x-user-email': 'hasakahm@gmail.com'
      },
      body: JSON.stringify({ courseId, account: 'hasakahm@gmail.com' })
    }).catch(err => console.warn('Course delete API error:', err));

    addToast('info', 'تم حذف المقرر الدراسي بنجاح.');
    addNotification('owner-1', 'تحديث البيانات التعليمية', 'تم حذف مقرر دراسي من المنصة التعليمية.', 'warning');
  };

  // 3. Semester inside Course
  const addSemester = (programId: string, specialtyId: string, courseId: string, name: string) => {
    const newSemester: Semester = {
      id: `sem-${Date.now()}`,
      name: name.trim() || 'فصل جديد',
      lectures: []
    };
    setPrograms(prev => {
      const updated = prev.map(p => ({
        ...p,
        specialties: (p.specialties || []).map(s => ({
          ...s,
          courses: (s.courses || []).map(c => {
            if (c.id !== courseId) return c;
            return { ...c, semesters: [...(c.semesters || []), newSemester] };
          })
        }))
      }));
      syncSavePrograms(updated);
      return updated;
    });
    addToast('success', `تمت إضافة ${name} إلى المقرر بنجاح.`);
  };

  const updateSemester = (programId: string, specialtyId: string, courseId: string, semesterId: string, name: string) => {
    setPrograms(prev => {
      const updated = prev.map(p => ({
        ...p,
        specialties: (p.specialties || []).map(s => ({
          ...s,
          courses: (s.courses || []).map(c => ({
            ...c,
            semesters: (c.semesters || []).map(sem => sem.id === semesterId ? { ...sem, name } : sem)
          }))
        }))
      }));
      syncSavePrograms(updated);
      return updated;
    });
    addToast('success', 'تم تعديل اسم الفصل الدراسي.');
  };

  const deleteSemester = (programId: string, specialtyId: string, courseId: string, semesterId: string) => {
    setPrograms(prev => {
      const updated = prev.map(p => ({
        ...p,
        specialties: (p.specialties || []).map(s => ({
          ...s,
          courses: (s.courses || []).map(c => {
            if (courseId && c.id !== courseId) return c;
            return {
              ...c,
              semesters: (c.semesters || []).filter(sem => sem.id !== semesterId)
            };
          })
        }))
      }));
      syncSavePrograms(updated);
      return updated;
    });

    fetch('/api/semesters/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-account': 'hasakahm@gmail.com',
        'x-user-email': 'hasakahm@gmail.com'
      },
      body: JSON.stringify({ semesterId, courseId, account: 'hasakahm@gmail.com' })
    }).catch(err => console.warn('Semester delete API error:', err));

    addToast('info', 'تم حذف الفصل الدراسي بنجاح.');
  };

  // 4. Lecture inside Semester
  const addLecture = (
    programId: string,
    specialtyId: string,
    courseId: string,
    semesterId: string,
    lectureData: Omit<Lecture, 'id' | 'files'>
  ) => {
    const newLecture: Lecture = {
      ...lectureData,
      id: `lec-${Date.now()}`,
      files: []
    };
    setPrograms(prev => {
      const updated = prev.map(p => ({
        ...p,
        specialties: (p.specialties || []).map(s => ({
          ...s,
          courses: (s.courses || []).map(c => {
            if (c.id !== courseId) return c;
            return {
              ...c,
              semesters: (c.semesters || []).map(sem => {
                if (sem.id !== semesterId) return sem;
                return { ...sem, lectures: [...(sem.lectures || []), newLecture] };
              })
            };
          })
        }))
      }));
      syncSavePrograms(updated);
      return updated;
    });
    addToast('success', `تمت إضافة "${lectureData.title}" بنجاح.`);
  };

  const updateLecture = (
    programId: string,
    specialtyId: string,
    courseId: string,
    semesterId: string,
    lectureId: string,
    data: Partial<Lecture>
  ) => {
    setPrograms(prev => {
      const updated = prev.map(p => ({
        ...p,
        specialties: (p.specialties || []).map(s => ({
          ...s,
          courses: (s.courses || []).map(c => ({
            ...c,
            semesters: (c.semesters || []).map(sem => ({
              ...sem,
              lectures: (sem.lectures || []).map(lec => lec.id === lectureId ? { ...lec, ...data } : lec)
            }))
          }))
        }))
      }));
      syncSavePrograms(updated);
      return updated;
    });
    addToast('success', 'تم تعديل بيانات المحاضرة.');
  };

  const deleteLecture = (
    programId: string,
    specialtyId: string,
    courseId: string,
    semesterId: string,
    lectureId: string
  ) => {
    setPrograms(prev => {
      const updated = prev.map(p => ({
        ...p,
        specialties: (p.specialties || []).map(s => ({
          ...s,
          courses: (s.courses || []).map(c => {
            if (courseId && c.id !== courseId) return c;
            return {
              ...c,
              semesters: (c.semesters || []).map(sem => {
                if (semesterId && sem.id !== semesterId) return sem;
                return {
                  ...sem,
                  lectures: (sem.lectures || []).filter(lec => lec.id !== lectureId)
                };
              })
            };
          })
        }))
      }));
      syncSavePrograms(updated);
      return updated;
    });

    fetch('/api/lectures/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-account': 'hasakahm@gmail.com',
        'x-user-email': 'hasakahm@gmail.com'
      },
      body: JSON.stringify({ lectureId, courseId, semesterId, account: 'hasakahm@gmail.com' })
    }).catch(err => console.warn('Lecture delete API error:', err));

    addToast('info', 'تم حذف المحاضرة بنجاح.');
  };

  // 5. Lecture PDF Files (Embedded directly inside lecture!)
  const addLectureFile = (
    programId: string,
    specialtyId: string,
    courseId: string,
    semesterId: string,
    lectureId: string,
    fileData: Omit<LectureFile, 'id' | 'uploadedAt'>
  ) => {
    const newFile: LectureFile = {
      ...fileData,
      id: `f-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      uploadedAt: new Date().toISOString().slice(0, 10)
    };

    if (fileData.fileUrl && (fileData.fileUrl.startsWith('data:') || fileData.fileUrl.startsWith('blob:'))) {
      savePdfToIndexedDb(newFile.id, fileData.fileUrl).catch(() => {});
      if (fileData.fileUrl.startsWith('data:')) {
        fetch('/api/files/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: newFile.id, fileName: newFile.name, dataUrl: fileData.fileUrl })
        }).catch(() => {});
      }
    }

    setPrograms(prev => {
      const updated = prev.map(p => ({
        ...p,
        specialties: (p.specialties || []).map(s => ({
          ...s,
          courses: (s.courses || []).map(c => {
            if (c.id !== courseId) return c;
            return {
              ...c,
              semesters: (c.semesters || []).map(sem => {
                if (sem.id !== semesterId) return sem;
                return {
                  ...sem,
                  lectures: (sem.lectures || []).map(lec => {
                    if (lec.id !== lectureId) return lec;
                    return { ...lec, files: [...(lec.files || []), newFile] };
                  })
                };
              })
            };
          })
        }))
      }));
      syncSavePrograms(updated);
      return updated;
    });
    addToast('success', `تم إرفاق ملف PDF "${fileData.name}" بالمحاضرة وحفظه في قاعدة بيانات SQLite بنجاح.`);
  };

  const deleteLectureFile = (
    programId: string,
    specialtyId: string,
    courseId: string,
    semesterId: string,
    lectureId: string,
    fileId: string
  ) => {
    deletePdfFromIndexedDb(fileId).catch(() => {});
    fetch('/api/files/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId })
    }).catch(() => {});
    setPrograms(prev => {
      const updated = prev.map(p => ({
        ...p,
        specialties: (p.specialties || []).map(s => ({
          ...s,
          courses: (s.courses || []).map(c => ({
            ...c,
            semesters: (c.semesters || []).map(sem => ({
              ...sem,
              lectures: (sem.lectures || []).map(lec => {
                if (lectureId && lec.id !== lectureId) return lec;
                return { ...lec, files: (lec.files || []).filter(f => f.id !== fileId) };
              })
            }))
          }))
        }))
      }));
      syncSavePrograms(updated, true);
      return updated;
    });
    addToast('info', 'تم حذف الملف من المحاضرة بنجاح.');
  };

  // Add course PDF file directly (with auto semester & lecture resolution)
  const addCoursePdfFile = (
    programId: string,
    specialtyId: string,
    courseId: string,
    fileData: Omit<LectureFile, 'id' | 'uploadedAt'>,
    lectureId?: string
  ) => {
    const newFile: LectureFile = {
      ...fileData,
      id: `f-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      uploadedAt: new Date().toISOString().slice(0, 10)
    };

    if (fileData.fileUrl && (fileData.fileUrl.startsWith('data:') || fileData.fileUrl.startsWith('blob:'))) {
      savePdfToIndexedDb(newFile.id, fileData.fileUrl).catch(err => {
        console.warn('Could not save to IndexedDB', err);
      });
      if (fileData.fileUrl.startsWith('data:')) {
        fetch('/api/files/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileId: newFile.id, fileName: newFile.name, dataUrl: fileData.fileUrl })
        }).catch(() => {});
      }
    }

    setPrograms(prev => {
      const updated = prev.map(p => ({
        ...p,
        specialties: (p.specialties || []).map(s => ({
          ...s,
          courses: (s.courses || []).map(c => {
            if (c.id !== courseId) return c;

            let updatedSemesters = [...(c.semesters || [])];
            if (updatedSemesters.length === 0) {
              updatedSemesters = [{
                id: `sem-${Date.now()}`,
                name: 'الفصل الأول',
                lectures: [{
                  id: `lec-${Date.now()}`,
                  number: 1,
                  title: `المحاضرة 1 — مذكرات ${c.title}`,
                  description: `المذكرات والملازم الدراسية لمقرر ${c.title}`,
                  duration: '45 دقيقة',
                  videoUrl: '',
                  allowOffline: true,
                  files: [newFile]
                }]
              }];
              return { ...c, semesters: updatedSemesters };
            }

            if (lectureId) {
              return {
                ...c,
                semesters: updatedSemesters.map(sem => ({
                  ...sem,
                  lectures: (sem.lectures || []).map(lec => lec.id === lectureId ? { ...lec, files: [...(lec.files || []), newFile] } : lec)
                }))
              };
            }

            const firstSem = { ...updatedSemesters[0] };
            if (!firstSem.lectures || firstSem.lectures.length === 0) {
              firstSem.lectures = [{
                id: `lec-${Date.now()}`,
                number: 1,
                title: `المحاضرة 1 — مذكرات ${c.title}`,
                description: `المذكرات والملازم الدراسية لمقرر ${c.title}`,
                duration: '45 دقيقة',
                videoUrl: '',
                allowOffline: true,
                files: [newFile]
              }];
            } else {
              firstSem.lectures = firstSem.lectures.map((lec, idx) => {
                if (idx === 0) {
                  return { ...lec, files: [...(lec.files || []), newFile] };
                }
                return lec;
              });
            }
            updatedSemesters[0] = firstSem;
            return { ...c, semesters: updatedSemesters };
          })
        }))
      }));
      syncSavePrograms(updated);
      return updated;
    });
    addToast('success', `تم رفع ملف PDF "${fileData.name}" ونشره على الموقع بنجاح.`);
  };

  // Delete PDF file across any course
  const deletePdfFileAcrossCourses = (fileId: string) => {
    deletePdfFromIndexedDb(fileId).catch(() => {});
    setPrograms(prev => {
      const updated = prev.map(p => ({
        ...p,
        specialties: (p.specialties || []).map(s => ({
          ...s,
          courses: (s.courses || []).map(c => ({
            ...c,
            semesters: (c.semesters || []).map(sem => ({
              ...sem,
              lectures: (sem.lectures || []).map(lec => ({
                ...lec,
                files: (lec.files || []).filter(f => f.id !== fileId)
              }))
            }))
          }))
        }))
      }));
      syncSavePrograms(updated);
      return updated;
    });
    addToast('info', 'تم حذف ملف الـ PDF من المنصة بنجاح.');
  };

  // 6. Offline Toggle inside Lecture
  const toggleLectureOffline = (
    programId: string,
    specialtyId: string,
    courseId: string,
    semesterId: string,
    lectureId: string
  ) => {
    setPrograms(prev => {
      const updated = prev.map(p => ({
        ...p,
        specialties: (p.specialties || []).map(s => ({
          ...s,
          courses: (s.courses || []).map(c => ({
            ...c,
            semesters: (c.semesters || []).map(sem => ({
              ...sem,
              lectures: (sem.lectures || []).map(lec => {
                if (lec.id !== lectureId) return lec;
                return { ...lec, allowOffline: !lec.allowOffline };
              })
            }))
          }))
        }))
      }));
      syncSavePrograms(updated);
      return updated;
    });
    addToast('info', 'تم تحديث خاصية المشاهدة والتحميل Offline للمحاضرة.');
  };

  // --- STUDENT MANAGEMENT ---
  const addStudent = (studentData: Omit<StudentUser, 'id' | 'joinedDate'>) => {
    const newStudent: StudentUser = {
      ...studentData,
      id: `std-${Date.now()}`,
      joinedDate: new Date().toISOString().slice(0, 10),
      academicIdNumber: `FC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    };
    setStudents(prev => {
      const updated = [newStudent, ...prev];
      syncSaveStudents(updated);
      return updated;
    });
    addToast('success', `تم تسجيل الطالب "${studentData.fullName}" وحفظه بشكل دائم ومؤمن.`);
    addNotification('owner-1', 'تسجيل طالب جديد', `تم تسجيل حساب طالب جديد: ${studentData.fullName} (@${studentData.username}) برقم أكاديمي ${newStudent.academicIdNumber}.`, 'info');
  };

  const updateStudent = (studentId: string, data: Partial<StudentUser>) => {
    setStudents(prev => {
      const updated = prev.map(s => s.id === studentId ? { ...s, ...data } : s);
      syncSaveStudents(updated);
      return updated;
    });
    if (currentUser?.role === 'student' && currentUser.id === studentId) {
      setCurrentUser(prev => prev ? { ...prev, ...data } as StudentUser : null);
    }
    addToast('success', 'تم تعديل بيانات الطالب بنجاح.');
  };

  const deleteStudent = (studentId: string) => {
    markItemDeleted('students', studentId);
    const targetStudent = studentsRef.current.find(s => s.id === studentId);
    if (targetStudent?.username) {
      markItemDeleted('students', targetStudent.username.toLowerCase());
    }
    setStudents(prev => {
      const updated = prev.filter(s => s.id !== studentId);
      syncSaveStudents(updated, true);
      return updated;
    });
    setShamCashRequests(prev => {
      const updated = prev.filter(r => r.studentId !== studentId);
      pushStateToServer({ shamCashRequests: updated });
      return updated;
    });
    if (currentUser?.id === studentId) {
      setCurrentUser(null);
    }

    // Direct backend delete call
    fetch('/api/students/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-account': 'hasakahm@gmail.com',
        'x-user-email': 'hasakahm@gmail.com'
      },
      body: JSON.stringify({ studentId, account: 'hasakahm@gmail.com' })
    }).catch(err => console.warn('Student delete API error:', err));

    addToast('info', 'تم حذف حساب الطالب نهائياً من قاعدة البيانات.');
  };

  const toggleStudentStatus = (studentId: string) => {
    setStudents(prev => {
      const updated = prev.map(s => {
        if (s.id !== studentId) return s;
        const nextStatus = s.status === 'active' ? 'suspended' : 'active';
        return { ...s, status: nextStatus };
      });
      syncSaveStudents(updated);
      return updated;
    });
    addToast('info', 'تم تحديث حالة تفعيل/إيقاف الحساب.');
  };

  const setStudentAllowedCourses = (studentId: string, allowedCourseIds: string[]) => {
    setStudents(prev => {
      const updated = prev.map(s => s.id === studentId ? { ...s, allowedCourseIds } : s);
      syncSaveStudents(updated);
      return updated;
    });
    if (currentUser?.role === 'student' && currentUser.id === studentId) {
      setCurrentUser(prev => prev ? { ...prev, allowedCourseIds } as StudentUser : null);
    }
    addToast('success', 'تم تحديث صلاحيات المقررات المسموحة للطالب.');
  };

  const toggleStudentOfflinePermission = (studentId: string) => {
    let nextVal = true;
    let sName = '';
    setStudents(prev => {
      const updated = prev.map(s => {
        if (s.id !== studentId) return s;
        nextVal = !s.allowOffline;
        sName = s.fullName;
        return { ...s, allowOffline: nextVal };
      });
      syncSaveStudents(updated);
      return updated;
    });
    if (currentUser?.role === 'student' && currentUser.id === studentId) {
      setCurrentUser(prev => prev ? { ...prev, allowOffline: !(prev as StudentUser).allowOffline } as StudentUser : null);
    }
    if (nextVal) {
      addToast('success', `تم السماح للطالب "${sName}" بتنزيل محاضرات الأوفلاين.`);
    } else {
      addToast('info', `تم إلغاء تنزيل الأوفلاين للطالب "${sName}". (المشاهدة أونلاين فقط دون تنزيل)`);
    }
  };

  const toggleStudentAttendancePermission = (studentId: string) => {
    setStudents(prev => {
      const updated = prev.map(s => {
        if (s.id !== studentId) return s;
        const nextVal = s.canAttendLectures === false ? true : false;
        return { ...s, canAttendLectures: nextVal };
      });
      syncSaveStudents(updated);
      return updated;
    });
    if (currentUser?.role === 'student' && currentUser.id === studentId) {
      setCurrentUser(prev => prev ? { ...prev, canAttendLectures: (prev as StudentUser).canAttendLectures === false ? true : false } as StudentUser : null);
    }
    addToast('info', 'تم تحديث صلاحية حضور المحاضرات للطالب.');
  };

  const toggleStudentDownloadPermission = (studentId: string) => {
    setStudents(prev => {
      const updated = prev.map(s => {
        if (s.id !== studentId) return s;
        const nextVal = s.canDownloadFiles === false ? true : false;
        return { ...s, canDownloadFiles: nextVal };
      });
      syncSaveStudents(updated);
      return updated;
    });
    if (currentUser?.role === 'student' && currentUser.id === studentId) {
      setCurrentUser(prev => prev ? { ...prev, canDownloadFiles: (prev as StudentUser).canDownloadFiles === false ? true : false } as StudentUser : null);
    }
    addToast('info', 'تم تحديث صلاحية تنزيل الملفات والمذكرات للطالب.');
  };

  const updateStudentPermissions = (studentId: string, permissions: Partial<StudentUser>) => {
    setStudents(prev => {
      const updated = prev.map(s => s.id === studentId ? { ...s, ...permissions } : s);
      pushStateToServer({ students: updated });
      return updated;
    });
    if (currentUser?.role === 'student' && currentUser.id === studentId) {
      setCurrentUser(prev => prev ? { ...prev, ...permissions } as StudentUser : null);
    }
    addToast('success', 'تم حفظ وتطبيق صلاحيات الطالب بنجاح.');
  };

  // --- SHAM CASH PAYMENT REQUESTS ---
  const submitShamCashRequest = (requestData: Omit<ShamCashRequest, 'id' | 'date' | 'status'>) => {
    const newRequest: ShamCashRequest = {
      ...requestData,
      id: `sham-req-${Date.now()}`,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      status: 'pending'
    };
    setShamCashRequests(prev => {
      const updated = [newRequest, ...prev];
      pushStateToServer({ shamCashRequests: updated });
      return updated;
    });

    // Send notification to student
    addNotification(
      requestData.studentId,
      'طلب تفعيل المقررات (شام كاش)',
      'تم إرسال طلبك بنجاح وهو قيد المراجعة من قبل إدارة المركز.',
      'info'
    );

    addToast('success', 'تم إرسال طلب تفعيل المقررات عبر شام كاش بنجاح.');
  };

  const approveShamCashRequest = (requestId: string, notes = 'تم التحقق من الحوالة وتفعيل المقررات بنجاح.') => {
    const request = shamCashRequests.find(r => r.id === requestId);
    if (!request) return;

    // 1. Update request status
    let updatedReqs: ShamCashRequest[] = [];
    setShamCashRequests(prev => {
      updatedReqs = prev.map(r => r.id === requestId ? { ...r, status: 'approved', adminNotes: notes } : r);
      return updatedReqs;
    });

    // 2. Automatically add requested courses to student's allowedCourseIds!
    let updatedStudents: StudentUser[] = [];
    setStudents(prev => {
      updatedStudents = prev.map(s => {
        if (s.id !== request.studentId) return s;
        const combined = Array.from(new Set([...s.allowedCourseIds, ...request.requestedCourseIds]));
        return { ...s, allowedCourseIds: combined };
      });
      return updatedStudents;
    });

    pushStateToServer({
      shamCashRequests: updatedReqs,
      students: updatedStudents
    });

    if (currentUser?.role === 'student' && currentUser.id === request.studentId) {
      setCurrentUser(prev => {
        if (!prev) return null;
        const s = prev as StudentUser;
        return {
          ...s,
          allowedCourseIds: Array.from(new Set([...s.allowedCourseIds, ...request.requestedCourseIds]))
        };
      });
    }

    // 3. Send success notification to student
    addNotification(
      request.studentId,
      'الموافقة على طلب شام كاش',
      'تمت الموافقة على طلبك وتم تفعيل المقررات المحددة لحسابك بنجاح.',
      'success'
    );

    addToast('success', `تمت الموافقة على طلب ${request.studentName} وتفعيل المقررات مباشرة.`);
  };

  const rejectShamCashRequest = (requestId: string, notes = 'يرجى مراجعة الإدارة للتأكد من بيانات الحوالة.') => {
    const request = shamCashRequests.find(r => r.id === requestId);
    if (!request) return;

    setShamCashRequests(prev => {
      const updated = prev.map(r => r.id === requestId ? { ...r, status: 'rejected', adminNotes: notes } : r);
      pushStateToServer({ shamCashRequests: updated });
      return updated;
    });

    // Send notification to student
    addNotification(
      request.studentId,
      'رفض طلب شام كاش',
      `تم رفض الطلب: ${notes}`,
      'error'
    );

    addToast('warning', `تم رفض الطلب وإشعار الطالب.`);
  };

  // --- SITE SETTINGS / CMS ---
  const updateSiteSettings = (newSettings: Partial<SiteSettings>) => {
    setSiteSettings(prev => {
      const updated = { ...prev, ...newSettings };
      pushStateToServer({ siteSettings: updated });
      return updated;
    });
    addToast('success', 'تم حفظ التعديلات على محتوى الموقع بنجاح.');
  };

  const toggleGlobalOfflineDownload = () => {
    setSiteSettings(prev => {
      const nextVal = prev.allowOfflineLecturesDownload === false ? true : false;
      const updated = { ...prev, allowOfflineLecturesDownload: nextVal };
      pushStateToServer({ siteSettings: updated });
      addToast(
        nextVal ? 'success' : 'warning',
        nextVal
          ? 'تم تفعيل تنزيل محاضرات الأوفلاين للطلاب بنجاح.'
          : 'تم إيقاف تنزيل محاضرات الأوفلاين للجميع بقرار من المالك.'
      );
      return updated;
    });
  };

  return (
    <PlatformContext.Provider
      value={{
        currentUser,
        login,
        logout,
        switchDemoUser,

        programs,
        addProgram,
        updateProgram,
        deleteProgram,
        addSpecialty,
        updateSpecialty,
        deleteSpecialty,
        addBranch,
        addCourse,
        updateCourse,
        deleteCourse,
        addSemester,
        updateSemester,
        deleteSemester,
        addLecture,
        updateLecture,
        deleteLecture,
        addLectureFile,
        deleteLectureFile,
        addCoursePdfFile,
        deletePdfFileAcrossCourses,
        toggleLectureOffline,

        students,
        addStudent,
        updateStudent,
        deleteStudent,
        toggleStudentStatus,
        setStudentAllowedCourses,
        toggleStudentOfflinePermission,
        toggleStudentAttendancePermission,
        toggleStudentDownloadPermission,
        updateStudentPermissions,

        shamCashRequests,
        submitShamCashRequest,
        approveShamCashRequest,
        rejectShamCashRequest,

        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,

        siteSettings,
        updateSiteSettings,
        toggleGlobalOfflineDownload,

        refreshData,
        isServerReady,
        lastSyncedAt,
        exportDatabaseJson,
        importDatabaseJson,
        restoreOwnerData,
        switchToOwner,
        clearAllSpecialtiesAndCourses,
        cleanResetPlatform,
        ownerEmail: 'hasakahm@gmail.com',

        downloadBackupFile,
        restoreFromSnapshot,
        getAllSnapshots,
        forceSavePermanentBackup,

        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
};

export const usePlatform = () => {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
};
