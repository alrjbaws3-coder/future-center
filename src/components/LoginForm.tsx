import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { 
  GraduationCap, 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles, 
  BookOpen, 
  Award,
  CheckCircle2,
  Users
} from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { login, switchDemoUser } = usePlatform();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    setTimeout(() => {
      login(username, password);
      setIsLoading(false);
    }, 400);
  };

  const handleDemoSelect = (demoUsername: string) => {
    setUsername(demoUsername);
    setPassword('password123');
    setIsLoading(true);
    setTimeout(() => {
      switchDemoUser(demoUsername);
      setIsLoading(false);
    }, 300);
  };

  return (
    <div id="login-screen" className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-slate-50 flex flex-col justify-between text-slate-800">
      {/* Top Academic Bar */}
      <header className="w-full bg-white/80 backdrop-blur border-b border-blue-100 py-3.5 px-6 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-blue-600 block tracking-wider">FUTURE CENTER</span>
              <h1 className="text-base font-bold text-slate-900 leading-tight">مركز المستقبل للتعليم الأكاديمي</h1>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-blue-800 bg-blue-50/80 px-3 py-1.5 rounded-full border border-blue-200/60">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>البوابة الأكاديمية والمهنية المعتمدة</span>
          </div>
        </div>
      </header>

      {/* Main Center Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Right Presentation Side (Introduction & Inspiration) */}
          <div className="lg:col-span-6 space-y-6 text-right">
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 text-blue-800 text-xs font-bold border border-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>البوابة الأكاديمية والمهنية المعتمدة</span>
            </div>

            {/* Main Header Statement */}
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
                مركز المستقبل: منصة تعليمية للمعرفة والابتكار
              </h2>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
                مرحباً بك في مركز المستقبل، ابدأ رحلة تعلّمك، سجل دخولك للوصول إلى دروسك ومساحتك التعليمية
              </p>
            </div>

            {/* Feature Highlights with Soothing Blue accents */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">مقررات وتخصصات معتمدة</h3>
                <p className="text-xs text-slate-500 leading-normal">مناهج متقدمة في الذكاء الاصطناعي، الأمن السيبراني وهندسة البرمجيات.</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">نظام مالي وشحن كاش</h3>
                <p className="text-xs text-slate-500 leading-normal">شحن فوري للمحفظة وشراء وتحميل مباشر للمذكرات والملفات الأكاديمية.</p>
              </div>
            </div>

            {/* Quick Account Access Buttons */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  تسجيل الدخول السريع المعتمد:
                </span>
                <span className="text-[11px] text-blue-600 font-medium">حساب المالك المعزول</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  id="btn-demo-owner"
                  onClick={() => {
                    setUsername('hasakahm@gmail.com');
                    setPassword('AAaa1234');
                    login('hasakahm@gmail.com', 'AAaa1234');
                  }}
                  className="flex items-center justify-between p-2.5 bg-white hover:bg-blue-600 hover:text-white text-slate-800 rounded-xl border border-blue-200 text-xs font-bold transition-all shadow-sm group text-right cursor-pointer"
                >
                  <div>
                    <span className="block group-hover:text-white text-slate-900 font-bold">إدارة المركز (المالك)</span>
                    <span className="text-[10px] text-blue-600 group-hover:text-blue-100">hasakahm@gmail.com</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-blue-100 group-hover:bg-blue-500 flex items-center justify-center text-blue-700 group-hover:text-white shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </button>

                <button
                  type="button"
                  id="btn-demo-student1"
                  onClick={() => {
                    setUsername('ahmad');
                    setPassword('password123');
                    login('ahmad', 'password123');
                  }}
                  className="flex items-center justify-between p-2.5 bg-white hover:bg-blue-600 hover:text-white text-slate-800 rounded-xl border border-blue-200 text-xs font-bold transition-all shadow-sm group text-right cursor-pointer"
                >
                  <div>
                    <span className="block group-hover:text-white text-slate-900 font-bold">بوابة الطالب (تجربة)</span>
                    <span className="text-[10px] text-emerald-600 group-hover:text-emerald-100">معاينة شاشة الطالب</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-emerald-100 group-hover:bg-blue-500 flex items-center justify-center text-emerald-700 group-hover:text-white shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-blue-200/50">
                <span>المالك المعتمد: <strong>hasakahm@gmail.com</strong></span>
                <span>الحساب معزول ومحمي تلقائياً</span>
              </div>
            </div>
          </div>

          {/* Left Form Card (Clean White & Soothing Blue) */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-blue-900/5 border border-blue-100 relative overflow-hidden">
              
              {/* Subtle decorative banner top */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500"></div>

              <div className="text-center mb-6 pt-2">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3">
                  <GraduationCap className="w-9 h-9 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">تسجيل الدخول للمنصة</h3>
                <p className="text-xs text-slate-500 mt-1">أدخل بيانات اعتمادك للوصول إلى الحساب الأكاديمي</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username Input */}
                <div className="space-y-1.5 text-right">
                  <label htmlFor="login-username" className="block text-xs font-bold text-slate-700">
                    اسم المستخدم أو البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <input
                      id="login-username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="hasakahm@gmail.com أو اسم المستخدم"
                      className="w-full pl-3 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-right"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5 text-right">
                  <div className="flex items-center justify-between">
                    <label htmlFor="login-password" className="block text-xs font-bold text-slate-700">
                      كلمة المرور
                    </label>
                    <span className="text-[11px] text-blue-600 font-medium">مشفرة بأمان</span>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-right"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 hover:text-slate-600 transition-colors"
                      aria-label="تبديل إظهار كلمة المرور"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  id="btn-submit-login"
                  disabled={isLoading}
                  className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-70 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>دخول إلى المنصة التعليمية</span>
                      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Trust Badge */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>نظام حماية البيانات وصلاحيات الوصول الأكاديمية مشفر بالكامل</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Persistent Inspirational Bottom Quote is rendered inside FooterQuote */}
    </div>
  );
};
