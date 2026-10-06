import React, { useState, useEffect } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { 
  ShieldCheck, 
  Clock, 
  UserCheck, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCcw, 
  RefreshCw, 
  Filter, 
  Search,
  Lock,
  History
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  account: string;
  action: string;
  category: 'auth' | 'data_change' | 'isolation' | 'security' | 'restore';
  details: string;
  status: 'success' | 'warning' | 'error';
  userRole?: string;
  targetId?: string;
}

export const AuditLogsViewer: React.FC = () => {
  const { restoreOwnerData, addToast } = usePlatform();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs', {
        headers: {
          'x-user-account': 'hasakahm@gmail.com',
          'x-user-email': 'hasakahm@gmail.com'
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.logs && Array.isArray(json.logs)) {
          setLogs(json.logs);
        }
      }
    } catch (e) {
      console.warn('Could not fetch audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRestore = async () => {
    setIsRestoring(true);
    await restoreOwnerData();
    setIsRestoring(false);
    fetchLogs();
  };

  const filteredLogs = logs.filter(log => {
    if (selectedCategory !== 'all' && log.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.account.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const categoryLabels: Record<string, { label: string; color: string }> = {
    auth: { label: 'تسجيل دخول وجلسات', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    data_change: { label: 'تعديل وحفظ بيانات', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    isolation: { label: 'عزل البيانات والحسابات', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    security: { label: 'أمان وصلاحيات', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    restore: { label: 'استرجاع النسخ الاحتياطية', color: 'bg-amber-50 text-amber-700 border-amber-200' }
  };

  const totalAuth = logs.filter(l => l.category === 'auth').length;
  const totalChanges = logs.filter(l => l.category === 'data_change').length;
  const totalIsolation = logs.filter(l => l.category === 'isolation' || l.category === 'security').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 shadow-2xs">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#0c3250] flex items-center gap-2">
              <span>سجل النشاطات وتتبع الجلسات (Audit Logs)</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                حساب معزول: hasakahm
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              مراقبة وتتبع عمليات تسجيل الدخول، وتعديلات البيانات، وضمان عدم تداخل جلسات الطلاب مع حساب المالك.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>تحديث السجل</span>
          </button>

          <button
            onClick={handleManualRestore}
            disabled={isRestoring}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
            <span>استرجاع مقررات المالك فوراً</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي العمليات المسجلة</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#0c3250] mt-2">{logs.length}</div>
          <span className="text-[11px] text-slate-400 font-medium">سجلات مدققة في قاعدة البيانات</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-blue-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700">عمليات الدخول والجلسات</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-900 mt-2">{totalAuth}</div>
          <span className="text-[11px] text-blue-600/70 font-medium">جلسات تسجيل الدخول وتغيير الأدوار</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">تعديلات البيانات والمقررات</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-900 mt-2">{totalChanges}</div>
          <span className="text-[11px] text-emerald-600/70 font-medium">تعديل تراكمي للمناهج والملفات</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700">إجراءات العزل والحماية</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-900 mt-2">{totalIsolation}</div>
          <span className="text-[11px] text-purple-600/70 font-medium">عزل تام لحساب المالك المعتمد</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            الكل ({logs.length})
          </button>
          {Object.entries(categoryLabels).map(([catKey, catInfo]) => {
            const count = logs.filter(l => l.category === catKey).length;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedCategory === catKey
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {catInfo.label} ({count})
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في العمليات والتفاصيل..."
            className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600">لا توجد عمليات تطابق البحث المحدد.</p>
            <p className="text-xs text-slate-400 mt-1">جميع الأنشطة يتم توثيقها تلقائياً وفور حدوثها.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map(log => {
              const cat = categoryLabels[log.category] || { label: log.category, color: 'bg-slate-100 text-slate-700' };
              const dateStr = new Date(log.timestamp).toLocaleString('ar-SY', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              });

              return (
                <div key={log.id} className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-black border ${cat.color}`}>
                        {cat.label}
                      </span>
                      <h4 className="text-sm font-black text-[#0c3250]">
                        {log.action}
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                        {log.account}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {log.details}
                    </p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 gap-1.5 text-left" dir="ltr">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{log.status === 'success' ? 'مكتمل بنجاح' : log.status}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{dateStr}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
