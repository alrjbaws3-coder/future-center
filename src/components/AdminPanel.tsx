import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { AdminDashboardHome } from './AdminPanel/AdminDashboardHome';
import { HierarchicalCurriculum } from './AdminPanel/HierarchicalCurriculum';
import { AdminStudents } from './AdminPanel/AdminStudents';
import { AdminShamCash } from './AdminPanel/AdminShamCash';
import { AdminNotifications } from './AdminPanel/AdminNotifications';
import { AdminAboutEditor } from './AdminPanel/AdminAboutEditor';
import { AdminSiteEditor } from './AdminPanel/AdminSiteEditor';
import { SmartCurriculumWizard } from './AdminPanel/SmartCurriculumWizard';
import { PdfManagement } from './AdminPanel/PdfManagement';
import { AuditLogsViewer } from './AdminPanel/AuditLogsViewer';
import { AdminBackupCenter } from './AdminPanel/AdminBackupCenter';
import { 
  LayoutDashboard, 
  Users, 
  FolderTree, 
  CreditCard, 
  Bell, 
  Building2, 
  Settings, 
  UserCheck, 
  LogOut,
  ArrowRight,
  Shield,
  DownloadCloud,
  Check,
  X,
  Sparkles,
  FileUp,
  History,
  Link,
  ShieldCheck,
  Download
} from 'lucide-react';

interface AdminPanelProps {
  onBackToHome?: () => void;
  initialCourseId?: string | null;
  onClearInitialCourse?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  onBackToHome,
  initialCourseId,
  onClearInitialCourse
}) => {
  const { 
    currentUser, 
    logout, 
    shamCashRequests, 
    notifications, 
    siteSettings, 
    toggleGlobalOfflineDownload, 
    addToast,
    downloadBackupFile 
  } = usePlatform();
  const [activeTab, setActiveTab] = useState<string>(() => {
    return initialCourseId ? 'curriculum' : 'dashboard';
  });

  const handleCopyStudentLoginLink = () => {
    const loginUrl = `${window.location.origin}/login`;
    navigator.clipboard.writeText(loginUrl);
    addToast('success', `تم نسخ رابط تسجيل دخول الطلاب بنجاح: ${loginUrl}`);
  };

  React.useEffect(() => {
    if (initialCourseId) {
      setActiveTab('curriculum');
    }
  }, [initialCourseId]);

  const pendingRequestsCount = shamCashRequests.filter(r => r.status === 'pending').length;
  const unreadOwnerNotifsCount = notifications.filter(n => (n.userId === 'owner-1' || n.userId === 'all') && !n.read).length;

  const sidebarItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'smart-curriculum', label: 'إدارة الاختصاصات والمواد', icon: Sparkles },
    { id: 'students', label: 'الطلاب', icon: Users },
    { id: 'curriculum', label: 'المناهج والمحاضرات', icon: FolderTree },
    { id: 'pdf-management', label: 'رفع وإدارة ملفات PDF', icon: FileUp },
    { 
      id: 'sham-cash', 
      label: 'طلبات شام كاش', 
      icon: CreditCard,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined
    },
    { 
      id: 'notifications', 
      label: 'الإشعارات والتنبيهات', 
      icon: Bell,
      badge: unreadOwnerNotifsCount > 0 ? unreadOwnerNotifsCount : undefined
    },
    { id: 'about-editor', label: 'حول المركز', icon: Building2 },
    { id: 'site-editor', label: 'التعديل على الموقع', icon: Settings },
    { id: 'backup-center', label: 'النسخ الاحتياطي والأمان الدائم', icon: ShieldCheck },
    { id: 'audit-logs', label: 'سجل النشاطات والأمان', icon: History },
    { id: 'my-account', label: 'حسابي', icon: UserCheck }
  ];

  return (
    <div className="min-h-screen bg-slate-50/70 pb-20" dir="rtl">
      
      {/* Top Bar for Admin */}
      <div className="bg-white border-b border-slate-200 sticky top-20 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span className="text-sm font-extrabold text-[#0c3250]">لوحة إدارة مركز المستقبل</span>
            <span className="text-xs text-slate-400 hidden sm:inline">• صلاحية المالك الكاملة (Owner)</span>
            <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              قاعدة البيانات متصلة ومحفوظة
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadBackupFile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 transition-all cursor-pointer shadow-2xs"
              title="تحميل نسخة احتياطية كاملة لجهازك بصيغة JSON"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">تحميل نسخة احتياطية</span>
            </button>

            <button
              onClick={handleCopyStudentLoginLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200 transition-all cursor-pointer shadow-2xs"
              title="نسخ الرابط المباشر لصفحة تسجيل دخول الطلاب"
            >
              <Link className="w-3.5 h-3.5 text-blue-600" />
              <span>نسخ رابط دخول الطلاب</span>
            </button>

            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <span>تسجيل الخروج والعودة</span>
                <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Admin Layout: Sidebar + Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3 space-y-4">
            
            {/* Owner Mini Profile Card */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-black text-[#0c3250] truncate">{currentUser?.fullName || 'المدير العام'}</h4>
                  <span className="text-[11px] text-blue-700 font-semibold block">مدير النظام المعتمد</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
              {sidebarItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    id={`admin-tab-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-[#334155] hover:bg-blue-50/60 hover:text-blue-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComponent className={`w-4 h-4 ${isActive ? 'text-sky-200' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isActive ? 'bg-white text-blue-700' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Quick Logout button */}
            <button
              onClick={() => {
                logout();
                onBackToHome?.();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج من الإدارة</span>
            </button>

          </aside>

          {/* Tab Content Area */}
          <main className="lg:col-span-9">
            
            {activeTab === 'dashboard' && (
              <AdminDashboardHome onSelectTab={(tab) => setActiveTab(tab)} />
            )}

            {activeTab === 'smart-curriculum' && (
              <SmartCurriculumWizard />
            )}

            {activeTab === 'students' && (
              <AdminStudents />
            )}

            {activeTab === 'curriculum' && (
              <HierarchicalCurriculum 
                initialCourseId={initialCourseId}
                onClearInitialCourse={onClearInitialCourse}
              />
            )}

            {activeTab === 'pdf-management' && (
              <PdfManagement />
            )}

            {activeTab === 'sham-cash' && (
              <AdminShamCash />
            )}

            {activeTab === 'notifications' && (
              <AdminNotifications />
            )}

            {activeTab === 'about-editor' && (
              <AdminAboutEditor />
            )}

            {activeTab === 'site-editor' && (
              <AdminSiteEditor />
            )}

            {activeTab === 'audit-logs' && (
              <AuditLogsViewer />
            )}

            {activeTab === 'my-account' && (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6 text-right">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#0c3250]">بيانات حساب المدير</h3>
                    <p className="text-xs text-[#595e65]">إدارة مركز المستقبل التعليمي المرخص</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold block">اسم الحساب:</span>
                    <strong className="text-sm text-[#0c3250]">{currentUser?.fullName}</strong>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold block">اسم المستخدم:</span>
                    <strong className="text-sm text-[#0c3250] font-mono">{currentUser?.username}</strong>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold block">البريد الإلكتروني:</span>
                    <strong className="text-sm text-[#0c3250] font-mono">{currentUser?.email}</strong>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-slate-400 font-bold block">صلاحية النظام:</span>
                    <strong className="text-sm text-blue-700">مالك النظام الأكاديمي (Owner / Full Access)</strong>
                  </div>
                </div>

                {/* Owner's Direct Control for Offline Lectures Download */}
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DownloadCloud className="w-5 h-5 text-blue-600" />
                      <h4 className="text-base font-black text-[#0c3250]">التحكم في تنزيل محاضرات الأوفلاين للطلاب</h4>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${
                      siteSettings.allowOfflineLecturesDownload !== false
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {siteSettings.allowOfflineLecturesDownload !== false ? 'الميزة مفعلة للطلاب' : 'الميزة معطلة للجميع'}
                    </span>
                  </div>

                  <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 text-xs">
                      <p className="font-bold text-[#0c3250]">
                        التحكم المباشر من حساب المالك:
                      </p>
                      <p className="text-slate-500 leading-relaxed max-w-xl">
                        يمكنك هنا بنقرة واحدة إيقاف أو تفعيل تنزيل محاضرات الأوفلاين لجميع الطلاب. 
                        علماً بأن <strong className="text-blue-900 font-black">قراءة وتنزيل مذكرات الـ PDF مستقلة تماماً</strong> وتظل متاحة للطلاب خارج الأوفلاين دون تأثر.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={toggleGlobalOfflineDownload}
                      className={`px-5 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer shrink-0 shadow-xs ${
                        siteSettings.allowOfflineLecturesDownload !== false
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {siteSettings.allowOfflineLecturesDownload !== false ? (
                        <>
                          <X className="w-4 h-4" />
                          <span>إيقاف تنزيل محاضرات الأوفلاين</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>تفعيل تنزيل محاضرات الأوفلاين</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'backup-center' && <AdminBackupCenter />}

          </main>

        </div>
      </div>

    </div>
  );
};
