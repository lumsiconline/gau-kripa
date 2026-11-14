import React, { useState } from 'react';
import {
  User,
  Bell,
  ChevronDown,
  Menu,
  X,
  Wallet,
  HeartHandshake,
  History,
  CreditCard,
  FileText,
  Users,
  Sparkles,
  HelpCircle,
  LogOut,
  ArrowRight,
  Home,
  Info,
} from 'lucide-react';
import { AuthUser } from './AuthModal';
import { ProfileTab } from './ProfileDashboard';
import { getLocalizedSevaItems, getLocalizedRemedyCategories } from '../data/sevaData';
import { useLanguage } from '../i18n/LanguageContext';

interface NavbarProps {
  onOpenAuth: () => void;
  onOpenProfileTab?: (tab: ProfileTab) => void;
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
  onOpenProfileTab,
  activeUser,
  onLogout,
  onSelectSeva,
  onSelectRemedy,
  onScrollToAstrologers,
  onOpenAbout,
  onOpenReviews,
}) => {
  const { lang, setLang, tr } = useLanguage();
  const [sevaDropdownOpen, setSevaDropdownOpen] = useState(false);
  const [remedyDropdownOpen, setRemedyDropdownOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sevaItems = getLocalizedSevaItems(lang);
  const remedyCategories = getLocalizedRemedyCategories(lang);

  const getUserInitials = (name?: string) => {
    const parts = (name || 'GK').trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return (parts[0]?.slice(0, 2) || 'GK').toUpperCase();
  };

  const openProfileSection = (tab: ProfileTab) => {
    setDrawerOpen(false);
    if (onOpenProfileTab) {
      onOpenProfileTab(tab);
    } else {
      onOpenAuth();
    }
  };

  const profileMenuItems: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: tr('प्रोफ़ाइल अवलोकन', 'Profile Overview'), icon: <User className="w-4 h-4" /> },
    { id: 'wallet', label: tr('मेरा वॉलेट', 'Mera Wallet'), icon: <Wallet className="w-4 h-4" /> },
    { id: 'seva', label: tr('मेरी सेवा', 'Meri Seva'), icon: <HeartHandshake className="w-4 h-4" /> },
    { id: 'history', label: tr('सेवा इतिहास', 'Seva History'), icon: <History className="w-4 h-4" /> },
    { id: 'payments', label: tr('भुगतान इतिहास', 'Payment History'), icon: <CreditCard className="w-4 h-4" /> },
    { id: 'details', label: tr('मेरा विवरण', 'My Details'), icon: <FileText className="w-4 h-4" /> },
    { id: 'family', label: tr('मेरा परिवार', 'My Family'), icon: <Users className="w-4 h-4" /> },
    { id: 'jyotish', label: tr('मेरा ज्योतिष', 'My Jyotish'), icon: <Sparkles className="w-4 h-4" /> },
    { id: 'notifications', label: tr('सूचनाएँ', 'Notifications'), icon: <Bell className="w-4 h-4" /> },
    { id: 'support', label: tr('सहायता केंद्र', 'Help & Support'), icon: <HelpCircle className="w-4 h-4" /> },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#fbf6ee]/95 backdrop-blur-md border-b border-[#eadbc4]">
        <div className="max-w-5xl mx-auto px-3.5 sm:px-6">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            {/* Left: Golden Gau Emblem + GauKripa Wordmark */}
            <a
              href="#"
              className="flex items-center gap-2 shrink-0 group cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <svg
                className="w-9 h-8 sm:w-10 sm:h-9 text-[#d86416] shrink-0"
                viewBox="0 0 64 52"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M22 10c3-4 6-6 10-6s7 2 10 6" strokeOpacity="0.55" />
                <path d="M16 14c1-4 4-6 7-7" strokeOpacity="0.4" />
                <path d="M48 14c-1-4-4-6-7-7" strokeOpacity="0.4" />
                <path d="M22 17c-4-5-3-10 1-12" />
                <path d="M42 17c4-5 3-10-1-12" />
                <path d="M20 20c-7-1-12 2-13 6 4 2 9 2 12 0" />
                <path d="M44 20c7-1 12 2 13 6-4 2-9 2-12 0" />
                <path d="M21 18c-2 8-2 15 2 22 2 4 5 6 9 6s7-2 9-6c4-7 4-14 2-22-4-3-18-3-22 0z" />
                <path d="M32 18v5" stroke="#b54c0d" strokeWidth="2.2" />
                <circle cx="26.5" cy="26" r="1.3" fill="currentColor" stroke="none" />
                <circle cx="37.5" cy="26" r="1.3" fill="currentColor" stroke="none" />
                <path d="M26 37c2 1.5 10 1.5 12 0" />
                <circle cx="29" cy="40" r="1" fill="currentColor" stroke="none" />
                <circle cx="35" cy="40" r="1" fill="currentColor" stroke="none" />
              </svg>

              <span className="font-playfair text-xl sm:text-2xl font-bold text-[#2b1507] tracking-tight leading-none">
                GauKripa
              </span>
            </a>

            {/* Center Desktop Navigation Links — Clean Unified Style */}
            <nav className="hidden lg:flex items-center gap-1 text-[13px] font-semibold text-[#5a3b24]">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-3 py-1.5 rounded-lg text-[#b54c0d] hover:bg-[#f4e8d6] transition-colors font-semibold whitespace-nowrap"
              >
                {tr('मुख्य पृष्ठ', 'Home')}
              </a>

              {/* Hamari Seva Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setSevaDropdownOpen(true)}
                onMouseLeave={() => setSevaDropdownOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setSevaDropdownOpen(!sevaDropdownOpen)}
                  className="px-3 py-1.5 rounded-lg hover:text-[#b54c0d] hover:bg-[#f4e8d6] transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
                >
                  <span>{tr('हमारी सेवा', 'Hamari Seva')}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${sevaDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {sevaDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-76 bg-[#fffdf9] rounded-2xl shadow-xl border border-[#eadbc4] py-2 z-50">
                    <div className="px-3.5 py-1.5 border-b border-[#f3e6d0] text-[10px] font-bold text-[#8a613b] uppercase tracking-wider">
                      {tr('प्रत्यक्ष गौ-आहार सेवा', 'Pratyaksh Gau-Aahar Seva')}
                    </div>
                    {sevaItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSevaDropdownOpen(false);
                          onSelectSeva(item.id);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-[#faf0df] flex items-center justify-between text-xs transition-colors cursor-pointer border-b border-[#f8efe0] last:border-b-0"
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-[#2b1507] truncate">{item.title}</div>
                          <div className="text-[10px] text-[#7c5d41] truncate">{item.planetTag}</div>
                        </div>
                        <span className="font-bold text-[#d86416] text-[11px] whitespace-nowrap">{item.priceDisplay}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Vedic Jyotish Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setRemedyDropdownOpen(true)}
                onMouseLeave={() => setRemedyDropdownOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setRemedyDropdownOpen(!remedyDropdownOpen)}
                  className="px-3 py-1.5 rounded-lg hover:text-[#b54c0d] hover:bg-[#f4e8d6] transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer"
                >
                  <span>{tr('वैदिक ज्योतिष', 'Vedic Jyotish')}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${remedyDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {remedyDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-72 bg-[#fffdf9] rounded-2xl shadow-xl border border-[#eadbc4] py-2 z-50">
                    <div className="px-3.5 py-1.5 border-b border-[#f3e6d0] text-[10px] font-bold text-[#8a613b] uppercase tracking-wider">
                      {tr('वैदिक ग्रह-दोष निवारण', 'Vedic Grah-Dosh Nivaran')}
                    </div>
                    {remedyCategories.map((rem) => (
                      <button
                        key={rem.id}
                        type="button"
                        onClick={() => {
                          setRemedyDropdownOpen(false);
                          onSelectRemedy(rem.id);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-[#faf0df] text-xs transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span className="font-medium text-[#2b1507]">{rem.title}</span>
                        <span className="text-[10px] text-[#8a4d19] bg-[#f7e7ca] px-1.5 py-0.5 rounded font-semibold">
                          {tr('उपाय', 'Upay')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onScrollToAstrologers}
                className="px-3 py-1.5 rounded-lg hover:text-[#b54c0d] hover:bg-[#f4e8d6] transition-colors whitespace-nowrap cursor-pointer"
              >
                {tr('ज्योतिषाचार्य', 'Jyotishacharya')}
              </button>

              <button
                type="button"
                onClick={onOpenAbout}
                className="px-3 py-1.5 rounded-lg hover:text-[#b54c0d] hover:bg-[#f4e8d6] transition-colors whitespace-nowrap cursor-pointer"
              >
                {tr('परिचय', 'About')}
              </button>
            </nav>

            {/* Right Controls: Clean [ EN | हिं ] + Notification Bell + Profile Circle + Three-Line Menu */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Language Switch */}
              <div
                role="group"
                aria-label={tr('भाषा बदलें', 'Bhasha Badlein')}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#fffdf9] border border-[#dfd0b8] pl-1 pr-2.5 py-1 shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
                  aria-label={tr('अंग्रेजी/हिन्दी बदलें', 'EN / Hindi Switch')}
                  className="relative w-7 h-4.5 sm:w-8 sm:h-5 rounded-full bg-[#e4ddd3] border border-[#d4cabd] transition-colors cursor-pointer shrink-0 flex items-center px-0.5"
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full shadow-xs transition-transform duration-200 ${
                      lang === 'hi' ? 'translate-x-2.5 sm:translate-x-3 bg-[#d86416]' : 'translate-x-0 bg-white'
                    }`}
                  />
                </button>
                <div className="flex items-center gap-1 text-[11px] sm:text-xs font-bold select-none">
                  <button
                    type="button"
                    onClick={() => setLang('en')}
                    className={`cursor-pointer transition-colors ${
                      lang === 'en' ? 'text-[#2b1507] font-extrabold' : 'text-[#8c7660] hover:text-[#2b1507]'
                    }`}
                  >
                    EN
                  </button>
                  <span className="text-[#cbb9a1]">|</span>
                  <button
                    type="button"
                    onClick={() => setLang('hi')}
                    className={`cursor-pointer transition-colors ${
                      lang === 'hi' ? 'text-[#d86416] font-extrabold' : 'text-[#8c7660] hover:text-[#2b1507]'
                    }`}
                  >
                    हिं
                  </button>
                </div>
              </div>

              {/* Notification Bell */}
              <button
                type="button"
                onClick={onOpenReviews}
                aria-label={tr('सूचनाएँ और वीडियो प्रमाण', 'Notifications & Video Proof')}
                title={tr('सूचनाएँ और वीडियो प्रमाण', 'Notifications & Video Proof')}
                className="relative p-1.5 rounded-full text-[#2b1507] hover:bg-[#f2e5d2] transition-colors cursor-pointer shrink-0"
              >
                <Bell className="w-5 h-5 stroke-[1.8]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#d86416] ring-2 ring-[#fbf6ee]" />
              </button>

              {/* Clean Profile Avatar Button */}
              <button
                type="button"
                onClick={() => openProfileSection('overview')}
                aria-label={activeUser ? tr('मेरी प्रोफ़ाइल खोलें', 'Open Profile Dashboard') : tr('साइन इन करें', 'Sign In Karein')}
                title={activeUser ? `${activeUser.name} • ${tr('प्रोफ़ाइल डैशबोर्ड', 'Profile Dashboard')}` : tr('साइन इन / प्रोफ़ाइल', 'Sign In / Profile')}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 overflow-hidden ${
                  activeUser
                    ? 'bg-[#d86416] hover:bg-[#b54c0d] text-white font-bold text-xs shadow-xs'
                    : 'bg-[#fffdf9] border border-[#dfd0b8] hover:bg-[#f5ead8] text-[#2b1507]'
                }`}
              >
                {activeUser ? (
                  <span>{getUserInitials(activeUser.name)}</span>
                ) : (
                  <User className="w-4 h-4 stroke-[2]" />
                )}
              </button>

              {/* Three-Line Menu Button (Both Desktop & Mobile) */}
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label={tr('मेनू खोलें', 'Open Menu')}
                title={tr('प्रोफ़ाइल एवं मेनू', 'Profile & Menu')}
                className="p-2 rounded-xl text-[#2b1507] hover:bg-[#f2e5d2] transition-colors cursor-pointer shrink-0"
              >
                <Menu className="w-5 h-5 stroke-[2]" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Three-Line Slide-Over Drawer (Desktop & Mobile) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-[#2b1507]/35 backdrop-blur-[1px]"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="relative z-10 w-80 max-w-[88vw] bg-white h-full border-l border-[#eadbc4] shadow-2xl flex flex-col">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-[#f1e5d3] flex items-center justify-between bg-[#fbf6ee]">
              <div className="flex items-center gap-2">
                <svg
                  className="w-7 h-6 text-[#d86416] shrink-0"
                  viewBox="0 0 64 52"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M22 17c-4-5-3-10 1-12" />
                  <path d="M42 17c4-5 3-10-1-12" />
                  <path d="M21 18c-2 8-2 15 2 22 2 4 5 6 9 6s7-2 9-6c4-7 4-14 2-22-4-3-18-3-22 0z" />
                  <path d="M32 18v5" stroke="#b54c0d" strokeWidth="2.4" />
                  <circle cx="26.5" cy="26" r="1.4" fill="currentColor" stroke="none" />
                  <circle cx="37.5" cy="26" r="1.4" fill="currentColor" stroke="none" />
                </svg>
                <span className="font-playfair font-bold text-lg text-[#2b1507]">GauKripa</span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg text-[#5a3b24] hover:bg-[#efe2ce] cursor-pointer"
                aria-label={tr('मेनू बंद करें', 'Close Menu')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Profile Card inside 3-Line Menu */}
            <div className="p-4 border-b border-[#f1e5d3]">
              {activeUser ? (
                <button
                  type="button"
                  onClick={() => openProfileSection('overview')}
                  className="w-full p-3.5 rounded-2xl bg-[#fbf6ee] border border-[#eadbc4] hover:border-[#d86416] transition-colors flex items-center gap-3 text-left cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-full bg-[#d86416] text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {getUserInitials(activeUser.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-[#2b1507] truncate">{activeUser.name}</p>
                    <p className="text-[11px] text-[#7c5d41] truncate">
                      {activeUser.phone ? `+91 ${activeUser.phone.replace(/\D/g, '').slice(-10)}` : activeUser.email}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#d86416] shrink-0" />
                </button>
              ) : (
                <div className="p-3.5 rounded-2xl bg-[#fbf6ee] border border-[#eadbc4] space-y-2.5">
                  <p className="text-xs font-semibold text-[#5a3b24]">
                    {tr(
                      'अपना वॉलेट, सेवा बुकिंग और प्रोफ़ाइल देखने के लिए लॉगिन करें।',
                      'Apna Wallet, Seva Booking aur Profile dekhne ke liye Sign In karein.'
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#d86416] hover:bg-[#b54c0d] text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    {tr('साइन इन / नया खाता बनाएँ', 'Sign In / Create Account')}
                  </button>
                </div>
              )}
            </div>

            {/* Scrollable Drawer Menu Sections */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {/* Profile Sections (matching the Profile Dashboard sidebar) */}
              <div>
                <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8c7660]">
                  {tr('मेरी प्रोफ़ाइल व सेवाएँ', 'Profile Dashboard')}
                </p>
                <div className="space-y-0.5">
                  {profileMenuItems.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openProfileSection(item.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#2b1507] hover:bg-[#fdf5ea] hover:text-[#d86416] transition-colors cursor-pointer text-left"
                    >
                      <span className="text-[#7c5d41]">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Website Navigation Links */}
              <div className="pt-2 border-t border-[#f1e5d3]">
                <p className="px-3 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8c7660]">
                  {tr('वेबसाइट नेविगेशन', 'Website Navigation')}
                </p>
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#2b1507] hover:bg-[#fdf5ea] transition-colors cursor-pointer text-left"
                  >
                    <Home className="w-4 h-4 text-[#7c5d41]" />
                    <span>{tr('मुख्य पृष्ठ', 'Home')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      onSelectSeva(sevaItems[0]?.id || 'gau-chara');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#2b1507] hover:bg-[#fdf5ea] transition-colors cursor-pointer text-left"
                  >
                    <HeartHandshake className="w-4 h-4 text-[#7c5d41]" />
                    <span>{tr('गौ-आहार सेवा बुक करें', 'Book Hamari Seva')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      onScrollToAstrologers();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#2b1507] hover:bg-[#fdf5ea] transition-colors cursor-pointer text-left"
                  >
                    <Sparkles className="w-4 h-4 text-[#7c5d41]" />
                    <span>{tr('ज्योतिषाचार्य', 'Jyotishacharya')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerOpen(false);
                      onOpenAbout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#2b1507] hover:bg-[#fdf5ea] transition-colors cursor-pointer text-left"
                  >
                    <Info className="w-4 h-4 text-[#7c5d41]" />
                    <span>{tr('हमारे बारे में', 'About GauKripa')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Logout Action */}
            {activeUser && onLogout && (
              <div className="p-3 border-t border-[#f1e5d3]">
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{tr('लॉग आउट', 'Logout')}</span>
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
};
