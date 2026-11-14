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
    <section className="bg-[#fcf6ea] border-b border-[#ebdcb9] py-8 sm:py-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title */}
        <h2 className="text-center font-playfair text-2xl sm:text-3xl font-bold text-[#1b4b32] mb-6">
          {tr('गौकृपा ही क्यों चुनें?', 'GauKripa Kyon Chunein?')}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* 4 Pillars with Separator Lines */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[#e2d2ad]">
            
            {/* Pillar 1 */}
            <div className="flex flex-col items-center text-center p-2 pt-3 sm:pt-2 sm:first:pt-2">
              <div className="w-10 h-10 rounded-full bg-[#f3e7cb] flex items-center justify-center text-[#1b4b32] mb-2">
                <Leaf className="w-5 h-5 text-[#2c6947]" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#273229] leading-tight">
                {tr('श्रद्धा एवं करुणा', 'Shraddha aur Karuna')}
                <br />
                {tr('के साथ प्रत्यक्ष सेवा', 'ke sath Pratyaksh Seva')}
              </span>
            </div>

            {/* Pillar 2 */}
            <div className="flex flex-col items-center text-center p-2 pt-3 sm:pt-2 sm:pl-4">
              <div className="w-10 h-10 rounded-full bg-[#f3e7cb] flex items-center justify-center text-[#1b4b32] mb-2">
                <Check className="w-5 h-5 stroke-[2.5] text-[#2c6947]" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#273229] leading-tight">
                {tr('100% पारदर्शी', '100% Pardarshi')}
                <br />
                {tr('आहार व्यवस्था', 'Aahar Vyavastha')}
              </span>
            </div>

            {/* Pillar 3 */}
            <div 
              onClick={onOpenProofGallery}
              className="flex flex-col items-center text-center p-2 pt-3 sm:pt-2 sm:pl-4 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-[#f3e7cb] group-hover:bg-[#ebd9b2] transition-colors flex items-center justify-center text-[#1b4b32] mb-2">
                <Video className="w-5 h-5 text-[#2c6947]" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#273229] leading-tight group-hover:text-[#1b4b32] transition-colors">
                {tr('आहार वितरण की वीडियो पुष्टि', 'Aahar Vitaran ka Video Proof')}
                <br />
                <span className="text-[11px] font-normal text-[#6f604c]">
                  {tr('(WhatsApp पर फोटो/वीडियो)', '(WhatsApp par Photo/Video)')}
                </span>
              </span>
            </div>

            {/* Pillar 4 */}
            <div className="flex flex-col items-center text-center p-2 pt-3 sm:pt-2 sm:pl-4">
              <div className="w-10 h-10 rounded-full bg-[#f3e7cb] flex items-center justify-center text-[#1b4b32] mb-2">
                <Heart className="w-5 h-5 text-[#2c6947] fill-[#2c6947]" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-[#273229] leading-tight">
                {tr('आध्यात्मिक शांति', 'Adhyatmik Shanti')}
                <br />
                {tr('एवं सुख-समृद्धि', 'aur Sukh-Samriddhi')}
              </span>
            </div>

          </div>

          {/* Right Peeking Cow & Parivar CTA */}
          <div className="lg:col-span-4 flex items-center justify-center lg:justify-end gap-3 sm:gap-4 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#ebdcb9]">
            
            <div className="w-20 h-16 sm:w-24 sm:h-20 shrink-0 rounded-xl overflow-hidden border border-[#d9ba78] shadow-xs bg-[#f6ebd3] p-0.5">
              <ImageCrop
                cropKey="bottomCow"
                className="w-full h-full rounded-lg"
                preserveAspectRatio="xMidYMid meet"
                alt={tr('गौमाता दर्शन', 'Gaumata Darshan')}
              />
            </div>

            <div className="text-center sm:text-left space-y-1.5">
              <p className="font-script text-base sm:text-lg text-[#253528] font-semibold leading-tight">
                {tr('“गौ सेवा से ही जग का कल्याण है...”', '“Gau Seva se hi jag ka kalyan hai...”')}
                <br />
                <span className="font-sans font-bold text-xs sm:text-sm text-[#1b4b32]">
                  {tr('गौकृपा परिवार से जुड़ें', 'GauKripa Parivar se Judein')}
                </span>
              </p>

              <button
                onClick={onJoinParivar}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1b4b32] hover:bg-[#153e29] active:scale-98 text-white font-bold text-xs shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                <span>{tr('सेवा परिवार में शामिल हों', 'Seva Parivar Mein Shamil Hon')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
