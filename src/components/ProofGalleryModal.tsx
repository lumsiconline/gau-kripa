import React, { useState } from 'react';
import { X, Play, ShieldCheck, Star, Video, Image, CheckCircle, ExternalLink, Calendar, MapPin } from 'lucide-react';
import { RECENT_PROOFS, SevaProof } from '../data/sevaData';
import { ImageCrop } from './ImageCrop';

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
  const [activeTab, setActiveTab] = useState<'proofs' | 'reviews'>('proofs');
  const [selectedProof, setSelectedProof] = useState<SevaProof>(RECENT_PROOFS[0]);
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);

  if (!isOpen) return null;

  const reviews = [
    {
      name: 'Pooja Agarwal',
      city: 'Delhi',
      stars: 5,
      date: '3 days ago',
      text: 'Within 2 hours of booking Gau Roti Seva for my mother’s health, I received a 45-second high definition video on WhatsApp showing our family name and gotra written clearly on the wooden board while the cows were being fed. Such pure transparency!',
      seva: 'Gau Roti Seva (51 Rotis)'
    },
    {
      name: 'Ramanathan K.',
      city: 'Chennai',
      stars: 5,
      date: '1 week ago',
      text: 'Consulted Acharya Rohan Mehta regarding business hurdles. He recommended Gau Chara Seva and feeding street dogs on Saturdays. The calmness and relief in our home is truly remarkable. Gau Mata ki Kripa!',
      seva: 'Gau Chara & Street Dogs Seva'
    },
    {
      name: 'Vikas & Shruti Mittal',
      city: 'Indore',
      stars: 5,
      date: '2 weeks ago',
      text: 'Our monthly sankalp runs smoothly with GauKripa. The Vrindavan goshala priest chants our family gotra during the arati. Best spiritual seva platform in India.',
      seva: 'Monthly Gau Seva Sankalp'
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
                100% Proof &amp; Devotee Reviews
              </h3>
              <p className="text-xs text-emerald-100/80">
                Every single seva is video-recorded with your name placard
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
            Live Seva Video Proofs ({RECENT_PROOFS.length})
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'reviews'
                ? 'bg-[#1b4b32] text-white shadow-xs'
                : 'bg-white text-[#554737] hover:bg-[#ede0c7]'
            }`}
          >
            Verified Devotee Reviews (★ 4.9)
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
                  alt="Live Gaushala Seva Video"
                />

                {/* Video Play Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-4">
                  <div className="flex items-center justify-between text-xs text-white">
                    <span className="bg-[#cc1a1a] text-white px-2 py-0.5 rounded font-bold uppercase text-[10px] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      Live Feed
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
                      {isPlayingVideo ? 'Playing Live Puja Blessing Video...' : 'Click to Play Devotee Name Sankalp Video'}
                    </p>
                  </div>

                  {/* Devotee Placard Tag at Bottom */}
                  <div className="bg-black/60 backdrop-blur-md rounded-xl p-2.5 text-xs text-white flex items-center justify-between border border-white/20">
                    <div>
                      <div className="font-bold text-amber-300">Name Board: {selectedProof.devoteeName}</div>
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
                  Recent Seva Completions
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {RECENT_PROOFS.map((p) => (
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
                    Verified Seva: {r.seva}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="p-4 bg-[#f8f1de] border-t border-[#ebdcb9] flex items-center justify-between shrink-0">
          <span className="text-xs text-[#5f503c] font-medium hidden sm:inline">
            Over 25,000+ happy devotees supported across India &amp; abroad.
          </span>
          <button
            onClick={() => {
              onClose();
              onBookSevaClick();
            }}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#1b4b32] hover:bg-[#153e29] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Book Your Seva Now</span>
          </button>
        </div>

      </div>
    </div>
  );
};
