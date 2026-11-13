import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { SevaServicesSection } from './components/SevaServicesSection';
import { JyotishServicesSection } from './components/JyotishServicesSection';
import { DualOfferSection } from './components/DualOfferSection';
import { AstrologerSection } from './components/AstrologerSection';
import { WhyChooseUsStrip } from './components/WhyChooseUsStrip';
import { CompactReviewsSection } from './components/CompactReviewsSection';
import { Footer } from './components/Footer';

import {
  SEVA_ITEMS_HI,
  SEVA_ITEMS_EN,
  SevaItem,
  ASTROLOGERS,
  Astrologer,
  JyotishCategory,
  getLocalizedSevaItems,
  getLocalizedAstrologers,
} from './data/sevaData';
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
import { LiveSevaBookingPopup } from './components/LiveSevaBookingPopup';
import { useLanguage } from './i18n/LanguageContext';
import { api, ServiceItem } from './services/api';

export default function App() {
  const { lang, tr } = useLanguage();
  const [liveServices, setLiveServices] = useState<ServiceItem[]>([]);

  React.useEffect(() => {
    let active = true;
    const sync = async () => {
      try {
        const fetched = await api.getServices(true);
        if (active && Array.isArray(fetched)) {
          setLiveServices(fetched);
        }
      } catch {}
    };
    sync();
    window.addEventListener('gaukripa_services_updated', sync);
    return () => {
      active = false;
      window.removeEventListener('gaukripa_services_updated', sync);
    };
  }, []);

  const localizedSevaItems = getLocalizedSevaItems(lang).map((item) => {
    const live = liveServices.find((s) => s.id === item.id);
    if (!live) return item;
    return {
      ...item,
      customImageUrl: live.customImageUrl || item.customImageUrl,
    };
  });
  const localizedAstrologers = getLocalizedAstrologers(lang);

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
    | { type: 'astrologer'; astrologer: Astrologer; mode: 'chat' | 'call'; concern?: string }
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
      setAuthPromptMessage(
        tr(
          'प्रबंधन कंसोल खोलने के लिए सुपर एडमिन (bankush014@gmail.com) लॉगिन आवश्यक है।',
          'Super Admin sign-in required (bankush014@gmail.com) to access management consoles.'
        )
      );
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
          setAuthPromptMessage(
            tr(
              'एडमिन कंसोल खोलने के लिए सुपर एडमिन (bankush014@gmail.com) लॉगिन आवश्यक है।',
              'Super Admin sign-in required (bankush014@gmail.com) to access the Admin Console.'
            )
          );
          setAuthModalOpen(true);
          setCurrentView('website');
        } else {
          setCurrentView('admin');
        }
      } else if (hash === '#astrologer' || hash === '#astro') {
        if (!isSuperAdmin) {
          setAuthPromptMessage(
            tr(
              'ज्योतिषी डेस्क खोलने के लिए सुपर एडमिन (bankush014@gmail.com) लॉगिन आवश्यक है।',
              'Super Admin sign-in required (bankush014@gmail.com) to access the Astrologer Desk.'
            )
          );
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
  }, [isSuperAdmin, lang]);

  // Modal visibility states
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [activeBookingSeva, setActiveBookingSeva] = useState<SevaItem>(localizedSevaItems[0]);
  const [hasAstrologerDiscount, setHasAstrologerDiscount] = useState(false);

  const [astroModalOpen, setAstroModalOpen] = useState(false);
  const [activeAstrologer, setActiveAstrologer] = useState<Astrologer>(localizedAstrologers[0]);
  const [astroMode, setAstroMode] = useState<'chat' | 'call'>('chat');
  const [selectedConcern, setSelectedConcern] = useState<string | undefined>(undefined);

  const [remedyModalOpen, setRemedyModalOpen] = useState(false);
  const [activeRemedyId, setActiveRemedyId] = useState<string>('career');

  const [proofGalleryOpen, setProofGalleryOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [parivarModalOpen, setParivarModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

  // Smooth scroll helpers
  const scrollToAstrologers = () => {
    const el = document.getElementById('astrologers-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToJyotish = () => {
    const el = document.getElementById('jyotish-guidance');
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

  // Handlers
  const handleOpenSevaBooking = (item: SevaItem, discount = false) => {
    const liveMatch = liveServices.find((s) => s.id === item.id);
    const mergedItem = liveMatch && !item.customImageUrl
      ? { ...item, customImageUrl: liveMatch.customImageUrl }
      : item;
    setActiveBookingSeva(mergedItem);
    setHasAstrologerDiscount(discount);
    setBookingModalOpen(true);
  };

  const handleOpenSevaById = (sevaId: string) => {
    const found = localizedSevaItems.find((s) => s.id === sevaId) || localizedSevaItems[0];
    handleOpenSevaBooking(found);
  };

  const handleOpenRemedy = (remedyId: string) => {
    setActiveRemedyId(remedyId);
    setRemedyModalOpen(true);
  };

  const handleConnectAstrologer = (astrologer: Astrologer, mode: 'chat' | 'call' = 'chat', concernText?: string) => {
    if (!currentUser) {
      setAuthPromptMessage(
        tr(
          'वैदिक ज्योतिषियों से परामर्श लेने के लिए कृपया अपने ईमेल व पासवर्ड से साइन इन करें।',
          'Please sign in with your email & password to consult with Vedic Astrologers.'
        )
      );
      setPendingAction({ type: 'astrologer', astrologer, mode, concern: concernText });
      setAuthModalOpen(true);
      return;
    }
    setActiveAstrologer(astrologer);
    setAstroMode(mode);
    setSelectedConcern(concernText);
    setAstroModalOpen(true);
  };

  const handleSelectJyotishCategory = (category: JyotishCategory) => {
    handleConnectAstrologer(localizedAstrologers[0], 'chat', category.title);
  };

  const handleUserLogin = (user: AuthUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('gaukripa_user', JSON.stringify(user));
    } catch (e) {
      console.error(e);
    }

    if (pendingAction) {
      if (pendingAction.type === 'seva') {
        setActiveBookingSeva(pendingAction.item);
        setHasAstrologerDiscount(pendingAction.discount);
        setBookingModalOpen(true);
      } else if (pendingAction.type === 'astrologer') {
        setActiveAstrologer(pendingAction.astrologer);
        setAstroMode(pendingAction.mode);
        setSelectedConcern(pendingAction.concern);
        setAstroModalOpen(true);
      }
      setPendingAction(null);
    }
    setAuthPromptMessage(null);
  };

  const handleUserLogout = () => {
    setCurrentUser(null);
    api.logout().catch(console.error);
    setCurrentView('website');
    if (typeof window !== 'undefined') {
      history.pushState(null, '', window.location.pathname);
    }
  };

  const findPrescribedSeva = (sevaTitle: string): SevaItem => {
    const lower = sevaTitle.toLowerCase();
    let targetId = 'gau-chara';
    if (lower.includes('roti') || lower.includes('रोटी')) targetId = 'gau-roti';
    else if (lower.includes('gud') || lower.includes('chana') || lower.includes('गुड़')) targetId = 'gau-gud-chana';
    else if (lower.includes('cheenti') || lower.includes('aata') || lower.includes('चींटी')) targetId = 'cheenti-aata';
    else if (lower.includes('pakshi') || lower.includes('पक्षी')) targetId = 'pakshi-dana';
    else if (lower.includes('dog') || lower.includes('श्वान')) targetId = 'street-dogs';
    else {
      const hiMatch = SEVA_ITEMS_HI.find((s) => s.title.toLowerCase().includes(lower));
      const enMatch = SEVA_ITEMS_EN.find((s) => s.title.toLowerCase().includes(lower));
      if (hiMatch) targetId = hiMatch.id;
      else if (enMatch) targetId = enMatch.id;
    }
    return localizedSevaItems.find((s) => s.id === targetId) || localizedSevaItems[0];
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

  const displayAstrologer =
    localizedAstrologers.find((a) => a.id === activeAstrologer?.id) || localizedAstrologers[0] || ASTROLOGERS[0];

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
        onScrollToJyotish={scrollToJyotish}
        onOpenAbout={() => setAboutModalOpen(true)}
        onOpenReviews={() => setProofGalleryOpen(true)}
        onOpenAdminDashboard={isSuperAdmin ? () => navigateTo('admin') : undefined}
        onOpenAstrologerDashboard={isSuperAdmin ? () => navigateTo('astrologer') : undefined}
      />

      {/* Hero Section */}
      <main className="flex-1">
        <HeroSection
          onBookSevaToday={() => handleOpenSevaBooking(localizedSevaItems[0])}
          onExploreAstrology={scrollToAstrologers}
          onExploreRemedies={() => handleOpenRemedy('career')}
        />

        {/* Our Seva Services Section */}
        <SevaServicesSection
          onBookSeva={(item) => handleOpenSevaBooking(item)}
        />

        {/* Vedic Jyotish Guidance Services Section */}
        <JyotishServicesSection
          onSelectCategory={handleSelectJyotishCategory}
          onGeneralConsult={() => handleConnectAstrologer(localizedAstrologers[0], 'chat')}
        />

        {/* Find Your Grah Remedy & Special Offer Banner */}
        <DualOfferSection
          onOpenRemedyModal={handleOpenRemedy}
          onBookSevaWithDiscount={() => handleOpenSevaBooking(localizedSevaItems[0], true)}
        />

        {/* Connect with Our Expert Astrologers Section */}
        <AstrologerSection
          onConnectAstrologer={(astro, m) => handleConnectAstrologer(astro, m)}
          onGeneralConnect={() => handleConnectAstrologer(localizedAstrologers[0], 'chat')}
        />

        {/* Why Choose GauKripa? (Bottom Strip) */}
        <WhyChooseUsStrip
          onJoinParivar={() => setParivarModalOpen(true)}
          onOpenProofGallery={() => setProofGalleryOpen(true)}
        />

        {/* Devotee Reviews Section */}
        <CompactReviewsSection
          onOpenProofGallery={() => setProofGalleryOpen(true)}
        />
      </main>

      {/* Footer - Portals only passed if Super Admin */}
      <Footer
        onOpenAbout={() => setAboutModalOpen(true)}
        onOpenServices={scrollToSevaServices}
        onOpenAstrology={scrollToAstrologers}
        onOpenJyotish={scrollToJyotish}
        onOpenReviews={() => setProofGalleryOpen(true)}
        onOpenContact={() => setContactModalOpen(true)}
        onOpenAdmin={isSuperAdmin ? () => navigateTo('admin') : undefined}
        onOpenAstrologer={isSuperAdmin ? () => navigateTo('astrologer') : undefined}
      />

      {/* Continuous Shuffled Seva Booking Popup (20 states/cities, every 4s) */}
      <LiveSevaBookingPopup />

      {/* Floating Quick Access Dock - EXCLUSIVELY FOR SUPER ADMIN (bankush014@gmail.com) */}
      {isSuperAdmin && (
        <aside aria-label={tr('पोर्टल नेविगेशन', 'Portal Navigation')} className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-[#1b4b32]/95 backdrop-blur-md p-1.5 rounded-full shadow-2xl border-2 border-[#e5ca8a] animate-in fade-in">
          <button
            onClick={() => navigateTo('admin')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#e5a024] hover:bg-[#d4901a] text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            title={tr('एडमिन डैशबोर्ड खोलें', 'Open Admin Dashboard')}
          >
            <span className="text-sm">🛡️</span>
            <span>{tr('एडमिन डैशबोर्ड', 'Admin Dashboard')}</span>
          </button>
          <button
            onClick={() => navigateTo('astrologer')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-amber-200 font-semibold text-xs transition-all cursor-pointer whitespace-nowrap"
            title={tr('ज्योतिष डेस्क खोलें', 'Open Astrologer Desk')}
          >
            <span className="text-sm">🔮</span>
            <span>{tr('ज्योतिष डेस्क', 'Astro Desk')}</span>
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
        astrologer={displayAstrologer}
        initialMode={astroMode}
        isOpen={astroModalOpen}
        onClose={() => setAstroModalOpen(false)}
        hasDiscount={hasAstrologerDiscount}
        customerPhone={currentUser?.phone || '9876543210'}
        customerName={currentUser?.name || tr('भक्त', 'Devotee')}
        initialConcern={selectedConcern}
        onBookPrescribedSeva={(sevaTitle) => {
          handleOpenSevaBooking(findPrescribedSeva(sevaTitle));
        }}
      />

      <GrahRemedyModal
        remedyId={activeRemedyId}
        isOpen={remedyModalOpen}
        onClose={() => setRemedyModalOpen(false)}
        onBookRecommendedSeva={(seva) => handleOpenSevaBooking(seva)}
        onConsultAstrologer={() => handleConnectAstrologer(localizedAstrologers[0], 'chat')}
      />

      <ProofGalleryModal
        isOpen={proofGalleryOpen}
        onClose={() => setProofGalleryOpen(false)}
        onBookSevaClick={() => {
          setProofGalleryOpen(false);
          handleOpenSevaBooking(localizedSevaItems[0]);
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

