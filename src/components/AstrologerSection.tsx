import React from 'react';
import { Star, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { ASTROLOGERS, Astrologer } from '../data/sevaData';
import { ImageCrop } from './ImageCrop';

interface AstrologerSectionProps {
  onConnectAstrologer: (astrologer: Astrologer, mode: 'chat' | 'call') => void;
  onGeneralConnect: () => void;
}

export const AstrologerSection: React.FC<AstrologerSectionProps> = ({
  onConnectAstrologer,
  onGeneralConnect,
}) => {
  return (
    <section id="astrologers-section" className="py-12 sm:py-16 bg-[#faf5e8] border-b border-[#ebdcb9] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading with Sacred Leaf Flourish */}
        <div className="text-center mb-10 space-y-1.5">
          <div className="inline-flex items-center justify-center gap-3">
            <svg className="w-8 h-4 text-[#4a6b49]" viewBox="0 0 40 20" fill="currentColor">
              <path d="M0,10 C15,5 25,0 40,10 C25,20 15,15 0,10 Z" opacity="0.7"/>
              <circle cx="36" cy="10" r="2.5" />
            </svg>

            <h2 className="font-playfair text-3xl sm:text-4xl lg:text-[40px] font-bold text-[#153e29]">
              Connect with Our Expert Astrologers
            </h2>

            <svg className="w-8 h-4 text-[#4a6b49] rotate-180" viewBox="0 0 40 20" fill="currentColor">
              <path d="M0,10 C15,5 25,0 40,10 C25,20 15,15 0,10 Z" opacity="0.7"/>
              <circle cx="36" cy="10" r="2.5" />
            </svg>
          </div>

          <p className="text-sm sm:text-base text-[#6b5a45] font-medium">
            Get personalised guidance from experienced astrologers
          </p>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* 3 Astrologer Cards (Horizontal swipe on mobile, 3-col on tablet/desktop) */}
          <div className="lg:col-span-8 flex sm:grid sm:grid-cols-3 gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory no-scrollbar pb-3 px-4 sm:px-0 -mx-4 sm:mx-0">
            {ASTROLOGERS.map((astro) => (
              <div
                key={astro.id}
                className="w-[78vw] sm:w-auto shrink-0 snap-center bg-[#fffdf9] rounded-3xl sm:rounded-2xl overflow-hidden border border-[#ebdcb9] shadow-md sm:shadow-xs hover:shadow-lg hover:border-[#d9ba78] transition-all flex flex-col justify-between"
              >
                {/* Photo Header */}
                <div>
                  <div className="relative h-56 sm:h-44 w-full bg-[#f8efe0] overflow-hidden">
                    <ImageCrop
                      cropKey={astro.cropKey}
                      className="w-full h-full object-cover"
                      alt={astro.name}
                    />
                    
                    {/* Online Popup Green Dot */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 bg-emerald-950/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-400/60 shadow-md">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] font-black tracking-wider text-emerald-300 uppercase">
                        ONLINE
                      </span>
                    </div>

                    {/* Verified Badge */}
                    <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs rounded-full p-1.5 shadow-sm">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>

                  {/* Astrologer Info */}
                  <div className="p-3 text-center space-y-1">
                    <h3 className="font-playfair text-base font-bold text-[#1b4b32] leading-tight">
                      {astro.name}
                    </h3>
                    
                    <p className="text-xs font-semibold text-[#483d2e]">
                      {astro.title}
                    </p>

                    <p className="text-[11px] text-[#7d705c]">
                      {astro.experience}
                    </p>

                    {/* Star Rating */}
                    <div className="flex items-center justify-center gap-1 text-xs font-bold text-[#2e2619] pt-0.5">
                      <Star className="w-3.5 h-3.5 fill-[#e5a024] text-[#e5a024]" />
                      <span>{astro.rating}</span>
                      <span className="text-[11px] font-normal text-[#80725d]">({astro.reviewsCount})</span>
                    </div>

                    {/* Pricing */}
                    <div className="text-sm font-extrabold text-[#c4821a] pt-1">
                      ₹{astro.ratePerMin} / min
                    </div>
                  </div>
                </div>

                {/* CTA Action */}
                <div className="p-3 pt-0">
                  <button
                    onClick={() => onConnectAstrologer(astro, 'chat')}
                    className="w-full py-2 px-3 rounded-full bg-[#e5a024] hover:bg-[#d4901a] active:scale-98 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                  >
                    <span>Chat / Call Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* Green Trust Card (Span 4 on desktop) */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="h-full bg-[#153e29] rounded-3xl p-5 sm:p-6 text-white flex flex-col justify-between shadow-sm border border-[#23583c]">
              <div className="space-y-3 sm:space-y-4">
                <h3 className="font-playfair text-xl sm:text-2xl font-bold text-amber-200">
                  Why Choose GauKripa?
                </h3>

                <ul className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm font-medium text-emerald-50">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                    <span>Trusted &amp; Experienced Astrologers</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                    <span>100% Secure &amp; Private</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                    <span>Transparent Pricing</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                    <span>Instant Support</span>
                  </li>
                </ul>
              </div>

              <div className="pt-5">
                <button
                  onClick={onGeneralConnect}
                  className="w-full py-2.5 sm:py-3 px-4 rounded-full bg-[#e5a024] hover:bg-[#d4901a] active:scale-98 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <span>Connect Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
