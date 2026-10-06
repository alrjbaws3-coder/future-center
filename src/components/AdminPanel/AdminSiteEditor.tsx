import React, { useState, useEffect } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { Settings, Save, CreditCard, Phone, Globe, QrCode, Upload, Trash2, RefreshCw, DownloadCloud, Check, X, ShieldAlert } from 'lucide-react';
import { defaultShamCashBarcodeSvg } from '../../data/initialData';
import { UploadBarcodeModal } from './UploadBarcodeModal';

export const AdminSiteEditor: React.FC = () => {
  const { siteSettings, updateSiteSettings, addToast } = usePlatform();
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [form, setForm] = useState({
    platformName: siteSettings.platformName,
    welcomeBadge: siteSettings.welcomeBadge,
    heroHeadline: siteSettings.heroHeadline,
    heroSubtitle: siteSettings.heroSubtitle,
    shamCashCode: siteSettings.shamCashCode || '0987654321',
    shamCashNumber: siteSettings.shamCashNumber,
    shamCashAccountName: siteSettings.shamCashAccountName,
    shamCashReceiverName: siteSettings.shamCashReceiverName || 'مركز المستقبل التعليمي',
    shamCashBarcodeUrl: siteSettings.shamCashBarcodeUrl || '',
    shamCashInstructions: siteSettings.shamCashInstructions || 'يرجى إرسال قيمة الرسوم المقررة عبر تطبيق شام كاش أو مسح رمز الباركود المعتمد أدناه، مع إرفاق رقم العملية واسمك الكامل.',
    paymentInstructions: siteSettings.paymentInstructions,
    allowOfflineLecturesDownload: siteSettings.allowOfflineLecturesDownload !== false,
    contactPhone: siteSettings.contactPhone,
    contactEmail: siteSettings.contactEmail,
    contactAddress: siteSettings.contactAddress,
    footerCopyright: siteSettings.footerCopyright
  });

  // Sync when siteSettings changes
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      shamCashBarcodeUrl: siteSettings.shamCashBarcodeUrl || '',
      shamCashCode: siteSettings.shamCashCode || '0987654321',
      shamCashReceiverName: siteSettings.shamCashReceiverName || 'مركز المستقبل التعليمي',
      allowOfflineLecturesDownload: siteSettings.allowOfflineLecturesDownload !== false
    }));
  }, [siteSettings]);

  const handleBarcodeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addToast('error', 'حجم الصورة كبير، يرجى اختيار ملف أقل من 5 ميغابايت.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setForm(prev => ({ ...prev, shamCashBarcodeUrl: result }));
        addToast('success', 'تم تحميل صورة الباركود بنجاح.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteSettings(form);
    addToast('success', 'تم حفظ إعدادات الموقع وبوابة الدفع والباركود بنجاح.');
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200">
        <h3 className="text-xl font-extrabold text-[#0c3250]">التعديل على الموقع والبيانات العامة</h3>
        <p className="text-xs text-[#595e65] mt-0.5">
          التحكم بجميع نصوص الواجهة، أرقام وحسابات شام كاش المعتمدة، وبيانات التواصل
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        
        {/* Section 1: Brand & Headlines */}
        <div className="space-y-4">
          <h4 className="font-extrabold text-sm text-[#0c3250] flex items-center gap-2 border-b border-slate-100 pb-2">
            <Globe className="w-4 h-4 text-[#32a1e6]" />
            <span>نصوص الواجهة الرئيسية والترويسة</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">اسم المنصة:</label>
              <input
                type="text"
                value={form.platformName}
                onChange={(e) => setForm({ ...form, platformName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">شارة الترحيب (Badge):</label>
              <input
                type="text"
                value={form.welcomeBadge}
                onChange={(e) => setForm({ ...form, welcomeBadge: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-slate-700 block">العنوان العريض في البانر (Hero Headline):</label>
            <input
              type="text"
              value={form.heroHeadline}
              onChange={(e) => setForm({ ...form, heroHeadline: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-slate-700 block">النص الفرعي للبانر:</label>
            <textarea
              value={form.heroSubtitle}
              onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
              rows={2}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Section 2: Sham Cash Settings */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="font-extrabold text-sm text-[#0c3250] flex items-center gap-2 border-b border-slate-100 pb-2">
            <CreditCard className="w-4 h-4 text-[#2563eb]" />
            <span>إعدادات الدفع عبر شام كاش (تظهر للطلاب عند طلب التفعيل)</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">رمز / رقم حساب شام كاش (المعتمد بالسداد):</label>
              <input
                type="text"
                value={form.shamCashCode}
                onChange={(e) => setForm({ ...form, shamCashCode: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">اسم صاحب الحساب / المستلم:</label>
              <input
                type="text"
                value={form.shamCashReceiverName}
                onChange={(e) => setForm({ ...form, shamCashReceiverName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">رقم هاتف شام كاش (الاحتياطي):</label>
              <input
                type="text"
                value={form.shamCashNumber}
                onChange={(e) => setForm({ ...form, shamCashNumber: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden font-mono"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">وصف المحفظة:</label>
              <input
                type="text"
                value={form.shamCashAccountName}
                onChange={(e) => setForm({ ...form, shamCashAccountName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Barcode QR Code Setting */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-800">باركود / رمز QR شام كاش لسداد الطلاب:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, shamCashBarcodeUrl: defaultShamCashBarcodeSvg }))}
                  className="px-2.5 py-1 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-800 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>الرمز الافتراضي</span>
                </button>
                {form.shamCashBarcodeUrl && (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, shamCashBarcodeUrl: '' }))}
                    className="px-2.5 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>إزالة</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="sm:col-span-2 space-y-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="w-full flex items-center justify-center p-3 border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-xl bg-blue-50/50 hover:bg-blue-50 cursor-pointer transition-colors text-center gap-2 text-blue-700 font-bold text-xs"
                >
                  <Upload className="w-4 h-4" />
                  <span>نافذة رفع وتأكيد باركود شام كاش المخصص</span>
                </button>
                <input
                  type="text"
                  value={form.shamCashBarcodeUrl}
                  onChange={(e) => setForm({ ...form, shamCashBarcodeUrl: e.target.value })}
                  placeholder="أو ضع رابط صورة الباركود هنا (URL)"
                  className="w-full p-2 rounded-xl border border-slate-300 focus:border-[#2563eb] text-xs font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-slate-200">
                {form.shamCashBarcodeUrl ? (
                  <img
                    src={form.shamCashBarcodeUrl}
                    alt="معاينة الباركود"
                    className="w-20 h-20 object-contain rounded-lg p-1"
                  />
                ) : (
                  <span className="text-slate-400 text-[11px]">لا يوجد باركود</span>
                )}
                <span className="text-[10px] text-emerald-600 font-bold mt-1">
                  {form.shamCashBarcodeUrl ? '✓ يظهر للطلاب' : 'غير محدد'}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-slate-700 block">تعليمات الدفع والتحويل للطلاب:</label>
            <textarea
              value={form.paymentInstructions}
              onChange={(e) => setForm({ ...form, paymentInstructions: e.target.value })}
              rows={2}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden leading-relaxed"
            />
          </div>
        </div>

        {/* Section 3: Contact & Footer */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="font-extrabold text-sm text-[#0c3250] flex items-center gap-2 border-b border-slate-100 pb-2">
            <Phone className="w-4 h-4 text-[#0284c7]" />
            <span>معلومات الاتصال وتذييل الموقع (Footer)</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">الهاتف:</label>
              <input
                type="text"
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">البريد الإلكتروني:</label>
              <input
                type="text"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">العنوان:</label>
              <input
                type="text"
                value={form.contactAddress}
                onChange={(e) => setForm({ ...form, contactAddress: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-slate-700 block">حقوق النشر (Footer Copyright):</label>
            <input
              type="text"
              value={form.footerCopyright}
              onChange={(e) => setForm({ ...form, footerCopyright: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Section 4: Owner's Offline Download Control */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h4 className="font-extrabold text-sm text-[#0c3250] flex items-center gap-2 border-b border-slate-100 pb-2">
            <DownloadCloud className="w-4 h-4 text-blue-600" />
            <span>التحكم في تنزيل محاضرات الأوفلاين (صلاحية المالك العامة)</span>
          </h4>

          <div className="p-4.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-[#0c3250]">السماح للطلاب بتنزيل المحاضرات أوفلاين</span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                  form.allowOfflineLecturesDownload ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {form.allowOfflineLecturesDownload ? 'مفعل للطلاب' : 'معطل للجميع حالياً'}
                </span>
              </div>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                عند إيقاف هذا الخيار، سيتم تعطيل تنزيل المحاضرات أوفلاين لجميع الطلاب عبر المنصة بقرار من المالك، 
                <strong className="text-slate-800"> مع بقاء قراءة وتنزيل مذكرات وملفات الـ PDF متاحة بشكل طبيعي ومستقل تماماً خارج الأوفلاين</strong>.
              </p>
              <p className="text-[11px] text-blue-700 font-medium">
                💡 <strong>التحكم المخصص لكل طالب:</strong> يمكنك أيضاً الذهاب إلى جدول <strong>(إدارة الطلاب)</strong> والسماح لبعض الطلاب بالتنزيل ومنع طلاب آخرين بحيث يقتصر حسابهم على المشاهدة فقط.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, allowOfflineLecturesDownload: !prev.allowOfflineLecturesDownload }))}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shrink-0 shadow-2xs ${
                form.allowOfflineLecturesDownload
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
            >
              {form.allowOfflineLecturesDownload ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>خاصية الأوفلاين مفعلة (انقر للإيقاف)</span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4" />
                  <span>خاصية الأوفلاين معطلة (انقر للتفعيل)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Save className="w-4 h-4" />
            <span>حفظ إعدادات الموقع</span>
          </button>
        </div>

      </form>

      {/* Upload Barcode Modal */}
      <UploadBarcodeModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
      />

    </div>
  );
};
