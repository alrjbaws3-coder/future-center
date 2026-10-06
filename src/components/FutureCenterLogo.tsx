import React from 'react';

interface FutureCenterLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  emblemOnly?: boolean;
  arabicSubtitle?: boolean;
  className?: string;
  variant?: 'vertical' | 'horizontal';
}

/**
 * Official Future Center Vector Emblem
 * Accurately vectorized from WhatsApp Image 2026-08-05 at 3.18.16 PM.jpeg
 * Features:
 * 1. Sky-Blue crescent arc (left)
 * 2. Vibrant Green ascending curve tapering into an upward arrow (right)
 * 3. Three ascending green progress bars
 * 4. Leaping dynamic human figure in silver/slate gray
 */
export const FutureCenterEmblem: React.FC<{ size?: number; className?: string }> = ({ 
  size = 56, 
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 200 200" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 drop-shadow-xs ${className}`}
  >
    {/* 1. SKY-BLUE CRESCENT ARC (Left outer rim from top to bottom) */}
    <path 
      d="M106 14 C60 14 26 48 26 98 C26 132 44 158 72 172 C54 156 42 130 42 98 C42 60 68 30 106 28 C116 28 124 30 132 34 C124 22 116 14 106 14 Z" 
      fill="#32a1e6"
    />

    {/* 2. VIBRANT GREEN SWOOSH & ASCENDING ARROW (Bottom to right) */}
    {/* Green bottom curve */}
    <path 
      d="M50 106 C48 126 56 146 72 160 C90 176 116 178 138 168 C158 156 172 134 176 108 L184 112 L178 78 L152 94 L160 98 C156 116 144 132 130 142 C112 154 90 152 76 138 C68 130 62 118 60 106 Z" 
      fill="#72be20"
    />
    {/* Arrowhead tip pointing up-right */}
    <polygon 
      points="178,74 186,114 168,106 152,94" 
      fill="#72be20" 
    />

    {/* 3. THREE ASCENDING GREEN BARS (Representing growth, progress & future) */}
    {/* Bar 1 (Short - Left) */}
    <rect x="80" y="128" width="16" height="28" rx="4" fill="#72be20" />
    {/* Bar 2 (Medium - Middle) */}
    <rect x="102" y="112" width="16" height="44" rx="4" fill="#72be20" />
    {/* Bar 3 (Tall - Right) */}
    <rect x="124" y="96" width="16" height="60" rx="4" fill="#72be20" />

    {/* 4. LEAPING HUMAN SILHOUETTE (Silver/Slate Metallic Gray) */}
    {/* Head */}
    <circle cx="114" cy="52" r="12" fill="#9ca3af" />
    <circle cx="113" cy="51" r="10.5" fill="#b0bec5" />

    {/* Leaping Body, Outstretched Arms & Running Legs */}
    <path 
      d="M109 68 C98 72 84 78 72 85 C68 87 69 92 73 93 C77 94 82 92 87 88 C98 81 107 77 112 77 L108 92 L94 122 C91 126 94 130 98 128 C102 126 106 122 110 114 L120 95 L134 107 C139 111 150 115 156 113 C158 111 157 107 154 105 C146 102 138 97 131 89 L125 76 C130 73 140 71 150 77 C155 79 160 77 159 72 C159 69 152 66 144 64 C134 61 124 61 116 64 Z" 
      fill="#b0bec5"
    />
    <path 
      d="M134 107 L148 117 C153 120 161 121 165 119 C167 116 165 113 160 110 L148 102 Z" 
      fill="#9ca3af" 
    />
  </svg>
);

/**
 * Full Future Center Brand Logo
 * Matching WhatsApp Image 2026-08-05 at 3.18.16 PM.jpeg
 * Includes:
 * - The Vector Emblem
 * - Serif 'Future Center' typography (Future in Gray, Center in Blue)
 * - Optional Arabic 'مركز المستقبل'
 */
export const FutureCenterLogo: React.FC<FutureCenterLogoProps> = ({ 
  size = 'md', 
  showText = true,
  emblemOnly = false,
  arabicSubtitle = false,
  className = '',
  variant = 'horizontal'
}) => {
  const pixelSizes = {
    sm: 36,
    md: 48,
    lg: 64,
    xl: 84
  };

  const px = pixelSizes[size];

  if (emblemOnly) {
    return <FutureCenterEmblem size={px} className={className} />;
  }

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${className}`}>
        <FutureCenterEmblem size={px} />
        {showText && (
          <div className="mt-2 select-none">
            <div 
              className="text-2xl sm:text-3xl font-serif font-black tracking-tight"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
            >
              <span className="text-[#595e65]">Future </span>
              <span className="text-[#32a1e6]">Center</span>
            </div>
            {arabicSubtitle && (
              <div className="text-xs sm:text-sm font-black text-[#0c3250] mt-1" dir="rtl">
                مركز المستقبل التعليمي
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`} dir="ltr">
      {/* Emblem with clean container */}
      <div className="shrink-0 flex items-center justify-center">
        <FutureCenterEmblem size={px} />
      </div>

      {showText && (
        <div className="flex flex-col text-left leading-tight select-none">
          <div 
            className="text-lg sm:text-xl md:text-2xl font-serif font-black tracking-tight flex items-center gap-1.5"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
          >
            <span className="text-[#595e65]">Future</span>
            <span className="text-[#32a1e6]">Center</span>
          </div>

          {arabicSubtitle && (
            <div className="text-[11px] sm:text-xs font-black text-[#0c3250] flex items-center gap-1.5 justify-start mt-0.5" dir="rtl">
              <span className="w-1.5 h-1.5 rounded-full bg-[#72be20]"></span>
              <span>مركز المستقبل</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
