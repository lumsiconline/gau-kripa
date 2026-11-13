import React, { useEffect, useState } from 'react';
import { ArrowRight, Video, CheckCircle2 } from 'lucide-react';
import { getLocalizedSevaItems, SevaItem } from '../data/sevaData';
import { ImageCrop } from './ImageCrop';
import { useLanguage } from '../i18n/LanguageContext';
import { api, ServiceItem } from '../services/api';

interface SevaServicesSectionProps {
  onBookSeva: (item: SevaItem) => void;
}

const DEFAULT_BASE_PRICES: Record<string, number> = {
  'gau-chara': 251,
  'gau-gud-chana': 151,
  'gau-roti': 51,
  'pakshi-dana': 101,
  'cheenti-aata': 149,
  'street-dogs': 199,
};

export const SevaServicesSection: React.FC<SevaServicesSectionProps> = ({ onBookSeva }) => {
  const { lang, tr } = useLanguage();
  const [liveServices, setLiveServices] = useState<ServiceItem[]>([]);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    const syncServices = async () => {
      try {
        const fetched = await api.getServices(true);
        if (active && Array.isArray(fetched)) {
          setLiveServices(fetched);
          setBrokenImages({});
        }
      } catch {}
    };

    syncServices();

    const handleUpdate = () => {
      syncServices();
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'gaukripa_services') {
        syncServices();
      }
    };

    window.addEventListener('gaukripa_services_updated', handleUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      active = false;
      window.removeEventListener('gaukripa_services_updated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const localizedDefaults = getLocalizedSevaItems(lang);
  const liveById = new Map<string, ServiceItem>(liveServices.map((s) => [s.id, s]));

  // Merge localized built-in items with live Admin overrides (especially customImageUrl & active status)
  const mergedBuiltIns: SevaItem[] = localizedDefaults
    .filter((item) => {
      const live = liveById.get(item.id);
      return live ? live.isActive !== false : true;
    })
    .map((item) => {
      const live = liveById.get(item.id);
      if (!live) return item;
      const defaultPrice = DEFAULT_BASE_PRICES[item.id];
      const priceEdited = defaultPrice !== undefined && Number(live.basePrice) !== defaultPrice;
      return {
        ...item,
        customImageUrl: live.customImageUrl || item.customImageUrl,
        basePrice: priceEdited ? Number(live.basePrice) : item.basePrice,
        priceDisplay: priceEdited ? live.priceDisplay || `₹${live.basePrice}` : item.priceDisplay,
      };
    });

  // Also include any brand-new services added via Admin Dashboard
  const builtInIds = new Set(localizedDefaults.map((i) => i.id));
  const customAdded: SevaItem[] = liveServices
    .filter((s) => !builtInIds.has(s.id) && s.isActive !== false)
    .map((s) => ({
      id: s.id,
      title: s.title,
      planet: s.planet,
      planetTag: s.planetTag,
      tagColor: s.tagColor,
      priceDisplay: s.priceDisplay,
      basePrice: s.basePrice,
      unit: s.unit,
      minQty: s.minQty,
      benefit: s.benefit,
      cropKey: s.cropKey,
      customImageUrl: s.customImageUrl,
      detailedDescription: s.detailedDescription || s.benefit,
      vedicSignificance: s.vedicSignificance || '',
      fulfilmentDetails: tr('व्हाट्सएप वीडियो पुष्टि शामिल', 'WhatsApp video distribution proof included'),
    }));

  const sevaItems: SevaItem[] = [...mergedBuiltIns, ...customAdded];

  return (
    <section id="seva-services" className="py-10 sm:py-14 bg-[#faf5e8] border-b border-[#ebdcb9] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-9 space-y-1.5">
          <div className="inline-flex items-center justify-center gap-3">
            <svg className="w-6 h-3.5 sm:w-7 text-[#4a6b49]" viewBox="0 0 40 20" fill="currentColor">
              <path d="M0,10 C15,5 25,0 40,10 C25,20 15,15 0,10 Z" opacity="0.7" />
              <circle cx="36" cy="10" r="2.5" />
            </svg>

            <span className="text-[11px] font-bold uppercase tracking-widest text-[#8a6828] bg-[#fbf2dd] px-3 py-0.5 rounded-full border border-[#ebdcb9]">
              {tr('गौमाता आहार व्यवस्था एवं सेवा', 'Gaumata Feed Management & Seva')}
            </span>

            <svg className="w-6 h-3.5 sm:w-7 text-[#4a6b49] rotate-180" viewBox="0 0 40 20" fill="currentColor">
              <path d="M0,10 C15,5 25,0 40,10 C25,20 15,15 0,10 Z" opacity="0.7" />
              <circle cx="36" cy="10" r="2.5" />
            </svg>
          </div>

          <h2 className="font-playfair text-2xl sm:text-3xl lg:text-[36px] font-black text-[#153e29] leading-tight">
            {tr('गौ-आहार प्रबंधन एवं प्रत्यक्ष सेवा', 'Gau-Aahar Management & Direct Service')}
          </h2>

          <p className="text-xs sm:text-sm text-[#6b5a45] font-medium leading-relaxed">
            {tr(
              'प्रमाणित गौशालाओं में आपके नाम एवं गोत्र संकल्प के साथ गौमाता के भोजन की व्यवस्था। सेवा उपरांत आपके व्हाट्सएप पर आहार वितरण की वीडियो पुष्टि भेजी जाती है।',
              'Direct arrangement of pure feed for Gaumata at certified goshalas with your name & Gotra Sankalp. After service fulfillment, a video confirmation is sent on your WhatsApp.'
            )}
          </p>
        </div>

        {/* Mobile-only Left-to-Right Scroll Hint */}
        <div className="flex md:hidden items-center justify-between text-[11px] font-bold text-[#7b6747] mb-2.5 px-0.5">
          <span className="inline-flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-emerald-700" />
            <span>{tr('वीडियो पुष्टि सहित प्रत्यक्ष सेवा', 'Direct Seva + Video Proof')}</span>
          </span>
          <span className="text-[#8a6828]">{tr('बाएँ से दाएँ स्वाइप करें →', 'Swipe left to right →')}</span>
        </div>

        {/* Compact Cards: Mobile Horizontal Scroll (< md) & Compact Website Grid (md+) */}
        <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-4 lg:gap-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar">
          {sevaItems.map((item) => {
            const showCustomImage = Boolean(item.customImageUrl && !brokenImages[item.id]);
            return (
              <div
                key={item.id}
                className="group w-[244px] sm:w-[260px] md:w-auto shrink-0 snap-start bg-[#fffdf9] rounded-2xl overflow-hidden border border-[#ebdcb9] shadow-xs hover:shadow-md hover:border-[#cfb784] transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Compact Image Header */}
                  <div className="relative h-32 md:h-36 w-full overflow-hidden bg-amber-50">
                    {showCustomImage ? (
                      <img
                        src={item.customImageUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        onError={() => setBrokenImages((prev) => ({ ...prev, [item.id]: true }))}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <ImageCrop
                        cropKey={item.cropKey}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        alt={item.title}
                      />
                    )}

                    {/* Compact Planetary Badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#faedd0]/95 text-[#6d460d] border border-[#d6ba7f] shadow-2xs backdrop-blur-md">
                        {item.planetTag}
                      </span>
                    </div>

                    {/* Compact Video Proof Badge */}
                    <div className="absolute top-2 right-2 z-10">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/85 text-emerald-200 border border-emerald-400/50 shadow-2xs backdrop-blur-md">
                        <Video className="w-2.5 h-2.5 text-emerald-400" />
                        <span>{tr('वीडियो पुष्टि', 'Video Proof')}</span>
                      </span>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
                  </div>

                  {/* Compact Service Details */}
                  <div className="p-3.5 md:p-4 text-left space-y-2">
                    <h3 className="font-playfair text-base md:text-[17px] font-bold text-[#1b4b32] leading-snug line-clamp-1 group-hover:text-[#123824] transition-colors">
                      {item.title}
                    </h3>

                    {/* Compact Price Strip */}
                    <div className="inline-flex items-baseline gap-1.5 bg-[#fdf6e7] px-2.5 py-1 rounded-lg border border-[#ebdcb9]">
                      <span className="text-[10px] font-bold text-[#8a7251] uppercase">
                        {tr('नियत शुल्क:', 'Service Fee:')}
                      </span>
                      <span className="text-sm md:text-base font-black text-[#1b4b32]">
                        {item.priceDisplay}
                      </span>
                    </div>

                    {/* Concise 2-line Benefit */}
                    <p className="text-[11px] text-[#5e513e] leading-snug line-clamp-2">
                      {item.benefit}
                    </p>

                    {/* Compact 1-line Fulfilment Assurance */}
                    <div className="pt-1.5 border-t border-[#f2e7cd] flex items-center gap-1 text-[10px] text-[#1b4b32] font-semibold">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">{item.fulfilmentDetails}</span>
                    </div>
                  </div>
                </div>

                {/* Compact Book Now Button */}
                <div className="p-3.5 pt-0 md:p-4 md:pt-0">
                  <button
                    onClick={() => onBookSeva(item)}
                    className="w-full py-2 px-3 rounded-full bg-[#1b4b32] hover:bg-[#153e29] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer group-hover:bg-[#123824]"
                  >
                    <span>{tr('आहार सेवा व्यवस्था करें', 'Arrange Feed Service')}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-amber-300" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Service Transparency Assurance Card */}
        <div className="mt-7 p-4 sm:p-5 rounded-2xl bg-[#fffdf9] border border-[#ebdcb9] shadow-xs max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="space-y-0.5">
              <h4 className="font-playfair text-sm sm:text-base font-bold text-[#1b4b32]">
                {tr('100% प्रत्यक्ष एवं पारदर्शी आहार सेवा प्रबंधन', '100% Direct & Transparent Feed Service Management')}
              </h4>
              <p className="text-[11px] sm:text-xs text-[#6e6351]">
                {tr(
                  'यह एक निर्धारित आहार प्रबंधन सेवा है। आपके द्वारा चयनित आहार (चारा, गुड़-चना या रोटी) को तय मात्रा में गौशाला तक पहुँचाकर गौमाता को अर्पित किया जाता है।',
                  'This is a structured feed management service. The exact quantity of feed you select (fodder, gud-chana, or rotis) is arranged at the goshala and directly served to Gaumata.'
                )}
              </p>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-[11px] border border-emerald-300">
                <Video className="w-3.5 h-3.5 text-emerald-700" />
                <span>{tr('व्हाट्सएप वीडियो पुष्टि', 'WhatsApp Video Proof')}</span>
              </span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
