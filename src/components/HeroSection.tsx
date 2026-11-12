import React from 'react';
import { ArrowRight, Sparkles, Video, CheckCircle2, MessageSquare } from 'lucide-react';
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
      <div className="relative w-full max-w-[1600px] mx-auto min-h-[540px] sm:min-h-[600px] lg:min-h-[660px] flex items-center">
        
        {/* Background Image Layer */}
        <div className="absolute inset-0 select-none overflow-hidden">
          <ImageCrop
            cropKey="diwaliHeroBanner"
            className="w-full h-full object-cover scale-102"
            alt="GauKripa Seva, Shanti and Samriddhi"
            preserveAspectRatio="xMidYMid slice"
          />

          {/* Deep warm vignetting for maximum text readability and golden illumination */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/70 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/40 pointer-events-none" />
        </div>

        {/* Floating Auspicious Badge in Top-Right */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-20 text-right pointer-events-none hidden sm:block">
          <p className="font-script text-2xl sm:text-3xl text-amber-200 font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] rotate-[-2deg]">
            &ldquo;गौ सेवा से ही सुख-शांति है...&rdquo;
          </p>
          <span className="text-[11px] font-hindi text-amber-300/90 tracking-wider">
            गौमाता आहार व्यवस्था • वैदिक ज्योतिष • आध्यात्मिक परामर्श
          </span>
        </div>

        {/* Content Container (Left-aligned over the warm glow) */}
        <div className="relative z-20 w-full px-4 sm:px-8 lg:px-12 py-10 sm:py-14 max-w-3xl space-y-4 sm:space-y-5">
          
          {/* Highlighted Golden Brand Tag */}
          <div className="inline-flex items-center gap-2 sm:gap-2.5 px-4 sm:px-5 py-2 rounded-full bg-gradient-to-r from-amber-950/90 via-amber-900/80 to-amber-950/90 border border-amber-400/60 shadow-[0_0_25px_rgba(255,215,0,0.35)] backdrop-blur-md">
            <span className="text-xl sm:text-2xl animate-pulse">🙏</span>
            <span className="font-hindi text-xl sm:text-2xl lg:text-3xl font-black tracking-wide golden-text-glow leading-none">
              गौकृपा (GauKripa)
            </span>
            <span className="text-lg sm:text-xl text-amber-300">✨</span>
            <span className="hidden md:inline-block text-xs font-semibold text-amber-100/90 border-l border-amber-400/40 pl-2.5 ml-1">
              आहार व्यवस्था एवं ज्योतिष मार्गदर्शन
            </span>
          </div>

          {/* Main Headline */}
          <div className="space-y-2">
            <h1 className="font-playfair text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight drop-shadow-md">
              गौमाता आहार व्यवस्था एवं <br />
              <span className="text-amber-300">वैदिक ज्योतिष मार्गदर्शन</span>
            </h1>

            <p className="font-hindi text-sm sm:text-base text-amber-100/95 font-medium leading-relaxed drop-shadow-sm max-w-2xl">
              प्रमाणित गौशालाओं में गौमाता के लिए शुद्ध एवं पौष्टिक आहार प्रबंधन (चारा, गुड़-चना, ताजी रोटियाँ) तथा अनुभवी आचार्यों द्वारा जन्म कुंडली, प्रेम, विवाह एवं करियर का प्रामाणिक ज्योतिष परामर्श।
            </p>
          </div>

          {/* Service Trust Highlights */}
          <div className="flex flex-wrap items-center gap-3 py-1 text-xs text-amber-200 font-medium">
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-3 py-1 rounded-full border border-amber-400/30">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>प्रत्यक्ष आहार प्रबंधन (5 किलो चारा ₹251, गुड़-चना ₹151, 4 रोटियां ₹51)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-3 py-1 rounded-full border border-amber-400/30">
              <Video className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>आहार वितरण की वीडियो पुष्टि WhatsApp पर</span>
            </div>
          </div>

          {/* 3 Iconic Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 max-w-2xl">
            {/* Feature 1: Gau Aahar Vyavastha */}
            <button
              onClick={onBookSevaToday}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-amber-400/30 backdrop-blur-md transition-all text-left cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M7 6c-1.5-1-3-1-4 0-.5 2 0 4 1 5" />
                  <path d="M17 6c1.5-1 3-1 4 0 .5 2 0 4-1 5" />
                  <rect x="6" y="8" width="12" height="12" rx="4" />
                  <circle cx="9.5" cy="13.5" r="1.2" fill="currentColor" />
                  <circle cx="14.5" cy="13.5" r="1.2" fill="currentColor" />
                  <path d="M9 17h6" />
                </svg>
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-amber-200 leading-tight">
                  गौमाता आहार सेवा
                </div>
                <div className="text-[11px] text-stone-300">
                  चारा, गुड़-चना, रोटी
                </div>
              </div>
            </button>

            {/* Feature 2: Vedic Jyotish Guidance */}
            <button
              onClick={onExploreAstrology}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-amber-400/30 backdrop-blur-md transition-all text-left cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0 group-hover:scale-105 transition-transform">
                <MessageSquare className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-amber-200 leading-tight">
                  वैदिक ज्योतिष
                </div>
                <div className="text-[11px] text-stone-300">
                  कुंडली, प्रेम, करियर
                </div>
              </div>
            </button>

            {/* Feature 3: Grah Shanti Upay */}
            <button
              onClick={onExploreRemedies}
              className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-amber-400/30 backdrop-blur-md transition-all text-left cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-amber-200 leading-tight">
                  ग्रह-नक्षत्र शांति
                </div>
                <div className="text-[11px] text-stone-300">
                  वैदिक सात्विक उपाय
                </div>
              </div>
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onBookSevaToday}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full bg-[#1b4b32] hover:bg-[#153e29] active:scale-98 text-white font-bold text-sm shadow-[0_0_20px_rgba(27,75,50,0.6)] border border-emerald-400/40 transition-all cursor-pointer group"
            >
              <span className="font-hindi text-base font-bold text-amber-300">आहार सेवा व्यवस्था करें</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-amber-300" />
            </button>

            <button
              onClick={onExploreAstrology}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-amber-500/25 hover:bg-amber-500/35 active:scale-98 text-amber-200 font-bold text-sm border border-amber-400/50 backdrop-blur-md transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>ज्योतिष परामर्श लें</span>
            </button>
          </div>

        </div>

      </div>
    </section>
  );
};
