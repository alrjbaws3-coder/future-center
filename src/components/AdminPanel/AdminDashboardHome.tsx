import React, { useState, useRef } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  Folder, 
  ArrowLeft,
  Bell,
  Settings,
  UserPlus,
  ArrowRight,
  DownloadCloud,
  Check,
  X,
  Sparkles,
  FileUp,
  Database,
  RefreshCw,
  Download,
  Upload,
  ShieldCheck
} from 'lucide-react';

interface AdminDashboardHomeProps {
  onSelectTab: (tabId: string) => void;
}

export const AdminDashboardHome: React.FC<AdminDashboardHomeProps> = ({ onSelectTab }) => {
  const { 
    programs, 
    students, 
    shamCashRequests, 
    notifications, 
    siteSettings, 
    toggleGlobalOfflineDownload,
    refreshData,
    lastSyncedAt,
    exportDatabaseJson,
    importDatabaseJson,
    addToast
  } = usePlatform();

  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await refreshData();
    setIsSyncing(false);
    addToast('success', 'تم التحقق من مزامنة قاعدة البيانات المركزية بنجاح.');
  };

  const handleExportBackup = async () => {
    try {
      const json = await exportDatabaseJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `future-center-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('success', 'تم تنزيل النسخة الاحتياطية لقاعدة البيانات بنجاح.');
    } catch {
      addToast('error', 'حدث خطأ أثناء تصدير قاعدة البيانات.');
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = await importDatabaseJson(content);
        if (res.success) {
          addToast('success', 'تمت استعادة وتحديث قاعدة البيانات بنجاح.');
        } else {
          addToast('error', res.message);
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Calculated Stats
  const totalPrograms = programs.length;
  const totalSpecialties = programs.reduce((acc, p) => acc + p.specialties.length, 0);
  const totalCourses = programs.reduce(
    (acc, p) => acc + p.specialties.reduce((acc2, s) => acc2 + s.courses.length, 0),
    0
  );
  const totalLectures = programs.reduce(
    (acc, p) => acc + p.specialties.reduce(
      (acc2, s) => acc2 + s.courses.reduce(
        (acc3, c) => acc3 + c.semesters.reduce((acc4, sem) => acc4 + sem.lectures.length, 0),
        0
      ),
      0
    ),
    0
  );

  const pendingRequests = shamCashRequests.filter(r => r.status === 'pending');
  const activeStudents = students.filter(s => s.status === 'active');
  const ownerNotifications = notifications.filter(n => n.userId === 'owner-1' || n.userId === 'all');
  const unreadOwnerNotifs = ownerNotifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-50/90 via-white to-sky-50 p-6 rounded-3xl border border-blue-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full text-xs font-bold text-blue-700 border border-blue-200 mb-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>لوحة الإدارة المعتمدة — مركز المستقبل</span>
          </div>
          <h2 className="text-2xl font-black text-[#0c3250]">مرحباً بك في لوحة تحكم المنصة</h2>
          <p className="text-xs text-[#595e65] mt-1">
            إدارة كاملة للنظام الأكاديمي الهرمي، صلاحيات الطلاب، وحوالات شام كاش
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onSelectTab('pdf-management')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <FileUp className="w-4 h-4 text-blue-400" />
            <span>رفع وإدارة ملفات PDF</span>
          </button>
          <button
            onClick={() => onSelectTab('curriculum')}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Folder className="w-4 h-4" />
            <span>إدارة البرامج والمقررات</span>
          </button>
        </div>
      </div>

      {/* Central Persistent Database Status Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-[#0c3250] text-white p-5 sm:p-6 rounded-3xl shadow-md border border-blue-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
              <Database className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-white">قاعدة البيانات المركزية المشتركة</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>متصلة ومحفوظة على الخادم</span>
                </span>
                {lastSyncedAt && (
                  <span className="text-[11px] text-slate-300 font-mono">
                    (آخر مزامنة: {new Date(lastSyncedAt).toLocaleTimeString('ar-SY')})
                  </span>
                )}
              </div>
              <p className="text-xs text-sky-100 mt-1 leading-relaxed">
                أي إضافة، تعديل، أو حذف (للطلاب أو المقررات أو الاختصاصات) يتم حفظه فوراً في قاعدة البيانات المركزية ويظهر لجميع الأجهزة والمتصفحات تلقائياً دون فقدان.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/20"
              title="مزامنة فورية الآن من الخادم"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-sky-300 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'جارِ التحقق...' : 'مزامنة الآن'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportBackup}
              className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="تنزيل نسخة احتياطية كاملة JSON على جهازك"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير نسخة احتياطية</span>
            </button>

            <label className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-white/20">
              <Upload className="w-3.5 h-3.5 text-amber-300" />
              <span>استيراد نسخة</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Owner Quick Control Banner: Offline Lectures Download */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        siteSettings.allowOfflineLecturesDownload !== false
          ? 'bg-emerald-50/70 border-emerald-200'
          : 'bg-rose-50/70 border-rose-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            siteSettings.allowOfflineLecturesDownload !== false
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-rose-100 text-rose-700'
          }`}>
            <DownloadCloud className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#0c3250]">تنزيل محاضرات الأوفلاين للطلاب:</span>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                siteSettings.allowOfflineLecturesDownload !== false
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}>
                {siteSettings.allowOfflineLecturesDownload !== false ? 'مفعل للطلاب' : 'معطل بقرار المالك'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {siteSettings.allowOfflineLecturesDownload !== false
                ? 'الطلاب يمكنهم تنزيل المحاضرات للمشاهدة بدون إنترنت. (مذكرات الـ PDF مستقلة ومتاحة دائماً للقراءة والتنزيل خارج الأوفلاين)'
                : 'تم إيقاف تنزيل محاضرات الأوفلاين مؤقتاً لجميع الطلاب. (ملاحظة: قراءة وتنزيل مذكرات الـ PDF تظل متاحة بشكل كامل وطبيعي خارج الأوفلاين)'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleGlobalOfflineDownload}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-2xs ${
            siteSettings.allowOfflineLecturesDownload !== false
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {siteSettings.allowOfflineLecturesDownload !== false ? (
            <>
              <X className="w-4 h-4" />
              <span>إيقاف تنزيل الأوفلاين</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>تفعيل تنزيل الأوفلاين</span>
            </>
          )}
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Students */}
        <div 
          onClick={() => onSelectTab('students')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-500 transition-all cursor-pointer shadow-xs space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي الطلاب</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0c3250]">{students.length}</div>
          <div className="text-[11px] text-blue-700 font-semibold flex items-center gap-1">
            <span>{activeStudents.length} حساب نشط حالياً</span>
          </div>
        </div>

        {/* Card 2: Academic Hierarchy */}
        <div 
          onClick={() => onSelectTab('curriculum')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-sky-500 transition-all cursor-pointer shadow-xs space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">المقررات الدراسية</span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0c3250]">{totalCourses}</div>
          <div className="text-[11px] text-slate-500">
            موزعة على {totalSpecialties} اختصاصات
          </div>
        </div>

        {/* Card 3: Lectures count */}
        <div 
          onClick={() => onSelectTab('curriculum')}
          className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 transition-all cursor-pointer shadow-xs space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">المحاضرات المسجلة</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0c3250]">{totalLectures}</div>
          <div className="text-[11px] text-blue-700 font-semibold">
            مع ملفات PDF وخاصية Offline
          </div>
        </div>

        {/* Card 4: Sham Cash Requests */}
        <div 
          onClick={() => onSelectTab('sham-cash')}
          className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer shadow-xs space-y-2 group ${
            pendingRequests.length > 0 ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">طلبات شام كاش</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0c3250]">{shamCashRequests.length}</div>
          <div className="text-[11px] text-amber-700 font-bold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{pendingRequests.length} طلب بانتظار المراجعة</span>
          </div>
        </div>

      </div>

      {/* Alerts, Sham Cash, and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Box 1: Owner Alerts Feed (New Students & Educational Updates) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-[#0c3250] flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <span>أحدث تنبيهات النظام والإدارة</span>
              {unreadOwnerNotifs > 0 && (
                <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full">
                  {unreadOwnerNotifs} جديد
                </span>
              )}
            </h3>

            <button
              onClick={() => onSelectTab('notifications')}
              className="text-xs text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>مركز الإشعارات</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {ownerNotifications.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">لا توجد تنبيهات واردة حالياً.</p>
            ) : (
              ownerNotifications.slice(0, 3).map((notif) => (
                <div 
                  key={notif.id}
                  onClick={() => onSelectTab('notifications')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    notif.read ? 'bg-slate-50/70 border-slate-100 hover:bg-slate-50' : 'bg-blue-50/50 border-blue-200 shadow-2xs'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-[#0c3250]">{notif.title}</span>
                      {!notif.read && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">{notif.date}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Box 2: Pending Sham Cash List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-[#0c3250] flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-600" />
              <span>طلبات شام كاش الحديثة</span>
            </h3>

            <button
              onClick={() => onSelectTab('sham-cash')}
              className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
            >
              عرض الكل ({shamCashRequests.length})
            </button>
          </div>

          <div className="space-y-3">
            {shamCashRequests.slice(0, 3).map((req) => (
              <div 
                key={req.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-bold text-[#0c3250] block">{req.studentName}</span>
                  <span className="text-[11px] text-slate-500">{req.specialtyName} • {req.amount.toLocaleString()} ل.س</span>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                  req.status === 'pending'
                    ? 'bg-amber-100 text-amber-800'
                    : req.status === 'approved'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {req.status === 'pending' ? 'قيد الانتظار' : req.status === 'approved' ? 'مقبول' : 'مرفوض'}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Quick Links & Site Setup */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-[#0c3250] flex items-center gap-2">
          <Settings className="w-4 h-4 text-blue-600" />
          <span>إجراءات وإعدادات سريعة</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <button
            onClick={() => onSelectTab('smart-curriculum')}
            className="p-3.5 rounded-xl border border-blue-200 hover:border-blue-500 bg-blue-50/60 hover:bg-white text-right space-y-1 transition-all cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <div className="font-bold text-[#0c3250]">إدارة الاختصاصات والمواد</div>
            <p className="text-[11px] text-slate-500">النموذج البسيط لإضافة الاختصاص ومواده</p>
          </button>

          <button
            onClick={() => onSelectTab('students')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-white text-right space-y-1 transition-all cursor-pointer"
          >
            <Users className="w-4 h-4 text-blue-600" />
            <div className="font-bold text-[#0c3250]">إضافة طالب وتفعيل مقررات</div>
            <p className="text-[11px] text-slate-400">تحديد صلاحيات المواد وحالة الحساب</p>
          </button>

          <button
            onClick={() => onSelectTab('curriculum')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-sky-500 bg-slate-50 hover:bg-white text-right space-y-1 transition-all cursor-pointer"
          >
            <Folder className="w-4 h-4 text-sky-600" />
            <div className="font-bold text-[#0c3250]">إضافة محاضرات وملفات PDF</div>
            <p className="text-[11px] text-slate-400">نظام المجلدات الهرمي للمقررات</p>
          </button>

          <button
            onClick={() => onSelectTab('about-editor')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-white text-right space-y-1 transition-all cursor-pointer"
          >
            <GraduationCap className="w-4 h-4 text-indigo-600" />
            <div className="font-bold text-[#0c3250]">تعديل «نبذة عن المركز»</div>
            <p className="text-[11px] text-slate-400">تحديث النص المعتمد وأهداف المركز</p>
          </button>

          <button
            onClick={() => onSelectTab('site-editor')}
            className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-400 bg-slate-50 hover:bg-white text-right space-y-1 transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-600" />
            <div className="font-bold text-[#0c3250]">أرقام شام كاش والتواصل</div>
            <p className="text-[11px] text-slate-400">إعدادات التحويل والحساب المالي</p>
          </button>
        </div>
      </div>

    </div>
  );
};
