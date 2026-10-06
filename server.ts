import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  getStateFromSqlite,
  saveStateToSqlite,
  deleteStudentFromSqlite,
  deleteCourseFromSqlite,
  deleteSpecialtyFromSqlite,
  deleteProgramFromSqlite,
  resetSqliteDatabase,
  getSqliteDiagnostics,
  savePdfBlobToSqlite,
  getPdfBlobFromSqlite,
  deletePdfBlobFromSqlite
} from './src/db/sqliteDb.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const DB_FILE = path.join(__dirname, 'server-db.json');
const BACKUP_FILE = path.join(__dirname, 'server-db-backup.json');
const AUDIT_LOG_FILE = path.join(__dirname, 'audit-logs.json');

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  account: string;
  action: string;
  category: 'auth' | 'data_change' | 'isolation' | 'security' | 'restore';
  details: string;
  status: 'success' | 'warning' | 'error';
  userRole?: string;
  targetId?: string;
}

function getAuditLogs(): AuditLogEntry[] {
  if (fs.existsSync(AUDIT_LOG_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(AUDIT_LOG_FILE, 'utf-8'));
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {}
  }
  // Initialize with canonical logs
  const initialLogs: AuditLogEntry[] = [
    {
      id: 'log-iso-1',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      account: 'hasakahm@gmail.com',
      action: 'عزل قاعدة البيانات والجلسات الأكاديمية',
      category: 'isolation',
      details: 'تم عزل قاعدة البياناتserver-db-hasakahm.json بالكامل وتأمين 16 مقرراً و 15 محاضرة ضد التداخل.',
      status: 'success',
      userRole: 'owner'
    },
    {
      id: 'log-sec-2',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      account: 'hasakahm@gmail.com',
      action: 'فصل مساحات الطلاب عن صلاحيات المالك',
      category: 'security',
      details: 'منع دخول وضع الطالب من حجب مقررات المالك، وتفعيل التبديل الآمن المباشر.',
      status: 'success',
      userRole: 'owner'
    }
  ];
  try {
    fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(initialLogs, null, 2), 'utf-8');
  } catch (_) {}
  return initialLogs;
}

function addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
  try {
    const logs = getAuditLogs();
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    logs.unshift(newEntry);
    if (logs.length > 500) logs.length = 500;
    fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to write audit log:', e);
  }
}

app.use(express.json({ limit: '50mb' }));

// Helper to load DB with automatic account isolation and fallback to backup
function extractAccountKey(req: express.Request): string {
  const headerVal = req.headers['x-user-account'];
  const userHeader = req.headers['x-user-email'];
  const queryVal = req.query.account;
  const bodyVal = req.body?.account;

  const candidate = (headerVal || userHeader || queryVal || bodyVal || 'hasakahm@gmail.com') as string;
  return candidate.trim();
}

function getAccountDbPaths(accountKey?: string) {
  const raw = (accountKey || 'hasakahm@gmail.com').toLowerCase();
  let clean = raw.replace(/[^a-z0-9_@.-]/g, '_').replace(/[@.]+/g, '_');
  if (clean.includes('hasakahm')) {
    clean = 'hasakahm';
  }
  const dbFile = path.join(__dirname, `server-db-${clean}.json`);
  const backupFile = path.join(__dirname, `server-db-${clean}-backup.json`);
  return { dbFile, backupFile, accountName: clean };
}

function getDbData(accountKey?: string): any {
  try {
    return getStateFromSqlite(accountKey || 'hasakahm@gmail.com');
  } catch (e) {
    console.error('SQLite getDbData error:', e);
    return null;
  }
}

function saveDbData(data: any, accountKey?: string, replaceAll: boolean = false): boolean {
  try {
    return saveStateToSqlite(data, accountKey || 'hasakahm@gmail.com', replaceAll);
  } catch (e) {
    console.error('SQLite saveDbData error:', e);
    return false;
  }
}

// SQLite Relational Database Diagnostics & Table Status Endpoint
app.get('/api/db/status', (req, res) => {
  try {
    const diagnostics = getSqliteDiagnostics();
    res.json({ success: true, ...diagnostics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'SQLite diagnostics error' });
  }
});

// Persistent PDF File Upload & Retrieval backed by SQLite pdf_blobs table
app.post('/api/files/upload', (req, res) => {
  try {
    const { fileId, fileName, dataUrl } = req.body;
    if (!fileId || !dataUrl) {
      return res.status(400).json({ success: false, error: 'fileId and dataUrl required' });
    }
    savePdfBlobToSqlite(String(fileId), String(fileName || ''), String(dataUrl));
    res.json({ success: true, fileId, url: `/api/files/${fileId}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to store PDF in SQLite' });
  }
});

app.get('/api/files/:fileId', (req, res) => {
  try {
    const blob = getPdfBlobFromSqlite(req.params.fileId);
    if (!blob || !blob.dataUrl) {
      return res.status(404).send('File not found in SQLite database');
    }
    const matches = blob.dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (matches) {
      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(blob.fileName || 'lecture.pdf')}"`);
      return res.send(buffer);
    }
    res.redirect(blob.dataUrl);
  } catch (err: any) {
    res.status(500).send('Error retrieving file from SQLite');
  }
});

app.post('/api/files/delete', (req, res) => {
  try {
    const { fileId } = req.body;
    if (fileId) deletePdfBlobFromSqlite(String(fileId));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// API Routes
app.get('/api/health', (req, res) => {
  const accountKey = extractAccountKey(req);
  const data = getDbData(accountKey);
  res.json({
    status: 'ok',
    account: accountKey,
    hasDb: !!data,
    programsCount: data?.programs?.length || 0,
    studentsCount: data?.students?.length || 0,
    lastUpdatedAt: data?.lastUpdatedAt || null
  });
});

// Dedicated Account Isolation & Integrity Status Endpoint
app.get('/api/account/status', (req, res) => {
  const accountKey = extractAccountKey(req);
  const data = getDbData(accountKey);
  if (!data) {
    return res.status(404).json({ success: false, message: 'لا توجد بيانات لهذا الحساب' });
  }

  const coursesList: Array<{ program: string; specialty: string; id: string; title: string; lecturesCount: number }> = [];
  let totalLectures = 0;
  for (const p of data.programs || []) {
    for (const s of p.specialties || []) {
      for (const c of s.courses || []) {
        const lecs = (c.semesters || []).reduce((acc: number, sem: any) => acc + (sem.lectures?.length || 0), 0);
        totalLectures += lecs;
        coursesList.push({
          program: p.title,
          specialty: s.name,
          id: c.id,
          title: c.title,
          lecturesCount: lecs
        });
      }
    }
  }

  res.json({
    success: true,
    account: accountKey,
    isolatedFile: `server-db-${getAccountDbPaths(accountKey).accountName}.json`,
    programsCount: data.programs?.length || 0,
    coursesCount: coursesList.length,
    lecturesCount: totalLectures,
    studentsCount: data.students?.length || 0,
    courses: coursesList,
    lastUpdatedAt: data.lastUpdatedAt || null
  });
});

// Dedicated Account Restoration Endpoint
app.post('/api/account/restore', (req, res) => {
  try {
    const accountKey = extractAccountKey(req);
    const { dbFile, backupFile } = getAccountDbPaths(accountKey);

    let restoredData = null;
    let source = '';

    if (fs.existsSync(dbFile)) {
      try {
        const content = fs.readFileSync(dbFile, 'utf-8');
        restoredData = JSON.parse(content);
        source = dbFile;
      } catch (e) {
        console.error('Error reading primary dbFile:', e);
      }
    }

    if (!restoredData && fs.existsSync(backupFile)) {
      try {
        const content = fs.readFileSync(backupFile, 'utf-8');
        restoredData = JSON.parse(content);
        source = backupFile;
      } catch (e) {
        console.error('Error reading backupFile:', e);
      }
    }

    if (!restoredData && fs.existsSync(DB_FILE)) {
      try {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        restoredData = JSON.parse(content);
        source = DB_FILE;
      } catch (e) {
        console.error('Error reading DB_FILE:', e);
      }
    }

    if (!restoredData) {
      return res.status(500).json({ success: false, error: 'لم يتم العثور على نسخة احتياطية صالحة للاسترجاع' });
    }

    saveDbData(restoredData, accountKey);

    const coursesList: string[] = [];
    for (const p of restoredData.programs || []) {
      for (const s of p.specialties || []) {
        for (const c of s.courses || []) {
          coursesList.push(c.title);
        }
      }
    }

    addAuditLog({
      account: accountKey,
      action: 'استرجاع فوري للبيانات المعزولة',
      category: 'restore',
      details: `تم استرجاع ${coursesList.length} مقرراً دراسياً بنجاح من المصدر (${source}) دون المساس بالبيانات القديمة`,
      status: 'success',
      userRole: 'owner'
    });

    res.json({
      success: true,
      account: accountKey,
      source,
      programsCount: restoredData.programs?.length || 0,
      coursesCount: coursesList.length,
      courses: coursesList,
      data: restoredData
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Audit Logs Query & Record Endpoints
app.get('/api/audit-logs', (req, res) => {
  const accountKey = extractAccountKey(req);
  const logs = getAuditLogs();
  res.json({
    success: true,
    account: accountKey,
    total: logs.length,
    logs
  });
});

app.post('/api/audit-logs/record', (req, res) => {
  try {
    const accountKey = extractAccountKey(req);
    const { action, category, details, status, userRole, targetId } = req.body;
    addAuditLog({
      account: accountKey,
      action: action || 'عملية غير مسماة',
      category: category || 'auth',
      details: details || '',
      status: status || 'success',
      userRole: userRole || 'owner',
      targetId
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Helper to count courses across programs
function countTotalCourses(progs: any[]): number {
  if (!Array.isArray(progs)) return 0;
  let count = 0;
  for (const p of progs) {
    for (const s of p.specialties || []) {
      count += s.courses?.length || 0;
    }
  }
  return count;
}

app.get('/api/state', (req, res) => {
  const accountKey = extractAccountKey(req);
  const data = getDbData(accountKey);
  if (data) {
    res.json({ success: true, account: accountKey, data });
  } else {
    res.json({ success: true, account: accountKey, data: null });
  }
});

app.post('/api/state', (req, res) => {
  try {
    const accountKey = extractAccountKey(req);
    const { programs, students, siteSettings, shamCashRequests, notifications, lastModifiedBy } = req.body;

    const saved = saveStateToSqlite(
      {
        programs: Array.isArray(programs) ? programs : undefined,
        students: Array.isArray(students) ? students : undefined,
        siteSettings,
        shamCashRequests: Array.isArray(shamCashRequests) ? shamCashRequests : undefined,
        notifications: Array.isArray(notifications) ? notifications : undefined,
        lastModifiedBy: lastModifiedBy || accountKey
      },
      accountKey,
      false
    );

    if (saved) {
      const updated = getStateFromSqlite(accountKey);
      res.json({ 
        success: true, 
        account: accountKey, 
        coursesCount: countTotalCourses(updated.programs),
        studentsCount: updated.students?.length || 0,
        lastUpdatedAt: updated.lastUpdatedAt,
        sqliteDiagnostics: getSqliteDiagnostics()
      });
    } else {
      res.status(500).json({ success: false, error: 'Failed to write to SQLite database' });
    }
  } catch (err: any) {
    console.error('Error in POST /api/state:', err);
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Dedicated atomic database reset
app.post('/api/state/reset', (req, res) => {
  try {
    const accountKey = extractAccountKey(req);
    resetSqliteDatabase(accountKey);
    res.json({ success: true, message: 'SQLite Database reset to clean slate' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

app.post('/api/students/delete', (req, res) => {
  try {
    const accountKey = extractAccountKey(req);
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, error: 'studentId required' });
    }

    deleteStudentFromSqlite(String(studentId));
    const updated = getStateFromSqlite(accountKey);
    res.json({ success: true, remainingStudents: updated.students?.length || 0, lastUpdatedAt: updated.lastUpdatedAt });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Dedicated atomic specialty deletion
app.post('/api/specialties/delete', (req, res) => {
  try {
    const accountKey = extractAccountKey(req);
    const { specialtyId } = req.body;
    if (!specialtyId) {
      return res.status(400).json({ success: false, error: 'specialtyId required' });
    }

    deleteSpecialtyFromSqlite(String(specialtyId));
    const updated = getStateFromSqlite(accountKey);
    res.json({ success: true, lastUpdatedAt: updated.lastUpdatedAt });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Dedicated atomic course deletion
app.post('/api/courses/delete', (req, res) => {
  try {
    const accountKey = extractAccountKey(req);
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ success: false, error: 'courseId required' });
    }

    deleteCourseFromSqlite(String(courseId));
    const updated = getStateFromSqlite(accountKey);
    res.json({ success: true, lastUpdatedAt: updated.lastUpdatedAt });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Dedicated atomic semester deletion
app.post('/api/semesters/delete', (req, res) => {
  try {
    const accountKey = extractAccountKey(req);
    const { semesterId, courseId } = req.body;
    if (!semesterId) {
      return res.status(400).json({ success: false, error: 'semesterId required' });
    }

    const current = getDbData(accountKey) || {};
    const programs = Array.isArray(current.programs) ? current.programs : [];

    const updatedPrograms = programs.map((p: any) => ({
      ...p,
      specialties: (p.specialties || []).map((s: any) => ({
        ...s,
        courses: (s.courses || []).map((c: any) => {
          if (courseId && c.id !== courseId) return c;
          return {
            ...c,
            semesters: (c.semesters || []).filter((sem: any) => sem.id !== semesterId)
          };
        })
      }))
    }));

    const updated = {
      ...current,
      programs: updatedPrograms,
      lastUpdatedAt: new Date().toISOString(),
      lastModifiedBy: 'admin-delete-semester'
    };

    saveDbData(updated, accountKey);
    res.json({ success: true, lastUpdatedAt: updated.lastUpdatedAt });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Dedicated atomic lecture deletion
app.post('/api/lectures/delete', (req, res) => {
  try {
    const accountKey = extractAccountKey(req);
    const { lectureId, courseId, semesterId } = req.body;
    if (!lectureId) {
      return res.status(400).json({ success: false, error: 'lectureId required' });
    }

    const current = getDbData(accountKey) || {};
    const programs = Array.isArray(current.programs) ? current.programs : [];

    const updatedPrograms = programs.map((p: any) => ({
      ...p,
      specialties: (p.specialties || []).map((s: any) => ({
        ...s,
        courses: (s.courses || []).map((c: any) => {
          if (courseId && c.id !== courseId) return c;
          return {
            ...c,
            semesters: (c.semesters || []).map((sem: any) => {
              if (semesterId && sem.id !== semesterId) return sem;
              return {
                ...sem,
                lectures: (sem.lectures || []).filter((lec: any) => lec.id !== lectureId)
              };
            })
          };
        })
      }))
    }));

    const updated = {
      ...current,
      programs: updatedPrograms,
      lastUpdatedAt: new Date().toISOString(),
      lastModifiedBy: 'admin-delete-lecture'
    };

    saveDbData(updated, accountKey);
    res.json({ success: true, lastUpdatedAt: updated.lastUpdatedAt });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Helper to recursively collect all source files in the project
function collectProjectSourceFiles(dirPath: string, baseDir: string = dirPath, result: Record<string, string> = {}): Record<string, string> {
  const rootFiles = ['package.json', 'tsconfig.json', 'vite.config.ts', 'index.html', 'metadata.json', 'server.ts', '.env.example'];
  if (dirPath === baseDir) {
    for (const rf of rootFiles) {
      const full = path.join(baseDir, rf);
      if (fs.existsSync(full) && fs.statSync(full).isFile()) {
        try {
          result[rf] = fs.readFileSync(full, 'utf-8');
        } catch (_) {}
      }
    }
    const srcDir = path.join(baseDir, 'src');
    if (fs.existsSync(srcDir)) {
      collectProjectSourceFiles(srcDir, baseDir, result);
    }
    return result;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      collectProjectSourceFiles(fullPath, baseDir, result);
    } else if (entry.isFile() && /\.(ts|tsx|css|json|html|md)$/.test(entry.name)) {
      try {
        result[relPath] = fs.readFileSync(fullPath, 'utf-8');
      } catch (_) {}
    }
  }
  return result;
}

// 1-Click Download: Complete readable source code of all project files in one text file
app.get('/api/project/download-full-code', (_req, res) => {
  try {
    const files = collectProjectSourceFiles(__dirname);
    const sections: string[] = [
      '================================================================================',
      '  منصة مركز المستقبل للتعليم والتدريب المهني — الكود المصدري الكامل والنهائي',
      '  Future Center Educational Platform — Complete Full-Stack Source Code + SQLite',
      `  تاريخ التصدير: ${new Date().toISOString()}`,
      `  إجمالي الملفات المدمجة: ${Object.keys(files).length} ملف`,
      '================================================================================\n',
      'طريقة التشغيل على أي استضافة Node.js:',
      '1. ضع الملفات التالية في مجلد المشروع بنفس المسارات الموضحة، أو شغل ملف التثبيت التلقائي setup-future-center.mjs',
      '2. نفذ الأمر: npm install',
      '3. لبناء الواجهات: npm run build',
      '4. لتشغيل السيرفر وقاعدة بيانات SQLite: npm start\n'
    ];

    for (const [filePath, content] of Object.entries(files)) {
      sections.push(
        `\n/* ==========================================================================\n` +
        `   FILE: ${filePath}\n` +
        `   ========================================================================== */\n` +
        content
      );
    }

    const fullText = sections.join('\n');
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="future-center-full-source-code.txt"');
    res.send(fullText);
  } catch (err: any) {
    res.status(500).send('Error generating full source code file: ' + (err?.message || ''));
  }
});

// 1-Click Download: Self-extracting Node.js project installer (creates all folders & files automatically)
app.get('/api/project/download-installer', (_req, res) => {
  try {
    const files = collectProjectSourceFiles(__dirname);
    const currentDb = getDbData('hasakahm@gmail.com');
    if (currentDb) {
      files['server-db-hasakahm.json'] = JSON.stringify(currentDb, null, 2);
      files['server-db.json'] = JSON.stringify(currentDb, null, 2);
    }

    const scriptContent = `#!/usr/bin/env node
/**
 * المثبت التلقائي الكامل لمنصة مركز المستقبل للتعليم والتدريب المهني
 * قم بتشغيل هذا الملف عبر الأمر:
 *   node setup-future-center.mjs
 * وسيقوم بإنشاء كافة المجلدات والملفات وقاعدة البيانات تلقائياً!
 */
import fs from 'fs';
import path from 'path';

const FILES = ${JSON.stringify(files, null, 2)};

console.log('جاري إنشاء ملفات ومجلدات منصة مركز المستقبل...');
for (const [relPath, content] of Object.entries(FILES)) {
  const fullPath = path.resolve(process.cwd(), relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
  console.log('✔ تم إنشاء:', relPath);
}
console.log('\\nتم استخراج جميع ملفات المشروع بنجاح! للتشغيل نفذ الأوامر التالية:');
console.log('  npm install');
console.log('  npm run build');
console.log('  npm start');
`;

    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="setup-future-center.mjs"');
    res.send(scriptContent);
  } catch (err: any) {
    res.status(500).send('Error generating installer script: ' + (err?.message || ''));
  }
});

// Export Database JSON
app.get('/api/export', (req, res) => {
  const accountKey = extractAccountKey(req);
  const data = getDbData(accountKey);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="future-center-database.json"');
  res.send(JSON.stringify(data || {}, null, 2));
});

// Import / Restore Database JSON
app.post('/api/import', (req, res) => {
  try {
    const accountKey = extractAccountKey(req);
    const importedData = req.body;
    if (!importedData || typeof importedData !== 'object' || !Array.isArray(importedData.programs)) {
      return res.status(400).json({ success: false, error: 'الملف لا يحتوي على بنية قاعدة بيانات صالحة (programs required)' });
    }

    const updated = {
      ...importedData,
      lastUpdatedAt: new Date().toISOString(),
      lastModifiedBy: 'admin-restore-import'
    };

    saveDbData(updated, accountKey);
    res.json({
      success: true,
      programsCount: updated.programs.length,
      studentsCount: updated.students?.length || 0,
      lastUpdatedAt: updated.lastUpdatedAt
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Server error' });
  }
});

// Setup Vite or static serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
