import React, { useState } from 'react';
import { X, Phone, Mail, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const { tr } = useLanguage();
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', query: '' });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#fffdfa] rounded-3xl shadow-2xl border-2 border-[#ebdcb9] overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-[#1b4b32] text-white p-5 flex items-center justify-between border-b border-[#296344]">
          <div className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-amber-300" />
            <h3 className="font-playfair text-lg font-bold text-amber-200">
              {tr('गौकृपा सहायता एवं संपर्क केंद्र', 'GauKripa Sahayata aur Sampark Kendra')}
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
        {!sent ? (
          <div className="p-5 sm:p-6 space-y-4">
            
            {/* Contact details cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#faf2e1] border border-[#ebdcb9] space-y-1">
                <span className="font-bold text-[#1b4b32] block flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#c4821a]" /> {tr('24x7 सेवा हेल्पलाइन', '24x7 Seva Helpline')}
                </span>
                <p className="text-[#554737]">+91 1800-GAU-KRIPA</p>
                <p className="text-[11px] text-[#786c5c]">+91 98765-43210 (WhatsApp)</p>
              </div>

              <div className="p-3 rounded-xl bg-[#faf2e1] border border-[#ebdcb9] space-y-1">
                <span className="font-bold text-[#1b4b32] block flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#c4821a]" /> {tr('ईमेल सहायता', 'Email Sahayata')}
                </span>
                <p className="text-[#554737]">seva@gaukripa.org</p>
                <p className="text-[11px] text-[#786c5c]">help@gaukripa.org</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#f4faee] border border-[#d6e7ce] text-xs text-[#2b5936] flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#1b4b32] shrink-0 mt-0.5" />
              <div>
                <strong>{tr('सेवा नेटवर्क एवं सहायता केंद्र:', 'Seva Network aur Sahayata Kendra:')}</strong>{' '}
                {tr(
                  'देशभर की प्रमाणित एवं सहयोगी गौशालाओं के माध्यम से प्रत्यक्ष गौ-आहार सेवा व्यवस्था।',
                  'Desh bhar ki pramanit aur sahyogi goshalayon ke madhyam se pratyaksh Gau-Aahar seva vyavastha.'
                )}
              </div>
            </div>

            {/* Quick Message Form */}
            <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-[#ebdcb9]">
              <div className="text-xs font-bold text-[#5c4e3b] uppercase tracking-wider">
                {tr('पूछताछ या सहायता अनुरोध भेजें', 'Puchhtachh ya Sahayata Anurodh Bhejein')}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder={tr('आपका नाम', 'Aapka Naam')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs focus:outline-hidden focus:border-[#1b4b32]"
                />
                <input
                  type="tel"
                  required
                  placeholder={tr('मोबाइल नंबर', 'Mobile Number')}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs focus:outline-hidden focus:border-[#1b4b32]"
                />
              </div>

              <textarea
                required
                rows={3}
                placeholder={tr(
                  'गौ-आहार सेवा या वैदिक ज्योतिष परामर्श से जुड़ा अपना प्रश्न यहाँ लिखें...',
                  'Gau-Aahar seva ya Vedic Jyotish paramarsh se juda apna prashna yahan likhein...'
                )}
                value={formData.query}
                onChange={(e) => setFormData({ ...formData, query: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs focus:outline-hidden focus:border-[#1b4b32]"
              />

              <button
                type="submit"
                className="w-full py-2.5 rounded-full bg-[#1b4b32] hover:bg-[#153e29] text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{tr('संदेश भेजें', 'Sandesh Bhejein')}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>

          </div>
        ) : (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="font-playfair text-xl font-bold text-[#1b4b32]">
                {tr('संदेश प्राप्त हुआ!', 'Sandesh Prapt Hua!')}
              </h4>
              <p className="text-xs text-[#5d4e3b]">
                {tr(
                  `धन्यवाद ${formData.name || 'भक्त'} जी। हमारा गौकृपा सेवा सहायता केंद्र शीघ्र ही आपसे ${formData.phone || 'आपके नंबर'} पर संपर्क करेगा।`,
                  `Dhanyavaad ${formData.name || 'Bhakt'} ji. Hamara GauKripa seva sahayata kendra jald hi aapse ${formData.phone || 'aapke number'} par sampark karega.`
                )}
              </p>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2 rounded-full bg-[#1b4b32] text-white text-xs font-semibold cursor-pointer"
            >
              {tr('पूर्ण हुआ', 'Theek Hai')}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
