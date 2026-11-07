import React from 'react';
import { X, ShieldCheck, Heart, Award, CheckCircle2 } from 'lucide-react';
import { ImageCrop } from './ImageCrop';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExploreSevas: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, onExploreSevas }) => {
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
                About GauKripa Seva Foundation
              </h3>
              <p className="text-xs text-emerald-100/80">
                Seva • Shanti • Samriddhi
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
          <div className="h-44 rounded-2xl overflow-hidden border border-[#ebdcb9] shadow-xs">
            <ImageCrop cropKey="heroCows" className="w-full h-full object-cover" alt="GauKripa Cow Sanctuary" />
          </div>

          <p>
            <strong className="text-[#1b4b32] font-semibold">GauKripa</strong> is a sacred initiative dedicated to reviving the ancient Sanatana tradition of daily <em>Go-Seva</em> (cow veneration) and compassionate sustenance for all living beings (Jeev-Jantu).
          </p>

          <p>
            In today&apos;s fast-paced urban life, millions of devotees yearn to feed Gaumata, wild birds, and street animals to seek planetary peace and spiritual grace, but lack direct access to genuine Vedic goshalas. GauKripa bridges this sacred gap with <strong>100% transparency</strong>.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-[#faf2e1] border border-[#ebdcb9] flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#1b4b32] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-bold text-[#1b4b32]">Authentic Video Proof</strong>
                <span className="text-[11px] text-[#6c5d4b]">Devotee name &amp; gotra displayed on wooden placard during seva.</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#faf2e1] border border-[#ebdcb9] flex items-start gap-2.5">
              <Award className="w-5 h-5 text-[#1b4b32] shrink-0 mt-0.5" />
              <div>
                <strong className="block text-xs font-bold text-[#1b4b32]">Certified Priests</strong>
                <span className="text-[11px] text-[#6c5d4b]">Vedic Brahmins perform auspicious sankalp rituals daily.</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-[#224b33]">
            <strong>Tax Exemption:</strong> All donations are eligible for tax deduction under Section 80G of the Income Tax Act. Official 80G receipt issued immediately.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f8f1de] border-t border-[#ebdcb9] flex items-center justify-between shrink-0">
          <span className="text-xs text-[#6e5d48]">Partner Goshalas in Vrindavan, Mathura, Haridwar &amp; Kashi.</span>
          <button
            onClick={() => {
              onClose();
              onExploreSevas();
            }}
            className="px-5 py-2 rounded-full bg-[#1b4b32] hover:bg-[#153e29] text-white font-bold text-xs"
          >
            Explore Seva Offerings
          </button>
        </div>

      </div>
    </div>
  );
};
