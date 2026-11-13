import React, { useState, useEffect } from 'react';
import { X, Play, Star } from 'lucide-react';
import { getLocalizedRecentProofs, SevaProof } from '../data/sevaData';
import { ImageCrop } from './ImageCrop';
import { useLanguage } from '../i18n/LanguageContext';

interface ProofGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookSevaClick: () => void;
}

export const ProofGalleryModal: React.FC<ProofGalleryModalProps> = ({
  isOpen,
  onClose,
  onBookSevaClick,
}) => {
  const { lang, tr } = useLanguage();
  const proofs = getLocalizedRecentProofs(lang);

  const [activeTab, setActiveTab] = useState<'proofs' | 'reviews'>('proofs');
  const [selectedProof, setSelectedProof] = useState<SevaProof>(proofs[0]);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);

  useEffect(() => {
    setSelectedProof(proofs[0]);
  }, [lang]);

  if (!isOpen) return null;

  const reviews = lang === 'en'
    ? [
        {
          name: 'Pooja Agarwal',
          city: 'Delhi',
          stars: 5,
          date: '3 days ago',
          text: 'Within 2 hours of booking fresh roti service for my mother’s wellbeing, I received a clear HD video on WhatsApp showing our family name and Gotra written clearly while the cows were being fed. Complete transparency!',
          seva: 'Gaumata Fresh Roti Service'
        },
        {
          name: 'Ramanathan K.',
          city: 'Chennai',
          stars: 5,
          date: '1 week ago',
          text: 'Consulted Astrologer Nipunjj regarding business hurdles. He suggested Gaumata Fodder service and Numerology & Kundali remedies. The calmness and clarity we experienced is remarkable.',
          seva: 'Fodder & Jyotish Guidance'
        },
        {
          name: 'Vikas & Shruti Mittal',
          city: 'Indore',
          stars: 5,
          date: '2 weeks ago',
          text: 'Our monthly Gau Aahar arrangement runs smoothly with GauKripa. The Vrindavan goshala team sends our Sankalp & distribution video every month.',
          seva: 'Monthly Gaumata Feed Service'
        }
      ]
    : [
        {
          name: 'पूजा अग्रवाल',
          city: 'नई दिल्ली',
          stars: 5,
          date: '3 दिन पहले',
          text: 'माताजी के स्वास्थ्य लाभ हेतु रोटी व्यवस्था बुक करने के 2 घंटे के भीतर व्हाट्सएप पर स्पष्ट एचडी वीडियो प्राप्त हुआ जिसमें हमारे नाम व गोत्र की तख्ती के साथ गौमाता को रोटी खिलाई जा रही थी। पूर्णतः पारदर्शी व्यवस्था!',
          seva: 'गौमाता के लिए रोटी व्यवस्था'
        },
        {
          name: 'रामनाथन के.',
          city: 'चेन्नई',
          stars: 5,
          date: '1 सप्ताह पहले',
          text: 'व्यापारिक बाधाओं के लिए ज्योतिषाचार्य निपुंज जी से ज्योतिष परामर्श लिया। उनके सुझाव से गौ-चारा आहार सेवा करवाई। घर में बहुत सकारात्मक ऊर्जा और मानसिक शांति का अनुभव हुआ।',
          seva: 'गौ-चारा एवं ज्योतिष मार्गदर्शन'
        },
        {
          name: 'विकास एवं श्रुति मित्तल',
          city: 'इंदौर',
          stars: 5,
          date: '2 सप्ताह पहले',
          text: 'हमारी मासिक गौ-आहार व्यवस्था गौकृपा के माध्यम से सुचारू रूप से चल रही है। वृंदावन गौशाला से हर माह गोत्र संकल्प एवं आहार वितरण की वीडियो पुष्टि समय पर मिल जाती है।',
          seva: 'मासिक गौ-आहार व्यवस्था'
        }
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#fffdfa] rounded-3xl shadow-2xl border-2 border-[#ebdcb9] overflow-hidden my-4 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-[#1b4b32] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#296344] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📹</span>
            <div>
              <h3 className="font-playfair text-lg sm:text-xl font-bold text-amber-200">
                {tr('आहार वितरण की वीडियो पुष्टि एवं समीक्षाएं', '100% Video Proof & Customer Reviews')}
              </h3>
              <p className="text-xs text-emerald-100/80">
                {tr('प्रत्येक सेवा की वीडियो पुष्टि आपके नाम एवं गोत्र पट्टिका सहित की जाती है', 'Every feed service is video-recorded with your name placard')}
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

        {/* Tab switch */}
        <div className="px-5 pt-3 pb-2 bg-[#f6eee0] border-b border-[#ebdcb9] flex gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('proofs')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'proofs'
                ? 'bg-[#1b4b32] text-white shadow-xs'
                : 'bg-white text-[#554737] hover:bg-[#ede0c7]'
            }`}
          >
            {tr(`आहार वितरण वीडियो पुष्टि (${proofs.length})`, `Live Feed Video Proofs (${proofs.length})`)}
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-[#1b4b32] text-white shadow-xs'
                : 'bg-white text-[#554737] hover:bg-[#ede0c7]'
            }`}
          >
            {tr('सत्यापित ग्राहक समीक्षाएं (★ 4.9)', 'Verified Customer Reviews (★ 4.9)')}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'proofs' ? (
            <div className="space-y-4">
              
              {/* Featured Video Player Box */}
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-[#d9ba78] shadow-md group">
                <ImageCrop
                  cropKey="sevaChara"
                  className="w-full h-full object-cover opacity-80"
                  alt={tr('गौशाला आहार वितरण वीडियो', 'Live Gaushala Feed Service Video')}
                />

                {/* Video Play Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-4">
                  <div className="flex items-center justify-between text-xs text-white">
                    <span className="bg-[#cc1a1a] text-white px-2 py-0.5 rounded font-bold uppercase text-[10px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      {tr('प्रत्यक्ष प्रमाण', 'Live Proof')}
                    </span>
                    <span className="text-amber-200 font-semibold">{selectedProof.goshalaName}</span>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => setIsPlayingVideo(!isPlayingVideo)}
                      className="w-14 h-14 rounded-full bg-[#e5a024] hover:bg-[#d4901a] text-slate-950 flex items-center justify-center mx-auto shadow-lg transition-transform hover:scale-110 cursor-pointer"
                    >
                      <Play className="w-7 h-7 fill-slate-950 ml-1" />
                    </button>
                    <p className="text-xs text-white font-medium mt-2 drop-shadow-md">
                      {isPlayingVideo
                        ? tr('आहार वितरण वीडियो पुष्टि चल रही है...', 'Playing Feed Distribution Video Proof...')
                        : tr('संकल्प एवं आहार वितरण वीडियो देखने के लिए क्लिक करें', 'Click to Play Sankalp & Feed Distribution Video')}
                    </p>
                  </div>

                  {/* Devotee Placard Tag at Bottom */}
                  <div className="bg-black/60 backdrop-blur-md rounded-xl p-2.5 text-xs text-white flex items-center justify-between border border-white/20">
                    <div>
                      <div className="font-bold text-amber-300">
                        {tr('नाम पट्टिका:', 'Name Board:')} {selectedProof.devoteeName}
                      </div>
                      <div className="text-[11px] text-gray-300">{selectedProof.sevaTitle} • {selectedProof.date}</div>
                    </div>
                    <span className="text-[10px] bg-emerald-700 text-white px-2 py-0.5 rounded-full font-mono">
                      {selectedProof.certificateId}
                    </span>
                  </div>
                </div>
              </div>

              {/* Proofs List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#62533f] uppercase tracking-wider">
                  {tr('हाल ही में पूर्ण हुई आहार सेवाएं', 'Recent Completed Feed Services')}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {proofs.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedProof(p)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all cursor-pointer flex items-center justify-between ${
                        selectedProof.id === p.id
                          ? 'bg-[#1b4b32] text-white border-[#1b4b32]'
                          : 'bg-[#faf3e3] text-[#2f271e] border-[#ebdcb9] hover:bg-[#f3ebd3]'
                      }`}
                    >
                      <div>
                        <div className="font-bold truncate">{p.devoteeName}</div>
                        <div className={`text-[11px] ${selectedProof.id === p.id ? 'text-amber-200' : 'text-[#7d705c]'}`}>
                          {p.sevaTitle}
                        </div>
                      </div>
                      <span className={`text-[10px] font-medium ${selectedProof.id === p.id ? 'text-emerald-200' : 'text-[#9c845b]'}`}>
                        {p.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            /* Devotee Reviews List */
            <div className="space-y-3">
              {reviews.map((r, i) => (
                <div key={i} className="p-4 rounded-2xl bg-white border border-[#ebdcb9] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-[#1b4b32]">{r.name}</h5>
                      <span className="text-[11px] text-[#786c5a]">{r.city} • {r.date}</span>
                    </div>
                    <div className="flex text-amber-500">
                      {[...Array(r.stars)].map((_, s) => (
                        <Star key={s} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-[#493e32] leading-relaxed italic">
                    &ldquo;{r.text}&rdquo;
                  </p>

                  <div className="text-[11px] font-semibold text-[#8b6f38] bg-[#fbf6ea] px-2.5 py-1 rounded-md inline-block">
                    {tr('सत्यापित सेवा:', 'Verified Service:')} {r.seva}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="p-4 bg-[#f8f1de] border-t border-[#ebdcb9] flex items-center justify-between shrink-0">
          <span className="text-xs text-[#5f503c] font-medium hidden sm:inline">
            {tr('देश-विदेश से 25,000+ संतुष्ट यजमान एवं परिवार।', 'Over 25,000+ happy families served across India & abroad.')}
          </span>
          <button
            onClick={() => {
              onClose();
              onBookSevaClick();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#1b4b32] hover:bg-[#153e29] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>{tr('अभी आहार सेवा बुक करें', 'Arrange Feed Service Now')}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
