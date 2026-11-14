import React, { useEffect, useState } from 'react';
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

    const handleUpdate = () => syncServices();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'gaukripa_services') syncServices();
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

  // Merge localized built-in items with live Admin overrides (customImageUrl, prices & active status)
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
    <section id="seva-services" className="py-5 sm:py-8 bg-[#fbf6ee] overflow-hidden">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6">

        {/* Centered Section Heading + Decorative Diamond Line */}
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-[#2e1a0c] leading-tight">
            {tr('हमारी सेवा', 'Hamari Seva')}
          </h2>
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <span className="h-[1.5px] w-14 sm:w-20 bg-gradient-to-r from-transparent to-[#c57b39]" />
            <span className="w-1.5 h-1.5 rotate-45 bg-[#b54c0d]" />
            <span className="w-2 h-2 rotate-45 border border-[#c57b39] bg-[#f5c458]" />
            <span className="w-1.5 h-1.5 rotate-45 bg-[#b54c0d]" />
            <span className="h-[1.5px] w-14 sm:w-20 bg-gradient-to-l from-transparent to-[#c57b39]" />
          </div>
        </div>

        {/* Horizontal Swipe on Mobile, Clean 3-Col Grid on Desktop */}
        <div className="flex items-stretch md:grid md:grid-cols-3 md:auto-rows-fr gap-2.5 sm:gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-2 md:pb-0 -mx-3.5 px-3.5 md:mx-0 md:px-0 no-scrollbar">
          {sevaItems.map((item) => {
            const showCustomImage = Boolean(item.customImageUrl && !brokenImages[item.id]);
            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => onBookSeva(item)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onBookSeva(item);
                  }
                }}
                className="group w-[166px] sm:w-[208px] md:w-auto md:h-full shrink-0 snap-start bg-white rounded-2xl border border-[#ede0ca] shadow-[0_6px_18px_rgba(92,54,18,0.06)] hover:shadow-md hover:border-[#d3ae7a] transition-all flex flex-col overflow-hidden cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-[#b54c0d]"
              >
                {/* Inset Rounded Photo Container */}
                <div className="p-2 pb-0 shrink-0">
                  <div className="w-full h-28 sm:h-36 md:h-40 rounded-xl overflow-hidden bg-[#f5ead8]">
                    {showCustomImage ? (
                      <img
                        src={item.customImageUrl}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        onError={() => setBrokenImages((prev) => ({ ...prev, [item.id]: true }))}
                        className="w-full h-full object-cover object-center block"
                      />
                    ) : (
                      <ImageCrop
                        cropKey={item.cropKey}
                        className="w-full h-full"
                        preserveAspectRatio="xMidYMid slice"
                        alt={item.title}
                      />
                    )}
                  </div>
                </div>

                {/* Compact Content + Bottom Price Pill & Select Button */}
                <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between gap-2 text-left">
                  <div>
                    <h3 className="text-[13px] sm:text-sm font-bold text-[#2e1a0c] leading-snug line-clamp-2 group-hover:text-[#b54c0d] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#6f5744] font-medium truncate mt-0.5">
                      {item.unit}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-1">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#b54c0d] text-white text-[11px] sm:text-xs font-bold whitespace-nowrap tabular-nums">
                      {item.priceDisplay}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onBookSeva(item);
                      }}
                      className="px-3 sm:px-3.5 py-0.5 sm:py-1 rounded-full border border-[#d6c2a8] group-hover:border-[#b54c0d] group-hover:bg-[#b54c0d] group-hover:text-white text-[#2e1a0c] text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {tr('बुक', 'Book')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
