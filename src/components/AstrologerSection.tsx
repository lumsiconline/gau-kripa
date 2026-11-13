import React from 'react';
import { Star, ArrowRight, ShieldCheck, CheckCircle2, MessageSquare } from 'lucide-react';
import { getLocalizedAstrologers, Astrologer } from '../data/sevaData';
import { ImageCrop } from './ImageCrop';
import { useLanguage } from '../i18n/LanguageContext';

interface AstrologerSectionProps {
  onConnectAstrologer: (astrologer: Astrologer, mode: 'chat' | 'call') => void;
  onGeneralConnect: () => void;
}

export const AstrologerSection: React.FC<AstrologerSectionProps> = ({
  onConnectAstrologer,
  onGeneralConnect,
}) => {
  const { lang, tr } = useLanguage();
  const astrologers = getLocalizedAstrologers(lang);

  return (
    <section id="astrologers-section" className="py-12 sm:py-16 bg-[#faf5e8] border-b border-[#ebdcb9] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center justify-center gap-3">
            <svg className="w-8 h-4 text-[#4a6b49]" viewBox="0 0 40 20" fill="currentColor">
              <path d="M0,10 C15,5 25,0 40,10 C25,20 15,15 0,10 Z" opacity="0.7"/>
              <circle cx="36" cy="10" r="2.5" />
            </svg>

            <span className="text-xs font-bold uppercase tracking-widest text-[#8a6828] bg-[#fbf2dd] px-3.5 py-1 rounded-full border border-[#ebdcb9]">
              {tr('प्रमाणित वैदिक ज्योतिषाचार्य', 'Certified Vedic Astrologers')}
            </span>

            <svg className="w-8 h-4 text-[#4a6b49] rotate-180" viewBox="0 0 40 20" fill="currentColor">
              <path d="M0,10 C15,5 25,0 40,10 C25,20 15,15 0,10 Z" opacity="0.7"/>
              <circle cx="36" cy="10" r="2.5" />
            </svg>
          </div>

          <h2 className="font-playfair text-2xl sm:text-4xl font-black text-[#153e29] leading-tight">
            {tr('अनुभवी ज्योतिषियों से व्यक्तिगत मार्गदर्शन', 'Personal Guidance from Experienced Astrologers')}
          </h2>

          <p className="text-xs sm:text-base text-[#6b5a45] font-medium leading-relaxed">
            {tr(
              'प्रेम, विवाह, करियर, व्यापार एवं जन्म कुंडली के जटिल प्रश्नों पर वैदिक आचार्यों से सीधे लाइव चैट या कॉल पर बात करें।',
              'Connect via live chat or call with Vedic Acharyas for personal insights on love, marriage, career, business, and Kundali analysis.'
            )}
          </p>
        </div>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* 3 Astrologer Cards */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {astrologers.map((astro) => (
              <div
                key={astro.id}
                className="bg-[#fffdf9] rounded-3xl overflow-hidden border border-[#ebdcb9] shadow-sm hover:shadow-lg hover:border-[#d9ba78] transition-all flex flex-col justify-between"
              >
                {/* Photo Header */}
                <div>
                  <div className="relative h-56 sm:h-44 w-full bg-[#f8efe0] overflow-hidden">
                    <ImageCrop
                      cropKey={astro.cropKey}
                      className="w-full h-full object-cover"
                      alt={astro.name}
                    />
                    
                    {/* Online Live Indicator */}
                    <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1.5 bg-emerald-950/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-400/60 shadow-md">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] font-black tracking-wider text-emerald-300 uppercase">
                        {tr('उपलब्ध (LIVE)', 'ONLINE (LIVE)')}
                      </span>
                    </div>

                    {/* Verified Badge */}
                    <div className="absolute top-2.5 right-2.5 bg-white/95 backdrop-blur-xs rounded-full p-1.5 shadow-sm">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>

                  {/* Astrologer Info */}
                  <div className="p-4 text-center space-y-1.5">
                    <h3 className="font-playfair text-base font-bold text-[#1b4b32] leading-tight">
                      {astro.name}
                    </h3>
                    
                    <p className="text-[11px] font-semibold text-[#483d2e] leading-snug">
                      {astro.title}
                    </p>

                    <p className="text-[11px] text-[#7d705c]">
                      {astro.experience}
                    </p>

                    {/* Star Rating */}
                    <div className="flex items-center justify-center gap-1 text-xs font-bold text-[#2e2619] pt-0.5">
                      <Star className="w-3.5 h-3.5 fill-[#e5a024] text-[#e5a024]" />
                      <span>{astro.rating}</span>
                      <span className="text-[11px] font-normal text-[#80725d]">({astro.reviewsCount})</span>
                    </div>

                    {/* Pricing */}
                    <div className="text-sm font-extrabold text-[#c4821a] pt-1">
                      ₹{astro.ratePerMin} / {tr('मिनट', 'min')}
                    </div>
                  </div>
                </div>

                {/* CTA Action */}
                <div className="p-4 pt-0 space-y-1.5">
                  <button
                    onClick={() => onConnectAstrologer(astro, 'chat')}
                    className="w-full py-2.5 px-3 rounded-full bg-[#1b4b32] hover:bg-[#153e29] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
                    <span>{tr('परामर्श शुरू करें', 'Start Consultation')}</span>
                  </button>
                </div>

              </div>
            ))}
          </div>

          {/* Green Trust Card (Span 4 on desktop) */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="h-full bg-[#153e29] rounded-3xl p-5 sm:p-6 text-white flex flex-col justify-between shadow-md border border-[#23583c]">
              <div className="space-y-3 sm:space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-200 text-[11px] font-bold border border-amber-300/30">
                  <span>{tr('गौकृपा वैदिक परामर्श', 'GauKripa Vedic Consultation')}</span>
                </div>

                <h3 className="font-playfair text-xl sm:text-2xl font-bold text-amber-200">
                  {tr('गौकृपा ज्योतिष क्यों चुनें?', 'Why Choose GauKripa Astrology?')}
                </h3>

                <ul className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm font-medium text-emerald-50">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{tr('प्रमाणित एवं अनुभवी वैदिक ज्योतिषी', 'Certified & Experienced Vedic Astrologers')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{tr('100% पूर्णतः गोपनीय एवं सुरक्षित परामर्श', '100% Private & Confidential Consultation')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{tr('पारदर्शी दर (₹20/मिनट, कोई अतिरिक्त शुल्क नहीं)', 'Transparent Rate (₹20/min, No Hidden Charges)')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{tr('गौ सेवा कराने वाले भक्तों को 50% विशेष छूट', '50% Special Discount After Feed Seva Booking')}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6">
                <button
                  onClick={onGeneralConnect}
                  className="w-full py-3 px-4 rounded-full bg-[#e5a024] hover:bg-[#d4901a] active:scale-98 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <span>{tr('तुरंत ज्योतिषी से जुड़ें', 'Connect with Astrologer Now')}</span>
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
