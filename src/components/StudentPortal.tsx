import React, { useState, useEffect, useMemo } from 'react';
import { usePlatform } from '../context/PlatformContext';
import { StudentUser, Course, Semester, Lecture, LectureFile, ShamCashRequest } from '../types';
import { 
  BookOpen, 
  Play, 
  DownloadCloud, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ChevronRight, 
  Clock, 
  Video, 
  Check, 
  CheckSquare, 
  Square, 
  Sparkles, 
  FolderDown, 
  Info, 
  Layers, 
  GraduationCap,
  GitBranch,
  CreditCard,
  Building2,
  Lock,
  Copy,
  AlertCircle,
  Clock3,
  XCircle,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Calendar,
  SlidersHorizontal,
  Send,
  QrCode,
  ZoomIn,
  Download,
  RefreshCw,
  Upload,
  Eye,
  BookMarked,
  Search,
  ChevronDown,
  X
} from 'lucide-react';
import { UploadBarcodeModal } from './AdminPanel/UploadBarcodeModal';
import { PdfReaderModal } from './PdfReaderModal';
import { defaultShamCashBarcodeSvg } from '../data/initialData';
import { 
  downloadLectureDocument, 
  downloadLecturePdfFile, 
  saveLectureToLocalOffline, 
  getLocalOfflineLectures, 
  isLectureSavedOffline,
  removeLectureFromOffline,
  OfflineSavedLecture
} from '../utils/downloadHelper';
import { copyCourseShareLink } from '../utils/courseLink';

interface StudentPortalProps {
  onBackToHome?: () => void;
  initialCourseId?: string | null;
  onClearInitialCourse?: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  onBackToHome,
  initialCourseId,
  onClearInitialCourse
}) => {
  const { 
    currentUser, 
    programs, 
    addToast,
    siteSettings,
    shamCashRequests,
    submitShamCashRequest
  } = usePlatform();

  const student = currentUser as StudentUser;

  // 1. LEVEL 1: SPECIALTY (Strictly locked to student's assigned specialty)
  const studentProgram = programs.find(p => p.id === student?.programId) || programs[0];
  const studentSpecialty = studentProgram?.specialties.find(s => s.id === student?.specialtyId) || studentProgram?.specialties[0];
  
  // 2. LEVEL 2: BRANCH (Strictly locked to student's assigned branch)
  const studentBranch = studentSpecialty?.branches?.find(b => b.id === student?.branchId) || 
                       studentSpecialty?.branches?.[0] || 
                       { id: 'general', name: 'الفرع العام', code: 'GEN' };

  // All courses under student's specialty
  const allSpecialtyCourses = studentSpecialty?.courses || [];

  // REQUIREMENT: Strict filtering - ONLY show courses assigned by the platform owner
  const assignedCourses = allSpecialtyCourses.filter(course => 
    student?.allowedCourseIds?.includes(course.id)
  );

  // 3. LEVEL 3: ACADEMIC YEARS (Filtered to allowed years that contain assigned courses)
  const allowedYears = (student?.allowedAcademicYears || [1, 2]).filter(yr => 
    assignedCourses.some(c => (c.academicYear || 1) === yr)
  );

  // Active Year Selection & Filter States (Seamless Student Course View)
  const [courseYearFilter, setCourseYearFilter] = useState<'all' | 1 | 2>('all');
  const [courseSemesterFilter, setCourseSemesterFilter] = useState<'all' | 1 | 2>('all');
  const [courseSearchTerm, setCourseSearchTerm] = useState('');

  // Course counts
  const year1CoursesCount = assignedCourses.filter(c => (c.academicYear || 1) === 1).length;
  const year2CoursesCount = assignedCourses.filter(c => (c.academicYear || 1) === 2).length;

  // Filtered assigned courses for the student
  const filteredStudentCourses = useMemo(() => {
    return assignedCourses.filter(c => {
      const yr = (c.academicYear || 1) as 1 | 2;
      const sem = (c.semesterTerm || 1) as 1 | 2;
      const matchesYear = courseYearFilter === 'all' || yr === courseYearFilter;
      const matchesSem = courseSemesterFilter === 'all' || sem === courseSemesterFilter;
      const q = courseSearchTerm.trim().toLowerCase();
      const matchesQuery = !q || 
        c.title.toLowerCase().includes(q) || 
        (c.code && c.code.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q));
      return matchesYear && matchesSem && matchesQuery;
    });
  }, [assignedCourses, courseYearFilter, courseSemesterFilter, courseSearchTerm]);

  // Compatibility states
  const [selectedYear, setSelectedYear] = useState<number>(allowedYears[0] || 1);
  const [selectedSemesterTerm, setSelectedSemesterTerm] = useState<number>(1);
  const displayedCourses = filteredStudentCourses;

  // Drill-down State
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(() => initialCourseId || null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);

  // Sync with initialCourseId if opened or changed
  useEffect(() => {
    if (initialCourseId && assignedCourses.some(c => c.id === initialCourseId)) {
      setSelectedCourseId(initialCourseId);
    }
  }, [initialCourseId, assignedCourses]);

  // Active Tab: 'courses' | 'pdf-library' | 'payment' | 'about' | 'offline' | 'tasks'
  const [activeTab, setActiveTab] = useState<'courses' | 'pdf-library' | 'payment' | 'about' | 'offline' | 'tasks'>('courses');
  const [pdfSearchQuery, setPdfSearchQuery] = useState('');
  const [pdfCourseFilter, setPdfCourseFilter] = useState<string>('all');

  // Offline saved lectures state from localStorage
  const [offlineLectures, setOfflineLectures] = useState<OfflineSavedLecture[]>([]);
  const [downloadingLectureId, setDownloadingLectureId] = useState<string | null>(null);

  // Student Tasks / Assignments State (Stored locally per student)
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`fc_tasks_${student?.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Sham Cash Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    transactionNumber: '',
    amount: '',
    selectedCourses: [] as string[],
    notes: ''
  });
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showOwnerBarcodeModal, setShowOwnerBarcodeModal] = useState(false);

  // Separation of PDF Reading & Download vs Attendance & Offline
  const [courseStudyMode, setCourseStudyMode] = useState<'attendance' | 'documents'>('attendance');
  const [lectureStudyMode, setLectureStudyMode] = useState<'attendance' | 'documents'>('attendance');
  const [selectedAboutSpecId, setSelectedAboutSpecId] = useState<string | null>(null);
  const [expandedAboutSpecIds, setExpandedAboutSpecIds] = useState<Record<string, boolean>>({});
  const [aboutSearchQuery, setAboutSearchQuery] = useState('');

  const toggleAboutSpecExpand = (specId: string) => {
    setExpandedAboutSpecIds(prev => ({
      ...prev,
      [specId]: !prev[specId]
    }));
  };

  const handleExpandAllAbout = (specs: { id: string }[]) => {
    const nextMap: Record<string, boolean> = {};
    specs.forEach(s => { nextMap[s.id] = true; });
    setExpandedAboutSpecIds(nextMap);
  };

  const handleCollapseAllAbout = () => {
    setExpandedAboutSpecIds({});
  };

  const getArabicCourseOrdinal = (index: number): string => {
    const ordinals = [
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
      'المادة الثانية عشرة',
      'المادة الثالثة عشرة',
      'المادة الرابعة عشرة',
      'المادة الخامسة عشرة'
    ];
    return ordinals[index] || `المادة رقم ${index + 1}`;
  };
  const [readingFile, setReadingFile] = useState<{
    file: LectureFile;
    lectureTitle: string;
    courseTitle: string;
  } | null>(null);

  const handleDownloadBarcode = () => {
    const barcodeUrl = siteSettings.shamCashBarcodeUrl;
    if (!barcodeUrl) {
      addToast('info', 'لم يتم تعيين صورة باركود بعد.');
      return;
    }
    const link = document.createElement('a');
    link.href = barcodeUrl;
    link.download = `sham-cash-qr-${siteSettings.shamCashCode || 'account'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'تم بدء تنزيل صورة باركود شام كاش.');
  };

  // Load offline saved lectures on mount and when student changes
  useEffect(() => {
    if (student?.id) {
      setOfflineLectures(getLocalOfflineLectures(student.id));
    }
  }, [student?.id]);

  // Persist tasks
  useEffect(() => {
    if (student?.id) {
      localStorage.setItem(`fc_tasks_${student.id}`, JSON.stringify(completedTasks));
    }
  }, [completedTasks, student?.id]);

  // Active Objects for viewing lecture
  const activeCourse = assignedCourses.find(c => c.id === selectedCourseId);
  const activeSemester = activeCourse?.semesters.find(s => s.id === selectedSemesterId) || activeCourse?.semesters[0];
  const activeLecture = activeSemester?.lectures.find(l => l.id === selectedLectureId);

  // Student permissions
  const canAttendLectures = student?.canAttendLectures !== false;
  const canDownloadFiles = student?.canDownloadFiles !== false;
  const isOfflineLecturesDownloadGloballyAllowed = siteSettings.allowOfflineLecturesDownload !== false;
  const allowOffline = isOfflineLecturesDownloadGloballyAllowed && student?.allowOffline !== false;

  // All PDF notes across all assigned courses for reading & downloading outside offline
  const allStudentPdfNotes = useMemo(() => {
    const list: {
      courseId: string;
      courseTitle: string;
      semesterId: string;
      semesterName: string;
      lectureId: string;
      lectureTitle: string;
      lectureNumber: number;
      file: LectureFile;
    }[] = [];

    assignedCourses.forEach(course => {
      course.semesters.forEach(semester => {
        semester.lectures.forEach(lecture => {
          (lecture.files || []).forEach(file => {
            list.push({
              courseId: course.id,
              courseTitle: course.title,
              semesterId: semester.id,
              semesterName: semester.name,
              lectureId: lecture.id,
              lectureTitle: lecture.title,
              lectureNumber: lecture.number,
              file
            });
          });
        });
      });
    });

    return list;
  }, [assignedCourses]);

  const filteredStudentPdfNotes = useMemo(() => {
    return allStudentPdfNotes.filter(item => {
      const matchesCourse = pdfCourseFilter === 'all' || item.courseId === pdfCourseFilter;
      const q = pdfSearchQuery.trim().toLowerCase();
      const matchesQuery = !q || 
        item.file.name.toLowerCase().includes(q) ||
        item.lectureTitle.toLowerCase().includes(q) ||
        item.courseTitle.toLowerCase().includes(q);
      return matchesCourse && matchesQuery;
    });
  }, [allStudentPdfNotes, pdfCourseFilter, pdfSearchQuery]);

  // Filter Sham Cash requests belonging to this student
  const studentPaymentRequests = shamCashRequests.filter(
    req => req.studentId === student?.id || req.studentName === student?.fullName
  );

  // Toggle task completion
  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => {
      const updated = { ...prev, [taskId]: !prev[taskId] };
      addToast('info', updated[taskId] ? 'تم تحديد المهمة كمكتملة.' : 'تم إلغاء اكتمال المهمة.');
      return updated;
    });
  };

  // Real Offline Download for a Lecture
  const handleDownloadLectureOffline = (lecture: Lecture, courseTitle: string, semName: string) => {
    if (!isOfflineLecturesDownloadGloballyAllowed) {
      addToast('error', 'تم إيقاف تنزيل محاضرات الأوفلاين حالياً بقرار من إدارة المركز (المالك). يمكنك قراءة وتنزيل مذكرات الـ PDF بشكل مستقل خارج الأوفلاين.');
      return;
    }

    if (!student?.allowOffline) {
      addToast('error', 'خاصية المشاهدة والتحميل أوفلاين غير مفعلة لحسابك من قبل إدارة المركز.');
      return;
    }

    setDownloadingLectureId(lecture.id);

    try {
      downloadLectureDocument({
        title: lecture.title,
        courseTitle,
        specialtyName: studentSpecialty?.name,
        studentName: student.fullName,
        academicId: student.academicIdNumber,
        contentSummary: lecture.description || 'ملخص شامل للمحاضرة والمفاهيم الأساسية المقررة.',
        fileName: `${lecture.title.replace(/[\/\s:]+/g, '_')}_أوفلاين.html`
      });

      const offlineItem: OfflineSavedLecture = {
        id: lecture.id,
        courseId: selectedCourseId || '',
        courseTitle,
        semesterName: semName,
        title: lecture.title,
        description: lecture.description,
        number: lecture.number,
        duration: lecture.duration,
        downloadedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        files: lecture.files.map(f => ({ id: f.id, name: f.name, fileSize: f.fileSize })),
        summaryText: lecture.description || 'محتوى المحاضرة مسجل للدراسة أوفلاين.'
      };

      saveLectureToLocalOffline(student.id, offlineItem);
      setOfflineLectures(getLocalOfflineLectures(student.id));

      addToast('success', `تم تنزيل الحقيبة الكاملة لـ "${lecture.title}" لجهازك.`);
    } catch {
      addToast('error', 'حدث خطأ أثناء تنزيل الحقيبة الدراسية.');
    } finally {
      setDownloadingLectureId(null);
    }
  };

  // Download Individual PDF File
  const handleDownloadFile = async (file: LectureFile, lectureTitle: string, courseTitle: string) => {
    if (!canDownloadFiles) {
      addToast('error', '🔒 خاصية تنزيل الملفات والمذكرات الدراسية غير مصرح بها لحسابك حالياً. يرجى التواصل مع إدارة المركز.');
      return;
    }

    try {
      addToast('info', `جاري تحضير وتنزيل ملف PDF: "${file.name}"...`);
      const success = await downloadLecturePdfFile(
        file.name,
        lectureTitle,
        courseTitle,
        student.fullName,
        file.fileUrl,
        file.id,
        student.academicIdNumber
      );
      if (success) {
        addToast('success', `تم تنزيل "${file.name}" بنجاح بصيغة PDF.`);
      }
    } catch (err) {
      console.error('Download PDF error:', err);
      addToast('error', 'حدث خطأ أثناء تنزيل ملف الـ PDF. يرجى المحاولة ثانية.');
    }
  };

  // One-click full course offline download
  const handleDownloadFullCourseOffline = (course: Course) => {
    if (!isOfflineLecturesDownloadGloballyAllowed) {
      addToast('error', 'تم إيقاف تنزيل محاضرات الأوفلاين حالياً بقرار من إدارة المركز (المالك). يمكنك قراءة وتنزيل مذكرات الـ PDF بشكل مستقل خارج الأوفلاين.');
      return;
    }

    if (!student?.allowOffline) {
      addToast('error', 'خاصية المشاهدة والتحميل أوفلاين غير مفعلة لحسابك من قبل إدارة المركز.');
      return;
    }

    course.semesters.forEach(sem => {
      sem.lectures.forEach(lec => {
        const offlineItem: OfflineSavedLecture = {
          id: lec.id,
          courseId: course.id,
          courseTitle: course.title,
          semesterName: sem.name,
          title: lec.title,
          description: lec.description,
          number: lec.number,
          duration: lec.duration,
          downloadedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          files: lec.files.map(f => ({ id: f.id, name: f.name, fileSize: f.fileSize })),
          summaryText: lec.description
        };
        saveLectureToLocalOffline(student.id, offlineItem);
      });
    });

    setOfflineLectures(getLocalOfflineLectures(student.id));

    downloadLectureDocument({
      title: `الحقيبة الشاملة — ${course.title}`,
      courseTitle: course.title,
      specialtyName: studentSpecialty?.name,
      studentName: student.fullName,
      academicId: student.academicIdNumber,
      contentSummary: `حقيبة كاملة لمقرر ${course.title} تشمل كافة المحاضرات والمذكرات التخصصية.`,
      fileName: `${course.title.replace(/[\/\s:]+/g, '_')}_الحقيبة_الشاملة.html`
    });

    addToast('success', `تم حفظ وتنزيل الحقيبة الشاملة لمقرر ${course.title} بنجاح.`);
  };

  // Download all PDFs in course
  const handleDownloadAllCoursePdfs = async (course: Course) => {
    if (!canDownloadFiles) {
      addToast('error', '🔒 خاصية تنزيل الملفات والمذكرات الدراسية غير مصرح بها لحسابك حالياً. يرجى التواصل مع إدارة المركز.');
      return;
    }

    const items: { file: LectureFile; lectureTitle: string }[] = [];
    course.semesters.forEach(sem => {
      sem.lectures.forEach(lec => {
        lec.files.forEach(file => {
          items.push({ file, lectureTitle: lec.title });
        });
      });
    });

    if (items.length === 0) {
      addToast('info', 'لا توجد مذكرات PDF مسجلة في هذا المقرر حالياً.');
      return;
    }

    addToast('info', `جاري بدء تنزيل ${items.length} مذكرات وملفات PDF لمقرر "${course.title}"...`);
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      await downloadLecturePdfFile(
        it.file.name,
        it.lectureTitle,
        course.title,
        student.fullName,
        it.file.fileUrl,
        it.file.id,
        student.academicIdNumber
      );
      if (i < items.length - 1) {
        await new Promise(r => setTimeout(r, 400));
      }
    }
    addToast('success', `اكتمل تنزيل كافة مذكرات مقرر "${course.title}" بنجاح.`);
  };

  // Remove offline lecture
  const handleRemoveOffline = (lectureId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeLectureFromOffline(student.id, lectureId);
    setOfflineLectures(getLocalOfflineLectures(student.id));
    addToast('info', 'تمت إزالة المحاضرة من التخزين أوفلاين.');
  };

  // Handle Submit Sham Cash Request
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.transactionNumber.trim() || !paymentForm.amount.trim()) {
      addToast('error', 'يرجى إدخال رقم العملية والمبلغ المحول.');
      return;
    }

    const selectedCourseTitles = allSpecialtyCourses
      .filter(c => paymentForm.selectedCourses.includes(c.id))
      .map(c => c.title);

    submitShamCashRequest({
      studentId: student.id,
      studentName: student.fullName,
      phone: student.phone,
      specialtyId: student.specialtyId,
      specialtyName: studentSpecialty?.name || 'غير محدد',
      requestedCourseIds: paymentForm.selectedCourses.length > 0 ? paymentForm.selectedCourses : [allSpecialtyCourses[0]?.id || ''],
      requestedCourseNames: selectedCourseTitles.length > 0 ? selectedCourseTitles : ['رسوم تسجيل أكاديمي'],
      transactionNumber: paymentForm.transactionNumber.trim(),
      amount: Number(paymentForm.amount) || 50000,
      notes: paymentForm.notes.trim()
    });

    setPaymentForm({
      transactionNumber: '',
      amount: '',
      selectedCourses: [],
      notes: ''
    });

    addToast('success', 'تم إرسال إشعار الدفع بنجاح إلى إدارة المركز وسيتم التدقيق وتفعيل المواد فوراً.');
  };

  // Copy Sham Cash Code
  const handleCopyShamCashCode = () => {
    const code = siteSettings.shamCashCode || '0987654321';
    navigator.clipboard.writeText(code);
    addToast('success', `تم نسخ رقم حساب شام كاش: ${code}`);
  };

  // Build task checklist based on assigned courses
  const studentTasks = assignedCourses.flatMap(course => 
    course.semesters.flatMap(sem => 
      sem.lectures.map(lec => ({
        id: `task-${lec.id}`,
        title: `دراسة وتلخيص: ${lec.title}`,
        courseTitle: course.title,
        semName: sem.name,
        lectureId: lec.id,
        courseId: course.id,
        semId: sem.id
      }))
    )
  );

  return (
    <div className="min-h-screen bg-slate-50/80 pb-20 text-right font-sans" dir="rtl">
      
      {/* 1. TOP STUDENT STATUS & NAVIGATION BAR */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-[#f0f4f8] text-[#183b63] flex items-center justify-center font-bold text-sm shrink-0 border border-[#d9e2ec]">
              <GraduationCap className="w-5 h-5 text-[#183b63]" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-[#0f2942] truncate">{student.fullName}</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200 shrink-0 hidden sm:inline">
                  {studentSpecialty?.name}
                </span>
              </div>
              <p className="text-[11px] text-[#596d82] truncate">
                {studentProgram?.title} • الرقم الأكاديمي: <span className="font-mono text-[#183b63] font-bold">{student.academicIdNumber}</span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('courses');
                setSelectedCourseId(null);
                setSelectedLectureId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'courses' 
                  ? 'bg-white text-[#183b63] shadow-xs font-black' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>مقرراتي ({assignedCourses.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('pdf-library');
                setSelectedCourseId(null);
                setSelectedLectureId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'pdf-library' 
                  ? 'bg-white text-rose-700 shadow-xs font-black' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="قراءة وتنزيل مذكرات الـ PDF خارج الأوفلاين"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>مكتبة مذكرات الـ PDF</span>
              {allStudentPdfNotes.length > 0 && (
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono font-bold ${
                  activeTab === 'pdf-library' ? 'bg-rose-100 text-rose-800' : 'bg-slate-200 text-slate-700'
                }`}>
                  {allStudentPdfNotes.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('payment');
                setSelectedCourseId(null);
                setSelectedLectureId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'payment' 
                  ? 'bg-white text-[#183b63] shadow-xs font-black' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>الدفع وشام كاش</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('about');
                setSelectedCourseId(null);
                setSelectedLectureId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'about' 
                  ? 'bg-white text-[#183b63] shadow-xs font-black' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>حول المركز</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('offline');
                setSelectedCourseId(null);
                setSelectedLectureId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'offline' 
                  ? 'bg-white text-[#183b63] shadow-xs font-black' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">أوفلاين</span>
              {offlineLectures.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#183b63] text-white text-[10px] flex items-center justify-center font-mono">
                  {offlineLectures.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('tasks');
                setSelectedCourseId(null);
                setSelectedLectureId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'tasks' 
                  ? 'bg-white text-[#183b63] shadow-xs font-black' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>المهام</span>
            </button>
          </div>

        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 space-y-5">

        {/* 2. DYNAMIC WELCOME MESSAGE FOR STUDENT (Prompt Requirement) */}
        {!selectedCourseId && (
          <div className="bg-gradient-to-l from-[#0c3250] via-[#143f66] to-[#1a5282] text-white p-6 rounded-3xl shadow-sm border border-blue-900/40 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-white text-[11px] font-bold backdrop-blur-xs">
                    بوابة الطالب المعتمد
                  </span>
                  <span className="text-xs text-blue-200 font-mono">
                    #{student.academicIdNumber}
                  </span>
                </div>
                <h2 className="text-2xl font-black">
                  أهلاً وسهلاً بك، {student.fullName}
                </h2>
                <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
                  مرحباً بك في بوابتك التعليمية الرسمية. تم تفعيل المواد والمسارات الدراسية المصرح لك بها بدقة وفق التسلسل الأكاديمي المعتمد من إدارة المركز.
                </p>
              </div>

              {/* Strict Academic Hierarchy Card */}
              <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 text-xs space-y-1.5 shrink-0 self-start md:self-auto">
                <div className="flex items-center gap-2 text-blue-200">
                  <Layers className="w-3.5 h-3.5 text-blue-300" />
                  <span>الاختصاص: <strong className="text-white">{studentSpecialty?.name}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-blue-200">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-300" />
                  <span>الفرع: <strong className="text-white">{studentBranch.name}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-blue-200">
                  <BookOpen className="w-3.5 h-3.5 text-blue-300" />
                  <span>المواد المفعلة: <strong className="text-white">{assignedCourses.length} مواد</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. BREADCRUMBS FOR SEAMLESS MOBILE DRILL-DOWN */}
        {(selectedCourseId || selectedLectureId) && (
          <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2 text-xs font-bold">
            <div className="flex items-center gap-1.5 overflow-hidden text-slate-600">
              <button
                onClick={() => {
                  setSelectedCourseId(null);
                  setSelectedLectureId(null);
                  onClearInitialCourse?.();
                }}
                className="hover:text-[#183b63] truncate transition-colors cursor-pointer"
              >
                مقرراتي المفعلة
              </button>

              {activeCourse && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 rotate-180 text-slate-400 shrink-0" />
                  <button
                    onClick={() => setSelectedLectureId(null)}
                    className={`truncate transition-colors cursor-pointer ${!selectedLectureId ? 'text-[#183b63] font-black' : 'hover:text-[#183b63]'}`}
                  >
                    {activeCourse.title}
                  </button>
                </>
              )}

              {activeLecture && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 rotate-180 text-slate-400 shrink-0" />
                  <span className="text-[#183b63] font-black truncate">
                    {activeLecture.title}
                  </span>
                </>
              )}
            </div>

            <button
              onClick={() => {
                if (selectedLectureId) setSelectedLectureId(null);
                else setSelectedCourseId(null);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer shrink-0 flex items-center gap-1"
            >
              <ArrowRight className="w-3 h-3" />
              <span>رجوع</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: ASSIGNED COURSES (STRICT HIERARCHY: الاختصاص → الفرع → السنة → الفصل → المواد) */}
        {/* ========================================================================= */}
        {activeTab === 'courses' && (
          <div>
            {!selectedCourseId && (
              <div className="space-y-5">
                
                {/* HIERARCHICAL FILTERS & SEARCH BAR (Fluid, Smooth, No Dead Ends) */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-blue-700 block">
                        التسلسل المعتمد: {studentSpecialty?.name} ← {studentBranch.name}
                      </span>
                      <h3 className="text-lg font-black text-[#0c3250]">
                        المواد والمقررات المخصصة لحسابك ({assignedCourses.length} مادة)
                      </h3>
                    </div>

                    {/* Quick Search */}
                    <div className="relative max-w-xs w-full">
                      <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={courseSearchTerm}
                        onChange={(e) => setCourseSearchTerm(e.target.value)}
                        placeholder="ابحث في موادك المعتمدة..."
                        className="w-full pr-8.5 pl-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 bg-slate-50/60"
                      />
                      {courseSearchTerm && (
                        <button
                          onClick={() => setCourseSearchTerm('')}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Year & Semester Filter Pills */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                    
                    {/* Years Tabs */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                      <button
                        onClick={() => setCourseYearFilter('all')}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          courseYearFilter === 'all'
                            ? 'bg-white text-blue-800 shadow-2xs font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        جميع موادي ({assignedCourses.length})
                      </button>

                      <button
                        onClick={() => setCourseYearFilter(1)}
                        className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                          courseYearFilter === 1
                            ? 'bg-white text-indigo-800 shadow-2xs font-black'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        السنة الأولى ({year1CoursesCount})
                      </button>

                      {year2CoursesCount > 0 && (
                        <button
                          onClick={() => setCourseYearFilter(2)}
                          className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                            courseYearFilter === 2
                              ? 'bg-white text-indigo-800 shadow-2xs font-black'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          السنة الثانية ({year2CoursesCount})
                        </button>
                      )}
                    </div>

                    {/* Semesters Term Filter */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
                      <button
                        onClick={() => setCourseSemesterFilter('all')}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          courseSemesterFilter === 'all'
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        كل الفصول
                      </button>
                      <button
                        onClick={() => setCourseSemesterFilter(1)}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          courseSemesterFilter === 1
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        الفصل الأول
                      </button>
                      <button
                        onClick={() => setCourseSemesterFilter(2)}
                        className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                          courseSemesterFilter === 2
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        الفصل الثاني
                      </button>
                    </div>

                  </div>
                </div>

                {/* Courses Grid with Smart Grouping */}
                {filteredStudentCourses.length === 0 ? (
                  <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                      <Info className="w-7 h-7" />
                    </div>
                    <h3 className="text-lg font-black text-[#0f2942]">لم يتم العثور على مقررات مطابقة</h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      جرب تغيير خيارات التصفية أو إزالة كلمة البحث للاطلاع على كافة مقرراتك المعتمدة.
                    </p>
                    <button
                      onClick={() => {
                        setCourseYearFilter('all');
                        setCourseSemesterFilter('all');
                        setCourseSearchTerm('');
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      عرض جميع موادي ({assignedCourses.length})
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* If Year Filter is 'all', show courses by year sections */}
                    {[1, 2].map(yearNum => {
                      const yearCourses = filteredStudentCourses.filter(c => (c.academicYear || 1) === yearNum);
                      if (yearCourses.length === 0) return null;

                      return (
                        <div key={yearNum} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                            <h4 className="text-sm font-extrabold text-[#0c3250]">
                              مقررات السنة {yearNum === 1 ? 'الأولى' : 'الثانية'} ({yearCourses.length} مادة)
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {yearCourses.map((course) => {
                              const totalLectures = course.semesters.reduce((acc, s) => acc + s.lectures.length, 0);
                              const totalFiles = course.semesters.reduce((acc, s) => acc + s.lectures.reduce((fa, l) => fa + l.files.length, 0), 0);
                              
                              return (
                                <div
                                  key={course.id}
                                  className="bg-white rounded-3xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 shadow-2xs group"
                                >
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-mono font-bold">
                                        {course.code}
                                      </span>

                                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>مقرر مفعل لك</span>
                                      </span>
                                    </div>

                                    <div>
                                      <h4 className="text-base font-black text-[#0f2942] group-hover:text-blue-700 transition-colors">
                                        {course.title}
                                      </h4>
                                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                        {course.description}
                                      </p>
                                    </div>

                                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-[11px]">
                                        السنة {course.academicYear || 1} • الفصل {course.semesterTerm === 2 ? 'الثاني' : 'الأول'}
                                      </span>
                                      <span>{totalLectures} محاضرة • {totalFiles} ملف</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 w-full">
                                    <button
                                      onClick={() => setSelectedCourseId(course.id)}
                                      className="flex-1 py-3 px-4 rounded-xl bg-[#183b63] hover:bg-[#122e4e] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs group-hover:shadow-md"
                                    >
                                      <BookOpen className="w-4 h-4" />
                                      <span>دخول للمقرر والمحاضرات</span>
                                    </button>
                                    <button
                                      onClick={() => copyCourseShareLink(course.id, course.title, (msg) => addToast('success', msg))}
                                      className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-500 hover:text-blue-700 transition-all cursor-pointer shrink-0"
                                      title="نسخ الرابط المباشر لهذا المقرر"
                                    >
                                      <Copy className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            )}

            {/* LEVEL 2: SEPARATED STUDY EXPERIENCE (ATTENDANCE & OFFLINE vs PDF READING & DOWNLOAD) */}
            {activeCourse && !selectedLectureId && (() => {
              const allCourseFiles = activeCourse.semesters.flatMap(sem =>
                sem.lectures.flatMap(lec =>
                  lec.files.map(file => ({
                    file,
                    lectureId: lec.id,
                    lectureNumber: lec.number,
                    lectureTitle: lec.title,
                    semesterId: sem.id,
                    semesterName: sem.name
                  }))
                )
              );

              return (
                <div className="space-y-5">
                  
                  {/* Course Header Banner */}
                  <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-[#244260] block">
                        {studentSpecialty?.name} • رمز المقرر: {activeCourse.code}
                      </span>
                      <h3 className="text-2xl font-black text-[#0f2942]">{activeCourse.title}</h3>
                      <p className="text-xs text-slate-600 max-w-2xl">{activeCourse.description}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => copyCourseShareLink(activeCourse.id, activeCourse.title, (msg) => addToast('success', msg))}
                        className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        title="نسخ الرابط المباشر لمشاركته"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ رابط المقرر</span>
                      </button>
                      <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-bold text-slate-600">
                        {activeCourse.semesters.reduce((acc, s) => acc + s.lectures.length, 0)} محاضرة
                      </div>
                      <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-800">
                        {allCourseFiles.length} مذكرات PDF
                      </div>
                    </div>
                  </div>

                  {/* Top Mode Switcher: Distinct separation requested by user */}
                  <div className="bg-slate-200/80 p-1.5 rounded-2xl flex items-center gap-1.5 border border-slate-300/70 shadow-2xs">
                    <button
                      onClick={() => setCourseStudyMode('attendance')}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        courseStudyMode === 'attendance'
                          ? 'bg-[#183b63] text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                      <span>حضور المحاضرات وتنزيل أوفلاين</span>
                    </button>

                    <button
                      onClick={() => setCourseStudyMode('documents')}
                      className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        courseStudyMode === 'documents'
                          ? 'bg-rose-700 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>قراءة مذكرات الـ PDF وتنزيلها</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        courseStudyMode === 'documents' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {allCourseFiles.length}
                      </span>
                    </button>
                  </div>

                  {/* TAB 1: ATTENDANCE & OFFLINE DOWNLOAD */}
                  {courseStudyMode === 'attendance' && (
                    <div className="space-y-4">
                      
                      {/* Attendance Mode Banner */}
                      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#183b63] flex items-center justify-center shrink-0 border border-blue-100">
                            <Video className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-black text-slate-800">
                              جدول المحاضرات والشروحات المرئية (حضور + تنزيل أوفلاين)
                            </h4>
                            <p className="text-[11px] text-slate-500">
                              شاهد المحاضرات مباشرة أو حمّلها لجهازك للدراسة بدون اتصال بالإنترنت.
                            </p>
                          </div>
                        </div>

                        {allowOffline ? (
                          <button
                            onClick={() => handleDownloadFullCourseOffline(activeCourse)}
                            className="px-4 py-2 rounded-xl bg-[#f0f4f8] hover:bg-[#e2eaf2] text-[#183b63] border border-[#d2dfec] text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-2xs self-start sm:self-auto shrink-0"
                            title="تحميل جميع محاضرات هذا المقرر لجهازك أوفلاين"
                          >
                            <FolderDown className="w-4 h-4 text-[#183b63]" />
                            <span>تحميل كافة المحاضرات أوفلاين</span>
                          </button>
                        ) : (
                          <div className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-bold flex items-center gap-1.5 self-start sm:self-auto shrink-0" title="المشاهدة أونلاين فقط - التنزيل أوفلاين غير مصرح لحسابك">
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>المشاهدة أونلاين فقط (التنزيل أوفلاين ملغى)</span>
                          </div>
                        )}
                      </div>

                      {/* Semesters & Lectures List */}
                      {activeCourse.semesters.map((sem) => (
                        <div key={sem.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
                          <div className="bg-slate-50/80 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#183b63]"></span>
                              <h4 className="font-extrabold text-sm text-[#0f2942]">{sem.name}</h4>
                            </div>
                            <span className="text-xs text-slate-500 font-medium">
                              {sem.lectures.length} محاضرات
                            </span>
                          </div>

                          <div className="p-4 divide-y divide-slate-100">
                            {sem.lectures.length === 0 ? (
                              <p className="text-center text-xs text-slate-400 py-4">لا توجد محاضرات في هذا الفصل بعد.</p>
                            ) : (
                              sem.lectures.map((lecture) => {
                                const isSavedOffline = isLectureSavedOffline(student.id, lecture.id);
                                return (
                                  <div
                                    key={lecture.id}
                                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-3 rounded-2xl transition-colors"
                                  >
                                    <div className="flex items-start gap-3 overflow-hidden">
                                      <div className="w-9 h-9 rounded-xl bg-[#f0f4f8] text-[#183b63] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-[#d2dfec]">
                                        {lecture.number}
                                      </div>
                                      <div className="overflow-hidden">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <h5 className="text-sm font-extrabold text-[#0f2942]">
                                            {lecture.title}
                                          </h5>
                                          {isSavedOffline && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#f0f4f8] text-[#244260] text-[10px] font-bold border border-[#d2dfec]">
                                              <Check className="w-3 h-3 text-[#244260]" />
                                              <span>محمل أوفلاين</span>
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                                          {lecture.description || 'شروحات ومفاهيم المحاضرة المقررة'}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                                          <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {lecture.duration}
                                          </span>
                                          <span>•</span>
                                          <span className={allowOffline ? "text-emerald-700 font-medium" : "text-amber-700 font-medium"}>
                                            {allowOffline ? 'حضور وتنزيل أوفلاين متاح' : 'حضور ومشاهدة أونلاين فقط'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                      {/* Quick Offline Download Button */}
                                      {allowOffline ? (
                                        <button
                                          onClick={() => handleDownloadLectureOffline(lecture, activeCourse.title, sem.name)}
                                          disabled={downloadingLectureId === lecture.id}
                                          className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-slate-100 text-slate-700 hover:bg-[#f0f4f8] hover:text-[#183b63] border border-slate-200"
                                          title="تحميل المحاضرة للدراسة بدون إنترنت"
                                        >
                                          <DownloadCloud className="w-3.5 h-3.5 text-[#183b63]" />
                                          <span>{isSavedOffline ? 'تحديث أوفلاين' : 'تحميل أوفلاين'}</span>
                                        </button>
                                      ) : (
                                        <span 
                                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-500 text-[11px] font-bold flex items-center gap-1 border border-slate-200" 
                                          title="المشاهدة أونلاين فقط متاحة لحسابك، والتنزيل أوفلاين غير مصرح به"
                                        >
                                          <Eye className="w-3 h-3 text-blue-600" />
                                          <span>مشاهدة فقط</span>
                                        </span>
                                      )}

                                      <button
                                        onClick={() => {
                                          setSelectedSemesterId(sem.id);
                                          setSelectedLectureId(lecture.id);
                                          setLectureStudyMode('attendance');
                                        }}
                                        className="px-4 py-2 rounded-xl bg-[#183b63] hover:bg-[#122e4e] text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                      >
                                        <Play className="w-3.5 h-3.5" />
                                        <span>حضور المحاضرة</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* TAB 2: SEPARATED PDF READING & DOWNLOADING */}
                  {courseStudyMode === 'documents' && (
                    <div className="space-y-4">
                      
                      {/* PDF Header & Batch Download */}
                      <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
                            <FileText className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-black text-slate-900">
                                مكتبة مذكرات وملفات الـ PDF الدراسية
                              </h4>
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                                منفصلة للقراءة والتنزيل
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              اقرأ المذكرات الدراسية مباشرة داخل القارئ الإلكتروني المريح أو قم بتنزيلها كملفات PDF إلى جهازك.
                            </p>
                          </div>
                        </div>

                        {/* Download All PDFs Button */}
                        {canDownloadFiles && allCourseFiles.length > 0 && (
                          <button
                            onClick={() => handleDownloadAllCoursePdfs(activeCourse)}
                            className="px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-2 cursor-pointer self-start sm:self-auto shrink-0"
                            title="تنزيل جميع مذكرات المقرر دفعة واحدة"
                          >
                            <DownloadCloud className="w-4 h-4" />
                            <span>تنزيل كافة مذكرات المقرر (PDF)</span>
                          </button>
                        )}
                      </div>

                      {/* PDF Documents List */}
                      {allCourseFiles.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                            <FileText className="w-7 h-7" />
                          </div>
                          <h5 className="font-extrabold text-sm text-slate-700">لا توجد مذكرات PDF مرفوعة لهذا المقرر حالياً</h5>
                          <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            يقوم الكادر التدريسي بتجهيز المذكرات والملازم المعتمدة وستظهر هنا فور اعتمادها.
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          {allCourseFiles.map((item, idx) => (
                            <div 
                              key={`${item.lectureId}-${item.file.id}-${idx}`}
                              className="bg-white p-4.5 rounded-2xl border border-slate-200 hover:border-rose-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3.5 group"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 group-hover:scale-105 transition-transform">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                      {item.semesterName} • المحاضرة {item.lectureNumber}
                                    </span>
                                    <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-50 px-1.5 py-0.5 rounded-md">
                                      {item.file.fileSize}
                                    </span>
                                  </div>
                                  <h5 className="text-sm font-extrabold text-[#0f2942] mt-1.5 truncate">
                                    {item.file.name}
                                  </h5>
                                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                    المحاضرة: {item.lectureTitle}
                                  </p>
                                </div>
                              </div>

                              {/* Separate Actions: Read PDF vs Download PDF */}
                              <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100">
                                <button
                                  onClick={() => setReadingFile({
                                    file: item.file,
                                    lectureTitle: item.lectureTitle,
                                    courseTitle: activeCourse.title
                                  })}
                                  className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-blue-200"
                                  title="قراءة المذكرة إلكترونياً مع أدوات التكبير والوضع الليلي"
                                >
                                  <Eye className="w-4 h-4 text-blue-700" />
                                  <span>قراءة المذكرة (PDF)</span>
                                </button>

                                {canDownloadFiles ? (
                                  <button
                                    onClick={() => handleDownloadFile(item.file, item.lectureTitle, activeCourse.title)}
                                    className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-800 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                                    title="تنزيل الملف إلى جهازك"
                                  >
                                    <DownloadCloud className="w-4 h-4" />
                                    <span>تنزيل</span>
                                  </button>
                                ) : (
                                  <span className="px-2.5 py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-bold flex items-center gap-1 border border-slate-200" title="خاصية تنزيل الملفات محظورة من الإدارة">
                                    <Lock className="w-3 h-3" />
                                    <span>تنزيل مقيد</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  )}

                </div>
              );
            })()}

            {/* LEVEL 3: LECTURE DETAILS WITH SEPARATED ATTENDANCE/OFFLINE & PDF READING/DOWNLOAD */}
            {activeCourse && activeLecture && (
              <div className="space-y-5">
                
                {/* Lecture Title Bar */}
                <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[#244260] block">
                      {activeCourse.title} • {activeSemester?.name}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-[#0f2942]">
                      {activeLecture.title}
                    </h3>
                    <p className="text-xs text-slate-600 max-w-2xl">{activeLecture.description}</p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    {/* Quick Button to Switch to PDF or Attendance */}
                    {activeLecture.files.length > 0 && (
                      <button
                        onClick={() => setLectureStudyMode(lectureStudyMode === 'attendance' ? 'documents' : 'attendance')}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                          lectureStudyMode === 'documents'
                            ? 'bg-[#183b63] text-white border-[#183b63]'
                            : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {lectureStudyMode === 'attendance' ? (
                          <>
                            <FileText className="w-4 h-4" />
                            <span>عرض مذكرات الـ PDF ({activeLecture.files.length})</span>
                          </>
                        ) : (
                          <>
                            <Video className="w-4 h-4" />
                            <span>العودة لمشاهدة الفيديو والحضور</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Real Offline Download Button or View Only Notice */}
                    {allowOffline ? (
                      <button
                        onClick={() => handleDownloadLectureOffline(activeLecture, activeCourse.title, activeSemester?.name || '')}
                        disabled={downloadingLectureId === activeLecture.id}
                        className="px-4 py-2 rounded-xl bg-[#183b63] hover:bg-[#122e4e] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs shrink-0"
                      >
                        <DownloadCloud className="w-4 h-4" />
                        <span>
                          {isLectureSavedOffline(student.id, activeLecture.id) 
                            ? 'تحديث الحقيبة أوفلاين' 
                            : 'تحميل المحاضرة أوفلاين'}
                        </span>
                      </button>
                    ) : (
                      <span 
                        className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 text-xs font-bold flex items-center gap-1.5 shrink-0" 
                        title="حسابك مصرح له بالمشاهدة المباشرة فقط، ولا يحق له التنزيل أوفلاين"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>مشاهدة أونلاين فقط (التنزيل أوفلاين ملغى)</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub-Tabs: Attendance & Offline vs PDF Reading & Download */}
                <div className="bg-slate-200/80 p-1.5 rounded-2xl flex items-center gap-1.5 border border-slate-300/70 shadow-2xs">
                  <button
                    onClick={() => setLectureStudyMode('attendance')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      lectureStudyMode === 'attendance'
                        ? 'bg-[#183b63] text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>حضور المحاضرة وتنزيل أوفلاين</span>
                  </button>

                  <button
                    onClick={() => setLectureStudyMode('documents')}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      lectureStudyMode === 'documents'
                        ? 'bg-rose-700 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>قراءة مذكرات المحاضرة وتنزيلها (PDF)</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      lectureStudyMode === 'documents' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {activeLecture.files.length}
                    </span>
                  </button>
                </div>

                {/* SUB-SECTION 1: ATTENDANCE & OFFLINE */}
                {lectureStudyMode === 'attendance' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    
                    {/* Main: Video Player */}
                    <div className="lg:col-span-2 space-y-4">
                      
                      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-sm text-[#0f2942] flex items-center gap-2">
                            <Video className="w-4 h-4 text-[#183b63]" />
                            <span>مشاهدة شرح المحاضرة المباشر</span>
                          </h4>
                          <span className="text-xs text-slate-500 font-medium">المدة: {activeLecture.duration}</span>
                        </div>

                        {canAttendLectures ? (
                          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 shadow-sm relative">
                            <video
                              src={activeLecture.videoUrl}
                              controls
                              className="w-full h-full object-cover"
                            >
                              متصفحك لا يدعم تشغيل الفيديو المباشر.
                            </video>
                          </div>
                        ) : (
                          <div className="aspect-video w-full rounded-2xl bg-slate-100 border-2 border-dashed border-amber-300 flex flex-col items-center justify-center p-6 text-center space-y-2">
                            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                              <Lock className="w-6 h-6" />
                            </div>
                            <h5 className="font-black text-slate-800 text-sm">
                              خاصية حضور المحاضرات ومشاهدة الفيديو غير مفعلة
                            </h5>
                            <p className="text-xs text-slate-500 max-w-sm">
                              وفق توجيهات إدارة المركز، لم يتم منح الإذن لحسابك لحضور المحاضرات المباشرة. يرجى التواصل مع الإدارة أو مراجعة سداد الرسوم.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Lesson Key Highlights Box */}
                      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                        <h4 className="font-extrabold text-sm text-[#0f2942] flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-[#183b63]" />
                          <span>محاور وأهداف الدرس الأكاديمي</span>
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {activeLecture.description || 'تم تصميم هذه المحاضرة لتزويد الطالب بالمعارف والمهارات اللازمة لتطبيق المبادئ الأكاديمية وحل التمارين التخصصية المعتمدة في مركز المستقبل.'}
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-[#183b63] shrink-0" />
                            <span>شرح عملي ومفصل لكافة المفردات الأكاديمية</span>
                          </div>
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2 text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-[#183b63] shrink-0" />
                            <span>مذكرات PDF وبنوك أسئلة مخصصة في تبويب المذكرات</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Sidebar: Attendance Management & Offline */}
                    <div className="space-y-4">
                      
                      {/* Offline Download Box */}
                      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                        <h4 className="font-extrabold text-sm text-[#0f2942] flex items-center gap-2">
                          <DownloadCloud className="w-4 h-4 text-[#183b63]" />
                          <span>الدراسة بدون إنترنت (أوفلاين)</span>
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          يمكنك حفظ هذه المحاضرة بكافة بياناتها وملاحظاتها في ذاكرة متصفحك للدراسة في حال انقطاع الإنترنت.
                        </p>

                        {allowOffline ? (
                          <button
                            onClick={() => handleDownloadLectureOffline(activeLecture, activeCourse.title, activeSemester?.name || '')}
                            disabled={downloadingLectureId === activeLecture.id}
                            className="w-full py-2.5 px-3 rounded-xl bg-[#183b63] hover:bg-[#122e4e] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
                          >
                            <DownloadCloud className="w-4 h-4" />
                            <span>
                              {isLectureSavedOffline(student.id, activeLecture.id) 
                                ? 'تحديث النسخة الأوفلاين' 
                                : 'تنزيل المحاضرة أوفلاين'}
                            </span>
                          </button>
                        ) : (
                          <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-200 flex items-center gap-2">
                            <Lock className="w-4 h-4 shrink-0" />
                            <span>التنزيل أوفلاين غير مصرح لحسابك حالياً.</span>
                          </div>
                        )}
                      </div>

                      {/* Quick Switch to PDF Banner */}
                      {activeLecture.files.length > 0 && (
                        <div className="bg-gradient-to-br from-rose-50 to-orange-50 p-5 rounded-3xl border border-rose-200 shadow-xs space-y-2.5">
                          <div className="flex items-center gap-2 text-rose-800 font-extrabold text-xs">
                            <FileText className="w-4 h-4" />
                            <span>مذكرات المحاضرة المرفقة</span>
                          </div>
                          <p className="text-xs text-rose-900/80 leading-relaxed">
                            يتوفر لهذه المحاضرة {activeLecture.files.length} ملفات ومذكرات دراسية جاهزة للقراءة الإلكترونية والتنزيل.
                          </p>
                          <button
                            onClick={() => setLectureStudyMode('documents')}
                            className="w-full py-2 px-3 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <Eye className="w-4 h-4" />
                            <span>الانتقال لقراءة وتنزيل المذكرات</span>
                          </button>
                        </div>
                      )}

                      {/* Quick Task Checkbox for this lecture */}
                      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
                        <h4 className="font-extrabold text-sm text-[#0f2942] flex items-center gap-2">
                          <CheckSquare className="w-4 h-4 text-[#183b63]" />
                          <span>متابعة إنجاز المحاضرة</span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          سجّل إتمامك للمحاضرة لتنظيم جدول دراستك:
                        </p>

                        <button
                          onClick={() => toggleTask(`task-${activeLecture.id}`)}
                          className={`w-full p-3 rounded-2xl border text-xs font-bold flex items-center justify-between cursor-pointer transition-all ${
                            completedTasks[`task-${activeLecture.id}`]
                              ? 'bg-[#f0f4f8] border-[#d2dfec] text-[#183b63]'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            {completedTasks[`task-${activeLecture.id}`] ? (
                              <CheckSquare className="w-4 h-4 text-[#183b63]" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                            <span>تم إكمال ودراسة هذه المحاضرة</span>
                          </span>
                          <span className="text-[10px] font-semibold">
                            {completedTasks[`task-${activeLecture.id}`] ? 'مكتملة' : 'غير مكتملة'}
                          </span>
                        </button>
                      </div>

                    </div>

                  </div>
                )}

                {/* SUB-SECTION 2: DEDICATED PDF READING & DOWNLOADING */}
                {lectureStudyMode === 'documents' && (
                  <div className="space-y-4">
                    
                    {/* Header Card */}
                    <div className="bg-white p-5 rounded-3xl border border-rose-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-slate-900">
                            مذكرات وملفات المحاضرة ({activeLecture.title})
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            اقرأ المذكرات مباشرة أو قم بتنزيلها إلى جهازك كملفات PDF بصيغة واضحة وعالية الدقة.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setLectureStudyMode('attendance')}
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Video className="w-4 h-4 text-[#183b63]" />
                          <span>مشاهدة الفيديو</span>
                        </button>
                      </div>
                    </div>

                    {/* PDF Files Grid */}
                    {activeLecture.files.length === 0 ? (
                      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                          <FileText className="w-7 h-7" />
                        </div>
                        <h5 className="font-extrabold text-sm text-slate-700">لا توجد ملفات PDF مرفقة بهذه المحاضرة</h5>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          سيتم إدراج المذكرات والملازم المعتمدة للمحاضرة قريباً فور الانتهاء من مراجعتها.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeLecture.files.map((file) => (
                          <div
                            key={file.id}
                            className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-rose-300 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-4 group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 group-hover:scale-105 transition-transform">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-800 px-2 py-0.5 rounded-md">
                                    {file.fileSize}
                                  </span>
                                  <span className="text-[10px] text-slate-400">ملف دراسي موثق</span>
                                </div>
                                <h5 className="text-sm font-extrabold text-[#0f2942] mt-1.5 truncate">
                                  {file.name}
                                </h5>
                                <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                  شامل للشروحات والرسومات التوضيحية وبنك الأسئلة الخاص بمحاضرة {activeLecture.title}.
                                </p>
                              </div>
                            </div>

                            {/* Separated Actions: Read PDF vs Download PDF */}
                            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                              <button
                                onClick={() => setReadingFile({
                                  file,
                                  lectureTitle: activeLecture.title,
                                  courseTitle: activeCourse.title
                                })}
                                className="flex-1 py-2.5 px-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer border border-blue-200"
                                title="قراءة المذكرة بالكامل مع أدوات التكبير والقراءة المريحة"
                              >
                                <Eye className="w-4 h-4 text-blue-700" />
                                <span>قراءة المذكرة (PDF)</span>
                              </button>

                              {canDownloadFiles ? (
                                <button
                                  onClick={() => handleDownloadFile(file, activeLecture.title, activeCourse.title)}
                                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-800 text-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                                  title="تنزيل ملف الـ PDF إلى جهازك"
                                >
                                  <DownloadCloud className="w-4 h-4" />
                                  <span>تنزيل</span>
                                </button>
                              ) : (
                                <span className="px-3 py-2.5 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-bold flex items-center gap-1 border border-slate-200" title="خاصية تنزيل الملفات محظورة لحسابك">
                                  <Lock className="w-3.5 h-3.5" />
                                  <span>تنزيل مقيد</span>
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!canDownloadFiles && (
                      <p className="text-xs text-amber-800 bg-amber-50 p-3.5 rounded-2xl border border-amber-200 flex items-center gap-2">
                        <Lock className="w-4 h-4 shrink-0 text-amber-700" />
                        <span>🔒 تنبيه: خاصية تنزيل الملفات غير مصرح بها لحسابك حالياً من قِبل إدارة المركز، ولكن يمكنك قراءة المذكرات مباشرة.</span>
                      </p>
                    )}

                  </div>
                )}

              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB: PDF LIBRARY (قراءة وتنزيل مذكرات الـ PDF خارج الأوفلاين) */}
        {/* ========================================================================= */}
        {activeTab === 'pdf-library' && (
          <div className="space-y-5">
            
            {/* PDF Library Header Card */}
            <div className="bg-gradient-to-r from-rose-900 via-rose-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-sm border border-rose-800/40 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500/30 text-rose-200 text-[11px] font-bold border border-rose-400/30">
                      مستقلة بالكامل عن الأوفلاين
                    </span>
                    <span className="text-xs text-rose-200 font-mono">
                      {allStudentPdfNotes.length} مذكرات وملفات PDF معتمدة
                    </span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black">
                    مكتبة مذكرات وملفات الـ PDF الدراسية
                  </h3>
                  <p className="text-xs sm:text-sm text-rose-100/90 max-w-2xl leading-relaxed">
                    اقرأ المذكرات والملازم المعتمدة إلكترونياً بدقة عالية أو حمّلها مباشرة كملفات PDF إلى جهازك، 
                    <strong className="text-white font-black underline decoration-rose-400 underline-offset-4 mr-1">
                      بشكل مستقل تماماً خارج نظام الأوفلاين ودون الحاجة لتفعيل الأوفلاين.
                    </strong>
                  </p>
                </div>

                {canDownloadFiles && assignedCourses.length > 0 && (
                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    <button
                      onClick={() => {
                        assignedCourses.forEach(c => handleDownloadAllCoursePdfs(c));
                      }}
                      className="px-4 py-2.5 rounded-2xl bg-white text-rose-950 font-black text-xs hover:bg-rose-50 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                      title="تنزيل جميع المذكرات لكافة مقرراتك المعتمدة"
                    >
                      <DownloadCloud className="w-4 h-4 text-rose-700" />
                      <span>تنزيل كافة مذكرات المواد (PDF)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Offline Separation Explanatory Notice */}
            <div className="bg-blue-50/90 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-950">
              <div className="flex items-center gap-2.5">
                <Info className="w-5 h-5 text-blue-700 shrink-0" />
                <p className="leading-relaxed">
                  <strong>تأكيد الفصل والاستقلالية:</strong> قراءة وتنزيل ملفات الـ PDF تعمل بشكل مباشر على أي متصفح وجهاز، وتظل متاحة حتى لو قامت الإدارة بإيقاف تنزيل محاضرات الأوفلاين.
                </p>
              </div>
              <span className="px-2.5 py-1 bg-white text-blue-800 rounded-xl font-bold border border-blue-200 shrink-0 text-center">
                قراءة + تنزيل مباشر
              </span>
            </div>

            {/* Search and Course Filters */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={pdfSearchQuery}
                    onChange={(e) => setPdfSearchQuery(e.target.value)}
                    placeholder="ابحث باسم المذكرة، المحاضرة، أو اسم المقرر..."
                    className="w-full pr-9 pl-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:border-rose-600 bg-slate-50/50"
                  />
                  {pdfSearchQuery && (
                    <button
                      onClick={() => setPdfSearchQuery('')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      مسح
                    </button>
                  )}
                </div>

                <div className="text-xs text-slate-500 font-bold shrink-0">
                  عرض {filteredStudentPdfNotes.length} من أصل {allStudentPdfNotes.length} مذكرة
                </div>
              </div>

              {/* Course Selector Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setPdfCourseFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                    pdfCourseFilter === 'all'
                      ? 'bg-rose-700 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  كافة المواد ({allStudentPdfNotes.length})
                </button>
                {assignedCourses.map(course => {
                  const coursePdfsCount = allStudentPdfNotes.filter(n => n.courseId === course.id).length;
                  return (
                    <button
                      key={course.id}
                      onClick={() => setPdfCourseFilter(course.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                        pdfCourseFilter === course.id
                          ? 'bg-rose-700 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{course.title}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                        pdfCourseFilter === course.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {coursePdfsCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PDF Notes Cards Grid */}
            {filteredStudentPdfNotes.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
                  <FileText className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-black text-[#0f2942]">لا توجد مذكرات تطابق بحثك</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  {pdfSearchQuery 
                    ? 'جرّب كتابة كلمات بحث أخرى أو إزالة التصفية لعرض كافة المذكرات المتاحة.'
                    : 'لم يتم العثور على مذكرات PDF في المقررات المحددة.'}
                </p>
                {(pdfSearchQuery || pdfCourseFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setPdfSearchQuery('');
                      setPdfCourseFilter('all');
                    }}
                    className="mt-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    إعادة ضبط البحث والتصفية
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudentPdfNotes.map((item, idx) => (
                  <div
                    key={`${item.courseId}-${item.lectureId}-${item.file.id}-${idx}`}
                    className="bg-white rounded-3xl border border-slate-200 hover:border-rose-300 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
                  >
                    <div className="space-y-3">
                      {/* Course and Lecture Tags */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-900 text-[10px] font-bold border border-blue-200 truncate">
                          {item.courseTitle}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md shrink-0">
                          {item.file.fileSize || 'PDF'}
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 group-hover:scale-105 transition-transform">
                          <FileText className="w-6 h-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-extrabold text-sm text-[#0f2942] group-hover:text-rose-950 transition-colors line-clamp-2">
                            {item.file.name}
                          </h5>
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                            {item.semesterName} • المحاضرة {item.lectureNumber}: {item.lectureTitle}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Read PDF (Direct) & Download PDF (Direct) */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => setReadingFile({
                          file: item.file,
                          lectureTitle: item.lectureTitle,
                          courseTitle: item.courseTitle
                        })}
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-blue-200"
                        title="قراءة المذكرة إلكترونياً مع وضع القراءة المريح والتكبير"
                      >
                        <Eye className="w-4 h-4 text-blue-700" />
                        <span>قراءة المذكرة (PDF)</span>
                      </button>

                      {canDownloadFiles ? (
                        <button
                          onClick={() => handleDownloadFile(item.file, item.lectureTitle, item.courseTitle)}
                          className="py-2 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-900 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200"
                          title="تنزيل الملف كـ PDF لجهازك"
                        >
                          <Download className="w-4 h-4 text-rose-700" />
                          <span>تنزيل</span>
                        </button>
                      ) : (
                        <span 
                          className="px-2.5 py-2 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-bold flex items-center gap-1 border border-slate-200"
                          title="تنزيل الملفات محظور من الإدارة"
                        >
                          <Lock className="w-3 h-3" />
                          <span>تنزيل مقيد</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: SHAM CASH PAYMENT (Prompt Requirement: قسم الدفع وشام كاش) */}
        {/* ========================================================================= */}
        {activeTab === 'payment' && (
          <div className="space-y-5">
            
            {/* Payment Header & Sham Cash Code Card */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-md border border-blue-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-blue-800/80 pb-5">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[10px] font-bold border border-blue-400/30">
                    بوابة الدفع الإلكتروني المعتمدة
                  </span>
                  <h3 className="text-2xl font-black mt-1">الدفع عبر تطبيق شام كاش (Sham Cash)</h3>
                  <p className="text-xs text-blue-200 mt-1 max-w-xl">
                    يمكنك سداد رسوم المواد والبرامج التعليمية فوراً بمسح الباركود أو التحويل المباشر لحساب المركز
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {siteSettings.shamCashBarcodeUrl ? (
                    <button
                      onClick={() => setShowBarcodeModal(true)}
                      className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer border border-white/20"
                    >
                      <QrCode className="w-4 h-4 text-emerald-300" />
                      <span>مسح الباركود</span>
                    </button>
                  ) : currentUser?.role === 'owner' ? (
                    <button
                      onClick={() => setShowOwnerBarcodeModal(true)}
                      className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-md"
                    >
                      <Upload className="w-4 h-4" />
                      <span>إضافة باركودك الشخصي</span>
                    </button>
                  ) : null}

                  <button
                    onClick={handleCopyShamCashCode}
                    className="px-5 py-2.5 rounded-2xl bg-white text-blue-950 font-black text-xs hover:bg-blue-50 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Copy className="w-4 h-4" />
                    <span>نسخ رقم الحساب</span>
                  </button>
                </div>
              </div>

              {/* Main Content: Info & Barcode Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Information Columns */}
                <div className="lg:col-span-8 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                      <span className="text-[11px] text-blue-300 block">رقم حساب شام كاش:</span>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xl font-black font-mono tracking-wider text-white">
                          {siteSettings.shamCashCode || '0987654321'}
                        </span>
                        <button
                          onClick={handleCopyShamCashCode}
                          className="p-1 rounded-lg text-blue-200 hover:text-white"
                          title="نسخ الرقم"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                      <span className="text-[11px] text-blue-300 block">اسم صاحب الحساب:</span>
                      <span className="text-sm font-bold text-white mt-1 block">
                        {siteSettings.shamCashReceiverName || 'مركز المستقبل التعليمي'}
                      </span>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                      <span className="text-[11px] text-blue-300 block">حالة التحويل:</span>
                      <span className="text-sm font-bold text-emerald-300 flex items-center gap-1.5 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        استقبال فوري 24/7
                      </span>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 text-xs text-blue-100 leading-relaxed">
                    <strong className="text-white">طريقة السداد: </strong>
                    {siteSettings.shamCashInstructions || 'يرجى تحويل رسوم المقررات عبر تطبيق شام كاش أو مسح رمز الباركود المعتمد المقابل، ثم تسجيل رقم العملية وإرفاق صورة الإشعار ليتم تفعيل المقررات لحسابك فوراً.'}
                  </div>
                </div>

                {/* Sham Cash Barcode / QR Section */}
                <div className="lg:col-span-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 flex flex-col items-center text-center">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-200 mb-2.5">
                    <QrCode className="w-4 h-4 text-emerald-300" />
                    <span>{siteSettings.shamCashBarcodeUrl ? 'باركود السداد المباشر (QR Code)' : 'التحويل المباشر عبر الحساب'}</span>
                  </div>

                  {siteSettings.shamCashBarcodeUrl ? (
                    <>
                      <div
                        onClick={() => setShowBarcodeModal(true)}
                        className="relative p-2 bg-white rounded-2xl shadow-lg cursor-pointer group hover:scale-[1.03] transition-transform"
                        title="انقر لتكبير الباركود والمسح"
                      >
                        <img
                          src={siteSettings.shamCashBarcodeUrl}
                          alt="باركود شام كاش المعتمد"
                          className="w-32 h-32 object-contain rounded-xl"
                        />
                        <div className="absolute inset-0 bg-blue-950/70 rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-bold transition-opacity gap-1">
                          <ZoomIn className="w-5 h-5 text-emerald-300" />
                          <span>تكبير ومسح الرمز</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full mt-3">
                        <button
                          type="button"
                          onClick={() => setShowBarcodeModal(true)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                          <span>تكبير</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDownloadBarcode}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>حفظ الرمز</span>
                        </button>
                      </div>
                      <span className="text-[10px] text-blue-300/80 mt-1.5">امسح الرمز عبر تطبيق شام كاش</span>
                    </>
                  ) : (
                    <div className="w-full flex flex-col items-center justify-center p-3 rounded-xl bg-white/5 border border-white/10 text-center space-y-2">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-blue-200">
                        <QrCode className="w-7 h-7" />
                      </div>
                      <span className="text-xs font-bold text-white block">
                        رقم الحساب: {siteSettings.shamCashCode || '0987654321'}
                      </span>
                      <p className="text-[11px] text-blue-200 leading-relaxed">
                        قم بالتحويل مباشرة عبر إدخال رقم الحساب في تطبيق شام كاش.
                      </p>

                      {currentUser?.role === 'owner' && (
                        <button
                          type="button"
                          onClick={() => setShowOwnerBarcodeModal(true)}
                          className="w-full mt-2 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>أنت المسؤول: أضف باركودك الشخصي</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              
              {/* Form: Submit Payment Receipt */}
              <form onSubmit={handleSubmitPayment} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Send className="w-5 h-5 text-blue-600" />
                  <h4 className="text-base font-black text-[#0c3250]">تسجيل إشعار تحويل جديد (تأكيد الدفع)</h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      المقررات المطلوب تفعيلها:
                    </label>
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 max-h-36 overflow-y-auto space-y-1.5">
                      {allSpecialtyCourses.map(crs => {
                        const isAssigned = student.allowedCourseIds?.includes(crs.id);
                        const isSelected = paymentForm.selectedCourses.includes(crs.id);
                        return (
                          <label
                            key={crs.id}
                            className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer ${
                              isSelected ? 'bg-blue-50 border-blue-300 font-bold' : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  const next = isSelected 
                                    ? paymentForm.selectedCourses.filter(id => id !== crs.id)
                                    : [...paymentForm.selectedCourses, crs.id];
                                  setPaymentForm({ ...paymentForm, selectedCourses: next });
                                }}
                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600"
                              />
                              <span>{crs.title}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isAssigned && (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                                  مفعل حالياً
                                </span>
                              )}
                              <span className="font-mono text-slate-500">{crs.price.toLocaleString()} ل.س</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">رقم عملية التحويل (المرجع):</label>
                      <input
                        type="text"
                        value={paymentForm.transactionNumber}
                        onChange={(e) => setPaymentForm({ ...paymentForm, transactionNumber: e.target.value })}
                        placeholder="مثال: SHAM-98765432"
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">المبلغ المحول (ل.س):</label>
                      <input
                        type="number"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        placeholder="مثال: 50000"
                        className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">ملاحظات إضافية:</label>
                    <textarea
                      value={paymentForm.notes}
                      onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                      placeholder="أية تفاصيل إضافية عن التحويل..."
                      rows={2}
                      className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>إرسال إشعار الدفع للتدقيق والتفعيل</span>
                </button>
              </form>

              {/* List: Previous Payment Requests & Status */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h4 className="text-base font-black text-[#0c3250]">سجل طلبات الدفع الخاصة بك</h4>
                  <span className="text-xs text-slate-500 font-bold font-mono">
                    {studentPaymentRequests.length} طلبات
                  </span>
                </div>

                {studentPaymentRequests.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 space-y-2 text-xs">
                    <Clock3 className="w-8 h-8 mx-auto text-slate-300" />
                    <p>لم تقم بإرسال أي إشعارات دفع عبر شام كاش حتى الآن.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {studentPaymentRequests.map(req => {
                      const statusMap = {
                        pending: { text: 'قيد المراجعة', bg: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock3 },
                        approved: { text: 'تم التفعيل بنجاح', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
                        rejected: { text: 'مرفوض', bg: 'bg-rose-50 text-rose-800 border-rose-200', icon: XCircle }
                      };
                      const statusInfo = statusMap[req.status] || statusMap.pending;
                      const StatusIcon = statusInfo.icon;

                      return (
                        <div key={req.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-slate-800">
                              #{req.transactionNumber}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${statusInfo.bg}`}>
                              <StatusIcon className="w-3 h-3" />
                              <span>{statusInfo.text}</span>
                            </span>
                          </div>

                          <div className="text-xs text-slate-600">
                            <span>المواد المطلوبة: <strong>{req.requestedCourseNames.join('، ')}</strong></span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 font-mono">
                            <span>{req.amount.toLocaleString()} ل.س</span>
                            <span>{req.date}</span>
                          </div>

                          {req.notes && req.status === 'rejected' && (
                            <p className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200">
                              سبب الرفض: {req.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: ABOUT CENTER (Prompt Requirement: قسم «حول المركز» في حساب الطالب) */}
        {/* ========================================================================= */}
        {activeTab === 'about' && (
          <div className="space-y-5">
            
            {/* About Center Hero */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                    الترخيص والاعتماد الأكاديمي
                  </span>
                  <h3 className="text-xl font-black text-[#0c3250] mt-0.5">
                    عن مركز المستقبل التعليمي والمهني
                  </h3>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {siteSettings.aboutCenterText || 
                  'مركز المستقبل هو صرح أكاديمي وتدريبي رائد، مرخص ومعتمد لتقديم برامج الدبلوم المتوسط والمهني، ودبلومات الدراسات العليا وماجستير التأهيل والتخصص، وفق أعلى معايير الجودة والتعليم التطبيقي المعاصر.'
                }
              </p>

              {/* Vision & Mission */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-xs text-[#0c3250] flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>رؤيتنا الأكاديمية:</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {siteSettings.vision || 'الريادة في التعليم المهني والتقني وإعداد خريجين متميزين قادرين على قيادة سوق العمل والمنافسة بقوة.'}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
                  <h4 className="font-bold text-xs text-[#0c3250] flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <span>رسالتنا:</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {siteSettings.mission || 'تقديم بيئة تعليمية متكاملة تجمع بين التأصيل النظري الرصين والتطبيق العملي الحديث مع توفير الدعم الأكاديمي المستمر.'}
                  </p>
                </div>
              </div>

              {/* Academic Goals */}
              <div className="space-y-2.5 pt-2">
                <h4 className="font-bold text-xs text-[#0c3250]">أهداف المركز الأكاديمية:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(siteSettings.goals && siteSettings.goals.length > 0 ? siteSettings.goals : [
                    'تأهيل الكوادر الشابة بمهارات الإدارة وتكنولوجيا المعلومات الحديثة',
                    'منح شهادات معتمدة معترف بها تسهم في الارتقاء الوظيفي',
                    'توفير منظومة تعليم إلكتروني متطورة تدعم الدراسة أوفلاين',
                    'ربط التعليم النظري بمتطلبات سوق العمل الفعلية والتطبيق الميداني'
                  ]).map((goal, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{goal}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Programs & Specialties Detailed Academic Guide - Redesigned Simple Card & Dropdown Hierarchy */}
            <div className="space-y-6">
              
              {/* Header Bar */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-[#0c3250] flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-600" />
                    <span>دليل الاختصاصات والمقررات المعتمدة في المركز</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    استكشف الاختصاصات المتاحة، نبذة عن كل فرع وأهميته في سوق العمل، وتعرّف على المقررات والمواد الدراسية المشمولة.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                  {/* Search input */}
                  <div className="relative min-w-[220px]">
                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={aboutSearchQuery}
                      onChange={(e) => setAboutSearchQuery(e.target.value)}
                      placeholder="ابحث عن اختصاص أو مادة..."
                      className="w-full pr-9 pl-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500 bg-slate-50/70"
                    />
                  </div>

                  {/* Expand / Collapse All */}
                  {(() => {
                    const allSpecsList = programs.flatMap(p => p.specialties);
                    return (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleExpandAllAbout(allSpecsList)}
                          className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          توسيع كافة المواد 📖
                        </button>
                        <button
                          type="button"
                          onClick={handleCollapseAllAbout}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
                        >
                          طي الكل
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* 1. واجهة الاختصاصات الرئيسية (الفرع) على شكل بطاقات أنيقة */}
              {(() => {
                const allSpecs = programs.flatMap(p => 
                  p.specialties.map(s => ({
                    ...s,
                    programTitle: p.title
                  }))
                );

                const q = aboutSearchQuery.trim().toLowerCase();
                const filteredSpecs = !q ? allSpecs : allSpecs.filter(s => 
                  s.name.toLowerCase().includes(q) ||
                  (s.overview && s.overview.toLowerCase().includes(q)) ||
                  (s.importance && s.importance.toLowerCase().includes(q)) ||
                  s.courses.some(c => c.title.toLowerCase().includes(q) || (c.importance && c.importance.toLowerCase().includes(q)))
                );

                if (filteredSpecs.length === 0) {
                  return (
                    <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center text-xs text-slate-400 space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                      <p>لم يتم العثور على اختصاصات تطابق عملية البحث.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 gap-6">
                    {filteredSpecs.map((spec) => {
                      const isExpanded = !!expandedAboutSpecIds[spec.id];

                      return (
                        <div 
                          key={spec.id}
                          className="bg-white rounded-3xl border border-slate-200 hover:border-blue-300 shadow-xs hover:shadow-md transition-all p-6 sm:p-8 space-y-5"
                        >
                          {/* Top Badge & Program */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl">
                              {spec.programTitle || 'دبلوم معتمد'}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">
                              {spec.courses.length} مواد مشمولة
                            </span>
                          </div>

                          {/* 🎓 الاختصاص: [اسم الاختصاص هنا - مثال: الأمن السيبراني] */}
                          <div className="space-y-1">
                            <h4 className="text-xl sm:text-2xl font-black text-[#0c3250] flex items-center gap-2">
                              <span className="text-blue-600">🎓</span>
                              <span>الاختصاص:</span>
                              <span className="text-blue-700">{spec.name}</span>
                            </h4>
                          </div>

                          {/* 🎯 نبذة عن الفرع: [وصف مختصر ومبسط للاختصاص] */}
                          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                            <div className="text-xs sm:text-sm font-black text-[#0c3250] flex items-center gap-1.5">
                              <span>🎯</span>
                              <span>نبذة عن الفرع:</span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                              {spec.overview || spec.visionAndGoal || 'اختصاص أكاديمي تطبيقي متكامل لإعداد الكوادر المؤهلة لسوق العمل.'}
                            </p>
                          </div>

                          {/* 🚀 أهمية هذا الاختصاص: [لماذا يختار الطالب هذا المجال؟ ما هي الفرص الوظيفية المستقبلية له؟] */}
                          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                            <div className="text-xs sm:text-sm font-black text-amber-900 flex flex-wrap items-center gap-1.5">
                              <span>🚀</span>
                              <span>أهمية هذا الاختصاص:</span>
                              <span className="text-[11px] text-amber-700 font-semibold">(لماذا يختار الطالب هذا المجال؟ ما هي الفرص الوظيفية المستقبلية له؟)</span>
                            </div>
                            <p className="text-xs sm:text-sm text-amber-950 leading-relaxed font-medium">
                              {spec.importance || 'يمنح هذا الاختصاص الطالب مهارات عملية عالية تؤهله مباشرة لسوق العمل وتفتح له فرصاً وظيفية واعدة برواتب مجزية.'}
                            </p>
                          </div>

                          {/* 👇 اضغط على الزر أدناه لاستكشاف المواد الدراسية */}
                          <div className="pt-2">
                            <p className="text-xs text-slate-500 font-bold mb-2 flex items-center gap-1">
                              <span>👇</span>
                              <span>اضغط على الزر أدناه لاستكشاف المواد الدراسية</span>
                            </p>

                            {/* [ 📖 عرض المواد الدراسية المشمولة ] (زر تفاعلي) */}
                            <button
                              type="button"
                              onClick={() => toggleAboutSpecExpand(spec.id)}
                              className={`w-full py-3.5 px-5 rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-xs ${
                                isExpanded
                                  ? 'bg-blue-700 text-white shadow-blue-200'
                                  : 'bg-gradient-to-r from-[#183b63] to-blue-700 hover:from-[#122e4e] hover:to-blue-800 text-white'
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

                          {/* 2. الواجهة المنسدلة للمواد (تظهر بعد الضغط على زر العرض) */}
                          {isExpanded && (
                            <div className="mt-4 pt-5 border-t border-slate-200 space-y-3.5 animate-in fade-in slide-in-from-top-2 duration-300">
                              
                              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                <h5 className="text-sm sm:text-base font-black text-[#0c3250] flex items-center gap-2">
                                  <span>📚</span>
                                  <span>قائمة المواد الدراسية المعتمدة:</span>
                                </h5>
                                <span className="text-xs text-slate-500 font-bold">
                                  إجمالي {spec.courses.length} مواد معتمدة
                                </span>
                              </div>

                              {spec.courses.length === 0 ? (
                                <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                  لم يتم إدراج مواد دراسية في هذا الاختصاص بعد.
                                </div>
                              ) : (
                                  <div className="space-y-2.5">
                                    {spec.courses.map((course, cIdx) => {
                                      const courseOrdinalLabel = getArabicCourseOrdinal(cIdx);

                                      return (
                                        <div
                                          key={course.id || cIdx}
                                          className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/90 border border-slate-200/90 hover:border-blue-300 hover:bg-white transition-all flex flex-wrap items-center justify-between gap-2 shadow-2xs"
                                        >
                                          {/* 📘 اسم المادة فقط */}
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm sm:text-base font-black text-blue-900">
                                              📘 {courseOrdinalLabel}: {course.title}
                                            </span>
                                          </div>
                                          {course.code && (
                                            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-lg bg-slate-200 text-slate-700">
                                              {course.code}
                                            </span>
                                          )}
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
                );
              })()}

            </div>

            {/* Contact & Support */}
            <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xs space-y-4">
              <h4 className="text-base font-black flex items-center gap-2">
                <Phone className="w-5 h-5 text-blue-400" />
                <span>التواصل والدعم الفني والأكاديمي</span>
              </h4>
              <p className="text-xs text-slate-300">
                فريق شؤون الطلاب وإدارة المركز في خدمتكم دائماً للإجابة عن أية استفسارات أو لتفعيل المقررات:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                <div className="p-3 bg-white/10 rounded-xl border border-white/15 flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-blue-300" />
                  <span>+963 11 234 5678</span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl border border-white/15 flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-blue-300" />
                  <span>support@futurecenter.edu</span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl border border-white/15 flex items-center gap-2.5">
                  <MapPin className="w-4 h-4 text-blue-300" />
                  <span>دمشق — المركز الرئيسي</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: OFFLINE SAVED LECTURES (المحملة أوفلاين) */}
        {/* ========================================================================= */}
        {activeTab === 'offline' && (
          <div className="space-y-4">
            
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <DownloadCloud className="w-5 h-5 text-[#183b63]" />
                  <h3 className="text-xl font-black text-[#0f2942]">المواد والمحاضرات المحملة أوفلاين</h3>
                </div>
                <p className="text-xs text-slate-600">
                  كافة المحاضرات والمذكرات المحفوظة على هذا الجهاز متاحة بالكامل للدراسة والمراجعة عند انقطاع الاتصال بالإنترنت.
                </p>
              </div>

              <span className="px-3 py-1.5 rounded-xl bg-[#f0f4f8] text-[#244260] font-bold text-xs border border-[#d2dfec] self-start sm:self-auto">
                {offlineLectures.length} محاضرات محفوظة
              </span>
            </div>

            {offlineLectures.length === 0 ? (
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <DownloadCloud className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-black text-[#0f2942]">لا توجد محاضرات محفوظة أوفلاين حتى الآن</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  يمكنك الدخول إلى أي محاضرة من تبويب <strong>«مقرراتي الدراسية»</strong> والضغط على زر <strong>«تحميل أوفلاين»</strong> لحفظها والوصول إليها هنا في أي وقت بدون إنترنت.
                </p>
                <button
                  onClick={() => setActiveTab('courses')}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-[#183b63] hover:bg-[#122e4e] text-white text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>تصفح مقرراتي الآن</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offlineLectures.map((lec) => (
                  <div
                    key={lec.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#f0f4f8] text-[#244260] text-[11px] font-bold border border-[#d2dfec]">
                          {lec.courseTitle}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          حُفظت: {lec.downloadedAt}
                        </span>
                      </div>

                      <h4 className="text-base font-black text-[#0f2942]">
                        {lec.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {lec.description}
                      </p>

                      <div className="pt-2 flex items-center gap-3 text-xs text-slate-400">
                        <span>المدة: {lec.duration}</span>
                        <span>•</span>
                        <span>{lec.files.length} ملفات مرفقة</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          downloadLectureDocument({
                            title: lec.title,
                            courseTitle: lec.courseTitle,
                            specialtyName: studentSpecialty?.name,
                            studentName: student.fullName,
                            academicId: student.academicIdNumber,
                            contentSummary: lec.description,
                            fileName: `${lec.title.replace(/[\/\s:]+/g, '_')}_أوفلاين.html`
                          });
                          addToast('success', `تم تنزيل الحقيبة الدراسية لـ "${lec.title}" إلى جهازك.`);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#183b63] hover:bg-[#122e4e] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>فتح / تنزيل الحقيبة (PDF)</span>
                      </button>

                      <button
                        onClick={(e) => handleRemoveOffline(lec.id, e)}
                        className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 text-xs font-bold transition-colors cursor-pointer"
                        title="إلغاء الحفظ من الجهاز"
                      >
                        حذف
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: TASKS & ASSIGNMENTS (المهام الدراسية) */}
        {/* ========================================================================= */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-[#183b63]" />
                  <h3 className="text-xl font-black text-[#0f2942]">المهام والواجبات الأكاديمية</h3>
                </div>
                <p className="text-xs text-slate-600">
                  قائمة الدروس والمحاضرات المطلوبة منك ضمن مقرراتك المخصصة لمتابعة تقدمك الدراسي بسهولة.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-3 py-1.5 rounded-xl bg-[#f0f4f8] text-[#244260] border border-[#d2dfec]">
                  المكتمل: {Object.values(completedTasks).filter(Boolean).length} / {studentTasks.length}
                </span>
              </div>
            </div>

            {studentTasks.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
                لا توجد مهام حالياً.
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-100">
                {studentTasks.map((task) => {
                  const isDone = !!completedTasks[task.id];

                  return (
                    <div
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`p-4 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isDone ? 'bg-[#f0f4f8]/60 text-slate-500' : 'hover:bg-slate-50/80 text-[#0f2942]'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <button
                          type="button"
                          className="shrink-0"
                        >
                          {isDone ? (
                            <CheckSquare className="w-5 h-5 text-[#183b63]" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300 hover:text-slate-500" />
                          )}
                        </button>
                        <div className="overflow-hidden">
                          <span className={`text-sm font-bold block truncate ${isDone ? 'line-through text-slate-400' : ''}`}>
                            {task.title}
                          </span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            {task.courseTitle} • {task.semName}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                        isDone ? 'bg-[#f0f4f8] text-[#183b63] border border-[#d2dfec]' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isDone ? 'تم الإنجاز' : 'قيد المتابعة'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>

      {/* SHAM CASH BARCODE ZOOM MODAL FOR STUDENTS */}
      {showBarcodeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <h4 className="text-base font-black text-[#0c3250]">رمز باركود شام كاش (QR)</h4>
              </div>
              <button
                onClick={() => setShowBarcodeModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-gradient-to-b from-slate-50 to-slate-100 p-5 rounded-2xl border border-slate-200 flex flex-col items-center justify-center">
              <img
                src={siteSettings.shamCashBarcodeUrl}
                alt="باركود شام كاش المعتمد"
                className="max-w-full max-h-[50vh] object-contain rounded-xl shadow-md bg-white p-2"
              />
              <span className="text-[11px] font-mono font-bold text-slate-600 mt-2 block">
                رقم الحساب: {siteSettings.shamCashCode || '0987654321'}
              </span>
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              <p className="font-bold text-slate-700">
                المستلم: {siteSettings.shamCashReceiverName || 'مركز المستقبل التعليمي'}
              </p>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                افتح تطبيق «شام كاش» في هاتفك وامسح هذا الرمز مباشرة عبر الكاميرا أو حمّل الصورة إلى معرض هاتفك واستوردها في التطبيق.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={handleDownloadBarcode}
                className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-blue-200"
              >
                <Download className="w-4 h-4" />
                <span>حفظ الرمز</span>
              </button>
              <button
                onClick={handleCopyShamCashCode}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
              >
                <Copy className="w-4 h-4" />
                <span>نسخ الرقم</span>
              </button>
            </div>

            <button
              onClick={() => setShowBarcodeModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Owner Upload Barcode Modal */}
      <UploadBarcodeModal
        isOpen={showOwnerBarcodeModal}
        onClose={() => setShowOwnerBarcodeModal(false)}
      />

      {/* Advanced PDF Reader Modal */}
      <PdfReaderModal
        isOpen={!!readingFile}
        onClose={() => setReadingFile(null)}
        file={readingFile?.file || null}
        lectureTitle={readingFile?.lectureTitle || ''}
        courseTitle={readingFile?.courseTitle || ''}
        studentName={student.fullName}
        academicId={student.academicIdNumber || student.id}
        canDownload={canDownloadFiles}
        onDownload={(file) => {
          if (readingFile) {
            handleDownloadFile(file, readingFile.lectureTitle, readingFile.courseTitle);
          }
        }}
      />

    </div>
  );
};
