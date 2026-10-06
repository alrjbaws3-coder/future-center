import { EducationalProgram, StudentUser, OwnerUser, ShamCashRequest, AppNotification, SiteSettings } from '../types';

export const defaultShamCashBarcodeSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 370" width="320" height="370">
  <defs>
    <linearGradient id="scBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e3a8a" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </linearGradient>
  </defs>
  <rect width="320" height="370" rx="24" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
  <path d="M 0 24 C 0 10.745 10.745 0 24 0 L 296 0 C 309.255 0 320 10.745 320 24 L 320 54 L 0 54 Z" fill="url(#scBg)"/>
  <text x="160" y="34" fill="#ffffff" font-family="sans-serif" font-size="13" font-weight="bold" text-anchor="middle">شام كاش • SHAM CASH QR</text>
  <rect x="24" y="68" width="272" height="248" rx="16" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
  <rect x="44" y="88" width="60" height="60" rx="10" fill="none" stroke="#0f172a" stroke-width="8"/>
  <rect x="58" y="102" width="32" height="32" rx="6" fill="#0f172a"/>
  <rect x="216" y="88" width="60" height="60" rx="10" fill="none" stroke="#0f172a" stroke-width="8"/>
  <rect x="230" y="102" width="32" height="32" rx="6" fill="#0f172a"/>
  <rect x="44" y="236" width="60" height="60" rx="10" fill="none" stroke="#0f172a" stroke-width="8"/>
  <rect x="58" y="250" width="32" height="32" rx="6" fill="#0f172a"/>
  <rect x="114" y="92" width="10" height="10" rx="2" fill="#1e293b"/>
  <rect x="134" y="92" width="10" height="10" rx="2" fill="#1e293b"/>
  <rect x="154" y="92" width="10" height="10" rx="2" fill="#1e293b"/>
  <rect x="174" y="92" width="10" height="10" rx="2" fill="#1e293b"/>
  <rect x="194" y="92" width="10" height="10" rx="2" fill="#1e293b"/>
  <rect x="48" y="158" width="10" height="10" rx="2" fill="#1e293b"/>
  <rect x="48" y="178" width="10" height="10" rx="2" fill="#1e293b"/>
  <rect x="48" y="198" width="10" height="10" rx="2" fill="#1e293b"/>
  <rect x="48" y="218" width="10" height="10" rx="2" fill="#1e293b"/>
  <rect x="114" y="112" width="20" height="10" rx="2" fill="#0f172a"/>
  <rect x="144" y="112" width="10" height="20" rx="2" fill="#0f172a"/>
  <rect x="164" y="122" width="20" height="10" rx="2" fill="#0f172a"/>
  <rect x="194" y="112" width="10" height="20" rx="2" fill="#0f172a"/>
  <rect x="74" y="158" width="20" height="10" rx="2" fill="#0f172a"/>
  <rect x="74" y="178" width="10" height="20" rx="2" fill="#0f172a"/>
  <rect x="94" y="188" width="20" height="10" rx="2" fill="#0f172a"/>
  <rect x="114" y="148" width="16" height="16" rx="3" fill="#0f172a"/>
  <rect x="190" y="148" width="16" height="16" rx="3" fill="#0f172a"/>
  <rect x="114" y="218" width="16" height="16" rx="3" fill="#0f172a"/>
  <rect x="190" y="218" width="16" height="16" rx="3" fill="#0f172a"/>
  <rect x="216" y="158" width="20" height="10" rx="2" fill="#0f172a"/>
  <rect x="246" y="168" width="16" height="16" rx="3" fill="#0f172a"/>
  <rect x="226" y="188" width="16" height="16" rx="3" fill="#0f172a"/>
  <rect x="256" y="208" width="14" height="24" rx="3" fill="#0f172a"/>
  <rect x="114" y="246" width="24" height="12" rx="2" fill="#0f172a"/>
  <rect x="148" y="236" width="12" height="24" rx="2" fill="#0f172a"/>
  <rect x="170" y="246" width="30" height="12" rx="2" fill="#0f172a"/>
  <rect x="210" y="246" width="16" height="16" rx="2" fill="#0f172a"/>
  <rect x="236" y="246" width="24" height="12" rx="2" fill="#0f172a"/>
  <rect x="114" y="270" width="14" height="24" rx="2" fill="#0f172a"/>
  <rect x="138" y="280" width="24" height="14" rx="2" fill="#0f172a"/>
  <rect x="172" y="270" width="16" height="24" rx="2" fill="#0f172a"/>
  <rect x="198" y="276" width="24" height="16" rx="2" fill="#0f172a"/>
  <rect x="232" y="270" width="14" height="24" rx="2" fill="#0f172a"/>
  <rect x="256" y="270" width="14" height="24" rx="2" fill="#0f172a"/>
  <circle cx="160" cy="190" r="30" fill="#ffffff" stroke="#d97706" stroke-width="3"/>
  <circle cx="160" cy="190" r="25" fill="url(#goldGrad)"/>
  <text x="160" y="188" fill="#ffffff" font-family="sans-serif" font-size="11" font-weight="900" text-anchor="middle">شام</text>
  <text x="160" y="200" fill="#ffffff" font-family="sans-serif" font-size="9" font-weight="bold" text-anchor="middle">CASH</text>
  <text x="160" y="334" fill="#0f172a" font-family="monospace" font-size="12" font-weight="bold" text-anchor="middle">FC-984210</text>
  <text x="160" y="352" fill="#64748b" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">مركز المستقبل التعليمي</text>
</svg>
`)}`;

export const initialSiteSettings: SiteSettings = {
  platformName: 'منصة مركز المستقبل',
  welcomeBadge: 'منصة تعليمية مرخصة للمعرفة والابتكار',
  heroHeadline: 'نحو مستقبل أفضل',
  heroSubtitle: 'بيئة تعليمية ذكية متكاملة تجمع المعرفة الأكاديمية والمهارات التطبيقية في تجربة ريادية منظمة.',
  aboutCenterText: 'نحن مركز تعليمي مرخص، نقدم بيئة تعليمية ذكية بقاعات ممتازة ومجهزة بأحدث التقنيات لضمان جودة التعليم، ونسعى إلى توفير تجربة تعليمية حديثة ومنظمة تساعد الطلاب على الوصول إلى المحتوى الأكاديمي بسهولة ومرونة.',
  mission: 'تقديم برامج تعليمية وتدريبية معتمدة وفق أعلى معايير الجودة، وتأهيل كوادر قادرة على مواكبة متطلبات سوق العمل المعاصر.',
  vision: 'أن نكون الصرح التعليمي والمهني الرائد في توفير بيئات التعلم الذكية وتطوير الطاقات الوطنية.',
  goals: [
    'توفير محتوى أكاديمي مسجل عالي الجودة يتيح للطالب التعلّم في الوقت المناسب له.',
    'تجهيز القاعات الذكية بأحدث الشاشات التفاعلية والأنظمة الصوتية والتقنية الحديثة.',
    'تطوير مسارات تخصصية مهنية وأكاديمية متوافقة مع متطلبات سوق العمل المتجدد.',
    'تسهيل وصول الطلاب لكافة المقررات والملفات والمحاضرات بأسلوب هرمي منظم وسلس.'
  ],
  smartEnvironmentFeatures: [
    {
      title: 'قاعات تدريبية ذكية',
      description: 'مجهزة بأحدث الشاشات التفاعلية والأنظمة الذكية لضمان تجربة حضورية استثنائية.',
      icon: 'MonitorCheck'
    },
    {
      title: 'محتوى مسجل عالي الدقة',
      description: 'محاضرات مسجلة باستوديوهات احترافية تضمن وضوح الصوت والصورة والشروحات التطبيقية.',
      icon: 'Video'
    },
    {
      title: 'ملفات وحقائب PDF شاملة',
      description: 'مذكرات دراسية، ملخصات مركزة، وبنوك أسئلة لكل محاضرة قابلة للاطلاع والتحميل.',
      icon: 'FileText'
    },
    {
      title: 'إمكانية المشاهدة Offline',
      description: 'تحميل المحاضرات المفعلة لمشاهدتها بدون الحاجة لاتصال بالإنترنت للطلاب المصرح لهم.',
      icon: 'DownloadCloud'
    }
  ],
  hallsAndEquipment: [
    {
      title: 'مختبرات الحاسوب والأنظمة البرمجية',
      description: 'محطات عمل بأداء فائق متصلة بشبكات ألياف ضوئية وبرمجيات محاكاة تخصصية.'
    },
    {
      title: 'قاعات المحاضرات الكبرى (Smart Halls)',
      description: 'أنظمة تكييف مركزي، شاشات عرض عملاقة، وإضاءة مريحة للعينين تعزز التركيز.'
    },
    {
      title: 'استوديوهات التسجيل الأكاديمي الرقمي',
      description: 'تجهيزات صوتية وبصرية معتمدة لعزل الضجيج وتسجيل المحاضرات بدقة 4K.'
    }
  ],
  shamCashCode: 'FC-984210',
  shamCashNumber: '0987654321',
  shamCashAccountName: 'مركز المستقبل للتعليم / الحساب: 104829',
  shamCashReceiverName: 'مركز المستقبل التعليمي',
  shamCashInstructions: 'يرجى إرسال قيمة الرسوم المقررة عبر تطبيق شام كاش أو مسح رمز الباركود المعتمد أدناه، مع إرفاق رقم العملية واسمك الكامل.',
  shamCashBarcodeUrl: '',
  paymentInstructions: 'يرجى تحويل رسوم المقررات المراد تفعيلها عبر تطبيق «شام كاش» إلى رقم حساب المركز المعتمد أدناه، ثم إرفاق رقم العملية وصورة الإشعار ليتم تفعيل المقررات لحسابك مباشرة خلال وقت وجيز.',
  allowOfflineLecturesDownload: true, // تفعيل تنزيل محاضرات الأوفلاين افتراضياً
  extraAboutInfo: 'تأسس مركز المستقبل بهدف بناء جيل متمكن أكاديمياً وتقنياً وفق أعلى المعايير العالمية.',
  contactPhone: '+963 11 234 5678',
  contactEmail: 'info@futurecenter.edu',
  contactAddress: 'دمشق / المزة - أوتوستراد الجامعات، مجمع المستقبل التعليمي',
  footerCopyright: 'جميع الحقوق محفوظة لـ منصة مركز المستقبل © 2026'
};

export const initialPrograms: EducationalProgram[] = [
  // 1. دبلوم المعهد المتوسط
  {
    id: 'diploma-medium',
    title: 'دبلوم المعهد المتوسط',
    tagline: 'برنامج أكاديمي تطبيقي يضم اختصاصات تقنية وإدارية معتمدة',
    description: 'برنامج تعليمي شامل يهدف إلى بناء قاعدة صلبة في العلوم الإدارية والتطبيقات التقنية المعاصرة بمناهج حديثة.',
    iconName: 'GraduationCap',
    specialties: []
  },

  // 2. الدبلوم التخصصي
  {
    id: 'diploma-specialized',
    title: 'الدبلوم التخصصي',
    tagline: 'مسارات تخصصية متقدمة لتأهيل الكوادر لسوق العمل',
    description: 'برامج تدريبية وتطبيقية متقدمة تركز على المهارات العملية المباشرة المطلوبة في سوق العمل الحديث.',
    iconName: 'BookOpen',
    specialties: []
  },

  // 3. الماجستير المهني
  {
    id: 'master',
    title: 'الماجستير المهني',
    tagline: 'دراسات مهنية عليا وتطوير تنفيذي متقدم',
    description: 'برنامج تطوير قيادي وأكاديمي مخصص للمهنيين ورواد الأعمال الباحثين عن التميز والارتقاء المؤسسي.',
    iconName: 'Sparkles',
    specialties: []
  },

  // 4. التأهيل والتخصص المهني
  {
    id: 'professional-qualification',
    title: 'التأهيل والتخصص المهني',
    tagline: 'دورات تأهيلية مكثفة وشهادات كفاءة مهنية',
    description: 'مسارات تدريبية وتأهيلية مكثفة تواكب أحدث التقنيات والمعايير المهنية المعتمدة.',
    iconName: 'Layers',
    specialties: []
  }
];

export const initialStudents: StudentUser[] = [];

export const initialOwner: OwnerUser = {
  id: 'owner-hasakahm',
  username: 'hasakahm@gmail.com',
  password: 'AAaa1234',
  fullName: 'إدارة مركز المستقبل (المالك المعتمد)',
  role: 'owner',
  email: 'hasakahm@gmail.com',
  phone: '+963 11 234 5678'
};

export const initialShamCashRequests: ShamCashRequest[] = [];

export const initialNotifications: AppNotification[] = [
  {
    id: 'notif-welcome',
    userId: 'owner-1',
    title: 'مرحباً بك في منصتك التعليمية',
    message: 'تمت تهيئة قاعدة البيانات بنجاح في حالة نظيفة ومستقرة، يمكنك الآن إضافة الاختصاصات والمقررات والطلاب بحرية تامة.',
    type: 'success',
    date: '2026-10-03',
    read: false
  }
];
