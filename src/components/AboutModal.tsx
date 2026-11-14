import React from 'react';
import { X, ShieldCheck, Award } from 'lucide-react';
import { ImageCrop } from './ImageCrop';
import { useLanguage } from '../i18n/LanguageContext';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExploreSevas: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, onExploreSevas }) => {
  const { tr } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#fffdfa] rounded-3xl shadow-2xl border-2 border-[#ebdcb9] overflow-hidden my-6 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-[#1b4b32] text-white p-5 flex items-center justify-between border-b border-[#296344] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🌿</span>
            <div>
              <h3 className="font-playfair text-lg sm:text-xl font-bold text-amber-200">
                {tr('गौकृपा परिचय एवं सेवा उद्देश्य', 'GauKripa Parichay aur Seva Uddeshya')}
              </h3>
              <p className="text-xs text-emerald-100/80">
                {tr('गौमाता आहार व्यवस्था • वैदिक ज्योतिष • आध्यात्मिक परामर्श', 'Gaumata Aahar Vyavastha • Vedic Jyotish • Adhyatmik Paramarsh')}
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

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs sm:text-sm text-[#483c2e] leading-relaxed">
          <div className="h-48 rounded-2xl overflow-hidden border border-[#ebdcb9] bg-[#f6ebd3] p-1.5 flex items-center justify-center">
            <ImageCrop cropKey="heroCows" className="w-full h-full rounded-xl" preserveAspectRatio="xMidYMid meet" alt="GauKripa Goshala" />
          </div>

          <p>
            <strong className="text-[#1b4b32] font-semibold">{tr('गौकृपा (GauKripa)', 'GauKripa')}</strong>{' '}
            {tr(
              'गौमाता के लिए प्रत्यक्ष आहार व्यवस्था (गौ-आहार प्रबंधन), वैदिक ज्योतिष मार्गदर्शन और आध्यात्मिक परामर्श प्रदान करने वाला एक समर्पित मंच है।',
              'Gaumata ke liye pratyaksh aahar vyavastha (Gau-Aahar prabandhan), Vedic Jyotish margdarshan aur adhyatmik paramarsh dene wala ek samarpit manch hai.'
            )}
          </p>

          <p>
            {tr(
              'व्यस्त शहरी जीवन में अनेक परिवार घर बैठे प्रमाणित गौशालाओं में गौमाता को ताजा चारा, गुड़-चना या रोटी खिलाने की व्यवस्था करना चाहते हैं और अनुभवी वैदिक आचार्यों से कुंडली व ग्रह-नक्षत्र परामर्श लेना चाहते हैं। गौकृपा 100% पारदर्शिता के साथ यह सेवा आपके नाम व गोत्र संकल्प सहित पूर्ण करता है।',
              'Vyast jeevan mein kai parivar ghar baithe pramanit goshalayon mein Gaumata ko taaza chara, gud-chana ya roti khilane ki vyavastha karna chahte hain aur anubhavi Vedic acharyon se Kundali aur Grah-Nakshatra paramarsh lena chahte hain. GauKripa 100% pardarshita ke sath yeh seva aapke naam aur Gotra Sankalp sahit poori karta hai.'
            )}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-[#faf2e1] border border-[#ebdcb9] flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#1b4b32] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-bold text-[#1b4b32]">
                  {tr('आहार वितरण की वीडियो पुष्टि', 'Aahar Vitaran ka Video Proof')}
                </strong>
                <span className="text-[11px] text-[#6c5d4b]">
                  {tr('गौमाता को आहार खिलाते समय यजमान के नाम व गोत्र पट्टिका सहित वीडियो व्हाट्सएप पर भेजा जाता है।', 'Gaumata ko aahar khilate samay aapke naam aur Gotra board ke sath video proof seedhe WhatsApp par bheja jata hai.')}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#faf2e1] border border-[#ebdcb9] flex items-start gap-2.5">
              <Award className="w-5 h-5 text-[#1b4b32] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-bold text-[#1b4b32]">
                  {tr('अनुभवी वैदिक ज्योतिषाचार्य', 'Anubhavi Vedic Jyotishacharya')}
                </strong>
                <span className="text-[11px] text-[#6c5d4b]">
                  {tr('प्रेम, विवाह, करियर, जन्म कुंडली एवं ग्रह-नक्षत्र विश्लेषण पर गोपनीय परामर्श।', 'Love, marriage, career, Janam Kundali aur Grah-Nakshatra vishleshan par gopniya paramarsh.')}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-[#224b33]">
            <strong>{tr('पारदर्शी सेवा गारंटी:', 'Pardarshi Seva Guarantee:')}</strong>{' '}
            {tr(
              'प्रत्येक सेवा निर्धारित मात्रा (जैसे 5 किलो चारा ₹251, गुड़-चना ₹151, 4 रोटियाँ ₹51) के अनुसार प्रत्यक्ष आहार प्रबंधन द्वारा पूर्ण की जाती है और तुरंत पुष्टि रसीद प्रदान की जाती है।',
              'Har seva tay matra (jaise 5 kg Chara ₹251, Gud-Chana ₹151, 4 Roti ₹51) ke anusar pratyaksh aahar vyavastha se poori hoti hai aur turant raseed aur video proof diya jata hai.'
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f8f1de] border-t border-[#ebdcb9] flex items-center justify-between shrink-0">
          <span className="text-xs text-[#6e5d48]">
            {tr('देशभर की प्रमाणित एवं सहयोगी गौशालाएं।', 'Desh bhar ki pramanit aur sahyogi goshalayein.')}
          </span>
          <button
            onClick={() => {
              onClose();
              onExploreSevas();
            }}
            className="px-5 py-2 rounded-full bg-[#1b4b32] hover:bg-[#153e29] text-white font-bold text-xs cursor-pointer"
          >
            {tr('आहार सेवाएँ देखें', 'Aahar Sevaein Dekhein')}
          </button>
        </div>

      </div>
    </div>
  );
};
