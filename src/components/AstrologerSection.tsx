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
  onConnectAstrologer: _onConnectAstrologer,
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
    <section id="astrologers-section" className="py-8 sm:py-10 bg-[#fbf6ee] relative">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6">

        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-7 space-y-1">
          <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-[#2e1a0c] leading-tight">
            {tr('अनुभवी ज्योतिषियों से मार्गदर्शन', 'Anubhavi Jyotishiyon se Margdarshan')}
          </h2>
          <div className="pt-1 flex items-center justify-center gap-1.5">
            <span className="h-[1.5px] w-14 sm:w-20 bg-gradient-to-r from-transparent to-[#c57b39]" />
            <span className="w-1.5 h-1.5 rotate-45 bg-[#b54c0d]" />
            <span className="w-2 h-2 rotate-45 border border-[#c57b39] bg-[#f5c458]" />
            <span className="w-1.5 h-1.5 rotate-45 bg-[#b54c0d]" />
            <span className="h-[1.5px] w-14 sm:w-20 bg-gradient-to-l from-transparent to-[#c57b39]" />
          </div>
          <p className="text-xs sm:text-sm text-[#6f5744] font-medium pt-1">
            {tr(
              'अंक ज्योतिष, वैदिक ज्योतिष, टैरो एवं हस्तरेखा के अनुभवी विशेषज्ञों से सीधे लाइव परामर्श लें।',
              'Numerology, Vedic Jyotish, Tarot aur Palmistry ke visheshagyon se seedhe live paramarsh lein.'
            )}
          </p>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

          {/* 2 Compact Equal-Size Astrologer Cards (Nipunjj & Dravina) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 auto-rows-fr gap-3.5 sm:gap-4 items-stretch">
            {astrologers.map((astro) => {
              const showCustomImg = Boolean(astro.customImageUrl && !brokenImages[astro.id]);
              const isOnline = astro.isOnline !== false;
              return (
                <div
                  key={astro.id}
                  className="w-full max-w-[320px] sm:max-w-none mx-auto bg-white rounded-2xl overflow-hidden border border-[#ede0ca] shadow-[0_6px_18px_rgba(92,54,18,0.06)] hover:shadow-md hover:border-[#d3ae7a] transition-all flex flex-col h-full"
                >
                  {/* Edge-to-Edge Full-Width Portrait Sized & Framed for Full Face */}
                  <div className="w-full h-60 sm:h-64 overflow-hidden bg-white shrink-0">
                    {showCustomImg ? (
                      <img
                        src={astro.customImageUrl}
                        alt={astro.name}
                        referrerPolicy="no-referrer"
                        onError={() => setBrokenImages((prev) => ({ ...prev, [astro.id]: true }))}
                        className="w-full h-full object-cover object-[50%_18%] block"
                      />
                    ) : (
                      <ImageCrop
                        cropKey={astro.cropKey}
                        className="w-full h-full"
                        preserveAspectRatio="xMidYMin slice"
                        alt={astro.name}
                      />
                    )}
                  </div>

                  {/* Compact Assembled Astrologer Info + Aligned CTA */}
                  <div className="p-3 pt-2.5 flex-1 flex flex-col justify-between gap-2">
                    <div className="space-y-1.5">
                      {/* Name + Verified + Live Status Strip */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="font-playfair text-base font-bold text-[#2e1a0c] leading-tight truncate">
                            {astro.name}
                          </h3>
                          <ShieldCheck className="w-3.5 h-3.5 text-[#b54c0d] shrink-0" />
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold shrink-0 ${
                          isOnline ? 'text-emerald-700' : 'text-stone-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                          <span>{isOnline ? tr('लाइव उपलब्ध', 'LIVE') : tr('ऑफ़लाइन', 'Offline')}</span>
                        </span>
                      </div>

                      {/* 1-Line Specializations */}
                      <p className="text-[11px] font-semibold text-[#6b4f3a] flex items-center gap-1 truncate">
                        <Sparkles className="w-3 h-3 text-[#d88924] shrink-0" />
                        <span className="truncate">{astro.specializations.join(' · ')}</span>
                      </p>

                      {/* Clean Hairline Credentials Divider Row */}
                      <div className="grid grid-cols-2 divide-x divide-[#ede0ca] py-1 border-y border-[#f3e8d6] text-left">
                        <div className="pr-2">
                          <div className="text-[9px] font-bold text-[#8a6d50] uppercase">{tr('अनुभव', 'Anubhav')}</div>
                          <div className="text-[11px] font-extrabold text-[#2e1a0c] truncate">{astro.experience}</div>
                        </div>
                        <div className="pl-2.5">
                          <div className="text-[9px] font-bold text-[#8a6d50] uppercase">{tr('पूर्ण रीडिंग', 'Poorn Readings')}</div>
                          <div className="text-[11px] font-extrabold text-[#2e1a0c] truncate">{astro.reviewsCount}</div>
                        </div>
                      </div>

                      {/* Compact Languages + Rating + Price Row */}
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#5a422e]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="inline-flex items-center gap-1 text-[#6b4f3a] truncate">
                            <Languages className="w-3 h-3 text-[#b54c0d] shrink-0" />
                            <span>{astro.languages.join(' & ')}</span>
                          </span>
                          <span aria-hidden="true" className="text-[#cfb99a]">·</span>
                          <span className="inline-flex items-center gap-0.5 font-bold text-[#2e1a0c] shrink-0">
                            <Star className="w-3 h-3 fill-[#e5a024] text-[#e5a024]" />
                            <span>{astro.rating}</span>
                          </span>
                        </div>
                        <span className="text-xs sm:text-[13px] font-black text-[#b54c0d] shrink-0">
                          ₹{astro.ratePerMin}/{tr('मिनट', 'min')}
                        </span>
                      </div>
                    </div>

                    {/* Compact CTA Action */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                      }}
                      className="w-full py-2 px-3.5 rounded-full bg-gradient-to-r from-[#a64108] to-[#c25914] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-default"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#ffd978]" />
                      <span>Coming Soon</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Warm Terracotta Trust Card (Span 4 on desktop) */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="h-full bg-gradient-to-b from-[#8f3505] to-[#6d2604] rounded-2xl p-4 sm:p-5 text-white flex flex-col justify-between shadow-sm border border-[#a84611]">
              <div className="space-y-2.5">
                <div className="text-[11px] font-bold text-[#f9c959] tracking-wide uppercase">
                  {tr('गौकृपा वैदिक परामर्श', 'GauKripa Vedic Paramarsh')}
                </div>

                <h3 className="font-playfair text-lg font-bold text-amber-100 leading-snug">
                  {tr('गौकृपा ज्योतिष क्यों चुनें?', 'GauKripa Jyotish Kyon Chunein?')}
                </h3>

                <ul className="space-y-2 text-xs font-medium text-amber-50/95">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#f9c959] shrink-0 mt-0.5" />
                    <span>{tr('प्रमाणित एवं अनुभवी वैदिक, टैरो व अंक ज्योतिषी', 'Pramanit aur anubhavi Vedic, Tarot, Numerology & Palmistry Visheshagya')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#f9c959] shrink-0 mt-0.5" />
                    <span>{tr('100% पूर्णतः गोपनीय एवं सुरक्षित परामर्श', '100% Poornata Gopniya aur Surakshit Paramarsh')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#f9c959] shrink-0 mt-0.5" />
                    <span>{tr('पारदर्शी दर (₹20/मिनट, कोई अतिरिक्त शुल्क नहीं)', 'Pardarshi Dar (₹20/min, Koi Extra Charge Nahi)')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#f9c959] shrink-0 mt-0.5" />
                    <span>{tr('गौ सेवा कराने वाले भक्तों को 50% विशेष छूट', 'Gau Seva Book Karne par 50% Vishesh Chhoot')}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <button
                  onClick={onGeneralConnect}
                  className="w-full py-2.5 px-4 rounded-full bg-gradient-to-b from-[#fad062] to-[#df991d] hover:brightness-105 active:scale-98 text-[#361b05] font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
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
