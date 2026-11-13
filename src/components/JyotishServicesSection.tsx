import React from 'react';
import { Heart, Users, Briefcase, Compass, Sparkles, ArrowRight, ShieldCheck, MessageSquare } from 'lucide-react';
import { getLocalizedJyotishCategories, JyotishCategory } from '../data/sevaData';
import { useLanguage } from '../i18n/LanguageContext';

interface JyotishServicesSectionProps {
  onSelectCategory: (category: JyotishCategory) => void;
  onGeneralConsult: () => void;
}

export const JyotishServicesSection: React.FC<JyotishServicesSectionProps> = ({
  onSelectCategory,
  onGeneralConsult
}) => {
  const { lang, tr } = useLanguage();
  const categories = getLocalizedJyotishCategories(lang);

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'Heart':
        return <Heart className="w-5 h-5 text-rose-600" />;
      case 'Users':
        return <Users className="w-5 h-5 text-amber-700" />;
      case 'Briefcase':
        return <Briefcase className="w-5 h-5 text-emerald-700" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-indigo-700" />;
      case 'Sparkles':
      default:
        return <Sparkles className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <section id="jyotish-guidance" className="py-12 sm:py-16 bg-[#fffdf9] border-b border-[#ebdcb9] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12 space-y-2.5">
          <div className="inline-flex items-center justify-center gap-3">
            <svg className="w-8 h-4 text-[#4a6b49]" viewBox="0 0 40 20" fill="currentColor">
              <path d="M0,10 C15,5 25,0 40,10 C25,20 15,15 0,10 Z" opacity="0.7"/>
              <circle cx="36" cy="10" r="2.5" />
            </svg>

            <span className="text-xs font-bold uppercase tracking-widest text-[#8a6828] bg-[#fbf2dd] px-3.5 py-1 rounded-full border border-[#ebdcb9]">
              {tr('वैदिक ज्योतिष एवं आध्यात्मिक परामर्श', 'Vedic Astrology & Spiritual Guidance')}
            </span>

            <svg className="w-8 h-4 text-[#4a6b49] rotate-180" viewBox="0 0 40 20" fill="currentColor">
              <path d="M0,10 C15,5 25,0 40,10 C25,20 15,15 0,10 Z" opacity="0.7"/>
              <circle cx="36" cy="10" r="2.5" />
            </svg>
          </div>

          <h2 className="font-playfair text-2xl sm:text-4xl font-black text-[#153e29] leading-tight">
            {tr('वैदिक ज्योतिष मार्गदर्शन सेवाएँ', 'Vedic Astrology Guidance Services')}
          </h2>

          <p className="text-xs sm:text-base text-[#6b5a45] font-medium leading-relaxed">
            {tr(
              'अनुभवी वैदिक आचार्यों द्वारा आपकी जन्म कुंडली, ग्रह-दशा एवं व्यक्तिगत प्रश्नों का गोपनीय, प्रामाणिक और सटीक समाधान।',
              'Confidential, authentic, and accurate solutions for your birth chart, planetary transits, and personal life questions by experienced Vedic Acharyas.'
            )}
          </p>
        </div>

        {/* 5 Distinct Jyotish Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className={`rounded-3xl p-5 sm:p-6 bg-[#fffefc] border border-[#ebdcb9] shadow-xs hover:shadow-md hover:border-[#cfb784] transition-all flex flex-col justify-between group ${
                idx === 0 ? 'lg:col-span-1' : ''
              }`}
            >
              <div>
                {/* Header with Icon & Badge */}
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-[#f7efdc] border border-[#e2ce9f] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                    {getCategoryIcon(cat.iconName)}
                  </div>

                  <span className="text-[11px] font-bold text-[#7a5518] bg-[#fdf5e2] px-2.5 py-0.5 rounded-full border border-[#ebdcb9]">
                    {cat.badge}
                  </span>
                </div>

                {/* Title & Subtitle */}
                <h3 className="font-playfair text-lg sm:text-xl font-bold text-[#1b4b32] group-hover:text-[#123824] transition-colors leading-snug">
                  {cat.title}
                </h3>
                <p className="text-[11px] font-semibold text-[#8a765e] mt-0.5">
                  {cat.subtitle}
                </p>

                {/* Description */}
                <p className="text-xs text-[#5e513e] mt-2.5 leading-relaxed">
                  {cat.description}
                </p>

                {/* Key Consultation Topics */}
                <div className="mt-4 pt-3.5 border-t border-[#f2e7cd] space-y-1.5">
                  <div className="text-[11px] font-bold text-[#8a6828] uppercase tracking-wide">
                    {tr('मुख्य परामर्श बिंदु:', 'Key Consultation Topics:')}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.topics.map((topic, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[11px] bg-[#faf4e6] text-[#4a3f31] font-medium px-2 py-0.5 rounded-lg border border-[#ebdcb9]"
                      >
                        • {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-5 pt-3 border-t border-[#f2e7cd]/60">
                <button
                  onClick={() => onSelectCategory(cat)}
                  className="w-full py-2.5 px-4 rounded-full bg-[#1b4b32] hover:bg-[#153e29] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer group-hover:bg-[#153e29]"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
                  <span>{tr('परामर्श प्राप्त करें', 'Get Consultation')}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-300 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}

          {/* 6th Card: Direct Quick Consultation Trust Card */}
          <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#1b4b32] to-[#123824] text-white flex flex-col justify-between shadow-md border border-[#23583c] relative overflow-hidden">
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-200 text-[11px] font-bold border border-amber-300/30">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>{tr('100% गोपनीय एवं प्रामाणिक', '100% Confidential & Authentic')}</span>
              </div>

              <h3 className="font-playfair text-xl sm:text-2xl font-bold text-amber-100 leading-tight">
                {tr('सीधे वैदिक ज्योतिषाचार्य से बात करें', 'Speak Directly with a Vedic Astrologer')}
              </h3>

              <p className="text-xs text-emerald-100/90 leading-relaxed">
                {tr(
                  'अपने जीवन के महत्वपूर्ण निर्णयों, जन्म कुंडली व ग्रह गोचर के व्यक्तिगत प्रश्नों पर लाइव चैट अथवा फोन कॉल द्वारा तुरंत मार्गदर्शन प्राप्त करें।',
                  'Receive instant live chat or audio guidance on important life decisions, birth chart readings, and planetary transits.'
                )}
              </p>

              <div className="pt-2 text-xs space-y-1.5 text-emerald-200 font-medium">
                <p>✓ {tr('सटीक जन्म समय व कुंडली मिलान', 'Accurate Birth Time & Kundali Matching')}</p>
                <p>✓ {tr('सरल, सात्विक एवं वैदिक ग्रह उपाय', 'Simple, Sattvic Vedic Remedies')}</p>
                <p>✓ {tr('प्रथम गौ सेवा के साथ 50% विशेष छूट', '50% Special Discount After Gau Seva')}</p>
              </div>
            </div>

            <div className="relative z-10 pt-5 mt-4 border-t border-emerald-700/50">
              <button
                onClick={onGeneralConsult}
                className="w-full py-2.5 px-4 rounded-full bg-[#e5a024] hover:bg-[#d4901a] active:scale-98 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>{tr('अभी ज्योतिषी से जुड़ें', 'Connect with Astrologer Now')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
