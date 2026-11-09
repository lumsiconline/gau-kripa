import React, { useState } from 'react';
import { ASTROLOGERS, Astrologer } from './data/sevaData';
import { AstrologerSection } from './components/AstrologerSection';
import { AstrologerConsultationModal } from './components/AstrologerConsultationModal';
import { AuthModal, AuthUser } from './components/AuthModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AstrologerDashboard } from './components/astrologer/AstrologerDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem('gaukripa_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const isSuperAdmin = currentUser?.email?.toLowerCase() === 'bankush014@gmail.com' || currentUser?.role === 'super_admin';
  const [currentView, setCurrentView] = useState<'website' | 'admin' | 'astrologer'>('website');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(null);
  const [pendingAstrologer, setPendingAstrologer] = useState<{ astrologer: Astrologer; mode: 'chat' | 'call' } | null>(null);
  const [astroModalOpen, setAstroModalOpen] = useState(false);
  const [activeAstrologer, setActiveAstrologer] = useState<Astrologer>(ASTROLOGERS[0]);
  const [astroMode, setAstroMode] = useState<'chat' | 'call'>('chat');

  const scrollToAstrologers = () => document.getElementById('astrologers-section')?.scrollIntoView({ behavior: 'smooth' });
  const connectAstrologer = (astrologer: Astrologer, mode: 'chat' | 'call' = 'chat') => {
    if (!currentUser) {
      setPendingAstrologer({ astrologer, mode });
      setAuthPromptMessage('Please sign in to consult with an astrologer.');
      setAuthModalOpen(true);
      return;
    }
    setActiveAstrologer(astrologer);
    setAstroMode(mode);
    setAstroModalOpen(true);
  };
  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user);
    localStorage.setItem('gaukripa_user', JSON.stringify(user));
    setAuthModalOpen(false);
    setAuthPromptMessage(null);
    if (pendingAstrologer) {
      setActiveAstrologer(pendingAstrologer.astrologer);
      setAstroMode(pendingAstrologer.mode);
      setAstroModalOpen(true);
      setPendingAstrologer(null);
    }
  };
  const logout = () => {
    localStorage.removeItem('gaukripa_user');
    setCurrentUser(null);
    setCurrentView('website');
  };

  if (currentView === 'admin' && isSuperAdmin) return <AdminDashboard onBackToWebsite={() => setCurrentView('website')} />;
  if (currentView === 'astrologer' && isSuperAdmin) return <AstrologerDashboard onBackToWebsite={() => setCurrentView('website')} selectedAstroId={activeAstrologer.id} />;

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f2e5] text-[#2c332d]">
      <header className="sticky top-0 z-50 bg-[#fffdf5] border-b border-[#ebdcb9] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="font-playfair text-2xl sm:text-3xl font-bold text-[#1b4b32]">GauKripa <span className="block text-[10px] sm:text-xs font-sans font-semibold tracking-[0.2em] text-[#9a762d]">ASTROLOGY &amp; GUIDANCE</span></button>
          <nav className="flex items-center gap-2 sm:gap-3">
            <button onClick={scrollToAstrologers} className="hidden sm:inline-flex px-4 py-2 rounded-full bg-[#f1e6cb] text-[#1b4b32] text-sm font-semibold">Astrologers</button>
            {isSuperAdmin && <><button onClick={() => setCurrentView('astrologer')} className="px-3 py-2 rounded-full bg-[#fdf5e2] text-[#8b5a0a] border border-[#e5ca8a] text-xs sm:text-sm font-bold">Astro Desk</button><button onClick={() => setCurrentView('admin')} className="px-3 py-2 rounded-full bg-[#1b4b32] text-white text-xs sm:text-sm font-bold">Admin</button></>}
            <button onClick={() => { setAuthPromptMessage(null); setAuthModalOpen(true); }} className="px-4 py-2 rounded-full bg-[#1b4b32] text-white text-sm font-bold">{currentUser ? currentUser.name.split(' ')[0] : 'Sign In'}</button>
            {currentUser && <button onClick={logout} className="text-xs text-[#1b4b32] underline">Log out</button>}
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="relative overflow-hidden bg-[#153e29] text-white py-14 sm:py-20">
          <div className="max-w-5xl mx-auto px-5 text-center space-y-5">
            <p className="text-amber-300 text-xs sm:text-sm font-bold tracking-[0.25em] uppercase">Vedic • Tarot • Psychic Guidance</p>
            <h1 className="font-playfair text-4xl sm:text-6xl font-bold leading-tight">Find Clarity. Discover Your Path.</h1>
            <p className="max-w-2xl mx-auto text-sm sm:text-lg text-emerald-50">Connect personally with experienced astrologers for guidance on love, relationships, career and life decisions.</p>
            <button onClick={scrollToAstrologers} className="px-7 py-3 rounded-full bg-[#e5a024] text-slate-950 font-bold shadow-lg">Explore Astrologers ↓</button>
          </div>
        </section>
        <AstrologerSection onConnectAstrologer={connectAstrologer} onGeneralConnect={() => connectAstrologer(ASTROLOGERS[0], 'chat')} />
      </main>
      <footer className="bg-[#123824] text-emerald-50 text-center py-6 text-xs">© {new Date().getFullYear()} GauKripa • Astrology &amp; Personal Guidance</footer>
      <AstrologerConsultationModal astrologer={activeAstrologer} initialMode={astroMode} isOpen={astroModalOpen} onClose={() => setAstroModalOpen(false)} customerPhone={currentUser?.phone || ''} customerName={currentUser?.name || 'Customer'} />
      <AuthModal isOpen={authModalOpen} onClose={() => { setAuthModalOpen(false); setAuthPromptMessage(null); }} currentUser={currentUser} onLogin={handleLogin} onLogout={logout} onOpenAdmin={isSuperAdmin ? () => { setAuthModalOpen(false); setCurrentView('admin'); } : undefined} onOpenAstrologer={isSuperAdmin ? () => { setAuthModalOpen(false); setCurrentView('astrologer'); } : undefined} customMessage={authPromptMessage} />
    </div>
  );
}
