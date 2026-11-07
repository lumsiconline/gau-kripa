import React, { useState } from 'react';
import { User, ChevronDown, Menu, X, Heart } from 'lucide-react';
import { ImageCrop } from './ImageCrop';
import { SEVA_ITEMS, REMEDY_CATEGORIES } from '../data/sevaData';

interface NavbarProps {
  onOpenAuth: () => void;
  onSelectSeva: (sevaId: string) => void;
  onSelectRemedy: (remedyId: string) => void;
  onScrollToAstrologers: () => void;
  onOpenAbout: () => void;
  onOpenReviews: () => void;
  activeUser: { name: string; phone?: string } | null;
  onOpenCart?: () => void;
  cartCount?: number;
  onOpenAdminDashboard?: () => void;
  onOpenAstrologerDashboard?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onSelectSeva,
  onSelectRemedy,
  onScrollToAstrologers,
  onOpenAbout,
  onOpenReviews,
  activeUser,
  onOpenCart,
  cartCount = 0,
  onOpenAdminDashboard,
  onOpenAstrologerDashboard,
}) => {
  const [sevaDropdownOpen, setSevaDropdownOpen] = useState(false);
  const [remedyDropdownOpen, setRemedyDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[#fffdf5] border-b border-[#ebdcb9] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
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
              {/* Exact Logo Crop */}
              <div className="h-14 w-52 sm:w-60 overflow-hidden">
                <ImageCrop
                  cropKey="newNavLogo"
                  className="w-full h-full object-contain"
                  alt="GauKripa Seva • Shanti • Samriddhi"
                  preserveAspectRatio="xMinYMid meet"
                />
              </div>
            </a>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-2 text-[14px] font-semibold text-[#253328]">
            {/* Home Pill */}
            <a
              href="#"
              className="px-4 py-1.5 rounded-full bg-[#1b4b32] text-white font-medium shadow-xs hover:bg-[#153e29] transition-all whitespace-nowrap"
            >
              Home
            </a>

            {/* Our Seva Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setSevaDropdownOpen(true)}
              onMouseLeave={() => setSevaDropdownOpen(false)}
            >
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-lg hover:text-[#1b4b32] hover:bg-[#f6efe0] transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer font-medium"
                onClick={() => setSevaDropdownOpen(!sevaDropdownOpen)}
              >
                <span>Our Seva</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${sevaDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {sevaDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-[#fffdf9] rounded-xl shadow-xl border border-[#ebdcb9] py-2 z-50">
                  <div className="px-3 py-1.5 border-b border-[#f0e3c5] text-[11px] font-semibold text-[#8b7355] uppercase tracking-wider">
                    Sacred Animal Sevas
                  </div>
                  {SEVA_ITEMS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSevaDropdownOpen(false);
                        onSelectSeva(item.id);
                      }}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-[#f6efe0] flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-[#1b4b32]">{item.title}</div>
                        <div className="text-[11px] text-[#786c5a]">{item.planetTag}</div>
                      </div>
                      <span className="font-bold text-[#c4821a] text-[11px]">{item.priceDisplay}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grah Shanti Upay Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setRemedyDropdownOpen(true)}
              onMouseLeave={() => setRemedyDropdownOpen(false)}
            >
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-lg hover:text-[#1b4b32] hover:bg-[#f6efe0] transition-colors flex items-center gap-1 whitespace-nowrap cursor-pointer font-medium"
                onClick={() => setRemedyDropdownOpen(!remedyDropdownOpen)}
              >
                <span>Grah Shanti Upay</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${remedyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {remedyDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-68 bg-[#fffdf9] rounded-xl shadow-xl border border-[#ebdcb9] py-2 z-50">
                  <div className="px-3 py-1.5 border-b border-[#f0e3c5] text-[11px] font-semibold text-[#8b7355] uppercase tracking-wider">
                    Vedic Dosha Remedies
                  </div>
                  {REMEDY_CATEGORIES.map((rem) => (
                    <button
                      key={rem.id}
                      onClick={() => {
                        setRemedyDropdownOpen(false);
                        onSelectRemedy(rem.id);
                      }}
                      className="w-full text-left px-3.5 py-2 hover:bg-[#f6efe0] text-xs transition-colors flex items-center justify-between"
                    >
                      <span className="font-medium text-[#2d3a31]">{rem.title}</span>
                      <span className="text-[10px] text-[#8b7355] bg-[#eedec0] px-1.5 py-0.5 rounded">Vedic</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Connect with Astrologer */}
            <button
              onClick={onScrollToAstrologers}
              className="px-3.5 py-1.5 rounded-lg hover:text-[#1b4b32] hover:bg-[#f6efe0] transition-colors whitespace-nowrap cursor-pointer font-medium"
            >
              Connect with Astrologer
            </button>

            {/* About Us */}
            <button
              onClick={onOpenAbout}
              className="px-3.5 py-1.5 rounded-lg hover:text-[#1b4b32] hover:bg-[#f6efe0] transition-colors whitespace-nowrap cursor-pointer font-medium"
            >
              About Us
            </button>

            {/* Reviews */}
            <button
              onClick={onOpenReviews}
              className="px-3.5 py-1.5 rounded-lg hover:text-[#1b4b32] hover:bg-[#f6efe0] transition-colors whitespace-nowrap cursor-pointer font-medium"
            >
              Reviews
            </button>
          </nav>

          {/* Action Area: Cart (if any) & Login / Sign Up in Golden Amber */}
          <div className="flex items-center gap-3">
            {cartCount > 0 && onOpenCart && (
              <button
                onClick={onOpenCart}
                className="relative p-2 rounded-full bg-[#f1e6cb] hover:bg-[#ebdcb9] text-[#1b4b32] transition-colors cursor-pointer"
                title="View Seva Sankalp Cart"
              >
                <Heart className="w-5 h-5 fill-[#1b4b32]" />
                <span className="absolute -top-1 -right-1 bg-[#d94828] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </button>
            )}

            {/* Portal buttons for Astrologer and Admin */}
            {onOpenAstrologerDashboard && (
              <button
                onClick={onOpenAstrologerDashboard}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fdf5e2] hover:bg-[#faedd0] text-[#8b5a0a] border border-[#e5ca8a] text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                title="Open Astrologer Live Chat Dashboard"
              >
                <span>🔮 Astro Desk</span>
              </button>
            )}

            {onOpenAdminDashboard && (
              <button
                onClick={onOpenAdminDashboard}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1b4b32] hover:bg-[#153e29] text-amber-200 border border-amber-300/40 text-xs font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs hover:scale-102"
                title="Open Admin Dashboard"
              >
                <span className="text-sm">🛡️</span>
                <span className="hidden sm:inline">Admin Dashboard</span>
                <span className="sm:hidden">Admin</span>
              </button>
            )}

            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-5 py-2 rounded-full bg-[#e5a024] hover:bg-[#d8941d] active:scale-98 text-slate-950 font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer whitespace-nowrap"
            >
              <User className="w-3.5 h-3.5 fill-slate-950" />
              <span>{activeUser ? activeUser.name : 'Login / Sign Up'}</span>
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#1b4b32] hover:bg-[#f3ebd3] rounded-lg cursor-pointer"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#fffdf8] border-b border-[#ebdcb9] px-4 pt-3 pb-6 space-y-3">
          <div className="grid grid-cols-2 gap-2 pb-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="py-2 px-3 text-center rounded-lg bg-[#1b4b32] text-white text-sm font-semibold"
            >
              Home
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onScrollToAstrologers();
              }}
              className="py-2 px-3 text-center rounded-lg bg-[#f3ebd3] text-[#1b4b32] text-sm font-semibold"
            >
              Astrologers
            </button>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-bold text-[#8b7355] uppercase tracking-wider px-2 py-1">
              Select Seva
            </div>
            {SEVA_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setMobileMenuOpen(false);
                  onSelectSeva(item.id);
                }}
                className="w-full text-left px-3 py-2 text-sm text-[#2d3a31] hover:bg-[#f6efe0] rounded-md flex justify-between items-center"
              >
                <span>{item.title}</span>
                <span className="text-xs font-bold text-[#c4821a]">{item.priceDisplay}</span>
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-[#f0e3c5] flex justify-around">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAbout();
              }}
              className="text-sm font-medium text-[#1b4b32] underline"
            >
              About GauKripa
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenReviews();
              }}
              className="text-sm font-medium text-[#1b4b32] underline"
            >
              Devotee Proof &amp; Reviews
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
                  🔮 Astrologer Desk
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
                  🛡️ Admin Console
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
