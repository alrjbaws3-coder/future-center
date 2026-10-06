import React, { useState, useEffect } from 'react';
import { LectureFile } from '../types';
import { getPdfFromIndexedDb, dataUrlToBlob } from '../utils/pdfStorage';
import { 
  X, 
  DownloadCloud, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Minimize2, 
  Printer, 
  Sun, 
  Moon, 
  BookOpen, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  FileCheck
} from 'lucide-react';

interface PdfReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: LectureFile | null;
  lectureTitle: string;
  courseTitle: string;
  studentName: string;
  academicId?: string;
  canDownload: boolean;
  onDownload: (file: LectureFile) => void;
}

export const PdfReaderModal: React.FC<PdfReaderModalProps> = ({
  isOpen,
  onClose,
  file,
  lectureTitle,
  courseTitle,
  studentName,
  academicId = 'FC-STUDENT',
  canDownload,
  onDownload
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [themeMode, setThemeMode] = useState<'light' | 'sepia' | 'dark'>('light');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activePage, setActivePage] = useState<number>(1);
  const [resolvedBlobUrl, setResolvedBlobUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'reader' | 'native'>('reader');

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    async function resolveFileUrl() {
      if (!file) return;

      // Check IndexedDB
      const lookupId = file.fileUrl?.startsWith('idb:') ? file.fileUrl.replace('idb:', '') : file.id;
      if (lookupId) {
        try {
          const stored = await getPdfFromIndexedDb(lookupId);
          if (stored && active) {
            const blob = stored instanceof Blob ? stored : dataUrlToBlob(stored);
            createdUrl = URL.createObjectURL(blob);
            setResolvedBlobUrl(createdUrl);
            setViewMode('native');
            return;
          }
        } catch (err) {
          console.warn('Could not read from IndexedDB in modal', err);
        }
      }

      // Check Data URL
      if (file.fileUrl && file.fileUrl.startsWith('data:')) {
        try {
          const blob = dataUrlToBlob(file.fileUrl);
          createdUrl = URL.createObjectURL(blob);
          if (active) {
            setResolvedBlobUrl(createdUrl);
            setViewMode('native');
          }
          return;
        } catch (err) {
          console.warn('Failed to parse data URL in modal', err);
        }
      }

      // Check blob or http
      if (file.fileUrl && (file.fileUrl.startsWith('blob:') || file.fileUrl.startsWith('http'))) {
        if (active) {
          setResolvedBlobUrl(file.fileUrl);
          setViewMode('native');
        }
        return;
      }

      // Fallback
      if (active) {
        setResolvedBlobUrl(null);
        setViewMode('reader');
      }
    }

    resolveFileUrl();

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [file]);

  if (!isOpen || !file) return null;

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 15, 160));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 15, 75));
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Theme styling
  const themeStyles = {
    light: 'bg-white text-slate-900 border-slate-200',
    sepia: 'bg-[#fbf0d9] text-[#433422] border-[#ebd4ab]',
    dark: 'bg-[#151c28] text-slate-100 border-slate-700'
  };

  const containerBg = {
    light: 'bg-slate-100/95',
    sepia: 'bg-[#f4e4c1]',
    dark: 'bg-[#0b111a]'
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col backdrop-blur-md ${containerBg[themeMode]} transition-colors duration-200`}
      dir="rtl"
    >
      {/* Top Toolbar */}
      <header className="bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0 select-none">
        
        {/* File Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-900/50">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                {file.name}
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-mono font-bold">
                {file.fileSize}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {courseTitle} • {lectureTitle}
            </p>
          </div>
        </div>

        {/* Reader Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          
          {/* Zoom Controls */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="تصغير"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono font-bold text-[11px] text-slate-700 dark:text-slate-200">
              {zoomLevel}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="تكبير"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Reading Mode / Theme */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs">
            <button
              onClick={() => setThemeMode('light')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${themeMode === 'light' ? 'bg-white text-blue-600 shadow-2xs font-bold' : 'text-slate-600 dark:text-slate-300'}`}
              title="وضع القراءة النهاري (أبيض)"
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setThemeMode('sepia')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer text-[11px] font-bold ${themeMode === 'sepia' ? 'bg-[#fbf0d9] text-[#593d18] shadow-2xs' : 'text-slate-600 dark:text-slate-300'}`}
              title="وضع القراءة المريح (Sepia)"
            >
              دافيء
            </button>
            <button
              onClick={() => setThemeMode('dark')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${themeMode === 'dark' ? 'bg-slate-700 text-amber-300 shadow-2xs font-bold' : 'text-slate-600 dark:text-slate-300'}`}
              title="وضع القراءة الليلي"
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer hidden sm:flex items-center gap-1 text-xs font-bold"
            title="طباعة المذكرة"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden md:inline">طباعة</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title={isFullscreen ? 'تصغير الشاشة' : 'ملء الشاشة'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* View Mode Toggle when native PDF is available */}
          {resolvedBlobUrl && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setViewMode('native')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1 text-[11px] ${viewMode === 'native' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300'}`}
                title="عرض ملف الـ PDF الأصلي"
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>ملف PDF الأصلي</span>
              </button>
              <button
                onClick={() => setViewMode('reader')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1 text-[11px] ${viewMode === 'reader' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300'}`}
                title="عرض المذكرة الأكاديمية التفاعلية"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>المذكرة التفاعلية</span>
              </button>
            </div>
          )}

          {/* Download Button */}
          {canDownload && (
            <button
              onClick={() => onDownload(file)}
              className="px-3.5 py-2 rounded-xl bg-[#183b63] hover:bg-[#122e4e] text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="تنزيل الملف إلى جهازك"
            >
              <DownloadCloud className="w-4 h-4" />
              <span>تنزيل PDF</span>
            </button>
          )}

          {/* Close Modal */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:hover:text-rose-300 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            title="إغلاق القارئ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

      </header>

      {/* Main Document Reading Canvas */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center">
        
        {viewMode === 'native' && resolvedBlobUrl ? (
          <div className="w-full max-w-5xl h-[80vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-slate-300 dark:border-slate-700 bg-white">
            <iframe
              src={resolvedBlobUrl}
              className="w-full h-full border-0"
              title={file.name}
            />
          </div>
        ) : (
        <div 
          className={`w-full max-w-4xl rounded-3xl p-6 sm:p-12 shadow-xl border ${themeStyles[themeMode]} transition-all duration-150 space-y-8 relative`}
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
        >
          {/* Security Watermark Header */}
          <div className="flex items-center justify-between border-b pb-5 opacity-80 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                م
              </div>
              <div>
                <span className="font-extrabold block">مركز المستقبل للتعليم والتطوير</span>
                <span className="text-[10px] opacity-75">الحقيبة الأكاديمية الرسمية المعتمدة</span>
              </div>
            </div>
            
            <div className="text-left text-[11px] font-mono">
              <span className="block font-bold">الطالب: {studentName}</span>
              <span className="block opacity-75">الرقم الأكاديمي: {academicId}</span>
            </div>
          </div>

          {/* Document Title Banner */}
          <div className="text-center space-y-3 py-4 border-b">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 inline-block">
              {courseTitle} — {lectureTitle}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {file.name.replace(/\.[^/.]+$/, '')}
            </h1>
            <p className="text-xs sm:text-sm opacity-85 max-w-xl mx-auto leading-relaxed">
              مذكرة دراسية شاملة ملحقة بالمحاضرة، تتضمن المفاهيم النظرية، الخطوات التطبيقية، ونماذج التمارين والأسئلة الامتحانية.
            </p>
          </div>

          {/* Table of Contents / Index */}
          <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-current/10 text-xs space-y-2">
            <div className="font-black flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>فهرس ومحاور المذكرة:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] opacity-90 pr-4">
              <div>1. الأهداف التعليمية والمفاهيم الأساسية</div>
              <div>2. الشرح التفصيلي والأمثلة المحلولة</div>
              <div>3. القواعد والتطبيقات التخصصية العملية</div>
              <div>4. بنك الأسئلة التدريبية والتمارين المقترحة</div>
            </div>
          </div>

          {/* Page 1: Chapter Concepts */}
          <section className="space-y-4 pt-2">
            <div className="flex items-center gap-2 border-r-4 border-blue-600 pr-3">
              <h2 className="text-lg font-black">أولاً: الأهداف والمفاهيم النظرية الأساسية</h2>
            </div>
            <p className="text-sm leading-loose opacity-90 text-justify">
              تتناول هذه الوحدة الدراسية المقررة ضمن منهاج مركز المستقبل المفاهيم المحورية التي يحتاجها الطالب لبناء أرضية متينة في مادة <strong className="font-bold">{courseTitle}</strong>. 
              تهدف المذكرة إلى ربط المعرفة الأكاديمية بسوق العمل الفعلي، وتمكين الدارس من استيعاب المصطلحات الفنية وتطبيقها بدقة وسلاسة في المشاريع التخصصية.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>المخرجات المتوقعة</span>
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  القدرة على التحليل المنهجي للمفردات ومواكبة المعايير القياسية المعتمدة للمركز.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-1.5">
                <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-300 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>الربط العملي</span>
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  تطبيق التمارين وتجهيز ملفات الإنجاز المتوافقة مع متطلبات الامتحانات والشهادة.
                </p>
              </div>
            </div>
          </section>

          {/* Page 2: Detailed Text & Formulas */}
          <section className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 border-r-4 border-blue-600 pr-3">
              <h2 className="text-lg font-black">ثانياً: خطوات التطبيق والمنهجية المعتمدة</h2>
            </div>
            <p className="text-sm leading-loose opacity-90 text-justify">
              خلال دراسة هذه المحاضرة، يجب مراعاة التسلسل الآتي لضمان تحقيق أعلى درجات الفهم والاستيعاب:
            </p>

            <ul className="list-disc list-inside space-y-2 text-xs sm:text-sm leading-relaxed pr-2 opacity-90">
              <li>قراءة ملخص الدرس والمصطلحات التأسيسية المرفقة بعناية قبل بدء حل التطبيقات.</li>
              <li>مراجعة الملاحظات الهامشية واستخراج النقاط الأكثر تكراراً في الاختبارات الأكاديمية السابقة.</li>
              <li>حل المسائل الاسترشادية دون الاستعانة بالحل النموذجي لاختبار سرعة ودقة الاستجابة.</li>
              <li>تدوين أي تساؤلات أو استفسارات لعرضها ومناقشتها في الجلسات التفاعلية أو مع مشرف المقرر.</li>
            </ul>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-amber-900 dark:text-amber-200">إرشادات هامة للمذاكرة:</span>
                <p className="opacity-90 leading-relaxed">
                  هذه المذكرة مخصصة للمراجعة الشخصية للطالب المسجل. يُمنع تداولها أو إعادة نشرها خارج النطاق التعليمي لمركز المستقبل.
                </p>
              </div>
            </div>
          </section>

          {/* Page 3: Practice Exercises & Question Bank */}
          <section className="space-y-4 pt-4 border-t">
            <div className="flex items-center gap-2 border-r-4 border-blue-600 pr-3">
              <h2 className="text-lg font-black">ثالثاً: بنك الأسئلة والتدريبات الامتحانية</h2>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-current/10 space-y-2">
                <div className="font-bold flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>السؤال الأول: الأسئلة التفسيرية والتعريفات</span>
                </div>
                <p className="opacity-80 leading-relaxed text-xs">
                  اشرح بإيجاز المبادئ الثلاثة الرئيسية التي تم إقرارها في بداية المحاضرة، مع ذكر مثال عملي يوضح أثر كل منها في بيئة العمل.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-current/10 space-y-2">
                <div className="font-bold flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>السؤال الثاني: التطبيق الحسابي والمقارنة</span>
                </div>
                <p className="opacity-80 leading-relaxed text-xs">
                  قارن بين الحالتين التطبيقيتين الواردتين في المذكرة موضحاً المزايا ونقاط التحسين لكل منهما.
                </p>
              </div>
            </div>
          </section>

          {/* Document Footer */}
          <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between text-xs opacity-75 gap-3">
            <span>مركز المستقبل للتعليم والتطوير — جميع الحقوق محفوظة © {new Date().getFullYear()}</span>
            <span className="font-mono">الصفحة 1 من 1 • ملف موثق إلكترونياً</span>
          </div>

        </div>
        )}

      </main>

      {/* Bottom Sticky Bar for Mobile Convenience */}
      <footer className="bg-white/95 dark:bg-slate-900/95 border-t border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between gap-3 text-xs sm:hidden shrink-0">
        <span className="text-slate-600 dark:text-slate-300 font-bold truncate">
          {file.name}
        </span>
        <div className="flex items-center gap-2">
          {canDownload && (
            <button
              onClick={() => onDownload(file)}
              className="px-3 py-1.5 rounded-xl bg-[#183b63] text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>تنزيل</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </footer>
    </div>
  );
};
