import React from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { getLocalizedRemedyCategories, getLocalizedSevaItems, SevaItem } from '../data/sevaData';
import { useLanguage } from '../i18n/LanguageContext';

interface GrahRemedyModalProps {
  remedyId: string;
  isOpen: boolean;
  onClose: () => void;
  onBookRecommendedSeva: (seva: SevaItem) => void;
  onConsultAstrologer: () => void;
}

export const GrahRemedyModal: React.FC<GrahRemedyModalProps> = ({
  remedyId,
  isOpen,
  onClose,
  onBookRecommendedSeva,
  onConsultAstrologer,
}) => {
  const { lang, tr } = useLanguage();
  if (!isOpen) return null;

  const remedies = getLocalizedRemedyCategories(lang);
  const sevaItems = getLocalizedSevaItems(lang);
  const remedy = remedies.find((r) => r.id === remedyId) || remedies[0];
  const recommendedSeva = sevaItems.find((s) => s.id === remedy.recommendedSevaId) || sevaItems[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#fffdfa] rounded-3xl shadow-2xl border-2 border-[#ebdcb9] overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-[#1b4b32] text-white p-5 flex items-center justify-between border-b border-[#296344]">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🕉️</span>
            <div>
              <h3 className="font-playfair text-lg sm:text-xl font-bold text-amber-200">
                {remedy.title} • {tr('वैदिक ग्रह उपाय', 'Vedic Grah Upay')}
              </h3>
              <p className="text-xs text-emerald-100/80">
                {tr('प्रमुख ग्रह प्रभाव:', 'Governing Influence:')} {remedy.rulingPlanets}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Dosha & Planetary Root Cause */}
          <div className="p-3.5 rounded-2xl bg-[#faf2e1] border border-[#e4d3a9] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#96631b] uppercase tracking-wider">
                {tr('ज्योतिषीय कारण एवं विश्लेषण', 'Astrological Root Cause')}
              </span>
              <span className="text-xs font-bold text-[#1b4b32] bg-[#eddcb4] px-2 py-0.5 rounded-md">
                {remedy.dosha}
              </span>
            </div>
            <p className="text-xs text-[#524534] leading-relaxed">
              {remedy.description}{' '}
              {tr(
                'पाराशर ज्योतिष परंपरा के अनुसार, जब कुंडली में ग्रह प्रतिकूल हों तो गौमाता एवं जीवों के लिए नियमित आहार व्यवस्था अत्यंत सात्विक और फलदायी मानी जाती है।',
                'According to Parashara Jyotish, arranging regular pure feed for Gaumata and living beings is a deeply peaceful and authentic Vedic practice.'
              )}
            </p>
          </div>

          {/* Recommended Seva Spotlight */}
          <div className="p-4 rounded-2xl bg-white border-2 border-[#1b4b32]/30 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🌿</span>
                <div>
                  <span className="text-[10px] font-bold text-[#c4821a] uppercase tracking-wider">
                    {tr('अनुशंसित आहार सेवा', 'Recommended Feed Service')}
                  </span>
                  <h4 className="font-playfair text-base font-bold text-[#1b4b32]">
                    {recommendedSeva.title}
                  </h4>
                </div>
              </div>
              <span className="text-sm font-extrabold text-[#1b4b32]">
                {recommendedSeva.priceDisplay}
              </span>
            </div>

            <p className="text-xs text-[#5b4f3f] leading-snug">
              {recommendedSeva.detailedDescription}
            </p>

            <button
              onClick={() => {
                onClose();
                onBookRecommendedSeva(recommendedSeva);
              }}
              className="w-full py-2.5 px-4 rounded-full bg-[#1b4b32] hover:bg-[#153e29] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <span>{tr(`${recommendedSeva.title} बुक करें`, `Book ${recommendedSeva.title} Now`)}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Sacred Mantra & Daily Routine */}
          <div className="p-3.5 rounded-2xl bg-[#f4faee] border border-[#cfe2c4] space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#2d6139]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{tr('दैनिक वैदिक मंत्र जप', 'Daily Sacred Mantra Chanting')}</span>
            </div>
            <div className="font-serif text-sm font-bold text-[#1b4b32] bg-white/80 p-2 rounded-xl text-center border border-[#d6e7ce]">
              {remedy.mantra}
            </div>
            <p className="text-[11px] text-[#556959] text-center">
              {tr('प्रातःकाल पूर्व दिशा की ओर मुख करके 108 बार शांतिपूर्वक जप करें।', 'Recite 108 times peacefully at sunrise facing East.')}
            </p>
          </div>

          {/* Astrologer Consultation Option */}
          <div className="pt-2 border-t border-[#ebdcb9] flex items-center justify-between text-xs">
            <span className="text-[#6d5e49]">
              {tr('विस्तृत जन्म कुंडली विश्लेषण चाहते हैं?', 'Need full Kundali birth chart analysis?')}
            </span>
            <button
              onClick={() => {
                onClose();
                onConsultAstrologer();
              }}
              className="font-bold text-[#c4821a] hover:text-[#9e6612] underline cursor-pointer"
            >
              {tr('ज्योतिषी से बात करें (50% छूट)', 'Talk to Astrologer (50% OFF)')}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
