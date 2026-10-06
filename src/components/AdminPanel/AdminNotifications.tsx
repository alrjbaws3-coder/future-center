import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { 
  Bell, 
  Send, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  AlertTriangle,
  UserPlus,
  BookOpen,
  CreditCard,
  Check,
  Filter,
  Inbox,
  Radio
} from 'lucide-react';

export const AdminNotifications: React.FC = () => {
  const { 
    notifications, 
    students, 
    addNotification, 
    markNotificationAsRead,
    markAllNotificationsAsRead,
    addToast 
  } = usePlatform();

  // Active Main Tab: 'owner-alerts' vs 'broadcast'
  const [activeMainTab, setActiveMainTab] = useState<'owner-alerts' | 'broadcast'>('owner-alerts');

  // Category filter for owner alerts: 'all' | 'students' | 'education' | 'finance'
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'students' | 'education' | 'finance'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Broadcast Form State
  const [targetUserId, setTargetUserId] = useState<'all' | string>('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  // Owner specific notifications (sent to owner-1 or broadcast to all)
  const ownerNotifications = notifications.filter(n => n.userId === 'owner-1' || n.userId === 'all');
  
  // Counts
  const unreadOwnerCount = ownerNotifications.filter(n => !n.read).length;
  const studentRegCount = ownerNotifications.filter(n => n.title.includes('طالب') || n.title.includes('تسجيل')).length;
  const eduUpdateCount = ownerNotifications.filter(n => n.title.includes('تعليم') || n.title.includes('مقرر') || n.title.includes('محاضرة') || n.title.includes('فرع')).length;
  const financeCount = ownerNotifications.filter(n => n.title.includes('شام كاش') || n.title.includes('حوالة') || n.title.includes('تحويل')).length;

  // Filtered Owner Notifications
  const filteredOwnerNotifications = ownerNotifications.filter(n => {
    if (unreadOnly && n.read) return false;
    if (categoryFilter === 'students') {
      return n.title.includes('طالب') || n.title.includes('تسجيل');
    }
    if (categoryFilter === 'education') {
      return n.title.includes('تعليم') || n.title.includes('مقرر') || n.title.includes('محاضرة') || n.title.includes('فرع');
    }
    if (categoryFilter === 'finance') {
      return n.title.includes('شام كاش') || n.title.includes('حوالة') || n.title.includes('تحويل');
    }
    return true;
  });

  // Outgoing broadcast notifications sent to students
  const outgoingStudentNotifications = notifications.filter(n => n.userId !== 'owner-1');

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      addToast('error', 'يرجى إدخال عنوان ونص الإشعار.');
      return;
    }

    addNotification(targetUserId, title.trim(), message.trim(), type);
    addToast('success', 'تم إرسال الإشعار بنجاح إلى المستلمين.');
    setTitle('');
    setMessage('');
  };

  const getNotificationIcon = (notif: typeof notifications[0]) => {
    if (notif.title.includes('طالب') || notif.title.includes('تسجيل')) {
      return <UserPlus className="w-4 h-4 text-blue-600" />;
    }
    if (notif.title.includes('تعليم') || notif.title.includes('مقرر') || notif.title.includes('محاضرة')) {
      return <BookOpen className="w-4 h-4 text-emerald-600" />;
    }
    if (notif.title.includes('شام كاش') || notif.title.includes('حوالة')) {
      return <CreditCard className="w-4 h-4 text-amber-600" />;
    }
    if (notif.type === 'success') return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    if (notif.type === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-600" />;
    if (notif.type === 'error') return <AlertCircle className="w-4 h-4 text-rose-600" />;
    return <Info className="w-4 h-4 text-blue-600" />;
  };

  const getCategoryBadge = (notif: typeof notifications[0]) => {
    if (notif.title.includes('طالب') || notif.title.includes('تسجيل')) {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">تسجيل طالب</span>;
    }
    if (notif.title.includes('تعليم') || notif.title.includes('مقرر') || notif.title.includes('محاضرة')) {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">البيانات التعليمية</span>;
    }
    if (notif.title.includes('شام كاش') || notif.title.includes('حوالة')) {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">شام كاش والمالية</span>;
    }
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">عام</span>;
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <h3 className="text-xl font-extrabold text-[#0c3250]">نظام الإشعارات والتنبيهات المباشرة</h3>
          </div>
          <p className="text-xs text-[#595e65]">
            تنبيهات فورية للمالك عند تسجيل الطلاب الجدد أو تحديث البيانات التعليمية، مع إمكانية بث التعميمات للطلاب
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMainTab('owner-alerts')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeMainTab === 'owner-alerts'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>تنبيهات الإدارة الواردة</span>
            {unreadOwnerCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {unreadOwnerCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveMainTab('broadcast')}
            className={`px-3.5 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeMainTab === 'broadcast'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>إرسال تعميم للطلاب</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: OWNER ALERTS (المنبهات الواردة للمالك) */}
      {activeMainTab === 'owner-alerts' && (
        <div className="space-y-4">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div 
              onClick={() => { setCategoryFilter('all'); setUnreadOnly(false); }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                categoryFilter === 'all' && !unreadOnly ? 'bg-blue-50 border-blue-300 shadow-2xs' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-[11px] font-bold text-slate-500 block">إجمالي تنبيهات الإدارة</span>
              <span className="text-xl font-black text-[#0c3250]">{ownerNotifications.length}</span>
            </div>

            <div 
              onClick={() => { setCategoryFilter('students'); setUnreadOnly(false); }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                categoryFilter === 'students' ? 'bg-blue-50 border-blue-300 shadow-2xs' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-[11px] font-bold text-blue-600 block flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5" />
                <span>تسجيل الطلاب الجدد</span>
              </span>
              <span className="text-xl font-black text-blue-700">{studentRegCount}</span>
            </div>

            <div 
              onClick={() => { setCategoryFilter('education'); setUnreadOnly(false); }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                categoryFilter === 'education' ? 'bg-emerald-50 border-emerald-300 shadow-2xs' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-[11px] font-bold text-emerald-600 block flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>تحديث البيانات التعليمية</span>
              </span>
              <span className="text-xl font-black text-emerald-700">{eduUpdateCount}</span>
            </div>

            <div 
              onClick={() => { setCategoryFilter('finance'); setUnreadOnly(false); }}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                categoryFilter === 'finance' ? 'bg-amber-50 border-amber-300 shadow-2xs' : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className="text-[11px] font-bold text-amber-600 block flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5" />
                <span>طلبات شام كاش</span>
              </span>
              <span className="text-xl font-black text-amber-700">{financeCount}</span>
            </div>
          </div>

          {/* Controls & Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-bold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>التصنيف:</span>
              </span>
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  categoryFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('students')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  categoryFilter === 'students' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                تسجيل الطلاب
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('education')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  categoryFilter === 'education' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                المناهج والبيانات التعليمية
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('finance')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  categoryFilter === 'finance' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                شام كاش
              </button>
              <label className="flex items-center gap-1.5 mr-2 font-bold text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={unreadOnly}
                  onChange={(e) => setUnreadOnly(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span>غير المقروءة فقط</span>
              </label>
            </div>

            {unreadOwnerCount > 0 && (
              <button
                type="button"
                onClick={() => markAllNotificationsAsRead('owner-1')}
                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                <span>تحديد الكل كمقروء ({unreadOwnerCount})</span>
              </button>
            )}
          </div>

          {/* List of Owner Notifications */}
          <div className="space-y-3">
            {filteredOwnerNotifications.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-2">
                <Bell className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700">لا توجد تنبيهات مطابقة لهذا الفلتر</h4>
                <p className="text-xs text-slate-400">ستظهر هنا أي تنبيهات واردة عند تسجيل طالب جديد أو تعديل المقررات</p>
              </div>
            ) : (
              filteredOwnerNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    notif.read
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-blue-50/40 border-blue-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                      {getNotificationIcon(notif)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-sm text-[#0c3250]">{notif.title}</span>
                        {getCategoryBadge(notif)}
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                        )}
                        <span className="text-[11px] text-slate-400 font-mono">{notif.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                        {notif.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {!notif.read ? (
                      <button
                        type="button"
                        onClick={() => markNotificationAsRead(notif.id)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5 text-blue-600" />
                        <span>تمييز كمقروء</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-semibold px-2">
                        تم الاطلاع
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      )}

      {/* VIEW 2: BROADCAST ANNOUNCEMENTS TO STUDENTS */}
      {activeMainTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Send Notification Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h4 className="font-extrabold text-sm text-[#0c3250] flex items-center gap-2">
              <Send className="w-4 h-4 text-[#2563eb]" />
              <span>إرسال تعميم جديد للطلاب</span>
            </h4>

            <form onSubmit={handleSendBroadcast} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">المستلم:</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden font-bold"
                >
                  <option value="all">📢 جميع الطلاب في المنصة (تعميم عام)</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      👤 {s.fullName} (@{s.username}) — {s.academicIdNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">نوع الإشعار:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('info')}
                    className={`p-2 rounded-xl border text-center font-bold cursor-pointer flex items-center justify-center gap-1.5 ${
                      type === 'info' ? 'bg-sky-50 border-sky-300 text-sky-800' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <Info className="w-3.5 h-3.5" />
                    <span>معلوماتي</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('success')}
                    className={`p-2 rounded-xl border text-center font-bold cursor-pointer flex items-center justify-center gap-1.5 ${
                      type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-800' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تأكيد ونجاح</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('warning')}
                    className={`p-2 rounded-xl border text-center font-bold cursor-pointer flex items-center justify-center gap-1.5 ${
                      type === 'warning' ? 'bg-amber-50 border-amber-300 text-amber-800' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>تنبيه هام</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setType('error')}
                    className={`p-2 rounded-xl border text-center font-bold cursor-pointer flex items-center justify-center gap-1.5 ${
                      type === 'error' ? 'bg-rose-50 border-rose-300 text-rose-800' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>تحذير</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">عنوان الإشعار:</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: تحديث محتوى المحاضرة الثالثة"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">نص الرسالة:</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="اكتب تفاصيل الإشعار هنا للطلاب..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <Send className="w-4 h-4" />
                <span>إرسال الإشعار فوراً</span>
              </button>
            </form>
          </div>

          {/* Outgoing Student Announcements Log */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-[#0c3250] flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#32a1e6]" />
                <span>سجل التعميمات الصادرة للطلاب</span>
              </h4>
              <span className="text-xs text-slate-400">{outgoingStudentNotifications.length} تعميم مسجل</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {outgoingStudentNotifications.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-8">لا توجد تعميمات صادرة بعد.</p>
              ) : (
                outgoingStudentNotifications.map((notif) => {
                  const targetStudent = students.find(s => s.id === notif.userId);
                  const recipientText = notif.userId === 'all' 
                    ? '📢 جميع الطلاب' 
                    : `👤 ${targetStudent?.fullName || notif.userId}`;

                  return (
                    <div 
                      key={notif.id}
                      className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            notif.type === 'success' ? 'bg-emerald-500' : notif.type === 'error' ? 'bg-rose-500' : notif.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                          }`}></span>
                          <span className="font-extrabold text-[#0c3250]">{notif.title}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">{notif.date}</span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="text-[11px] text-[#2563eb] font-semibold pt-1 border-t border-slate-100">
                        المستلم: {recipientText}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
