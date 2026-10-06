import React, { useState } from 'react';
import { FutureCenterLogo } from './FutureCenterLogo';
import { usePlatform } from '../context/PlatformContext';
import { 
  Menu, 
  X, 
  User, 
  Shield, 
  GraduationCap, 
  LogOut, 
  Bell, 
  ArrowLeft,
  ChevronDown,
  RefreshCw,
  RotateCcw
} from 'lucide-react';

interface HeaderNavbarProps {
  currentView: 'login' | 'admin' | 'student' | 'programs';
  onNavigate: (view: 'login' | 'admin' | 'student' | 'programs', targetId?: string) => void;
  selectedPortalId?: string | null;
}

export const HeaderNavbar: React.FC<HeaderNavbarProps> = ({
  currentView,
  onNavigate,
}) => {
  const { currentUser, logout, notifications, markNotificationAsRead, restoreOwnerData } = usePlatform();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Notifications for current user (student or owner)
  const userNotifs = notifications.filter(n => 
    currentUser?.role === 'student' 
      ? (n.userId === currentUser.id || n.userId === 'all') 
      : (n.userId === 'owner-1' || n.userId === 'all')
  );
  const unreadCount = userNotifs.filter(n => !n.read).length;

  const handleNavClick = (view: 'login' | 'admin' | 'student' | 'programs') => {
    setMobileMenuOpen(false);
    onNavigate(view);
  };

  const handleLogoClick = () => {
    if (currentUser?.role === 'owner') {
      handleNavClick('admin');
    } else if (currentUser?.role === 'student') {
      handleNavClick('student');
    } else {
      handleNavClick('login');
    }
  };

  const handleManualRestore = async () => {
    setIsRestoring(true);
    await restoreOwnerData();
    setIsRestoring(false);
    handleNavClick('admin');
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-xs" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Right Section: Logo & Platform Name */}
        <div 
          className="flex items-center gap-3 cursor-pointer select-none group"
          onClick={handleLogoClick}
        >
          <FutureCenterLogo size="md" showText={true} arabicSubtitle={false} />
          <div className="hidden sm:block border-r border-slate-200 pr-3 mr-1 text-right">
            <span className="text-base font-extrabold text-[#0c3250] block leading-tight group-hover:text-blue-600 transition-colors">
              منصة مركز المستقبل
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-[#595e65] font-semibold">
                بوابة التعليم الذكية
              </span>
              {currentUser?.role === 'owner' && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  حساب معزول: hasakahm
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center Section: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {currentUser?.role === 'owner' && (
            <>
              <button
                id="nav-admin"
                onClick={() => handleNavClick('admin')}
                className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'admin'
                    ? 'text-[#183b63] bg-slate-100/90 border border-slate-200 shadow-2xs font-black'
                    : 'text-[#334155] hover:text-[#183b63] hover:bg-slate-50'
                }`}
              >
                <Shield className="w-4 h-4 text-[#183b63]" />
                <span>لوحة الإدارة</span>
              </button>

              <button
                id="btn-sync-restore-courses"
                onClick={handleManualRestore}
                disabled={isRestoring}
                className="px-3 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50/80 hover:bg-blue-100 border border-blue-200 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                title="مزامنة فورية واسترجاع المقررات الدراسية من قاعدة البيانات المعزولة"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRestoring ? 'animate-spin' : ''}`} />
                <span>استرجاع ومزامنة مقرراتي</span>
              </button>
            </>
          )}

          {currentUser?.role === 'student' && (
            <button
              id="nav-student"
              onClick={() => handleNavClick('student')}
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                currentView === 'student'
                  ? 'text-[#183b63] bg-slate-100/90 border border-slate-200 shadow-2xs font-black'
                  : 'text-[#334155] hover:text-[#183b63] hover:bg-slate-50'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-[#183b63]" />
              <span>مساحتي الدراسية</span>
            </button>
          )}
        </nav>

        {/* Left Section: User Actions & Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3">
              
              {/* Notifications dropdown toggle */}
              <div className="relative">
                <button
                  id="btn-notifications-toggle"
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="p-2.5 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors relative cursor-pointer"
                  title="الإشعارات"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-2xs">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Popup */}
                {notifDropdownOpen && (
                  <div 
                    className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2"
                    dir="rtl"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 px-1">
                      <span className="font-extrabold text-xs text-[#0c3250]">مركز الإشعارات</span>
                      <span className="text-[11px] text-slate-400">{userNotifs.length} إشعار</span>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {userNotifs.length === 0 ? (
                        <p className="text-center text-xs text-slate-400 py-4">لا توجد إشعارات جديدة حالياً.</p>
                      ) : (
                        userNotifs.map(notif => (
                          <div 
                            key={notif.id}
                            onClick={() => markNotificationAsRead(notif.id)}
                            className={`p-2.5 rounded-xl border text-xs transition-colors cursor-pointer ${
                              notif.read ? 'bg-slate-50/70 border-slate-100 text-slate-600' : 'bg-blue-50/80 border-blue-200 text-[#0c3250] font-medium'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-[11px] text-blue-600">{notif.title}</span>
                              <span className="text-[10px] text-slate-400 font-mono">{notif.date}</span>
                            </div>
                            <p className="text-[11px] leading-relaxed">{notif.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User badge and button to portal */}
              <button
                id="btn-user-panel"
                onClick={() => handleNavClick(currentUser.role === 'owner' ? 'admin' : 'student')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                  currentView === 'admin' || currentView === 'student'
                    ? 'bg-[#183b63] text-white border-[#183b63] shadow-xs'
                    : 'bg-slate-50 text-[#0c3250] border-slate-200/90 hover:border-slate-300 hover:bg-white'
                }`}
              >
                {currentUser.role === 'owner' ? (
                  <Shield className="w-4 h-4 text-slate-300" />
                ) : (
                  <User className="w-4 h-4 text-slate-200" />
                )}
                <span className="hidden sm:inline font-bold">
                  {currentUser.role === 'owner' ? 'لوحة الإدارة' : currentUser.fullName}
                </span>
                <span className="sm:hidden">
                  {currentUser.role === 'owner' ? 'الإدارة' : 'حسابي'}
                </span>
              </button>

              {/* Logout button */}
              <button
                id="btn-header-logout"
                onClick={() => {
                  logout();
                  handleNavClick('login');
                }}
                className="p-2 sm:px-3 sm:py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold border border-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">خروج</span>
              </button>
            </div>
          ) : (
            <button
              id="btn-header-login"
              onClick={() => handleNavClick('login')}
              className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
                currentView === 'login'
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>تسجيل الدخول</span>
            </button>
          )}

          {/* Mobile menu hamburger */}
          <button
            id="btn-mobile-menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="القائمة الرئيسية"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-2 shadow-lg animate-in slide-in-from-top-3">
          {currentUser ? (
            <>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleNavClick(currentUser.role === 'owner' ? 'admin' : 'student');
                }}
                className="w-full text-right px-4 py-3 rounded-xl text-sm font-bold bg-blue-600 text-white flex items-center justify-between"
              >
                <span>{currentUser.role === 'owner' ? 'الانتقال للوحة الإدارة' : 'الانتقال إلى مساحتي التعليمية'}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                  handleNavClick('login');
                }}
                className="w-full text-right px-4 py-2.5 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleNavClick('login');
              }}
              className="w-full text-center px-4 py-3 rounded-xl text-sm font-bold bg-blue-600 text-white"
            >
              تسجيل الدخول للمنصة
            </button>
          )}
        </div>
      )}
    </header>
  );
};
