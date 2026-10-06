import React, { useState, useEffect, useMemo } from 'react';
import { PlatformProvider, usePlatform } from './context/PlatformContext';
import { HeaderNavbar } from './components/HeaderNavbar';
import { LoginPortal } from './components/LoginPortal';
import { AdminPanel } from './components/AdminPanel';
import { StudentPortal } from './components/StudentPortal';
import { ProgramsPage } from './components/ProgramsPage';
import { ToastContainer } from './components/ToastContainer';
import { 
  AlertTriangle, 
  LogOut, 
  BookOpen, 
  ShieldAlert
} from 'lucide-react';
import { StudentUser } from './types';

// Helper to extract courseId from URL (search params or hash)
const getCourseIdFromUrl = (): string | null => {
  try {
    const params = new URLSearchParams(window.location.search);
    const qCourse = params.get('courseId') || params.get('course');
    if (qCourse) return decodeURIComponent(qCourse.trim());

    const hash = window.location.hash;
    if (hash.startsWith('#/course/')) {
      const parts = hash.split('/');
      if (parts[2]) return decodeURIComponent(parts[2].trim());
    }
  } catch (e) {
    console.error('Error parsing courseId from URL:', e);
  }
  return null;
};

// Helper to check if current URL explicitly requests the login view
const isExplicitLoginUrl = (): boolean => {
  try {
    const pathname = window.location.pathname.toLowerCase();
    if (pathname === '/login' || pathname.startsWith('/login') || pathname.includes('/auth') || pathname.includes('/signin')) {
      return true;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'login' || params.has('login') || params.get('page') === 'login' || params.get('tab') === 'login') {
      return true;
    }
    const hash = window.location.hash.toLowerCase();
    if (hash === '#login' || hash === '#/login' || hash.startsWith('#login')) {
      return true;
    }
  } catch (e) {
    console.error('Error checking login url:', e);
  }
  return false;
};

// Helper to clean courseId from URL
const clearCourseIdFromUrl = () => {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('courseId');
    url.searchParams.delete('course');
    if (url.hash.startsWith('#/course/')) {
      url.hash = '';
    }
    const cleanUrl = url.pathname + (url.search ? url.search : '') + (url.hash ? url.hash : '');
    window.history.replaceState({}, '', cleanUrl);
  } catch (e) {
    console.warn('Could not clean URL:', e);
  }
};

const AppContent: React.FC = () => {
  const { currentUser, login, logout, addToast, programs } = usePlatform();

  // Target Course ID from direct URL link
  const [targetCourseId, setTargetCourseId] = useState<string | null>(() => getCourseIdFromUrl());
  const [activeCourseId, setActiveCourseId] = useState<string | null>(() => getCourseIdFromUrl());

  // Modal to notify user when their logged-in account does not match the requested course
  const [showAccountConflictModal, setShowAccountConflictModal] = useState(false);

  // Current view state - Always prioritize login view if URL requests it or if user is not authenticated
  const [currentView, setCurrentView] = useState<'login' | 'admin' | 'student' | 'programs'>(() => {
    if (isExplicitLoginUrl()) return 'login';
    if (currentUser?.role === 'owner') return 'admin';
    if (currentUser?.role === 'student') return 'student';
    return 'login';
  });

  // Find metadata for the target course across all programs
  const targetCourseMeta = useMemo(() => {
    if (!targetCourseId) return null;
    for (const p of programs) {
      for (const s of p.specialties) {
        const found = s.courses.find(c => c.id === targetCourseId);
        if (found) {
          return { course: found, specialty: s, program: p };
        }
      }
    }
    return null;
  }, [targetCourseId, programs]);

  // On initial mount only: if URL requested explicit login, ensure session is cleared so visitor sees login form
  useEffect(() => {
    if (isExplicitLoginUrl()) {
      if (currentUser) {
        logout();
      }
      setCurrentView('login');
    }
  }, []);

  // Listen to popstate / URL changes
  useEffect(() => {
    const handleUrlCheck = () => {
      const cid = getCourseIdFromUrl();
      if (cid && cid !== targetCourseId) {
        setTargetCourseId(cid);
        setActiveCourseId(cid);
      }
    };
    window.addEventListener('popstate', handleUrlCheck);
    return () => window.removeEventListener('popstate', handleUrlCheck);
  }, [targetCourseId]);

  // Handle routing & account permission verification when targetCourseId or currentUser changes
  useEffect(() => {
    if (!currentUser) {
      // Unauthenticated visitor -> stay on login
      if (currentView !== 'programs') {
        setCurrentView('login');
      }
      return;
    }

    if (currentUser.role === 'owner') {
      setCurrentView('admin');
      if (targetCourseId) {
        setActiveCourseId(targetCourseId);
      }
      return;
    }

    if (currentUser.role === 'student') {
      const student = currentUser as StudentUser;
      
      // If there is a target course requested:
      if (targetCourseId) {
        // Check if student is authorized for this specific course
        const isAuthorized = student.allowedCourseIds?.includes(targetCourseId);
        
        if (isAuthorized) {
          setCurrentView('student');
          setActiveCourseId(targetCourseId);
          setShowAccountConflictModal(false);
        } else {
          // Student is logged in with an account that is NOT authorized for this course!
          setShowAccountConflictModal(true);
        }
      } else {
        setCurrentView('student');
      }
    }
  }, [currentUser, targetCourseId]);

  // Handle Login from LoginPortal
  const handlePortalLogin = (username: string, password?: string, defaultSpecialty?: string) => {
    const result = login(username, password);
    if (result.success) {
      // Clean up /login from browser address bar so URL doesn't keep forcing login view
      try {
        const url = new URL(window.location.href);
        if (url.pathname === '/login' || url.pathname.startsWith('/login')) {
          url.pathname = '/';
        }
        url.searchParams.delete('login');
        url.searchParams.delete('view');
        url.searchParams.delete('page');
        if (url.hash === '#login' || url.hash === '#/login') {
          url.hash = '';
        }
        window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + (url.hash ? url.hash : ''));
      } catch (e) {
        console.warn('Could not clean login URL:', e);
      }

      // Navigate to destination view immediately
      const cleanUser = username.trim().toLowerCase();
      const isOwner = 
        cleanUser === 'hasakahm@gmail.com' || 
        cleanUser === 'hasakahm' || 
        cleanUser === 'admin' || 
        cleanUser === 'owner' || 
        cleanUser === 'aws_275127' ||
        cleanUser === 'المالك' ||
        cleanUser === 'المالك_المعتمد';

      if (isOwner) {
        setCurrentView('admin');
      } else {
        setCurrentView('student');
      }

      // After login, if targetCourseId exists, permission check will happen in useEffect
      if (targetCourseMeta) {
        addToast('info', `جاري التحقق من الصلاحيات وربطك بمقرر "${targetCourseMeta.course.title}"...`);
      }
    }
  };

  // Switch to another account from the conflict modal
  const handleSwitchToOfficialAccount = () => {
    setShowAccountConflictModal(false);
    logout();
    setCurrentView('login');
    // Keep targetCourseId so LoginPortal shows the target course banner
    addToast('info', 'يرجى تسجيل الدخول بالحساب الأكاديمي الرسمي المعتمد لهذا المقرر.');
  };

  // Continue with current account, dismissing the target course
  const handleDismissTargetCourse = () => {
    setShowAccountConflictModal(false);
    setTargetCourseId(null);
    setActiveCourseId(null);
    clearCourseIdFromUrl();
    if (currentUser?.role === 'student') {
      setCurrentView('student');
      addToast('info', 'تم تحويلك إلى قائمة مقرراتك الدراسية المعتمدة.');
    }
  };

  const handleClearInitialCourse = () => {
    setActiveCourseId(null);
    clearCourseIdFromUrl();
  };

  // Extract all specialty names for LoginPortal
  const allSpecialtyNames = programs.flatMap(p => p.specialties.map(s => s.name));

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col justify-between" dir="rtl">
      
      {/* GLOBAL TOAST CONTAINER */}
      <ToastContainer />

      {/* ACCOUNT CONFLICT / OFFICIAL ACCOUNT SELECTION MODAL */}
      {showAccountConflictModal && targetCourseMeta && currentUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-right animate-in zoom-in-95 duration-200" dir="rtl">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-[#0c3250] text-center mb-1">
              تنبيه تعدد الحسابات والصلاحيات
            </h3>

            <p className="text-xs text-slate-500 text-center mb-4 font-medium">
              أنت مسجل الدخول حالياً بحساب الطالب: <strong className="text-[#0c3250]">{currentUser.fullName}</strong> ({currentUser.username})
            </p>

            <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-2 mb-6">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <BookOpen className="w-4 h-4 text-amber-700 shrink-0" />
                <span>المقرر المطلوب: {targetCourseMeta.course.title}</span>
              </div>
              <p className="leading-relaxed font-medium">
                هذا المقرر الدراسي يتبع لاختصاص <strong>({targetCourseMeta.specialty.name})</strong>، وحسابك الحالي غير مدرج في قائمة الطلاب المصرح لهم بدراسة هذا المقرر أو قد تكون سجلت الدخول بحساب طالب آخر على هذا الجهاز.
              </p>
              <div className="pt-2 border-t border-amber-200/80 flex items-center gap-1.5 font-bold text-[11px] text-amber-800">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-700" />
                <span>للوصول للمقرر، يجب تسجيل الدخول بالحساب الأكاديمي الرسمي المخصص له.</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSwitchToOfficialAccount}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج والدخول بالحساب الرسمي لهذا المقرر</span>
              </button>

              <button
                onClick={handleDismissTargetCourse}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <span>المتابعة بحسابي الحالي والانتقال لمقرراتي المعتمدة</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER HEADER NAVBAR (Except in Login view and Programs view which has its own header) */}
      {currentView !== 'login' && currentView !== 'programs' && (
        <HeaderNavbar 
          currentView={currentView}
          onNavigate={(view) => {
            if (view === 'login') {
              logout();
              setCurrentView('login');
            } else {
              setCurrentView(view as any);
            }
          }}
        />
      )}

      {/* VIEW ROUTING */}
      <div className="flex-1">
        {currentView === 'login' && (
          <LoginPortal
            onLogin={handlePortalLogin}
            specialties={allSpecialtyNames}
            onViewPrograms={() => setCurrentView('programs')}
            targetCourse={targetCourseMeta}
            onDismissTargetCourse={handleDismissTargetCourse}
          />
        )}

        {currentView === 'programs' && (
          <ProgramsPage 
            onBack={() => {
              if (currentUser?.role === 'owner') setCurrentView('admin');
              else if (currentUser?.role === 'student') setCurrentView('student');
              else setCurrentView('login');
            }}
            onNavigateToAdminCurriculum={() => setCurrentView('admin')}
          />
        )}

        {currentView === 'admin' && (
          <AdminPanel 
            onBackToHome={() => logout()}
            initialCourseId={activeCourseId}
            onClearInitialCourse={handleClearInitialCourse}
          />
        )}

        {currentView === 'student' && (
          <StudentPortal 
            onBackToHome={() => logout()}
            initialCourseId={activeCourseId}
            onClearInitialCourse={handleClearInitialCourse}
          />
        )}
      </div>

    </div>
  );
};

export default function App() {
  return (
    <PlatformProvider>
      <AppContent />
    </PlatformProvider>
  );
}
