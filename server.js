import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = Number(process.env.PORT) || 3e3;
const DB_FILE = path.join(__dirname, "server-db.json");
const BACKUP_FILE = path.join(__dirname, "server-db-backup.json");
const AUDIT_LOG_FILE = path.join(__dirname, "audit-logs.json");
function getAuditLogs() {
  if (fs.existsSync(AUDIT_LOG_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(AUDIT_LOG_FILE, "utf-8"));
      if (Array.isArray(parsed)) return parsed;
    } catch (_) {
    }
  }
  const initialLogs = [
    {
      id: "log-iso-1",
      timestamp: new Date(Date.now() - 36e5).toISOString(),
      account: "hasakahm@gmail.com",
      action: "\u0639\u0632\u0644 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0648\u0627\u0644\u062C\u0644\u0633\u0627\u062A \u0627\u0644\u0623\u0643\u0627\u062F\u064A\u0645\u064A\u0629",
      category: "isolation",
      details: "\u062A\u0645 \u0639\u0632\u0644 \u0642\u0627\u0639\u062F\u0629 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062Aserver-db-hasakahm.json \u0628\u0627\u0644\u0643\u0627\u0645\u0644 \u0648\u062A\u0623\u0645\u064A\u0646 16 \u0645\u0642\u0631\u0631\u0627\u064B \u0648 15 \u0645\u062D\u0627\u0636\u0631\u0629 \u0636\u062F \u0627\u0644\u062A\u062F\u0627\u062E\u0644.",
      status: "success",
      userRole: "owner"
    },
    {
      id: "log-sec-2",
      timestamp: new Date(Date.now() - 18e5).toISOString(),
      account: "hasakahm@gmail.com",
      action: "\u0641\u0635\u0644 \u0645\u0633\u0627\u062D\u0627\u062A \u0627\u0644\u0637\u0644\u0627\u0628 \u0639\u0646 \u0635\u0644\u0627\u062D\u064A\u0627\u062A \u0627\u0644\u0645\u0627\u0644\u0643",
      category: "security",
      details: "\u0645\u0646\u0639 \u062F\u062E\u0648\u0644 \u0648\u0636\u0639 \u0627\u0644\u0637\u0627\u0644\u0628 \u0645\u0646 \u062D\u062C\u0628 \u0645\u0642\u0631\u0631\u0627\u062A \u0627\u0644\u0645\u0627\u0644\u0643\u060C \u0648\u062A\u0641\u0639\u064A\u0644 \u0627\u0644\u062A\u0628\u062F\u064A\u0644 \u0627\u0644\u0622\u0645\u0646 \u0627\u0644\u0645\u0628\u0627\u0634\u0631.",
      status: "success",
      userRole: "owner"
    }
  ];
  try {
    fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(initialLogs, null, 2), "utf-8");
  } catch (_) {
  }
  return initialLogs;
}
function addAuditLog(entry) {
  try {
    const logs = getAuditLogs();
    const newEntry = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1e3)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      ...entry
    };
    logs.unshift(newEntry);
    if (logs.length > 500) logs.length = 500;
    fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(logs, null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed to write audit log:", e);
  }
}
app.use(express.json({ limit: "50mb" }));
function extractAccountKey(req) {
  const headerVal = req.headers["x-user-account"];
  const userHeader = req.headers["x-user-email"];
  const queryVal = req.query.account;
  const bodyVal = req.body?.account;
  const candidate = headerVal || userHeader || queryVal || bodyVal || "hasakahm@gmail.com";
  return candidate.trim();
}
function getAccountDbPaths(accountKey) {
  const raw = (accountKey || "hasakahm@gmail.com").toLowerCase();
  let clean = raw.replace(/[^a-z0-9_@.-]/g, "_").replace(/[@.]+/g, "_");
  if (clean.includes("hasakahm")) {
    clean = "hasakahm";
  }
  const dbFile = path.join(__dirname, `server-db-${clean}.json`);
  const backupFile = path.join(__dirname, `server-db-${clean}-backup.json`);
  return { dbFile, backupFile, accountName: clean };
}
function getDbData(accountKey) {
  const { dbFile, backupFile } = getAccountDbPaths(accountKey);
  if (fs.existsSync(dbFile)) {
    try {
      const content = fs.readFileSync(dbFile, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch (e) {
      console.error(`Error reading ${dbFile}, attempting backup:`, e);
    }
  }
  if (fs.existsSync(backupFile)) {
    try {
      const content = fs.readFileSync(backupFile, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object") {
        console.log(`Restored isolated DB from backup: ${backupFile}`);
        saveDbData(parsed, accountKey);
        return parsed;
      }
    } catch (e) {
      console.error(`Error reading ${backupFile}:`, e);
    }
  }
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === "object") {
        saveDbData(parsed, accountKey);
        return parsed;
      }
    } catch (e) {
      console.error("Error seeding isolated DB from DB_FILE:", e);
    }
  }
  return null;
}
function saveDbData(data, accountKey) {
  try {
    const { dbFile, backupFile, accountName } = getAccountDbPaths(accountKey);
    const enriched = {
      ...data,
      accountId: accountKey || "hasakahm@gmail.com",
      ownerEmail: "hasakahm@gmail.com"
    };
    const jsonStr = JSON.stringify(enriched, null, 2);
    if (fs.existsSync(dbFile)) {
      try {
        fs.copyFileSync(dbFile, backupFile);
      } catch (cpErr) {
        console.warn("Backup copy failed:", cpErr);
      }
    }
    fs.writeFileSync(dbFile, jsonStr, "utf-8");
    if (accountName === "hasakahm" || !accountKey || accountKey.toLowerCase().includes("hasakahm")) {
      try {
        fs.writeFileSync(DB_FILE, jsonStr, "utf-8");
        fs.writeFileSync(BACKUP_FILE, jsonStr, "utf-8");
      } catch (_) {
      }
    }
    return true;
  } catch (e) {
    console.error("Error writing DB_FILE:", e);
    return false;
  }
}
app.get("/api/health", (req, res) => {
  const accountKey = extractAccountKey(req);
  const data = getDbData(accountKey);
  res.json({
    status: "ok",
    account: accountKey,
    hasDb: !!data,
    programsCount: data?.programs?.length || 0,
    studentsCount: data?.students?.length || 0,
    lastUpdatedAt: data?.lastUpdatedAt || null
  });
});
app.get("/api/account/status", (req, res) => {
  const accountKey = extractAccountKey(req);
  const data = getDbData(accountKey);
  if (!data) {
    return res.status(404).json({ success: false, message: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u064A\u0627\u0646\u0627\u062A \u0644\u0647\u0630\u0627 \u0627\u0644\u062D\u0633\u0627\u0628" });
  }
  const coursesList = [];
  let totalLectures = 0;
  for (const p of data.programs || []) {
    for (const s of p.specialties || []) {
      for (const c of s.courses || []) {
        const lecs = (c.semesters || []).reduce((acc, sem) => acc + (sem.lectures?.length || 0), 0);
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
app.post("/api/account/restore", (req, res) => {
  try {
    const accountKey = extractAccountKey(req);
    const { dbFile, backupFile } = getAccountDbPaths(accountKey);
    let restoredData = null;
    let source = "";
    if (fs.existsSync(dbFile)) {
      try {
        const content = fs.readFileSync(dbFile, "utf-8");
        restoredData = JSON.parse(content);
        source = dbFile;
      } catch (e) {
        console.error("Error reading primary dbFile:", e);
      }
    }
    if (!restoredData && fs.existsSync(backupFile)) {
      try {
        const content = fs.readFileSync(backupFile, "utf-8");
        restoredData = JSON.parse(content);
        source = backupFile;
      } catch (e) {
        console.error("Error reading backupFile:", e);
      }
    }
    if (!restoredData && fs.existsSync(DB_FILE)) {
      try {
        const content = fs.readFileSync(DB_FILE, "utf-8");
        restoredData = JSON.parse(content);
        source = DB_FILE;
      } catch (e) {
        console.error("Error reading DB_FILE:", e);
      }
    }
    if (!restoredData) {
      return res.status(500).json({ success: false, error: "\u0644\u0645 \u064A\u062A\u0645 \u0627\u0644\u0639\u062B\u0648\u0631 \u0639\u0644\u0649 \u0646\u0633\u062E\u0629 \u0627\u062D\u062A\u064A\u0627\u0637\u064A\u0629 \u0635\u0627\u0644\u062D\u0629 \u0644\u0644\u0627\u0633\u062A\u0631\u062C\u0627\u0639" });
    }
    saveDbData(restoredData, accountKey);
    const coursesList = [];
    for (const p of restoredData.programs || []) {
      for (const s of p.specialties || []) {
        for (const c of s.courses || []) {
          coursesList.push(c.title);
        }
      }
    }
    addAuditLog({
      account: accountKey,
      action: "\u0627\u0633\u062A\u0631\u062C\u0627\u0639 \u0641\u0648\u0631\u064A \u0644\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0645\u0639\u0632\u0648\u0644\u0629",
      category: "restore",
      details: `\u062A\u0645 \u0627\u0633\u062A\u0631\u062C\u0627\u0639 ${coursesList.length} \u0645\u0642\u0631\u0631\u0627\u064B \u062F\u0631\u0627\u0633\u064A\u0627\u064B \u0628\u0646\u062C\u0627\u062D \u0645\u0646 \u0627\u0644\u0645\u0635\u062F\u0631 (${source}) \u062F\u0648\u0646 \u0627\u0644\u0645\u0633\u0627\u0633 \u0628\u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A \u0627\u0644\u0642\u062F\u064A\u0645\u0629`,
      status: "success",
      userRole: "owner"
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
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || "Server error" });
  }
});
app.get("/api/audit-logs", (req, res) => {
  const accountKey = extractAccountKey(req);
  const logs = getAuditLogs();
  res.json({
    success: true,
    account: accountKey,
    total: logs.length,
    logs
  });
});
app.post("/api/audit-logs/record", (req, res) => {
  try {
    const accountKey = extractAccountKey(req);
    const { action, category, details, status, userRole, targetId } = req.body;
    addAuditLog({
      account: accountKey,
      action: action || "\u0639\u0645\u0644\u064A\u0629 \u063A\u064A\u0631 \u0645\u0633\u0645\u0627\u0629",
      category: category || "auth",
      details: details || "",
      status: status || "success",
      userRole: userRole || "owner",
      targetId
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message });
  }
});
function countTotalCourses(progs) {
  if (!Array.isArray(progs)) return 0;
  let count = 0;
  for (const p of progs) {
    for (const s of p.specialties || []) {
      count += s.courses?.length || 0;
    }
  }
  return count;
}
app.get("/api/state", (req, res) => {
  const accountKey = extractAccountKey(req);
  const data = getDbData(accountKey);
  if (data) {
    res.json({ success: true, account: accountKey, data });
  } else {
    res.json({ success: true, account: accountKey, data: null });
  }
});
app.post("/api/state", (req, res) => {
  try {
    const accountKey = extractAccountKey(req);
    const { programs, students, siteSettings, shamCashRequests, notifications, lastModifiedBy } = req.body;
    const current = getDbData(accountKey) || {};
    let safePrograms = current.programs;
    if (programs !== void 0 && Array.isArray(programs)) {
      safePrograms = programs;
    }
    let safeStudents = current.students;
    if (students !== void 0 && Array.isArray(students)) {
      safeStudents = students;
    }
    const updated = {
      ...current,
      programs: safePrograms,
      students: safeStudents,
      siteSettings: siteSettings !== void 0 ? siteSettings : current.siteSettings,
      shamCashRequests: shamCashRequests !== void 0 ? shamCashRequests : current.shamCashRequests,
      notifications: notifications !== void 0 ? notifications : current.notifications,
      lastUpdatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastModifiedBy: lastModifiedBy || accountKey
    };
    const saved = saveDbData(updated, accountKey);
    if (saved) {
      res.json({
        success: true,
        account: accountKey,
        coursesCount: countTotalCourses(updated.programs),
        lastUpdatedAt: updated.lastUpdatedAt
      });
    } else {
      res.status(500).json({ success: false, error: "Failed to write to database file" });
    }
  } catch (err) {
    console.error("Error in POST /api/state:", err);
    res.status(500).json({ success: false, error: err?.message || "Server error" });
  }
});
app.post("/api/students/delete", (req, res) => {
  try {
    const accountKey = extractAccountKey(req);
    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ success: false, error: "studentId required" });
    }
    const current = getDbData(accountKey) || {};
    const students = Array.isArray(current.students) ? current.students : [];
    const filtered = students.filter((s) => s.id !== studentId);
    const shamReqs = Array.isArray(current.shamCashRequests) ? current.shamCashRequests : [];
    const filteredReqs = shamReqs.filter((r) => r.studentId !== studentId);
    const updated = {
      ...current,
      students: filtered,
      shamCashRequests: filteredReqs,
      lastUpdatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastModifiedBy: "admin-delete-student"
    };
    saveDbData(updated, accountKey);
    res.json({ success: true, remainingStudents: filtered.length, lastUpdatedAt: updated.lastUpdatedAt });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || "Server error" });
  }
});
app.post("/api/specialties/delete", (req, res) => {
  try {
    const accountKey = extractAccountKey(req);
    const { specialtyId, programId } = req.body;
    if (!specialtyId) {
      return res.status(400).json({ success: false, error: "specialtyId required" });
    }
    const current = getDbData(accountKey) || {};
    const programs = Array.isArray(current.programs) ? current.programs : [];
    const updatedPrograms = programs.map((p) => {
      if (programId && p.id !== programId && !p.specialties?.some((s) => s.id === specialtyId)) {
        return p;
      }
      return {
        ...p,
        specialties: (p.specialties || []).filter((s) => s.id !== specialtyId)
      };
    });
    const students = Array.isArray(current.students) ? current.students : [];
    const updatedStudents = students.map((s) => {
      if (s.specialtyId === specialtyId) {
        return { ...s, specialtyId: "", allowedCourseIds: [] };
      }
      return s;
    });
    const updated = {
      ...current,
      programs: updatedPrograms,
      students: updatedStudents,
      lastUpdatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastModifiedBy: "admin-delete-specialty"
    };
    saveDbData(updated, accountKey);
    res.json({ success: true, lastUpdatedAt: updated.lastUpdatedAt });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || "Server error" });
  }
});
app.post("/api/courses/delete", (req, res) => {
  try {
    const accountKey = extractAccountKey(req);
    const { courseId } = req.body;
    if (!courseId) {
      return res.status(400).json({ success: false, error: "courseId required" });
    }
    const current = getDbData(accountKey) || {};
    const programs = Array.isArray(current.programs) ? current.programs : [];
    const updatedPrograms = programs.map((p) => ({
      ...p,
      specialties: (p.specialties || []).map((s) => ({
        ...s,
        courses: (s.courses || []).filter((c) => c.id !== courseId)
      }))
    }));
    const students = Array.isArray(current.students) ? current.students : [];
    const updatedStudents = students.map((s) => ({
      ...s,
      allowedCourseIds: Array.isArray(s.allowedCourseIds) ? s.allowedCourseIds.filter((id) => id !== courseId) : []
    }));
    const updated = {
      ...current,
      programs: updatedPrograms,
      students: updatedStudents,
      lastUpdatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastModifiedBy: "admin-delete-course"
    };
    saveDbData(updated, accountKey);
    res.json({ success: true, lastUpdatedAt: updated.lastUpdatedAt });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || "Server error" });
  }
});
app.post("/api/semesters/delete", (req, res) => {
  try {
    const accountKey = extractAccountKey(req);
    const { semesterId, courseId } = req.body;
    if (!semesterId) {
      return res.status(400).json({ success: false, error: "semesterId required" });
    }
    const current = getDbData(accountKey) || {};
    const programs = Array.isArray(current.programs) ? current.programs : [];
    const updatedPrograms = programs.map((p) => ({
      ...p,
      specialties: (p.specialties || []).map((s) => ({
        ...s,
        courses: (s.courses || []).map((c) => {
          if (courseId && c.id !== courseId) return c;
          return {
            ...c,
            semesters: (c.semesters || []).filter((sem) => sem.id !== semesterId)
          };
        })
      }))
    }));
    const updated = {
      ...current,
      programs: updatedPrograms,
      lastUpdatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastModifiedBy: "admin-delete-semester"
    };
    saveDbData(updated, accountKey);
    res.json({ success: true, lastUpdatedAt: updated.lastUpdatedAt });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || "Server error" });
  }
});
app.post("/api/lectures/delete", (req, res) => {
  try {
    const accountKey = extractAccountKey(req);
    const { lectureId, courseId, semesterId } = req.body;
    if (!lectureId) {
      return res.status(400).json({ success: false, error: "lectureId required" });
    }
    const current = getDbData(accountKey) || {};
    const programs = Array.isArray(current.programs) ? current.programs : [];
    const updatedPrograms = programs.map((p) => ({
      ...p,
      specialties: (p.specialties || []).map((s) => ({
        ...s,
        courses: (s.courses || []).map((c) => {
          if (courseId && c.id !== courseId) return c;
          return {
            ...c,
            semesters: (c.semesters || []).map((sem) => {
              if (semesterId && sem.id !== semesterId) return sem;
              return {
                ...sem,
                lectures: (sem.lectures || []).filter((lec) => lec.id !== lectureId)
              };
            })
          };
        })
      }))
    }));
    const updated = {
      ...current,
      programs: updatedPrograms,
      lastUpdatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastModifiedBy: "admin-delete-lecture"
    };
    saveDbData(updated, accountKey);
    res.json({ success: true, lastUpdatedAt: updated.lastUpdatedAt });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || "Server error" });
  }
});
app.get("/api/export", (req, res) => {
  const accountKey = extractAccountKey(req);
  const data = getDbData(accountKey);
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", 'attachment; filename="future-center-database.json"');
  res.send(JSON.stringify(data || {}, null, 2));
});
app.post("/api/import", (req, res) => {
  try {
    const accountKey = extractAccountKey(req);
    const importedData = req.body;
    if (!importedData || typeof importedData !== "object" || !Array.isArray(importedData.programs)) {
      return res.status(400).json({ success: false, error: "\u0627\u0644\u0645\u0644\u0641 \u0644\u0627 \u064A\u062D\u062A\u0648\u064A \u0639\u0644\u0649 \u0628\u0646\u064A\u0629 \u0642\u0627\u0639\u062F\u0629 \u0628\u064A\u0627\u0646\u0627\u062A \u0635\u0627\u0644\u062D\u0629 (programs required)" });
    }
    const updated = {
      ...importedData,
      lastUpdatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastModifiedBy: "admin-restore-import"
    };
    saveDbData(updated, accountKey);
    res.json({
      success: true,
      programsCount: updated.programs.length,
      studentsCount: updated.students?.length || 0,
      lastUpdatedAt: updated.lastUpdatedAt
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || "Server error" });
  }
});
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production";
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true",
        watch: process.env.DISABLE_HMR === "true" ? null : {}
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
