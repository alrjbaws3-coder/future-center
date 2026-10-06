import React, { useState, useMemo } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { 
  Specialty, 
  Course, 
  Semester, 
  Lecture, 
  LectureFile,
  Branch,
  EducationalProgram 
} from '../../types';
import { 
  Folder, 
  FolderPlus, 
  FileText, 
  Video, 
  Plus, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  ArrowRight, 
  DownloadCloud, 
  Eye, 
  Check, 
  X, 
  Layers, 
  BookOpen, 
  Calendar,
  Sparkles,
  GitBranch,
  GraduationCap,
  Clock,
  FolderTree,
  Copy,
  Share2
} from 'lucide-react';
import { ProgramsPage } from '../ProgramsPage';
import { SmartCurriculumWizard } from './SmartCurriculumWizard';
import { copyCourseShareLink } from '../../utils/courseLink';

interface HierarchicalCurriculumProps {
  initialCourseId?: string | null;
  onClearInitialCourse?: () => void;
}

export const HierarchicalCurriculum: React.FC<HierarchicalCurriculumProps> = ({
  initialCourseId,
  onClearInitialCourse
}) => {
  const {
    programs,
    addProgram,
    updateProgram,
    deleteProgram,
    addSpecialty,
    updateSpecialty,
    deleteSpecialty,
    addBranch,
    addCourse,
    updateCourse,
    deleteCourse,
    addSemester,
    deleteSemester,
    addLecture,
    deleteLecture,
    addLectureFile,
    deleteLectureFile,
    toggleLectureOffline,
    clearAllSpecialtiesAndCourses,
    addToast
  } = usePlatform();

  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);

  // Mode to switch to Smart Steps Wizard or live programs page
  const [showSmartWizard, setShowSmartWizard] = useState(false);
  const [showLiveProgramsPage, setShowLiveProgramsPage] = useState(false);

  // Selected Program (القسم الرئيسي): e.g. دبلوم المعهد المتوسط, الدبلوم التخصصي, الماجستير, التأهيل المهني
  const [selectedProgramId, setSelectedProgramId] = useState<string>(() => {
    return programs[0]?.id || 'diploma-medium';
  });

  const activeProgram = programs.find(p => p.id === selectedProgramId) || programs[0];
  const programSpecialties = activeProgram?.specialties || [];

  // Extract all specialties across all programs for dropdowns and course routing
  const allSpecialties = useMemo(() => {
    return programs.flatMap(p => 
      p.specialties.map(s => ({ ...s, programId: p.id, programTitle: p.title }))
    );
  }, [programs]);

  // Selected State for the strict hierarchy:
  // الاختصاص → الفرع → السنة الدراسية → الفصل الدراسي → المواد
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>(() => {
    return programSpecialties[0]?.id || allSpecialties[0]?.id || 'business-admin';
  });

  // Lookup active specialty within selected program or fallback
  const activeSpecialty = useMemo(() => {
    if (programSpecialties.length > 0) {
      const match = programSpecialties.find(s => s.id === selectedSpecialtyId);
      return match || programSpecialties[0];
    }
    return undefined;
  }, [programSpecialties, selectedSpecialtyId]);

  // Available branches for current specialty
  const currentBranches: Branch[] = useMemo(() => {
    if (activeSpecialty?.branches && activeSpecialty.branches.length > 0) {
      return activeSpecialty.branches;
    }
    return [{ id: 'br-gen', name: 'الفرع العام', code: 'GEN', description: 'الفرع الأكاديمي الأساسي' }];
  }, [activeSpecialty]);

  // Active Branch
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const effectiveBranchId = selectedBranchId && currentBranches.some(b => b.id === selectedBranchId)
    ? selectedBranchId
    : currentBranches[0]?.id || 'br-gen';

  const activeBranch = currentBranches.find(b => b.id === effectiveBranchId) || currentBranches[0];

  // Active Academic Year: 1 (السنة الأولى) or 2 (السنة الثانية)
  const [selectedYear, setSelectedYear] = useState<1 | 2>(1);

  // Drill-down for managing lectures inside a course
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);

  const activeCourse = activeSpecialty?.courses.find(c => c.id === selectedCourseId);
  const activeSemester = activeCourse?.semesters.find(s => s.id === selectedSemesterId);
  const activeLecture = activeSemester?.lectures.find(l => l.id === selectedLectureId);

  // Auto-navigate to initialCourseId if opened via deep link
  React.useEffect(() => {
    if (!initialCourseId) return;
    for (const prog of programs) {
      for (const spec of prog.specialties) {
        const found = spec.courses.find(c => c.id === initialCourseId);
        if (found) {
          setSelectedProgramId(prog.id);
          setSelectedSpecialtyId(spec.id);
          if (found.branchId) setSelectedBranchId(found.branchId);
          if (found.academicYear) setSelectedYear(found.academicYear);
          setSelectedCourseId(found.id);
          break;
        }
      }
    }
  }, [initialCourseId, programs]);

  // Modal / Form states
  const [modalType, setModalType] = useState<
    'add-program' | 'edit-program' |
    'add-specialty' | 'edit-specialty' | 
    'delete-confirm-program' | 'delete-confirm-specialty' |
    'add-branch' |
    'add-course' | 'edit-course' | 
    'add-semester' | 
    'add-lecture' | 'edit-lecture' | 
    'add-file' | null
  >(null);

  // Program Form
  const [progForm, setProgForm] = useState({
    title: '',
    tagline: '',
    description: '',
    iconName: 'GraduationCap'
  });
  const [editingProgId, setEditingProgId] = useState<string | null>(null);

  // Specialty Form
  const [specForm, setSpecForm] = useState({ 
    name: '', 
    code: '', 
    overview: '', 
    duration: 'سنتان (2)', 
    coursesCount: '24 مادة', 
    semestersCount: '4 فصول', 
    importance: '', 
    whatYouStudyText: '' 
  });
  const [editingSpecId, setEditingSpecId] = useState<string | null>(null);

  // Delete Target Confirmation
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    type: 'program' | 'specialty' | 'course' | 'semester' | 'lecture' | 'file';
    id: string;
    title: string;
    extra?: {
      programId?: string;
      specialtyId?: string;
      courseId?: string;
      semesterId?: string;
      lectureId?: string;
    };
  } | null>(null);

  const [branchForm, setBranchForm] = useState({
    name: '',
    code: '',
    description: ''
  });

  const [courseForm, setCourseForm] = useState({ 
    title: '', 
    code: '', 
    description: '', 
    price: 45000, 
    creditHours: 3,
    programId: '',
    specialtyId: '',
    branchId: '',
    academicYear: 1 as 1 | 2,
    semesterTerm: 1 as 1 | 2
  });

  const [semesterName, setSemesterName] = useState('');
  const [lectureForm, setLectureForm] = useState({ 
    number: 1, 
    title: '', 
    description: '', 
    duration: '45 دقيقة', 
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 
    allowOffline: true 
  });
  const [fileForm, setFileForm] = useState({ 
    name: '', 
    type: 'pdf' as 'pdf' | 'summary' | 'exercise', 
    fileSize: '2.5 MB', 
    fileUrl: '#' 
  });

  // Courses for active specialty
  const specialtyCourses = useMemo(() => {
    if (!activeSpecialty) return [];
    return activeSpecialty.courses;
  }, [activeSpecialty]);

  // Year 1 Courses (Semester 1 & Semester 2)
  const sem1Courses = useMemo(() => {
    return specialtyCourses.filter(c => {
      const yr = c.academicYear || 1;
      const term = c.semesterTerm || 1;
      return yr === selectedYear && term === 1;
    });
  }, [specialtyCourses, selectedYear]);

  const sem2Courses = useMemo(() => {
    return specialtyCourses.filter(c => {
      const yr = c.academicYear || 1;
      const term = c.semesterTerm || 1;
      return yr === selectedYear && term === 2;
    });
  }, [specialtyCourses, selectedYear]);

  // Stats for the Year toggle buttons
  const year1Count = useMemo(() => {
    return specialtyCourses.filter(c => (c.academicYear || 1) === 1).length;
  }, [specialtyCourses]);

  const year2Count = useMemo(() => {
    return specialtyCourses.filter(c => (c.academicYear || 1) === 2).length;
  }, [specialtyCourses]);

  // Handle open Add Course Modal with prefilled year & semester
  const handleOpenAddCourse = (term?: 1 | 2) => {
    // If active program has no specialties, prompt to add one first
    if (!activeSpecialty && programSpecialties.length === 0) {
      addToast('error', `يرجى إضافة أول اختصاص في قسم "${activeProgram?.title}" أولاً قبل إضافة المواد.`);
      setEditingSpecId(null);
      setSpecForm({
        name: '',
        code: '',
        duration: 'سنتان (2)',
        coursesCount: '24 مادة',
        semestersCount: '4 فصول',
        overview: '',
        importance: '',
        whatYouStudyText: ''
      });
      setModalType('add-specialty');
      return;
    }

    const currentProgramId = activeProgram?.id || 'diploma-medium';
    const targetSpec = activeSpecialty || programSpecialties[0] || allSpecialties[0];
    const targetSpecId = targetSpec?.id || '';

    setCourseForm({
      title: '',
      code: '',
      description: '',
      price: 45000,
      creditHours: 3,
      programId: currentProgramId,
      specialtyId: targetSpecId,
      branchId: '',
      academicYear: selectedYear,
      semesterTerm: term || 1
    });
    setModalType('add-course');
  };

  // Handle open Edit Course Modal
  const handleOpenEditCourse = (course: Course) => {
    const parentProgram = programs.find(p => p.specialties.some(s => s.courses.some(c => c.id === course.id)));
    const parentSpecialty = parentProgram?.specialties.find(s => s.courses.some(c => c.id === course.id));

    setCourseForm({
      title: course.title,
      code: course.code,
      description: course.description,
      price: course.price,
      creditHours: course.creditHours || 3,
      programId: parentProgram?.id || activeProgram?.id || '',
      specialtyId: course.specialtyId || parentSpecialty?.id || activeSpecialty?.id || '',
      branchId: course.branchId || '',
      academicYear: course.academicYear || selectedYear,
      semesterTerm: course.semesterTerm || 1
    });
    setSelectedCourseId(course.id);
    setModalType('edit-course');
  };

  // Save course (Add or Edit)
  const handleSaveCourse = () => {
    if (!courseForm.title.trim()) {
      addToast('error', 'يرجى إدخال اسم المقرر / المادة.');
      return;
    }

    const targetSpecId = courseForm.specialtyId || activeSpecialty?.id;
    if (!targetSpecId) {
      addToast('error', 'يرجى تحديد الاختصاص التابع له المقرر.');
      return;
    }

    // Find the true program owning targetSpecId
    const targetProgram = programs.find(p => p.specialties.some(s => s.id === targetSpecId))
      || programs.find(p => p.id === courseForm.programId)
      || activeProgram;

    if (!targetProgram) {
      addToast('error', 'تعذر تحديد البرنامج الأكاديمي التابع له الاختصاص.');
      return;
    }

    if (modalType === 'add-course') {
      addCourse(targetProgram.id, targetSpecId, {
        title: courseForm.title.trim(),
        code: courseForm.code.trim() || 'CRS-101',
        description: courseForm.description.trim(),
        price: courseForm.price || 45000,
        creditHours: courseForm.creditHours || 3,
        specialtyId: targetSpecId,
        branchId: courseForm.branchId || effectiveBranchId,
        academicYear: courseForm.academicYear,
        semesterTerm: courseForm.semesterTerm
      });

      // Keep user on the exact program and specialty so the new course is visible immediately
      setSelectedProgramId(targetProgram.id);
      setSelectedSpecialtyId(targetSpecId);
      if (courseForm.academicYear) setSelectedYear(courseForm.academicYear);
    } else if (selectedCourseId) {
      const currentProgram = programs.find(p => p.specialties.some(s => s.courses.some(c => c.id === selectedCourseId)));
      const currentSpec = currentProgram?.specialties.find(s => s.courses.some(c => c.id === selectedCourseId));

      updateCourse(
        currentProgram?.id || targetProgram.id,
        currentSpec?.id || targetSpecId,
        selectedCourseId,
        {
          title: courseForm.title.trim(),
          code: courseForm.code.trim(),
          description: courseForm.description.trim(),
          price: courseForm.price,
          creditHours: courseForm.creditHours,
          specialtyId: targetSpecId,
          branchId: courseForm.branchId,
          academicYear: courseForm.academicYear,
          semesterTerm: courseForm.semesterTerm
        }
      );

      setSelectedProgramId(targetProgram.id);
      setSelectedSpecialtyId(targetSpecId);
    }

    setModalType(null);
  };

  // Save Program
  const handleSaveProgram = () => {
    if (!progForm.title.trim()) {
      addToast('error', 'يرجى إدخال عنوان القسم الرئيسي.');
      return;
    }

    if (modalType === 'add-program') {
      addProgram({
        title: progForm.title.trim(),
        tagline: progForm.tagline.trim(),
        description: progForm.description.trim() || 'قسم أكاديمي معتمد في مركز المستقبل',
        iconName: progForm.iconName || 'GraduationCap',
        specialties: []
      });
      addToast('success', 'تمت إضافة القسم الرئيسي بنجاح.');
    } else if (editingProgId) {
      updateProgram(editingProgId, {
        title: progForm.title.trim(),
        tagline: progForm.tagline.trim(),
        description: progForm.description.trim(),
        iconName: progForm.iconName
      });
      addToast('success', 'تم تعديل بيانات القسم الرئيسي.');
    }

    setModalType(null);
  };

  // Save Specialty
  const handleSaveSpecialty = () => {
    if (!specForm.name.trim()) {
      addToast('error', 'يرجى إدخال اسم الاختصاص.');
      return;
    }
    if (!activeProgram) return;

    if (modalType === 'add-specialty') {
      const newSpecId = addSpecialty(activeProgram.id, {
        name: specForm.name.trim(),
        code: specForm.code.trim() || 'SPEC',
        overview: specForm.overview.trim() || `اختصاص معتمد ضمن برنامج ${activeProgram.title}`,
        duration: specForm.duration || 'سنتان (2)',
        coursesCount: specForm.coursesCount || '24 مادة',
        semestersCount: specForm.semestersCount || '4 فصول',
        importance: specForm.importance || 'يؤهل لسوق العمل التنافسي',
        whatYouStudyText: specForm.whatYouStudyText || 'دراسة مساقات تطبيقية وأكاديمية متكاملة',
        branches: [
          { id: 'br-gen', name: 'الفرع العام', code: 'GEN', description: 'الفرع الأكاديمي الأساسي' }
        ],
        courses: []
      });
      setSelectedSpecialtyId(newSpecId);
      addToast('success', 'تمت إضافة الاختصاص بنجاح.');
    } else if (editingSpecId) {
      updateSpecialty(activeProgram.id, editingSpecId, {
        name: specForm.name.trim(),
        code: specForm.code.trim(),
        overview: specForm.overview.trim(),
        duration: specForm.duration,
        coursesCount: specForm.coursesCount,
        semestersCount: specForm.semestersCount,
        importance: specForm.importance,
        whatYouStudyText: specForm.whatYouStudyText
      });
      setSelectedSpecialtyId(editingSpecId);
      addToast('success', 'تم تعديل بيانات الاختصاص.');
    }

    setModalType(null);
  };

  // Confirm Delete Handler
  const handleConfirmDelete = () => {
    if (!deleteConfirmTarget) return;

    if (deleteConfirmTarget.type === 'program') {
      deleteProgram(deleteConfirmTarget.id);
      addToast('info', `تم حذف القسم: ${deleteConfirmTarget.title}`);
      if (selectedProgramId === deleteConfirmTarget.id) {
        const remaining = programs.filter(p => p.id !== deleteConfirmTarget.id);
        if (remaining[0]) setSelectedProgramId(remaining[0].id);
      }
    } else if (deleteConfirmTarget.type === 'specialty') {
      const pId = deleteConfirmTarget.extra?.programId || activeProgram?.id || '';
      deleteSpecialty(pId, deleteConfirmTarget.id);
      addToast('info', `تم حذف الاختصاص: ${deleteConfirmTarget.title}`);
    } else if (deleteConfirmTarget.type === 'course') {
      const pId = deleteConfirmTarget.extra?.programId || activeProgram?.id || '';
      const sId = deleteConfirmTarget.extra?.specialtyId || activeSpecialty?.id || '';
      deleteCourse(pId, sId, deleteConfirmTarget.id);
      addToast('info', `تم حذف المقرر: ${deleteConfirmTarget.title}`);
      if (selectedCourseId === deleteConfirmTarget.id) {
        setSelectedCourseId(null);
        setSelectedSemesterId(null);
        setSelectedLectureId(null);
      }
    } else if (deleteConfirmTarget.type === 'semester') {
      const pId = deleteConfirmTarget.extra?.programId || activeProgram?.id || '';
      const sId = deleteConfirmTarget.extra?.specialtyId || activeSpecialty?.id || '';
      const cId = deleteConfirmTarget.extra?.courseId || activeCourse?.id || '';
      deleteSemester(pId, sId, cId, deleteConfirmTarget.id);
      addToast('info', `تم حذف الفصل: ${deleteConfirmTarget.title}`);
      if (selectedSemesterId === deleteConfirmTarget.id) {
        setSelectedSemesterId(null);
        setSelectedLectureId(null);
      }
    } else if (deleteConfirmTarget.type === 'lecture') {
      const pId = deleteConfirmTarget.extra?.programId || activeProgram?.id || '';
      const sId = deleteConfirmTarget.extra?.specialtyId || activeSpecialty?.id || '';
      const cId = deleteConfirmTarget.extra?.courseId || activeCourse?.id || '';
      const semId = deleteConfirmTarget.extra?.semesterId || '';
      deleteLecture(pId, sId, cId, semId, deleteConfirmTarget.id);
      addToast('info', `تم حذف المحاضرة: ${deleteConfirmTarget.title}`);
      if (selectedLectureId === deleteConfirmTarget.id) {
        setSelectedLectureId(null);
      }
    } else if (deleteConfirmTarget.type === 'file') {
      const pId = deleteConfirmTarget.extra?.programId || activeProgram?.id || '';
      const sId = deleteConfirmTarget.extra?.specialtyId || activeSpecialty?.id || '';
      const cId = deleteConfirmTarget.extra?.courseId || activeCourse?.id || '';
      const semId = deleteConfirmTarget.extra?.semesterId || '';
      const lecId = deleteConfirmTarget.extra?.lectureId || '';
      deleteLectureFile(pId, sId, cId, semId, lecId, deleteConfirmTarget.id);
      addToast('info', `تم حذف الملف: ${deleteConfirmTarget.title}`);
    }

    setDeleteConfirmTarget(null);
    setModalType(null);
  };

  // Save Branch
  const handleSaveBranch = () => {
    if (!branchForm.name.trim()) {
      addToast('error', 'يرجى إدخال اسم الفرع.');
      return;
    }
    if (!activeProgram || !activeSpecialty) return;

    addBranch(activeProgram.id, activeSpecialty.id, {
      name: branchForm.name.trim(),
      code: branchForm.code.trim() || 'BR',
      description: branchForm.description.trim() || 'فرع تخصصي معتمد'
    });

    setBranchForm({ name: '', code: '', description: '' });
    setModalType(null);
  };

  // Selected branches list for modal
  const branchesForSelectedFormSpec = useMemo(() => {
    const spec = allSpecialties.find(s => s.id === courseForm.specialtyId);
    if (spec?.branches && spec.branches.length > 0) return spec.branches;
    return [{ id: 'br-gen', name: 'الفرع العام', code: 'GEN' }];
  }, [allSpecialties, courseForm.specialtyId]);

  // If smart wizard mode is on
  if (showSmartWizard) {
    return (
      <div className="space-y-4 text-right" dir="rtl">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-700">
              أنت الآن في وضع إدارة الاختصاصات بالخطوات الذكية للمالك (هوية الاختصاص، الأفرع، المواد)
            </span>
          </div>
          <button
            onClick={() => setShowSmartWizard(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0c3250] hover:bg-[#183b63] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لإدارة المناهج الهرمية والمحاضرات</span>
          </button>
        </div>
        <SmartCurriculumWizard />
      </div>
    );
  }

  // If live programs page preview mode is on
  if (showLiveProgramsPage) {
    return (
      <div className="space-y-4 text-right" dir="rtl">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-700">
              أنت الآن في وضع المعاينة والإدارة التفاعلي لصفحة البرامج التعليمية المعتمدة
            </span>
          </div>
          <button
            onClick={() => setShowLiveProgramsPage(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0c3250] hover:bg-[#183b63] text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة لإدارة المواد والمقررات</span>
          </button>
        </div>
        <ProgramsPage onBack={() => setShowLiveProgramsPage(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold shadow-xs">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#2563eb]">إدارة المناهج والمقررات</span>
                <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full">
                  التسلسل الأكاديمي المعتمد
                </span>
              </div>
              <h3 className="text-xl font-extrabold text-[#0c3250]">تنظيم وهيكلية المواد الدراسية</h3>
              <p className="text-xs text-[#595e65] mt-0.5">
                الاختصاص ← السنة الدراسية ← الفصل الدراسي ← المواد
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowClearConfirmModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-rose-200 shadow-2xs"
              title="مسح وتصفير كافة الاختصاصات والمقررات القديمة نهائياً للبدء بصفحة بيضاء"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>تصفير المقررات القديمة</span>
            </button>

            <button
              onClick={() => setShowSmartWizard(true)}
              className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-blue-200 shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>إدارة الاختصاصات (الخطوات الذكية)</span>
            </button>

            <button
              onClick={() => setShowLiveProgramsPage(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-slate-200"
            >
              <Eye className="w-4 h-4 text-blue-600" />
              <span>معاينة صفحة البرامج التعليمية</span>
            </button>

            <button
              onClick={() => handleOpenAddCourse()}
              className="px-4 py-2.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مقرر جديد</span>
            </button>
          </div>
        </div>

        {/* Dynamic Breadcrumbs */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500">
          <span className="text-[#0c3250] flex items-center gap-1 font-black">
            <Layers className="w-3.5 h-3.5 text-[#2563eb]" />
            <span>{activeProgram?.title || 'القسم الرئيسي'}</span>
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400 rotate-180" />
          <span className="text-[#2563eb] flex items-center gap-1">
            <Folder className="w-3.5 h-3.5" />
            <span>{activeSpecialty?.name || 'الاختصاص'}</span>
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400 rotate-180" />
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
            {selectedYear === 1 ? 'السنة الأولى' : 'السنة الثانية'}
          </span>
          {selectedCourseId && activeCourse && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400 rotate-180" />
              <span className="text-[#0c3250] bg-slate-100 px-2 py-0.5 rounded-md">
                مقرر: {activeCourse.title}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 2. DRILL DOWN VIEW: MANAGING LECTURES INSIDE SELECTED COURSE */}
      {selectedCourseId && activeCourse ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Back button to courses grid */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => {
                setSelectedCourseId(null);
                setSelectedSemesterId(null);
                setSelectedLectureId(null);
                onClearInitialCourse?.();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-[#2563eb] text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة لتسلسل المواد الدراسية</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyCourseShareLink(activeCourse.id, activeCourse.title, (msg) => addToast('success', msg))}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold cursor-pointer transition-all shadow-2xs"
                title="نسخ الرابط المباشر للمقرر لمشاركته مع الطلاب"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ رابط المقرر المباشر</span>
              </button>

              <button
                onClick={() => handleOpenEditCourse(activeCourse)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:text-[#2563eb] text-xs font-bold cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل بيانات المقرر</span>
              </button>

              <button
                onClick={() => {
                  setDeleteConfirmTarget({
                    type: 'course',
                    id: activeCourse.id,
                    title: activeCourse.title,
                    extra: {
                      programId: activeProgram?.id,
                      specialtyId: activeSpecialty?.id
                    }
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold cursor-pointer transition-colors"
                title="حذف هذا المقرر الدراسي نهائياً"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف المقرر</span>
              </button>
            </div>
          </div>

          {/* Course Banner */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-[#2563eb] font-bold">
                <span>{activeSpecialty?.name}</span>
                <span>•</span>
                <span>{activeBranch?.name}</span>
                <span>•</span>
                <span>{activeCourse.academicYear === 2 ? 'السنة الثانية' : 'السنة الأولى'}</span>
                <span>•</span>
                <span>{activeCourse.semesterTerm === 2 ? 'الفصل الثاني' : 'الفصل الأول'}</span>
              </div>
              <h3 className="text-2xl font-black text-[#0c3250]">{activeCourse.title}</h3>
              <p className="text-xs text-[#595e65] max-w-2xl leading-relaxed">{activeCourse.description}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-100 text-center">
                <span className="text-[11px] text-slate-500 font-bold block">رسوم المقرر</span>
                <strong className="text-sm font-extrabold text-[#2563eb]">{activeCourse.price.toLocaleString()} ل.س</strong>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <span className="text-[11px] text-slate-500 font-bold block">الساعات المعتمدة</span>
                <strong className="text-sm font-extrabold text-slate-700">{activeCourse.creditHours || 3} ساعات</strong>
              </div>
            </div>
          </div>

          {/* Semesters & Lectures Inside Course */}
          <div className="space-y-5">
            {activeCourse.semesters.map((semester) => (
              <div key={semester.id} className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-2xs">
                
                {/* Semester Header */}
                <div className="p-4 sm:p-5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0284c7]"></span>
                    <h4 className="font-extrabold text-sm text-[#0c3250]">{semester.name}</h4>
                    <span className="text-xs text-slate-400 font-semibold">
                      ({semester.lectures.length} محاضرة)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedSemesterId(semester.id);
                        setLectureForm({
                          number: semester.lectures.length + 1,
                          title: `المحاضرة ${semester.lectures.length + 1} — `,
                          description: '',
                          duration: '45 دقيقة',
                          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                          allowOffline: true
                        });
                        setModalType('add-lecture');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة محاضرة</span>
                    </button>

                    <button
                      onClick={() => {
                        setDeleteConfirmTarget({
                          type: 'semester',
                          id: semester.id,
                          title: semester.name,
                          extra: {
                            programId: activeProgram?.id,
                            specialtyId: activeSpecialty?.id,
                            courseId: activeCourse?.id
                          }
                        });
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer transition-colors"
                      title="حذف الفصل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Lectures List */}
                <div className="p-4 sm:p-5 divide-y divide-slate-100">
                  {semester.lectures.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-6">
                      لا توجد محاضرات مضافة في هذا الفصل بعد. اضغط «إضافة محاضرة» لرفع المحتوى.
                    </p>
                  ) : (
                    semester.lectures.map((lecture) => (
                      <div
                        key={lecture.id}
                        className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2.5 rounded-2xl transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#32a1e6] flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                            {lecture.number}
                          </div>

                          <div>
                            <h5 className="text-sm font-extrabold text-[#0c3250]">
                              {lecture.title}
                            </h5>
                            <p className="text-xs text-[#595e65] mt-0.5 line-clamp-1">
                              {lecture.description || 'لا يوجد وصف مختصر للمحاضرة'}
                            </p>
                            
                            <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                              <span>المدة: {lecture.duration}</span>
                              <span>•</span>
                              <span>{lecture.files.length} ملفات PDF</span>
                              <span>•</span>
                              <span className={lecture.allowOffline ? 'text-[#2563eb] font-semibold' : 'text-slate-400'}>
                                {lecture.allowOffline ? '☑ يدعم أوفلاين' : '☐ بدون أوفلاين'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => {
                              setSelectedSemesterId(semester.id);
                              setSelectedLectureId(lecture.id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-[#2563eb] text-[#0c3250] hover:text-[#2563eb] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#0284c7]" />
                            <span>فتح المحتوى وتعديل الملفات</span>
                          </button>

                          <button
                            onClick={() => {
                              setDeleteConfirmTarget({
                                type: 'lecture',
                                id: lecture.id,
                                title: lecture.title,
                                extra: {
                                  programId: activeProgram?.id,
                                  specialtyId: activeSpecialty?.id,
                                  courseId: activeCourse?.id,
                                  semesterId: semester.id
                                }
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer transition-colors"
                            title="حذف المحاضرة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Detail of active lecture if opened */}
          {activeLecture && activeSemester && (
            <div className="bg-white rounded-3xl border border-blue-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-xs text-[#2563eb] font-bold">تفاصيل المحاضرة والملفات</span>
                  <h4 className="text-lg font-black text-[#0c3250]">{activeLecture.title}</h4>
                </div>
                <button
                  onClick={() => setSelectedLectureId(null)}
                  className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  إغلاق نافذة المحاضرة
                </button>
              </div>

              {/* Lecture Video preview */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-[#2563eb]" />
                    <span>فيديو المحاضرة:</span>
                  </span>
                  <button
                    onClick={() => {
                      if (activeProgram && activeSpecialty) {
                        toggleLectureOffline(activeProgram.id, activeSpecialty.id, activeCourse.id, activeSemester.id, activeLecture.id);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      activeLecture.allowOffline 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {activeLecture.allowOffline ? 'الأوفلاين مفعل للمحاضرة' : 'الأوفلاين معطل'}
                  </button>
                </div>
                <div className="font-mono text-[11px] text-slate-500 truncate bg-white p-2.5 rounded-xl border border-slate-200">
                  {activeLecture.videoUrl}
                </div>
              </div>

              {/* PDF Files attached to this lecture */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#0284c7]" />
                    <span>الملفات والمذكرات المرفقة ({activeLecture.files.length}):</span>
                  </h5>
                  <button
                    onClick={() => {
                      setFileForm({ name: '', type: 'pdf', fileSize: '2.5 MB', fileUrl: '#' });
                      setModalType('add-file');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-50 text-[#2563eb] hover:bg-blue-100 text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إرفاق ملف PDF</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {activeLecture.files.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded-xl">
                      لا توجد ملفات PDF مرفقة بهذه المحاضرة.
                    </p>
                  ) : (
                    activeLecture.files.map(file => (
                      <div key={file.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-red-500" />
                          <span className="text-xs font-bold text-slate-800">{file.name}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                            {file.fileSize}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setDeleteConfirmTarget({
                              type: 'file',
                              id: file.id,
                              title: file.name,
                              extra: {
                                programId: activeProgram?.id,
                                specialtyId: activeSpecialty?.id,
                                courseId: activeCourse?.id,
                                semesterId: activeSemester?.id,
                                lectureId: activeLecture.id
                              }
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer transition-colors"
                          title="حذف الملف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      ) : (

        /* 3. MAIN STRICT HIERARCHY VIEW:
           القسم الرئيسي → الاختصاص → الفرع → السنة الدراسية → الفصل الدراسي → المواد */
        <div className="space-y-6">

          {/* STEP 0: القسم الرئيسي / البرنامج التعليمي */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-extrabold text-[#0c3250] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#2563eb]" />
                  <span>الأقسام الرئيسية والبرامج التعليمية</span>
                </span>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">
                  حدد القسم الأكاديمي لعرض وتعديل اختصاصاته ومواده
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingProgId(null);
                  setProgForm({ title: '', tagline: '', description: '', iconName: 'GraduationCap' });
                  setModalType('add-program');
                }}
                className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-blue-50 text-[#2563eb] hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة قسم رئيسي جديد</span>
              </button>
            </div>

            {/* Programs Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {programs.map((prog, idx) => {
                const isSelected = prog.id === selectedProgramId;
                return (
                  <div
                    key={prog.id}
                    onClick={() => {
                      setSelectedProgramId(prog.id);
                      if (prog.specialties.length > 0) {
                        setSelectedSpecialtyId(prog.specialties[0].id);
                      } else {
                        setSelectedSpecialtyId('');
                      }
                      setSelectedBranchId('');
                      setSelectedCourseId(null);
                      setSelectedSemesterId(null);
                      setSelectedLectureId(null);
                    }}
                    className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#0c3250] text-white border-[#0c3250] shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold block opacity-70 mb-0.5">
                          القسم {idx + 1}
                        </span>
                        <h4 className="text-xs font-black leading-snug">
                          {prog.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          title="تعديل بيانات القسم"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProgId(prog.id);
                            setProgForm({
                              title: prog.title,
                              tagline: prog.tagline || '',
                              description: prog.description,
                              iconName: prog.iconName || 'GraduationCap'
                            });
                            setModalType('edit-program');
                          }}
                          className={`p-1 rounded-md transition-colors ${
                            isSelected ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-[#2563eb]'
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="حذف القسم"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmTarget({
                              type: 'program',
                              id: prog.id,
                              title: prog.title
                            });
                            setModalType('delete-confirm-program');
                          }}
                          className={`p-1 rounded-md transition-colors ${
                            isSelected ? 'text-white/70 hover:text-rose-300 hover:bg-white/10' : 'text-slate-400 hover:text-rose-600'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-white/10">
                      <span className={isSelected ? 'text-blue-200' : 'text-slate-500'}>
                        {prog.specialties.length > 0 
                          ? `${prog.specialties.length} اختصاصات` 
                          : 'قابل للإضافة والإدارة'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {isSelected ? 'القسم النشط' : 'اختيار'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 1: الاختصاص الأكاديمي (Specialty Selector) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-[#2563eb] flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                <span>الخطوة 1: الاختصاص الأكاديمي التابع لقسم ({activeProgram?.title || 'المحدد'})</span>
              </span>
              <button
                onClick={() => {
                  setEditingSpecId(null);
                  setSpecForm({
                    name: '',
                    code: '',
                    duration: 'سنتان (2)',
                    coursesCount: '24 مادة',
                    semestersCount: '4 فصول',
                    overview: '',
                    importance: '',
                    whatYouStudyText: ''
                  });
                  setModalType('add-specialty');
                }}
                className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-blue-50 text-[#2563eb] hover:bg-blue-100 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ إضافة اختصاص لهذا القسم</span>
              </button>
            </div>

            {/* Specialties switcher or placeholder */}
            {programSpecialties.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {programSpecialties.map((spec) => {
                  const isSelected = spec.id === activeSpecialty?.id;
                  return (
                    <div
                      key={spec.id}
                      onClick={() => {
                        setSelectedSpecialtyId(spec.id);
                        setSelectedBranchId('');
                      }}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <span>{spec.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {spec.code}
                      </span>
                      <div className="flex items-center gap-1 mr-1 border-r border-slate-300/40 pr-1.5">
                        <button
                          title="تعديل الاختصاص"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSpecId(spec.id);
                            setSpecForm({
                              name: spec.name,
                              code: spec.code,
                              duration: spec.duration || 'سنتان',
                              coursesCount: spec.coursesCount || '24 مادة',
                              semestersCount: spec.semestersCount || '4 فصول',
                              overview: spec.overview || '',
                              importance: spec.importance || '',
                              whatYouStudyText: spec.whatYouStudyText || ''
                            });
                            setModalType('edit-specialty');
                          }}
                          className={`p-0.5 rounded hover:opacity-80 cursor-pointer ${isSelected ? 'text-white' : 'text-slate-500 hover:text-blue-600'}`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          title="حذف الاختصاص"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmTarget({
                              type: 'specialty',
                              id: spec.id,
                              title: spec.name
                            });
                            setModalType('delete-confirm-specialty');
                          }}
                          className={`p-0.5 rounded hover:opacity-80 cursor-pointer ${isSelected ? 'text-rose-200 hover:text-white' : 'text-rose-500 hover:text-rose-700'}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Display for section with no specialties e.g. الماجستير or التأهيل المهني */
              <div className="bg-slate-50 rounded-2xl p-4 border border-dashed border-slate-300 text-right space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-[#0c3250]">
                  <span className="w-2 h-2 rounded-full bg-[#0284c7]"></span>
                  <span>قابل للإضافة والإدارة.</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  هذا القسم الأكاديمي جاهز لإضافة الاختصاصات والمقررات وتعيين الفروع والسنين الدراسية بكل سهولة دون تعديل الكود.
                </p>
                <button
                  onClick={() => {
                    setEditingSpecId(null);
                    setSpecForm({
                      name: '',
                      code: '',
                      duration: 'سنتان (2)',
                      coursesCount: '24 مادة',
                      semestersCount: '4 فصول',
                      overview: '',
                      importance: '',
                      whatYouStudyText: ''
                    });
                    setModalType('add-specialty');
                  }}
                  className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#2563eb] text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ إضافة أول اختصاص في {activeProgram?.title}</span>
                </button>
              </div>
            )}
          </div>

          {/* STEP 2: السنة الدراسية (Academic Year: Year 1 vs Year 2) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#2563eb]" />
                <span>الخطوة 2: اختر السنة الدراسية</span>
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                عرض فصول ومواد السنة المختارة
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <button
                onClick={() => setSelectedYear(1)}
                className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                  selectedYear === 1
                    ? 'bg-blue-50/80 border-[#2563eb] text-[#0c3250] shadow-2xs ring-1 ring-[#2563eb]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${selectedYear === 1 ? 'bg-[#2563eb]' : 'bg-slate-300'}`} />
                    <h4 className="text-base font-black">السنة الدراسية الأولى</h4>
                  </div>
                  <p className="text-xs text-[#595e65] mt-1">تتضمن مقررات الفصل الأول والفصل الثاني للسنة الأولى</p>
                </div>
                <span className="px-3 py-1 bg-white rounded-xl text-xs font-bold text-[#2563eb] border border-slate-200">
                  {year1Count} مقرر
                </span>
              </button>

              <button
                onClick={() => setSelectedYear(2)}
                className={`p-4 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between ${
                  selectedYear === 2
                    ? 'bg-blue-50/80 border-[#2563eb] text-[#0c3250] shadow-2xs ring-1 ring-[#2563eb]'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/80'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${selectedYear === 2 ? 'bg-[#2563eb]' : 'bg-slate-300'}`} />
                    <h4 className="text-base font-black">السنة الدراسية الثانية</h4>
                  </div>
                  <p className="text-xs text-[#595e65] mt-1">تتضمن مقررات الفصل الأول والفصل الثاني للسنة الثانية</p>
                </div>
                <span className="px-3 py-1 bg-white rounded-xl text-xs font-bold text-[#2563eb] border border-slate-200">
                  {year2Count} مقرر
                </span>
              </button>
            </div>
          </div>

          {/* STEP 3: الفصول والمواد (Semester 1 -> its courses & Semester 2 -> its courses) */}
          <div className="space-y-6">

            {/* --- SEMESTER 1 OF SELECTED YEAR --- */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
              
              <div className="p-5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100/80 text-[#2563eb] flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-[#0c3250]">
                        الفصل الدراسي الأول — {selectedYear === 1 ? 'السنة الأولى' : 'السنة الثانية'}
                      </h4>
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                        {sem1Courses.length} مادة
                      </span>
                    </div>
                    <p className="text-xs text-[#595e65] mt-0.5">
                      مقررات الفصل الأول المعتمدة لاختصاص: ({activeSpecialty?.name})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenAddCourse(1)}
                  className="px-3.5 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة مادة للفصل الأول</span>
                </button>
              </div>

              <div className="p-5">
                {sem1Courses.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">
                      لا توجد مواد مضافة في الفصل الأول لـ ({selectedYear === 1 ? 'السنة الأولى' : 'السنة الثانية'}) في هذا الاختصاص بعد.
                    </p>
                    <button
                      onClick={() => handleOpenAddCourse(1)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2563eb] hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة أول مقرر دراسي للفصل الأول</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sem1Courses.map((course) => (
                      <div
                        key={course.id}
                        className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-[#2563eb] hover:shadow-xs transition-all flex flex-col justify-between space-y-3 group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-mono font-bold">
                              {course.code}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => copyCourseShareLink(course.id, course.title, (msg) => addToast('success', msg))}
                                className="p-1.5 text-slate-400 hover:text-[#2563eb] hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                                title="نسخ الرابط المباشر للمقرر لمشاركته"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEditCourse(course)}
                                className="p-1.5 text-slate-400 hover:text-[#2563eb] hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                                title="تعديل المقرر وتغيير الاختصاص أو الفرع أو السنة"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirmTarget({
                                    type: 'course',
                                    id: course.id,
                                    title: course.title,
                                    extra: {
                                      programId: activeProgram?.id,
                                      specialtyId: activeSpecialty?.id
                                    }
                                  });
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                                title="حذف المقرر"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <h5 className="text-sm font-extrabold text-[#0c3250] group-hover:text-[#2563eb] transition-colors">
                            {course.title}
                          </h5>
                          <p className="text-xs text-[#595e65] mt-1 line-clamp-2 leading-relaxed">
                            {course.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 space-y-2.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-extrabold text-[#2563eb]">{course.price.toLocaleString()} ل.س</span>
                            <span className="text-slate-500 font-semibold">
                              {course.semesters.reduce((acc, s) => acc + s.lectures.length, 0)} محاضرة
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedCourseId(course.id);
                              if (course.semesters.length > 0) {
                                setSelectedSemesterId(course.semesters[0].id);
                              }
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-[#2563eb] text-[#0c3250] hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                          >
                            <FolderPlus className="w-3.5 h-3.5" />
                            <span>إدارة المحاضرات والملفات</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* --- SEMESTER 2 OF SELECTED YEAR --- */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
              
              <div className="p-5 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-100/80 text-[#0284c7] flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-extrabold text-[#0c3250]">
                        الفصل الدراسي الثاني — {selectedYear === 1 ? 'السنة الأولى' : 'السنة الثانية'}
                      </h4>
                      <span className="px-2.5 py-0.5 bg-sky-50 text-sky-700 rounded-full text-xs font-bold">
                        {sem2Courses.length} مادة
                      </span>
                    </div>
                    <p className="text-xs text-[#595e65] mt-0.5">
                      مقررات الفصل الثاني المعتمدة لاختصاص: ({activeSpecialty?.name})
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenAddCourse(2)}
                  className="px-3.5 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة مادة للفصل الثاني</span>
                </button>
              </div>

              <div className="p-5">
                {sem2Courses.length === 0 ? (
                  <div className="text-center py-8 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">
                      لا توجد مواد مضافة في الفصل الثاني لـ ({selectedYear === 1 ? 'السنة الأولى' : 'السنة الثانية'}) في هذا الاختصاص بعد.
                    </p>
                    <button
                      onClick={() => handleOpenAddCourse(2)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0284c7] hover:underline cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة أول مقرر دراسي للفصل الثاني</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sem2Courses.map((course) => (
                      <div
                        key={course.id}
                        className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-[#0284c7] hover:shadow-xs transition-all flex flex-col justify-between space-y-3 group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-mono font-bold">
                              {course.code}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => copyCourseShareLink(course.id, course.title, (msg) => addToast('success', msg))}
                                className="p-1.5 text-slate-400 hover:text-[#0284c7] hover:bg-sky-50 rounded-lg cursor-pointer transition-colors"
                                title="نسخ الرابط المباشر للمقرر لمشاركته"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEditCourse(course)}
                                className="p-1.5 text-slate-400 hover:text-[#0284c7] hover:bg-sky-50 rounded-lg cursor-pointer transition-colors"
                                title="تعديل المقرر وتغيير الاختصاص أو الفرع أو السنة"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteConfirmTarget({
                                    type: 'course',
                                    id: course.id,
                                    title: course.title,
                                    extra: {
                                      programId: activeProgram?.id,
                                      specialtyId: activeSpecialty?.id
                                    }
                                  });
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                                title="حذف المقرر"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <h5 className="text-sm font-extrabold text-[#0c3250] group-hover:text-[#0284c7] transition-colors">
                            {course.title}
                          </h5>
                          <p className="text-xs text-[#595e65] mt-1 line-clamp-2 leading-relaxed">
                            {course.description}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 space-y-2.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-extrabold text-[#0284c7]">{course.price.toLocaleString()} ل.س</span>
                            <span className="text-slate-500 font-semibold">
                              {course.semesters.reduce((acc, s) => acc + s.lectures.length, 0)} محاضرة
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedCourseId(course.id);
                              if (course.semesters.length > 0) {
                                setSelectedSemesterId(course.semesters[0].id);
                              }
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-[#0284c7] text-[#0c3250] hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                          >
                            <FolderPlus className="w-3.5 h-3.5" />
                            <span>إدارة المحاضرات والملفات</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Modal: Add Branch */}
      {modalType === 'add-branch' && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <GitBranch className="w-5 h-5 text-[#2563eb]" />
                <h4 className="text-base font-black text-[#0c3250]">إضافة فرع جديد للاختصاص</h4>
              </div>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم الفرع:</label>
                <input
                  type="text"
                  value={branchForm.name}
                  onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                  placeholder="مثال: فرع البرمجيات ونظم المعلومات"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">رمز الفرع:</label>
                <input
                  type="text"
                  value={branchForm.code}
                  onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                  placeholder="مثال: IT-DEV"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">وصف الفرع:</label>
                <textarea
                  value={branchForm.description}
                  onChange={(e) => setBranchForm({ ...branchForm, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
                  placeholder="وصف مختصر لمجال الفرع..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveBranch}
                className="px-5 py-2 rounded-xl bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] cursor-pointer shadow-xs"
              >
                إضافة الفرع
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add or Edit Course with Specialty, Branch, Year, Semester */}
      {(modalType === 'add-course' || modalType === 'edit-course') && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full space-y-4 shadow-2xl border border-slate-200 my-8">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-black text-[#0c3250]">
                    {modalType === 'add-course' ? 'إضافة مقرر دراسي جديد' : 'تعديل بيانات المقرر'}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    تحديد الاختصاص والسنة والفصل المرتبط بالمقرر
                  </p>
                </div>
              </div>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              
              {/* 1. القسم الأكاديمي واختصاصه التابع له المقرر */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    القسم الأكاديمي الرئيسي:
                  </label>
                  <select
                    value={courseForm.programId || activeProgram?.id || 'diploma-medium'}
                    onChange={(e) => {
                      const newProgId = e.target.value;
                      const prog = programs.find(p => p.id === newProgId);
                      const firstSpecId = prog?.specialties[0]?.id || '';
                      setCourseForm({
                        ...courseForm,
                        programId: newProgId,
                        specialtyId: firstSpecId,
                        branchId: ''
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden bg-white text-xs font-bold text-slate-700 shadow-2xs"
                  >
                    {programs.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    الاختصاص الأكاديمي المعتمد:
                  </label>
                  <select
                    value={courseForm.specialtyId}
                    onChange={(e) => {
                      const newSpecId = e.target.value;
                      const parentProg = programs.find(p => p.specialties.some(s => s.id === newSpecId));
                      setCourseForm({
                        ...courseForm,
                        programId: parentProg?.id || courseForm.programId,
                        specialtyId: newSpecId,
                        branchId: ''
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden bg-white text-xs font-bold text-slate-700 shadow-2xs"
                  >
                    {programs.map((p) => (
                      <optgroup key={p.id} label={`── ${p.title} ──`}>
                        {p.specialties.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.code})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. السنة الدراسية والفصل الدراسي */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">
                    السنة الدراسية:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCourseForm({ ...courseForm, academicYear: 1 })}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        courseForm.academicYear === 1
                          ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      السنة الأولى
                    </button>
                    <button
                      type="button"
                      onClick={() => setCourseForm({ ...courseForm, academicYear: 2 })}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        courseForm.academicYear === 2
                          ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      السنة الثانية
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5">
                    4. الفصل الدراسي:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCourseForm({ ...courseForm, semesterTerm: 1 })}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        courseForm.semesterTerm === 1
                          ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      الفصل الأول
                    </button>
                    <button
                      type="button"
                      onClick={() => setCourseForm({ ...courseForm, semesterTerm: 2 })}
                      className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                        courseForm.semesterTerm === 2
                          ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      الفصل الثاني
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. اسم المقرر ورمزه ورسومه */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم المقرر / المادة:</label>
                <input
                  type="text"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  placeholder="مثال: مبادئ الإدارة، المحاسبة، شبكات الحاسب"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">رمز المقرر:</label>
                  <input
                    type="text"
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                    placeholder="MGT-101"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">رسوم المقرر (شام كاش):</label>
                  <input
                    type="number"
                    value={courseForm.price}
                    onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الساعات المعتمدة:</label>
                  <input
                    type="number"
                    value={courseForm.creditHours}
                    onChange={(e) => setCourseForm({ ...courseForm, creditHours: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">وصف المقرر ومحتوياته:</label>
                <textarea
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden text-xs"
                  placeholder="شرح موجز عن أهداف المادة وما يتناوله المقرر..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveCourse}
                className="px-5 py-2 rounded-xl bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] cursor-pointer shadow-xs"
              >
                {modalType === 'add-course' ? 'إضافة المقرر وحفظه' : 'تحديث بيانات المقرر'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Lecture */}
      {modalType === 'add-lecture' && activeProgram && activeSpecialty && activeCourse && selectedSemesterId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-xl border border-slate-200">
            <h4 className="text-base font-black text-[#0c3250]">إضافة محاضرة جديدة للمقرر</h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">عنوان المحاضرة:</label>
                <input
                  type="text"
                  value={lectureForm.title}
                  onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
                  placeholder="المحاضرة 1 — مدخل لعلم الإدارة"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">رقم المحاضرة:</label>
                  <input
                    type="number"
                    value={lectureForm.number}
                    onChange={(e) => setLectureForm({ ...lectureForm, number: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">مدة المحاضرة:</label>
                  <input
                    type="text"
                    value={lectureForm.duration}
                    onChange={(e) => setLectureForm({ ...lectureForm, duration: e.target.value })}
                    placeholder="45 دقيقة"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">رابط الفيديو (Video URL):</label>
                <input
                  type="text"
                  value={lectureForm.videoUrl}
                  onChange={(e) => setLectureForm({ ...lectureForm, videoUrl: e.target.value })}
                  placeholder="https://...mp4"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">وصف المحاضرة:</label>
                <textarea
                  value={lectureForm.description}
                  onChange={(e) => setLectureForm({ ...lectureForm, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
                  placeholder="المحاور الرئيسية التي تتناولها المحاضرة..."
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="chk-offline-modal"
                  checked={lectureForm.allowOffline}
                  onChange={(e) => setLectureForm({ ...lectureForm, allowOffline: e.target.checked })}
                  className="rounded text-[#2563eb] focus:ring-[#2563eb] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="chk-offline-modal" className="font-bold text-slate-700 cursor-pointer select-none">
                  تفعيل خاصية الدراسة أوفلاين (Offline) لهذه المحاضرة
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (!lectureForm.title.trim()) return;
                  addLecture(activeProgram.id, activeSpecialty.id, activeCourse.id, selectedSemesterId, {
                    number: lectureForm.number || 1,
                    title: lectureForm.title,
                    description: lectureForm.description,
                    duration: lectureForm.duration,
                    videoUrl: lectureForm.videoUrl,
                    allowOffline: lectureForm.allowOffline
                  });
                  setModalType(null);
                }}
                className="px-5 py-2 rounded-xl bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] cursor-pointer"
              >
                إضافة المحاضرة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add File to Lecture */}
      {modalType === 'add-file' && activeProgram && activeSpecialty && activeCourse && activeSemester && activeLecture && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-base font-black text-[#0c3250]">إرفاق ورفع ملف PDF بالمحاضرة</h4>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Native File Selector Box */}
              <div className="p-3.5 border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 rounded-2xl text-center cursor-pointer transition-all">
                <input
                  type="file"
                  id="modal-pdf-file-input"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const sizeInMb = (f.size / (1024 * 1024)).toFixed(1);
                      const cleanName = f.name.replace(/\.[^/.]+$/, '');
                      const reader = new FileReader();
                      reader.onload = () => {
                        setFileForm(prev => ({
                          ...prev,
                          name: prev.name || cleanName,
                          fileSize: `${sizeInMb} MB`,
                          fileUrl: reader.result as string
                        }));
                      };
                      reader.readAsDataURL(f);
                    }
                  }}
                />
                <label htmlFor="modal-pdf-file-input" className="cursor-pointer block space-y-1">
                  <div className="font-bold text-blue-700 text-xs">
                    📁 انقر لاختيار ملف PDF من جهازك
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {fileForm.fileUrl && fileForm.fileUrl.startsWith('data:') ? `✅ تم تحديد ملف (${fileForm.fileSize})` : 'أو اكتب بيانات الملف يدوياً في الخانات أدناه'}
                  </div>
                </label>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم المذكرة أو الملف:</label>
                <input
                  type="text"
                  value={fileForm.name}
                  onChange={(e) => setFileForm({ ...fileForm, name: e.target.value })}
                  placeholder="المحاضرة الأولى PDF — مدخل لعلم الإدارة"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">نوع الملف:</label>
                  <select
                    value={fileForm.type}
                    onChange={(e) => setFileForm({ ...fileForm, type: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
                  >
                    <option value="pdf">ملف المحاضرة الكامل (PDF)</option>
                    <option value="summary">ملخص المحاضرة (PDF)</option>
                    <option value="exercise">تمارين وتطبيقات عملية (PDF)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">حجم الملف:</label>
                  <input
                    type="text"
                    value={fileForm.fileSize}
                    onChange={(e) => setFileForm({ ...fileForm, fileSize: e.target.value })}
                    placeholder="3.2 MB"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalType(null)}
                className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  if (!fileForm.name.trim()) return;
                  addLectureFile(activeProgram.id, activeSpecialty.id, activeCourse.id, activeSemester.id, activeLecture.id, {
                    name: fileForm.name,
                    type: fileForm.type,
                    fileSize: fileForm.fileSize,
                    fileUrl: fileForm.fileUrl || '#uploaded_pdf'
                  });
                  setModalType(null);
                }}
                className="px-5 py-2 rounded-xl bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] cursor-pointer"
              >
                إرفاق وحفظ الملف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Program */}
      {(modalType === 'add-program' || modalType === 'edit-program') && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <h4 className="text-base font-black text-[#0c3250]">
              {modalType === 'add-program' ? 'إضافة قسم رئيسي / برنامج تعليمي جديد' : 'تعديل بيانات القسم الأكاديمي'}
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم القسم / البرنامج:</label>
                <input
                  type="text"
                  value={progForm.title}
                  onChange={(e) => setProgForm({ ...progForm, title: e.target.value })}
                  placeholder="مثال: دبلوم تقني، دراسات مهنية متقدمة..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">وصف موجز أو شعار القسم:</label>
                <input
                  type="text"
                  value={progForm.tagline}
                  onChange={(e) => setProgForm({ ...progForm, tagline: e.target.value })}
                  placeholder="مثال: دبلوم سنتين معتمد مهنياً وأكاديمياً"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">الوصف التعريفي للقسم:</label>
                <textarea
                  value={progForm.description}
                  onChange={(e) => setProgForm({ ...progForm, description: e.target.value })}
                  rows={3}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
                  placeholder="يقدم هذا القسم مسارات أكاديمية وتطبيقية معتمدة تؤهل الطلاب للريادة..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">أيقونة القسم:</label>
                <select
                  value={progForm.iconName}
                  onChange={(e) => setProgForm({ ...progForm, iconName: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
                >
                  <option value="GraduationCap">قبعة تخرج (GraduationCap)</option>
                  <option value="Layers">طبقات أكاديمية (Layers)</option>
                  <option value="BookOpen">كتاب مفتوح (BookOpen)</option>
                  <option value="Sparkles">إشراقة وتميز (Sparkles)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveProgram}
                className="px-5 py-2 rounded-xl bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] cursor-pointer"
              >
                {modalType === 'add-program' ? 'إضافة القسم' : 'حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Specialty */}
      {(modalType === 'add-specialty' || modalType === 'edit-specialty') && activeProgram && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <h4 className="text-base font-black text-[#0c3250]">
              {modalType === 'add-specialty' ? `إضافة اختصاص جديد في ${activeProgram.title}` : 'تعديل بيانات الاختصاص'}
            </h4>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">اسم الاختصاص:</label>
                  <input
                    type="text"
                    value={specForm.name}
                    onChange={(e) => setSpecForm({ ...specForm, name: e.target.value })}
                    placeholder="مثال: إدارة الأعمال، المحاسبة..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الرمز (Code):</label>
                  <input
                    type="text"
                    value={specForm.code}
                    onChange={(e) => setSpecForm({ ...specForm, code: e.target.value.toUpperCase() })}
                    placeholder="BA"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">المدة:</label>
                  <input
                    type="text"
                    value={specForm.duration}
                    onChange={(e) => setSpecForm({ ...specForm, duration: e.target.value })}
                    placeholder="سنتان (2)"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">عدد المقررات:</label>
                  <input
                    type="text"
                    value={specForm.coursesCount}
                    onChange={(e) => setSpecForm({ ...specForm, coursesCount: e.target.value })}
                    placeholder="24 مادة"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الفصول:</label>
                  <input
                    type="text"
                    value={specForm.semestersCount}
                    onChange={(e) => setSpecForm({ ...specForm, semestersCount: e.target.value })}
                    placeholder="4 فصول"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">نبذة عن الاختصاص:</label>
                <textarea
                  value={specForm.overview}
                  onChange={(e) => setSpecForm({ ...specForm, overview: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
                  placeholder="وصف شامل لأهداف الاختصاص وفرصه..."
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">الأهمية وسوق العمل:</label>
                <input
                  type="text"
                  value={specForm.importance}
                  onChange={(e) => setSpecForm({ ...specForm, importance: e.target.value })}
                  placeholder="يؤهل لشغل وظائف قيادية وإدارية في مختلف المؤسسات..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveSpecialty}
                className="px-5 py-2 rounded-xl bg-[#2563eb] text-white text-xs font-bold hover:bg-[#1d4ed8] cursor-pointer"
              >
                {modalType === 'add-specialty' ? 'إضافة الاختصاص' : 'حفظ التعديلات'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-black text-slate-800">تأكيد الحذف نهائياً</h4>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              هل أنت متأكد من رغبتك في حذف{' '}
              {deleteConfirmTarget.type === 'program' ? 'القسم الأكاديمي' :
               deleteConfirmTarget.type === 'specialty' ? 'الاختصاص' :
               deleteConfirmTarget.type === 'course' ? 'المقرر الدراسي' :
               deleteConfirmTarget.type === 'semester' ? 'الفصل الدراسي' :
               deleteConfirmTarget.type === 'lecture' ? 'المحاضرة' : 'الملف'}:
              {' '}<strong className="text-rose-600 font-bold">"{deleteConfirmTarget.title}"</strong>؟
            </p>
            <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-100 text-[11px] text-rose-800 text-right">
              <span>سيتم تطبيق الحذف مباشرة وحفظ التغييرات في قاعدة بيانات السيرفر المركزية.</span>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setDeleteConfirmTarget(null);
                  setModalType(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold cursor-pointer transition-colors"
              >
                تراجع
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer shadow-sm transition-all"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Old Specialties & Courses Confirmation Modal */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in" dir="rtl">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-2xs">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black text-slate-900">تصفير ومسح كافة المقررات القديمة</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              هل أنت متأكد من رغبتك في حذف وتصفير جميع الاختصاصات والمقررات القديمة نهائياً للبدء بصفحة بيضاء؟
            </p>
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 text-right space-y-1 font-medium">
              <span>لن تعود هذه المقررات القديمة مجدداً بعد الحذف، ويمكنك إضافة مقرراتك واختصاصاتك ومحاضراتك الجديدة من الصفر بحرية تامة.</span>
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
                  setSelectedCourseId(null);
                  setSelectedSemesterId(null);
                  setSelectedLectureId(null);
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
