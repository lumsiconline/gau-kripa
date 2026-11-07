import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SEVA_ITEMS, SevaItem } from '../data/sevaData';
import { ImageCrop } from './ImageCrop';

interface SevaServicesSectionProps {
  onBookSeva: (item: SevaItem) => void;
}

export const SevaServicesSection: React.FC<SevaServicesSectionProps> = ({ onBookSeva }) => {
  return (
    <section id="seva-services" className="py-10 sm:py-16 bg-[#faf5e8] border-b border-[#ebdcb9] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading with Sacred Leaf Flourish */}
        <div className="text-center mb-6 sm:mb-10 space-y-1.5">
          <div className="inline-flex items-center justify-center gap-3">
            {/* Left flourish */}
            <svg className="w-7 h-4 sm:w-8 text-[#4a6b49]" viewBox="0 0 40 20" fill="currentColor">
              <path d="M0,10 C15,5 25,0 40,10 C25,20 15,15 0,10 Z" opacity="0.7"/>
              <circle cx="36" cy="10" r="2.5" />
            </svg>

            <h2 className="font-playfair text-2xl sm:text-4xl lg:text-[40px] font-bold text-[#153e29]">
              Our Seva Services
            </h2>

            {/* Right flourish */}
            <svg className="w-7 h-4 sm:w-8 text-[#4a6b49] rotate-180" viewBox="0 0 40 20" fill="currentColor">
              <path d="M0,10 C15,5 25,0 40,10 C25,20 15,15 0,10 Z" opacity="0.7"/>
              <circle cx="36" cy="10" r="2.5" />
            </svg>
          </div>

          <p className="text-xs sm:text-base text-[#6b5a45] font-medium">
            Choose a seva and bring positivity into your life
          </p>

          {/* Clean Mobile Swipe Indicator without buttons */}
          <div className="lg:hidden pt-1 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#8a7251]">
            <span>✨ Swipe left to explore all sacred sevas</span>
          </div>
        </div>

        {/* 6 Seva Cards: Native Horizontal Scroll on Mobile, 6-col Grid on Desktop */}
        <div className="flex lg:grid lg:grid-cols-6 gap-4 sm:gap-5 overflow-x-auto lg:overflow-visible snap-x snap-mandatory no-scrollbar pb-4 pt-1 px-4 sm:px-0 -mx-4 sm:mx-0">
          {SEVA_ITEMS.map((item) => (
            <div
              key={item.id}
              className="w-[84vw] sm:w-[320px] lg:w-auto shrink-0 snap-center group bg-[#fffdf9] rounded-3xl lg:rounded-2xl overflow-hidden border border-[#ebdcb9] shadow-md lg:shadow-xs hover:shadow-lg hover:border-[#cfb784] transition-all flex flex-col justify-between"
            >
              {/* Card Image with Big, Crisp HD Presentation */}
              <div>
                <div className="relative h-56 sm:h-64 lg:h-36 w-full overflow-hidden bg-amber-50">
                  <ImageCrop
                    cropKey={item.cropKey}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    alt={item.title}
                  />

                  {/* Planetary Badge floating on top-left */}
                  <div className="absolute top-3 left-3 lg:top-2 lg:left-2 z-10">
                    <span className="inline-flex items-center gap-1.5 text-xs lg:text-[11px] font-bold px-3 py-1 lg:px-2.5 lg:py-0.5 rounded-full bg-[#faedd0]/95 text-[#6d460d] border border-[#d6ba7f] shadow-sm backdrop-blur-md">
                      {item.planetTag}
                    </span>
                  </div>

                  {/* Subtle gradient scrim at bottom of image for contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Card Content with Generous Touch Target Spacing */}
                <div className="p-4 sm:p-5 lg:p-3.5 text-center flex flex-col items-center">
                  <h3 className="font-playfair text-lg sm:text-xl lg:text-base font-bold text-[#1b4b32] leading-tight">
                    {item.title}
                  </h3>

                  {/* Price */}
                  <div className="mt-1.5 sm:mt-2 lg:mt-1.5 text-xl sm:text-2xl lg:text-lg font-black text-[#1b4b32] leading-none">
                    {item.priceDisplay}
                  </div>

                  {/* Benefit text */}
                  <p className="mt-2 text-xs sm:text-[13px] lg:text-xs text-[#6e6351] leading-relaxed line-clamp-2 min-h-[36px] lg:min-h-[32px]">
                    {item.benefit}
                  </p>
                </div>
              </div>

              {/* Book Now Button */}
              <div className="p-4 pt-0 sm:p-5 sm:pt-0 lg:p-3.5 lg:pt-0">
                <button
                  onClick={() => onBookSeva(item)}
                  className="w-full py-3 lg:py-2 px-4 rounded-full bg-[#1b4b32] hover:bg-[#153e29] active:scale-98 text-white font-bold text-sm lg:text-xs flex items-center justify-center gap-2 transition-all shadow-md lg:shadow-xs cursor-pointer group-hover:shadow-sm"
                >
                  <span>Book Now</span>
                  <ArrowRight className="w-4 h-4 lg:w-3.5 lg:h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
