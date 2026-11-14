import React from 'react';
import { Leaf, Check, Video, Heart, ArrowRight } from 'lucide-react';
import { ImageCrop } from './ImageCrop';
import { useLanguage } from '../i18n/LanguageContext';

interface WhyChooseUsStripProps {
  onJoinParivar: () => void;
  onOpenProofGallery: () => void;
}

export const WhyChooseUsStrip: React.FC<WhyChooseUsStripProps> = ({
  onJoinParivar,
  onOpenProofGallery,
}) => {
  const { tr } = useLanguage();

  return (
    <section className="bg-[#f6ecdc] border-y border-[#eadbc4] py-7 sm:py-9 overflow-hidden">
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6">
        
        {/* Title */}
        <h2 className="text-center font-playfair text-xl sm:text-2xl font-bold text-[#2e1a0c] mb-5">
          {tr('गौकृपा ही क्यों चुनें?', 'GauKripa Kyon Chunein?')}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          
          {/* 4 Pillars with Separator Lines */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-[#e5d2b5]">
            
            {/* Pillar 1 */}
            <div className="flex flex-col items-center text-center p-2 pt-3 sm:pt-2 sm:first:pt-2">
              <div className="w-9 h-9 rounded-full bg-white border border-[#eadbc4] flex items-center justify-center text-[#b54c0d] mb-2 shadow-2xs">
                <Leaf className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#2e1a0c] leading-tight">
                {tr('श्रद्धा एवं करुणा', 'Shraddha aur Karuna')}
                <br />
                <span className="text-[11px] font-medium text-[#6f5744]">{tr('के साथ प्रत्यक्ष सेवा', 'ke sath Pratyaksh Seva')}</span>
              </span>
            </div>

            {/* Pillar 2 */}
            <div className="flex flex-col items-center text-center p-2 pt-3 sm:pt-2 sm:pl-3">
              <div className="w-9 h-9 rounded-full bg-white border border-[#eadbc4] flex items-center justify-center text-[#b54c0d] mb-2 shadow-2xs">
                <Check className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold text-[#2e1a0c] leading-tight">
                {tr('100% पारदर्शी', '100% Pardarshi')}
                <br />
                <span className="text-[11px] font-medium text-[#6f5744]">{tr('आहार व्यवस्था', 'Aahar Vyavastha')}</span>
              </span>
            </div>

            {/* Pillar 3 */}
            <div 
              onClick={onOpenProofGallery}
              className="flex flex-col items-center text-center p-2 pt-3 sm:pt-2 sm:pl-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-full bg-white group-hover:bg-[#fdf1da] border border-[#eadbc4] transition-colors flex items-center justify-center text-[#b54c0d] mb-2 shadow-2xs">
                <Video className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#2e1a0c] leading-tight group-hover:text-[#b54c0d] transition-colors">
                {tr('वीडियो पुष्टि', 'Video Proof')}
                <br />
                <span className="text-[11px] font-medium text-[#6f5744]">
                  {tr('(WhatsApp पर फोटो/वीडियो)', '(WhatsApp par Photo/Video)')}
                </span>
              </span>
            </div>

            {/* Pillar 4 */}
            <div className="flex flex-col items-center text-center p-2 pt-3 sm:pt-2 sm:pl-3">
              <div className="w-9 h-9 rounded-full bg-white border border-[#eadbc4] flex items-center justify-center text-[#b54c0d] mb-2 shadow-2xs">
                <Heart className="w-4 h-4 fill-[#b54c0d]" />
              </div>
              <span className="text-xs font-bold text-[#2e1a0c] leading-tight">
                {tr('आध्यात्मिक शांति', 'Adhyatmik Shanti')}
                <br />
                <span className="text-[11px] font-medium text-[#6f5744]">{tr('एवं सुख-समृद्धि', 'aur Sukh-Samriddhi')}</span>
              </span>
            </div>

          </div>

          {/* Right Peeking Cow & Parivar CTA */}
          <div className="lg:col-span-4 flex items-center justify-center lg:justify-end gap-3 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#eadbc4]">
            
            <div className="w-16 h-14 sm:w-20 sm:h-16 shrink-0 rounded-xl overflow-hidden border border-[#d9ba78] shadow-xs bg-[#fbf6ee] p-0.5">
              <ImageCrop
                cropKey="bottomCow"
                className="w-full h-full rounded-lg"
                preserveAspectRatio="xMidYMid meet"
                alt={tr('गौमाता दर्शन', 'Gaumata Darshan')}
              />
            </div>

            <div className="text-left space-y-1">
              <p className="font-script text-sm sm:text-base text-[#5a3b24] font-semibold leading-tight">
                {tr('“गौ सेवा से ही जग का कल्याण है...”', '“Gau Seva se hi jag ka kalyan hai...”')}
                <br />
                <span className="font-sans font-bold text-xs text-[#2e1a0c]">
                  {tr('गौकृपा परिवार से जुड़ें', 'GauKripa Parivar se Judein')}
                </span>
              </p>

              <button
                onClick={onJoinParivar}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#b54c0d] hover:bg-[#993c06] active:scale-98 text-white font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <span>{tr('परिवार में शामिल हों', 'Parivar Mein Judein')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
