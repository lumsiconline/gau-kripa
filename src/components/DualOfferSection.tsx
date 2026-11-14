import React from 'react';
import { Compass, Heart, TrendingUp } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface DualOfferSectionProps {
  onOpenRemedyModal: (remedyId: string) => void;
  onConsultAstrologer: () => void;
}

export const DualOfferSection: React.FC<DualOfferSectionProps> = ({
  onOpenRemedyModal,
  onConsultAstrologer,
}) => {
  const { tr } = useLanguage();

  const cards = [
    {
      id: 'family',
      icon: <Compass className="w-5 h-5 sm:w-6 sm:h-6 text-[#c97e2c]" />,
      title: tr('कुंडली', 'Kundali'),
      desc: tr('जन्म कुंडली एवं दोष निवारण', 'Janam Kundali & Dosh Nivaran'),
    },
    {
      id: 'love',
      icon: <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-[#c97e2c]" />,
      title: tr('प्रेम व विवाह', 'Love'),
      desc: tr('विवाह एवं संबंध मार्गदर्शन', 'Vivah & Relationship Guidance'),
    },
    {
      id: 'career',
      icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-[#c97e2c]" />,
      title: tr('करियर', 'Career'),
      desc: tr('व्यापार व नौकरी मार्गदर्शन', 'Business & Job Margdarshan'),
    },
  ];

  return (
    <section id="jyotish-margdarshan" className="py-4 sm:py-7 bg-[#fbf6ee]">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6">
        <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#fdf8ee] to-[#f8e6bd] border border-[#e7cb93] p-4 sm:p-6 shadow-[0_8px_24px_rgba(140,85,20,0.08)] overflow-hidden">

          {/* Subtle Decorative Mandala Watermarks in Corners */}
          <svg
            aria-hidden="true"
            viewBox="0 0 120 120"
            className="absolute -top-6 -right-6 w-28 h-28 text-[#d9a648]/25 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <circle cx="60" cy="60" r="52" strokeDasharray="4 4" />
            <circle cx="60" cy="60" r="38" />
            <circle cx="60" cy="60" r="22" strokeDasharray="3 3" />
          </svg>
          <svg
            aria-hidden="true"
            viewBox="0 0 120 120"
            className="absolute -bottom-8 -left-6 w-28 h-28 text-[#d9a648]/25 pointer-events-none"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
          >
            <circle cx="60" cy="60" r="52" strokeDasharray="4 4" />
            <circle cx="60" cy="60" r="36" />
          </svg>

          {/* Centered Title */}
          <h2 className="relative z-10 font-playfair text-xl sm:text-2xl font-bold text-[#2e1a0c] text-center mb-3.5 sm:mb-4">
            {tr('वैदिक ज्योतिष मार्गदर्शन', 'Vedic Jyotish Margdarshan')}
          </h2>

          {/* 3 Clean White Topic Cards */}
          <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-4 mb-3.5 sm:mb-4">
            {cards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => onOpenRemedyModal(card.id)}
                className="bg-white/95 hover:bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-[#ead6b2] hover:border-[#c97e2c] shadow-2xs hover:shadow-sm transition-all text-left flex flex-col justify-between cursor-pointer group"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#fdf3e1] border border-[#f2dcaf] flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  {card.icon}
                </div>
                <div>
                  <h3 className="text-xs sm:text-base font-bold text-[#2e1a0c] leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-[#6e5540] leading-snug mt-0.5 line-clamp-2">
                    {card.desc}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Full-Width Terracotta Consult Button */}
          <button
            type="button"
            onClick={onConsultAstrologer}
            className="relative z-10 w-full py-2.5 sm:py-3 px-5 rounded-xl bg-gradient-to-r from-[#a64108] via-[#b84c0e] to-[#a64108] hover:brightness-105 active:scale-99 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
          >
            {tr('वैदिक ज्योतिष परामर्श लें', 'Consult Vedic Jyotish')}
          </button>

        </div>
      </div>
    </section>
  );
};
