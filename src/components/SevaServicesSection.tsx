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
      fulfilmentDetails: tr('व्हाट्सएप वीडियो पुष्टि शामिल', 'WhatsApp video proof shamil hai'),
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
              {tr('गौमाता आहार व्यवस्था एवं सेवा', 'Gaumata Aahar Vyavastha aur Seva')}
            </span>

            <svg className="w-6 h-3.5 sm:w-7 text-[#4a6b49] rotate-180" viewBox="0 0 40 20" fill="currentColor">
              <path d="M0,10 C15,5 25,0 40,10 C25,20 15,15 0,10 Z" opacity="0.7" />
              <circle cx="36" cy="10" r="2.5" />
            </svg>
          </div>

          <h2 className="font-playfair text-2xl sm:text-3xl lg:text-[36px] font-black text-[#153e29] leading-tight">
            {tr('गौ-आहार प्रबंधन एवं प्रत्यक्ष सेवा', 'Gau-Aahar Prabandhan aur Pratyaksh Seva')}
          </h2>

          <p className="text-xs sm:text-sm text-[#6b5a45] font-medium leading-relaxed">
            {tr(
              'प्रमाणित गौशालाओं में आपके नाम एवं गोत्र संकल्प के साथ गौमाता के भोजन की व्यवस्था। सेवा उपरांत आपके व्हाट्सएप पर आहार वितरण की वीडियो पुष्टि भेजी जाती है।',
              'Pramanit goshalayon mein aapke naam aur Gotra Sankalp ke sath Gaumata ke bhojan ki vyavastha. Seva poori hone ke baad aapke WhatsApp par aahar vitaran ka video proof bheja jata hai.'
            )}
          </p>
        </div>

        {/* Mobile-only Left-to-Right Scroll Hint */}
        <div className="flex md:hidden items-center justify-between text-[11px] font-bold text-[#7b6747] mb-2.5 px-0.5">
          <span className="inline-flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-emerald-700" />
            <span>{tr('वीडियो पुष्टि सहित प्रत्यक्ष सेवा', 'Video Proof ke sath Pratyaksh Seva')}</span>
          </span>
          <span className="text-[#8a6828]">{tr('बाएँ से दाएँ स्वाइप करें →', 'Baayein se daayein swipe karein →')}</span>
        </div>

        {/* Compact Cards: Mobile Horizontal Scroll (< md) & Compact Website Grid (md+) */}
        <div className="flex md:grid md:grid-cols-3 gap-3 md:gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar">
          {sevaItems.map((item) => {
            const showCustomImage = Boolean(item.customImageUrl && !brokenImages[item.id]);
            return (
              <div
                key={item.id}
                className="group w-[238px] sm:w-[252px] md:w-auto shrink-0 snap-start bg-[#fffdf9] rounded-2xl overflow-hidden border border-[#ebdcb9] shadow-xs hover:shadow-md hover:border-[#cfb784] transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Full Uncropped Image Well */}
                  <div className="p-2 pb-0">
                    <div className="h-36 md:h-40 w-full rounded-xl overflow-hidden bg-[#f6ebd3] flex items-center justify-center border border-[#ead9b5]/70">
                      {showCustomImage ? (
                        <img
                          src={item.customImageUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          onError={() => setBrokenImages((prev) => ({ ...prev, [item.id]: true }))}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <ImageCrop
                          cropKey={item.cropKey}
                          className="w-full h-full"
                          preserveAspectRatio="xMidYMid meet"
                          alt={item.title}
                        />
                      )}
                    </div>
                  </div>

                  {/* Compact Service Details */}
                  <div className="p-3 pt-2.5 text-left space-y-1.5">
                    {/* Clean Unboxed Metadata Strip */}
                    <div className="flex items-center justify-between gap-2 text-[10px] font-semibold text-[#7a5b24]">
                      <span className="truncate">{item.planetTag}</span>
                      <span className="inline-flex items-center gap-1 text-emerald-800 shrink-0">
                        <Video className="w-3 h-3 text-emerald-700" />
                        <span>{tr('वीडियो पुष्टि', 'Video Proof')}</span>
                      </span>
                    </div>

                    {/* Title + Fee Assembled on Clean Row */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-playfair text-[15px] md:text-base font-bold text-[#1b4b32] leading-snug group-hover:text-[#123824] transition-colors">
                        {item.title}
                      </h3>
                      <span className="shrink-0 text-xs md:text-[13px] font-black text-[#1b4b32] bg-[#fdf6e7] px-2 py-0.5 rounded-lg border border-[#ebdcb9] whitespace-nowrap">
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
                <div className="p-3 pt-0">
                  <button
                    onClick={() => onBookSeva(item)}
                    className="w-full py-2 px-3 rounded-full bg-[#1b4b32] hover:bg-[#153e29] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer group-hover:bg-[#123824]"
                  >
                    <span>{tr('आहार सेवा व्यवस्था करें', 'Apni Seva Book Karein')}</span>
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
                {tr('100% प्रत्यक्ष एवं पारदर्शी आहार सेवा प्रबंधन', '100% Pratyaksh aur Pardarshi Aahar Seva Prabandhan')}
              </h4>
              <p className="text-[11px] sm:text-xs text-[#6e6351]">
                {tr(
                  'यह एक निर्धारित आहार प्रबंधन सेवा है। आपके द्वारा चयनित आहार (चारा, गुड़-चना या रोटी) को तय मात्रा में गौशाला तक पहुँचाकर गौमाता को अर्पित किया जाता है।',
                  'Yeh ek niyamit aahar prabandhan seva hai. Aapke dwara chuna gaya aahar (Chara, Gud-Chana ya Roti) tay matra mein goshala pahunchakar Gaumata ko khilaya jata hai.'
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
