import React, { useState } from 'react';
import { 
  GraduationCap, 
  Award, 
  BookOpenCheck, 
  Sparkles, 
  Briefcase, 
  BookOpen, 
  Layers, 
  Plus, 
  Edit3, 
  Trash2, 
  ArrowRight, 
  CheckCircle2, 
  Shield, 
  X, 
  Info,
  FolderTree,
  SlidersHorizontal
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { EducationalProgram, Specialty } from '../types';
import { FutureCenterEmblem, FutureCenterLogo } from './FutureCenterLogo';

interface ProgramsPageProps {
  onBack?: () => void;
  onNavigateToAdminCurriculum?: () => void;
}

export const ProgramsPage: React.FC<ProgramsPageProps> = ({ 
  onBack, 
  onNavigateToAdminCurriculum 
}) => {
  const { 
    programs, 
    currentUser, 
    addProgram, 
    updateProgram, 
    deleteProgram,
    addSpecialty,
    updateSpecialty,
    deleteSpecialty,
    addToast
  } = usePlatform();

  const isOwner = currentUser?.role === 'owner';

  // Modal States
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [programForm, setProgramForm] = useState({
    title: '',
    tagline: '',
    description: '',
    iconName: 'GraduationCap'
  });

  const [isSpecialtyModalOpen, setIsSpecialtyModalOpen] = useState(false);
  const [targetProgramForSpecialty, setTargetProgramForSpecialty] = useState<string | null>(null);
  const [editingSpecialtyId, setEditingSpecialtyId] = useState<string | null>(null);
  const [specialtyForm, setSpecialtyForm] = useState({
    name: '',
    code: '',
    duration: 'سنتان (2)',
    overview: ''
  });

  // Delete Confirmation Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'program' | 'specialty';
    programId: string;
    specialtyId?: string;
    title: string;
  } | null>(null);

  // Icon Map Helper
  const renderProgramIcon = (iconName: string, className = "w-6 h-6") => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'BookOpenCheck':
        return <BookOpenCheck className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Briefcase':
        return <Briefcase className={className} />;
      case 'Layers':
        return <Layers className={className} />;
      default:
        return <BookOpen className={className} />;
    }
  };

  // Program Handlers
  const handleOpenAddProgram = () => {
    setEditingProgramId(null);
    setProgramForm({
      title: '',
      tagline: '',
      description: '',
      iconName: 'GraduationCap'
    });
    setIsProgramModalOpen(true);
  };

  const handleOpenEditProgram = (prog: EducationalProgram) => {
    setEditingProgramId(prog.id);
    setProgramForm({
      title: prog.title,
      tagline: prog.tagline || '',
      description: prog.description || '',
      iconName: prog.iconName || 'GraduationCap'
    });
    setIsProgramModalOpen(true);
  };

  const handleSaveProgram = (e: React.FormEvent) => {
    e.preventDefault();
    if (!programForm.title.trim()) {
      addToast('error', 'يرجى إدخال اسم القسم / البرنامج التعليمي.');
      return;
    }

    if (editingProgramId) {
      updateProgram(editingProgramId, {
        title: programForm.title.trim(),
        tagline: programForm.tagline.trim(),
        description: programForm.description.trim(),
        iconName: programForm.iconName
      });
    } else {
      addProgram({
        title: programForm.title.trim(),
        tagline: programForm.tagline.trim() || 'برنامج أكاديمي معتمد في مركز المستقبل',
        description: programForm.description.trim() || 'قسم تعليمي معتمد قابل للإدارة والتوسع.',
        iconName: programForm.iconName
      });
    }

    setIsProgramModalOpen(false);
  };

  // Specialty Handlers
  const handleOpenAddSpecialty = (programId: string) => {
    setTargetProgramForSpecialty(programId);
    setEditingSpecialtyId(null);
    setSpecialtyForm({
      name: '',
      code: '',
      duration: 'سنتان (2)',
      overview: ''
    });
    setIsSpecialtyModalOpen(true);
  };

  const handleOpenEditSpecialty = (programId: string, spec: Specialty) => {
    setTargetProgramForSpecialty(programId);
    setEditingSpecialtyId(spec.id);
    setSpecialtyForm({
      name: spec.name,
      code: spec.code || '',
      duration: spec.duration || 'سنتان (2)',
      overview: spec.overview || ''
    });
    setIsSpecialtyModalOpen(true);
  };

  const handleSaveSpecialty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProgramForSpecialty) return;
    if (!specialtyForm.name.trim()) {
      addToast('error', 'يرجى كتابة اسم الاختصاص.');
      return;
    }

    if (editingSpecialtyId) {
      updateSpecialty(targetProgramForSpecialty, editingSpecialtyId, {
        name: specialtyForm.name.trim(),
        code: specialtyForm.code.trim() || 'SPEC',
        duration: specialtyForm.duration.trim(),
        overview: specialtyForm.overview.trim()
      });
    } else {
      addSpecialty(targetProgramForSpecialty, {
        name: specialtyForm.name.trim(),
        code: specialtyForm.code.trim() || `SPEC-${Date.now().toString().slice(-3)}`,
        duration: specialtyForm.duration.trim() || 'سنتان (2)',
        coursesCount: '24 مادة',
        semestersCount: '4 فصول دراسية',
        overview: specialtyForm.overview.trim() || `اختصاص ${specialtyForm.name.trim()} المعتمد بمركز المستقبل.`,
        importance: 'يؤهل الطالب لسوق العمل واكتساب المعارف التخصصية الدقيقة.',
        whatYouStudy: ['المقررات التخصصية والتطبيقية المعيارية']
      });
    }

    setIsSpecialtyModalOpen(false);
  };

  // Confirm Delete Action
  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;

    if (deleteConfirm.type === 'program') {
      deleteProgram(deleteConfirm.programId);
    } else if (deleteConfirm.type === 'specialty' && deleteConfirm.specialtyId) {
      deleteSpecialty(deleteConfirm.programId, deleteConfirm.specialtyId);
    }

    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/70 text-slate-800 pb-16 select-none" dir="rtl">
      
      {/* Top Navigation Bar */}
      <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <FutureCenterLogo size="sm" showText={true} arabicSubtitle={true} />
          </div>

          <div className="flex items-center gap-3">
            {isOwner && onNavigateToAdminCurriculum && (
              <button
                id="btn-nav-admin-curriculum"
                onClick={onNavigateToAdminCurriculum}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#2563eb] text-xs font-bold transition-all cursor-pointer"
              >
                <FolderTree className="w-4 h-4 text-[#2563eb]" />
                <span>إدارة المناهج والصفوف</span>
              </button>
            )}

            {onBack && (
              <button
                id="btn-programs-back"
                onClick={onBack}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-fc-btn-gradient text-white text-xs font-bold hover:opacity-95 transition-all cursor-pointer shadow-fc-btn"
              >
                <ArrowRight className="w-4 h-4" />
                <span>العودة</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        
        {/* Page Hero Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#1e3a5f] font-extrabold text-xs">
              <span className="w-2 h-2 rounded-full bg-[#65a30d]"></span>
              <span>مركز المستقبل للتدريب والتأهيل الأكاديمي</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#0c3250] tracking-tight">
              صفحة البرامج التعليمية
            </h1>
            <p className="text-sm sm:text-base text-slate-600 font-medium leading-relaxed max-w-2xl">
              استعراض الأقسام الرئيسية المعتمدة في مركز المستقبل والاختصاصات التابعة لها، مع إمكانية الإدارة والتوسع الديناميكي.
            </p>
          </div>

          {/* Owner Quick Controls */}
          {isOwner && (
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                id="btn-add-main-program"
                onClick={handleOpenAddProgram}
                className="px-4 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قسم رئيسي جديد</span>
              </button>
            </div>
          )}
        </div>

        {/* Owner Management Notification Banner */}
        {isOwner && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs font-medium flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                <strong>وضع إدارة المالك:</strong> يمكنك إضافة، تعديل، وحذف أي قسم رئيسي أو اختصاص مباشرة من هذه الصفحة، وستنعكس التعديلات فوراً على المنصة.
              </span>
            </div>
            <span className="text-[11px] px-2.5 py-1 bg-amber-100 font-bold rounded-lg shrink-0">
              إدارة مرنة بدون كود
            </span>
          </div>
        )}

        {/* The Main Sections Cards (الأقسام الرئيسية على شكل بطاقات واضحة ومرتبة) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {programs.map((program, index) => {
            const hasSpecialties = program.specialties && program.specialties.length > 0;

            return (
              <div
                key={program.id}
                id={`program-card-${program.id}`}
                className="bg-white rounded-[28px] border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden relative group"
              >
                {/* Card Top Banner / Accent */}
                <div className="h-2 w-full bg-gradient-to-l from-[#1c456e] via-[#2563eb] to-[#0ea5e9]"></div>

                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
                  
                  {/* Top Header: Icon + Number + Title */}
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50/90 border border-blue-100 flex items-center justify-center text-[#2563eb] shadow-2xs">
                        {renderProgramIcon(program.iconName, "w-7 h-7")}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-extrabold">
                          القسم {index + 1}
                        </span>
                        {isOwner && (
                          <div className="flex items-center gap-1">
                            <button
                              title="تعديل بيانات القسم"
                              onClick={() => handleOpenEditProgram(program)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#2563eb] hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              title="حذف هذا القسم"
                              onClick={() => setDeleteConfirm({
                                type: 'program',
                                programId: program.id,
                                title: program.title
                              })}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Program Title */}
                    <h2 className="text-xl sm:text-2xl font-black text-[#0c3250] tracking-tight mb-2">
                      {program.title}
                    </h2>

                    {/* Tagline / Subtitle */}
                    {program.tagline && (
                      <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed mb-4">
                        {program.tagline}
                      </p>
                    )}
                  </div>

                  {/* Specialties Block */}
                  <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#0c3250] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#2563eb]"></span>
                        <span>الاختصاصات المعتمدة:</span>
                      </span>

                      {isOwner && (
                        <button
                          onClick={() => handleOpenAddSpecialty(program.id)}
                          className="text-[11px] font-bold text-[#2563eb] hover:text-[#1d4ed8] flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة اختصاص</span>
                        </button>
                      )}
                    </div>

                    {/* If Program has specialties: render them as clear, ordered bullet cards */}
                    {hasSpecialties ? (
                      <ul className="space-y-2.5">
                        {program.specialties.map((spec) => (
                          <li
                            key={spec.id}
                            className="bg-white rounded-xl p-3 border border-slate-200 flex items-center justify-between gap-3 shadow-2xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-2 h-2 rounded-full bg-[#65a30d]"></span>
                              <span className="text-sm font-black text-[#0c3250]">
                                {spec.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {spec.code && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-slate-100 text-slate-600 font-bold">
                                  {spec.code}
                                </span>
                              )}

                              {isOwner && (
                                <div className="flex items-center gap-1">
                                  <button
                                    title="تعديل الاختصاص"
                                    onClick={() => handleOpenEditSpecialty(program.id, spec)}
                                    className="p-1 text-slate-400 hover:text-[#2563eb] rounded-md transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    title="حذف الاختصاص"
                                    onClick={() => setDeleteConfirm({
                                      type: 'specialty',
                                      programId: program.id,
                                      specialtyId: spec.id,
                                      title: spec.name
                                    })}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      /* If Program has NO specialties: render "قابل للإضافة والإدارة." as requested */
                      <div className="bg-white/90 rounded-xl p-4 border border-dashed border-slate-300 text-right space-y-2">
                        <div className="flex items-center gap-2 text-sm font-extrabold text-[#0c3250]">
                          <span className="w-2 h-2 rounded-full bg-[#0284c7]"></span>
                          <span>قابل للإضافة والإدارة.</span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          هذا القسم مهيأ بالكامل لاستقبال الاختصاصات والمقررات الأكاديمية أو المهنية الجديدة في أي وقت من لوحة الإدارة.
                        </p>
                        {isOwner && (
                          <button
                            onClick={() => handleOpenAddSpecialty(program.id)}
                            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-[#2563eb] text-xs font-bold hover:bg-blue-100 cursor-pointer transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ إضافة أول اختصاص لهذا القسم الآن</span>
                          </button>
                        )}
                      </div>
                    )}

                  </div>

                </div>

                {/* Card Footer Note */}
                <div className="px-6 sm:px-8 py-3.5 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#65a30d]" />
                    <span>برنامج معتمد بمركز المستقبل</span>
                  </div>
                  <span>{hasSpecialties ? `${program.specialties.length} اختصاصات` : 'جاهز للإدارة'}</span>
                </div>

              </div>
            );
          })}
        </div>

      </main>

      {/* ================= MODAL: إضافة / تعديل قسم رئيسي ================= */}
      {isProgramModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-[#0c3250]">
                {editingProgramId ? 'تعديل بيانات القسم الرئيسي' : 'إضافة قسم رئيسي جديد'}
              </h3>
              <button 
                onClick={() => setIsProgramModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProgram} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم القسم / البرنامج:</label>
                <input
                  type="text"
                  value={programForm.title}
                  onChange={(e) => setProgramForm({ ...programForm, title: e.target.value })}
                  placeholder="مثال: دبلوم المعهد المتوسط، الماجستير..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الشعار الفرعي (Tagline):</label>
                <input
                  type="text"
                  value={programForm.tagline}
                  onChange={(e) => setProgramForm({ ...programForm, tagline: e.target.value })}
                  placeholder="مثال: برنامج أكاديمي تطبيقي يضم اختصاصات معتمدة"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف القسم:</label>
                <textarea
                  rows={3}
                  value={programForm.description}
                  onChange={(e) => setProgramForm({ ...programForm, description: e.target.value })}
                  placeholder="وصف مختصر لمجال الدراسة وأهداف القسم..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">أيقونة القسم:</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    { id: 'GraduationCap', label: 'قبعة تخرج' },
                    { id: 'Award', label: 'وسام دبلوم' },
                    { id: 'BookOpenCheck', label: 'ماجستير' },
                    { id: 'Sparkles', label: 'مهني' },
                    { id: 'Briefcase', label: 'أعمال' },
                    { id: 'BookOpen', label: 'كتاب' }
                  ].map((icon) => (
                    <button
                      key={icon.id}
                      type="button"
                      onClick={() => setProgramForm({ ...programForm, iconName: icon.id })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${
                        programForm.iconName === icon.id 
                          ? 'bg-[#2563eb] text-white border-[#2563eb]' 
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {renderProgramIcon(icon.id, "w-4 h-4")}
                      <span>{icon.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsProgramModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
                >
                  {editingProgramId ? 'حفظ التعديلات' : 'إضافة القسم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: إضافة / تعديل اختصاص ================= */}
      {isSpecialtyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-black text-[#0c3250]">
                {editingSpecialtyId ? 'تعديل الاختصاص' : 'إضافة اختصاص جديد'}
              </h3>
              <button 
                onClick={() => setIsSpecialtyModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSpecialty} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الاختصاص:</label>
                <input
                  type="text"
                  value={specialtyForm.name}
                  onChange={(e) => setSpecialtyForm({ ...specialtyForm, name: e.target.value })}
                  placeholder="مثال: إدارة أعمال، تطبيقات تقانة المعلومات..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رمز الاختصاص (الكود):</label>
                  <input
                    type="text"
                    value={specialtyForm.code}
                    onChange={(e) => setSpecialtyForm({ ...specialtyForm, code: e.target.value })}
                    placeholder="مثال: BA, IT-APPS"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">مدة الدراسة:</label>
                  <input
                    type="text"
                    value={specialtyForm.duration}
                    onChange={(e) => setSpecialtyForm({ ...specialtyForm, duration: e.target.value })}
                    placeholder="مثال: سنتان (2)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نبذة عن الاختصاص:</label>
                <textarea
                  rows={3}
                  value={specialtyForm.overview}
                  onChange={(e) => setSpecialtyForm({ ...specialtyForm, overview: e.target.value })}
                  placeholder="وصف مختصر لأهمية ومجالات هذا الاختصاص..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSpecialtyModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
                >
                  {editingSpecialtyId ? 'حفظ التعديلات' : 'إضافة الاختصاص'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: تأكيد الحذف ================= */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-[#0c3250]">
              تأكيد حذف {deleteConfirm.type === 'program' ? 'القسم' : 'الاختصاص'}
            </h3>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              هل أنت متأكد من رغبتك في حذف <strong>"{deleteConfirm.title}"</strong>؟
              {deleteConfirm.type === 'program' && ' سيتم حذف كافة الاختصاصات والمقررات التابعة له.'}
            </p>

            <div className="pt-3 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
