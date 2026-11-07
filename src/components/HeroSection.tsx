import React from 'react';
import { ArrowRight, Sparkles, Heart } from 'lucide-react';
import { ImageCrop } from './ImageCrop';

interface HeroSectionProps {
  onBookSevaToday: () => void;
  onExploreAstrology: () => void;
  onExploreRemedies: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onBookSevaToday,
  onExploreAstrology,
  onExploreRemedies,
}) => {
  return (
    <section className="relative w-full overflow-hidden bg-[#1a0f06]">
      
      {/* Main Festive Hero Banner Container */}
      <div className="relative w-full max-w-[1600px] mx-auto min-h-[520px] sm:min-h-[580px] lg:min-h-[640px] flex items-center">
        
        {/* Background Image Layer (Festive Diwali Gau Puja Scene from image_a83a3632.png) */}
        <div className="absolute inset-0 select-none overflow-hidden">
          <ImageCrop
            cropKey="diwaliHeroBanner"
            className="w-full h-full object-cover scale-102"
            alt="Diwali Gau Mata Puja with Family and Holy Calves"
            preserveAspectRatio="xMidYMid slice"
          />

          {/* Deep warm festive vignetting for maximum text readability and golden illumination */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 pointer-events-none" />
        </div>

        {/* Floating Auspicious Quote in Top-Right */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-20 text-right pointer-events-none hidden sm:block">
          <p className="font-script text-2xl sm:text-3xl text-amber-200 font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] rotate-[-2deg]">
            &ldquo;Seva se hi Shanti hai...&rdquo;
          </p>
          <span className="text-[11px] font-hindi text-amber-300/90 tracking-wider">
            गौ सेवा • सुख शांति • समृद्धि
          </span>
        </div>

        {/* Content Container (Left-aligned over the warm glow) */}
        <div className="relative z-20 w-full px-4 sm:px-8 lg:px-12 py-10 sm:py-14 max-w-3xl space-y-4 sm:space-y-5">
          
          {/* Highlighted Golden "शुभ दीपावली" Banner Tag */}
          <div className="inline-flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-amber-950/90 border border-amber-400/60 shadow-[0_0_25px_rgba(255,215,0,0.35)] backdrop-blur-md">
            <span className="text-xl sm:text-2xl animate-pulse">🪔</span>
            <span className="font-hindi text-2xl sm:text-3xl lg:text-4xl font-black tracking-wide golden-text-glow leading-none">
              शुभ दीपावली
            </span>
            <span className="text-lg sm:text-xl text-amber-300">✨</span>
            <span className="hidden md:inline-block text-xs font-semibold text-amber-100/90 border-l border-amber-400/40 pl-2.5 ml-1">
              गोवर्धन पूजा विशेष सङ्कल्प
            </span>
          </div>


          {/* Subtitle in Hindi & English */}
          <div className="space-y-1 max-w-xl">
            <p className="font-hindi text-sm sm:text-base text-amber-100 font-medium leading-relaxed drop-shadow-sm">
              दीपावली के पावन पर्व पर गौमाता व बछड़ों की सेवा कर पाएं माँ महालक्ष्मी का अखंड आशीर्वाद।
            </p>
            <p className="text-xs sm:text-sm text-stone-200 font-medium leading-snug drop-shadow-sm">
              Feed Gaumata, Support Jeev-Jantu, Remove Grah Dosh &amp; Find Peace.
            </p>
          </div>

          {/* 3 Iconic Feature Badges with Vertical Dividers */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 py-1 max-w-xl">
            
            {/* Badge 1: Sacred Animal Seva */}
            <button
              onClick={onBookSevaToday}
              className="flex items-center gap-2 group cursor-pointer text-left focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/60 flex items-center justify-center text-amber-300 shadow-md group-hover:scale-110 group-hover:bg-amber-400/30 transition-all backdrop-blur-xs">
                {/* Cow head icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 6c-1.5-1-3-1-4 0-.5 2 0 4 1 5" />
                  <path d="M17 6c1.5-1 3-1 4 0 .5 2 0 4-1 5" />
                  <rect x="6" y="8" width="12" height="12" rx="4" />
                  <circle cx="9.5" cy="13.5" r="1.2" fill="currentColor" />
                  <circle cx="14.5" cy="13.5" r="1.2" fill="currentColor" />
                  <path d="M9 17h6" />
                </svg>
              </div>
              <span className="text-xs font-bold text-white group-hover:text-amber-200 transition-colors leading-tight drop-shadow-sm">
                Sacred<br />Animal Seva
              </span>
            </button>

            <span className="hidden sm:inline-block h-6 w-px bg-amber-400/30" aria-hidden="true" />

            {/* Badge 2: Grah Shanti Upay */}
            <button
              onClick={onExploreRemedies}
              className="flex items-center gap-2 group cursor-pointer text-left focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/60 flex items-center justify-center text-amber-300 shadow-md group-hover:scale-110 group-hover:bg-amber-400/30 transition-all backdrop-blur-xs">
                {/* Lotus flower icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 4v16" />
                  <path d="M12 20c-3-2-6-6-6-11 3 0 6 4 6 11z" />
                  <path d="M12 20c3-2 6-6 6-11-3 0-6 4-6 11z" />
                  <path d="M6 13c-3 1-4 4-4 7 4 0 7-3 8-7" />
                  <path d="M18 13c3 1 4 4 4 7-4 0-7-3-8-7" />
                </svg>
              </div>
              <span className="text-xs font-bold text-white group-hover:text-amber-200 transition-colors leading-tight drop-shadow-sm">
                Grah Shanti<br />Upay
              </span>
            </button>

            <span className="hidden sm:inline-block h-6 w-px bg-amber-400/30" aria-hidden="true" />

            {/* Badge 3: Expert Astrology Guidance */}
            <button
              onClick={onExploreAstrology}
              className="flex items-center gap-2 group cursor-pointer text-left focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/60 flex items-center justify-center text-amber-300 shadow-md group-hover:scale-110 group-hover:bg-amber-400/30 transition-all backdrop-blur-xs">
                {/* Meditating Guru icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="6" r="3" />
                  <path d="M7 21v-3a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v3" />
                  <path d="M4 17l3-3" />
                  <path d="M20 17l-3-3" />
                </svg>
              </div>
              <span className="text-xs font-bold text-white group-hover:text-amber-200 transition-colors leading-tight drop-shadow-sm">
                Expert<br />Astrology Guidance
              </span>
            </button>

          </div>

          {/* Primary CTA Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onBookSevaToday}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#1b4b32] hover:bg-[#153e29] active:scale-98 text-white font-bold text-sm shadow-[0_0_20px_rgba(27,75,50,0.6)] border border-emerald-400/40 transition-all cursor-pointer group"
            >
              <span className="font-hindi text-base font-bold text-amber-300">दीपावली गौ सेवा सङ्कल्प</span>
              <span className="text-xs font-normal text-emerald-100">(Book Seva)</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-amber-300" />
            </button>

            <button
              onClick={onExploreRemedies}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 active:scale-98 text-amber-200 font-bold text-xs sm:text-sm border border-amber-400/40 backdrop-blur-md transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Grah Remedy &amp; Upay</span>
            </button>
          </div>

          {/* Live Goshala Status */}
          <div className="flex items-center gap-2 text-xs text-amber-200/90 pt-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span>Vrindavan Dham Goshala: Live Diwali Diya Puja &amp; Gau Seva Active</span>
          </div>

        </div>

      </div>

    </section>
  );
};
