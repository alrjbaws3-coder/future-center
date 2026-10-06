import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { StudentUser } from '../../types';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit3, 
  Trash2, 
  ShieldCheck, 
  Check, 
  X, 
  DownloadCloud, 
  BookOpen,
  Video,
  FileText,
  Layers,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Link,
  SlidersHorizontal,
  ChevronDown,
  Info,
  AlertCircle
} from 'lucide-react';

export const AdminStudents: React.FC = () => {
  const { 
    students, 
    programs, 
    addStudent, 
    updateStudent, 
    deleteStudent, 
    toggleStudentStatus,
    setStudentAllowedCourses,
    toggleStudentOfflinePermission,
    toggleStudentAttendancePermission,
    toggleStudentDownloadPermission,
    updateStudentPermissions,
    addToast
  } = usePlatform();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<StudentUser | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'permissions' | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentUser | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    password: 'password123',
    programId: programs[0]?.id || 'diploma-medium',
    specialtyId: programs[0]?.specialties[0]?.id || 'business-admin',
    branchId: programs[0]?.specialties[0]?.branches?.[0]?.id || 'br-ba-gen',
    allowedAcademicYears: [1] as (1 | 2)[],
    allowedSemesters: [1] as (1 | 2)[],
    allowedCourseIds: [] as string[],
    canAttendLectures: true,
    canDownloadFiles: true,
    allowOffline: true
  });

  // Filtered Students
  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.phone.includes(searchQuery) ||
    s.academicIdNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Active selections for form
  const formProgram = programs.find(p => p.id === formData.programId) || programs[0];
  const formSpecialty = formProgram?.specialties.find(s => s.id === formData.specialtyId) || formProgram?.specialties[0];
  const formBranches = formSpecialty?.branches || [
    { id: 'general', name: 'الفرع العام', code: 'GEN' }
  ];
  const availableCourses = formSpecialty?.courses || [];

  const openAddModal = () => {
    const firstProg = programs[0];
    const firstSpec = firstProg?.specialties[0];
    
    // Default allowed courses: year 1 semester 1 courses
    const defaultCourses = firstSpec?.courses
      .filter(c => (c.academicYear || 1) === 1 && (c.semesterTerm || 1) === 1)
      .map(c => c.id) || [];

    setFormData({
      username: '',
      fullName: '',
      email: '',
      phone: '',
      password: 'password123',
      programId: firstProg?.id || 'diploma-medium',
      specialtyId: firstSpec?.id || 'business-admin',
      branchId: '',
      allowedAcademicYears: [1],
      allowedSemesters: [1],
      allowedCourseIds: defaultCourses,
      canAttendLectures: true,
      canDownloadFiles: true,
      allowOffline: true
    });
    setModalMode('add');
  };

  const openEditModal = (student: StudentUser) => {
    setSelectedStudentForModal(student);
    setFormData({
      username: student.username,
      fullName: student.fullName,
      email: student.email,
      phone: student.phone,
      password: student.password || 'password123',
      programId: student.programId,
      specialtyId: student.specialtyId,
      branchId: '',
      allowedAcademicYears: student.allowedAcademicYears || [1],
      allowedSemesters: student.allowedSemesters || [1],
      allowedCourseIds: student.allowedCourseIds || [],
      canAttendLectures: student.canAttendLectures !== false,
      canDownloadFiles: student.canDownloadFiles !== false,
      allowOffline: student.allowOffline
    });
    setModalMode('edit');
  };

  const openPermissionsModal = (student: StudentUser) => {
    setSelectedStudentForModal(student);
    setFormData({
      username: student.username,
      fullName: student.fullName,
      email: student.email,
      phone: student.phone,
      password: student.password || 'password123',
      programId: student.programId,
      specialtyId: student.specialtyId,
      branchId: '',
      allowedAcademicYears: student.allowedAcademicYears || [1, 2],
      allowedSemesters: student.allowedSemesters || [1, 2],
      allowedCourseIds: student.allowedCourseIds || [],
      canAttendLectures: student.canAttendLectures !== false,
      canDownloadFiles: student.canDownloadFiles !== false,
      allowOffline: student.allowOffline
    });
    setModalMode('permissions');
  };

  // Toggle individual course
  const handleToggleCoursePermission = (courseId: string) => {
    setFormData(prev => {
      const exists = prev.allowedCourseIds.includes(courseId);
      const next = exists 
        ? prev.allowedCourseIds.filter(id => id !== courseId)
        : [...prev.allowedCourseIds, courseId];
      return { ...prev, allowedCourseIds: next };
    });
  };

  // Toggle Year permission
  const handleToggleYear = (year: 1 | 2) => {
    setFormData(prev => {
      const exists = prev.allowedAcademicYears.includes(year);
      const nextYears = exists 
        ? prev.allowedAcademicYears.filter(y => y !== year)
        : [...prev.allowedAcademicYears, year];
      
      // If deactivating a year, optionally remove its courses
      let nextCourses = [...prev.allowedCourseIds];
      if (exists) {
        const yearCourses = availableCourses.filter(c => (c.academicYear || 1) === year).map(c => c.id);
        nextCourses = nextCourses.filter(id => !yearCourses.includes(id));
      } else {
        // When activating a year, add its courses for active semesters
        const toAdd = availableCourses
          .filter(c => (c.academicYear || 1) === year && prev.allowedSemesters.includes((c.semesterTerm || 1) as 1 | 2))
          .map(c => c.id);
        nextCourses = Array.from(new Set([...nextCourses, ...toAdd]));
      }

      return { 
        ...prev, 
        allowedAcademicYears: nextYears,
        allowedCourseIds: nextCourses
      };
    });
  };

  // Toggle Semester permission
  const handleToggleSemester = (term: 1 | 2) => {
    setFormData(prev => {
      const exists = prev.allowedSemesters.includes(term);
      const nextSemesters = exists
        ? prev.allowedSemesters.filter(s => s !== term)
        : [...prev.allowedSemesters, term];

      let nextCourses = [...prev.allowedCourseIds];
      if (exists) {
        const termCourses = availableCourses.filter(c => (c.semesterTerm || 1) === term).map(c => c.id);
        nextCourses = nextCourses.filter(id => !termCourses.includes(id));
      } else {
        const toAdd = availableCourses
          .filter(c => (c.semesterTerm || 1) === term && prev.allowedAcademicYears.includes((c.academicYear || 1) as 1 | 2))
          .map(c => c.id);
        nextCourses = Array.from(new Set([...nextCourses, ...toAdd]));
      }

      return {
        ...prev,
        allowedSemesters: nextSemesters,
        allowedCourseIds: nextCourses
      };
    });
  };

  // Select / Deselect all courses for a specific year and term
  const handleToggleBatchCourses = (year: 1 | 2, term: 1 | 2, select: boolean) => {
    const targetCourses = availableCourses
      .filter(c => (c.academicYear || 1) === year && (c.semesterTerm || 1) === term)
      .map(c => c.id);

    setFormData(prev => {
      let updated: string[];
      if (select) {
        updated = Array.from(new Set([...prev.allowedCourseIds, ...targetCourses]));
      } else {
        updated = prev.allowedCourseIds.filter(id => !targetCourses.includes(id));
      }
      return { ...prev, allowedCourseIds: updated };
    });
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <h3 className="text-xl font-black text-[#0c3250]">إدارة حسابات وصلاحيات الطلاب</h3>
          </div>
          <p className="text-xs text-[#595e65] mt-1">
            التحكم الهرمي بالصلاحيات: الاختصاص ← الفرع ← السنة الدراسية ← الفصل ← المواد، مع ضبط حضور المحاضرات وتنزيل الملفات
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>إضافة طالب جديد</span>
        </button>
      </div>

      {/* Student Direct Login Link Box */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-slate-50 p-4 rounded-2xl border border-blue-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Link className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-[#0c3250]">رابط تسجيل دخول الطلاب المعتمد</h4>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.2 rounded-full font-bold">مباشر إلى صفحة الدخول</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">انسخ هذا الرابط وأعطه للطلاب ليفتح لهم صفحة تسجيل الدخول مباشرة:</p>
            <div className="mt-1">
              <code className="text-xs font-mono font-bold text-blue-700 bg-white px-2.5 py-1 rounded-lg border border-blue-200 inline-block dir-ltr select-all shadow-2xs">
                {typeof window !== 'undefined' ? `${window.location.origin}/login` : '/login'}
              </code>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const url = `${window.location.origin}/login`;
            navigator.clipboard.writeText(url);
            addToast('success', `تم نسخ رابط تسجيل دخول الطلاب بنجاح: ${url}`);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-colors shrink-0 w-full sm:w-auto justify-center"
        >
          <Copy className="w-4 h-4" />
          <span>نسخ رابط الطلاب</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="البحث باسم الطالب، اسم المستخدم، رقم الهاتف، أو الرقم الأكاديمي..."
          className="w-full pr-11 pl-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs focus:border-blue-600 focus:outline-hidden shadow-2xs"
        />
      </div>

      {/* Students Table / Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
              <tr>
                <th className="py-3.5 px-4">بيانات الطالب</th>
                <th className="py-3.5 px-4">الاختصاص والفرع</th>
                <th className="py-3.5 px-4">السنوات والفصول المفعلة</th>
                <th className="py-3.5 px-4">المقررات المفعلة</th>
                <th className="py-3.5 px-4 text-center">حضور المحاضرات</th>
                <th className="py-3.5 px-4 text-center">تنزيل الملفات</th>
                <th className="py-3.5 px-4 text-center">تنزيل الأوفلاين</th>
                <th className="py-3.5 px-4 text-center">الحالة</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-400">
                    لم يتم العثور على أي طلاب مطابقين للبحث.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const studentProg = programs.find(p => p.id === student.programId);
                  const studentSpec = studentProg?.specialties.find(s => s.id === student.specialtyId);

                  const canAttend = student.canAttendLectures !== false;
                  const canDownload = student.canDownloadFiles !== false;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Student Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-black text-[#0c3250] text-sm">{student.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          @{student.username} • {student.academicIdNumber}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">{student.phone}</div>
                      </td>

                      {/* Program & Specialty */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0c3250]">{studentSpec?.name || 'غير محدد'}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{studentProg?.title}</div>
                      </td>

                      {/* Allowed Years & Semesters */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(student.allowedAcademicYears || [1]).map(yr => (
                            <span key={yr} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
                              س{yr}
                            </span>
                          ))}
                          {(student.allowedSemesters || [1]).map(sem => (
                            <span key={sem} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                              ف{sem}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Allowed Courses Badge & Button */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs border border-blue-200">
                            {student.allowedCourseIds?.length || 0} مواد مفعلة
                          </span>
                          <button
                            onClick={() => openPermissionsModal(student)}
                            className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                            title="إدارة وتعديل الصلاحيات بالتسلسل الهرمي"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                      {/* Attendance Permission Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => toggleStudentAttendancePermission(student.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                            canAttend
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                          title="التحكم بالسماح بحضور المحاضرات ومشاهدة الفيديو"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>{canAttend ? 'متاح' : 'محظور'}</span>
                        </button>
                      </td>

                      {/* File Download Permission Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => toggleStudentDownloadPermission(student.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 ${
                            canDownload
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                          title="التحكم بالسماح بتنزيل الملفات والمذكرات الدراسية PDF"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{canDownload ? 'متاح' : 'محظور'}</span>
                        </button>
                      </td>

                      {/* Offline Permission Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => toggleStudentOfflinePermission(student.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                            student.allowOffline
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 shadow-2xs'
                              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                          }`}
                          title={student.allowOffline 
                            ? 'مسموح بتنزيل المحاضرات أوفلاين (انقر للإلغاء وقصر الحساب على المشاهدة فقط)' 
                            : 'التنزيل ملغى - الطالب يملك حق المشاهدة فقط (انقر للسماح بالتنزيل أوفلاين)'}
                        >
                          <DownloadCloud className="w-3.5 h-3.5" />
                          <span>{student.allowOffline ? 'تنزيل ومُشاهدة' : 'مشاهدة فقط (ممنوع التنزيل)'}</span>
                        </button>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => toggleStudentStatus(student.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                            student.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                        >
                          {student.status === 'active' ? 'نشط' : 'موقوف'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              const origin = window.location.origin;
                              const firstCourseId = student.allowedCourseIds?.[0];
                              const directLink = firstCourseId ? `${origin}/?courseId=${firstCourseId}` : origin;
                              const text = `🎓 بيانات حسابك الأكاديمي الرسمي في مركز المستقبل:\n• الاسم: ${student.fullName}\n• اسم المستخدم (Username): ${student.username}\n• كلمة المرور: ${student.password || 'password123'}\n• الرقم الأكاديمي: ${student.academicIdNumber}\n• رابط الدخول للمقرر: ${directLink}\n\n⚠️ يرجى استخدام هذه البيانات حصراً للدخول للمنصة التعليمية والوصول للمقررات المعتمدة.`;
                              navigator.clipboard.writeText(text).then(() => {
                                addToast('success', `تم نسخ بيانات الحساب الرسمي ورابط المقرر للطالب "${student.fullName}" بنجاح!`);
                              }).catch(() => {
                                prompt('بيانات الدخول الرسمية:', text);
                              });
                            }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="نسخ بيانات الدخول الرسمية للطالب ورابط المقرر لإرسالها له"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openPermissionsModal(student)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="إدارة الصلاحيات"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="تعديل الحساب"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setStudentToDelete(student)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="حذف الحساب نهائياً من قاعدة البيانات"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: HIERARCHICAL PERMISSION MANAGEMENT (الاختصاص → الفرع → السنة → الفصل → المواد) */}
      {/* ========================================================================= */}
      {modalMode === 'permissions' && selectedStudentForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl border border-slate-200 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h4 className="text-lg font-black text-[#0c3250]">
                    إدارة صلاحيات الطالب: {selectedStudentForModal.fullName}
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  تحديد التسلسل الهرمي: الاختصاص ← السنة ← الفصل ← المواد، مع إمكانية التفعيل والإلغاء المستقل
                </p>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 max-h-[65vh] overflow-y-auto pl-1 pr-1 text-xs">
              
              {/* LEVEL 1: SPECIALTY */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="font-black text-[#0c3250] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>1. الاختصاص الأكاديمي:</span>
                </label>
                <select
                  value={formData.specialtyId}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      specialtyId: e.target.value,
                      branchId: '',
                      allowedCourseIds: []
                    });
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 focus:border-blue-600 focus:outline-hidden"
                >
                  {formProgram?.specialties.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              {/* LEVEL 2: ACADEMIC YEARS & SEMESTERS */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <label className="font-black text-[#0c3250] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>2. السنوات والفصول الدراسية المفعلة:</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Years selector */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-700 block text-[11px]">السنوات الدراسية:</span>
                    <div className="flex gap-2">
                      {([1, 2] as const).map(yr => {
                        const isAllowed = formData.allowedAcademicYears.includes(yr);
                        return (
                          <button
                            key={yr}
                            type="button"
                            onClick={() => handleToggleYear(yr)}
                            className={`flex-1 py-2 px-3 rounded-lg font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              isAllowed
                                ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                                : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                            }`}
                          >
                            <span>السنة {yr === 1 ? 'الأولى' : 'الثانية'}</span>
                            {isAllowed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Semesters selector */}
                  <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-700 block text-[11px]">الفصول الدراسية:</span>
                    <div className="flex gap-2">
                      {([1, 2] as const).map(sem => {
                        const isAllowed = formData.allowedSemesters.includes(sem);
                        return (
                          <button
                            key={sem}
                            type="button"
                            onClick={() => handleToggleSemester(sem)}
                            className={`flex-1 py-2 px-3 rounded-lg font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              isAllowed
                                ? 'bg-blue-50 border-blue-300 text-blue-800'
                                : 'bg-slate-50 border-slate-200 text-slate-400 line-through'
                            }`}
                          >
                            <span>الفصل {sem === 1 ? 'الأول' : 'الثاني'}</span>
                            {isAllowed ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* LEVEL 3: COURSES LIST (GROUPED BY YEAR & SEMESTER) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-black text-[#0c3250] flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>3. المواد والمقررات الدراسية (تفعيل أو إلغاء كل مادة بشكل مستقل):</span>
                  </label>
                  <span className="text-[11px] font-bold text-blue-600">
                    {formData.allowedCourseIds.length} من {availableCourses.length} مواد مفعلة
                  </span>
                </div>

                {/* Display courses grouped by active Years and Semesters */}
                {availableCourses.length === 0 ? (
                  <p className="text-center py-6 text-slate-400 bg-slate-50 rounded-2xl">
                    لا توجد مقررات مسجلة في هذا الاختصاص.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {[1, 2].map(yr => {
                      const yearCourses = availableCourses.filter(c => (c.academicYear || 1) === yr);
                      if (yearCourses.length === 0) return null;
                      const isYearActive = formData.allowedAcademicYears.includes(yr as 1 | 2);

                      return (
                        <div key={yr} className={`rounded-2xl border transition-all ${isYearActive ? 'bg-white border-slate-200 p-3.5 shadow-2xs' : 'bg-slate-100/70 border-slate-200 p-3 opacity-60'}`}>
                          
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                              <span className="font-black text-slate-800 text-xs">
                                مقررات السنة {yr === 1 ? 'الأولى' : 'الثانية'}
                              </span>
                              {!isYearActive && (
                                <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-md">
                                  السنة معطلة للطالب
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {[1, 2].map(sem => {
                              const semCourses = yearCourses.filter(c => (c.semesterTerm || 1) === sem);
                              if (semCourses.length === 0) return null;
                              const isSemActive = formData.allowedSemesters.includes(sem as 1 | 2);

                              return (
                                <div key={sem} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-2">
                                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                                    <span>الفصل {sem === 1 ? 'الأول' : 'الثاني'}</span>
                                    <div className="flex items-center gap-1 text-[10px]">
                                      <button
                                        type="button"
                                        onClick={() => handleToggleBatchCourses(yr as 1 | 2, sem as 1 | 2, true)}
                                        className="text-blue-600 hover:underline cursor-pointer"
                                      >
                                        تحديد الكل
                                      </button>
                                      <span>•</span>
                                      <button
                                        type="button"
                                        onClick={() => handleToggleBatchCourses(yr as 1 | 2, sem as 1 | 2, false)}
                                        className="text-slate-500 hover:underline cursor-pointer"
                                      >
                                        إلغاء
                                      </button>
                                    </div>
                                  </div>

                                  <div className="space-y-1.5">
                                    {semCourses.map(course => {
                                      const isChecked = formData.allowedCourseIds.includes(course.id);
                                      return (
                                        <label
                                          key={course.id}
                                          className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer ${
                                            isChecked 
                                              ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold' 
                                              : 'bg-white border-slate-200 text-slate-600'
                                          }`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="checkbox"
                                              checked={isChecked}
                                              onChange={() => handleToggleCoursePermission(course.id)}
                                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600 cursor-pointer"
                                            />
                                            <span>{course.title}</span>
                                          </div>
                                          <span className="text-[10px] text-slate-400 font-mono">{course.code}</span>
                                        </label>
                                      );
                                    })}
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

              {/* LEVEL 6: ADVANCED PERMISSIONS (ATTENDANCE & DOWNLOADS & OFFLINE) */}
              <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-blue-950 block text-xs">
                    5. صلاحيات الحضور وتنزيل الملفات والأوفلاين:
                  </span>
                  <span className={`text-[10px] font-bold ${
                    formData.allowOffline ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {formData.allowOffline ? 'التنزيل أوفلاين مسموح' : 'التنزيل أوفلاين ملغى (مشاهدة فقط)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-blue-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canAttendLectures}
                      onChange={(e) => setFormData({ ...formData, canAttendLectures: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">حضور المحاضرات</span>
                      <span className="text-[10px] text-slate-500">مشاهدة الفيديو أونلاين</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-blue-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.canDownloadFiles}
                      onChange={(e) => setFormData({ ...formData, canDownloadFiles: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-600 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">تنزيل الملفات</span>
                      <span className="text-[10px] text-slate-500">مذكرات الـ PDF</span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer ${
                    formData.allowOffline ? 'bg-emerald-50/70 border-emerald-300' : 'bg-amber-50/70 border-amber-300'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.allowOffline}
                      onChange={(e) => setFormData({ ...formData, allowOffline: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-600 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">تنزيل الأوفلاين</span>
                      <span className={`text-[10px] font-bold block ${
                        formData.allowOffline ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {formData.allowOffline ? 'مسموح بالتنزيل' : 'لا يحق له التنزيل (مشاهدة فقط)'}
                      </span>
                    </div>
                  </label>
                </div>

                {!formData.allowOffline && (
                  <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>تم إلغاء خيار التنزيل: هذا الطالب يملك صلاحية المشاهدة أونلاين فقط، ولن يتمكن من تنزيل المحاضرات أوفلاين.</span>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={() => {
                  updateStudentPermissions(selectedStudentForModal.id, {
                    specialtyId: formData.specialtyId,
                    branchId: formData.branchId,
                    allowedAcademicYears: formData.allowedAcademicYears,
                    allowedSemesters: formData.allowedSemesters,
                    allowedCourseIds: formData.allowedCourseIds,
                    canAttendLectures: formData.canAttendLectures,
                    canDownloadFiles: formData.canDownloadFiles,
                    allowOffline: formData.allowOffline
                  });
                  setModalMode(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-xs transition-colors cursor-pointer"
              >
                حفظ الصلاحيات وتطبيقها فوراً
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT STUDENT ACCOUNT */}
      {/* ========================================================================= */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-lg font-black text-[#0c3250]">
                {modalMode === 'add' ? 'إضافة حساب طالب جديد' : 'تعديل بيانات حساب الطالب'}
              </h4>
              <button
                onClick={() => setModalMode(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs max-h-[65vh] overflow-y-auto pl-1 pr-1">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">اسم الطالب الكامل:</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="مثال: حسام الدين العلي"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">اسم المستخدم (لتسجيل الدخول):</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                    placeholder="houssam"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">رقم الهاتف:</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+963 944 000 000"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">كلمة المرور:</label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden font-mono"
                  />
                </div>
              </div>

              {/* Program & Specialty Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">البرنامج التعليمي:</label>
                  <select
                    value={formData.programId}
                    onChange={(e) => {
                      const prog = programs.find(p => p.id === e.target.value);
                      const spec = prog?.specialties[0];
                      const newCourses = spec?.courses
                        .filter(c => (formData.allowedAcademicYears || [1]).includes((c.academicYear || 1) as 1 | 2) && (formData.allowedSemesters || [1]).includes((c.semesterTerm || 1) as 1 | 2))
                        .map(c => c.id) || [];
                      setFormData({
                        ...formData,
                        programId: e.target.value,
                        specialtyId: spec?.id || '',
                        branchId: '',
                        allowedCourseIds: newCourses
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
                  >
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">الاختصاص الأكاديمي:</label>
                  <select
                    value={formData.specialtyId}
                    onChange={(e) => {
                      const spec = formProgram?.specialties.find(s => s.id === e.target.value);
                      const newCourses = spec?.courses
                        .filter(c => (formData.allowedAcademicYears || [1]).includes((c.academicYear || 1) as 1 | 2) && (formData.allowedSemesters || [1]).includes((c.semesterTerm || 1) as 1 | 2))
                        .map(c => c.id) || [];
                      setFormData({ 
                        ...formData, 
                        specialtyId: e.target.value,
                        branchId: '',
                        allowedCourseIds: newCourses 
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden"
                  >
                    {formProgram?.specialties.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Year & Semester Selection for Student */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>السنة الدراسية للطالب:</span>
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold">
                      {formData.allowedAcademicYears.length === 2 ? 'السنتين معاً' : formData.allowedAcademicYears.includes(2) ? 'السنة الثانية' : 'السنة الأولى'}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {([1, 2] as const).map(yr => {
                      const isSelected = formData.allowedAcademicYears.includes(yr);
                      return (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => {
                            let nextYears: (1 | 2)[];
                            if (isSelected) {
                              if (formData.allowedAcademicYears.length > 1) {
                                nextYears = formData.allowedAcademicYears.filter(y => y !== yr);
                              } else {
                                nextYears = [yr === 1 ? 2 : 1];
                              }
                            } else {
                              nextYears = [...formData.allowedAcademicYears, yr];
                            }
                            const currentSemesters = formData.allowedSemesters.length > 0 ? formData.allowedSemesters : [1];
                            const nextCourses = availableCourses
                              .filter(c => nextYears.includes((c.academicYear || 1) as 1 | 2) && currentSemesters.includes((c.semesterTerm || 1) as 1 | 2))
                              .map(c => c.id);
                            setFormData({
                              ...formData,
                              allowedAcademicYears: nextYears,
                              allowedCourseIds: nextCourses
                            });
                          }}
                          className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>السنة {yr === 1 ? 'الأولى' : 'الثانية'}</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>الفصل الدراسي للطالب:</span>
                    </span>
                    <span className="text-[10px] text-blue-600 font-bold">
                      {formData.allowedSemesters.length === 2 ? 'الفصلين معاً' : formData.allowedSemesters.includes(2) ? 'الفصل الثاني' : 'الفصل الأول'}
                    </span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {([1, 2] as const).map(sem => {
                      const isSelected = formData.allowedSemesters.includes(sem);
                      return (
                        <button
                          key={sem}
                          type="button"
                          onClick={() => {
                            let nextSemesters: (1 | 2)[];
                            if (isSelected) {
                              if (formData.allowedSemesters.length > 1) {
                                nextSemesters = formData.allowedSemesters.filter(s => s !== sem);
                              } else {
                                nextSemesters = [sem === 1 ? 2 : 1];
                              }
                            } else {
                              nextSemesters = [...formData.allowedSemesters, sem];
                            }
                            const currentYears = formData.allowedAcademicYears.length > 0 ? formData.allowedAcademicYears : [1];
                            const nextCourses = availableCourses
                              .filter(c => currentYears.includes((c.academicYear || 1) as 1 | 2) && nextSemesters.includes((c.semesterTerm || 1) as 1 | 2))
                              .map(c => c.id);
                            setFormData({
                              ...formData,
                              allowedSemesters: nextSemesters,
                              allowedCourseIds: nextCourses
                            });
                          }}
                          className={`py-2 px-3 rounded-xl font-bold text-xs border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#0284c7] text-white border-[#0284c7] shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>الفصل {sem === 1 ? 'الأول' : 'الثاني'}</span>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Attendance & Download & Offline Permissions */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 block text-xs">الصلاحيات الأساسية:</span>
                  <span className="text-[11px] text-slate-500">
                    يمكنك تفعيل أو إلغاء تنزيل الأوفلاين لكل طالب على حدة
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2 ${
                    formData.canAttendLectures ? 'bg-white border-blue-300 shadow-2xs' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.canAttendLectures}
                      onChange={(e) => setFormData({ ...formData, canAttendLectures: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">حضور المحاضرات</span>
                      <span className="text-[10px] text-slate-500">مشاهدة الفيديو</span>
                    </div>
                  </label>

                  <label className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2 ${
                    formData.canDownloadFiles ? 'bg-white border-blue-300 shadow-2xs' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.canDownloadFiles}
                      onChange={(e) => setFormData({ ...formData, canDownloadFiles: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">تنزيل الملفات PDF</span>
                      <span className="text-[10px] text-slate-500">مذكرات وملازم</span>
                    </div>
                  </label>

                  <label className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2 ${
                    formData.allowOffline ? 'bg-emerald-50/70 border-emerald-300 shadow-2xs' : 'bg-amber-50/70 border-amber-300 shadow-2xs'
                  }`}>
                    <input
                      type="checkbox"
                      checked={formData.allowOffline}
                      onChange={(e) => setFormData({ ...formData, allowOffline: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-800 block text-[11px]">تنزيل محاضرات الأوفلاين</span>
                      <span className={`text-[10px] font-bold block ${
                        formData.allowOffline ? 'text-emerald-700' : 'text-amber-700'
                      }`}>
                        {formData.allowOffline ? 'مسموح بالتنزيل أوفلاين' : 'لا يحق له التنزيل (مشاهدة فقط)'}
                      </span>
                    </div>
                  </label>
                </div>

                {!formData.allowOffline && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      <strong>خيار التنزيل ملغى:</strong> هذا الطالب لا يحق له تنزيل المحاضرات أوفلاين، بل يقتصر حسابه على <u>المشاهدة فقط</u>.
                    </span>
                  </div>
                )}
              </div>

            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!formData.fullName.trim() || !formData.username.trim()) {
                    addToast('error', 'يرجى إدخال اسم الطالب واسم المستخدم.');
                    return;
                  }

                  if (modalMode === 'add') {
                    addStudent({
                      fullName: formData.fullName,
                      username: formData.username,
                      email: formData.email || `${formData.username}@futurecenter.edu`,
                      phone: formData.phone || '+963 900 000 000',
                      password: formData.password,
                      role: 'student',
                      programId: formData.programId,
                      specialtyId: formData.specialtyId,
                      branchId: formData.branchId,
                      allowedAcademicYears: formData.allowedAcademicYears,
                      allowedSemesters: formData.allowedSemesters,
                      allowedCourseIds: formData.allowedCourseIds,
                      canAttendLectures: formData.canAttendLectures,
                      canDownloadFiles: formData.canDownloadFiles,
                      allowOffline: formData.allowOffline,
                      status: 'active',
                      academicIdNumber: `FC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
                    });
                  } else if (selectedStudentForModal) {
                    updateStudent(selectedStudentForModal.id, {
                      fullName: formData.fullName,
                      username: formData.username,
                      phone: formData.phone,
                      password: formData.password,
                      programId: formData.programId,
                      specialtyId: formData.specialtyId,
                      branchId: formData.branchId,
                      allowedAcademicYears: formData.allowedAcademicYears,
                      allowedSemesters: formData.allowedSemesters,
                      allowedCourseIds: formData.allowedCourseIds,
                      canAttendLectures: formData.canAttendLectures,
                      canDownloadFiles: formData.canDownloadFiles,
                      allowOffline: formData.allowOffline
                    });
                  }
                  setModalMode(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {modalMode === 'add' ? 'إضافة وتثبيت الحساب' : 'حفظ التعديلات'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: تأكيد حذف حساب الطالب نهائياً من قاعدة البيانات */}
      {/* ========================================================================= */}
      {studentToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-900">تأكيد حذف حساب الطالب</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              هل أنت متأكد من رغبتك في حذف حساب الطالب <strong className="text-rose-600 font-bold">"{studentToDelete.fullName}"</strong> (@{studentToDelete.username}) نهائياً من قاعدة بيانات المنصة؟
            </p>
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 text-[11px] text-rose-800 text-right space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>إشعار الحذف النهائي:</span>
              </div>
              <p>سيتم حذف بيانات الحساب وصلاحيات المقررات مباشرة من السيرفر، ولن يتمكن الطالب من تسجيل الدخول بعد الآن من أي جهاز أو متصفح.</p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteStudent(studentToDelete.id);
                  setStudentToDelete(null);
                }}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                تأكيد الحذف نهائياً
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
