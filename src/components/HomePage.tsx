import React, { useState } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { EducationalProgram, Specialty, Course } from '../types';
import { 
  GraduationCap, 
  Award, 
  BookOpenCheck, 
  Sparkles, 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Layers, 
  ShieldCheck, 
  Building2, 
  ChevronRight, 
  FileText, 
  Video, 
  DownloadCloud, 
  MonitorCheck,
  Calendar,
  Lock,
  ArrowRight
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (view: 'home' | 'portals' | 'about' | 'specialties' | 'login' | 'admin' | 'student', targetId?: string) => void;
  initialTab?: 'home' | 'portals' | 'about' | 'specialties';
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, initialTab = 'home' }) => {
  const { programs, siteSettings } = usePlatform();

  // Selected portal state for the drill-down view
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);

  // Selected specialty for the "Explore Specialties" view
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>(
    programs[0]?.specialties[0]?.id || 'business-admin'
  );

  // Find selected program and specialty
  const selectedProgram = programs.find(p => p.id === selectedProgramId);
  
  // Flatten all specialties for easy browsing in the explore section
  const allSpecialties: { program: EducationalProgram; specialty: Specialty }[] = [];
  programs.forEach(prog => {
    prog.specialties.forEach(spec => {
      allSpecialties.push({ program: prog, specialty: spec });
    });
  });

  const activeSpecialtyData = allSpecialties.find(item => item.specialty.id === selectedSpecialtyId) || allSpecialties[0];

  // Helper for program icons
  const getProgramIcon = (iconName: string, className = 'w-7 h-7 text-[#0284c7]') => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'BookOpenCheck':
        return <BookOpenCheck className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      default:
        return <GraduationCap className={className} />;
    }
  };

  return (
    <div className="space-y-16 pb-20 text-right" dir="rtl">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 sm:pt-14 pb-12 rounded-3xl bg-gradient-to-b from-[#f4f9fd] via-white to-[#f8fafc] border border-slate-200/80 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white text-[#2563eb] font-bold text-xs border border-blue-100 shadow-2xs mb-5">
            <span className="w-2 h-2 rounded-full bg-[#0284c7] animate-pulse"></span>
            <span>{siteSettings.welcomeBadge}</span>
          </div>

          {/* Headline */}
          <h1 
            className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#0c3250] tracking-tight leading-tight mb-5"
            style={{ fontFamily: 'Alexandria, Cairo, sans-serif' }}
          >
            نحو مستقبل <span className="text-[#2563eb]">أفضل.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[#595e65] max-w-2xl mx-auto leading-relaxed mb-8">
            {siteSettings.heroSubtitle}
          </p>

          {/* Quick CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3.5">
            <a
              href="#educational-portals"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('educational-portals')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3.5 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-extrabold text-sm shadow-md shadow-blue-700/10 flex items-center gap-2 transition-all cursor-pointer"
            >
              <GraduationCap className="w-5 h-5 text-[#0284c7]" />
              <span>استكشاف البوابات التعليمية</span>
            </a>

            <button
              onClick={() => {
                document.getElementById('explore-specialties-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-[#0c3250] font-extrabold text-sm border border-slate-200 shadow-2xs flex items-center gap-2 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-[#32a1e6]" />
              <span>التعرف على الاختصاصات الأكاديمية</span>
            </button>
          </div>

        </div>
      </section>

      {/* 2. MAIN SECTION: «البوابات التعليمية» (The 4 Grand Portals) */}
      <section id="educational-portals" className="scroll-mt-24 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-slate-200/90 pb-4">
          <div>
            <div className="flex items-center gap-2 text-[#2563eb] text-xs font-bold mb-1">
              <span className="w-2 h-2 rounded-full bg-[#0284c7]"></span>
              <span>القسم الأهم في المنصة</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0c3250]">
              البوابات التعليمية المعتمدة
            </h2>
            <p className="text-xs sm:text-sm text-[#595e65] mt-1">
              اختر البرنامج المطلوب للدخول إلى الفروع والاختصاصات التابعة له
            </p>
          </div>

          {selectedProgramId && (
            <button
              onClick={() => setSelectedProgramId(null)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للبوابات الأربع الرئيسية</span>
            </button>
          )}
        </div>

        {/* View Mode 1: When a specific portal is clicked -> Drill down to its branches */}
        {selectedProgram ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Breadcrumb banner */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-50/70 to-sky-50/70 border border-blue-100 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-blue-200/70 flex items-center justify-center shadow-2xs shrink-0">
                  {getProgramIcon(selectedProgram.iconName, 'w-6 h-6 text-[#2563eb]')}
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mb-0.5">
                    <span>البوابات التعليمية</span>
                    <ChevronRight className="w-3.5 h-3.5 rotate-180 text-slate-400" />
                    <span className="text-[#2563eb] font-bold">{selectedProgram.title}</span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#0c3250]">
                    {selectedProgram.title}
                  </h3>
                </div>
              </div>

              <span className="px-3.5 py-1.5 bg-white text-[#2563eb] font-bold text-xs rounded-xl border border-blue-200/80 shadow-2xs">
                {selectedProgram.specialties.length} اختصاصات متاحة
              </span>
            </div>

            {/* Specialties inside this program */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedProgram.specialties.map((spec) => (
                <div 
                  key={spec.id}
                  className="bg-white rounded-3xl border border-slate-200/90 hover:border-[#0284c7] p-6 sm:p-7 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-[#eef7fd] text-[#32a1e6] flex items-center justify-center font-bold">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <span className="px-3 py-1 bg-slate-50 text-slate-600 rounded-xl text-xs font-mono font-bold border border-slate-200/70">
                        {spec.code}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xl font-extrabold text-[#0c3250] group-hover:text-[#2563eb] transition-colors">
                        {spec.name}
                      </h4>
                      <p className="text-xs sm:text-sm text-[#595e65] mt-2 leading-relaxed">
                        {spec.overview}
                      </p>
                    </div>

                    {/* Meta stats */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">المدة</span>
                        <strong className="text-[#0c3250] font-bold">{spec.duration}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">المواد</span>
                        <strong className="text-[#0c3250] font-bold">{spec.coursesCount}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">المقررات الحالية</span>
                        <strong className="text-[#2563eb] font-bold">{spec.courses.length} مقررات</strong>
                      </div>
                    </div>
                  </div>

                  {/* Entry action */}
                  <div className="pt-4 mt-2">
                    <button
                      onClick={() => {
                        setSelectedSpecialtyId(spec.id);
                        document.getElementById('explore-specialties-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#2563eb] to-[#3b82f6] hover:from-[#1d4ed8] hover:to-[#2563eb] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                    >
                      <span>دخول إلى الفرع واستعراض المقررات</span>
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              ))}
            </div>

          </div>
        ) : (

          /* View Mode 2: The 4 Grand Portal Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {programs.map((program, idx) => {
              const branchesCount = program.specialties.length;
              const branchesText = branchesCount === 2 
                ? 'فرعان متاحان' 
                : `${branchesCount} فروع متاحة`;

              return (
                <div
                  key={program.id}
                  className="bg-white rounded-3xl border border-slate-200/90 hover:border-[#0284c7] p-7 sm:p-8 shadow-fc-card hover:shadow-lg transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
                >
                  {/* Subtle decorative top bar */}
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#32a1e6] via-[#0284c7] to-[#2563eb] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                  <div className="space-y-4">
                    
                    {/* Icon & Branch Count Badge */}
                    <div className="flex items-center justify-between">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50/70 border border-[#d3ecd5] flex items-center justify-center p-2 shadow-2xs group-hover:scale-105 transition-transform">
                        {getProgramIcon(program.iconName, 'w-8 h-8 text-[#2563eb]')}
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 text-[#2563eb] font-bold text-xs border border-blue-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0284c7]"></span>
                        <span>{branchesText}</span>
                      </div>
                    </div>

                    {/* Program Title */}
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-[#0c3250] group-hover:text-[#2563eb] transition-colors">
                        {program.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#595e65] mt-2 leading-relaxed">
                        {program.description}
                      </p>
                    </div>

                    {/* Sub-branches preview tags */}
                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-slate-400 block mb-2">
                        الاختصاصات التابعة للبوابة:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {program.specialties.map(s => (
                          <span 
                            key={s.id}
                            className="px-2.5 py-1 bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200/80"
                          >
                            → {s.name}
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Entry Button */}
                  <div className="pt-6 mt-4 border-t border-slate-100">
                    <button
                      id={`btn-portal-${program.id}`}
                      onClick={() => setSelectedProgramId(program.id)}
                      className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-[#2563eb] text-[#0c3250] hover:text-white font-extrabold text-sm border border-slate-200 hover:border-[#2563eb] flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer group/btn"
                    >
                      <span>دخول إلى البوابة</span>
                      <ArrowLeft className="w-4 h-4 text-[#0284c7] group-hover/btn:text-white transition-colors" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        )}

      </section>

      {/* 3. SECTION: «التعرف على الاختصاصات» (Explore Specialties before login) */}
      <section id="explore-specialties-section" className="scroll-mt-24 space-y-8">
        
        {/* Section Header */}
        <div className="border-b border-slate-200/90 pb-4">
          <div className="flex items-center gap-2 text-[#32a1e6] text-xs font-bold mb-1">
            <span className="w-2 h-2 rounded-full bg-[#32a1e6]"></span>
            <span>دليل الطالب الأكاديمي الشامل</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0c3250]">
            التعرف على الاختصاصات
          </h2>
          <p className="text-xs sm:text-sm text-[#595e65] mt-1">
            تعرّف على كافة تفاصيل الاختصاصات ومحتوياتها ومقرراتها قبل التسجيل
          </p>
        </div>

        {/* Specialties Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pb-2">
          {allSpecialties.map(({ program, specialty }) => (
            <button
              key={specialty.id}
              onClick={() => setSelectedSpecialtyId(specialty.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                selectedSpecialtyId === specialty.id
                  ? 'bg-[#2563eb] text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span>{specialty.name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                selectedSpecialtyId === specialty.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {program.title}
              </span>
            </button>
          ))}
        </div>

        {/* Selected Specialty Detail Showcase Card */}
        {activeSpecialtyData && (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-9 shadow-fc-card space-y-8">
            
            {/* Top Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-xs font-bold text-[#2563eb] block mb-1">
                  البرنامج: {activeSpecialtyData.program.title}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-[#0c3250]">
                  {activeSpecialtyData.specialty.name}
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="px-4 py-2 bg-blue-50/70 rounded-2xl border border-blue-100 text-xs font-bold text-[#2563eb]">
                  {activeSpecialtyData.specialty.duration}
                </div>
                <div className="px-4 py-2 bg-sky-50 rounded-2xl border border-sky-100 text-xs font-bold text-[#0284c7]">
                  {activeSpecialtyData.specialty.coursesCount}
                </div>
                <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700">
                  {activeSpecialtyData.specialty.semestersCount}
                </div>
              </div>
            </div>

            {/* Overview & Importance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Box 1: نبذة عن الاختصاص */}
              <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-100 space-y-2">
                <h4 className="text-sm font-extrabold text-[#0c3250] flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#2563eb]" />
                  <span>نبذة عن الاختصاص</span>
                </h4>
                <p className="text-xs sm:text-sm text-[#595e65] leading-relaxed">
                  {activeSpecialtyData.specialty.overview}
                </p>
              </div>

              {/* Box 2: أهمية الاختصاص */}
              <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-100 space-y-2">
                <h4 className="text-sm font-extrabold text-[#0c3250] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#32a1e6]" />
                  <span>أهمية الاختصاص ومجالات التركيز</span>
                </h4>
                <p className="text-xs sm:text-sm text-[#595e65] leading-relaxed">
                  {activeSpecialtyData.specialty.importance}
                </p>
              </div>

            </div>

            {/* What you study? */}
            <div className="space-y-3">
              <h4 className="text-base font-extrabold text-[#0c3250]">
                ماذا يدرس الطالب في هذا الاختصاص؟
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeSpecialtyData.specialty.whatYouStudy.map((item, i) => (
                  <div 
                    key={i} 
                    className="p-3 bg-white rounded-xl border border-slate-200/80 flex items-start gap-2.5 text-xs text-slate-700 font-medium"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#0284c7] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Courses / المواد الدراسية منظمة حسب السنوات والفصول */}
            <div className="space-y-6 pt-4 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-base font-extrabold text-[#0c3250]">
                    الخطة الدراسية والمقررات المعتمدة
                  </h4>
                  <p className="text-xs text-slate-500">
                    توزيع المقررات وفق التسلسل الأكاديمي المعتمد من إدارة المركز
                  </p>
                </div>
                <span className="text-xs text-blue-700 font-black px-3 py-1 bg-blue-50 rounded-xl border border-blue-100">
                  {activeSpecialtyData.specialty.courses.length} مواد مسجلة في هذا الاختصاص
                </span>
              </div>

              {/* Grouped by Year 1 and Year 2 */}
              {[1, 2].map(yearNum => {
                const yearCourses = activeSpecialtyData.specialty.courses.filter(
                  c => (c.academicYear || 1) === yearNum
                );
                if (yearCourses.length === 0) return null;

                const term1Courses = yearCourses.filter(c => (c.semesterTerm || 1) === 1);
                const term2Courses = yearCourses.filter(c => (c.semesterTerm || 1) === 2);

                return (
                  <div key={yearNum} className="space-y-4 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                        <h5 className="text-sm font-black text-[#0c3250]">
                          السنة الدراسية {yearNum === 1 ? 'الأولى' : 'الثانية'} ({yearCourses.length} مادة)
                        </h5>
                      </div>
                      <span className="text-[11px] text-slate-400 font-bold">
                        فصلان دراسيان
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Term 1 Box */}
                      <div className="space-y-2.5">
                        <span className="text-xs font-bold text-blue-800 bg-blue-100/60 px-2.5 py-1 rounded-lg inline-block">
                          الفصل الأول ({term1Courses.length} مواد)
                        </span>
                        <div className="space-y-2">
                          {term1Courses.map(course => (
                            <div
                              key={course.id}
                              className="p-3 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-all space-y-1 shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold text-[#0c3250]">{course.title}</span>
                                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{course.code}</span>
                              </div>
                              {course.importance ? (
                                <p className="text-[11px] text-slate-600 font-medium line-clamp-2">⚖️ {course.importance}</p>
                              ) : course.description ? (
                                <p className="text-[11px] text-slate-500 line-clamp-1">{course.description}</p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Term 2 Box */}
                      <div className="space-y-2.5">
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100/60 px-2.5 py-1 rounded-lg inline-block">
                          الفصل الثاني ({term2Courses.length} مواد)
                        </span>
                        <div className="space-y-2">
                          {term2Courses.map(course => (
                            <div
                              key={course.id}
                              className="p-3 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 transition-all space-y-1 shadow-2xs"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-extrabold text-[#0c3250]">{course.title}</span>
                                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{course.code}</span>
                              </div>
                              {course.importance ? (
                                <p className="text-[11px] text-slate-600 font-medium line-clamp-2">⚖️ {course.importance}</p>
                              ) : course.description ? (
                                <p className="text-[11px] text-slate-500 line-clamp-1">{course.description}</p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </section>

      {/* 4. SECTION: «نبذة عن المركز» (About Future Center) */}
      <section id="about-center-section" className="scroll-mt-24 space-y-8">
        
        {/* Section Header */}
        <div className="border-b border-slate-200/90 pb-4">
          <div className="flex items-center gap-2 text-[#2563eb] text-xs font-bold mb-1">
            <span className="w-2 h-2 rounded-full bg-[#0284c7]"></span>
            <span>الاعتماد والجودة التعليمية</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#0c3250]">
            نبذة عن مركز المستقبل
          </h2>
        </div>

        {/* Primary Licensed Statement Box (As requested) */}
        <div className="p-7 sm:p-9 rounded-3xl bg-gradient-to-r from-[#eef7fd] via-white to-[#f0f9f1] border border-blue-100/90 shadow-fc-card space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white text-[#2563eb] font-bold text-xs border border-blue-200/80 shadow-2xs">
            <Building2 className="w-4 h-4 text-[#0284c7]" />
            <span>مركز تعليمي مرخص ومعتمد</span>
          </div>

          <p className="text-base sm:text-lg text-[#0c3250] font-bold leading-relaxed max-w-4xl">
            «{siteSettings.aboutCenterText}»
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-2">
            <h4 className="text-base font-extrabold text-[#0c3250] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]"></span>
              <span>رسالة المركز</span>
            </h4>
            <p className="text-xs sm:text-sm text-[#595e65] leading-relaxed">
              {siteSettings.mission}
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xs space-y-2">
            <h4 className="text-base font-extrabold text-[#0c3250] flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#32a1e6]"></span>
              <span>رؤية المركز</span>
            </h4>
            <p className="text-xs sm:text-sm text-[#595e65] leading-relaxed">
              {siteSettings.vision}
            </p>
          </div>
        </div>

        {/* Center Goals */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
          <h4 className="text-base font-extrabold text-[#0c3250]">
            أهداف مركز المستقبل التعليمية
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {siteSettings.goals.map((goal, i) => (
              <div key={i} className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-[#2563eb] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  {goal}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Environment & Halls Features */}
        <div className="space-y-4">
          <h4 className="text-base font-extrabold text-[#0c3250]">
            البيئة التعليمية والقاعات والتجهيزات
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {siteSettings.smartEnvironmentFeatures.map((feat, i) => (
              <div key={i} className="p-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#eef7fd] text-[#32a1e6] flex items-center justify-center mb-2">
                  <MonitorCheck className="w-5 h-5" />
                </div>
                <h5 className="text-sm font-bold text-[#0c3250]">{feat.title}</h5>
                <p className="text-[11px] text-[#595e65] leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {siteSettings.hallsAndEquipment.map((hall, i) => (
              <div key={i} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                <h5 className="text-xs font-bold text-[#2563eb]">{hall.title}</h5>
                <p className="text-[11px] text-[#595e65] leading-relaxed">{hall.description}</p>
              </div>
            ))}
          </div>
        </div>

      </section>

    </div>
  );
};
