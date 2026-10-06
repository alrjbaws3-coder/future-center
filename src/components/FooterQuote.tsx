import React from 'react';
import { Sparkles, GraduationCap } from 'lucide-react';

export const FooterQuote: React.FC = () => {
  return (
    <footer
      id="platform-fixed-footer"
      className="w-full bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white py-3.5 px-4 shadow-md border-t border-blue-700/50 transition-all"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-700/60 border border-blue-400/30 flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4 text-blue-200" />
          </div>
          <p className="text-xs sm:text-sm font-medium tracking-wide text-blue-50 leading-relaxed">
            <span className="font-bold text-white">مركز المستقبل: </span>
            «نحو مستقبل أفضل: مساحة تعليمية متكاملة تجمع المعرفة، المهارات، والفرص في تجربة واحدة رائدة تخدم الجميع»
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-xs text-blue-200/80">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>منصة الاعتماد الأكاديمي والمهني الموحدة © 2026</span>
        </div>
      </div>
    </footer>
  );
};
