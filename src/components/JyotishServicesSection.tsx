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
              {tr('वैदिक ज्योतिष एवं आध्यात्मिक परामर्श', 'Vedic Jyotish aur Adhyatmik Paramarsh')}
            </span>

            <svg className="w-8 h-4 text-[#4a6b49] rotate-180" viewBox="0 0 40 20" fill="currentColor">
              <path d="M0,10 C15,5 25,0 40,10 C25,20 15,15 0,10 Z" opacity="0.7"/>
              <circle cx="36" cy="10" r="2.5" />
            </svg>
          </div>

          <h2 className="font-playfair text-2xl sm:text-4xl font-black text-[#153e29] leading-tight">
            {tr('वैदिक ज्योतिष मार्गदर्शन सेवाएँ', 'Vedic Jyotish Margdarshan Sevaein')}
          </h2>

          <p className="text-xs sm:text-base text-[#6b5a45] font-medium leading-relaxed">
            {tr(
              'अनुभवी वैदिक आचार्यों द्वारा आपकी जन्म कुंडली, ग्रह-दशा एवं व्यक्तिगत प्रश्नों का गोपनीय, प्रामाणिक और सटीक समाधान।',
              'Anubhavi Vedic Acharyon dwara aapki Janam Kundali, Grah-Dasha aur niji prashnon ka gopniya, pramanik aur sateek samadhan.'
            )}
          </p>
        </div>

        {/* 5 Distinct Jyotish Service Cards + Direct Consult Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-2xl p-4 bg-[#fffefc] border border-[#ebdcb9] shadow-xs hover:shadow-md hover:border-[#cfb784] transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Compact Header: Icon + Title + Unboxed Kicker */}
                <div className="flex items-start justify-between gap-2.5 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-[#f7efdc] border border-[#e2ce9f] flex items-center justify-center shrink-0">
                      {getCategoryIcon(cat.iconName)}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-[10px] font-bold text-[#8a6828] uppercase tracking-wide leading-tight">
                        {cat.badge}
                      </span>
                      <h3 className="font-playfair text-base font-bold text-[#1b4b32] group-hover:text-[#123824] transition-colors leading-snug">
                        {cat.title}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Concise Description */}
                <p className="text-[11px] text-[#5e513e] leading-relaxed line-clamp-2">
                  {cat.description}
                </p>

                {/* Clean 2-Column Topics List (No Nested Pill Boxes) */}
                <div className="mt-2.5 pt-2.5 border-t border-[#f2e7cd]">
                  <div className="text-[10px] font-bold text-[#8a6828] uppercase tracking-wide mb-1.5">
                    {tr('मुख्य परामर्श बिंदु:', 'Mukhya Paramarsh Bindu:')}
                  </div>
                  <ul className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-[#4a3f31] font-medium">
                    {cat.topics.map((topic, tIdx) => (
                      <li key={tIdx} className="truncate">
                        • {topic}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Compact Action Button */}
              <div className="mt-3.5 pt-2.5 border-t border-[#f2e7cd]/70">
                <button
                  onClick={() => onSelectCategory(cat)}
                  className="w-full py-2 px-4 rounded-full bg-[#1b4b32] hover:bg-[#153e29] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
                  <span>{tr('परामर्श प्राप्त करें', 'Paramarsh Lein')}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-300 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          ))}

          {/* 6th Card: Direct Quick Consultation Trust Card */}
          <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-[#1b4b32] to-[#123824] text-white flex flex-col justify-between shadow-sm border border-[#23583c] relative overflow-hidden">
            <div className="relative z-10 space-y-2.5">
              <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-bold uppercase tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>{tr('100% गोपनीय एवं प्रामाणिक', '100% Gopniya aur Pramanik')}</span>
              </div>

              <h3 className="font-playfair text-lg sm:text-xl font-bold text-amber-100 leading-snug">
                {tr('सीधे वैदिक ज्योतिषाचार्य से बात करें', 'Seedhe Vedic Jyotishacharya se Baat Karein')}
              </h3>

              <p className="text-[11px] text-emerald-100/90 leading-relaxed">
                {tr(
                  'अपने जीवन के महत्वपूर्ण निर्णयों, जन्म कुंडली व ग्रह गोचर के व्यक्तिगत प्रश्नों पर लाइव चैट अथवा फोन कॉल द्वारा तुरंत मार्गदर्शन प्राप्त करें।',
                  'Apne jeevan ke mahatvapurna faislon, Janam Kundali aur Grah Gochar ke niji prashnon par Live Chat se turant margdarshan paayein.'
                )}
              </p>

              <div className="pt-1.5 text-[11px] space-y-1 text-emerald-200 font-medium">
                <p>✓ {tr('सटीक जन्म समय व कुंडली मिलान', 'Sateek Janam Samay aur Kundali Milan')}</p>
                <p>✓ {tr('सरल, सात्विक एवं वैदिक ग्रह उपाय', 'Saral, Sattvic aur Vedic Grah Upay')}</p>
                <p>✓ {tr('प्रथम गौ सेवा के साथ 50% विशेष छूट', 'Pehli Gau Seva ke sath 50% Vishesh Chhoot')}</p>
              </div>
            </div>

            <div className="relative z-10 pt-3.5 mt-3 border-t border-emerald-700/50">
              <button
                onClick={onGeneralConsult}
                className="w-full py-2 px-4 rounded-full bg-[#e5a024] hover:bg-[#d4901a] active:scale-98 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <span>{tr('अभी ज्योतिषी से जुड़ें', 'Abhi Jyotishi se Judein')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
