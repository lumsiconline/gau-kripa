import React, { useState } from 'react';
import { X, Heart, CheckCircle2, Send } from 'lucide-react';
import { ImageCrop } from './ImageCrop';
import { useLanguage } from '../i18n/LanguageContext';

interface SevaParivarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SevaParivarModal: React.FC<SevaParivarModalProps> = ({ isOpen, onClose }) => {
  const { tr } = useLanguage();
  const [name, setName] = useState('Harsh Bhardwaj');
  const [phone, setPhone] = useState('9876543210');
  const [city, setCity] = useState('New Delhi');
  const [joined, setJoined] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJoined(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#fffdfa] rounded-3xl shadow-2xl border-2 border-[#ebdcb9] overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-[#1b4b32] text-white p-5 flex items-center justify-between border-b border-[#296344]">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-amber-300 fill-amber-300" />
            <h3 className="font-playfair text-lg font-bold text-amber-200">
              {tr('गौकृपा परिवार से जुड़ें', 'GauKripa Seva Parivar se Judein')}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!joined ? (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-300 mx-auto bg-amber-50 shadow-xs">
                <ImageCrop cropKey="bottomCow" className="w-full h-full object-cover scale-110" alt="Gaumata" />
              </div>
              <h4 className="font-playfair text-base font-bold text-[#1b4b32] pt-1">
                {tr('गौमाता सेवा एवं आध्यात्मिक परिवार के सदस्य बनें', 'Gaumata Seva aur Adhyatmik Parivar se Judein')}
              </h4>
              <p className="text-xs text-[#6e5d48]">
                {tr(
                  'प्रतिदिन प्रातःकालीन प्रमाणित गौशाला दर्शन, एकादशी तिथि सूचना और शुभ वैदिक पंचांग सीधे अपने व्हाट्सएप पर प्राप्त करें।',
                  'Roz subah pramanit goshala darshan, Ekadashi tithi suchna aur shubh Vedic Panchang seedhe apne WhatsApp par paayein.'
                )}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-[#483d2e] mb-1">
                  {tr('पूरा नाम', 'Poora Naam')}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs focus:outline-hidden focus:border-[#1b4b32]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#483d2e] mb-1">
                  {tr('व्हाट्सएप मोबाइल नंबर', 'WhatsApp Mobile Number')}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-[#7d705c] font-semibold">+91</span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-11 pr-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs focus:outline-hidden focus:border-[#1b4b32]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#483d2e] mb-1">
                  {tr('आपका शहर / राज्य', 'Aapka Shehar / Rajya')}
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs focus:outline-hidden focus:border-[#1b4b32]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-[#1b4b32] hover:bg-[#153e29] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>{tr('व्हाट्सएप सेवा परिवार में जुड़ें', 'Free WhatsApp Seva Parivar Mein Judein')}</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="font-playfair text-xl font-bold text-[#1b4b32]">
                {tr('सेवा परिवार में आपका स्वागत है!', 'Seva Parivar Mein Aapka Swagat Hai!')}
              </h4>
              <p className="text-xs text-[#5d4e3b]">
                {tr(
                  `प्रणाम ${name} जी! आप गौकृपा व्हाट्सएप समुदाय से जुड़ चुके हैं। दैनिक प्रातःकालीन दर्शन +91 ${phone} पर भेजे जाएंगे।`,
                  `Pranam ${name} ji! Aap GauKripa WhatsApp parivar se jud chuke hain. Roz subah darshan +91 ${phone} par bheje jayenge.`
                )}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-[#5e4b2d]">
              🙏 {tr('“गावो मे हृदयं सन्तु, गावः सन्तु चिरोदये” — गौमाता की कृपा सदैव बनी रहे।', '“Gaavo Me Hridaya Santu, Gavah Santu Chirodhaye” — Gaumata ki kripa hamesha bani rahe.')}
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2 rounded-full bg-[#1b4b32] text-white text-xs font-semibold cursor-pointer"
            >
              {tr('बंद करें', 'Band Karein')}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
