import React from 'react';
import { Lock } from 'lucide-react';
import { ImageCrop } from './ImageCrop';
import { useLanguage } from '../i18n/LanguageContext';

interface FooterProps {
  onOpenAbout: () => void;
  onOpenServices: () => void;
  onOpenAstrology: () => void;
  onOpenJyotish?: () => void;
  onOpenReviews: () => void;
  onOpenContact: () => void;
  onOpenAdmin?: () => void;
  onOpenAstrologer?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAbout,
  onOpenServices,
  onOpenAstrology,
  onOpenJyotish,
  onOpenReviews,
  onOpenContact,
  onOpenAdmin,
  onOpenAstrologer,
}) => {
  const { tr } = useLanguage();

  return (
    <footer className="bg-[#123824] text-[#e8f1ec] py-6 sm:py-8 border-t border-[#1a4a30]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Left Brand Lockup */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full overflow-hidden border border-[#d4af37]/60 shadow-xs bg-[#fffaf0] shrink-0">
              <ImageCrop cropKey="logoIcon" className="w-full h-full scale-110" alt="GauKripa Emblem" />
            </div>

            <div className="flex flex-col">
              <span className="font-playfair text-2xl font-bold text-white tracking-tight leading-none">
                {tr('गौकृपा (GauKripa)', 'GauKripa')}
              </span>
              <span className="text-[10px] font-medium text-amber-200/90 tracking-wide mt-1">
                {tr(
                  'गौमाता आहार व्यवस्था • ज्योतिष मार्गदर्शन • आध्यात्मिक परामर्श',
                  'Gaumata Aahar Vyavastha • Jyotish Margdarshan • Adhyatmik Paramarsh'
                )}
              </span>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-xs sm:text-sm font-medium text-emerald-100/90">
            <button
              onClick={onOpenServices}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              {tr('गौ-आहार सेवाएँ', 'Gau-Aahar Sevaein')}
            </button>
            <span className="text-emerald-700/60" aria-hidden="true">|</span>

            {onOpenJyotish && (
              <>
                <button
                  onClick={onOpenJyotish}
                  className="hover:text-amber-300 text-amber-200 transition-colors cursor-pointer"
                >
                  {tr('ज्योतिष मार्गदर्शन (5 विषय)', 'Jyotish Salah (5 Vishay)')}
                </button>
                <span className="text-emerald-700/60" aria-hidden="true">|</span>
              </>
            )}

            <button
              onClick={onOpenAstrology}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              {tr('ज्योतिषाचार्य', 'Jyotishacharya')}
            </button>
            <span className="text-emerald-700/60" aria-hidden="true">|</span>

            <button
              onClick={onOpenReviews}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              {tr('समीक्षाएं एवं वीडियो पुष्टि', 'Samiksha & Video Proof')}
            </button>
            <span className="text-emerald-700/60" aria-hidden="true">|</span>

            <button
              onClick={onOpenAbout}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              {tr('परिचय', 'Hamare Baare Mein')}
            </button>
            <span className="text-emerald-700/60" aria-hidden="true">|</span>

            <button
              onClick={onOpenContact}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              {tr('संपर्क करें', 'Sampark Karein')}
            </button>

            {onOpenAdmin && (
              <>
                <span className="text-emerald-700/60" aria-hidden="true">|</span>
                <button
                  onClick={onOpenAdmin}
                  className="text-amber-300 hover:text-amber-200 font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>🛡️</span> {tr('एडमिन कंसोल', 'Admin Console')}
                </button>
              </>
            )}

            {onOpenAstrologer && (
              <>
                <span className="text-emerald-700/60" aria-hidden="true">|</span>
                <button
                  onClick={onOpenAstrologer}
                  className="text-emerald-200 hover:text-amber-200 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>🔮</span> {tr('ज्योतिष डेस्क', 'Jyotish Desk')}
                </button>
              </>
            )}
          </nav>

          {/* Right Socials & Security Badge */}
          <div className="flex items-center gap-4 sm:gap-6">
            
            {/* Social Media Circular Buttons */}
            <div className="flex items-center gap-2">
              <a
                href="#youtube"
                aria-label="YouTube"
                className="w-7 h-7 rounded-full bg-[#cc1a1a] flex items-center justify-center text-white hover:scale-110 transition-transform shadow-xs"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a
                href="#facebook"
                aria-label="Facebook"
                className="w-7 h-7 rounded-full bg-[#1877f2] flex items-center justify-center text-white hover:scale-110 transition-transform shadow-xs"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="#instagram"
                aria-label="Instagram"
                className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white hover:scale-110 transition-transform shadow-xs"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="#twitter"
                aria-label="Twitter"
                className="w-7 h-7 rounded-full bg-[#1d9bf0] flex items-center justify-center text-white hover:scale-110 transition-transform shadow-xs"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>

            {/* Secure Payments Badge */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-200/90 bg-[#0d2a1b] px-3 py-1.5 rounded-full border border-emerald-900/80">
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>{tr('सुरक्षित भुगतान', 'Surakshit Bhugtan')}</span>
            </div>

          </div>

        </div>

        {/* Bottom copyright notice */}
        <div className="mt-6 pt-4 border-t border-[#1a4a30]/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-emerald-200/60 gap-2">
          <p>
            © {new Date().getFullYear()} {tr(
              'GauKripa. गौमाता आहार व्यवस्था एवं वैदिक ज्योतिष मार्गदर्शन। सर्वाधिकार सुरक्षित।',
              'GauKripa. Gaumata Aahar Vyavastha aur Vedic Jyotish Margdarshan. Sabhi Adhikar Surakshit.'
            )}
          </p>
          <div className="flex items-center gap-4">
            <a href="#privacy" className="hover:underline">{tr('गोपनीयता नीति', 'Gopniyata Niti')}</a>
            <span>•</span>
            <a href="#terms" className="hover:underline">{tr('सेवा नियम व शर्तें', 'Seva Niyam & Shartein')}</a>
            <span>•</span>
            <a href="#transparency" className="hover:underline">{tr('आहार वितरण वीडियो पुष्टि', 'Aahar Vitaran Video Proof')}</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
