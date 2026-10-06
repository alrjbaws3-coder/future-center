import React, { useState, useEffect } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { PlatformSnapshot } from '../../utils/persistentDb';
import { 
  ShieldCheck, 
  Download, 
  Upload, 
  RefreshCw, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Users, 
  BookOpen, 
  HardDrive,
  FileText,
  RotateCcw,
  Sparkles,
  Info
} from 'lucide-react';

export const AdminBackupCenter: React.FC = () => {
  const { 
    programs, 
    students, 
    siteSettings,
    downloadBackupFile, 
    importDatabaseJson, 
    refreshData, 
    restoreFromSnapshot, 
    getAllSnapshots,
    forceSavePermanentBackup,
    cleanResetPlatform,
    lastSyncedAt,
    isServerReady,
    addToast 
  } = usePlatform();

  const [snapshots, setSnapshots] = useState<PlatformSnapshot[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<{ programsCount: number; studentsCount: number; date: string } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [confirmResetModal, setConfirmResetModal] = useState(false);
  const [confirmRestoreTarget, setConfirmRestoreTarget] = useState<{ id: string; label?: string } | null>(null);

  // Calculate statistics
  let totalCourses = 0;
  let totalLectures = 0;
  for (const p of programs) {
    for (const s of p.specialties || []) {
      totalCourses += s.courses?.length || 0;
      for (const c of s.courses || []) {
        for (const sem of c.semesters || []) {
          totalLectures += sem.lectures?.length || 0;
        }
      }
    }
  }

  // Load available snapshots from IndexedDB
  const loadSnapshots = async () => {
    setLoadingSnapshots(true);
    try {
      const list = await getAllSnapshots();
      setSnapshots(list);
    } catch (e) {
      console.warn('Error loading snapshots:', e);
    } finally {
      setLoadingSnapshots(false);
    }
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  // Handle manual backup snapshot
  const handleManualSave = async () => {
    setIsSavingManual(true);
    const success = await forceSavePermanentBackup('نسخة احتياطية يدوية');
    if (success) {
      addToast('success', 'تم حفظ نسخة احتياطية جديدة بنجاح في الذاكرة الدائمة والخادم.');
      await loadSnapshots();
    } else {
      addToast('error', 'تعذر حفظ النسخة الاحتياطية.');
    }
    setIsSavingManual(false);
  };

  // Handle file selection for import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        let coursesCount = 0;
        if (Array.isArray(parsed.programs)) {
          for (const p of parsed.programs) {
            for (const s of p.specialties || []) {
              coursesCount += s.courses?.length || 0;
            }
          }
        }
        setFilePreview({
          programsCount: parsed.programs?.length || 0,
          studentsCount: parsed.students?.length || 0,
          date: parsed.exportedAt || parsed.lastUpdatedAt || 'غير محدد'
        });
      } catch (err) {
        addToast('error', 'الملف المحدد ليس ملف JSON صالحاً.');
        setSelectedFile(null);
        setFilePreview(null);
      }
    };
    reader.readAsText(file);
  };

  // Confirm import from selected file
  const handleConfirmImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const res = await importDatabaseJson(text);
        if (res.success) {
          addToast('success', 'تم استيراد واسترجاع كافة البيانات بنجاح!');
          setSelectedFile(null);
          setFilePreview(null);
          await loadSnapshots();
        } else {
          addToast('error', res.message || 'فشل الاستيراد.');
        }
      } catch (err) {
        addToast('error', 'حدث خطأ أثناء معالجة ملف الاستيراد.');
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(selectedFile);
  };

  // Restore snapshot from IndexedDB
  const handleRestoreSnapshot = (id: string, label?: string) => {
    setConfirmRestoreTarget({ id, label });
  };

  const executeRestore = async (id: string) => {
    setIsRestoring(id);
    const success = await restoreFromSnapshot(id);
    if (success) {
      addToast('success', 'تم استرجاع النسخة الاحتياطية بنجاح!');
      await loadSnapshots();
    } else {
      addToast('error', 'تعذر استرجاع النسخة الاحتياطية.');
    }
    setIsRestoring(null);
    setConfirmRestoreTarget(null);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0c3250] to-[#164e63] p-6 rounded-3xl text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-xl font-black">مركز الأمان والنسخ الاحتياطي الدائم</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                حماية شاملة ضد فقدان البيانات
              </span>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              يتم حفظ بياناتك تلقائياً في ذاكرة المتصفح الدائمة (IndexedDB) وعلى الخادم معاً. يمكنك في أي وقت تنزيل نسخة احتياطية كاملة إلى حاسوبك أو هاتفك واستعادتها في ثوانٍ.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={downloadBackupFile}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تحميل نسخة احتياطية (JSON)</span>
            </button>

            <button
              onClick={handleManualSave}
              disabled={isSavingManual}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer backdrop-blur-xs border border-white/10 disabled:opacity-50"
            >
              <HardDrive className="w-4 h-4 text-blue-300" />
              <span>{isSavingManual ? 'جاري الحفظ...' : 'حفظ نقطة استعادة الآن'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Live System Data & Security Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">حالة الأمان والحفظ</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-slate-800 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>نشط ومؤمن بالكامل</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">تزامن ثنائي (IndexedDB + الخادم)</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">الطلاب المسجلون</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0c3250]">{students.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">حسابات طلاب محفوظة ومحمية</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">المقررات والمحاضرات</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0c3250]">
            {totalCourses} <span className="text-xs font-normal text-slate-500">مقرر / {totalLectures} محاضرة</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">عبر كافة البرامج الأكاديمية</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500">آخر مزامنة</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-black text-slate-800">
            {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString('ar-SA') : 'لحظي'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {lastSyncedAt ? new Date(lastSyncedAt).toLocaleDateString('ar-SA') : 'محفوظ محلياً'}
          </p>
        </div>

      </div>

      {/* Main 2-Column Section: Restore from File & Download */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Box 1: Download Full Backup */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#0c3250]">تنزيل نسخة احتياطية خارجية (JSON)</h4>
              <p className="text-xs text-slate-500">احتفظ بنسخة من بياناتك في مكان آمن على حاسوبك أو هاتفك</p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-800 space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>محتويات النسخة الاحتياطية:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-emerald-700 pr-1">
              <li>جميع الطلاب المسجلين وصلاحياتهم وأرقامهم الأكاديمية ({students.length} طالب)</li>
              <li>كافة البرامج والمقررات والمحاضرات والملفات ({totalCourses} مادة)</li>
              <li>طلبات شام كاش وسجلات الدفع</li>
              <li>إعدادات الموقع وتخصيص الواجهة</li>
            </ul>
          </div>

          <button
            onClick={downloadBackupFile}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>تحميل ملف النسخة الاحتياطية لجهازي الآن</span>
          </button>
        </div>

        {/* Box 2: Restore from File */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#0c3250]">استيراد واستعادة من ملف نسخة احتياطية</h4>
              <p className="text-xs text-slate-500">استرجع بياناتك في أي وقت عن طريق رفع ملف النسخة الاحتياطية</p>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center hover:border-blue-500 transition-colors bg-slate-50/50">
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
              id="backup-file-upload"
            />
            <label htmlFor="backup-file-upload" className="cursor-pointer block">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <span className="text-xs font-bold text-blue-600 hover:underline block">
                {selectedFile ? selectedFile.name : 'انقر لاختيار ملف النسخة الاحتياطية (JSON)'}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">يدعم ملفات JSON المُصدّرة من هذه المنصة</span>
            </label>
          </div>

          {filePreview && (
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
              <div className="font-bold flex items-center justify-between">
                <span>معاينة الملف المختار:</span>
                <span className="text-[11px] text-blue-600">{filePreview.date}</span>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-blue-800">
                <span>الطلاب: <b>{filePreview.studentsCount}</b></span>
                <span>البرامج: <b>{filePreview.programsCount}</b></span>
              </div>
            </div>
          )}

          <button
            onClick={handleConfirmImport}
            disabled={!selectedFile || isImporting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isImporting ? 'جاري الاستيراد والتطبيق...' : 'تأكيد استعادة النسخة الاحتياطية'}</span>
          </button>
        </div>

      </div>

      {/* Box 3: Historical Snapshots in Browser's IndexedDB */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-[#0c3250]">سجل نقاط الاستعادة المحفوظة تلقائياً في المتصفح</h4>
              <p className="text-xs text-slate-500">نقاط استعادة يتم تسجيلها تلقائياً في الذاكرة الدائمة عند إجراء أي تعديل</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadSnapshots}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              title="تحديث السجل"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingSnapshots ? 'animate-spin' : ''}`} />
              <span className="text-[11px]">تحديث</span>
            </button>
          </div>
        </div>

        {snapshots.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
            <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-bold">لا توجد نقاط استعادة سابقة حتى الآن.</p>
            <p className="text-[11px] text-slate-400 mt-1">يتم إنشاء النقاط تلقائياً بمجرد إضافة أو تعديل أي طالب أو مقرر، أو اضغط زر "حفظ نقطة استعادة الآن" بالأعلى.</p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {snapshots.map((snap) => (
              <div 
                key={snap.id} 
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-blue-300 transition-colors bg-slate-50/70 hover:bg-blue-50/30"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#0c3250]">{snap.label || 'نقطة استعادة تلقائية'}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                      {snap.source === 'manual_backup' ? 'يدوي' : snap.source === 'server_sync' ? 'تزامن خادم' : 'تلقائي'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {new Date(snap.timestamp).toLocaleString('ar-SA')}
                    </span>
                    <span>الطلاب: <b className="text-slate-700">{snap.stats.studentsCount}</b></span>
                    <span>المواد: <b className="text-slate-700">{snap.stats.coursesCount}</b></span>
                    <span>المحاضرات: <b className="text-slate-700">{snap.stats.lecturesCount}</b></span>
                  </div>
                </div>

                <button
                  onClick={() => handleRestoreSnapshot(snap.id, snap.label)}
                  disabled={isRestoring === snap.id}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors self-end sm:self-auto shrink-0 shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isRestoring === snap.id ? 'جاري الاسترجاع...' : 'استرجاع هذه النسخة'}</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone: Clean Slate Database Reset */}
      <div className="bg-red-50/60 rounded-2xl p-5 border border-red-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-black text-red-950">تصفير المنصة والبدء من جديد (Clean Slate Reset)</h3>
            </div>
            <p className="text-xs text-red-700 leading-relaxed max-w-2xl">
              تفريغ كافة المواد والطلاب والبيانات السابقة للبدء بصفحة بيضاء نظيفة تماماً لإدخال بيانات المركز الحقيقية والمقررات الرسمية من الصفر.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfirmResetModal(true)}
            className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>تصفير وبدء قاعدة بيانات جديدة</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Clean Reset */}
      {confirmResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in" dir="rtl">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto shadow-2xs">
              <RotateCcw className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-900">تصفير المنصة والبدء من جديد</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              هل أنت متأكد من رغبتك في تصفير المنصة بالكامل والبدء بقاعدة بيانات نظيفة وجديدة؟
            </p>
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 text-right space-y-1 font-medium">
              <span>سيتم إفراغ كافة الاختصاصات والمقررات والطلاب القدامى لتتمكن من إضافة بياناتك الحقيقية على نظافة وبدون أي خربطة سابقة.</span>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmResetModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={async () => {
                  setConfirmResetModal(false);
                  await cleanResetPlatform();
                  await loadSnapshots();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                تأكيد التصفير الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Snapshot Restore */}
      {confirmRestoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in" dir="rtl">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
              <RotateCcw className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-900">استرجاع نسخة احتياطية</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              هل أنت متأكد من استرجاع &quot;{confirmRestoreTarget.label || 'هذه النسخة'}&quot;؟
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmRestoreTarget(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => executeRestore(confirmRestoreTarget.id)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                استرجاع النسخة
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
