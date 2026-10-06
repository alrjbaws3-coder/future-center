import React, { useState } from 'react';
import { 
  User as UserIcon, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Fingerprint,
  BookOpen,
  X,
  ShieldCheck
} from 'lucide-react';
import { FutureCenterLogo, FutureCenterEmblem } from './FutureCenterLogo';
import heroBackgroundImage from '../assets/images/future_center_hero_1789563857799.jpg';
import { EducationalProgram, Specialty, Course } from '../types';

interface LoginPortalProps {
  onLogin: (username: string, password?: string, defaultSpecialty?: string) => void;
  specialties: string[];
  onViewPrograms?: () => void;
  targetCourse?: {
    course: Course;
    specialty: Specialty;
    program: EducationalProgram;
  } | null;
  onDismissTargetCourse?: () => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({ 
  onLogin, 
  specialties, 
  onViewPrograms,
  targetCourse,
  onDismissTargetCourse
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    const defaultSpecialty = specialties[0] || 'تقنية المعلومات';
    onLogin(cleanUser, cleanPass, defaultSpecialty);
  };

  return (
    <div 
      className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden select-none bg-fc-portal"
      style={{
        backgroundImage: `url(${heroBackgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center right',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* TOP HEADER: Top-Right Official Future Center Logo */}
      <header className="w-full relative z-20 px-8 sm:px-14 lg:px-24 pt-7 pb-2 flex justify-end">
        <FutureCenterLogo size="md" showText={true} arabicSubtitle={true} />
      </header>

      {/* MAIN STAGE: Card on the LEFT, Hero Typography over the Background on the RIGHT */}
      <main className="w-full max-w-[1480px] mx-auto px-6 sm:px-12 lg:px-20 py-4 flex-1 flex items-center justify-between relative z-10">
        <div className="w-full flex flex-col-reverse lg:flex-row items-center justify-between gap-8 lg:gap-16">
          
          {/* LEFT SIDE: Clean Calm Login Card */}
          <div className="w-full lg:w-[440px] shrink-0 flex justify-center lg:justify-start">
            <div 
              id="login-card"
              className="w-full max-w-[420px] bg-white/92 backdrop-blur-md rounded-[28px] p-7 sm:p-9 shadow-fc-card border border-white text-right relative"
              dir="rtl"
            >
              
              {/* Card Header: Official Future Center Emblem + مركز المستقبل */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-13 h-13 rounded-2xl bg-white border border-slate-200/80 flex items-center justify-center p-1.5 shadow-2xs shrink-0">
                  <FutureCenterEmblem size={44} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#0c3250] tracking-tight leading-tight">
                    مركز المستقبل
                  </h3>
                  <p className="text-[11px] text-[#486581] font-medium">
                    منصة تعليمية للمعرفة والابتكار
                  </p>
                </div>
              </div>

              {/* Direct Course Target Notice Banner */}
              {targetCourse && (
                <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200 text-right animate-in fade-in duration-300 shadow-2xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-[#1e3a5f]">
                      <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>رابط مباشر لمقرر دراسي</span>
                    </div>
                    {onDismissTargetCourse && (
                      <button
                        type="button"
                        onClick={onDismissTargetCourse}
                        className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded cursor-pointer"
                        title="إلغاء التوجيه المباشر"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="text-sm font-black text-[#0c3250] mb-0.5">
                    {targetCourse.course.title}
                  </div>
                  <div className="text-[11px] text-[#486581] font-semibold mb-2">
                    {targetCourse.specialty.name} • {targetCourse.program.title}
                  </div>
                  <div className="p-2.5 bg-white/90 rounded-xl border border-blue-200/80 text-[11px] text-blue-900 font-bold leading-relaxed flex items-start gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      🔒 يتطلب هذا الرابط تسجيل الدخول بالحساب الأكاديمي الرسمي المعتمد الذي زودتك به إدارة المركز للوصول للمحاضرات والمحتوى.
                    </span>
                  </div>
                </div>
              )}

              {/* Indicator: Subtle brand leaf green dot with calm navy-slate typography */}
              <div className="flex items-center gap-2 text-[#1e3a5f] font-bold text-xs mb-1.5">
                <span className="w-2 h-2 rounded-full bg-[#65a30d]"></span>
                <span>{targetCourse ? 'تسجيل الدخول الأكاديمي المعتمد' : 'مرحباً بك في مركز المستقبل'}</span>
              </div>

              {/* Heading */}
              <h2 className="text-2xl sm:text-3xl font-black text-[#0c3250] tracking-tight leading-tight mb-1">
                {targetCourse ? 'الدخول للمقرر' : 'ابدأ رحلة تعلّمك'}
              </h2>

              {/* Subtitle */}
              <p className="text-xs text-[#486581] font-medium mb-6 leading-relaxed">
                {targetCourse 
                  ? 'أدخل بيانات حسابك الأكاديمي الرسمي للوصول المباشر للمقرر' 
                  : 'سجّل دخولك للوصول إلى دروسك ومساحتك التعليمية'}
              </p>

              {/* Login Form: Pure inputs without role selection buttons */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Field 1: Username with Translucent Input Cell */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs px-0.5">
                    <label htmlFor="portal-username" className="text-[#0c3250] text-[11px] font-bold">
                      اسم المستخدم الرسمي
                    </label>
                    <span className="font-bold text-[#486581] text-[11px]">
                      Username
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      id="portal-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter your username"
                      className="w-full pr-4 pl-10 py-3 bg-white/70 hover:bg-white/90 focus:bg-white border border-slate-200 focus:border-[#1e3a5f] rounded-xl text-xs sm:text-sm text-[#0c3250] placeholder:text-slate-400 focus:outline-hidden focus:ring-3 focus:ring-[#1e3a5f]/15 transition-all text-left font-semibold"
                      dir="ltr"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-[#486581]">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Field 2: Password with Translucent Input Cell */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs px-0.5">
                    <label htmlFor="portal-password" className="text-[#0c3250] text-[11px] font-bold">
                      كلمة المرور
                    </label>
                    <span className="font-bold text-[#486581] text-[11px]">
                      Password
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      id="portal-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pr-10 pl-10 py-3 bg-white/70 hover:bg-white/90 focus:bg-white border border-slate-200 focus:border-[#1e3a5f] rounded-xl text-xs sm:text-sm text-[#0c3250] placeholder:text-slate-400 focus:outline-hidden focus:ring-3 focus:ring-[#1e3a5f]/15 transition-all text-left font-semibold"
                      dir="ltr"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-[#486581]">
                      <Lock className="w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      id="btn-toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 hover:text-[#1e3a5f] transition-colors cursor-pointer"
                      title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Options Row: Forgot Password on left, Remember Me on right */}
                <div className="flex items-center justify-between text-xs pt-1 px-0.5">
                  <button
                    type="button"
                    onClick={() => {}}
                    className="text-[#1e3a5f] hover:text-[#0c3250] font-bold cursor-pointer transition-colors"
                  >
                    هل نسيت كلمة المرور؟
                  </button>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-[#0c3250] font-bold">
                    <span>تذكرني</span>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded-sm text-[#1e3a5f] focus:ring-[#1e3a5f] border-slate-300 cursor-pointer accent-[#1e3a5f]"
                    />
                  </label>
                </div>

                {/* Submit Button with Calm Navy-Slate gradient */}
                <button
                  id="btn-submit-login"
                  type="submit"
                  className="w-full mt-2 py-3.5 px-6 rounded-xl bg-fc-btn-gradient hover:opacity-95 active:scale-[0.99] text-white font-bold text-sm shadow-fc-btn flex items-center justify-center gap-2 cursor-pointer transition-all tracking-wide"
                >
                  <span>{targetCourse ? 'دخول والوصول للمقرر' : 'دخول إلى المنصة التعليمية'}</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>

              </form>

              {/* SSL 256-BIT Security Label */}
              <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-[#486581] font-semibold">
                <Fingerprint className="w-4 h-4 text-[#334e68]" />
                <span>SSL 256-BIT • دخول آمن ومشفّر بالكامل</span>
              </div>

              {/* Direct Access to Educational Programs Page */}
              {onViewPrograms && (
                <div className="mt-4 pt-3.5 border-t border-slate-200/80 text-center">
                  <button
                    type="button"
                    onClick={onViewPrograms}
                    className="text-xs font-bold text-[#1e3a5f] hover:text-blue-700 hover:underline flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>استعراض البرامج التعليمية المعتمدة</span>
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* RIGHT SIDE: Typography Clean and Direct on Background (Zero White Fog / Blur Layers) */}
          <div className="flex-1 flex flex-col items-center justify-center text-center relative py-8 select-none" dir="rtl">
            <div className="max-w-[540px] flex flex-col items-center justify-center">
              
              {/* Badge: منصة التعليم والتطوير */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[#1e3a5f] font-extrabold text-xs mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#65a30d]"></span>
                <span>منصة التعليم والتطوير</span>
              </div>

              {/* Big Headline: نحو مستقبل أفضل */}
              <h1 
                className="text-4xl sm:text-5xl lg:text-[4.2rem] font-black tracking-tight leading-[1.18]"
                style={{ fontFamily: 'Alexandria, Cairo, sans-serif' }}
              >
                <span className="text-[#0c3250] block">
                  نحو مستقبل
                </span>
                <span className="block mt-1 sm:mt-1.5 text-[#1c456e]">
                  أفضل
                </span>
              </h1>

              {/* Subtext: Clear and readable directly over the background without any foggy boxes */}
              <p className="text-sm sm:text-base text-[#1e3a5f] font-semibold leading-relaxed max-w-[420px] mt-4">
                مساحة تعليمية متكاملة تجمع المعرفة، المهارات، والفرص في تجربة واحدة.
              </p>

            </div>
          </div>

        </div>
      </main>

      {/* FOOTER: Matching image (Center Quote + Right Copyright with 4 Ascending Bars) */}
      <footer className="w-full relative z-20 px-8 sm:px-14 lg:px-24 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 font-medium">
        
        {/* Left / Center Side: Slogan Quote */}
        <div className="text-slate-400 font-normal order-2 sm:order-1">
          تعلّم اليوم. اصنع أثر الغد.
        </div>

        {/* Right Side: Copyright + 4 Teal/Blue Chart Bars */}
        <div className="flex items-center gap-2 text-slate-500 font-normal order-1 sm:order-2" dir="rtl">
          {/* 4 Vertical ascending chart bars in teal/cyan/blue */}
          <div className="flex items-end gap-0.5 h-4">
            <span className="w-1 h-1.5 bg-[#38bdf8] rounded-2xs"></span>
            <span className="w-1 h-2.5 bg-[#0ea5e9] rounded-2xs"></span>
            <span className="w-1 h-3.5 bg-[#0284c7] rounded-2xs"></span>
            <span className="w-1 h-4 bg-[#0369a1] rounded-2xs"></span>
          </div>
          <span>2026 مركز المستقبل • جميع الحقوق محفوظة</span>
        </div>

      </footer>

    </div>
  );
};
