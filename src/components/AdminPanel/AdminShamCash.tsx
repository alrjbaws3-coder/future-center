import React, { useState, useEffect } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { ShamCashRequest } from '../../types';
import { defaultShamCashBarcodeSvg } from '../../data/initialData';
import { UploadBarcodeModal } from './UploadBarcodeModal';
import { 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Eye, 
  ExternalLink, 
  Check, 
  X, 
  AlertCircle,
  FileText,
  Save,
  QrCode,
  Upload,
  Trash2,
  ZoomIn,
  RefreshCw,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';

export const AdminShamCash: React.FC = () => {
  const { shamCashRequests, approveShamCashRequest, rejectShamCashRequest, siteSettings, updateSiteSettings, addToast } = usePlatform();
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState<string | null>(null);

  // Sham Cash Account Settings State for Owner
  const [shamCashCode, setShamCashCode] = useState(siteSettings.shamCashCode || '0987654321');
  const [shamCashReceiverName, setShamCashReceiverName] = useState(siteSettings.shamCashReceiverName || 'مركز المستقبل التعليمي');
  const [shamCashInstructions, setShamCashInstructions] = useState(
    siteSettings.shamCashInstructions || 'يرجى إرسال قيمة الرسوم المقررة عبر تطبيق شام كاش أو مسح رمز الباركود المعتمد أدناه، مع إرفاق رقم العملية واسمك الكامل.'
  );
  const [shamCashBarcodeUrl, setShamCashBarcodeUrl] = useState(
    siteSettings.shamCashBarcodeUrl || ''
  );
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const [zoomBarcodeModal, setZoomBarcodeModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Sync state with siteSettings
  useEffect(() => {
    setShamCashBarcodeUrl(siteSettings.shamCashBarcodeUrl || '');
    setShamCashCode(siteSettings.shamCashCode || '0987654321');
    setShamCashReceiverName(siteSettings.shamCashReceiverName || 'مركز المستقبل التعليمي');
  }, [siteSettings]);

  const handleBarcodeFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('error', 'حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميغابايت.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setShamCashBarcodeUrl(result);
        updateSiteSettings({ shamCashBarcodeUrl: result });
        addToast('success', 'تم رفع وحفظ باركودك الشخصي بنجاح! يظهر الآن للطلاب في صفحة الدفع.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteSettings({
      shamCashCode,
      shamCashReceiverName,
      shamCashInstructions,
      shamCashBarcodeUrl
    });
    setIsEditingSettings(false);
    addToast('success', 'تم حفظ وتحديث بيانات حساب وباركود شام كاش للمركز بنجاح.');
  };

  // Reject modal
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('يرجى مراجعة إدارة المركز للتأكد من بيانات الحوالة وإعادة الإرسال.');

  const filtered = shamCashRequests.filter(req => {
    const matchStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchSearch = 
      req.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.transactionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.specialtyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.requestedCourseNames.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchStatus && matchSearch;
  });

  const pendingCount = shamCashRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Sham Cash Account Settings Card for Owner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-6 text-white shadow-md border border-blue-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shrink-0">
              <QrCode className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-200 text-[10px] font-bold border border-blue-400/30">
                  إدارة الدفع الإلكتروني
                </span>
              </div>
              <h3 className="text-xl font-black mt-0.5">رقم ورمز حساب شام كاش المعتمد للمركز</h3>
              <p className="text-xs text-blue-200/90 mt-0.5">
                هذا هو الرقم الذي يظهر للطلاب في بوابتهم التعليمية لتحويل رسوم المواد والاشتراكات
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{siteSettings.shamCashBarcodeUrl ? 'تغيير / استبدال باركودي' : 'إضافة باركود شام كاش الخاص بي'}</span>
            </button>

            <button
              onClick={() => setIsEditingSettings(!isEditingSettings)}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 cursor-pointer"
            >
              {isEditingSettings ? 'إلغاء التعديل' : 'تعديل بيانات الحساب'}
            </button>
          </div>
        </div>

        {isEditingSettings ? (
          <form onSubmit={handleSaveSettings} className="mt-5 space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-blue-100 block mb-1">رمز / رقم حساب شام كاش للمركز:</label>
                <input
                  type="text"
                  value={shamCashCode}
                  onChange={(e) => setShamCashCode(e.target.value)}
                  placeholder="مثال: 0987654321"
                  className="w-full p-2.5 rounded-xl bg-white/10 border border-white/30 text-white font-mono font-bold focus:border-white focus:outline-hidden text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-blue-100 block mb-1">اسم صاحب الحساب / المستلم:</label>
                <input
                  type="text"
                  value={shamCashReceiverName}
                  onChange={(e) => setShamCashReceiverName(e.target.value)}
                  placeholder="مثال: مركز المستقبل التعليمي"
                  className="w-full p-2.5 rounded-xl bg-white/10 border border-white/30 text-white font-bold focus:border-white focus:outline-hidden text-xs"
                />
              </div>
            </div>

            {/* Barcode & QR Code Section */}
            <div className="bg-white/10 rounded-2xl p-4 border border-white/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-blue-300" />
                  <div>
                    <h4 className="text-sm font-black text-white">باركود / رمز QR شام كاش لسداد الرسوم</h4>
                    <p className="text-[11px] text-blue-200">يظهر هذا الباركود للطلاب في بوابتهم لمسحه عبر تطبيق شام كاش أو كاميرا الجوال</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShamCashBarcodeUrl(defaultShamCashBarcodeSvg);
                      addToast('info', 'تم استعادة باركود شام كاش الافتراضي.');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold text-blue-200 flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>الباركود الافتراضي</span>
                  </button>

                  {shamCashBarcodeUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setShamCashBarcodeUrl('');
                        addToast('warning', 'تمت إزالة صورة الباركود.');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-[11px] font-bold text-red-200 flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>إزالة</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                {/* File Upload Controls */}
                <div className="md:col-span-2 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-blue-100 block mb-1.5">
                      رفع صورة الباركود من جهازك:
                    </label>
                    <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-white/30 hover:border-white/60 rounded-2xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all text-center group">
                      <Upload className="w-6 h-6 text-blue-300 group-hover:scale-110 transition-transform mb-1.5" />
                      <span className="text-xs font-bold text-white">انقر لاختيار صورة الباركود (PNG, JPG, SVG, WebP)</span>
                      <span className="text-[10px] text-blue-300 mt-0.5">يمكنك أيضاً سحب وإفلات ملف الصورة هنا (حجم أقصى 5MB)</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBarcodeFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-blue-100 block mb-1">
                      أو إدخال رابط صورة الباركود مباشرة:
                    </label>
                    <input
                      type="text"
                      value={shamCashBarcodeUrl}
                      onChange={(e) => setShamCashBarcodeUrl(e.target.value)}
                      placeholder="https://example.com/sham-cash-qr.png أو data:image/..."
                      className="w-full p-2.5 rounded-xl bg-white/10 border border-white/30 text-white font-mono text-xs focus:border-white focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Live Preview */}
                <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/5 border border-white/15 text-center">
                  <span className="text-[10px] font-bold text-blue-200 mb-2">المعاينة الفورية للباركود</span>
                  {shamCashBarcodeUrl ? (
                    <div className="relative group">
                      <img
                        src={shamCashBarcodeUrl}
                        alt="باركود شام كاش المعتمد"
                        className="w-28 h-28 object-contain rounded-xl bg-white p-1.5 shadow-md border border-white/30"
                      />
                      <button
                        type="button"
                        onClick={() => setZoomBarcodeModal(true)}
                        className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity gap-1"
                      >
                        <ZoomIn className="w-4 h-4" />
                        <span>تكبير</span>
                      </button>
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-xl border border-dashed border-white/30 flex flex-col items-center justify-center text-blue-300 p-2 text-center text-[10px]">
                      <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                      <span>لم يتم تحديد باركود</span>
                    </div>
                  )}
                  <span className="text-[10px] text-emerald-300 font-bold mt-2">
                    {shamCashBarcodeUrl ? '✓ جاهز للعرض للطلاب' : 'يرجى رفع صورة الباركود'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-blue-100 block mb-1">تعليمات التحويل للطلاب:</label>
              <textarea
                value={shamCashInstructions}
                onChange={(e) => setShamCashInstructions(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-xl bg-white/10 border border-white/30 text-white focus:border-white focus:outline-hidden text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingSettings(false)}
                className="px-4 py-2 rounded-xl text-blue-200 hover:bg-white/10 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ التعديلات وتحديث بوابة الطلاب</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-5 space-y-4">
            {/* Dedicated Personal Barcode Banner Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="w-16 h-16 rounded-2xl bg-white p-1.5 shadow-md flex items-center justify-center shrink-0 border border-white/30">
                  {siteSettings.shamCashBarcodeUrl ? (
                    <img
                      src={siteSettings.shamCashBarcodeUrl}
                      alt="باركود شام كاش المعتمد"
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <QrCode className="w-9 h-9 text-blue-900" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      siteSettings.shamCashBarcodeUrl 
                        ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' 
                        : 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                    }`}>
                      {siteSettings.shamCashBarcodeUrl ? '✓ باركودك الشخصي مفعّل' : '⚠️ لم تقم بإضافة باركودك بعد'}
                    </span>
                    <span className="text-[10px] text-blue-300">خاص بحساب المالك</span>
                  </div>
                  <h4 className="text-base font-black text-white mt-1">
                    {siteSettings.shamCashBarcodeUrl 
                      ? 'باركود شام كاش المعتمد للمركز (يظهر للطلاب حالياً)' 
                      : 'أضف باركود شام كاش الخاص بك الآن'}
                  </h4>
                  <p className="text-xs text-blue-200 mt-0.5 max-w-xl">
                    {siteSettings.shamCashBarcodeUrl
                      ? 'هذا هو الباركود الحقيقي الخاص بك، يمكنك تغييره بصورة جديدة أو حذفه في أي وقت بنقرة واحدة.'
                      : 'الباركود السابق كان تجريبياً. انقر على الزر أدناه لرفع صورة رمز QR الخاص بحسابك من تطبيق شام كاش ليظهر للطلاب.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
                <label className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>{siteSettings.shamCashBarcodeUrl ? 'رفع باركود جديد' : 'رفع باركودي من الجهاز'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBarcodeFileUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-black text-xs transition-all border border-white/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>نافذة ضبط الباركود</span>
                </button>

                {siteSettings.shamCashBarcodeUrl && (
                  <>
                    <button
                      type="button"
                      onClick={() => setZoomBarcodeModal(true)}
                      className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>تكبير</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateSiteSettings({ shamCashBarcodeUrl: '' });
                        addToast('info', 'تم حذف صورة الباركود.');
                      }}
                      className="px-3 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                      title="إزالة الباركود"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>إزالة</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Quick Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
                <span className="text-[11px] text-blue-300 block">رقم حساب شام كاش:</span>
                <span className="text-base font-black font-mono tracking-wider mt-1 block">
                  {siteSettings.shamCashCode || '0987654321'}
                </span>
              </div>

              <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
                <span className="text-[11px] text-blue-300 block">اسم المستلم الرسمي:</span>
                <span className="text-sm font-bold mt-1 block">
                  {siteSettings.shamCashReceiverName || 'مركز المستقبل التعليمي'}
                </span>
              </div>

              <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
                <span className="text-[11px] text-blue-300 block">حالة بوابة الدفع:</span>
                <span className="text-sm font-bold text-emerald-300 flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  مفعلة وتستقبل الطلبات
                </span>
              </div>

              <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] text-blue-300 block">حالة الباركود:</span>
                  <span className="text-xs font-bold text-white mt-1 block">
                    {siteSettings.shamCashBarcodeUrl ? '✓ معتمد ومفعّل للطلاب' : '⚠️ غير مضاف بعد'}
                  </span>
                </div>
                {siteSettings.shamCashBarcodeUrl ? (
                  <button
                    type="button"
                    onClick={() => setZoomBarcodeModal(true)}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-all"
                    title="تكبير الباركود"
                  >
                    <img
                      src={siteSettings.shamCashBarcodeUrl}
                      alt="باركود شام كاش"
                      className="w-10 h-10 object-contain rounded-lg bg-white p-0.5"
                    />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(true)}
                    className="px-2 py-1 rounded-lg bg-emerald-500 text-slate-950 text-[10px] font-black hover:bg-emerald-400 transition-colors"
                  >
                    + إضافة
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-extrabold text-[#0c3250]">طلبات الدفع عبر شام كاش</h3>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                {pendingCount} قيد المراجعة
              </span>
            )}
          </div>
          <p className="text-xs text-[#595e65]">
            مراجعة الحوالات المالية وإيصالات التحويل، والموافقة عليها لتفعيل المقررات لحساب الطالب آلياً
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'all' ? 'bg-white text-[#0c3250] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            الكل ({shamCashRequests.length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'pending' ? 'bg-amber-50 text-amber-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            قيد الانتظار ({pendingCount})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'approved' ? 'bg-blue-50 text-blue-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            مقبولة
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              filterStatus === 'rejected' ? 'bg-rose-50 text-rose-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            مرفوضة
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="البحث باسم الطالب، رقم عملية التحويل، أو اسم المقرر..."
          className="w-full pr-11 pl-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs focus:border-[#2563eb] focus:outline-hidden"
        />
      </div>

      {/* Requests Cards / List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
            لا توجد طلبات شام كاش مطابقة للمحددات الحالية.
          </div>
        ) : (
          filtered.map((req) => (
            <div
              key={req.id}
              className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all shadow-xs space-y-4 ${
                req.status === 'pending'
                  ? 'border-amber-200 hover:border-amber-300 bg-amber-50/20'
                  : req.status === 'approved'
                  ? 'border-blue-200'
                  : 'border-slate-200 opacity-80'
              }`}
            >
              
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    req.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : req.status === 'approved'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    <CreditCard className="w-5 h-5" />
                  </div>

                  <div>
                    <h4 className="text-base font-black text-[#0c3250]">{req.studentName}</h4>
                    <span className="text-xs text-slate-500">
                      {req.programTitle} • {req.specialtyName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <span className="text-xs text-slate-400 font-mono">{req.date}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    req.status === 'pending'
                      ? 'bg-amber-100 text-amber-800'
                      : req.status === 'approved'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {req.status === 'pending' ? 'قيد المراجعة' : req.status === 'approved' ? 'تمت الموافقة والتفعيل' : 'مرفوض'}
                  </span>
                </div>
              </div>

              {/* Body Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                
                {/* Col 1: Requested courses */}
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 text-[11px] block font-bold">المقررات المطلوب تفعيلها:</span>
                  <div className="space-y-1">
                    {req.requestedCourseNames.map((name, i) => (
                      <span key={i} className="inline-block px-2 py-0.5 bg-white text-[#2563eb] font-bold rounded-md border border-blue-100 mr-1 mb-1">
                        ✓ {name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Col 2: Payment details */}
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 space-y-1">
                  <span className="text-slate-400 text-[11px] block font-bold">تفاصيل الحوالة المالية:</span>
                  <div className="font-extrabold text-[#0c3250] text-sm">{req.amount.toLocaleString()} ل.س</div>
                  <div className="text-slate-600 font-mono text-[11px]">رقم العملية: {req.transactionNumber}</div>
                </div>

                {/* Col 3: Receipt Image & Notes */}
                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 space-y-2">
                  <span className="text-slate-400 text-[11px] block font-bold">إشعار التحويل والملاحظات:</span>
                  {req.receiptImageUrl ? (
                    <button
                      onClick={() => setSelectedReceiptUrl(req.receiptImageUrl)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-blue-600 hover:bg-blue-50 font-bold text-xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>معاينة صورة الإشعار</span>
                    </button>
                  ) : (
                    <span className="text-slate-400 italic">لا توجد صورة إشعار مرفقة</span>
                  )}
                  {req.notes && (
                    <p className="text-slate-600 text-[11px] line-clamp-2">
                      ملاحظة الطالب: {req.notes}
                    </p>
                  )}
                </div>

              </div>

              {/* Admin Note if already handled */}
              {req.adminNotes && (
                <div className="p-3 bg-slate-100/70 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>رد الإدارة: {req.adminNotes}</span>
                </div>
              )}

              {/* Action Buttons for Pending Requests */}
              {req.status === 'pending' && (
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
                  <button
                    onClick={() => {
                      setRejectingRequestId(req.id);
                      setRejectReason('يرجى مراجعة إدارة المركز للتأكد من بيانات الحوالة وإعادة الإرسال.');
                    }}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>رفض الطلب</span>
                  </button>

                  <button
                    onClick={() => approveShamCashRequest(req.id)}
                    className="px-5 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>موافقة وتفعيل المقررات فوراً</span>
                  </button>
                </div>
              )}

            </div>
          ))
        )}
      </div>

      {/* RECEIPT PREVIEW MODAL */}
      {selectedReceiptUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-black text-[#0c3250]">معاينة إشعار تحويل شام كاش</h4>
              <button
                onClick={() => setSelectedReceiptUrl(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-[70vh] flex items-center justify-center">
              <img
                src={selectedReceiptUrl}
                alt="إيصال التحويل"
                className="max-w-full max-h-[65vh] object-contain"
              />
            </div>

            <div className="text-center pt-2">
              <button
                onClick={() => setSelectedReceiptUrl(null)}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT REQUEST MODAL */}
      {rejectingRequestId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <h4 className="text-base font-black text-rose-700">رفض طلب شام كاش</h4>
            <p className="text-xs text-slate-500">
              يرجى كتابة سبب الرفض ليصل في إشعار للطالب في حسابه:
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">سبب الرفض:</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:outline-hidden text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectingRequestId(null)}
                className="px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  rejectShamCashRequest(rejectingRequestId, rejectReason);
                  setRejectingRequestId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ZOOM BARCODE MODAL */}
      {zoomBarcodeModal && (shamCashBarcodeUrl || siteSettings.shamCashBarcodeUrl) && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <h4 className="text-base font-black text-[#0c3250]">باركود شام كاش المعتمد</h4>
              </div>
              <button
                onClick={() => setZoomBarcodeModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-center">
              <img
                src={shamCashBarcodeUrl || siteSettings.shamCashBarcodeUrl}
                alt="باركود شام كاش"
                className="max-w-full max-h-[50vh] object-contain rounded-xl shadow-sm"
              />
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              <p className="font-bold text-slate-700">
                حساب: {siteSettings.shamCashCode || '0987654321'} ({siteSettings.shamCashReceiverName || 'مركز المستقبل التعليمي'})
              </p>
              <p>يظهر هذا الرمز لجميع الطلاب في شاشة السداد لمسحه وإتمام التحويل المباشر.</p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setZoomBarcodeModal(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Barcode Modal for Owner */}
      <UploadBarcodeModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
      />

    </div>
  );
};
