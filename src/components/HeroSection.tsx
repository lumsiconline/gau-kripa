import React from 'react';
import { ArrowRight, Video, Flame, Compass } from 'lucide-react';
import { ImageCrop } from './ImageCrop';
import { useLanguage } from '../i18n/LanguageContext';

interface HeroSectionProps {
  onBookSevaToday: () => void;
  onExploreServices: () => void;
  onExploreAstrology: () => void;
  onOpenProofGallery: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onBookSevaToday,
  onExploreServices,
  onExploreAstrology,
  onOpenProofGallery,
}) => {
  const { tr } = useLanguage();

  return (
    <section className="w-full bg-[#fbf6ee] pt-3 sm:pt-5 pb-3">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6 space-y-2.5 sm:space-y-3">

        {/* Rounded Terracotta-Saffron Hero Banner Card */}
        <div className="relative w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_12px_32px_rgba(140,60,12,0.16)] bg-gradient-to-br from-[#a94207] via-[#bf5511] to-[#d9842b] min-h-[235px] sm:min-h-[290px] lg:min-h-[320px] flex items-center">

          {/* Right-side Garlanded Gau Mata Portrait seamlessly blended into saffron gradient */}
          <div className="absolute inset-y-0 right-0 w-[56%] sm:w-[52%] lg:w-[48%] select-none pointer-events-none">
            <ImageCrop
              cropKey="heroBannerCow"
              className="w-full h-full"
              preserveAspectRatio="xMidYMid slice"
              alt={tr('गौमाता सेवा एवं वैदिक ज्योतिष मार्गदर्शन', 'Gaumata Seva aur Vedic Jyotish Margdarshan')}
            />
            {/* Smooth gradient blend from saffron card left into cow sunlit right */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#b44909] via-[#b44909]/65 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#963805]/45 via-transparent to-transparent" />
          </div>

          {/* Left Content Column */}
          <div className="relative z-10 w-[72%] sm:w-[60%] lg:w-[58%] p-5 sm:p-8 lg:p-10 space-y-2.5 sm:space-y-3.5">
            <h1 className="font-playfair text-[22px] sm:text-3xl lg:text-[40px] font-bold leading-[1.15] tracking-tight drop-shadow-xs">
              <span className="text-[#f9c959]">{tr('गौमाता आहार', 'Gaumata Aahar')}</span>{' '}
              <span className="text-white">{tr('व्यवस्था', 'Vyavastha')}</span>
              <br />
              <span className="text-white">{tr('और', 'aur')}</span>{' '}
              <span className="text-[#f9c959]">{tr('वैदिक ज्योतिष', 'Vedic Jyotish')}</span>
              <br />
              <span className="text-white">{tr('मार्गदर्शन', 'Margdarshan')}</span>
            </h1>

            <p className="text-[11px] sm:text-sm text-[#fff0dc]/95 font-medium leading-snug max-w-md">
              {tr(
                'प्रमाणित गौमाता सेवा और आपके जीवन के लिए वैदिक ज्योतिष मार्गदर्शन।',
                'Pramanit Gaumata seva aur aapke jeevan ke liye Vedic Jyotish margdarshan.'
              )}
            </p>

            {/* Primary Pill CTA + Underlined Text Link */}
            <div className="pt-1 flex flex-wrap items-center gap-3.5 sm:gap-5">
              <button
                type="button"
                onClick={onBookSevaToday}
                className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-gradient-to-b from-[#fad062] to-[#df991d] hover:brightness-105 active:scale-98 text-[#361b05] font-bold text-xs sm:text-sm shadow-[0_6px_16px_rgba(45,20,0,0.25)] transition-all cursor-pointer whitespace-nowrap"
              >
                {tr('सेवा शुरू करें', 'Seva Shuru Karein')}
              </button>

              <button
                type="button"
                onClick={onExploreServices}
                className="inline-flex items-center gap-1 text-white hover:text-[#ffe19c] underline underline-offset-4 text-xs sm:text-sm font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>{tr('सेवाएँ देखें', 'Explore Services')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3 White Feature Pill Cards Tucked Neatly Underneath */}
        <div className="bg-[#f4e8d6] border border-[#ead9bf] rounded-2xl p-1.5 sm:p-2 grid grid-cols-3 gap-1.5 sm:gap-2.5">
          <button
            type="button"
            onClick={onExploreServices}
            className="bg-white hover:bg-[#fffaf2] rounded-xl px-2 sm:px-3.5 py-2 sm:py-2.5 flex items-center justify-center gap-1.5 sm:gap-2.5 shadow-2xs border border-[#efe2ce] transition-colors cursor-pointer group"
          >
            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#b54c0d] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Flame className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-[#2e1a0c] leading-tight text-left truncate">
              {tr('प्रत्यक्ष सेवा', 'Pratyaksh Seva')}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenProofGallery}
            className="bg-white hover:bg-[#fffaf2] rounded-xl px-2 sm:px-3.5 py-2 sm:py-2.5 flex items-center justify-center gap-1.5 sm:gap-2.5 shadow-2xs border border-[#efe2ce] transition-colors cursor-pointer group"
          >
            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#b54c0d] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Video className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-[#2e1a0c] leading-tight text-left truncate">
              {tr('वीडियो पुष्टि', 'Video Proof')}
            </span>
          </button>

          <button
            type="button"
            onClick={onExploreAstrology}
            className="bg-white hover:bg-[#fffaf2] rounded-xl px-2 sm:px-3.5 py-2 sm:py-2.5 flex items-center justify-center gap-1.5 sm:gap-2.5 shadow-2xs border border-[#efe2ce] transition-colors cursor-pointer group"
          >
            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#d88924] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Compass className="w-3.5 h-3.5" />
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-[#2e1a0c] leading-tight text-left truncate">
              {tr('ज्योतिष मार्गदर्शन', 'Jyotish Margdarshan')}
            </span>
          </button>
        </div>

      </div>
    </section>
  );
};
