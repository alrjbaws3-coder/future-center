import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { QrCode, Upload, Trash2, X, Check, AlertCircle, Image as ImageIcon } from 'lucide-react';

interface UploadBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadBarcodeModal: React.FC<UploadBarcodeModalProps> = ({ isOpen, onClose }) => {
  const { siteSettings, updateSiteSettings, addToast } = usePlatform();

  const [barcodeData, setBarcodeData] = useState<string>(siteSettings.shamCashBarcodeUrl || '');
  const [shamCashCode, setShamCashCode] = useState<string>(siteSettings.shamCashCode || '0987654321');
  const [shamCashReceiverName, setShamCashReceiverName] = useState<string>(siteSettings.shamCashReceiverName || 'مركز المستقبل التعليمي');
  const [isDragging, setIsDragging] = useState(false);

  // Sync with siteSettings when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setBarcodeData(siteSettings.shamCashBarcodeUrl || '');
      setShamCashCode(siteSettings.shamCashCode || '0987654321');
      setShamCashReceiverName(siteSettings.shamCashReceiverName || 'مركز المستقبل التعليمي');
    }
  }, [isOpen, siteSettings]);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      addToast('error', 'يرجى اختيار ملف صورة صالح (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      addToast('error', 'حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميغابايت.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setBarcodeData(result);
      addToast('info', 'تم تحميل الصورة للمعاينة. اضغط «حفظ وتفعيل الباركود» لاعتماده.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeData) {
      addToast('error', 'يرجى رفع أو إدخال صورة الباركود أولاً.');
      return;
    }

    updateSiteSettings({
      shamCashBarcodeUrl: barcodeData,
      shamCashCode,
      shamCashReceiverName
    });

    addToast('success', 'تم حفظ وتفعيل باركود شام كاش الخاص بك بنجاح! يظهر الآن لجميع الطلاب في صفحة الدفع.');
    onClose();
  };

  const handleRemove = () => {
    setBarcodeData('');
    updateSiteSettings({
      shamCashBarcodeUrl: ''
    });
    addToast('info', 'تمت إزالة صورة الباركود بنجاح.');
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" 
      dir="rtl"
    >
      <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#0c3250]">إضافة باركود شام كاش الخاص بك</h3>
              <p className="text-xs text-slate-500">ارفع صورة رمز QR الخاص بحسابك ليتمكن الطلاب من مسحه والسداد فوراً</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          
          {/* File Upload Drag & Drop Zone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              صورة الباركود (لقطة شاشة أو صورة من تطبيق شام كاش):
            </label>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer ${
                isDragging 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-slate-100/70'
              }`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                id="barcode-file-modal-input"
              />

              <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                <div className="w-12 h-12 rounded-2xl bg-blue-100/80 text-blue-600 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    انقر هنا لاختيار صورة الباركود من جهازك
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    أو اسحب ملف الصورة وأفلته هنا (JPG, PNG, WebP)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* URL Alternative */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 block">
              أو ضع رابط صورة الباركود المباشر (URL):
            </label>
            <input
              type="text"
              value={barcodeData}
              onChange={(e) => setBarcodeData(e.target.value)}
              placeholder="https://... أو data:image/..."
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono text-left focus:border-blue-500 focus:outline-hidden"
              dir="ltr"
            />
          </div>

          {/* Live Preview Box */}
          <div className="p-4 rounded-2xl bg-slate-100/80 border border-slate-200 flex items-center gap-4">
            <div className="w-24 h-24 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 shrink-0 overflow-hidden shadow-2xs">
              {barcodeData ? (
                <img
                  src={barcodeData}
                  alt="معاينة باركود شام كاش"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-2 text-slate-400">
                  <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <span className="text-[10px] block">لا توجد صورة</span>
                </div>
              )}
            </div>

            <div className="space-y-1 flex-1 text-xs">
              <span className="font-bold text-slate-800 block">حالة الباركود:</span>
              {barcodeData ? (
                <div className="space-y-0.5">
                  <span className="text-emerald-700 font-bold flex items-center gap-1 text-xs">
                    <Check className="w-4 h-4 text-emerald-600" />
                    تم اختيار الصورة وجاهزة للحفظ
                  </span>
                  <p className="text-[11px] text-slate-500">
                    ستظهر هذه الصورة فوراً لجميع الطلاب في صفحة السداد ومسح الرمز.
                  </p>
                </div>
              ) : (
                <span className="text-amber-700 text-xs block">
                  لم يتم اختيار أي صورة بعد. اختر صورتك أو لقطة شاشة رمز QR من تطبيق شام كاش.
                </span>
              )}
            </div>
          </div>

          {/* Account Details Verification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div>
              <label className="font-bold text-slate-700 block mb-1">رقم حساب شام كاش:</label>
              <input
                type="text"
                value={shamCashCode}
                onChange={(e) => setShamCashCode(e.target.value)}
                placeholder="مثال: 0987654321"
                className="w-full p-2 rounded-xl border border-slate-300 font-mono font-bold focus:border-blue-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">اسم صاحب الحساب / المستلم:</label>
              <input
                type="text"
                value={shamCashReceiverName}
                onChange={(e) => setShamCashReceiverName(e.target.value)}
                placeholder="مثال: مركز المستقبل التعليمي"
                className="w-full p-2 rounded-xl border border-slate-300 focus:border-blue-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
            <div>
              {barcodeData && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 border border-rose-200"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>حذف الباركود</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={!barcodeData}
                className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black transition-all cursor-pointer shadow-md flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>حفظ وتفعيل باركودي الشخصي</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
