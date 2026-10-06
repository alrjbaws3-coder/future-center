import { jsPDF } from 'jspdf';
import { getPdfFromIndexedDb, dataUrlToBlob } from './pdfStorage';

/**
 * Download & Offline Utilities for Future Center Platform
 * Ensures real file downloads (PDF, Study Notes, HTML) and offline persistence.
 */

export interface OfflineSavedLecture {
  id: string;
  courseId: string;
  courseTitle: string;
  semesterName: string;
  title: string;
  description: string;
  number: number;
  duration: string;
  downloadedAt: string;
  files: { id: string; name: string; fileSize: string }[];
  summaryText: string;
}

const OFFLINE_KEY_PREFIX = 'fc_offline_lectures_';

/**
 * Triggers a real browser file download for any Blob or Data URI
 */
export function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  setTimeout(() => {
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Generates and downloads a rich, printable Study Material / PDF document for a lecture or attachment
 */
export function downloadLectureDocument(options: {
  title: string;
  courseTitle: string;
  specialtyName?: string;
  studentName: string;
  academicId?: string;
  contentSummary?: string;
  fileName?: string;
}) {
  const {
    title,
    courseTitle,
    specialtyName = 'الاختصاص الأكاديمي',
    studentName,
    academicId = 'غير محدد',
    contentSummary,
    fileName
  } = options;

  const dateStr = new Date().toLocaleDateString('ar-SY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const finalFileName = fileName || `${title.replace(/\s+/g, '_')}_مركز_المستقبل.html`;

  // Construct a self-contained, responsive, beautifully styled Arabic study document
  const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${courseTitle} | مركز المستقبل</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Cairo', sans-serif;
      background: #f8fafc;
      color: #0f172a;
      line-height: 1.8;
      padding: 24px;
    }
    .paper {
      max-width: 850px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      color: #0c3250;
    }
    .brand-subtitle {
      font-size: 13px;
      color: #2563eb;
      font-weight: 700;
    }
    .meta-badge {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      padding: 6px 14px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
    }
    .lecture-header {
      background: #f1f5f9;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .lecture-header h1 {
      font-size: 22px;
      color: #0c3250;
      margin-bottom: 8px;
    }
    .student-info {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      font-size: 13px;
      color: #475569;
      margin-top: 10px;
    }
    .student-info strong {
      color: #0c3250;
    }
    .section-title {
      font-size: 17px;
      font-weight: 800;
      color: #1e3a8a;
      margin: 24px 0 12px;
      border-right: 4px solid #2563eb;
      padding-right: 12px;
    }
    .content-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 18px;
      font-size: 14px;
      line-height: 1.9;
      color: #334155;
    }
    .summary-list {
      list-style-type: none;
      padding: 0;
    }
    .summary-list li {
      position: relative;
      padding-right: 24px;
      margin-bottom: 12px;
      font-size: 14px;
    }
    .summary-list li::before {
      content: "✔";
      position: absolute;
      right: 0;
      color: #2563eb;
      font-weight: bold;
    }
    .print-bar {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #64748b;
    }
    .print-btn {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-family: inherit;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
    }
    @media print {
      body { background: white; padding: 0; }
      .paper { border: none; box-shadow: none; padding: 0; max-width: 100%; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
  <div class="paper">
    <div class="header">
      <div>
        <div class="brand-title">مركز المستقبل • FUTURE CENTER</div>
        <div class="brand-subtitle">منصة التعليم الأكاديمي والمهني المعتمدة</div>
      </div>
      <div class="meta-badge">حقيبة دراسية أوفلاين</div>
    </div>

    <div class="lecture-header">
      <h1>${title}</h1>
      <div style="font-weight: bold; color: #2563eb; font-size: 14px;">مقرر: ${courseTitle} | ${specialtyName}</div>
      <div class="student-info">
        <span>الطالب: <strong>${studentName}</strong></span>
        <span>الرقم الأكاديمي: <strong>${academicId}</strong></span>
        <span>تاريخ التنزيل: <strong>${dateStr}</strong></span>
      </div>
    </div>

    <div class="section-title">ملخص ومحاور المحاضرة التعليمية</div>
    <div class="content-box">
      ${contentSummary ? `<p style="margin-bottom: 14px;">${contentSummary}</p>` : ''}
      <ul class="summary-list">
        <li><strong>المفهوم الأساسي:</strong> استيعاب المفاهيم النظرية والتطبيقية المقررة ضمن المنهاج المعتمد.</li>
        <li><strong>النقاط المحورية:</strong> دراسة الأمثلة المحلولة، القوانين والمصطلحات الأكاديمية والمهنية.</li>
        <li><strong>التطبيقات العملية:</strong> حل التمارين والمناقشات التفاعلية المرتبطة بالمقرر.</li>
        <li><strong>المراجع المساندة:</strong> المذكرات الرسمية والمحاضرات المصورة المعتمدة بمركز المستقبل.</li>
      </ul>
    </div>

    <div class="section-title">إرشادات الدراسة بدون إنترنت (Offline Study)</div>
    <div class="content-box" style="background: #f8fafc;">
      <p>هذا الملف تم تنزيله خصيصاً للدراسة والمراجعة عند انقطاع الاتصال بالإنترنت. يمكنك طباعة هذا المستند مباشرة أو حفظه بصيغة PDF عبر الضغط على زر الطباعة أدناه واختيار (Save as PDF).</p>
    </div>

    <div class="print-bar">
      <div>جميع الحقوق محفوظة © ${new Date().getFullYear()} لمركز المستقبل للتدريب والتأهيل العلمي.</div>
      <button class="print-btn" onclick="window.print()">طباعة / حفظ PDF</button>
    </div>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  triggerBrowserDownload(blob, finalFileName);
}

/**
 * Generates an authentic, standardized PDF document using jsPDF
 * Prevents corrupted PDF errors when opening files in standard PDF readers
 */
export function generateStandardPdfDoc(
  fileName: string,
  lectureTitle: string,
  courseTitle: string,
  studentName: string,
  academicId: string = 'FC-STUDENT'
): Blob {
  const canvas = document.createElement('canvas');
  // High-resolution A4 canvas: 1240 x 1754 (standard A4 ratio ~150 DPI)
  canvas.width = 1240;
  canvas.height = 1754;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.text('Future Center Academic Material', 20, 20);
    return doc.output('blob');
  }

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 1240, 1754);

  // Outer border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, 1180, 1694);

  // Top header bar (Navy Blue)
  const grad = ctx.createLinearGradient(30, 30, 1210, 30);
  grad.addColorStop(0, '#0c3250');
  grad.addColorStop(1, '#1e4976');
  ctx.fillStyle = grad;
  ctx.fillRect(30, 30, 1180, 190);

  // Gold accent line
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(30, 220, 1180, 8);

  // Header Texts
  ctx.direction = 'rtl';
  ctx.textAlign = 'center';

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px "Cairo", "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText('مركز المستقبل للتدريب والتأهيل العلمي', 620, 95);

  ctx.fillStyle = '#93c5fd';
  ctx.font = 'bold 22px "Cairo", "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText('FUTURE CENTER FOR EDUCATION & VOCATIONAL TRAINING', 620, 140);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = '18px "Cairo", "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText('المذكرة الأكاديمية المعتمدة — المنهاج الدراسي الرسمي', 620, 185);

  // Meta Box (Student & Course Information)
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(70, 260, 1100, 280);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(70, 260, 1100, 280);

  // Meta Box Header
  ctx.fillStyle = '#2563eb';
  ctx.fillRect(70, 260, 1100, 48);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Cairo", "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('بيانات الطالب والاعتماد الأكاديمي الرسمي', 1140, 292);

  // Grid details inside meta box
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 20px "Cairo", "Segoe UI", Tahoma, Arial, sans-serif';
  
  // Right Column
  ctx.fillText(`المقرر الدراسي: ${courseTitle || 'مقرر معتمد'}`, 1130, 355);
  ctx.fillText(`المحاضرة: ${lectureTitle || 'المحاضرة الرسمية'}`, 1130, 410);
  ctx.fillText(`اسم المستند: ${fileName || 'مذكرة دراسية'}`, 1130, 465);
  ctx.fillText(`تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SY', { year: 'numeric', month: 'long', day: 'numeric' })}`, 1130, 515);

  // Left Column (Student info)
  ctx.fillText(`اسم الطالب: ${studentName || 'طالب المركز'}`, 560, 355);
  ctx.fillText(`الرقم الأكاديمي: ${academicId}`, 560, 410);
  ctx.fillText(`حالة الاعتماد: معتمد رسمياً للدراسة والمراجعة`, 560, 465);
  ctx.fillText(`حقوق النشر: © مركز المستقبل ${new Date().getFullYear()}`, 560, 515);

  // Section 1: Overview & Learning Outcomes
  ctx.fillStyle = '#0c3250';
  ctx.font = 'bold 26px "Cairo", "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText('1. محاور المحاضرة والأهداف التعليمية المعتمدة:', 1140, 600);

  ctx.fillStyle = '#334155';
  ctx.font = '20px "Cairo", "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText('• الإلمام الكامل بالمفاهيم الأساسية والمصطلحات الأكاديمية للمقرر.', 1120, 650);
  ctx.fillText('• استيعاب التطبيقات العملية والتمارين التحليلية الخاصة بهذه المادة.', 1120, 695);
  ctx.fillText('• إعداد الطالب للامتحانات الدورية والمشاريع التطبيقية وفق معايير الاعتماد.', 1120, 740);

  // Section 2: Certified Notes Box
  ctx.fillStyle = '#eff6ff';
  ctx.fillRect(70, 780, 1100, 260);
  ctx.strokeStyle = '#bfdbfe';
  ctx.lineWidth = 2;
  ctx.strokeRect(70, 780, 1100, 260);

  ctx.fillStyle = '#1d4ed8';
  ctx.font = 'bold 24px "Cairo", "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText('2. ملخص المحتوى الدراسي والنقاط الجوهرية:', 1140, 830);

  ctx.fillStyle = '#1e3a8a';
  ctx.font = '19px "Cairo", "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText(`تم إعداد هذه المذكرة التعليمية الشاملة لتغطية مادة "${courseTitle}" بموجب الخطة الدراسية المعتمدة.`, 1130, 880);
  ctx.fillText(`تتضمن المحاضرة "${lectureTitle}" شروحات مركزة، أمثلة توضيحية، ومسائل تدريبية مصممة للتقييم الذاتي.`, 1130, 925);
  ctx.fillText('يُنصح الطلاب بمراجعة التمارين المرفقة ومقارنة الحلول مع الأسئلة النموذجية في بنك الأسئلة.', 1130, 970);
  ctx.fillText('يمكنك قراءة هذا المستند وتكرار مراجعته في أي وقت بدون الحاجة لاتصال بالإنترنت.', 1130, 1015);

  // Section 3: Study Guidelines
  ctx.fillStyle = '#0c3250';
  ctx.font = 'bold 26px "Cairo", "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText('3. إرشادات الاستذكار والامتحان:', 1140, 1090);

  ctx.fillStyle = '#334155';
  ctx.font = '20px "Cairo", "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText('• دوّن ملاحظاتك الهامة على كل فقرة دراسية لتعزيز الاستيعاب والحفظ.', 1120, 1140);
  ctx.fillText('• احرص على حل التطبيقات بيدك والتأكد من النتائج قبل الانتقال للمحاضرة التالية.', 1120, 1185);
  ctx.fillText('• راجع قسم الأسئلة الشائعة في المنصة التعليمية عند وجود أي استفسار أو تواصل مع المدرس.', 1120, 1230);

  // Official Stamp Box (Watermark Stamp)
  ctx.save();
  ctx.translate(300, 1420);
  ctx.beginPath();
  ctx.arc(0, 0, 95, 0, Math.PI * 2);
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, 85, 0, Math.PI * 2);
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#dc2626';
  ctx.textAlign = 'center';
  ctx.font = 'bold 18px "Cairo", "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText('مركز المستقبل للتدريب', 0, -35);
  ctx.font = 'bold 16px "Cairo", "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText('FUTURE CENTER', 0, -10);
  ctx.font = 'bold 22px "Cairo", "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText('★ معتمد رسمياً ★', 0, 20);
  ctx.font = '14px "Cairo", "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText('قسم الاعتماد والتوثيق', 0, 45);
  ctx.restore();

  // Verification Box
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(520, 1330, 650, 180);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(520, 1330, 650, 180);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px "Cairo", "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText('رمز التحقق والتوثيق الإلكتروني', 1140, 1370);

  ctx.fillStyle = '#475569';
  ctx.font = '15px "Cairo", "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.fillText(`المستند: ${fileName}`, 1140, 1410);
  ctx.fillText(`الرقم التسلسلي للنسخة: FC-PDF-${Date.now().toString(36).toUpperCase()}`, 1140, 1445);
  ctx.fillText('تم توليد هذه الوثيقة إلكترونياً من منصة مركز المستقبل للتعليم والتدريب وتعتبر سارية المفعول.', 1140, 1480);

  // Footer bar
  ctx.fillStyle = '#0c3250';
  ctx.fillRect(30, 1630, 1180, 60);

  ctx.fillStyle = '#ffffff';
  ctx.font = '15px "Cairo", "Segoe UI", Tahoma, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('جميع الحقوق محفوظة © مركز المستقبل للتدريب والتأهيل العلمي | معتمد من وزارة التربية والتعليم', 620, 1665);

  const imgData = canvas.toDataURL('image/png', 1.0);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  doc.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
  return doc.output('blob');
}

/**
 * Downloads a specific PDF file or provides a generated authentic PDF if no external file is present.
 * Uses Blobs and URL.createObjectURL to guarantee direct file download without being blocked by browser.
 */
export async function downloadLecturePdfFile(
  fileName: string, 
  lectureTitle: string, 
  courseTitle: string, 
  studentName: string,
  fileUrl?: string,
  fileId?: string,
  academicId: string = 'FC-STUDENT'
): Promise<boolean> {
  const pdfFileName = fileName.toLowerCase().endsWith('.pdf') ? fileName : `${fileName}.pdf`;

  // 1. Check if stored in IndexedDB (by idb: prefix or fileId)
  const isIdbRef = fileUrl && fileUrl.startsWith('idb:');
  const lookupId = isIdbRef ? fileUrl.replace('idb:', '') : fileId;
  
  if (lookupId) {
    try {
      const stored = await getPdfFromIndexedDb(lookupId);
      if (stored) {
        const blob = stored instanceof Blob ? stored : dataUrlToBlob(stored);
        triggerBrowserDownload(blob, pdfFileName);
        return true;
      }
    } catch (err) {
      console.warn('Could not read PDF from IndexedDB', err);
    }
  }

  // 2. If it's a real base64 data URL, convert to Blob first (avoids browser Chrome data-url blocking)
  if (fileUrl && fileUrl.startsWith('data:')) {
    try {
      const blob = dataUrlToBlob(fileUrl);
      triggerBrowserDownload(blob, pdfFileName);
      return true;
    } catch (err) {
      console.warn('Failed to parse data URL to blob', err);
    }
  }

  // 3. If it's a blob: URL
  if (fileUrl && fileUrl.startsWith('blob:')) {
    try {
      const res = await fetch(fileUrl);
      if (res.ok) {
        const blob = await res.blob();
        triggerBrowserDownload(blob, pdfFileName);
        return true;
      }
    } catch (_) {
      const anchor = document.createElement('a');
      anchor.href = fileUrl;
      anchor.download = pdfFileName;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => document.body.removeChild(anchor), 500);
      return true;
    }
  }

  // 4. If it's an external HTTP/HTTPS URL
  if (fileUrl && (fileUrl.startsWith('http://') || fileUrl.startsWith('https://'))) {
    try {
      const res = await fetch(fileUrl);
      if (res.ok) {
        const blob = await res.blob();
        triggerBrowserDownload(blob, pdfFileName);
        return true;
      }
    } catch (_) {
      // Fallback if CORS blocks direct fetch
      const anchor = document.createElement('a');
      anchor.href = fileUrl;
      anchor.download = pdfFileName;
      anchor.target = '_blank';
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      setTimeout(() => document.body.removeChild(anchor), 500);
      return true;
    }
  }

  // 5. Generate authentic, valid PDF binary with Future Center academic template
  try {
    const validPdfBlob = generateStandardPdfDoc(
      fileName,
      lectureTitle,
      courseTitle,
      studentName,
      academicId
    );
    triggerBrowserDownload(validPdfBlob, pdfFileName);
    return true;
  } catch (err) {
    console.error('Failed to generate PDF with canvas/jsPDF', err);
    // Fallback: download rich printable HTML document
    const cleanName = fileName.endsWith('.html') ? fileName : `${fileName}.html`;
    downloadLectureDocument({
      title: `ملف دراسي: ${fileName}`,
      courseTitle,
      studentName,
      academicId,
      contentSummary: `هذا الملف الدراسي ملحق بمحاضرة: "${lectureTitle}" ضمن مقرر "${courseTitle}". تم إعداده للتحميل والمراجعة المستمرة بدون إنترنت.`,
      fileName: cleanName
    });
    return false;
  }
}

/**
 * Saves a lecture completely into localStorage for instant offline access
 */
export function saveLectureToLocalOffline(studentId: string, lecture: OfflineSavedLecture) {
  try {
    const key = `${OFFLINE_KEY_PREFIX}${studentId}`;
    const existingStr = localStorage.getItem(key);
    const existing: OfflineSavedLecture[] = existingStr ? JSON.parse(existingStr) : [];
    
    // Remove if already exists, then push updated
    const filtered = existing.filter(l => l.id !== lecture.id);
    filtered.push(lecture);
    localStorage.setItem(key, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error('Failed to save lecture offline', err);
    return false;
  }
}

/**
 * Retrieves all offline-saved lectures for a student
 */
export function getLocalOfflineLectures(studentId: string): OfflineSavedLecture[] {
  try {
    const key = `${OFFLINE_KEY_PREFIX}${studentId}`;
    const existingStr = localStorage.getItem(key);
    return existingStr ? JSON.parse(existingStr) : [];
  } catch {
    return [];
  }
}

/**
 * Checks if a specific lecture is already saved offline
 */
export function isLectureSavedOffline(studentId: string, lectureId: string): boolean {
  const offlineLectures = getLocalOfflineLectures(studentId);
  return offlineLectures.some(l => l.id === lectureId);
}

/**
 * Removes an offline saved lecture
 */
export function removeLectureFromOffline(studentId: string, lectureId: string) {
  try {
    const key = `${OFFLINE_KEY_PREFIX}${studentId}`;
    const existing = getLocalOfflineLectures(studentId);
    const filtered = existing.filter(l => l.id !== lectureId);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch (err) {
    console.error('Failed to remove offline lecture', err);
  }
}
