import React, { useState } from 'react';
import { usePlatform } from '../../context/PlatformContext';
import { Building2, Save, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export const AdminAboutEditor: React.FC = () => {
  const { siteSettings, updateSiteSettings } = usePlatform();

  const [form, setForm] = useState({
    aboutCenterText: siteSettings.aboutCenterText,
    mission: siteSettings.mission,
    vision: siteSettings.vision,
    goals: [...siteSettings.goals],
    newGoal: ''
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteSettings({
      aboutCenterText: form.aboutCenterText,
      mission: form.mission,
      vision: form.vision,
      goals: form.goals
    });
  };

  const addGoal = () => {
    if (form.newGoal.trim()) {
      setForm({ ...form, goals: [...form.goals, form.newGoal.trim()], newGoal: '' });
    }
  };

  const removeGoal = (index: number) => {
    setForm({ ...form, goals: form.goals.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200">
        <h3 className="text-xl font-extrabold text-[#0c3250]">إدارة قسم «حول المركز»</h3>
        <p className="text-xs text-[#595e65] mt-0.5">
          تعديل النص التعريفي الرسمي للمركز المرخص، والرسالة والرؤية والأهداف الأكاديمية
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
        
        {/* Official Licensed Center Text */}
        <div className="space-y-2">
          <label className="text-sm font-extrabold text-[#0c3250] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#0284c7]" />
            <span>النص التعريفي المعتمد لمركز المستقبل (الظاهر في الرئيسية):</span>
          </label>
          <textarea
            value={form.aboutCenterText}
            onChange={(e) => setForm({ ...form, aboutCenterText: e.target.value })}
            rows={4}
            className="w-full p-4 rounded-2xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden text-xs sm:text-sm leading-relaxed"
          />
        </div>

        {/* Mission and Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-[#0c3250] block">رسالة المركز:</label>
            <textarea
              value={form.mission}
              onChange={(e) => setForm({ ...form, mission: e.target.value })}
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-[#0c3250] block">رؤية المركز:</label>
            <textarea
              value={form.vision}
              onChange={(e) => setForm({ ...form, vision: e.target.value })}
              rows={3}
              className="w-full p-3 rounded-xl border border-slate-300 focus:border-[#2563eb] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Goals List */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <label className="text-sm font-extrabold text-[#0c3250] block">
            الأهداف الأكاديمية والمهنية للمركز:
          </label>

          <div className="space-y-2">
            {form.goals.map((goal, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-[#2563eb] font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="text-xs text-slate-700 flex-1">{goal}</span>
                <button
                  type="button"
                  onClick={() => removeGoal(idx)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add Goal input */}
          <div className="flex items-center gap-2 pt-2">
            <input
              type="text"
              value={form.newGoal}
              onChange={(e) => setForm({ ...form, newGoal: e.target.value })}
              placeholder="اكتب هدفاً جديداً لإضافته..."
              className="flex-1 p-2.5 rounded-xl border border-slate-300 text-xs focus:border-[#2563eb] focus:outline-hidden"
            />
            <button
              type="button"
              onClick={addGoal}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#2563eb]" />
              <span>إضافة هدف</span>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Save className="w-4 h-4" />
            <span>حفظ تعديلات «حول المركز»</span>
          </button>
        </div>

      </form>

      {/* Specialty management link notice */}
      <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-extrabold text-[#0c3250]">🎓 إدارة الاختصاصات والمواد الدراسية المعتمدة</h4>
          <p className="text-xs text-slate-600">
            لإضافة اختصاص جديد أو تعديل المواد المعروضة للطلاب في تبويب «حول المركز»، استخدم النموذج البسيط في «إدارة الاختصاصات والمواد».
          </p>
        </div>
      </div>

    </div>
  );
};
