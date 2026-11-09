import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { SevaServicesSection } from './components/SevaServicesSection';
import { DualOfferSection } from './components/DualOfferSection';
import { AstrologerSection } from './components/AstrologerSection';
import { WhyChooseUsStrip } from './components/WhyChooseUsStrip';
import { CompactReviewsSection } from './components/CompactReviewsSection';
import { Footer } from './components/Footer';

import { SEVA_ITEMS, SevaItem, ASTROLOGERS, Astrologer } from './data/sevaData';
import { SevaBookingModal } from './components/SevaBookingModal';
import { AstrologerConsultationModal } from './components/AstrologerConsultationModal';
import { GrahRemedyModal } from './components/GrahRemedyModal';
import { ProofGalleryModal } from './components/ProofGalleryModal';
import { AuthModal, AuthUser } from './components/AuthModal';
import { AboutModal } from './components/AboutModal';
import { SevaParivarModal } from './components/SevaParivarModal';
import { ContactModal } from './components/ContactModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AstrologerDashboard } from './components/astrologer/AstrologerDashboard';

export default function App() {
  // User session state - stored in localStorage
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('gaukripa_user');
        if (stored) return JSON.parse(stored);
      } catch (err) {
        console.error('Failed to parse stored user:', err);
      }
    }
    return null;
  });

  // Super Admin Check - strictly for bankush014@gmail.com
  const isSuperAdmin = currentUser?.email?.toLowerCase() === 'bankush014@gmail.com' || currentUser?.role === 'super_admin';

  // Navigation prompt & action resumption queue
  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    | { type: 'seva'; item: SevaItem; discount: boolean }
    | { type: 'astrologer'; astrologer: Astrologer; mode: 'chat' | 'call' }
    | null
  >(null);

  // Current Active View: Website (Devotee Portal) vs Admin Console vs Astrologer Desk
  // Protected: Only Super Admin can access admin/astrologer dashboards
  const [currentView, setCurrentView] = useState<'website' | 'admin' | 'astrologer'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if ((hash === '#admin' || hash === '#astrologer' || hash === '#astro') && isSuperAdmin) {
        return hash === '#admin' ? 'admin' : 'astrologer';
      }
    }
    return 'website';
  });

  const navigateTo = (view: 'website' | 'admin' | 'astrologer') => {
    if ((view === 'admin' || view === 'astrologer') && !isSuperAdmin) {
      setAuthPromptMessage('Super Admin sign-in required (bankush014@gmail.com) to access management consoles.');
      setAuthModalOpen(true);
      return;
    }

    setCurrentView(view);
    if (typeof window !== 'undefined') {
      if (view === 'admin') window.location.hash = 'admin';
      else if (view === 'astrologer') window.location.hash = 'astrologer';
      else {
        history.pushState(null, '', window.location.pathname);
      }
    }
  };

  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin') {
        if (!isSuperAdmin) {
          setAuthPromptMessage('Super Admin sign-in required (bankush014@gmail.com) to access the Admin Console.');
          setAuthModalOpen(true);
          setCurrentView('website');
        } else {
          setCurrentView('admin');
        }
      } else if (hash === '#astrologer' || hash === '#astro') {
        if (!isSuperAdmin) {
          setAuthPromptMessage('Super Admin sign-in required (bankush014@gmail.com) to access the Astrologer Desk.');
          setAuthModalOpen(true);
          setCurrentView('website');
        } else {
          setCurrentView('astrologer');
        }
      } else {
        setCurrentView('website');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isSuperAdmin]);

  // Modal visibility states
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [activeBookingSeva, setActiveBookingSeva] = useState<SevaItem>(SEVA_ITEMS[0]);
  const [hasAstrologerDiscount, setHasAstrologerDiscount] = useState(false);

  const [astroModalOpen, setAstroModalOpen] = useState(false);
  const [activeAstrologer, setActiveAstrologer] = useState<Astrologer>(ASTROLOGERS[0]);
  const [astroMode, setAstroMode] = useState<'chat' | 'call'>('chat');

  const [remedyModalOpen, setRemedyModalOpen] = useState(false);
  const [activeRemedyId, setActiveRemedyId] = useState<string>('career');

  const [proofGalleryOpen, setProofGalleryOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [parivarModalOpen, setParivarModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Smooth scroll helper
  const scrollToAstrologers = () => {
    const el = document.getElementById('astrologers-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToSevaServices = () => {
    const el = document.getElementById('seva-services');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handlers with mandatory login gating
  const handleOpenSevaBooking = (item: SevaItem, discount = false) => {
    // Public seva bookings do not require a customer login.
    setActiveBookingSeva(item);
    setHasAstrologerDiscount(discount);
    setBookingModalOpen(true);
  };

  const handleOpenSevaById = (sevaId: string) => {
    const found = SEVA_ITEMS.find((s) => s.id === sevaId) || SEVA_ITEMS[0];
    handleOpenSevaBooking(found);
  };

  const handleOpenRemedy = (remedyId: string) => {
    setActiveRemedyId(remedyId);
    setRemedyModalOpen(true);
  };

  const handleConnectAstrologer = (astrologer: Astrologer, mode: 'chat' | 'call' = 'chat') => {
    if (!currentUser) {
      setAuthPromptMessage('Please sign in with your email & password to consult with Vedic Astrologers.');
      setPendingAction({ type: 'astrologer', astrologer, mode });
      setAuthModalOpen(true);
      return;
    }
    setActiveAstrologer(astrologer);
    setAstroMode(mode);
    setAstroModalOpen(true);
  };

  const handleUserLogin = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('gaukripa_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }

    // Auto resume queued action if user clicked Book or Chat prior to logging in
    if (pendingAction) {
      if (pendingAction.type === 'seva') {
        setActiveBookingSeva(pendingAction.item);
        setHasAstrologerDiscount(pendingAction.discount);
        setBookingModalOpen(true);
      } else if (pendingAction.type === 'astrologer') {
        setActiveAstrologer(pendingAction.astrologer);
        setAstroMode(pendingAction.mode);
        setAstroModalOpen(true);
      }
      setPendingAction(null);
    }
    setAuthPromptMessage(null);
  };

  const handleUserLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('gaukripa_user');
    } catch (e) {
      console.error(e);
    }
    setCurrentView('website');
    if (typeof window !== 'undefined') {
      history.pushState(null, '', window.location.pathname);
    }
  };

  if (currentView === 'admin' && isSuperAdmin) {
    return <AdminDashboard onBackToWebsite={() => navigateTo('website')} />;
  }

  if (currentView === 'astrologer' && isSuperAdmin) {
    return (
      <AstrologerDashboard
        onBackToWebsite={() => navigateTo('website')}
        selectedAstroId={activeAstrologer?.id}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f2e5] text-[#2c332d] selection:bg-[#e5a024] selection:text-slate-900">
      
      {/* Main Top Navigation - Portals ONLY passed if Super Admin */}
      <Navbar
        onOpenAuth={() => { setAuthPromptMessage(null); setAuthModalOpen(true); }}
        activeUser={currentUser}
        onLogout={handleUserLogout}
        onSelectSeva={handleOpenSevaById}
        onSelectRemedy={handleOpenRemedy}
        onScrollToAstrologers={scrollToAstrologers}
        onOpenAbout={() => setAboutModalOpen(true)}
        onOpenReviews={() => setProofGalleryOpen(true)}
        onOpenAdminDashboard={isSuperAdmin ? () => navigateTo('admin') : undefined}
        onOpenAstrologerDashboard={isSuperAdmin ? () => navigateTo('astrologer') : undefined}
      />

      {/* Hero Section */}
      <main className="flex-1">
        <HeroSection
          onBookSevaToday={() => handleOpenSevaBooking(SEVA_ITEMS[0])}
          onExploreAstrology={scrollToAstrologers}
          onExploreRemedies={() => handleOpenRemedy('career')}
        />

        {/* Our Seva Services Section */}
        <SevaServicesSection
          onBookSeva={(item) => handleOpenSevaBooking(item)}
        />

        {/* Find Your Grah Remedy & Special Offer Banner */}
        <DualOfferSection
          onOpenRemedyModal={handleOpenRemedy}
          onBookSevaWithDiscount={() => handleOpenSevaBooking(SEVA_ITEMS[0], true)}
        />

        {/* Connect with Our Expert Astrologers Section */}
        <AstrologerSection
          onConnectAstrologer={handleConnectAstrologer}
          onGeneralConnect={() => handleConnectAstrologer(ASTROLOGERS[0], 'chat')}
        />

        {/* Why Choose GauKripa? (Bottom Strip) */}
        <WhyChooseUsStrip
          onJoinParivar={() => setParivarModalOpen(true)}
          onOpenProofGallery={() => setProofGalleryOpen(true)}
        />

        {/* Devotee Reviews Section - Compact One-Liners in Hinglish across India */}
        <CompactReviewsSection
          onOpenProofGallery={() => setProofGalleryOpen(true)}
        />
      </main>

      {/* Footer - Portals only passed if Super Admin */}
      <Footer
        onOpenAbout={() => setAboutModalOpen(true)}
        onOpenServices={scrollToSevaServices}
        onOpenAstrology={scrollToAstrologers}
        onOpenReviews={() => setProofGalleryOpen(true)}
        onOpenContact={() => setContactModalOpen(true)}
        onOpenAdmin={isSuperAdmin ? () => navigateTo('admin') : undefined}
        onOpenAstrologer={isSuperAdmin ? () => navigateTo('astrologer') : undefined}
      />

      {/* Floating Quick Access Dock - EXCLUSIVELY FOR SUPER ADMIN (bankush014@gmail.com) */}
      {isSuperAdmin && (
        <aside aria-label="Portal Navigation" className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-[#1b4b32]/95 backdrop-blur-md p-1.5 rounded-full shadow-2xl border-2 border-[#e5ca8a] animate-in fade-in">
          <button
            onClick={() => navigateTo('admin')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#e5a024] hover:bg-[#d4901a] text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            title="Open Admin Dashboard"
          >
            <span className="text-sm">🛡️</span>
            <span>Admin Dashboard</span>
          </button>
          <button
            onClick={() => navigateTo('astrologer')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-amber-200 font-semibold text-xs transition-all cursor-pointer whitespace-nowrap"
            title="Open Astrologer Desk"
          >
            <span className="text-sm">🔮</span>
            <span>Astro Desk</span>
          </button>
        </aside>
      )}

      {/* Interactive Modals */}
      <SevaBookingModal
        initialSeva={activeBookingSeva}
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        hasAstrologerDiscount={hasAstrologerDiscount}
      />

      <AstrologerConsultationModal
        astrologer={activeAstrologer}
        initialMode={astroMode}
        isOpen={astroModalOpen}
        onClose={() => setAstroModalOpen(false)}
        hasDiscount={hasAstrologerDiscount}
        customerPhone={currentUser?.phone || '9876543210'}
        customerName={currentUser?.name || 'Devotee'}
        onBookPrescribedSeva={(sevaTitle) => {
          const found = SEVA_ITEMS.find((s) => s.title.toLowerCase().includes(sevaTitle.toLowerCase())) || SEVA_ITEMS[0];
          handleOpenSevaBooking(found);
        }}
      />

      <GrahRemedyModal
        remedyId={activeRemedyId}
        isOpen={remedyModalOpen}
        onClose={() => setRemedyModalOpen(false)}
        onBookRecommendedSeva={(seva) => handleOpenSevaBooking(seva)}
        onConsultAstrologer={() => handleConnectAstrologer(ASTROLOGERS[0], 'chat')}
      />

      <ProofGalleryModal
        isOpen={proofGalleryOpen}
        onClose={() => setProofGalleryOpen(false)}
        onBookSevaClick={() => {
          setProofGalleryOpen(false);
          handleOpenSevaBooking(SEVA_ITEMS[0]);
        }}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthPromptMessage(null);
        }}
        currentUser={currentUser}
        onLogin={handleUserLogin}
        onLogout={handleUserLogout}
        onOpenAdmin={isSuperAdmin ? () => navigateTo('admin') : undefined}
        onOpenAstrologer={isSuperAdmin ? () => navigateTo('astrologer') : undefined}
        customMessage={authPromptMessage}
      />

      <AboutModal
        isOpen={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
        onExploreSevas={() => {
          setAboutModalOpen(false);
          scrollToSevaServices();
        }}
      />

      <SevaParivarModal
        isOpen={parivarModalOpen}
        onClose={() => setParivarModalOpen(false)}
      />

      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />

    </div>
  );
}
