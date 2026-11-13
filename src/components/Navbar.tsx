import React, { useState } from 'react';
import { User, ChevronDown, Menu, X, Heart, LogOut, Wallet, Languages } from 'lucide-react';
import { AuthUser } from './AuthModal';
import { ImageCrop } from './ImageCrop';
import { getLocalizedSevaItems, getLocalizedRemedyCategories } from '../data/sevaData';
import { useLanguage } from '../i18n/LanguageContext';

interface NavbarProps {
  onOpenAuth: () => void;
  activeUser: AuthUser | null;
  onLogout?: () => void;
  onSelectSeva: (sevaId: string) => void;
  onSelectRemedy: (remedyId: string) => void;
  onScrollToAstrologers: () => void;
  onScrollToJyotish?: () => void;
  onOpenAbout: () => void;
  onOpenReviews: () => void;
  onOpenCart?: () => void;
  cartCount?: number;
  onOpenAdminDashboard?: () => void;
  onOpenAstrologerDashboard?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  activeUser,
  onLogout,
  onSelectSeva,
  onSelectRemedy,
  onScrollToAstrologers,
  onScrollToJyotish,
  onOpenAbout,
  onOpenReviews,
  onOpenCart,
  cartCount = 0,
  onOpenAdminDashboard,
  onOpenAstrologerDashboard,
}) => {
  const { lang, setLang, tr } = useLanguage();
  const [sevaDropdownOpen, setSevaDropdownOpen] = useState(false);
  const [remedyDropdownOpen, setRemedyDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sevaItems = getLocalizedSevaItems(lang);
  const remedyCategories = getLocalizedRemedyCategories(lang);

  return (
    <header className="sticky top-0 z-50 bg-[#fffdf5] border-b border-[#ebdcb9] shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-2">
          
          {/* Brand Logo Lockup */}
          <div className="flex items-center shrink-0">
            <a
              href="#"
              className="flex items-center group cursor-pointer py-1"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <div className="h-12 sm:h-14 w-40 sm:w-52 overflow-hidden">
                <ImageCrop
                  cropKey="newNavLogo"
                  className="w-full h-full object-contain"
                  alt={tr('गौकृपा • गौमाता आहार व्यवस्था एवं वैदिक ज्योतिष', 'GauKripa • Gau Aahar Seva & Vedic Astrology')}
                  preserveAspectRatio="xMinYMid meet"
                />
              </div>
            </a>
          </div>

          {/* Center Navigation Links (Responsive) */}
          <nav className="hidden xl:flex items-center gap-1 text-[13px] font-semibold text-[#253328]">
            {/* Home Pill */}
            <a
              href="#"
              className="px-3.5 py-1.5 rounded-full bg-[#1b4b32] text-white font-medium shadow-xs hover:bg-[#153e29] transition-all whitespace-nowrap"
            >
              {tr('मुख्य पृष्ठ', 'Home')}
            </a>

            {/* Gau Seva Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setSevaDropdownOpen(true)}
              onMouseLeave={() => setSevaDropdownOpen(false)}
            >
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg hover:text-[#1b4b32] hover:bg-[#f6efe0] transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer font-medium"
                onClick={() => setSevaDropdownOpen(!sevaDropdownOpen)}
              >
                <span>{tr('गौ-आहार सेवा', 'Gau Aahar Seva')}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${sevaDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {sevaDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-[#fffdf9] rounded-xl shadow-xl border border-[#ebdcb9] py-2 z-50">
                  <div className="px-3.5 py-1.5 border-b border-[#f0e3c5] text-[11px] font-semibold text-[#8b7355] uppercase tracking-wider">
                    {tr('गौमाता एवं प्राणी आहार व्यवस्था (प्रत्यक्ष सेवा)', 'Gaumata & Animal Feed Management (Direct Service)')}
                  </div>
                  {sevaItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSevaDropdownOpen(false);
                        onSelectSeva(item.id);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-[#f6efe0] flex items-center justify-between text-xs transition-colors cursor-pointer border-b border-[#f9f3e5] last:border-b-0"
                    >
                      <div>
                        <div className="font-semibold text-[#1b4b32]">{item.title}</div>
                        <div className="text-[11px] text-[#786c5a]">{item.planetTag}</div>
                      </div>
                      <span className="font-bold text-[#c4821a] text-[11px] whitespace-nowrap ml-2">{item.priceDisplay}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Jyotish Services Nav Link */}
            {onScrollToJyotish && (
              <button
                onClick={onScrollToJyotish}
                className="px-3 py-1.5 rounded-lg hover:text-[#1b4b32] hover:bg-[#f6efe0] transition-colors whitespace-nowrap cursor-pointer font-medium flex items-center gap-1"
              >
                <span>{tr('ज्योतिष मार्गदर्शन', 'Jyotish Guidance')}</span>
                <span className="text-[10px] bg-[#fbf2dd] text-[#8a6828] border border-[#ebdcb9] px-1.5 py-0.2 rounded font-bold">
                  {tr('5 विषय', '5 Topics')}
                </span>
              </button>
            )}

            {/* Grah Shanti Upay Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setRemedyDropdownOpen(true)}
              onMouseLeave={() => setRemedyDropdownOpen(false)}
            >
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg hover:text-[#1b4b32] hover:bg-[#f6efe0] transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer font-medium"
                onClick={() => setRemedyDropdownOpen(!remedyDropdownOpen)}
              >
                <span>{tr('ग्रह शांति उपाय', 'Grah Remedies')}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${remedyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {remedyDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-[#fffdf9] rounded-xl shadow-xl border border-[#ebdcb9] py-2 z-50">
                  <div className="px-3 py-1.5 border-b border-[#f0e3c5] text-[11px] font-semibold text-[#8b7355] uppercase tracking-wider">
                    {tr('वैदिक ग्रह-दोष निवारण', 'Vedic Planetary Remedies')}
                  </div>
                  {remedyCategories.map((rem) => (
                    <button
                      key={rem.id}
                      onClick={() => {
                        setRemedyDropdownOpen(false);
                        onSelectRemedy(rem.id);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#f6efe0] text-xs transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-medium text-[#2d3a31]">{rem.title}</span>
                      <span className="text-[10px] text-[#8b7355] bg-[#eedec0] px-1.5 py-0.5 rounded">{tr('वैदिक', 'Vedic')}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Connect with Astrologer */}
            <button
              onClick={onScrollToAstrologers}
              className="px-3 py-1.5 rounded-lg hover:text-[#1b4b32] hover:bg-[#f6efe0] transition-colors whitespace-nowrap cursor-pointer font-medium"
            >
              {tr('ज्योतिषाचार्य', 'Astrologers')}
            </button>

            {/* Reviews */}
            <button
              onClick={onOpenReviews}
              className="px-3 py-1.5 rounded-lg hover:text-[#1b4b32] hover:bg-[#f6efe0] transition-colors whitespace-nowrap cursor-pointer font-medium"
            >
              {tr('समीक्षाएं एवं पुष्टि', 'Reviews & Proof')}
            </button>

            {/* About Us */}
            <button
              onClick={onOpenAbout}
              className="px-3 py-1.5 rounded-lg hover:text-[#1b4b32] hover:bg-[#f6efe0] transition-colors whitespace-nowrap cursor-pointer font-medium"
            >
              {tr('परिचय', 'About Us')}
            </button>
          </nav>

          {/* Action Area: Language Switch, Cart, Portals, Wallet, Sign In */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Hindi / English Language Switch Button */}
            <div
              role="group"
              aria-label={tr('भाषा बदलें', 'Switch Language')}
              className="inline-flex items-center rounded-full bg-[#f5ecda] border border-[#dfc99b] p-0.5 shadow-2xs shrink-0"
            >
              <Languages className="w-3.5 h-3.5 text-[#7a5518] ml-1.5 mr-1 hidden sm:block shrink-0" />
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`px-2 sm:px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  lang === 'hi'
                    ? 'bg-[#1b4b32] text-amber-200 shadow-xs'
                    : 'text-[#5b4831] hover:text-[#1b4b32]'
                }`}
                title="हिन्दी में देखें"
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 sm:px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  lang === 'en'
                    ? 'bg-[#1b4b32] text-amber-200 shadow-xs'
                    : 'text-[#5b4831] hover:text-[#1b4b32]'
                }`}
                title="Switch to English"
              >
                EN
              </button>
            </div>

            {cartCount > 0 && onOpenCart && (
              <button
                onClick={onOpenCart}
                className="relative p-2 rounded-full bg-[#f1e6cb] hover:bg-[#ebdcb9] text-[#1b4b32] transition-colors cursor-pointer shrink-0"
                title={tr('सेवा संकल्प कार्ट देखें', 'View Seva Sankalp Cart')}
              >
                <Heart className="w-5 h-5 fill-[#1b4b32]" />
                <span className="absolute -top-1 -right-1 bg-[#d94828] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </button>
            )}

            {/* Portal buttons for Astrologer and Admin (Only passed when Super Admin) */}
            {onOpenAstrologerDashboard && (
              <button
                onClick={onOpenAstrologerDashboard}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#fdf5e2] hover:bg-[#faedd0] text-[#8b5a0a] border border-[#e5ca8a] text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs shrink-0"
                title={tr('ज्योतिष लाइव चैट डैशबोर्ड खोलें', 'Open Astrologer Live Chat Dashboard')}
              >
                <span>🔮</span>
                <span className="hidden md:inline">{tr('ज्योतिष डेस्क', 'Astro Desk')}</span>
              </button>
            )}

            {onOpenAdminDashboard && (
              <button
                onClick={onOpenAdminDashboard}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#1b4b32] hover:bg-[#153e29] text-amber-200 border border-amber-300/40 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs hover:scale-102 shrink-0"
                title={tr('एडमिन डैशबोर्ड खोलें', 'Open Admin Dashboard')}
              >
                <span>🛡️</span>
                <span className="hidden md:inline">{tr('एडमिन डेस्क', 'Admin Desk')}</span>
              </button>
            )}

            {/* Customer Wallet button */}
            <button
              onClick={onOpenAuth}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#fdf5e2] hover:bg-[#f6ebd1] text-[#8b5a0a] border border-[#e5ca8a] text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs shrink-0"
              title={tr('गौकृपा वॉलेट खोलें', 'Open GauKripa Wallet')}
            >
              <Wallet className="w-3.5 h-3.5 text-amber-700" />
              <span>{tr('वॉलेट', 'Wallet')}</span>
            </button>

            {/* Customer sign-in / profile */}
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-full bg-[#f1e6cb] hover:bg-[#ebdcb9] text-[#1b4b32] border border-[#ebdcb9] text-xs font-bold transition-colors cursor-pointer shrink-0"
              title={activeUser ? tr('मेरी प्रोफ़ाइल व वॉलेट खोलें', 'Open my profile & wallet') : tr('साइन इन या नया खाता बनाएँ', 'Sign in or create an account')}
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">
                {activeUser ? activeUser.name.split(' ')[0] : tr('प्रवेश करें', 'Sign In')}
              </span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-[#1b4b32] hover:bg-[#f3ebd3] rounded-lg cursor-pointer shrink-0"
              aria-label={tr('मेनू खोलें', 'Toggle navigation')}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#fffdf8] border-b border-[#ebdcb9] px-4 pt-3 pb-6 space-y-3">
          
          <div className="grid grid-cols-3 gap-2 pb-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="py-2 px-2 text-center rounded-lg bg-[#1b4b32] text-white text-xs font-semibold"
            >
              {tr('मुख्य पृष्ठ', 'Home')}
            </button>
            {onScrollToJyotish && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onScrollToJyotish();
                }}
                className="py-2 px-2 text-center rounded-lg bg-[#fbf2dd] border border-[#ebdcb9] text-[#8a6828] text-xs font-bold"
              >
                {tr('ज्योतिष सेवाएँ', 'Jyotish Services')}
              </button>
            )}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onScrollToAstrologers();
              }}
              className="py-2 px-2 text-center rounded-lg bg-[#f3ebd3] text-[#1b4b32] text-xs font-semibold"
            >
              {tr('ज्योतिषाचार्य', 'Astrologers')}
            </button>
          </div>

          <div className="flex gap-2 pb-2 border-b border-[#ebdcb9]">
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenAuth(); }}
              className="flex-1 py-2 px-3 rounded-lg bg-[#1b4b32] text-white text-xs font-semibold flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" /> {activeUser ? activeUser.name.split(' ')[0] : tr('लॉगिन / पंजीकरण', 'Sign In / Sign Up')}
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenAuth(); }}
              className="py-2 px-3 rounded-lg bg-[#e5a024] hover:bg-[#d4901a] text-slate-950 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>{tr('वॉलेट', 'Wallet')}</span>
            </button>
            {activeUser && onLogout && (
              <button
                onClick={() => { setMobileMenuOpen(false); onLogout(); }}
                className="py-2 px-3 rounded-lg bg-[#f3ebd3] text-[#1b4b32] text-xs font-semibold"
                title={tr('लॉगआउट', 'Logout')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="space-y-1">
            <div className="text-[11px] font-bold text-[#8b7355] uppercase tracking-wider px-2 py-1">
              {tr('गौमाता एवं प्राणी आहार व्यवस्था (प्रत्यक्ष सेवा)', 'Gaumata & Animal Feed Services')}
            </div>
            {sevaItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSelectSeva(item.id);
                }}
                className="w-full text-left px-3 py-2 text-xs text-[#2d3a31] hover:bg-[#f6efe0] rounded-md flex justify-between items-center"
              >
                <span className="font-medium">{item.title}</span>
                <span className="text-xs font-bold text-[#c4821a]">{item.priceDisplay}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-[#f0e3c5] flex justify-around text-xs">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAbout();
              }}
              className="font-medium text-[#1b4b32] underline"
            >
              {tr('गौकृपा परिचय', 'About GauKripa')}
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenReviews();
              }}
              className="font-medium text-[#1b4b32] underline"
            >
              {tr('समीक्षाएं एवं वीडियो पुष्टि', 'Reviews & Video Proof')}
            </button>
          </div>

          {/* Quick Access to Portals in Mobile (Super Admin Only) */}
          {(onOpenAstrologerDashboard || onOpenAdminDashboard) && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#ebdcb9]">
              {onOpenAstrologerDashboard && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAstrologerDashboard();
                  }}
                  className="py-2 px-3 text-center rounded-xl bg-[#fdf5e2] text-[#8b5a0a] border border-[#e5ca8a] text-xs font-bold cursor-pointer"
                >
                  🔮 {tr('ज्योतिष डेस्क', 'Astrologer Desk')}
                </button>
              )}
              {onOpenAdminDashboard && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAdminDashboard();
                  }}
                  className="py-2 px-3 text-center rounded-xl bg-[#1b4b32] text-amber-200 text-xs font-bold cursor-pointer"
                >
                  🛡️ {tr('एडमिन कंसोल', 'Admin Console')}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
