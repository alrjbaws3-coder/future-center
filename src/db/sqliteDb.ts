import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');
const SQLITE_FILE = path.join(ROOT_DIR, 'future_center.sqlite');
const LEGACY_JSON_FILE = path.join(ROOT_DIR, 'server-db-hasakahm.json');
const MAIN_JSON_FILE = path.join(ROOT_DIR, 'server-db.json');

const db = new DatabaseSync(SQLITE_FILE);

// Enable Write-Ahead Logging (WAL) and foreign keys for maximum durability and performance
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA foreign_keys = ON;
`);

// Create all relational tables for the educational platform
db.exec(`
  CREATE TABLE IF NOT EXISTS programs (
    id TEXT PRIMARY KEY,
    account_key TEXT NOT NULL DEFAULT 'hasakahm@gmail.com',
    title TEXT NOT NULL,
    tagline TEXT DEFAULT '',
    description TEXT DEFAULT '',
    icon_name TEXT DEFAULT 'GraduationCap',
    sort_order INTEGER DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS specialties (
    id TEXT PRIMARY KEY,
    program_id TEXT NOT NULL,
    account_key TEXT NOT NULL DEFAULT 'hasakahm@gmail.com',
    name TEXT NOT NULL,
    code TEXT DEFAULT '',
    overview TEXT DEFAULT '',
    vision_and_goal TEXT DEFAULT '',
    duration TEXT DEFAULT 'سنتان (2)',
    courses_count TEXT DEFAULT '24 مادة',
    semesters_count TEXT DEFAULT '4 فصول',
    importance TEXT DEFAULT '',
    what_you_study_text TEXT DEFAULT '',
    branches_json TEXT DEFAULT '[]',
    sort_order INTEGER DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    specialty_id TEXT NOT NULL,
    program_id TEXT NOT NULL,
    account_key TEXT NOT NULL DEFAULT 'hasakahm@gmail.com',
    code TEXT DEFAULT '',
    title TEXT NOT NULL,
    branch_id TEXT DEFAULT '',
    academic_year INTEGER DEFAULT 1,
    semester_term INTEGER DEFAULT 1,
    description TEXT DEFAULT '',
    importance TEXT DEFAULT '',
    learning_outcome TEXT DEFAULT '',
    price REAL DEFAULT 0,
    credit_hours INTEGER DEFAULT 3,
    sort_order INTEGER DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS semesters (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    account_key TEXT NOT NULL DEFAULT 'hasakahm@gmail.com',
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS lectures (
    id TEXT PRIMARY KEY,
    semester_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    account_key TEXT NOT NULL DEFAULT 'hasakahm@gmail.com',
    lecture_number INTEGER DEFAULT 1,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    duration TEXT DEFAULT '',
    video_url TEXT DEFAULT '',
    allow_offline INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lecture_files (
    id TEXT PRIMARY KEY,
    lecture_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    account_key TEXT NOT NULL DEFAULT 'hasakahm@gmail.com',
    name TEXT NOT NULL,
    file_type TEXT DEFAULT 'pdf',
    file_size TEXT DEFAULT '',
    file_url TEXT DEFAULT '',
    uploaded_at TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS pdf_blobs (
    file_id TEXT PRIMARY KEY,
    file_name TEXT DEFAULT '',
    data_url TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    account_key TEXT NOT NULL DEFAULT 'hasakahm@gmail.com',
    username TEXT NOT NULL,
    password TEXT DEFAULT '',
    full_name TEXT NOT NULL,
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    academic_id_number TEXT DEFAULT '',
    program_id TEXT DEFAULT '',
    specialty_id TEXT DEFAULT '',
    academic_year INTEGER DEFAULT 1,
    semester_term INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    joined_date TEXT DEFAULT '',
    allowed_course_ids_json TEXT DEFAULT '[]',
    allow_offline INTEGER DEFAULT 1,
    can_attend_lectures INTEGER DEFAULT 1,
    can_download_files INTEGER DEFAULT 1,
    full_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sham_cash_requests (
    id TEXT PRIMARY KEY,
    account_key TEXT NOT NULL DEFAULT 'hasakahm@gmail.com',
    student_id TEXT NOT NULL,
    student_name TEXT DEFAULT '',
    transaction_number TEXT DEFAULT '',
    amount REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    request_date TEXT DEFAULT '',
    requested_course_ids_json TEXT DEFAULT '[]',
    admin_notes TEXT DEFAULT '',
    full_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    account_key TEXT NOT NULL DEFAULT 'hasakahm@gmail.com',
    user_id TEXT DEFAULT 'owner-1',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notif_type TEXT DEFAULT 'info',
    notif_date TEXT DEFAULT '',
    is_read INTEGER DEFAULT 0,
    full_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    account_key TEXT PRIMARY KEY,
    settings_json TEXT NOT NULL,
    last_updated_at TEXT NOT NULL,
    last_modified_by TEXT DEFAULT 'owner-hasakahm'
  );

  CREATE TABLE IF NOT EXISTS deleted_records (
    record_id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    deleted_at TEXT NOT NULL
  );
`);

export const DEFAULT_PROGRAMS = [
  {
    id: 'diploma-medium',
    title: 'دبلوم المعهد المتوسط',
    tagline: 'برنامج أكاديمي تطبيقي يضم اختصاصات تقنية وإدارية معتمدة',
    description: 'برنامج تعليمي شامل يهدف إلى بناء قاعدة صلبة في العلوم الإدارية والتطبيقات التقنية المعاصرة بمناهج حديثة.',
    iconName: 'GraduationCap',
    specialties: []
  },
  {
    id: 'diploma-specialized',
    title: 'الدبلوم التخصصي',
    tagline: 'مسارات تخصصية متقدمة لتأهيل الكوادر لسوق العمل',
    description: 'برامج تدريبية وتطبيقية متقدمة تركز على المهارات العملية المباشرة المطلوبة في سوق العمل الحديث.',
    iconName: 'BookOpen',
    specialties: []
  },
  {
    id: 'master',
    title: 'الماجستير المهني',
    tagline: 'دراسات مهنية عليا وتطوير تنفيذي متقدم',
    description: 'برنامج تطوير قيادي وأكاديمي مخصص للمهنيين ورواد الأعمال الباحثين عن التميز والارتقاء المؤسسي.',
    iconName: 'Sparkles',
    specialties: []
  },
  {
    id: 'professional-qualification',
    title: 'التأهيل والتخصص المهني',
    tagline: 'دورات تأهيلية مكثفة وشهادات كفاءة مهنية',
    description: 'مسارات تدريبية وتأهيلية مكثفة تواكب أحدث التقنيات والمعايير المهنية المعتمدة.',
    iconName: 'Layers',
    specialties: []
  }
];

export function markRecordDeletedInSqlite(category: string, recordId: string) {
  if (!recordId) return;
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO deleted_records (record_id, category, deleted_at)
    VALUES (?, ?, ?)
  `);
  stmt.run(String(recordId), category, new Date().toISOString());
}

export function unmarkRecordDeletedInSqlite(recordId: string) {
  if (!recordId) return;
  const stmt = db.prepare(`DELETE FROM deleted_records WHERE record_id = ?`);
  stmt.run(String(recordId));
}

export function clearDeletedRecordsInSqlite() {
  db.exec(`DELETE FROM deleted_records`);
}

export function getDeletedRecordsMap(): {
  students: string[];
  programs: string[];
  specialties: string[];
  courses: string[];
} {
  const rows = db.prepare(`SELECT record_id, category FROM deleted_records`).all() as Array<{ record_id: string; category: string }>;
  const result = {
    students: [] as string[],
    programs: [] as string[],
    specialties: [] as string[],
    courses: [] as string[]
  };
  for (const r of rows) {
    if (r.category === 'students') result.students.push(r.record_id);
    else if (r.category === 'programs') result.programs.push(r.record_id);
    else if (r.category === 'specialties') result.specialties.push(r.record_id);
    else if (r.category === 'courses') result.courses.push(r.record_id);
  }
  return result;
}

export function savePdfBlobToSqlite(fileId: string, fileName: string, dataUrl: string) {
  if (!fileId || !dataUrl) return;
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO pdf_blobs (file_id, file_name, data_url, updated_at)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(fileId, fileName || '', dataUrl, new Date().toISOString());
}

export function getPdfBlobFromSqlite(fileId: string): { fileId: string; fileName: string; dataUrl: string } | null {
  const row = db.prepare(`SELECT file_id, file_name, data_url FROM pdf_blobs WHERE file_id = ?`).get(fileId) as any;
  if (!row) return null;
  return {
    fileId: row.file_id,
    fileName: row.file_name,
    dataUrl: row.data_url
  };
}

export function deletePdfBlobFromSqlite(fileId: string) {
  db.prepare(`DELETE FROM pdf_blobs WHERE file_id = ?`).run(fileId);
}

/**
 * Reads the entire platform state from relational SQLite tables.
 */
export function getStateFromSqlite(accountKey: string = 'hasakahm@gmail.com'): any {
  const progRows = db.prepare(`SELECT * FROM programs ORDER BY sort_order ASC, rowid ASC`).all() as any[];
  const specRows = db.prepare(`SELECT * FROM specialties ORDER BY sort_order ASC, rowid ASC`).all() as any[];
  const courseRows = db.prepare(`SELECT * FROM courses ORDER BY sort_order ASC, rowid ASC`).all() as any[];
  const semRows = db.prepare(`SELECT * FROM semesters ORDER BY sort_order ASC, rowid ASC`).all() as any[];
  const lecRows = db.prepare(`SELECT * FROM lectures ORDER BY sort_order ASC, lecture_number ASC, rowid ASC`).all() as any[];
  const fileRows = db.prepare(`SELECT * FROM lecture_files ORDER BY rowid ASC`).all() as any[];

  // Build files by lecture_id
  const filesByLecture = new Map<string, any[]>();
  for (const f of fileRows) {
    const list = filesByLecture.get(f.lecture_id) || [];
    list.push({
      id: f.id,
      name: f.name,
      type: f.file_type || 'pdf',
      fileSize: f.file_size || '',
      fileUrl: f.file_url || '',
      uploadedAt: f.uploaded_at || ''
    });
    filesByLecture.set(f.lecture_id, list);
  }

  // Build lectures by semester_id
  const lecturesBySemester = new Map<string, any[]>();
  for (const l of lecRows) {
    const list = lecturesBySemester.get(l.semester_id) || [];
    list.push({
      id: l.id,
      number: Number(l.lecture_number || 1),
      title: l.title,
      description: l.description || '',
      duration: l.duration || '',
      videoUrl: l.video_url || '',
      allowOffline: Boolean(l.allow_offline),
      files: filesByLecture.get(l.id) || []
    });
    lecturesBySemester.set(l.semester_id, list);
  }

  // Build semesters by course_id
  const semestersByCourse = new Map<string, any[]>();
  for (const sem of semRows) {
    const list = semestersByCourse.get(sem.course_id) || [];
    list.push({
      id: sem.id,
      name: sem.name,
      lectures: lecturesBySemester.get(sem.id) || []
    });
    semestersByCourse.set(sem.course_id, list);
  }

  // Build courses by specialty_id
  const coursesBySpecialty = new Map<string, any[]>();
  for (const c of courseRows) {
    const list = coursesBySpecialty.get(c.specialty_id) || [];
    const courseSemesters = semestersByCourse.get(c.id) || [
      {
        id: `sem-${c.id}-1`,
        name: Number(c.semester_term) === 2 ? 'الفصل الثاني' : 'الفصل الأول',
        lectures: []
      }
    ];
    list.push({
      id: c.id,
      code: c.code || '',
      title: c.title,
      specialtyId: c.specialty_id,
      branchId: c.branch_id || undefined,
      academicYear: (Number(c.academic_year) === 2 ? 2 : 1) as 1 | 2,
      semesterTerm: (Number(c.semester_term) === 2 ? 2 : 1) as 1 | 2,
      description: c.description || '',
      importance: c.importance || undefined,
      learningOutcome: c.learning_outcome || undefined,
      price: Number(c.price || 0),
      creditHours: Number(c.credit_hours || 3),
      semesters: courseSemesters
    });
    coursesBySpecialty.set(c.specialty_id, list);
  }

  // Build specialties by program_id
  const specialtiesByProgram = new Map<string, any[]>();
  for (const s of specRows) {
    const list = specialtiesByProgram.get(s.program_id) || [];
    let branches = [];
    try {
      branches = JSON.parse(s.branches_json || '[]');
    } catch (_) {}
    list.push({
      id: s.id,
      programId: s.program_id,
      name: s.name,
      code: s.code || '',
      overview: s.overview || '',
      visionAndGoal: s.vision_and_goal || undefined,
      duration: s.duration || 'سنتان (2)',
      coursesCount: s.courses_count || '24 مادة',
      semestersCount: s.semesters_count || '4 فصول',
      importance: s.importance || '',
      whatYouStudyText: s.what_you_study_text || '',
      branches,
      courses: coursesBySpecialty.get(s.id) || []
    });
    specialtiesByProgram.set(s.program_id, list);
  }

  const programs = progRows.map(p => ({
    id: p.id,
    title: p.title,
    tagline: p.tagline || '',
    description: p.description || '',
    iconName: p.icon_name || 'GraduationCap',
    specialties: specialtiesByProgram.get(p.id) || []
  }));

  // Students
  const studentRows = db.prepare(`SELECT * FROM students ORDER BY rowid ASC`).all() as any[];
  const students = studentRows.map(row => {
    try {
      const parsed = JSON.parse(row.full_json);
      return {
        ...parsed,
        id: row.id,
        username: row.username,
        fullName: row.full_name,
        status: row.status
      };
    } catch (_) {
      let allowedCourseIds = [];
      try {
        allowedCourseIds = JSON.parse(row.allowed_course_ids_json || '[]');
      } catch (_) {}
      return {
        id: row.id,
        username: row.username,
        password: row.password,
        fullName: row.full_name,
        role: 'student',
        email: row.email,
        phone: row.phone,
        academicIdNumber: row.academic_id_number,
        programId: row.program_id,
        specialtyId: row.specialty_id,
        academicYear: Number(row.academic_year || 1),
        semesterTerm: Number(row.semester_term || 1),
        status: row.status || 'active',
        joinedDate: row.joined_date,
        allowedCourseIds,
        allowOffline: Boolean(row.allow_offline),
        canAttendLectures: Boolean(row.can_attend_lectures),
        canDownloadFiles: Boolean(row.can_download_files)
      };
    }
  });

  // Sham Cash Requests
  const shamRows = db.prepare(`SELECT * FROM sham_cash_requests ORDER BY rowid DESC`).all() as any[];
  const shamCashRequests = shamRows.map(r => {
    try {
      return JSON.parse(r.full_json);
    } catch (_) {
      return {
        id: r.id,
        studentId: r.student_id,
        studentName: r.student_name,
        transactionNumber: r.transaction_number,
        amount: Number(r.amount || 0),
        status: r.status,
        date: r.request_date,
        requestedCourseIds: JSON.parse(r.requested_course_ids_json || '[]'),
        adminNotes: r.admin_notes
      };
    }
  });

  // Notifications
  const notifRows = db.prepare(`SELECT * FROM notifications ORDER BY rowid DESC`).all() as any[];
  const notifications = notifRows.map(n => {
    try {
      return JSON.parse(n.full_json);
    } catch (_) {
      return {
        id: n.id,
        userId: n.user_id,
        title: n.title,
        message: n.message,
        type: n.notif_type,
        date: n.notif_date,
        read: Boolean(n.is_read)
      };
    }
  });

  // Site Settings
  const settingsRow = db.prepare(`SELECT * FROM site_settings LIMIT 1`).get() as any;
  let siteSettings = undefined;
  let lastUpdatedAt = new Date().toISOString();
  let lastModifiedBy = accountKey;

  if (settingsRow) {
    try {
      siteSettings = JSON.parse(settingsRow.settings_json);
    } catch (_) {}
    lastUpdatedAt = settingsRow.last_updated_at || lastUpdatedAt;
    lastModifiedBy = settingsRow.last_modified_by || lastModifiedBy;
  }

  return {
    programs: programs.length > 0 ? programs : DEFAULT_PROGRAMS,
    students,
    shamCashRequests,
    notifications,
    siteSettings,
    deletedIds: getDeletedRecordsMap(),
    accountId: 'hasakahm@gmail.com',
    ownerEmail: 'hasakahm@gmail.com',
    lastUpdatedAt,
    lastModifiedBy,
    storageEngine: 'SQLite (WAL Relational Engine)'
  };
}

/**
 * Persists the entire platform state into normalized SQLite relational tables inside an ACID transaction,
 * while preserving existing records unless explicitly deleted in `deleted_records`.
 */
export function saveStateToSqlite(
  payload: {
    programs?: any[];
    students?: any[];
    siteSettings?: any;
    shamCashRequests?: any[];
    notifications?: any[];
    lastModifiedBy?: string;
  },
  accountKey: string = 'hasakahm@gmail.com',
  replaceAll: boolean = false
): boolean {
  try {
    const now = new Date().toISOString();
    const deleted = getDeletedRecordsMap();
    const delProgs = new Set(deleted.programs);
    const delSpecs = new Set(deleted.specialties);
    const delCourses = new Set(deleted.courses);
    const delStudents = new Set(deleted.students);

    db.exec('BEGIN IMMEDIATE TRANSACTION');

    try {
      if (replaceAll) {
        db.exec(`
          DELETE FROM lecture_files;
          DELETE FROM lectures;
          DELETE FROM semesters;
          DELETE FROM courses;
          DELETE FROM specialties;
          DELETE FROM programs;
          DELETE FROM students;
          DELETE FROM sham_cash_requests;
          DELETE FROM notifications;
        `);
      }

      // 1. Upsert Programs, Specialties, Courses, Semesters, Lectures, Files
      if (Array.isArray(payload.programs)) {
        const insertProg = db.prepare(`
          INSERT OR REPLACE INTO programs (id, account_key, title, tagline, description, icon_name, sort_order, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const insertSpec = db.prepare(`
          INSERT OR REPLACE INTO specialties (
            id, program_id, account_key, name, code, overview, vision_and_goal,
            duration, courses_count, semesters_count, importance, what_you_study_text,
            branches_json, sort_order, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const insertCourse = db.prepare(`
          INSERT OR REPLACE INTO courses (
            id, specialty_id, program_id, account_key, code, title, branch_id,
            academic_year, semester_term, description, importance, learning_outcome,
            price, credit_hours, sort_order, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const insertSem = db.prepare(`
          INSERT OR REPLACE INTO semesters (id, course_id, account_key, name, sort_order)
          VALUES (?, ?, ?, ?, ?)
        `);
        const insertLec = db.prepare(`
          INSERT OR REPLACE INTO lectures (
            id, semester_id, course_id, account_key, lecture_number, title,
            description, duration, video_url, allow_offline, sort_order, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const insertFile = db.prepare(`
          INSERT OR REPLACE INTO lecture_files (
            id, lecture_id, course_id, account_key, name, file_type, file_size, file_url, uploaded_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        payload.programs.forEach((p, pIdx) => {
          if (!p || !p.id || (!replaceAll && delProgs.has(p.id))) return;
          insertProg.run(
            String(p.id),
            accountKey,
            String(p.title || ''),
            String(p.tagline || ''),
            String(p.description || ''),
            String(p.iconName || 'GraduationCap'),
            pIdx,
            now
          );

          (p.specialties || []).forEach((s: any, sIdx: number) => {
            if (!s || !s.id || (!replaceAll && delSpecs.has(s.id))) return;
            insertSpec.run(
              String(s.id),
              String(p.id),
              accountKey,
              String(s.name || ''),
              String(s.code || ''),
              String(s.overview || ''),
              String(s.visionAndGoal || ''),
              String(s.duration || 'سنتان (2)'),
              String(s.coursesCount || '24 مادة'),
              String(s.semestersCount || '4 فصول'),
              String(s.importance || ''),
              String(s.whatYouStudyText || ''),
              JSON.stringify(s.branches || []),
              sIdx,
              now
            );

            (s.courses || []).forEach((c: any, cIdx: number) => {
              if (!c || !c.id || (!replaceAll && delCourses.has(c.id))) return;
              insertCourse.run(
                String(c.id),
                String(s.id),
                String(p.id),
                accountKey,
                String(c.code || ''),
                String(c.title || ''),
                String(c.branchId || ''),
                Number(c.academicYear || 1),
                Number(c.semesterTerm || 1),
                String(c.description || ''),
                String(c.importance || ''),
                String(c.learningOutcome || ''),
                Number(c.price || 0),
                Number(c.creditHours || 3),
                cIdx,
                now
              );

              // Replace semesters/lectures/files for this specific course to reflect edits/deletions of lectures cleanly
              db.prepare(`DELETE FROM lecture_files WHERE course_id = ?`).run(String(c.id));
              db.prepare(`DELETE FROM lectures WHERE course_id = ?`).run(String(c.id));
              db.prepare(`DELETE FROM semesters WHERE course_id = ?`).run(String(c.id));

              (c.semesters || []).forEach((sem: any, semIdx: number) => {
                if (!sem || !sem.id) return;
                insertSem.run(
                  String(sem.id),
                  String(c.id),
                  accountKey,
                  String(sem.name || 'الفصل الأول'),
                  semIdx
                );

                (sem.lectures || []).forEach((lec: any, lecIdx: number) => {
                  if (!lec || !lec.id) return;
                  insertLec.run(
                    String(lec.id),
                    String(sem.id),
                    String(c.id),
                    accountKey,
                    Number(lec.number || lecIdx + 1),
                    String(lec.title || ''),
                    String(lec.description || ''),
                    String(lec.duration || ''),
                    String(lec.videoUrl || ''),
                    lec.allowOffline === false ? 0 : 1,
                    lecIdx,
                    now
                  );

                  (lec.files || []).forEach((f: any) => {
                    if (!f || !f.id) return;
                    // If fileUrl is a base64 data URL, also store it in pdf_blobs table!
                    let effectiveUrl = String(f.fileUrl || '');
                    if (effectiveUrl.startsWith('data:') && effectiveUrl.length > 200) {
                      savePdfBlobToSqlite(String(f.id), String(f.name || ''), effectiveUrl);
                      effectiveUrl = `/api/files/${f.id}`;
                    }
                    insertFile.run(
                      String(f.id),
                      String(lec.id),
                      String(c.id),
                      accountKey,
                      String(f.name || ''),
                      String(f.type || 'pdf'),
                      String(f.fileSize || ''),
                      effectiveUrl,
                      String(f.uploadedAt || now.slice(0, 10))
                    );
                  });
                });
              });
            });
          });
        });
      }

      // 2. Upsert Students (never losing existing students unless replaceAll or in deleted_records)
      if (Array.isArray(payload.students)) {
        const insertStudent = db.prepare(`
          INSERT OR REPLACE INTO students (
            id, account_key, username, password, full_name, email, phone,
            academic_id_number, program_id, specialty_id, academic_year, semester_term,
            status, joined_date, allowed_course_ids_json, allow_offline,
            can_attend_lectures, can_download_files, full_json, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const s of payload.students) {
          if (!s || !s.id) continue;
          if (!replaceAll && (delStudents.has(s.id) || (s.username && delStudents.has(String(s.username).toLowerCase())))) {
            continue;
          }
          insertStudent.run(
            String(s.id),
            accountKey,
            String(s.username || ''),
            String(s.password || ''),
            String(s.fullName || ''),
            String(s.email || ''),
            String(s.phone || ''),
            String(s.academicIdNumber || ''),
            String(s.programId || ''),
            String(s.specialtyId || ''),
            Number(s.academicYear || 1),
            Number(s.semesterTerm || 1),
            String(s.status || 'active'),
            String(s.joinedDate || now.slice(0, 10)),
            JSON.stringify(s.allowedCourseIds || []),
            s.allowOffline === false ? 0 : 1,
            s.canAttendLectures === false ? 0 : 1,
            s.canDownloadFiles === false ? 0 : 1,
            JSON.stringify(s),
            now
          );
        }
      }

      // 3. Upsert Sham Cash Requests
      if (Array.isArray(payload.shamCashRequests)) {
        const insertSham = db.prepare(`
          INSERT OR REPLACE INTO sham_cash_requests (
            id, account_key, student_id, student_name, transaction_number,
            amount, status, request_date, requested_course_ids_json,
            admin_notes, full_json, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const r of payload.shamCashRequests) {
          if (!r || !r.id) continue;
          insertSham.run(
            String(r.id),
            accountKey,
            String(r.studentId || ''),
            String(r.studentName || ''),
            String(r.transactionNumber || ''),
            Number(r.amount || 0),
            String(r.status || 'pending'),
            String(r.date || ''),
            JSON.stringify(r.requestedCourseIds || []),
            String(r.adminNotes || ''),
            JSON.stringify(r),
            now
          );
        }
      }

      // 4. Upsert Notifications
      if (Array.isArray(payload.notifications)) {
        const insertNotif = db.prepare(`
          INSERT OR REPLACE INTO notifications (
            id, account_key, user_id, title, message, notif_type, notif_date, is_read, full_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const n of payload.notifications) {
          if (!n || !n.id) continue;
          insertNotif.run(
            String(n.id),
            accountKey,
            String(n.userId || 'owner-1'),
            String(n.title || ''),
            String(n.message || ''),
            String(n.type || 'info'),
            String(n.date || ''),
            n.read ? 1 : 0,
            JSON.stringify(n)
          );
        }
      }

      // 5. Upsert Site Settings
      if (payload.siteSettings !== undefined) {
        db.prepare(`
          INSERT OR REPLACE INTO site_settings (account_key, settings_json, last_updated_at, last_modified_by)
          VALUES (?, ?, ?, ?)
        `).run(
          accountKey,
          JSON.stringify(payload.siteSettings),
          now,
          String(payload.lastModifiedBy || accountKey)
        );
      } else {
        db.prepare(`
          UPDATE site_settings SET last_updated_at = ?, last_modified_by = ? WHERE account_key = ?
        `).run(now, String(payload.lastModifiedBy || accountKey), accountKey);
      }

      db.exec('COMMIT');
    } catch (txErr) {
      db.exec('ROLLBACK');
      throw txErr;
    }

    // Flush WAL to main SQLite file on disk and mirror to JSON backup files
    try {
      db.exec('PRAGMA wal_checkpoint(PASSIVE);');
      const fullState = getStateFromSqlite(accountKey);
      const serialized = JSON.stringify(fullState, null, 2);
      fs.writeFileSync(LEGACY_JSON_FILE, serialized, 'utf-8');
      fs.writeFileSync(MAIN_JSON_FILE, serialized, 'utf-8');
    } catch (_) {}

    return true;
  } catch (err) {
    console.error('SQLite saveStateToSqlite error:', err);
    return false;
  }
}

export function deleteStudentFromSqlite(studentId: string) {
  const row = db.prepare(`SELECT username FROM students WHERE id = ?`).get(studentId) as any;
  markRecordDeletedInSqlite('students', studentId);
  if (row?.username) {
    markRecordDeletedInSqlite('students', String(row.username).toLowerCase());
  }
  db.prepare(`DELETE FROM students WHERE id = ?`).run(studentId);
  db.prepare(`DELETE FROM sham_cash_requests WHERE student_id = ?`).run(studentId);
  try {
    db.exec('PRAGMA wal_checkpoint(PASSIVE);');
  } catch (_) {}
}

export function deleteCourseFromSqlite(courseId: string) {
  markRecordDeletedInSqlite('courses', courseId);
  db.prepare(`DELETE FROM lecture_files WHERE course_id = ?`).run(courseId);
  db.prepare(`DELETE FROM lectures WHERE course_id = ?`).run(courseId);
  db.prepare(`DELETE FROM semesters WHERE course_id = ?`).run(courseId);
  db.prepare(`DELETE FROM courses WHERE id = ?`).run(courseId);
  try {
    db.exec('PRAGMA wal_checkpoint(PASSIVE);');
  } catch (_) {}
}

export function deleteSpecialtyFromSqlite(specialtyId: string) {
  markRecordDeletedInSqlite('specialties', specialtyId);
  const courses = db.prepare(`SELECT id FROM courses WHERE specialty_id = ?`).all(specialtyId) as Array<{ id: string }>;
  for (const c of courses) {
    deleteCourseFromSqlite(c.id);
  }
  db.prepare(`DELETE FROM specialties WHERE id = ?`).run(specialtyId);
  try {
    db.exec('PRAGMA wal_checkpoint(PASSIVE);');
  } catch (_) {}
}

export function deleteProgramFromSqlite(programId: string) {
  markRecordDeletedInSqlite('programs', programId);
  const specs = db.prepare(`SELECT id FROM specialties WHERE program_id = ?`).all(programId) as Array<{ id: string }>;
  for (const s of specs) {
    deleteSpecialtyFromSqlite(s.id);
  }
  db.prepare(`DELETE FROM programs WHERE id = ?`).run(programId);
  try {
    db.exec('PRAGMA wal_checkpoint(PASSIVE);');
  } catch (_) {}
}

export function resetSqliteDatabase(accountKey: string = 'hasakahm@gmail.com') {
  clearDeletedRecordsInSqlite();
  saveStateToSqlite(
    {
      programs: DEFAULT_PROGRAMS,
      students: [],
      shamCashRequests: [],
      notifications: [
        {
          id: 'notif-welcome',
          userId: 'owner-1',
          title: 'مرحباً بك في منصتك التعليمية',
          message: 'تمت تهيئة قاعدة البيانات العلائقية SQLite بنجاح، يمكنك الآن إضافة الاختصاصات والمقررات والطلاب بحرية تامة.',
          type: 'success',
          date: new Date().toISOString().slice(0, 10),
          read: false
        }
      ],
      lastModifiedBy: 'admin-clean-reset'
    },
    accountKey,
    true
  );
}

export function getSqliteDiagnostics() {
  const count = (table: string) => {
    const r = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get() as any;
    return Number(r?.c || 0);
  };
  let fileSizeBytes = 0;
  try {
    if (fs.existsSync(SQLITE_FILE)) {
      fileSizeBytes = fs.statSync(SQLITE_FILE).size;
    }
  } catch (_) {}

  return {
    engine: 'SQLite3 Relational Database (WAL Mode)',
    databaseFile: 'future_center.sqlite',
    fileSizeBytes,
    tables: {
      programs: count('programs'),
      specialties: count('specialties'),
      courses: count('courses'),
      semesters: count('semesters'),
      lectures: count('lectures'),
      lecture_files: count('lecture_files'),
      pdf_blobs: count('pdf_blobs'),
      students: count('students'),
      sham_cash_requests: count('sham_cash_requests'),
      notifications: count('notifications')
    }
  };
}

// Seed SQLite from existing JSON file on first boot if SQLite programs table is empty
(function initializeSqliteIfNeeded() {
  const progCount = (db.prepare(`SELECT COUNT(*) as c FROM programs`).get() as any)?.c || 0;
  if (progCount === 0) {
    let initialData: any = null;
    if (fs.existsSync(LEGACY_JSON_FILE)) {
      try {
        initialData = JSON.parse(fs.readFileSync(LEGACY_JSON_FILE, 'utf-8'));
      } catch (_) {}
    } else if (fs.existsSync(MAIN_JSON_FILE)) {
      try {
        initialData = JSON.parse(fs.readFileSync(MAIN_JSON_FILE, 'utf-8'));
      } catch (_) {}
    }

    if (initialData && Array.isArray(initialData.programs) && initialData.programs.length > 0) {
      saveStateToSqlite(initialData, 'hasakahm@gmail.com', true);
    } else {
      resetSqliteDatabase('hasakahm@gmail.com');
    }
  }
})();
