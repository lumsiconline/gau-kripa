import React, { useState } from 'react';
import { X, Heart, CheckCircle2, Phone, Sparkles, Send } from 'lucide-react';
import { ImageCrop } from './ImageCrop';

interface SevaParivarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SevaParivarModal: React.FC<SevaParivarModalProps> = ({ isOpen, onClose }) => {
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
              Join Our Seva Parivar
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
                <ImageCrop cropKey="bottomCow" className="w-full h-full object-cover scale-110" alt="Holy Cow" />
              </div>
              <h4 className="font-playfair text-base font-bold text-[#1b4b32] pt-1">
                Be a Lifelong Friend of Gaumata
              </h4>
              <p className="text-xs text-[#6e5d48]">
                Receive daily morning Vrindavan Goshala Darshan, Ekadashi alerts &amp; auspicious Vedic blessings right on your WhatsApp.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-[#483d2e] mb-1">
                  Full Name
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
                  WhatsApp Number
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
                  Your City / State
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
              <span>Join Free WhatsApp Seva Parivar</span>
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
                Swagatam to Seva Parivar!
              </h4>
              <p className="text-xs text-[#5d4e3b]">
                Pranam {name}! You have been added to the GauKripa WhatsApp community. Daily morning darshan will be shared with +91 {phone}.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-[#5e4b2d]">
              🙏 &ldquo;Gaavo Me Hridaya Santu, Gavah Santu Chirodhaye&rdquo; — May the sacred cows dwell in our hearts forever.
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2 rounded-full bg-[#1b4b32] text-white text-xs font-semibold"
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
