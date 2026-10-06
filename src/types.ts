export type Role = 'owner' | 'student';

export interface LectureFile {
  id: string;
  name: string;
  type: 'pdf' | 'summary' | 'exercise';
  fileSize: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface Lecture {
  id: string;
  number: number;
  title: string;
  description: string;
  duration: string;
  videoUrl: string;
  allowOffline: boolean;
  files: LectureFile[];
}

export interface Semester {
  id: string;
  name: string; // e.g. "الفصل الأول", "الفصل الثاني"
  lectures: Lecture[];
}

export interface Branch {
  id: string;
  name: string; // اسم الفرع مثلاً: "الفرع العام", "فرع البرمجيات ونظم المعلومات"
  code?: string;
  description?: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  specialtyId: string;
  branchId?: string; // الفرع التابع له
  academicYear?: 1 | 2; // 1 = السنة الأولى, 2 = السنة الثانية
  semesterTerm?: 1 | 2; // 1 = الفصل الأول, 2 = الفصل الثاني
  description: string;
  importance?: string; // أهمية المادة: توضيح بسيط لأهمية المادة ودورها
  learningOutcome?: string; // ما سيكتسبه الطالب من المادة (الهدف المباشر)
  price: number; // For Sham Cash payment
  creditHours?: number;
  semesters: Semester[];
}

export interface Specialty {
  id: string;
  programId: string; // Belongs to one of the 4 grand programs
  name: string; // e.g. "إدارة أعمال", "تطبيقات تقانة معلومات"
  code: string;
  overview: string; // الرؤية والهدف والغاية العامة من التخصص
  visionAndGoal?: string; // الرؤية والهدف والغاية العامة من التخصص
  duration: string; // مدة الدراسة: سنتان
  coursesCount: string; // عدد المواد: 24 مادة
  semestersCount: string; // عدد الفصول: 4 فصول دراسية
  importance: string; // أهمية الاختصاص
  whatYouStudy: string[]; // ماذا يدرس الطالب؟
  branches?: Branch[]; // الفروع التابعة للاختصاص
  courses: Course[];
}

export interface EducationalProgram {
  id: string; // 'diploma-medium' | 'diploma-specialized' | 'master-specialized' | 'vocational-training'
  title: string;
  tagline: string;
  description: string;
  iconName: string;
  specialties: Specialty[];
}

export interface StudentUser {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: 'student';
  email: string;
  phone: string;
  programId: string;
  specialtyId: string;
  branchId?: string; // الفرع التابع له الطالب
  allowedAcademicYears?: (1 | 2)[]; // السنوات الدراسية المفعلة (السنة الأولى، السنة الثانية)
  allowedSemesters?: (1 | 2)[]; // الفصول الدراسية المفعلة (الفصل الأول، الفصل الثاني)
  allowedCourseIds: string[]; // المقررات المفعلة للطالب (نظام الصلاحيات المحكم)
  canAttendLectures?: boolean; // السماح بحضور ومشاهدة المحاضرات
  canDownloadFiles?: boolean; // السماح بتنزيل الملفات والمذكرات الدراسية
  allowOffline: boolean; // صلاحية المشاهدة والتحميل Offline
  status: 'active' | 'suspended';
  joinedDate: string;
  academicIdNumber: string;
}

export interface OwnerUser {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: 'owner';
  email: string;
  phone: string;
}

export type PlatformUser = StudentUser | OwnerUser;

export interface ShamCashRequest {
  id: string;
  studentId: string;
  studentName: string;
  programTitle: string;
  specialtyName: string;
  requestedCourseIds: string[];
  requestedCourseNames: string[];
  amount: number;
  transactionNumber: string; // رقم عملية التحويل
  receiptImageUrl: string; // صورة إيصال التحويل
  notes: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
}

export interface AppNotification {
  id: string;
  userId: string; // 'all' or studentId
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  date: string;
  read: boolean;
}

export interface SiteSettings {
  platformName: string;
  welcomeBadge: string;
  heroHeadline: string;
  heroSubtitle: string;
  aboutCenterText: string;
  mission: string;
  vision: string;
  goals: string[];
  smartEnvironmentFeatures: Array<{
    title: string;
    description: string;
    icon: string;
  }>;
  hallsAndEquipment: Array<{
    title: string;
    description: string;
  }>;
  shamCashCode: string; // كود شام كاش المعتمد للمركز
  shamCashNumber: string; // رقم حساب شام كاش
  shamCashAccountName: string;
  shamCashReceiverName?: string;
  shamCashInstructions?: string;
  shamCashBarcodeUrl?: string; // باركود / رمز QR شام كاش المعتمد لسداد الرسوم
  paymentInstructions: string;
  allowOfflineLecturesDownload: boolean; // خيار المالك: تفعيل أو إيقاف تنزيل محاضرات الأوفلاين للجميع
  extraAboutInfo?: string; // أي معلومات إضافية يعرضها المالك للطلاب
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  footerCopyright: string;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}
