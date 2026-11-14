import React, { useEffect, useState } from 'react';
import { Star, ArrowRight, ShieldCheck, CheckCircle2, MessageSquare, Languages, Sparkles } from 'lucide-react';
import { getLocalizedAstrologers, Astrologer } from '../data/sevaData';
import { ImageCrop } from './ImageCrop';
import { useLanguage } from '../i18n/LanguageContext';
import { api, AstrologerItem } from '../services/api';

interface AstrologerSectionProps {
  onConnectAstrologer: (astrologer: Astrologer, mode: 'chat' | 'call') => void;
  onGeneralConnect: () => void;
}

const LEGACY_ASTRO_IDS = new Set(['dr-sophia', 'acharya-rohan', 'maria-kapoor']);

export const AstrologerSection: React.FC<AstrologerSectionProps> = ({
  onConnectAstrologer,
  onGeneralConnect,
}) => {
  const { lang, tr } = useLanguage();
  const [liveAstrologers, setLiveAstrologers] = useState<AstrologerItem[]>([]);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    const syncAstros = async () => {
      try {
        const fetched = await api.getAstrologers();
        if (active && Array.isArray(fetched)) {
          setLiveAstrologers(fetched);
          setBrokenImages({});
        }
      } catch {}
    };

    syncAstros();
    const handleUpdate = () => syncAstros();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'gaukripa_astrologers') syncAstros();
    };
    window.addEventListener('gaukripa_astrologers_updated', handleUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      active = false;
      window.removeEventListener('gaukripa_astrologers_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const localizedDefaults = getLocalizedAstrologers(lang);
  const liveById = new Map<string, AstrologerItem>(
    liveAstrologers.filter((a) => !LEGACY_ASTRO_IDS.has(a.id)).map((a) => [a.id, a])
  );

  const astrologers: (Astrologer & { isOnline?: boolean })[] = localizedDefaults.map((item) => {
    const live = liveById.get(item.id);
    if (!live) return { ...item, isOnline: true };
    return {
      ...item,
      customImageUrl: live.customImageUrl || item.customImageUrl,
      ratePerMin: Number(live.ratePerMin || item.ratePerMin),
      rating: Number(live.rating || item.rating),
      isOnline: live.isOnline,
    };
  });

  return (
    <section id="astrologers-section" className="py-12 sm:py-16 bg-[#faf5e8] border-b border-[#ebdcb9] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-9 space-y-2">
          <div className="inline-flex items-center justify-center gap-3">
            <svg className="w-8 h-4 text-[#4a6b49]" viewBox="0 0 40 20" fill="currentColor">
              <path d="M0,10 C15,5 25,0 40,10 C25,20 15,15 0,10 Z" opacity="0.7" />
              <circle cx="36" cy="10" r="2.5" />
            </svg>

            <span className="text-xs font-bold uppercase tracking-widest text-[#8a6828] bg-[#fbf2dd] px-3.5 py-1 rounded-full border border-[#ebdcb9]">
              {tr('प्रमाणित वैदिक ज्योतिषाचार्य', 'Pramanit Vedic Jyotishacharya')}
            </span>

            <svg className="w-8 h-4 text-[#4a6b49] rotate-180" viewBox="0 0 40 20" fill="currentColor">
              <path d="M0,10 C15,5 25,0 40,10 C25,20 15,15 0,10 Z" opacity="0.7" />
              <circle cx="36" cy="10" r="2.5" />
            </svg>
          </div>

          <h2 className="font-playfair text-2xl sm:text-4xl font-black text-[#153e29] leading-tight">
            {tr('अनुभवी ज्योतिषियों से व्यक्तिगत मार्गदर्शन', 'Anubhavi Jyotishiyon se Vyaktigat Margdarshan')}
          </h2>

          <p className="text-xs sm:text-base text-[#6b5a45] font-medium leading-relaxed">
            {tr(
              'अंक ज्योतिष, वैदिक ज्योतिष, टैरो एवं हस्तरेखा के अनुभवी विशेषज्ञों से सीधे लाइव चैट या परामर्श लें।',
              'Numerology, Vedic Jyotish, Tarot aur Palmistry ke anubhavi visheshagyon se seedhe live chat ya paramarsh lein.'
            )}
          </p>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-stretch">

          {/* 2 Astrologer Cards (Nipunjj & Dravina) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {astrologers.map((astro) => {
              const showCustomImg = Boolean(astro.customImageUrl && !brokenImages[astro.id]);
              const isOnline = astro.isOnline !== false;
              return (
                <div
                  key={astro.id}
                  className="bg-[#fffdf9] rounded-2xl overflow-hidden border border-[#ebdcb9] shadow-xs hover:shadow-md hover:border-[#d9ba78] transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Full Uncropped Portrait Well */}
                    <div className="p-2 pb-0">
                      <div className="h-44 sm:h-48 w-full rounded-xl overflow-hidden bg-[#f6ebd3] flex items-center justify-center border border-[#ead9b5]/70">
                        {showCustomImg ? (
                          <img
                            src={astro.customImageUrl}
                            alt={astro.name}
                            referrerPolicy="no-referrer"
                            onError={() => setBrokenImages((prev) => ({ ...prev, [astro.id]: true }))}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <ImageCrop
                            cropKey={astro.cropKey}
                            className="w-full h-full"
                            preserveAspectRatio="xMidYMid meet"
                            alt={astro.name}
                          />
                        )}
                      </div>
                    </div>

                    {/* Compact Assembled Astrologer Info */}
                    <div className="p-3.5 pt-2.5 space-y-2">
                      {/* Name + Verified + Live Status Strip */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="font-playfair text-base sm:text-lg font-bold text-[#1b4b32] leading-tight truncate">
                            {astro.name}
                          </h3>
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold shrink-0 ${
                          isOnline ? 'text-emerald-700' : 'text-slate-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{isOnline ? tr('लाइव उपलब्ध', 'LIVE') : tr('ऑफ़लाइन', 'Offline')}</span>
                        </span>
                      </div>

                      {/* 1-Line Specializations */}
                      <p className="text-[11px] font-semibold text-[#5a4a35] flex items-center gap-1 truncate">
                        <Sparkles className="w-3 h-3 text-[#c4821a] shrink-0" />
                        <span className="truncate">{astro.specializations.join(' · ')}</span>
                      </p>

                      {/* Clean Hairline Credentials Divider Row */}
                      <div className="grid grid-cols-2 divide-x divide-[#ebdcb9] py-1.5 border-y border-[#f0e3c7] text-left">
                        <div className="pr-2">
                          <div className="text-[9px] font-bold text-[#8a7251] uppercase">{tr('अनुभव', 'Anubhav')}</div>
                          <div className="text-[11px] font-extrabold text-[#1b4b32] truncate">{astro.experience}</div>
                        </div>
                        <div className="pl-2.5">
                          <div className="text-[9px] font-bold text-[#8a7251] uppercase">{tr('पूर्ण रीडिंग', 'Poorn Readings')}</div>
                          <div className="text-[11px] font-extrabold text-[#1b4b32] truncate">{astro.reviewsCount}</div>
                        </div>
                      </div>

                      {/* Compact Languages + Rating + Price Row */}
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#483d2e] pt-0.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="inline-flex items-center gap-1 text-[#5a4c39] truncate">
                            <Languages className="w-3 h-3 text-[#1b4b32] shrink-0" />
                            <span>{astro.languages.join(' & ')}</span>
                          </span>
                          <span aria-hidden="true" className="text-[#c9b796]">·</span>
                          <span className="inline-flex items-center gap-0.5 font-bold text-[#2e2619] shrink-0">
                            <Star className="w-3 h-3 fill-[#e5a024] text-[#e5a024]" />
                            <span>{astro.rating}</span>
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-black text-[#c4821a] shrink-0">
                          ₹{astro.ratePerMin}/{tr('मिनट', 'min')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Compact CTA Action */}
                  <div className="p-3.5 pt-0">
                    <button
                      onClick={() => onConnectAstrologer(astro, 'chat')}
                      className="w-full py-2 px-4 rounded-full bg-[#1b4b32] hover:bg-[#153e29] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
                      <span>{tr('परामर्श शुरू करें', 'Paramarsh Shuru Karein')}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Green Trust Card (Span 4 on desktop) */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="h-full bg-[#153e29] rounded-2xl p-4 sm:p-5 text-white flex flex-col justify-between shadow-sm border border-[#23583c]">
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-amber-300 tracking-wide uppercase">
                  {tr('गौकृपा वैदिक परामर्श', 'GauKripa Vedic Paramarsh')}
                </div>

                <h3 className="font-playfair text-lg sm:text-xl font-bold text-amber-200 leading-snug">
                  {tr('गौकृपा ज्योतिष क्यों चुनें?', 'GauKripa Jyotish Kyon Chunein?')}
                </h3>

                <ul className="space-y-2 text-xs font-medium text-emerald-50">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{tr('प्रमाणित एवं अनुभवी वैदिक, टैरो व अंक ज्योतिषी', 'Pramanit aur anubhavi Vedic, Tarot, Numerology & Palmistry Visheshagya')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{tr('100% पूर्णतः गोपनीय एवं सुरक्षित परामर्श', '100% Poornata Gopniya aur Surakshit Paramarsh')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{tr('पारदर्शी दर (₹20/मिनट, कोई अतिरिक्त शुल्क नहीं)', 'Pardarshi Dar (₹20/min, Koi Extra Charge Nahi)')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{tr('गौ सेवा कराने वाले भक्तों को 50% विशेष छूट', 'Gau Seva Book Karne par 50% Vishesh Chhoot')}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <button
                  onClick={onGeneralConnect}
                  className="w-full py-2.5 px-4 rounded-full bg-[#e5a024] hover:bg-[#d4901a] active:scale-98 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span>{tr('तुरंत ज्योतिषी से जुड़ें', 'Turant Jyotishi se Judein')}</span>
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
