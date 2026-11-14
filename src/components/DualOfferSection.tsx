import React, { useState } from 'react';
import { ArrowRight, Briefcase, Heart, Leaf, Coins, Shield, Home as HomeIcon, Check, Sparkles } from 'lucide-react';
import { ImageCrop } from './ImageCrop';
import { getLocalizedRemedyCategories } from '../data/sevaData';
import { useLanguage } from '../i18n/LanguageContext';

interface DualOfferSectionProps {
  onOpenRemedyModal: (remedyId: string) => void;
  onBookSevaWithDiscount: () => void;
}

export const DualOfferSection: React.FC<DualOfferSectionProps> = ({
  onOpenRemedyModal,
  onBookSevaWithDiscount,
}) => {
  const { lang, tr } = useLanguage();
  const remedyCategories = getLocalizedRemedyCategories(lang);
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
    <section className="py-8 sm:py-12 bg-[#f7eed8]/50 border-b border-[#ebdcb9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Unified Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
          
          {/* Left Card: Find Your Grah Remedy */}
          <div className="lg:col-span-7 bg-[#fefcf8] rounded-3xl p-4 sm:p-6 border border-[#e4d4ad] shadow-xs flex flex-col justify-between gap-4">
            
            {/* Top row: Kundali Wheel + Title */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28 shrink-0 rounded-full overflow-hidden border-2 border-[#d9ba78] shadow-xs bg-[#2d1b06]">
                <ImageCrop
                  cropKey="kundaliWheel"
                  className="w-full h-full object-cover scale-105"
                  alt={tr('वैदिक कुंडली चक्र', 'Vedic Kundali Chakra')}
                />
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-playfair text-lg sm:text-2xl font-bold text-[#1b4b32] leading-tight">
                    {tr('ग्रह शांति एवं सात्विक वैदिक उपाय', 'Grah Shanti aur Sattvic Vedic Upay')}
                  </h3>
                  <span className="text-amber-500 text-xs hidden sm:inline">✨</span>
                </div>
                <p className="text-xs sm:text-sm text-[#6f604c] font-medium mt-1 leading-snug">
                  {tr(
                    'अपनी समस्या चुनें और उचित गौ-आहार सेवा व वैदिक मंत्र उपाय जानें',
                    'Apni samasya chunein aur sahi Gau-Aahar seva aur Vedic Mantra upay jaanein'
                  )}
                </p>
              </div>
            </div>

            {/* 6 Selectable Problem Pills */}
            <div className="grid grid-cols-2 gap-2">
              {remedyCategories.map((rem) => {
                const isSelected = selectedRemedy === rem.id;
                return (
                  <button
                    key={rem.id}
                    type="button"
                    onClick={() => setSelectedRemedy(rem.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-1.5 transition-all text-left border cursor-pointer ${
                      isSelected
                        ? 'bg-[#1b4b32] text-white border-[#1b4b32] shadow-xs'
                        : 'bg-[#f8f2e2] text-[#332b21] border-[#ebdcb9] hover:bg-[#efe3c5]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {getIcon(rem.id)}
                      <span className="leading-tight">{rem.title}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-amber-300 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>

            {/* CTA Row */}
            <div className="pt-1 flex items-center justify-between gap-2">
              <button
                onClick={() => onOpenRemedyModal(selectedRemedy)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#1b4b32] hover:bg-[#153e29] active:scale-98 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer"
              >
                <span>{tr('सटीक उपाय व आहार सेवा देखें', 'Sateek Upay aur Aahar Seva Dekhein')}</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </button>
            </div>
          </div>

          {/* Right Card: Dual Benefit Offer */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#1b4b32] to-[#123824] text-white rounded-3xl p-5 sm:p-6 shadow-sm border border-[#276342] flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold border border-amber-300/30">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{tr('विशेष संयुक्त लाभ', 'Vishesh Sanyukt Labh')}</span>
              </div>

              <h3 className="font-playfair text-xl sm:text-2xl font-bold text-amber-100 leading-tight">
                {tr('गौ सेवा के साथ 50% ज्योतिष परामर्श छूट', 'Gau Seva ke sath 50% Jyotish Paramarsh Chhoot')}
              </h3>

              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                {tr(
                  'जब आप गौमाता के लिए किसी भी आहार सेवा (चारा, गुड़-चना या रोटी) की व्यवस्था करते हैं, तो आपको अनुभवी वैदिक ज्योतिषाचार्य से परामर्श पर स्वतः 50% की विशेष छूट प्राप्त होती है।',
                  'Jab aap Gaumata ke liye kisi bhi aahar seva (Chara, Gud-Chana ya Roti) ki vyavastha karte hain, to aapko anubhavi Vedic Jyotishacharya se paramarsh par apne-aap 50% ki vishesh chhoot milti hai.'
                )}
              </p>

              <div className="p-3 rounded-2xl bg-black/25 border border-emerald-500/30 text-xs space-y-1">
                <div className="flex justify-between items-center text-emerald-200">
                  <span>{tr('सामान्य परामर्श दर:', 'Samanya Paramarsh Dar:')}</span>
                  <span className="line-through text-stone-300">₹20 / {tr('मिनट', 'min')}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-amber-300 text-sm">
                  <span>{tr('आहार सेवा के उपरांत:', 'Aahar Seva Book Karne ke Baad:')}</span>
                  <span>{tr('केवल ₹10 / मिनट', 'Sirf ₹10 / min')}</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onBookSevaWithDiscount}
                className="w-full py-3 px-4 rounded-full bg-[#e5a024] hover:bg-[#d4901a] active:scale-98 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>{tr('आहार सेवा व्यवस्था कर छूट पाएं', 'Apni Seva Book Karein aur 50% Chhoot Paayein')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
