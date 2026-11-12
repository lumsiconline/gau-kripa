import React from 'react';
import { ArrowRight, Video, CheckCircle2 } from 'lucide-react';
import { SEVA_ITEMS, SevaItem } from '../data/sevaData';
import { ImageCrop } from './ImageCrop';

interface SevaServicesSectionProps {
  onBookSeva: (item: SevaItem) => void;
}

export const SevaServicesSection: React.FC<SevaServicesSectionProps> = ({ onBookSeva }) => {
  return (
    <section id="seva-services" className="py-12 sm:py-16 bg-[#faf5e8] border-b border-[#ebdcb9] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12 space-y-2">
          <div className="inline-flex items-center justify-center gap-3">
            <svg className="w-7 h-4 sm:w-8 text-[#4a6b49]" viewBox="0 0 40 20" fill="currentColor">
              <path d="M0,10 C15,5 25,0 40,10 C25,20 15,15 0,10 Z" opacity="0.7"/>
              <circle cx="36" cy="10" r="2.5" />
            </svg>

            <span className="text-xs font-bold uppercase tracking-widest text-[#8a6828] bg-[#fbf2dd] px-3.5 py-1 rounded-full border border-[#ebdcb9]">
              गौमाता आहार व्यवस्था एवं सेवा
            </span>

            <svg className="w-7 h-4 sm:w-8 text-[#4a6b49] rotate-180" viewBox="0 0 40 20" fill="currentColor">
              <path d="M0,10 C15,5 25,0 40,10 C25,20 15,15 0,10 Z" opacity="0.7"/>
              <circle cx="36" cy="10" r="2.5" />
            </svg>
          </div>

          <h2 className="font-playfair text-2xl sm:text-4xl lg:text-[40px] font-black text-[#153e29] leading-tight">
            गौ-आहार प्रबंधन एवं प्रत्यक्ष सेवा
          </h2>

          <p className="text-xs sm:text-base text-[#6b5a45] font-medium leading-relaxed">
            प्रमाणित गौशालाओं में आपके नाम एवं गोत्र संकल्प के साथ गौमाता के भोजन की व्यवस्था। सेवा उपरांत आपके व्हाट्सएप पर आहार वितरण की वीडियो पुष्टि भेजी जाती है।
          </p>

          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#1b4b32] bg-[#f2e6cb] px-4 py-1.5 rounded-full border border-[#d9c49c] mt-1 shadow-2xs">
            <Video className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>प्रत्येक सेवा के साथ आहार वितरण की वीडियो पुष्टि उपलब्ध</span>
          </div>
        </div>

        {/* 6 Seva Service Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {SEVA_ITEMS.map((item) => (
            <div
              key={item.id}
              className="group bg-[#fffdf9] rounded-3xl overflow-hidden border border-[#ebdcb9] shadow-sm hover:shadow-xl hover:border-[#cfb784] transition-all flex flex-col justify-between"
            >
              <div>
                {/* HD Authentic Visual with Planetary Badge */}
                <div className="relative h-56 sm:h-60 w-full overflow-hidden bg-amber-50">
                  <ImageCrop
                    cropKey={item.cropKey}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    alt={item.title}
                  />

                  {/* Planetary Badge floating top-left */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[#faedd0]/95 text-[#6d460d] border border-[#d6ba7f] shadow-xs backdrop-blur-md">
                      {item.planetTag}
                    </span>
                  </div>

                  {/* Video Proof Badge floating top-right */}
                  <div className="absolute top-3 right-3 z-10">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-950/85 text-emerald-200 border border-emerald-400/50 shadow-xs backdrop-blur-md">
                      <Video className="w-3 h-3 text-emerald-400" />
                      <span>वीडियो पुष्टि</span>
                    </span>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Service Details */}
                <div className="p-5 sm:p-6 text-left space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-playfair text-xl font-bold text-[#1b4b32] leading-snug group-hover:text-[#123824] transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  {/* Highlighted Price with Exact Quantity */}
                  <div className="inline-flex items-baseline gap-2 bg-[#fdf6e7] px-3.5 py-1.5 rounded-xl border border-[#ebdcb9]">
                    <span className="text-xs font-bold text-[#8a7251] uppercase">नियत शुल्क:</span>
                    <span className="text-xl sm:text-2xl font-black text-[#1b4b32]">
                      {item.priceDisplay}
                    </span>
                  </div>

                  {/* Description / Fulfilment */}
                  <p className="text-xs text-[#5e513e] leading-relaxed">
                    {item.benefit}
                  </p>

                  {/* Fulfilment Assurance */}
                  <div className="pt-2 border-t border-[#f2e7cd] flex items-center gap-1.5 text-[11px] text-[#1b4b32] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{item.fulfilmentDetails}</span>
                  </div>
                </div>
              </div>

              {/* Book Now Button */}
              <div className="p-5 pt-0 sm:p-6 sm:pt-0">
                <button
                  onClick={() => onBookSeva(item)}
                  className="w-full py-3 px-4 rounded-full bg-[#1b4b32] hover:bg-[#153e29] active:scale-98 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer group-hover:bg-[#123824]"
                >
                  <span>आहार सेवा व्यवस्था करें</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-amber-300" />
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Service Transparency Assurance Card */}
        <div className="mt-10 p-5 sm:p-6 rounded-3xl bg-[#fffdf9] border-2 border-[#ebdcb9] shadow-sm max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div className="space-y-1">
              <h4 className="font-playfair text-base sm:text-lg font-bold text-[#1b4b32]">
                100% प्रत्यक्ष एवं पारदर्शी आहार सेवा प्रबंधन
              </h4>
              <p className="text-xs text-[#6e6351]">
                यह एक निर्धारित आहार प्रबंधन सेवा है। आपके द्वारा चयनित आहार (चारा, गुड़-चना या रोटी) को तय मात्रा में गौशाला तक पहुँचाकर गौमाता को अर्पित किया जाता है।
              </p>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs border border-emerald-300">
                <Video className="w-3.5 h-3.5 text-emerald-700" />
                <span>व्हाट्सएप वीडियो पुष्टि</span>
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
