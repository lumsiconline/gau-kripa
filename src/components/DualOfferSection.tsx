import React, { useState } from 'react';
import { ArrowRight, Briefcase, Heart, Leaf, Coins, Shield, Home as HomeIcon, Check, Sparkles } from 'lucide-react';
import { ImageCrop } from './ImageCrop';
import { REMEDY_CATEGORIES } from '../data/sevaData';

interface DualOfferSectionProps {
  onOpenRemedyModal: (remedyId: string) => void;
  onBookSevaWithDiscount: () => void;
}

export const DualOfferSection: React.FC<DualOfferSectionProps> = ({
  onOpenRemedyModal,
  onBookSevaWithDiscount,
}) => {
  const [selectedRemedy, setSelectedRemedy] = useState<string>('career');

  const getIcon = (id: string) => {
    switch (id) {
      case 'career':
        return <Briefcase className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
      case 'love':
        return <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 shrink-0" />;
      case 'health':
        return <Leaf className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case 'finance':
        return <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case 'negativity':
        return <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
      case 'family':
        return <HomeIcon className="w-3.5 h-3.5 text-amber-700 shrink-0" />;
      default:
        return <Briefcase className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  return (
    <section className="py-6 sm:py-10 bg-[#f7eed8]/50 border-b border-[#ebdcb9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Unified Compact Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 lg:gap-6 items-stretch">
          
          {/* Left Card: Find Your Grah Remedy (Compact on mobile and desktop) */}
          <div className="lg:col-span-7 bg-[#fefcf8] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-6 border border-[#e4d4ad] shadow-xs flex flex-col justify-between gap-3 sm:gap-4">
            
            {/* Top row: Kundali Wheel + Title Lockup */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Kundali Zodiac Wheel Crop: Compact on mobile, expansive on desktop */}
              <div className="w-14 h-14 sm:w-20 sm:h-20 lg:w-32 lg:h-32 shrink-0 rounded-full overflow-hidden border-2 border-[#d9ba78] shadow-xs bg-[#2d1b06]">
                <ImageCrop
                  cropKey="kundaliWheel"
                  className="w-full h-full object-cover scale-105"
                  alt="Sacred Vedic Kundali Zodiac Wheel with Om"
                />
              </div>

              {/* Title & Subtitle */}
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-playfair text-lg sm:text-2xl font-bold text-[#1b4b32] leading-tight">
                    Find Your Grah Remedy
                  </h3>
                  <span className="text-amber-500 text-xs hidden sm:inline">✨</span>
                </div>
                <p className="text-[11px] sm:text-xs text-[#6f604c] font-medium mt-0.5 leading-snug">
                  Select your problem and get the right seva &amp; upay
                </p>
              </div>
            </div>

            {/* 6 Selectable Problem Pills (NO truncation, perfectly fitted) */}
            <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
              {REMEDY_CATEGORIES.map((rem) => {
                const isSelected = selectedRemedy === rem.id;
                return (
                  <button
                    key={rem.id}
                    type="button"
                    onClick={() => setSelectedRemedy(rem.id)}
                    className={`px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-between gap-1.5 transition-all text-left border cursor-pointer ${
                      isSelected
                        ? 'bg-[#1b4b32] text-white border-[#1b4b32] shadow-xs'
                        : 'bg-[#f8f2e2] text-[#332b21] border-[#ebdcb9] hover:bg-[#efe3c5]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {getIcon(rem.id)}
                      <span className="leading-tight">{rem.title}</span>
                    </div>
                    {isSelected && <Check className="w-3 h-3 text-amber-300 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>

            {/* Compact CTA Row */}
            <div className="pt-0.5 flex items-center justify-between gap-2">
              <button
                onClick={() => onOpenRemedyModal(selectedRemedy)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 sm:py-2.5 rounded-full bg-[#1b4b32] hover:bg-[#153e29] active:scale-98 text-white font-semibold text-xs shadow-xs transition-all cursor-pointer"
              >
                <span>Get Your Remedy</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <span className="text-[10px] text-[#8b7654] font-medium hidden sm:inline">
                Instant Vedic recommendation &amp; Sankalp
              </span>
            </div>

          </div>

          {/* Right Card: Special Offer & Book Together (Compact & Integrated) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#fff7e6] via-[#fffaed] to-[#faeed3] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 lg:p-6 border-2 border-[#f3d99d] shadow-xs flex flex-col justify-between relative overflow-hidden gap-3">
            
            {/* Top Red Swallowtail Ribbon "Special Offer" */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
              <div className="relative bg-[#cc1a1a] text-white text-[10px] sm:text-[11px] font-bold px-4 sm:px-6 py-0.5 sm:py-1 rounded-b-md shadow-xs uppercase tracking-wider">
                Special Offer
                <div className="absolute top-0 -left-1.5 border-t-6 border-t-transparent border-r-6 border-r-[#8a0f0f]" />
                <div className="absolute top-0 -right-1.5 border-t-6 border-t-transparent border-l-6 border-l-[#8a0f0f]" />
              </div>
            </div>

            {/* Offer Content */}
            <div className="pt-3 sm:pt-4 flex items-center justify-between gap-3">
              <div className="space-y-0.5 sm:space-y-1">
                <p className="font-playfair text-base sm:text-xl font-bold text-[#1b4b32] leading-tight">
                  Book Any Seva &amp; Get
                </p>

                <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#cc1a1a] tracking-tight leading-none drop-shadow-xs">
                  50% OFF
                </div>

                <p className="text-[11px] sm:text-xs font-semibold text-[#38433a] leading-tight pt-0.5">
                  on Connecting with Astrologer
                </p>
              </div>

              {/* Compact 3D Gift Box Image */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 shrink-0">
                <ImageCrop
                  cropKey="giftBox"
                  className="w-full h-full object-contain"
                  alt="Special Vedic Seva Gift Box"
                />
              </div>
            </div>

            {/* Book Together Action Button */}
            <div className="pt-1">
              <button
                onClick={onBookSevaWithDiscount}
                className="w-full py-2.5 px-4 rounded-full bg-[#e5a024] hover:bg-[#d4901a] active:scale-98 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <span>Book Seva + Get Discount</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
