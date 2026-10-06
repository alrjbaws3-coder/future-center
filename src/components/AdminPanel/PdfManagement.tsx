import React, { useState, useMemo, useRef } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { LectureFile } from '../../types';
import { 
  FileText, 
  UploadCloud, 
  DownloadCloud, 
  Trash2, 
  Eye, 
  Search, 
  CheckCircle2, 
  BookOpen, 
  Layers, 
  FileUp, 
  SlidersHorizontal,
  HardDrive,
  Clock,
  Sparkles,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { downloadLecturePdfFile } from '../../utils/downloadHelper';
import { PdfReaderModal } from '../PdfReaderModal';

export const PdfManagement: React.FC = () => {
  const { 
    programs, 
    siteSettings, 
    toggleGlobalOfflineDownload, 
    addCoursePdfFile, 
    deletePdfFileAcrossCourses,
    addToast 
  } = usePlatform();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialtyFilter, setSelectedSpecialtyFilter] = useState('all');

  // Form State for New File Upload
  const [selectedProgramId, setSelectedProgramId] = useState<string>(programs[0]?.id || '');
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedLectureId, setSelectedLectureId] = useState<string>(''); // optional
  const [customFileName, setCustomFileName] = useState('');
  const [fileType, setFileType] = useState<'pdf' | 'summary' | 'exercise'>('pdf');
  const [fileSizeText, setFileSizeText] = useState('2.5 MB');
  const [fileDataUrl, setFileDataUrl] = useState<string>('');
  const [selectedNativeFile, setSelectedNativeFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Preview / Reading File in Modal
  const [previewFile, setPreviewFile] = useState<{
    file: LectureFile;
    lectureTitle: string;
    courseTitle: string;
  } | null>(null);

  // Delete confirmation
  const [deletingFile, setDeletingFile] = useState<{ id: string; name: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Program and its Specialties
  const activeProgram = useMemo(() => {
    return programs.find(p => p.id === selectedProgramId) || programs[0];
  }, [programs, selectedProgramId]);

  const programSpecialties = useMemo(() => {
    return activeProgram?.specialties || [];
  }, [activeProgram]);

  // Set default specialty when program changes
  React.useEffect(() => {
    if (programSpecialties.length > 0 && (!selectedSpecialtyId || !programSpecialties.some(s => s.id === selectedSpecialtyId))) {
      setSelectedSpecialtyId(programSpecialties[0].id);
    }
  }, [programSpecialties, selectedSpecialtyId]);

  // Active Specialty and its Courses
  const activeSpecialty = useMemo(() => {
    return programSpecialties.find(s => s.id === selectedSpecialtyId) || programSpecialties[0];
  }, [programSpecialties, selectedSpecialtyId]);

  const specialtyCourses = useMemo(() => {
    return activeSpecialty?.courses || [];
  }, [activeSpecialty]);

  // Set default course when specialty changes
  React.useEffect(() => {
    if (specialtyCourses.length > 0 && (!selectedCourseId || !specialtyCourses.some(c => c.id === selectedCourseId))) {
      setSelectedCourseId(specialtyCourses[0].id);
    }
  }, [specialtyCourses, selectedCourseId]);

  // Active Course and its Lectures
  const activeCourse = useMemo(() => {
    return specialtyCourses.find(c => c.id === selectedCourseId) || specialtyCourses[0];
  }, [specialtyCourses, selectedCourseId]);

  const courseLectures = useMemo(() => {
    if (!activeCourse) return [];
    const list: { id: string; title: string; semesterName: string }[] = [];
    activeCourse.semesters?.forEach(sem => {
      sem.lectures?.forEach(lec => {
        list.push({ id: lec.id, title: lec.title, semesterName: sem.name });
      });
    });
    return list;
  }, [activeCourse]);

  // Aggregated list of all PDF files across all programs, specialties, and courses
  const allPlatformFiles = useMemo(() => {
    const list: {
      programId: string;
      programTitle: string;
      specialtyId: string;
      specialtyName: string;
      courseId: string;
      courseTitle: string;
      semesterName: string;
      lectureId: string;
      lectureTitle: string;
      file: LectureFile;
    }[] = [];

    programs.forEach(prog => {
      prog.specialties.forEach(spec => {
        spec.courses.forEach(course => {
          course.semesters?.forEach(sem => {
            sem.lectures?.forEach(lec => {
              (lec.files || []).forEach(f => {
                list.push({
                  programId: prog.id,
                  programTitle: prog.title,
                  specialtyId: spec.id,
                  specialtyName: spec.name,
                  courseId: course.id,
                  courseTitle: course.title,
                  semesterName: sem.name,
                  lectureId: lec.id,
                  lectureTitle: lec.title,
                  file: f
                });
              });
            });
          });
        });
      });
    });

    return list;
  }, [programs]);

  // Filtered files list for table
  const filteredFiles = useMemo(() => {
    return allPlatformFiles.filter(item => {
      const matchesSpecialty = selectedSpecialtyFilter === 'all' || item.specialtyId === selectedSpecialtyFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery = !q || 
        item.file.name.toLowerCase().includes(q) ||
        item.courseTitle.toLowerCase().includes(q) ||
        item.specialtyName.toLowerCase().includes(q) ||
        item.lectureTitle.toLowerCase().includes(q);
      return matchesSpecialty && matchesQuery;
    });
  }, [allPlatformFiles, selectedSpecialtyFilter, searchQuery]);

  // Total unique courses with at least 1 PDF
  const coursesWithFilesCount = useMemo(() => {
    const set = new Set(allPlatformFiles.map(f => f.courseId));
    return set.size;
  }, [allPlatformFiles]);

  // Handle native file selection
  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('تعذر قراءة محتوى الملف'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChosen = async (file: File) => {
    setSelectedNativeFile(file);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setFileSizeText(`${sizeInMb} MB`);
    
    // Suggest a clean name based on file name if customFileName is empty
    if (!customFileName) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setCustomFileName(cleanName);
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setFileDataUrl(dataUrl);
    } catch (err) {
      console.warn('Error reading chosen file', err);
      addToast('error', 'حدث خطأ أثناء قراءة ملف الـ PDF. يرجى اختيار الملف مرة أخرى.');
    }
  };

  const handleNativeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChosen(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChosen(e.dataTransfer.files[0]);
    }
  };

  // Submit Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProgramId || !selectedSpecialtyId || !selectedCourseId) {
      addToast('error', 'يرجى اختيار القسم والاختصاص والمقرر المستهدف أولاً.');
      return;
    }

    if (!customFileName.trim()) {
      addToast('error', 'يرجى إدخال اسم أو عنوان المذكرة الدراسية.');
      return;
    }

    setIsUploading(true);

    try {
      let finalDataUrl = fileDataUrl;
      // If user chose a file and reader hadn't finished yet
      if (selectedNativeFile && (!finalDataUrl || finalDataUrl.length === 0)) {
        finalDataUrl = await readFileAsDataUrl(selectedNativeFile);
      }

      const fileNameWithExt = customFileName.trim().toLowerCase().endsWith('.pdf') 
        ? customFileName.trim() 
        : `${customFileName.trim()}.pdf`;

      addCoursePdfFile(
        selectedProgramId,
        selectedSpecialtyId,
        selectedCourseId,
        {
          name: fileNameWithExt,
          type: fileType,
          fileSize: fileSizeText || '2.8 MB',
          fileUrl: finalDataUrl || '#pdf_uploaded'
        },
        selectedLectureId || undefined
      );

      // Reset form
      setCustomFileName('');
      setSelectedNativeFile(null);
      setFileDataUrl('');
      setFileSizeText('2.5 MB');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Upload submit error', err);
      addToast('error', 'حدث خطأ أثناء معالجة وحفظ ملف الـ PDF. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUploading(false);
    }
  };

  // Confirm delete handler
  const confirmDelete = () => {
    if (!deletingFile) return;
    deletePdfFileAcrossCourses(deletingFile.id);
    setDeletingFile(null);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* 1. Header & Overview */}
      <div className="bg-gradient-to-l from-[#0c3250] via-[#143f66] to-[#1a5282] text-white p-6 sm:p-7 rounded-3xl shadow-sm border border-blue-900/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/15 text-white text-xs font-bold backdrop-blur-xs flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-blue-200" />
                <span>مركز رفع وإدارة مذكرات الـ PDF الأكاديمية</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              رفع وتضمين ملفات PDF على الموقع (صلاحية المالك)
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed">
              يمكنك كمالك للمركز رفع وتحديث مذكرات المقررات والملخصات وبنوك الأسئلة بسهولة، حيث يتم ربطها فوراً بالاختصاص والمادة وتظهر مباشرة لجميع الطلاب المصرح لهم بالقراءة والتنزيل.
            </p>
          </div>

          {/* Quick Global Offline Download Toggle */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-xs space-y-2 shrink-0 self-start md:self-auto min-w-[240px]">
            <div className="flex items-center justify-between">
              <span className="text-blue-200 font-bold flex items-center gap-1.5">
                <DownloadCloud className="w-4 h-4 text-blue-300" />
                <span>تنزيل الأوفلاين للطلاب:</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                siteSettings.allowOfflineLecturesDownload !== false 
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30' 
                  : 'bg-rose-500/20 text-rose-200 border border-rose-500/30'
              }`}>
                {siteSettings.allowOfflineLecturesDownload !== false ? 'مفعل عاماً' : 'معطل عاماً'}
              </span>
            </div>
            <button
              onClick={toggleGlobalOfflineDownload}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
                siteSettings.allowOfflineLecturesDownload !== false
                  ? 'bg-amber-400 hover:bg-amber-500 text-slate-900'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              <span>{siteSettings.allowOfflineLecturesDownload !== false ? 'إيقاف التنزيل أوفلاين مؤقتاً' : 'تفعيل التنزيل أوفلاين للجميع'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Stats Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#0c3250]">{allPlatformFiles.length}</div>
            <div className="text-xs font-bold text-slate-500">إجمالي ملفات ومذكرات PDF المرفوعة</div>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#0c3250]">{coursesWithFilesCount}</div>
            <div className="text-xs font-bold text-slate-500">مقرر دراسي مغطى بمذكرات PDF</div>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#0c3250]">جاهزة للعرض</div>
            <div className="text-xs font-bold text-slate-500">مزامنة سحابية وقراءة تفاعلية فورية</div>
          </div>
        </div>
      </div>

      {/* 3. Upload New PDF Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <FileUp className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#0c3250]">رفع ملف PDF جديد ونشره على الموقع</h3>
            <p className="text-xs text-slate-500">اختر الملف من جهازك وحدد المادة الأكاديمية التابع لها ليتم نشره فوراً.</p>
          </div>
        </div>

        <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
          {/* Target Course Hierarchy Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">1. البرنامج الرئيسي:</label>
              <select
                value={selectedProgramId}
                onChange={(e) => setSelectedProgramId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden font-bold text-slate-800 bg-slate-50/50"
              >
                {programs.map(prog => (
                  <option key={prog.id} value={prog.id}>{prog.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">2. الاختصاص الأكاديمي:</label>
              <select
                value={selectedSpecialtyId}
                onChange={(e) => setSelectedSpecialtyId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden font-bold text-slate-800 bg-slate-50/50"
              >
                {programSpecialties.map(spec => (
                  <option key={spec.id} value={spec.id}>{spec.name} ({spec.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">3. المقرر الدراسي المستهدف:</label>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden font-bold text-blue-700 bg-slate-50/50"
              >
                {specialtyCourses.map(course => (
                  <option key={course.id} value={course.id}>{course.title} ({course.code})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Interactive File Dropzone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging 
                ? 'border-blue-500 bg-blue-50/70 scale-[1.01]' 
                : selectedNativeFile 
                  ? 'border-emerald-400 bg-emerald-50/40' 
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/70'
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleNativeInputChange} 
              accept=".pdf,application/pdf" 
              className="hidden" 
            />

            {selectedNativeFile ? (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div className="font-black text-sm text-slate-800">
                  تم اختيار الملف: <span className="text-emerald-700">{selectedNativeFile.name}</span>
                </div>
                <div className="text-xs text-slate-500">
                  الحجم: <strong>{fileSizeText}</strong> • انقر لاختيار ملف PDF آخر
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="font-black text-sm text-[#0c3250]">
                  اسحب وأفلت ملف الـ PDF هنا، أو انقر لاستعراض الملفات من جهازك
                </div>
                <p className="text-xs text-slate-400">
                  يدعم جميع ملفات الـ PDF (مذكرات، ملازم، شرائح، ملخصات، بنوك أسئلة)
                </p>
              </div>
            )}
          </div>

          {/* File Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">اسم وعنوان المذكرة (كما يظهر للطالب):</label>
              <input
                type="text"
                value={customFileName}
                onChange={(e) => setCustomFileName(e.target.value)}
                placeholder="مثال: مذكرة المفاهيم الإدارية الشاملة — الفصل الأول"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">تصنيف المذكرة:</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden font-bold"
              >
                <option value="pdf">مذكرة دراسية شاملة (PDF)</option>
                <option value="summary">ملخص وخرائط مفاهيم (PDF)</option>
                <option value="exercise">تمارين وبنك أسئلة (PDF)</option>
              </select>
            </div>
          </div>

          {/* Optional Lecture Association */}
          {courseLectures.length > 0 && (
            <div>
              <label className="font-bold text-slate-700 block mb-1">ربط بمحاضرة محددة (اختياري):</label>
              <select
                value={selectedLectureId}
                onChange={(e) => setSelectedLectureId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:outline-hidden text-slate-700"
              >
                <option value="">إضافة كمذكرة عامة للمقرر الدراسي (المحاضرة 1)</option>
                {courseLectures.map(lec => (
                  <option key={lec.id} value={lec.id}>
                    {lec.semesterName} — {lec.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-500">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>يتم النشر فوراً وتظهر المذكرة في مكتبة الـ PDF للطلاب المسجلين.</span>
            </div>

            <button
              type="submit"
              disabled={isUploading || !customFileName.trim()}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isUploading ? 'جارٍ رفع وحفظ الملف...' : 'رفع ونشر ملف الـ PDF على الموقع'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 4. All Uploaded PDFs Table & Management */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-[#0c3250]">
              سجل ملفات ومذكرات الـ PDF المرفوعة ({filteredFiles.length})
            </h3>
            <p className="text-xs text-slate-500">كافة المذكرات والملفات المعتمدة على مستوى المركز، مع خيارات المعاينة، التحميل، والحذف.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Specialty Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 mr-1" />
              <select
                value={selectedSpecialtyFilter}
                onChange={(e) => setSelectedSpecialtyFilter(e.target.value)}
                className="bg-transparent font-bold text-slate-700 focus:outline-hidden py-1 px-1.5"
              >
                <option value="all">كافة الاختصاصات الأكاديمية</option>
                {programs.flatMap(p => p.specialties).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم أو المقرر..."
                className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        {filteredFiles.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-700">لا توجد ملفات PDF مطابقة للبحث</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              يمكنك استخدام نموذج الرفع في الأعلى لإضافة مذكرات جديدة أو تغيير معايير البحث والفلترة.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/70">
                  <th className="py-3 px-3 rounded-r-xl">الملف والمذكرة</th>
                  <th className="py-3 px-3">المقرر والاختصاص</th>
                  <th className="py-3 px-3">التصنيف</th>
                  <th className="py-3 px-3">الحجم</th>
                  <th className="py-3 px-3">تاريخ الرفع</th>
                  <th className="py-3 px-3 rounded-l-xl text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredFiles.map((item, idx) => (
                  <tr key={`${item.file.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-slate-900 block truncate max-w-[220px]">
                            {item.file.name}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate block">
                            {item.lectureTitle}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="space-y-0.5">
                        <span className="font-bold text-blue-700 block truncate max-w-[180px]">
                          {item.courseTitle}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {item.specialtyName}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        item.file.type === 'summary' 
                          ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                          : item.file.type === 'exercise'
                            ? 'bg-purple-50 text-purple-800 border border-purple-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {item.file.type === 'summary' ? 'ملخص مركز' : item.file.type === 'exercise' ? 'تمارين وأسئلة' : 'مذكرة كاملة'}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-slate-600">
                      {item.file.fileSize || '2.5 MB'}
                    </td>

                    <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                      {item.file.uploadedAt || '2026-02-15'}
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setPreviewFile({
                            file: item.file,
                            lectureTitle: item.lectureTitle,
                            courseTitle: item.courseTitle
                          })}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                          title="معاينة وقراءة المذكرة"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => downloadLecturePdfFile(item.file.name, item.lectureTitle, item.courseTitle, 'المالك', item.file.fileUrl, item.file.id, 'OWNER-ADMIN')}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                          title="تنزيل الملف إلى جهازك للتجربة"
                        >
                          <DownloadCloud className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeletingFile({ id: item.file.id, name: item.file.name })}
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-colors cursor-pointer"
                          title="حذف الملف من الموقع"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Delete Confirmation Modal */}
      {deletingFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200 text-right">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-black text-slate-800">تأكيد حذف الملف</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              هل أنت متأكد من رغبتك في حذف ملف الـ PDF:
              {' '}<strong className="text-rose-600">"{deletingFile.name}"</strong> من الموقع؟ لن يتمكن الطلاب من الوصول إليه بعد الحذف.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeletingFile(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. PDF Reader / Preview Modal */}
      {previewFile && (
        <PdfReaderModal
          isOpen={!!previewFile}
          onClose={() => setPreviewFile(null)}
          file={previewFile.file}
          lectureTitle={previewFile.lectureTitle}
          courseTitle={previewFile.courseTitle}
          studentName="المالك (معاينة إدارية)"
          academicId="OWNER-ADMIN"
          canDownload={true}
          onDownload={(file) => downloadLecturePdfFile(file.name, previewFile.lectureTitle, previewFile.courseTitle, 'المالك', file.fileUrl, file.id, 'OWNER-ADMIN')}
        />
      )}

    </div>
  );
};
