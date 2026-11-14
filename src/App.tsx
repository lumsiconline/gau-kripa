import React, { useState } from 'react';
import { Home, HeartHandshake, Sparkles, User } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { SevaServicesSection } from './components/SevaServicesSection';
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
  getLocalizedSevaItems,
  getLocalizedAstrologers,
} from './data/sevaData';
import { SevaBookingModal } from './components/SevaBookingModal';
import { AstrologerConsultationModal } from './components/AstrologerConsultationModal';
import { GrahRemedyModal } from './components/GrahRemedyModal';
import { ProofGalleryModal } from './components/ProofGalleryModal';
import { AuthModal, AuthUser } from './components/AuthModal';
import { ProfileDashboard, ProfileTab } from './components/ProfileDashboard';
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
    | { type: 'profile'; tab: ProfileTab }
    | null
  >(null);

  const [profileTab, setProfileTab] = useState<ProfileTab>('overview');

  // Current Active View: Website vs Profile Dashboard vs Admin Console vs Astrologer Desk
  const [currentView, setCurrentView] = useState<'website' | 'profile' | 'admin' | 'astrologer'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.toLowerCase();
      if ((hash === '#admin' || hash === '#astrologer' || hash === '#astro') && isSuperAdmin) {
        return hash === '#admin' ? 'admin' : 'astrologer';
      }
      if (hash === '#profile' && currentUser) {
        return 'profile';
      }
    }
    return 'website';
  });

  const navigateTo = (view: 'website' | 'profile' | 'admin' | 'astrologer') => {
    if ((view === 'admin' || view === 'astrologer') && !isSuperAdmin) {
      setAuthPromptMessage(
        tr(
          'प्रबंधन कंसोल खोलने के लिए सुपर एडमिन (bankush014@gmail.com) लॉगिन आवश्यक है।',
          'Management console kholne ke liye Super Admin (bankush014@gmail.com) login zaroori hai.'
        )
      );
      setAuthModalOpen(true);
      return;
    }

    if (view === 'profile' && !currentUser) {
      setPendingAction({ type: 'profile', tab: 'overview' });
      setAuthPromptMessage(null);
      setAuthModalOpen(true);
      return;
    }

    setCurrentView(view);
    if (typeof window !== 'undefined') {
      if (view === 'admin') window.location.hash = 'admin';
      else if (view === 'astrologer') window.location.hash = 'astrologer';
      else if (view === 'profile') window.location.hash = 'profile';
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
              'Admin console kholne ke liye Super Admin (bankush014@gmail.com) login zaroori hai.'
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
              'Jyotishi desk kholne ke liye Super Admin (bankush014@gmail.com) login zaroori hai.'
            )
          );
          setAuthModalOpen(true);
          setCurrentView('website');
        } else {
          setCurrentView('astrologer');
        }
      } else if (hash === '#profile') {
        if (currentUser) {
          setCurrentView('profile');
        } else {
          setPendingAction({ type: 'profile', tab: 'overview' });
          setAuthModalOpen(true);
          setCurrentView('website');
        }
      } else {
        setCurrentView('website');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isSuperAdmin, currentUser, lang]);

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
  const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'seva' | 'jyotish' | 'profile'>('home');

  // Smooth scroll helpers
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
          'Vedic Jyotishiyon se paramarsh lene ke liye kripaya apne email aur password se Sign In karein.'
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

  const handleOpenProfile = (tab: ProfileTab = 'overview') => {
    setAuthPromptMessage(null);
    if (!currentUser) {
      setPendingAction({ type: 'profile', tab });
      setAuthModalOpen(true);
      return;
    }
    setProfileTab(tab);
    navigateTo('profile');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleUpdateUser = (updatedUser: AuthUser) => {
    setCurrentUser(updatedUser);
    try {
      localStorage.setItem('gaukripa_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUserLogin = (user: AuthUser) => {
    handleUpdateUser(user);

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
      } else if (pendingAction.type === 'profile') {
        setProfileTab(pendingAction.tab);
        setCurrentView('profile');
        if (typeof window !== 'undefined') {
          window.location.hash = 'profile';
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
      setPendingAction(null);
    }
    setAuthPromptMessage(null);
  };

  const handleUserLogout = () => {
    setCurrentUser(null);
    api.logout().catch(console.error);
    setCurrentView('website');
    setActiveBottomTab('home');
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

  if (currentView === 'profile' && currentUser) {
    return (
      <>
        <ProfileDashboard
          currentUser={currentUser}
          initialTab={profileTab}
          onTabChange={setProfileTab}
          onUpdateUser={handleUpdateUser}
          onLogout={handleUserLogout}
          onBackToWebsite={() => {
            setActiveBottomTab('home');
            navigateTo('website');
          }}
          onBookSevaClick={() => handleOpenSevaBooking(localizedSevaItems[0])}
          onOpenProofGallery={() => setProofGalleryOpen(true)}
          onOpenAdmin={isSuperAdmin ? () => navigateTo('admin') : undefined}
          onOpenAstrologer={isSuperAdmin ? () => navigateTo('astrologer') : undefined}
        />

        <SevaBookingModal
          initialSeva={activeBookingSeva}
          isOpen={bookingModalOpen}
          onClose={() => setBookingModalOpen(false)}
          hasAstrologerDiscount={hasAstrologerDiscount}
        />

        <ProofGalleryModal
          isOpen={proofGalleryOpen}
          onClose={() => setProofGalleryOpen(false)}
          onBookSevaClick={() => {
            setProofGalleryOpen(false);
            handleOpenSevaBooking(localizedSevaItems[0]);
          }}
        />
      </>
    );
  }

  const displayAstrologer =
    localizedAstrologers.find((a) => a.id === activeAstrologer?.id) || localizedAstrologers[0] || ASTROLOGERS[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf6ee] text-[#2e1a0c] selection:bg-[#f0b33a] selection:text-[#2e1a0c]">
      
      {/* Main Top Navigation */}
      <Navbar
        onOpenAuth={() => handleOpenProfile('overview')}
        onOpenProfileTab={handleOpenProfile}
        activeUser={currentUser}
        onLogout={handleUserLogout}
        onSelectSeva={handleOpenSevaById}
        onSelectRemedy={handleOpenRemedy}
        onScrollToAstrologers={scrollToAstrologers}
        onOpenAbout={() => setAboutModalOpen(true)}
        onOpenReviews={() => setProofGalleryOpen(true)}
      />

      {/* Hero Section */}
      <main className="flex-1">
        <HeroSection
          onBookSevaToday={() => handleOpenSevaBooking(localizedSevaItems[0])}
          onExploreServices={scrollToSevaServices}
          onExploreAstrology={scrollToAstrologers}
          onOpenProofGallery={() => setProofGalleryOpen(true)}
        />

        {/* Our Seva Services Section */}
        <SevaServicesSection
          onBookSeva={(item) => handleOpenSevaBooking(item)}
        />

        {/* Vedic Jyotish Margdarshan Section */}
        <DualOfferSection
          onOpenRemedyModal={handleOpenRemedy}
          onConsultAstrologer={() => handleConnectAstrologer(localizedAstrologers[0], 'chat')}
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
        onOpenReviews={() => setProofGalleryOpen(true)}
        onOpenContact={() => setContactModalOpen(true)}
        onOpenAdmin={isSuperAdmin ? () => navigateTo('admin') : undefined}
        onOpenAstrologer={isSuperAdmin ? () => navigateTo('astrologer') : undefined}
      />

      {/* Floating Mobile Bottom Navigation Bar (Home | Seva | Jyotish | Profile) */}
      <nav
        aria-label={tr('मुख्य नेविगेशन', 'Mukhya Navigation')}
        className="md:hidden fixed bottom-2.5 left-3 right-3 z-40 bg-white/95 backdrop-blur-md border border-[#e7d6be] rounded-2xl shadow-[0_8px_28px_rgba(80,45,12,0.14)] px-2 py-1.5 grid grid-cols-4"
      >
        <button
          type="button"
          onClick={() => {
            setActiveBottomTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
            activeBottomTab === 'home' ? 'text-[#b54c0d]' : 'text-[#5b4634]'
          }`}
        >
          <Home className={`w-4 h-4 ${activeBottomTab === 'home' ? 'fill-[#b54c0d]/20 text-[#b54c0d]' : ''}`} />
          <span>{tr('होम', 'Home')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveBottomTab('seva');
            scrollToSevaServices();
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
            activeBottomTab === 'seva' ? 'text-[#b54c0d]' : 'text-[#5b4634]'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>{tr('सेवा', 'Seva')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveBottomTab('jyotish');
            const el = document.getElementById('jyotish-margdarshan') || document.getElementById('astrologers-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
            activeBottomTab === 'jyotish' ? 'text-[#b54c0d]' : 'text-[#5b4634]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{tr('ज्योतिष', 'Jyotish')}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveBottomTab('profile');
            handleOpenProfile('overview');
          }}
          className={`flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
            activeBottomTab === 'profile' ? 'text-[#b54c0d]' : 'text-[#5b4634]'
          }`}
        >
          <User className="w-4 h-4" />
          <span>{tr('प्रोफ़ाइल', 'Profile')}</span>
        </button>
      </nav>

      {/* Continuous Shuffled Seva Booking Popup (20 states/cities, every 4s) */}
      <LiveSevaBookingPopup />

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
        customerName={currentUser?.name || tr('भक्त', 'Bhakt')}
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

