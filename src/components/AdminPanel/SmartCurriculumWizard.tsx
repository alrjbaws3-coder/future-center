import React, { useState, useMemo } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { Specialty, Course } from '../../types';
import { 
  Sparkles, 
  BookOpen, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  ChevronDown, 
  Search, 
  GraduationCap, 
  Layers,
  HelpCircle,
  AlertCircle,
  Copy
} from 'lucide-react';
import { copyCourseShareLink } from '../../utils/courseLink';

interface DynamicCourseItem {
  id: string;
  title: string;
  importance: string;
}

export const SmartCurriculumWizard: React.FC = () => {
  const { programs, addSpecialty, updateSpecialty, deleteSpecialty, addToast, clearAllSpecialtiesAndCourses } = usePlatform();

  // Form State - Clean, Simple, Direct
  const [specialtyName, setSpecialtyName] = useState('');
  const [specialtyOverview, setSpecialtyOverview] = useState('');
  const [specialtyImportance, setSpecialtyImportance] = useState('');
  const [coursesList, setCoursesList] = useState<DynamicCourseItem[]>([
    { id: 'crs-init-1', title: '', importance: '' }
  ]);

  // Edit Mode Tracking
  const [editingSpecialtyId, setEditingSpecialtyId] = useState<string | null>(null);
  const [editingProgramId, setEditingProgramId] = useState<string>('diploma-medium');

  // Preview & Search State
  const [expandedPreviewIds, setExpandedPreviewIds] = useState<Record<string, boolean>>({});
  const [searchFilter, setSearchFilter] = useState('');
  const [specialtyToDelete, setSpecialtyToDelete] = useState<{ programId: string; id: string; name: string } | null>(null);
  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  // All specialties flat list with program info
  const allSpecialties = useMemo(() => {
    return programs.flatMap(prog => 
      prog.specialties.map(spec => ({
        ...spec,
        programId: prog.id,
        programTitle: prog.title
      }))
    );
  }, [programs]);

  // Filtered specialties
  const filteredSpecialties = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return allSpecialties;
    return allSpecialties.filter(s => 
      s.name.toLowerCase().includes(q) ||
      (s.overview && s.overview.toLowerCase().includes(q)) ||
      (s.importance && s.importance.toLowerCase().includes(q)) ||
      s.courses.some(c => c.title.toLowerCase().includes(q))
    );
  }, [allSpecialties, searchFilter]);

  // Dynamic Course Actions
  const handleAddCourse = () => {
    setCoursesList(prev => [
      ...prev,
      { id: `crs-new-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, title: '', importance: '' }
    ]);
  };

  const handleRemoveCourse = (index: number) => {
    setCoursesList(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleCourseChange = (index: number, field: 'title' | 'importance', value: string) => {
    setCoursesList(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      return { ...item, [field]: value };
    }));
  };

  // Reset / Clear Form
  const handleResetForm = () => {
    setSpecialtyName('');
    setSpecialtyOverview('');
    setSpecialtyImportance('');
    setCoursesList([
      { id: 'crs-init-1', title: '', importance: '' }
    ]);
    setEditingSpecialtyId(null);
    setEditingProgramId('diploma-medium');
  };

  // Load for Edit
  const handleEditClick = (spec: Specialty & { programId: string }) => {
    setEditingSpecialtyId(spec.id);
    setEditingProgramId(spec.programId);
    setSpecialtyName(spec.name || '');
    setSpecialtyOverview(spec.overview || spec.visionAndGoal || '');
    setSpecialtyImportance(spec.importance || '');

    if (spec.courses && spec.courses.length > 0) {
      setCoursesList(
        spec.courses.map(c => ({
          id: c.id,
          title: c.title,
          importance: c.importance || c.learningOutcome || c.description || ''
        }))
      );
    } else {
      setCoursesList([{ id: 'crs-init-1', title: '', importance: '' }]);
    }

    // Scroll smoothly to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete Specialty
  const handleDeleteClick = (programId: string, specId: string, specName: string) => {
    setSpecialtyToDelete({ programId, id: specId, name: specName });
  };

  // Toggle Card Accordion
  const togglePreview = (specId: string) => {
    setExpandedPreviewIds(prev => ({
      ...prev,
      [specId]: !prev[specId]
    }));
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = specialtyName.trim();
    if (!trimmedName) {
      addToast('error', 'يرجى إدخال اسم الاختصاص / الفرع.');
      return;
    }

    // Filter valid courses
    const validCourses = coursesList
      .map(c => ({
        ...c,
        title: c.title.trim(),
        importance: c.importance.trim()
      }))
      .filter(c => c.title.length > 0);

    const targetProgramId = editingProgramId || programs[0]?.id || 'diploma-medium';

    if (editingSpecialtyId) {
      // Find existing to preserve IDs, codes, and lectures
      const existing = allSpecialties.find(s => s.id === editingSpecialtyId);
      
      const updatedCourses: Course[] = validCourses.map((vc, idx) => {
        const prevCourse = existing?.courses.find(c => c.id === vc.id || c.title === vc.title);
        return {
          id: prevCourse?.id || `crs-${Date.now()}-${idx}`,
          code: prevCourse?.code || `CRS-${idx + 101}`,
          title: vc.title,
          specialtyId: editingSpecialtyId,
          academicYear: (idx >= 6 ? 2 : 1) as 1 | 2,
          semesterTerm: (idx % 2 === 0 ? 1 : 2) as 1 | 2,
          description: vc.importance || vc.title,
          importance: vc.importance,
          learningOutcome: vc.importance,
          price: prevCourse?.price || 50000,
          semesters: prevCourse?.semesters || [
            { id: `sem-${Date.now()}-${idx}`, name: 'الفصل الأول', lectures: [] }
          ]
        };
      });

      updateSpecialty(targetProgramId, editingSpecialtyId, {
        name: trimmedName,
        overview: specialtyOverview.trim() || `اختصاص ${trimmedName} المعتمد في مركز المستقبل.`,
        importance: specialtyImportance.trim() || `يمنح اختصاص ${trimmedName} الطالب مهارات عملية تؤهله للالتحاق المباشر بسوق العمل.`,
        coursesCount: `${updatedCourses.length} مادة معتمدة`,
        courses: updatedCourses
      });

      addToast('success', `تم تحديث اختصاص "${trimmedName}" بنجاح.`);
      handleResetForm();
    } else {
      // Create New
      const newCourses: Course[] = validCourses.map((vc, idx) => ({
        id: `crs-${Date.now()}-${idx}`,
        code: `CRS-${idx + 101}`,
        title: vc.title,
        specialtyId: '',
        academicYear: (idx >= 6 ? 2 : 1) as 1 | 2,
        semesterTerm: (idx % 2 === 0 ? 1 : 2) as 1 | 2,
        description: vc.importance || vc.title,
        importance: vc.importance,
        learningOutcome: vc.importance,
        price: 50000,
        semesters: [
          { id: `sem-${Date.now()}-${idx}`, name: 'الفصل الأول', lectures: [] }
        ]
      }));

      addSpecialty(targetProgramId, {
        name: trimmedName,
        code: `SPEC-${Date.now().toString().slice(-4)}`,
        overview: specialtyOverview.trim() || `اختصاص ${trimmedName} المعتمد في مركز المستقبل.`,
        importance: specialtyImportance.trim() || `يمنح اختصاص ${trimmedName} الطالب مهارات عملية تؤهله للالتحاق المباشر بسوق العمل.`,
        duration: 'سنتان (2)',
        coursesCount: `${newCourses.length} مواد معتمدة`,
        semestersCount: '4 فصول دراسية',
        whatYouStudy: validCourses.map(c => c.title),
        courses: newCourses
      });

      addToast('success', `تمت إضافة اختصاص "${trimmedName}" ومواده بنجاح.`);
      handleResetForm();
    }
  };

  // Fast Example Filler (Cybersecurity example from prompt)
  const fillExampleCybersecurity = () => {
    setSpecialtyName('الأمن السيبراني');
    setSpecialtyOverview('اختصاص تقني متقدم يُعنى بحماية الأنظمة الرقمية، الشبكات، والبيانات الحساسة من الهجمات الإلكترونية وضمان استمرارية الأعمال.');
    setSpecialtyImportance('يُعد الأمن السيبراني أحد أكثر المجالات طلباً ونمواً في سوق العمل، حيث تعتمد المؤسسات والبنوك على خبراء الحماية لتأمين أصولها الرقمية، ويوفر فرصاً وظيفية عالية الدخل مثل محلل ثغرات ومستشار أمان رقمي.');
    setCoursesList([
      {
        id: 'ex-1',
        title: 'مقدمة في التشفير',
        importance: 'تشرح هذه المادة كيفية حماية البيانات ومنع الاختراقات، وهي الأساس لكل خبير أمن سيبراني.'
      },
      {
        id: 'ex-2',
        title: 'شبكات الحاسوب',
        importance: 'بدون فهم الشبكات لا يمكن حمايتها، تمنحك هذه المادة القدرة على فهم مسار البيانات والتصدي للهجمات.'
      },
      {
        id: 'ex-3',
        title: 'التحليل الجنائي الرقمي',
        importance: 'تزويد الطالب بمهارات تتبع الاختراقات وجمع الأدلة الرقمية لتحليل الحوادث الأمنية بعد وقوعها.'
      }
    ]);
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      
      {/* Top Header Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100 font-bold shrink-0">
              <Sparkles className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <span className="text-[11px] font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                لوحة تحكم مالك المركز (مبسطة وسلسة)
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#0c3250] mt-1">
                إدارة الاختصاصات والمواد الدراسية
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowClearConfirmModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-rose-200 shadow-2xs"
              title="مسح وتصفير كافة الاختصاصات والمقررات القديمة نهائياً للبدء بصفحة بيضاء"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>تصفير المقررات القديمة للبدء من الصفر</span>
            </button>

            <button
              type="button"
              onClick={fillExampleCybersecurity}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
              title="تعبئة نموذج تجريبي جاهز (الأمن السيبراني)"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>تعبئة مثال جاهز</span>
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed pr-15">
          نموذج مبسط ومباشر صُمم لتسهيل عمل المالك: اكتب اسم الاختصاص، نبذة عن الفرع وأهميته الوظيفية، وأضف أسماء المواد الدراسية لتظهر فوراً للطالب في «حول المركز».
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 1. THE OWNER SIMPLE FORM (نموذج المالك المبسط والخالي من التعقيد)         */}
      {/* ========================================================================= */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-blue-200/80 shadow-md space-y-6">
        
        {/* Form Title & Edit Indicator */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 animate-pulse"></span>
            <h3 className="text-lg font-black text-[#0c3250]">
              {editingSpecialtyId ? `تعديل الاختصاص: ${specialtyName}` : 'إضافة اختصاص ومواد دراسية جديدة'}
            </h3>
          </div>
          {editingSpecialtyId && (
            <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-black rounded-full border border-amber-200 flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5" />
              <span>وضع التعديل مفعل</span>
            </span>
          )}
        </div>

        {/* FIELD 0: 🏛️ القسم الأكاديمي الرئيسي (دبلوم، ماجستير، إلخ) */}
        <div className="space-y-2 bg-blue-50/60 p-4 rounded-2xl border border-blue-200">
          <label className="text-sm font-black text-[#0c3250] flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="text-blue-600">🏛️</span>
              <span>القسم الأكاديمي الرئيسي التابع له:</span>
              <span className="text-rose-500 font-bold">*</span>
            </span>
            <span className="text-xs text-blue-700 font-bold">
              اختر القسم لتثبيت الاختصاص ومواده تحته
            </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {programs.map((prog) => {
              const isSelected = (editingProgramId || 'diploma-medium') === prog.id;
              return (
                <button
                  key={prog.id}
                  type="button"
                  onClick={() => setEditingProgramId(prog.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold ${
                    isSelected
                      ? 'bg-[#0c3250] text-white border-[#0c3250] shadow-xs ring-2 ring-blue-400'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {prog.title}
                </button>
              );
            })}
          </div>
        </div>

        {/* FIELD 1: ➕ اسم الاختصاص / الفرع */}
        <div className="space-y-2">
          <label className="text-sm font-black text-[#0c3250] flex items-center gap-2">
            <span className="text-blue-600">➕</span>
            <span>اسم الاختصاص / الفرع:</span>
            <span className="text-rose-500 font-bold">*</span>
          </label>
          <input
            type="text"
            value={specialtyName}
            onChange={(e) => setSpecialtyName(e.target.value)}
            placeholder="مثال: ماجستير إدارة الأعمال أو هندسة البرمجيات أو الأمن السيبراني..."
            required
            className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-hidden text-sm font-bold text-slate-800 bg-slate-50/50"
          />
        </div>

        {/* FIELD 2: 🎯 نبذة عن الفرع (مبسط ومباشر) */}
        <div className="space-y-2">
          <label className="text-sm font-black text-[#0c3250] flex items-center gap-2">
            <span>🎯</span>
            <span>نبذة عن الفرع / الاختصاص (وصف مختصر ومبسط):</span>
          </label>
          <textarea
            value={specialtyOverview}
            onChange={(e) => setSpecialtyOverview(e.target.value)}
            rows={2}
            placeholder="وصف مختصر ومبسط للاختصاص وماهيته العامة..."
            className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-hidden text-xs sm:text-sm font-medium text-slate-800 bg-slate-50/50 leading-relaxed"
          />
        </div>

        {/* FIELD 3: 💡 أهمية هذا الاختصاص (نبذة مختصرة عن المستقبل الوظيفي) */}
        <div className="space-y-2">
          <label className="text-sm font-black text-[#0c3250] flex items-center gap-2">
            <span>💡</span>
            <span>أهمية هذا الاختصاص (نبذة مختصرة عن المستقبل الوظيفي):</span>
          </label>
          <textarea
            value={specialtyImportance}
            onChange={(e) => setSpecialtyImportance(e.target.value)}
            rows={3}
            placeholder="لماذا يختار الطالب هذا المجال؟ ما هي الفرص الوظيفية المستقبلية له في سوق العمل؟"
            className="w-full px-4 py-3 rounded-2xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-hidden text-xs sm:text-sm font-medium text-slate-800 bg-slate-50/50 leading-relaxed"
          />
        </div>

        {/* FIELD 4: 📚 المواد الدراسية (حقل ديناميكي يضغط "إضافة مادة جديدة" ويملأ: اسم المادة + أهميتها) */}
        <div className="space-y-4 pt-3 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="text-sm font-black text-[#0c3250] flex items-center gap-2">
                <span>📚</span>
                <span>المواد الدراسية المعتمدة ({coursesList.length} مواد):</span>
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                اضغط على زر «إضافة مادة جديدة» لإدراج كل مادة مع بيان أهميتها ودورها للطالب.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddCourse}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مادة جديدة</span>
            </button>
          </div>

          {/* Dynamic Courses Rows */}
          {coursesList.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <p>لم يتم إدراج مواد بعد لهذا الاختصاص.</p>
              <button
                type="button"
                onClick={handleAddCourse}
                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-200 transition-colors"
              >
                + إضافة المادة الأولى
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {coursesList.map((item, idx) => (
                <div 
                  key={item.id || idx} 
                  className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200/90 hover:border-blue-300 transition-all space-y-3 relative group"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span className="text-xs font-black text-blue-800 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[11px] font-mono">
                        {idx + 1}
                      </span>
                      <span>المادة رقم {idx + 1}</span>
                    </span>

                    {coursesList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCourse(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                        title="حذف هذه المادة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف المادة</span>
                      </button>
                    )}
                  </div>

                  <div>
                    {/* اسم المادة فقط */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <span>📘</span>
                        <span>اسم المادة:</span>
                      </label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleCourseChange(idx, 'title', e.target.value)}
                        placeholder="مثال: مقدمة في التشفير أو شبكات الحاسوب..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden text-xs sm:text-sm font-bold text-slate-800 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Bottom Add Course Button */}
              <button
                type="button"
                onClick={handleAddCourse}
                className="w-full py-2.5 border-2 border-dashed border-blue-200 hover:border-blue-500 rounded-2xl text-blue-700 hover:bg-blue-50/50 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ إضافة مادة جديدة أخرى</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-black transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{editingSpecialtyId ? 'حفظ التعديلات على الاختصاص' : '💾 حفظ ونشر الاختصاص ومواده'}</span>
            </button>

            {(editingSpecialtyId || specialtyName) && (
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إلغاء وتفريغ الحقول</span>
              </button>
            )}
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            يتم تحديث صفحة «حول المركز» وبوابة الطالب فوراً عند الحفظ.
          </span>
        </div>

      </form>

      {/* ========================================================================= */}
      {/* 2. CURRENT SPECIALTIES LIST (معاينة حية وإدارة للاختصاصات الحالية)       */}
      {/* ========================================================================= */}
      <div className="space-y-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#0c3250] flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              <span>الاختصاصات المعتمدة حالياً في المركز ({allSpecialties.length} اختصاصات)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              يمكنك تعديل أي اختصاص بنقرة واحدة لتحميل بياناته في النموذج أعلاه، أو معاينة قائمة مواده كما يراها الطالب.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="ابحث في الاختصاصات أو المواد..."
              className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 bg-slate-50/70"
            />
          </div>
        </div>

        {/* Specialties Cards Grid */}
        {filteredSpecialties.length === 0 ? (
          <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center text-xs text-slate-400 space-y-2">
            <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
            <p>لم يتم العثور على اختصاصات مطابقة للبحث.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {filteredSpecialties.map((spec) => {
              const isExpanded = !!expandedPreviewIds[spec.id];

              return (
                <div 
                  key={spec.id}
                  className={`bg-white rounded-3xl border transition-all p-6 sm:p-7 space-y-5 shadow-xs ${
                    editingSpecialtyId === spec.id ? 'border-2 border-blue-500 ring-4 ring-blue-50' : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  
                  {/* Top Specialty Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl">
                          {spec.programTitle || 'دبلوم معتمد'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {spec.courses.length} مواد مشمولة
                        </span>
                      </div>
                      <h4 className="text-xl font-black text-[#0c3250] flex items-center gap-2 pt-1">
                        <span>🎓 الاختصاص:</span>
                        <span className="text-blue-700">{spec.name}</span>
                      </h4>
                    </div>

                    {/* Quick Admin Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => handleEditClick(spec)}
                        className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>تعديل في النموذج</span>
                      </button>

                      <button
                        onClick={() => handleDeleteClick(spec.programId, spec.id, spec.name)}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>

                  {/* 🎯 نبذة عن الفرع */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="text-xs font-black text-[#0c3250] flex items-center gap-1.5">
                      <span>🎯 نبذة عن الفرع:</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                      {spec.overview || spec.visionAndGoal || 'اختصاص أكاديمي تطبيقي متكامل لإعداد الكوادر المؤهلة لسوق العمل.'}
                    </p>
                  </div>

                  {/* 🚀 أهمية هذا الاختصاص */}
                  <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-1">
                    <div className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                      <span>🚀 أهمية هذا الاختصاص:</span>
                      <span className="text-[11px] text-amber-700 font-semibold">(لماذا يختار الطالب هذا المجال؟ ما هي الفرص الوظيفية المستقبلية له؟)</span>
                    </div>
                    <p className="text-xs sm:text-sm text-amber-950 leading-relaxed font-medium">
                      {spec.importance || 'يمنح هذا التخصص الطالب مهارات عملية تؤهله مباشرة للمنافسة في سوق العمل والحصول على فرص وظيفية واعدة.'}
                    </p>
                  </div>

                  {/* Button: [ 📖 عرض المواد الدراسية المشمولة ] */}
                  <div className="pt-2">
                    <p className="text-xs text-slate-500 font-bold mb-2 flex items-center gap-1">
                      <span>👇 اضغط على الزر أدناه لاستكشاف المواد الدراسية</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => togglePreview(spec.id)}
                      className={`w-full py-3.5 px-5 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xs ${
                        isExpanded
                          ? 'bg-blue-700 text-white'
                          : 'bg-[#183b63] hover:bg-[#122e4e] text-white'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>{isExpanded ? '📖 إخفاء المواد الدراسية' : '📖 عرض المواد الدراسية المشمولة'}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-xs font-mono">
                        {spec.courses.length} مواد
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  </div>

                  {/* 2. قائمة المواد المنسدلة (تظهر بعد الضغط على زر العرض) */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between pb-1">
                        <h5 className="text-sm font-black text-[#0c3250] flex items-center gap-2">
                          <span>📚 قائمة المواد الدراسية المعتمدة:</span>
                        </h5>
                        <span className="text-xs text-slate-400 font-bold">
                          {spec.courses.length} مقرر
                        </span>
                      </div>

                      {spec.courses.length === 0 ? (
                        <div className="p-5 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          لم يتم إدراج مواد دراسية في هذا الاختصاص بعد.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {spec.courses.map((course, cIdx) => {
                            const courseImportance = course.importance || course.learningOutcome || course.description || 'تزود الطالب بالمعرفة التخصصية والتطبيقات العملية اللازمة للتميز في هذا المجال.';
                            
                            // Arabic ordinals
                            const arabicOrdinals = [
                              'المادة الأولى',
                              'المادة الثانية',
                              'المادة الثالثة',
                              'المادة الرابعة',
                              'المادة الخامسة',
                              'المادة السادسة',
                              'المادة السابعة',
                              'المادة الثامنة',
                              'المادة التاسعة',
                              'المادة العاشرة',
                              'المادة الحادية عشرة',
                              'المادة الثانية عشرة'
                            ];
                            const label = arabicOrdinals[cIdx] || `المادة رقم ${cIdx + 1}`;

                            return (
                              <div
                                key={course.id || cIdx}
                                className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 hover:border-blue-300 hover:bg-white transition-all flex flex-wrap items-center justify-between gap-2 shadow-2xs"
                              >
                                {/* 📘 اسم المادة فقط */}
                                <div className="flex items-center gap-2">
                                  <span className="text-sm sm:text-base font-black text-blue-900">
                                    📘 {label}: {course.title}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  {course.code && (
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                                      {course.code}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => copyCourseShareLink(course.id, course.title, (msg) => addToast('success', msg))}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                    title="نسخ الرابط المباشر للمقرر"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Modal: تأكيد حذف الاختصاص نهائياً */}
      {specialtyToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-900">تأكيد حذف الاختصاص</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              هل أنت متأكد من رغبتك في حذف اختصاص <strong className="text-rose-600 font-bold">"{specialtyToDelete.name}"</strong> وكافة المواد الدراسية والمناهج المعتمدة التابعة له؟
            </p>
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 text-[11px] text-rose-800 text-right space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>إشعار هام:</span>
              </div>
              <p>سيتم حذف الاختصاص ومواده نهائياً وتحديث قاعدة البيانات المشتركة على السيرفر، وتجريد الطلاب المسجلين فيه من صلاحيات هذه المواد.</p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setSpecialtyToDelete(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteSpecialty(specialtyToDelete.programId, specialtyToDelete.id);
                  if (editingSpecialtyId === specialtyToDelete.id) {
                    handleResetForm();
                  }
                  setSpecialtyToDelete(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                تأكيد حذف الاختصاص
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Clearing All Old Specialties & Courses */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in" dir="rtl">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-900">تصفير ومسح كافة المقررات القديمة</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              هل أنت متأكد من رغبتك في حذف وتصفير جميع الاختصاصات والمقررات القديمة نهائياً من قاعدة البيانات للبدء بصفحة بيضاء؟
            </p>
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 text-right space-y-1 font-medium">
              <span>لن تعود هذه المقررات القديمة مجدداً بعد الحذف، وستتمكن فوراً من إضافة اختصاصاتك وموادك ومحاضراتك الجديدة بحرية كاملة.</span>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllSpecialtiesAndCourses();
                  setShowClearConfirmModal(false);
                  handleResetForm();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                تأكيد التصفير والبدء من جديد
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
