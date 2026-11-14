import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  Users,
  CalendarCheck2,
  DollarSign,
  Tag,
  Star,
  Plus,
  Edit,
  Trash2,
  Upload,
  CheckCircle,
  XCircle,
  Video,
  Image as ImageIcon,
  MessageSquare,
  ShieldAlert,
  ArrowLeft,
  Search,
  ExternalLink,
  Save,
  Check,
  Percent,
  RefreshCw,
  Languages
} from 'lucide-react';
import { api, ServiceItem, AstrologerItem, BookingRecord, AppSettings, ReviewItem } from '../../services/api';
import { ImageCrop } from '../ImageCrop';
import { useLanguage } from '../../i18n/LanguageContext';

interface AdminDashboardProps {
  onBackToWebsite: () => void;
}

type AdminTab = 'overview' | 'services' | 'astrologers' | 'bookings' | 'pricing' | 'reviews' | 'customers';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToWebsite }) => {
  const { lang, setLang, tr } = useLanguage();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [confirmDeleteServiceId, setConfirmDeleteServiceId] = useState<string | null>(null);

  // Data states
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [astrologers, setAstrologers] = useState<AstrologerItem[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    projectId: string;
    databaseId?: string;
    collections?: Record<string, number>;
  } | null>(null);

  // Modals & form states
  const [editingService, setEditingService] = useState<Partial<ServiceItem> | null>(null);
  const [isNewService, setIsNewService] = useState<boolean>(false);
  const [uploadingServiceImageId, setUploadingServiceImageId] = useState<string | null>(null);

  const [editingAstro, setEditingAstro] = useState<Partial<AstrologerItem> | null>(null);
  const [isNewAstro, setIsNewAstro] = useState<boolean>(false);

  const [proofModalBooking, setProofModalBooking] = useState<BookingRecord | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState<string>('');
  const [priestNameInput, setPriestNameInput] = useState<string>('Pandit Radheshyam Shastri');

  // Search & Filter
  const [bookingFilter, setBookingFilter] = useState<'all' | 'confirmed' | 'in_progress' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [srv, ast, bkg, set, rev, dbs] = await Promise.all([
        api.getServices(true),
        api.getAstrologers(),
        api.getBookings(),
        api.getSettings(),
        api.getReviews(),
        api.getDatabaseStatus(),
      ]);
      setServices(srv);
      setAstrologers(ast);
      setBookings(bkg);
      setSettings(set);
      setReviews(rev);
      setDbStatus(dbs);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Total metrics
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
  const completedBookings = bookings.filter((b) => b.status === 'completed').length;
  const activeAstros = astrologers.filter((a) => a.isOnline).length;

  // Handlers for Services
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    try {
      if (isNewService) {
        await api.createService(editingService);
        showNotification(tr('नई सेवा सफलतापूर्वक बनाई गई!', 'Nayi Seva safaltapoorvak banayi gayi!'));
      } else if (editingService.id) {
        await api.updateService(editingService.id, editingService);
        showNotification(tr('सेवा सफलतापूर्वक अपडेट की गई!', 'Seva safaltapoorvak update ho gayi!'));
      }
      setEditingService(null);
      await loadAllData();
    } catch (err) {
      console.error(err);
      showNotification(tr('सेवा सहेजने में विफल रहा', 'Seva save karne mein samasya aayi'));
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await api.deleteService(id);
      setConfirmDeleteServiceId(null);
      showNotification(tr('सेवा हटा दी गई', 'Seva hata di gayi'));
      await loadAllData();
    } catch (err) {
      console.error(err);
      showNotification(tr('सेवा हटाने में त्रुटि हुई', 'Seva hatane mein samasya aayi'));
    }
  };

  const handleToggleServiceActive = async (s: ServiceItem) => {
    try {
      await api.updateService(s.id, { isActive: !s.isActive });
      showNotification(
        !s.isActive
          ? tr('सेवा सक्रिय कर दी गई', 'Seva Chalu Ki Gayi')
          : tr('सेवा निष्क्रिय कर दी गई', 'Seva Band Ki Gayi')
      );
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Astrologers
  const handleSaveAstrologer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAstro) return;
    try {
      if (isNewAstro) {
        await api.createAstrologer(editingAstro);
        showNotification(tr('ज्योतिषाचार्य सफलतापूर्वक जोड़े गए!', 'Jyotishacharya safaltapoorvak jode gaye!'));
      } else if (editingAstro.id) {
        await api.updateAstrologer(editingAstro.id, editingAstro);
        showNotification(tr('ज्योतिषाचार्य प्रोफ़ाइल अपडेट हो गई!', 'Jyotishacharya profile update ho gayi!'));
      }
      setEditingAstro(null);
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAstroOnline = async (astro: AstrologerItem) => {
    try {
      await api.setAstrologerAvailability(astro.id, !astro.isOnline);
      showNotification(
        `${astro.name} ${!astro.isOnline ? tr('अब ऑनलाइन हैं', 'ab ONLINE hain') : tr('अब ऑफ़लाइन हैं', 'ab OFFLINE hain')}`
      );
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Booking Status & Proof
  const handleUpdateStatus = async (bookingId: string, status: BookingRecord['status']) => {
    try {
      await api.updateBookingStatus(bookingId, status);
      showNotification(tr(`बुकिंग स्थिति अपडेट: ${status.toUpperCase()}`, `Booking sthiti update: ${status.toUpperCase()}`));
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProof = async () => {
    if (!proofModalBooking) return;
    try {
      await api.uploadBookingProof(proofModalBooking.id, {
        videoProofUrl: videoUrlInput || 'https://assets.mixkit.co/videos/preview/mixkit-cows-in-a-field-grazing-43283-large.mp4',
        priestName: priestNameInput,
        status: 'completed',
      });
      showNotification(
        tr(
          'वीडियो प्रमाण अपलोड हो गया और सेवा पूर्ण चिह्नित हुई! व्हाट्सएप सूचना कतारबद्ध है।',
          'Video proof upload ho gaya aur seva poorn ho gayi! WhatsApp suchna bheji ja rahi hai.'
        )
      );
      setProofModalBooking(null);
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.updateSettings(settings);
      showNotification(tr('मूल्य और छूट नियम सफलतापूर्वक अपडेट हुए!', 'Shulk aur Chhoot niyam safaltapoorvak update hue!'));
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Image Upload helper for services or astrologers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'service' | 'astrologer') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await api.uploadMediaFile(file);
      if (target === 'service' && editingService) {
        setEditingService({ ...editingService, customImageUrl: url });
      } else if (target === 'astrologer' && editingAstro) {
        setEditingAstro({ ...editingAstro, customImageUrl: url });
      }
      showNotification(tr('मीडिया फ़ाइल सफलतापूर्वक अपलोड हो गई!', 'Photo/Media file safaltapoorvak upload ho gayi!'));
    } catch (err: any) {
      showNotification(tr('अपलोड विफल: ', 'Upload fail hua: ') + err.message);
    }
  };

  // Direct Quick Image Upload from Seva Service card (immediately reflects on website)
  const handleQuickServiceImageUpload = async (serviceId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadingServiceImageId(serviceId);
    try {
      const url = await api.uploadMediaFile(file);
      await api.updateService(serviceId, { customImageUrl: url });
      showNotification(tr('सेवा की फ़ोटो अपडेट हो गई! वेबसाइट पर तुरंत दिखाई देगी।', 'Seva ki photo update ho gayi! Website par turant dikhegi.'));
      await loadAllData();
    } catch (err: any) {
      showNotification(tr('फ़ोटो अपलोड विफल: ', 'Photo upload fail hua: ') + (err?.message || 'Error'));
    } finally {
      setUploadingServiceImageId(null);
    }
  };

  const handleResetServiceImage = async (serviceId: string) => {
    setUploadingServiceImageId(serviceId);
    try {
      await api.updateService(serviceId, { customImageUrl: '' });
      showNotification(tr('डिफ़ॉल्ट फ़ोटो पुनर्स्थापित की गई।', 'Default photo wapas laga di gayi hai.'));
      await loadAllData();
    } catch (err: any) {
      showNotification(tr('रीसेट विफल: ', 'Reset fail hua: ') + (err?.message || 'Error'));
    } finally {
      setUploadingServiceImageId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    const matchesFilter = bookingFilter === 'all' || b.status === bookingFilter;
    const matchesSearch =
      b.devoteeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.phone.includes(searchQuery) ||
      b.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.sevaTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#fcf9f2] text-[#2c332d] flex flex-col font-sans">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-[#1b4b32] text-amber-200 px-5 py-3 rounded-2xl shadow-2xl border border-amber-300/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-xs sm:text-sm font-semibold">{notification}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-[#1b4b32] text-white border-b border-[#296344] sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToWebsite}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{tr('वेबसाइट पर वापस जाएं', 'Website par Wapas Jayein')}</span>
            </button>
            <div className="h-6 w-px bg-emerald-800" />
            <div className="flex items-center gap-2">
              <span className="text-lg">卐</span>
              <h1 className="font-playfair text-lg sm:text-xl font-bold text-amber-200 tracking-wide">
                {tr('गौकृपा व्यवस्थापक कंसोल', 'GauKripa Admin Console')}
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold uppercase tracking-wider">
                {tr('सुपर एडमिन', 'Super Admin')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="inline-flex items-center rounded-full bg-white/10 border border-white/20 p-0.5 text-[11px] font-bold">
              <Languages className="w-3.5 h-3.5 text-amber-300 ml-2 mr-1" />
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`px-2 py-1 rounded-full transition-all cursor-pointer ${
                  lang === 'hi' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-amber-100 hover:text-white'
                }`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-1 rounded-full transition-all cursor-pointer ${
                  lang === 'en' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-amber-100 hover:text-white'
                }`}
                title="Hinglish mein dekhein (English)"
              >
                EN
              </button>
            </div>

            <button
              onClick={loadAllData}
              title={tr('डेटा रीफ़्रेश करें', 'Data Refresh Karein')}
              className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-amber-100">{tr('श्री हर्ष भारद्वाज', 'Shri Harsh Bhardwaj')}</div>
              <div className="text-[10px] text-emerald-300">{tr('गौकृपा केंद्रीय नियंत्रण', 'GauKripa Kendriya Niyantran')}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col md:flex-row gap-6">
        
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-1 bg-[#fffdf8] p-3 rounded-2xl border border-[#ebdcb9] shadow-xs self-start">
          <div className="px-3 py-2 text-[10px] font-bold text-[#887864] uppercase tracking-wider">
            {tr('प्रबंधन मॉड्यूल', 'Prabandhan Modules')}
          </div>

          {[
            { id: 'overview', label: tr('सारांश एवं विश्लेषण', 'Saransh aur Vishleshan'), icon: LayoutDashboard },
            { id: 'services', label: tr('गौमाता आहार सेवाएं', 'Gaumata Aahar Seva'), icon: Sparkles },
            { id: 'astrologers', label: tr('ज्योतिषाचार्य पैनल', 'Jyotishacharya Panel'), icon: Users },
            { id: 'bookings', label: tr('बुकिंग एवं वीडियो प्रमाण', 'Booking aur Video Proof'), icon: CalendarCheck2 },
            { id: 'pricing', label: tr('शुल्क एवं 50% छूट नियम', 'Shulk aur 50% Chhoot Niyam'), icon: Percent },
            { id: 'reviews', label: tr('श्रद्धालु समीक्षाएं', 'Bhakt Samikshayein'), icon: Star },
            { id: 'customers', label: tr('ग्राहक वॉलेट', 'Bhakt Wallets'), icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1b4b32] text-amber-200 shadow-xs'
                    : 'text-[#483c2e] hover:bg-[#f6eee0]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-300' : 'text-[#887864]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-[#ebdcb9] px-3 space-y-1.5">
            <div className="text-[11px] text-[#786a55] font-semibold">{tr('लाइव सिस्टम स्थिति:', 'Live System Sthiti:')}</div>
            <div className="flex items-center gap-2 text-xs text-emerald-800 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{tr('Express API सर्वर (3000)', 'Express API Server (3000)')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <span className={`w-2 h-2 rounded-full ${dbStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
              <span>
                {tr('Supabase PostgreSQL:', 'Supabase PostgreSQL:')}{' '}
                {dbStatus?.connected ? tr('कनेक्टेड', 'Connected') : tr('कनेक्ट हो रहा है...', 'Connect ho raha hai...')}
              </span>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 bg-[#fffdfa] rounded-2xl border border-[#ebdcb9] p-5 sm:p-6 shadow-xs min-h-[600px] overflow-hidden">
          
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#1b4b32] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#71614e] font-semibold">{tr('गौकृपा कंसोल डेटा लोड हो रहा है...', 'GauKripa Console Data load ho raha hai...')}</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW & ANALYTICS */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  
                  {/* Cloud Database Connected Banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1b4b32] to-[#255e40] text-white border border-[#377755] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shrink-0">
                        ⚡
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-amber-200">{tr('Supabase PostgreSQL कनेक्टेड', 'Supabase PostgreSQL Connected')}</h3>
                          <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {tr('लाइव डेटाबेस', 'Live Database')}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-100/90 mt-0.5">
                          {tr('प्रोजेक्ट:', 'Project:')} <code className="text-amber-300 font-mono text-[11px]">{dbStatus?.projectId || 'supabase'}</code> &bull; {tr('डेटाबेस:', 'Database:')} <code className="text-emerald-200 font-mono text-[11px]">{dbStatus?.databaseId || 'PostgreSQL (RLS)'}</code>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-semibold text-emerald-200 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                        {tr('सिंक: स्थायी क्लाउड', 'Sync: Surakshit Cloud')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#1b4b32]">
                        {tr('डैशबोर्ड सारांश', 'Dashboard Saransh')}
                      </h2>
                      <p className="text-xs text-[#71614e]">
                        {tr('रियल-टाइम सेवा शुल्क, सक्रिय ज्योतिषाचार्य और गौ-आहार सेवा वितरण आँकड़े।', 'Real-time seva shulk, sakriya jyotishacharya aur Gau Seva vitaran ke aankde.')}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      {tr('ऑटो-सिंक सक्रिय', 'Auto-sync Chalu')}
                    </span>
                  </div>

                  {/* Top Stats 4 Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-2xl bg-[#fcf8ee] border border-[#ebdcb9] space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#786a55]">
                        <span>{tr('कुल सेवा शुल्क', 'Kul Seva Shulk')}</span>
                        <DollarSign className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="text-2xl font-black text-[#1b4b32]">₹{totalRevenue.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-emerald-700 font-bold">{tr('100% सत्यापित UPI/बैंक भुगतान', '100% Satyapit Bank/UPI')}</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#fcf8ee] border border-[#ebdcb9] space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#786a55]">
                        <span>{tr('कुल सेवा संकल्प', 'Kul Seva Sankalp')}</span>
                        <CalendarCheck2 className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="text-2xl font-black text-[#1b4b32]">{bookings.length}</div>
                      <div className="text-[10px] text-emerald-700 font-bold">{completedBookings} {tr('वीडियो प्रमाण सहित पूर्ण', 'Video Proof ke Saath Poorn')}</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#fcf8ee] border border-[#ebdcb9] space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#786a55]">
                        <span>{tr('सक्रिय ज्योतिषाचार्य', 'Sakriya Jyotishacharya')}</span>
                        <Users className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="text-2xl font-black text-[#1b4b32]">{activeAstros} / {astrologers.length}</div>
                      <div className="text-[10px] text-emerald-700 font-bold">{tr('लाइव परामर्श हेतु उपलब्ध', 'Live Paramarsh ke Liye Taiyar')}</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#fcf8ee] border border-[#ebdcb9] space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#786a55]">
                        <span>{tr('सक्रिय सेवाएं', 'Sakriya Seva')}</span>
                        <Sparkles className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="text-2xl font-black text-[#1b4b32]">{services.filter((s) => s.isActive).length}</div>
                      <div className="text-[10px] text-amber-800 font-bold">{tr('गौमाता, पक्षी, चींटी, श्वान आहार', 'Gaumata, Pakshi, Cheenti, Shwan')}</div>
                    </div>
                  </div>

                  {/* Recent Bookings Quick Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-playfair text-base font-bold text-[#1b4b32]">
                        {tr('हाल के श्रद्धालु संकल्प', 'Haal ke Bhakt Sankalp')}
                      </h3>
                      <button
                        onClick={() => setActiveTab('bookings')}
                        className="text-xs font-bold text-[#1b4b32] hover:underline cursor-pointer"
                      >
                        {tr('सभी बुकिंग देखें →', 'Sabhi Bookings Dekhein →')}
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-[#ebdcb9]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#fbf4e2] text-[#483c2e] font-bold border-b border-[#ebdcb9]">
                          <tr>
                            <th className="p-3">{tr('बुकिंग आईडी', 'Booking ID')}</th>
                            <th className="p-3">{tr('श्रद्धालु', 'Bhakt')}</th>
                            <th className="p-3">{tr('सेवा का नाम', 'Seva ka Naam')}</th>
                            <th className="p-3">{tr('सेवा शुल्क', 'Seva Shulk')}</th>
                            <th className="p-3">{tr('स्थिति', 'Sthiti')}</th>
                            <th className="p-3">{tr('वीडियो प्रमाण', 'Video Proof')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f2e5cc]">
                          {bookings.slice(0, 5).map((b) => (
                            <tr key={b.id} className="hover:bg-[#fcf9f2]">
                              <td className="p-3 font-mono font-bold text-[#8b6f38]">{b.bookingId}</td>
                              <td className="p-3">
                                <div className="font-bold text-[#29352c]">{b.devoteeName}</div>
                                <div className="text-[10px] text-[#71614e]">+91 {b.phone} • {tr('गोत्र:', 'Gotra:')} {b.gotra}</div>
                              </td>
                              <td className="p-3 font-medium text-[#1b4b32]">{b.sevaTitle}</td>
                              <td className="p-3 font-bold text-[#1b4b32]">₹{b.amount}</td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    b.status === 'completed'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : b.status === 'in_progress'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {b.status === 'completed'
                                    ? tr('पूर्ण', 'Poorn')
                                    : b.status === 'in_progress'
                                    ? tr('प्रगति पर', 'Pragati Par')
                                    : tr('पुष्ट', 'Pusht')}
                                </span>
                              </td>
                              <td className="p-3">
                                {b.videoProofUrl ? (
                                  <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                                    <Video className="w-3.5 h-3.5" /> {tr('व्हाट्सएप पर भेजा गया', 'WhatsApp par Bheja Gaya')}
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setProofModalBooking(b);
                                      setVideoUrlInput('');
                                    }}
                                    className="text-[11px] font-bold text-amber-700 underline cursor-pointer"
                                  >
                                    {tr('+ प्रमाण अपलोड करें', '+ Proof Upload Karein')}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SERVICES MANAGEMENT */}
              {activeTab === 'services' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#1b4b32]">
                        {tr('गौमाता आहार एवं सेवा प्रबंधन', 'Gaumata Aahar aur Seva Prabandhan')}
                      </h2>
                      <p className="text-xs text-[#71614e]">
                        {tr('सेवाओं के शुल्क, विवरण, ग्रह-दोष लाभ जोड़ें/संपादित करें और वास्तविक सेवा फोटो बदलें।', 'Sevaon ke shulk, vivaran, grah-dosh labh jodein/badlein aur asli seva photo upload karein.')}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setIsNewService(true);
                        setEditingService({
                          title: '',
                          basePrice: 151,
                          priceDisplay: '₹151',
                          planet: 'Surya Grah',
                          planetTag: '☀️ Surya Grah',
                          unit: 'lot',
                          benefit: '',
                          detailedDescription: '',
                          vedicSignificance: '',
                          isActive: true,
                          category: 'cow',
                        });
                      }}
                      className="px-4 py-2 rounded-full bg-[#1b4b32] hover:bg-[#153e29] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{tr('नई सेवा जोड़ें', 'Nayi Seva Jodein')}</span>
                    </button>
                  </div>

                  {/* Services Grid Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map((s) => (
                      <div
                        key={s.id}
                        className={`rounded-2xl border p-4 space-y-3 flex flex-col justify-between transition-all ${
                          s.isActive
                            ? 'bg-[#fffdf9] border-[#ebdcb9] shadow-xs'
                            : 'bg-gray-50 border-gray-200 opacity-60'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#faedd0] text-[#6d460d] border border-[#d6ba7f]">
                              {s.planetTag}
                            </span>
                            <div className="flex items-center gap-1">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  s.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {s.isActive ? tr('सक्रिय', 'Sakriya') : tr('निष्क्रिय', 'Band')}
                              </span>
                            </div>
                          </div>

                          <div className="h-32 rounded-xl overflow-hidden bg-amber-50 relative border border-[#ebdcb9] group">
                            {s.customImageUrl ? (
                              <img src={s.customImageUrl} alt={s.title} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            ) : (
                              <ImageCrop cropKey={s.cropKey} className="w-full h-full object-cover" alt={s.title} />
                            )}
                            <label
                              className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1b4b32]/90 hover:bg-[#153e29] text-white text-[10px] font-bold shadow-md cursor-pointer backdrop-blur-xs"
                              title={tr('वेबसाइट पर सेवा फ़ोटो बदलें', 'Website par Seva photo badlein')}
                            >
                              <Upload className="w-3 h-3 text-amber-300" />
                              <span>
                                {uploadingServiceImageId === s.id
                                  ? tr('अपलोड हो रहा है...', 'Upload ho raha hai...')
                                  : tr('फ़ोटो बदलें', 'Photo Badlein')}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                disabled={uploadingServiceImageId === s.id}
                                onChange={(e) => handleQuickServiceImageUpload(s.id, e)}
                                className="hidden"
                              />
                            </label>
                            {s.customImageUrl && (
                              <button
                                type="button"
                                onClick={() => handleResetServiceImage(s.id)}
                                className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-white/90 hover:bg-white text-[#6d460d] border border-[#d6ba7f] text-[10px] font-bold shadow-xs cursor-pointer"
                              >
                                {tr('रीसेट', 'Reset')}
                              </button>
                            )}
                          </div>

                          <div>
                            <h3 className="font-playfair text-base font-bold text-[#1b4b32]">{s.title}</h3>
                            <div className="text-sm font-black text-[#8b5a0a]">{s.priceDisplay} ({tr('आधार:', 'Aadhar:')} ₹{s.basePrice})</div>
                            <p className="text-xs text-[#524434] line-clamp-2 mt-1">{s.benefit}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-2 border-t border-[#ebdcb9] flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleToggleServiceActive(s)}
                            className={`text-[11px] font-bold px-2 py-1 rounded-lg border cursor-pointer ${
                              s.isActive ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                            }`}
                          >
                            {s.isActive ? tr('निष्क्रिय करें', 'Band Karein') : tr('सक्रिय करें', 'Chalu Karein')}
                          </button>

                          {confirmDeleteServiceId === s.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteService(s.id)}
                                className="px-2 py-1 rounded-lg bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 cursor-pointer"
                              >
                                {tr('हटाएं?', 'Hatayein?')}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteServiceId(null)}
                                className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold hover:bg-slate-200 cursor-pointer"
                              >
                                {tr('रद्द', 'Radd')}
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setIsNewService(false);
                                  setEditingService({ ...s });
                                }}
                                className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                                title={tr('सेवा संपादित करें', 'Seva Edit Karein')}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteServiceId(s.id)}
                                className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer"
                                title={tr('सेवा हटाएं', 'Seva Hatayein')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: ASTROLOGER MANAGEMENT */}
              {activeTab === 'astrologers' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#1b4b32]">
                        {tr('ज्योतिषाचार्य प्रोफ़ाइल एवं परामर्श', 'Jyotishacharya Profile aur Paramarsh')}
                      </h2>
                      <p className="text-xs text-[#71614e]">
                        {tr('ज्योतिषाचार्यों का परिचय, परामर्श शुल्क, फोटो और लाइव ऑनलाइन/ऑफ़लाइन स्थिति प्रबंधित करें।', 'Jyotishacharyon ka parichay, paramarsh shulk, photo aur live online/offline sthiti manage karein.')}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setIsNewAstro(true);
                        setEditingAstro({
                          name: '',
                          title: 'Vedic Astrologer & Tarot Guide',
                          experience: '10+ Years Experience',
                          ratePerMin: 20,
                          rating: 4.9,
                          languages: ['Hindi', 'English'],
                          specializations: ['Kundali Analysis', 'Grah Shanti'],
                          bio: '',
                          isOnline: true,
                        });
                      }}
                      className="px-4 py-2 rounded-full bg-[#1b4b32] hover:bg-[#153e29] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{tr('नए ज्योतिषाचार्य जोड़ें', 'Naye Jyotishacharya Jodein')}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {astrologers.map((a) => (
                      <div
                        key={a.id}
                        className="bg-[#fffdf9] border border-[#ebdcb9] rounded-2xl p-4 shadow-xs space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#d9ba78] shrink-0 bg-amber-50">
                              {a.customImageUrl ? (
                                <img src={a.customImageUrl} alt={a.name} className="w-full h-full object-cover" />
                              ) : (
                                <ImageCrop cropKey={a.cropKey} className="w-full h-full object-cover" alt={a.name} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-playfair text-base font-bold text-[#1b4b32] truncate">{a.name}</h3>
                              <p className="text-xs text-[#71614e] font-medium">{a.title}</p>
                              <div className="flex items-center gap-2 text-[11px] text-[#8b5a0a] font-bold">
                                <span>₹{a.ratePerMin} / {tr('मिनट', 'min')}</span>
                                <span>•</span>
                                <span>⭐ {a.rating}</span>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-[#524434] line-clamp-2">{a.bio}</p>

                          <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#fcf6e8] border border-[#ebdcb9]">
                            <span className="font-semibold text-[#6d5b43]">{tr('लाइव उपलब्धता:', 'Live Uplabdhata:')}</span>
                            <button
                              onClick={() => handleToggleAstroOnline(a)}
                              className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                                a.isOnline
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'bg-red-600 text-white shadow-2xs'
                              }`}
                            >
                              {a.isOnline ? tr('🟢 ऑनलाइन', '🟢 ONLINE') : tr('🔴 ऑफ़लाइन', '🔴 OFFLINE')}
                            </button>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#ebdcb9] flex items-center justify-between">
                          <div className="text-[11px] text-[#71614e]">
                            <strong>{a.totalConsultations}</strong> {tr('परामर्श', 'paramarsh')} • <strong>₹{a.totalEarnings}</strong> {tr('अर्जित', 'kamayi')}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setIsNewAstro(false);
                                setEditingAstro({ ...a });
                              }}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                              title={tr('ज्योतिषाचार्य संपादित करें', 'Jyotishacharya Edit Karein')}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: BOOKINGS & PROOF MANAGEMENT */}
              {activeTab === 'bookings' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#1b4b32]">
                        {tr('श्रद्धालु सेवा बुकिंग एवं वीडियो प्रमाण', 'Shraddhalu Seva Booking aur Video Proof')}
                      </h2>
                      <p className="text-xs text-[#71614e]">
                        {tr('संकल्प स्थिति ट्रैक करें, वैदिक गौशाला पुरोहित नियुक्त करें, और वास्तविक वीडियो व फोटो प्रमाण अपलोड करें।', 'Sankalp status track karein, Vedic goshala purohit niyukt karein aur asli video/photo proof upload karein.')}
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1 bg-[#f4ebd5] p-1 rounded-xl text-xs font-semibold">
                      {(['all', 'confirmed', 'in_progress', 'completed'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setBookingFilter(st)}
                          className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                            bookingFilter === st ? 'bg-[#1b4b32] text-white font-bold' : 'text-[#5a4c3c]'
                          }`}
                        >
                          {st === 'all'
                            ? tr('सभी', 'Sabhi')
                            : st === 'confirmed'
                            ? tr('पुष्ट', 'Confirmed')
                            : st === 'in_progress'
                            ? tr('प्रगति पर', 'Chalu Hai')
                            : tr('पूर्ण', 'Poorn')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#8b7964] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder={tr('श्रद्धालु का नाम, फ़ोन नंबर, गोत्र या सेवा के नाम से खोजें...', 'Shraddhalu ka naam, phone number, gotra ya seva se khojein...')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffdf9] text-xs font-medium focus:outline-hidden focus:border-[#1b4b32]"
                    />
                  </div>

                  {/* Bookings Table */}
                  <div className="overflow-x-auto rounded-2xl border border-[#ebdcb9] bg-[#fffdf9]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#fbf4e2] text-[#483c2e] font-bold border-b border-[#ebdcb9]">
                        <tr>
                          <th className="p-3">{tr('बुकिंग आईडी', 'Booking ID')}</th>
                          <th className="p-3">{tr('श्रद्धालु विवरण', 'Shraddhalu Details')}</th>
                          <th className="p-3">{tr('सेवा एवं अवधि', 'Seva aur Avadhi')}</th>
                          <th className="p-3">{tr('अवसर', 'Avsar')}</th>
                          <th className="p-3">{tr('सेवा शुल्क', 'Seva Shulk')}</th>
                          <th className="p-3">{tr('स्थिति', 'Status')}</th>
                          <th className="p-3">{tr('प्रमाण एवं व्हाट्सएप', 'Proof aur WhatsApp')}</th>
                          <th className="p-3 text-right">{tr('कार्रवाई', 'Action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f2e5cc]">
                        {filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-[#fcf9f2]">
                            <td className="p-3 font-mono font-bold text-[#8b6f38]">{b.bookingId}</td>
                            <td className="p-3">
                              <div className="font-bold text-[#1b4b32]">{b.devoteeName}</div>
                              <div className="text-[10px] text-[#71614e]">+91 {b.phone}</div>
                              <div className="text-[10px] text-[#8b7355]">{tr('गोत्र:', 'Gotra:')} {b.gotra}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-[#2d3a31]">{b.sevaTitle}</div>
                              <div className="text-[10px] text-[#71614e]">{b.duration}</div>
                              <div className="text-[10px] text-emerald-800 font-medium">📍 {b.goshala}</div>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-md bg-[#f6eee0] text-[#524434] text-[10px] font-semibold">
                                {b.occasion}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-[#1b4b32]">₹{b.amount}</div>
                              {b.extraFee > 0 && (
                                <span className="text-[9px] text-[#c4821a] font-bold block">{tr('+₹21 विशेष अवसर', '+₹21 Vishesh Avsar')}</span>
                              )}
                            </td>
                            <td className="p-3">
                              <select
                                value={b.status}
                                onChange={(e) => handleUpdateStatus(b.id, e.target.value as any)}
                                className="px-2 py-1 rounded-lg border border-[#ebdcb9] text-[10px] font-bold bg-white"
                              >
                                <option value="confirmed">{tr('पुष्ट (Confirmed)', 'Pusht (Confirmed)')}</option>
                                <option value="in_progress">{tr('प्रगति पर (In Progress)', 'Pragati Par (In Progress)')}</option>
                                <option value="completed">{tr('पूर्ण (Completed)', 'Poorn (Completed)')}</option>
                                <option value="cancelled">{tr('रद्द (Cancelled)', 'Radd (Cancelled)')}</option>
                              </select>
                            </td>
                            <td className="p-3">
                              {b.videoProofUrl ? (
                                <div className="space-y-0.5">
                                  <a
                                    href={b.videoProofUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] text-emerald-700 font-bold underline flex items-center gap-1"
                                  >
                                    <Video className="w-3.5 h-3.5" /> {tr('वीडियो देखें', 'Video Dekhein')}
                                  </a>
                                  <span className="text-[9px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold block">
                                    {tr('व्हाट्सएप पर भेजा गया ✓', 'WhatsApp Par Bheja Gaya ✓')}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-amber-800 italic">{tr('अपलोड लंबित', 'Upload Baaki Hai')}</span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => {
                                  setProofModalBooking(b);
                                  setVideoUrlInput(b.videoProofUrl || '');
                                  setPriestNameInput(b.priestName || 'Pandit Radheshyam Shastri');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-[#1b4b32] text-white text-[11px] font-bold hover:bg-[#153e29] cursor-pointer inline-flex items-center gap-1"
                              >
                                <Upload className="w-3 h-3" />
                                <span>{tr('प्रमाण अपलोड करें', 'Proof Upload Karein')}</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: PRICING & 50% DISCOUNT RULES */}
              {activeTab === 'pricing' && settings && (
                <div className="max-w-2xl space-y-6">
                  <div>
                    <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#1b4b32]">
                      {tr('शुल्क, छूट एवं प्रचार बैनर', 'Shulk, Chhoot aur Prachar Banner')}
                    </h2>
                    <p className="text-xs text-[#71614e]">
                      {tr('ज्योतिषाचार्य प्रति-मिनट दरें, सेवा छूट नियम और विशेष अवसर शुल्क निर्धारित करें।', 'Jyotishacharya per-minute rate, seva chhoot niyam aur vishesh avsar shulk set karein.')}
                    </p>
                  </div>

                  <form onSubmit={handleSaveSettings} className="space-y-4 bg-[#fffdf9] p-5 rounded-2xl border border-[#ebdcb9]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#453728] mb-1">
                          {tr('मानक ज्योतिषाचार्य शुल्क (₹ / मिनट)', 'Samanya Jyotishacharya Shulk (₹ / min)')}
                        </label>
                        <input
                          type="number"
                          value={settings.standardRatePerMin}
                          onChange={(e) => setSettings({ ...settings, standardRatePerMin: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-bold focus:outline-hidden focus:border-[#1b4b32]"
                        />
                        <span className="text-[10px] text-[#786a55]">{tr('पूर्ण गौ-सेवा रहित श्रद्धालुओं के लिए सामान्य दर।', 'Bina Gau-Seva wale shraddhaluon ke liye samanya rate.')}</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#453728] mb-1">
                          {tr('रियायती ज्योतिषाचार्य शुल्क (₹ / मिनट)', 'Chhoot Wala Jyotish Shulk (₹ / min)')}
                        </label>
                        <input
                          type="number"
                          value={settings.discountedRatePerMin}
                          onChange={(e) => setSettings({ ...settings, discountedRatePerMin: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-bold text-emerald-800 focus:outline-hidden focus:border-[#1b4b32]"
                        />
                        <span className="text-[10px] text-emerald-700 font-medium">{tr('सेवा संकल्प के पश्चात 50% छूट दर।', 'Seva sankalp ke baad 50% chhoot wala rate.')}</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#453728] mb-1">
                          {tr('विशेष अवसर अतिरिक्त शुल्क (₹)', 'Vishesh Avsar Extra Shulk (₹)')}
                        </label>
                        <input
                          type="number"
                          value={settings.extraOccasionFee}
                          onChange={(e) => setSettings({ ...settings, extraOccasionFee: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-bold focus:outline-hidden focus:border-[#1b4b32]"
                        />
                        <span className="text-[10px] text-[#786a55]">{tr('विशेष अवसर चुनने पर जोड़ा जाने वाला शुल्क।', 'Vishesh avsar chunne par joda jaane wala shulk.')}</span>
                      </div>

                      <div className="flex flex-col justify-center">
                        <label className="flex items-center gap-2 cursor-pointer pt-3">
                          <input
                            type="checkbox"
                            checked={settings.discountEnabled}
                            onChange={(e) => setSettings({ ...settings, discountEnabled: e.target.checked })}
                            className="w-4 h-4 text-[#1b4b32] rounded-md"
                          />
                          <span className="text-xs font-bold text-[#1b4b32]">
                            {tr('50% ज्योतिषाचार्य छूट नियम सक्रिय करें', '50% Jyotishacharya Chhoot Niyam Chalu Karein')}
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#ebdcb9] space-y-2">
                      <label className="block text-xs font-bold text-[#453728]">
                        {tr('प्रचार ऑफ़र बैनर संदेश', 'Prachar Offer Banner Sandesh')}
                      </label>
                      <input
                        type="text"
                        value={settings.promoBannerText}
                        onChange={(e) => setSettings({ ...settings, promoBannerText: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium focus:outline-hidden focus:border-[#1b4b32]"
                      />
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.bannerEnabled}
                          onChange={(e) => setSettings({ ...settings, bannerEnabled: e.target.checked })}
                          className="w-4 h-4 text-[#1b4b32] rounded-md"
                        />
                        <span className="text-xs text-[#524434] font-medium">{tr('होमपेज पर बैनर प्रदर्शित करें', 'Homepage par banner dikhayein')}</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full bg-[#1b4b32] text-white font-bold text-xs flex items-center gap-2 shadow-xs hover:bg-[#153e29] cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{tr('शुल्क एवं छूट विन्यास सहेजें', 'Shulk aur Chhoot Settings Save Karein')}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 6: DEVOTEE REVIEWS */}
              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#1b4b32]">
                        {tr('संपूर्ण भारत की श्रद्धालु समीक्षाएं प्रबंधित करें', 'Poore Bharat ki Shraddhalu Reviews Manage Karein')}
                      </h2>
                      <p className="text-xs text-[#71614e]">
                        {tr('वेबसाइट पर प्रदर्शित वास्तविक श्रद्धालु अनुभवों की समीक्षा एवं प्रबंधन करें।', 'Website par dikhne wale asli shraddhalu anubhav aur reviews manage karein.')}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {reviews.map((r) => (
                      <div key={r.id} className="p-3.5 rounded-2xl bg-[#fffdf9] border border-[#ebdcb9] space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-xs text-[#1b4b32]">{r.name}</span>
                            <span className="text-[10px] text-[#786a55] ml-2">📍 {r.city} • {r.seva}</span>
                          </div>
                          <span className="text-amber-500 text-xs">{'★'.repeat(r.stars)}</span>
                        </div>
                        <p className="text-xs italic text-[#483c2e] font-medium">&ldquo;{r.oneLiner}&rdquo;</p>
                        <div className="pt-2 border-t border-[#f2e5cc] flex items-center justify-between">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              r.isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {r.isApproved ? tr('स्वीकृत एवं दृश्यमान', 'Sweekrit aur Dikhai De Raha Hai') : tr('समीक्षा लंबित', 'Review Baaki Hai')}
                          </span>
                          <button
                            onClick={async () => {
                              await api.deleteReview(r.id);
                              showNotification(tr('समीक्षा हटा दी गई', 'Review hata diya gaya'));
                              await loadAllData();
                            }}
                            className="text-red-700 text-xs font-bold hover:underline cursor-pointer"
                          >
                            {tr('हटाएं', 'Hatayein')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: CUSTOMERS & WALLETS */}
              {activeTab === 'customers' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#1b4b32]">
                      {tr('पंजीकृत श्रद्धालु एवं वॉलेट शेष राशि', 'Registered Shraddhalu aur Wallet Balance')}
                    </h2>
                    <p className="text-xs text-[#71614e]">
                      {tr('श्रद्धालु प्रोफ़ाइल, वॉलेट शेष और परामर्श शुल्क कटौती देखें।', 'Shraddhalu profile, wallet balance aur consultation deduction dekhein.')}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#fcf8ee] border border-[#ebdcb9] flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#1b4b32]">{tr('श्री हर्ष भारद्वाज (नमूना श्रद्धालु)', 'Shri Harsh Bhardwaj (Namoona Shraddhalu)')}</h4>
                      <p className="text-xs text-[#71614e]">+91 9876543210 • {tr('गोत्र: कश्यप', 'Gotra: Kashyap')}</p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-1">
                        {tr('50% ज्योतिषाचार्य छूट हेतु पात्र (पूर्ण सेवा सत्यापित)', '50% Jyotish Chhoot ke liye Patra (Poorn Seva Verified)')}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-[#786a55] font-semibold">{tr('वॉलेट शेष', 'Wallet Balance')}</div>
                      <div className="text-2xl font-black text-[#1b4b32]">₹250</div>
                      <div className="text-[10px] text-emerald-700 font-bold">{tr('25 मिनट परामर्श क्रेडिट', '25 minute paramarsh credit')}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </main>
      </div>

      {/* MODAL 1: ADD / EDIT SEVA SERVICE */}
      {editingService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#fffdf9] rounded-3xl max-w-xl w-full border-2 border-[#ebdcb9] shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[#ebdcb9] pb-3">
              <h3 className="font-playfair text-lg font-bold text-[#1b4b32]">
                {isNewService ? tr('नई सेवा जोड़ें', 'Nayi Seva Jodein') : `${tr('संपादित करें:', 'Edit Karein:')} ${editingService.title}`}
              </h3>
              <button onClick={() => setEditingService(null)} className="p-1 text-[#786a55] hover:text-black cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">{tr('सेवा का नाम *', 'Seva ka Naam *')}</label>
                  <input
                    type="text"
                    required
                    value={editingService.title || ''}
                    onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">{tr('आधार सेवा शुल्क (₹) *', 'Aadhar Seva Shulk (₹) *')}</label>
                  <input
                    type="number"
                    required
                    value={editingService.basePrice || 101}
                    onChange={(e) =>
                      setEditingService({
                        ...editingService,
                        basePrice: Number(e.target.value),
                        priceDisplay: `₹${e.target.value}`,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">{tr('प्रदर्शित शुल्क लेबल', 'Dikhne Wala Shulk Label')}</label>
                  <input
                    type="text"
                    value={editingService.priceDisplay || ''}
                    onChange={(e) => setEditingService({ ...editingService, priceDisplay: e.target.value })}
                    placeholder={tr('जैसे ₹251 (5 किग्रा)', 'Jaise ₹251 (5 kg)')}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">{tr('सेवा इकाई', 'Seva Ikai (Unit)')}</label>
                  <input
                    type="text"
                    value={editingService.unit || 'lot'}
                    onChange={(e) => setEditingService({ ...editingService, unit: e.target.value })}
                    placeholder={tr('जैसे 5 किग्रा या थाली', 'Jaise 5 kg ya thali')}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">{tr('ग्रह / देवता संबंध', 'Grah / Devta Sambandh')}</label>
                  <input
                    type="text"
                    value={editingService.planetTag || '☀️ Surya Grah'}
                    onChange={(e) => setEditingService({ ...editingService, planetTag: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">{tr('श्रेणी', 'Shreni (Category)')}</label>
                  <select
                    value={editingService.category || 'cow'}
                    onChange={(e) => setEditingService({ ...editingService, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  >
                    <option value="cow">{tr('गौमाता आहार सेवा', 'Gaumata Aahar Seva')}</option>
                    <option value="bird">{tr('पक्षी दाना व्यवस्था', 'Pakshi Dana Vyavastha')}</option>
                    <option value="ant">{tr('चींटी आटा व्यवस्था', 'Cheenti Aata Vyavastha')}</option>
                    <option value="dog">{tr('श्वान आहार व्यवस्था', 'Shwan Aahar Vyavastha')}</option>
                    <option value="combo">{tr('विशेष उत्सव संयुक्त सेवा', 'Vishesh Utsav Sanyukt Seva')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#453728] mb-1">{tr('आध्यात्मिक लाभ (संक्षिप्त)', 'Adhyatmik Labh (Sankshipt)')}</label>
                <input
                  type="text"
                  value={editingService.benefit || ''}
                  onChange={(e) => setEditingService({ ...editingService, benefit: e.target.value })}
                  placeholder={tr('जैसे सूर्य दोष शांति व आत्मविश्वास में सहायक।', 'Jaise Surya Dosh shanti aur aatmvishwas mein sahayak.')}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#453728] mb-1">{tr('विस्तृत विवरण', 'Poora Vivaran')}</label>
                <textarea
                  rows={2}
                  value={editingService.detailedDescription || ''}
                  onChange={(e) => setEditingService({ ...editingService, detailedDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                />
              </div>

              {/* Upload Real Image */}
              <div className="p-3 rounded-xl bg-[#fcf6ea] border border-[#ebdcb9] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#1b4b32]">
                    {tr('वास्तविक सेवा फोटो अपलोड / बदलें (सीधे वेबसाइट पर दिखेगा)', 'Asli Seva Photo Upload / Badlein (Seedhe Website par Dikhega)')}
                  </label>
                  {editingService.customImageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditingService({ ...editingService, customImageUrl: '' })}
                      className="text-[11px] font-bold text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      {tr('कस्टम फ़ोटो हटाएं', 'Custom Photo Hatayein')}
                    </button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="w-24 h-16 rounded-lg overflow-hidden border border-[#ebdcb9] bg-amber-50 shrink-0">
                    {editingService.customImageUrl ? (
                      <img
                        src={editingService.customImageUrl}
                        alt={editingService.title || 'Preview'}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageCrop
                        cropKey={(editingService.cropKey as any) || 'sevaChara'}
                        className="w-full h-full object-cover"
                        alt={editingService.title || 'Default'}
                      />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'service')}
                      className="text-xs text-[#524434] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#1b4b32] file:text-white hover:file:bg-[#153e29] cursor-pointer"
                    />
                    {editingService.customImageUrl && (
                      <span className="block text-[11px] text-emerald-700 font-bold">
                        {tr('✓ कस्टम फ़ोटो संलग्न — सहेजें पर क्लिक करें', '✓ Custom Photo Jod Di Gayi — Seva Save Karein par click karein')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ebdcb9]">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded-full border border-[#ebdcb9] text-xs font-semibold cursor-pointer"
                >
                  {tr('रद्द करें', 'Radd Karein')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#1b4b32] text-white text-xs font-bold hover:bg-[#153e29] cursor-pointer"
                >
                  {tr('सेवा सहेजें', 'Seva Save Karein')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT ASTROLOGER */}
      {editingAstro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#fffdf9] rounded-3xl max-w-xl w-full border-2 border-[#ebdcb9] shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-[#ebdcb9] pb-3">
              <h3 className="font-playfair text-lg font-bold text-[#1b4b32]">
                {isNewAstro ? tr('नए ज्योतिषाचार्य जोड़ें', 'Naye Jyotishacharya Jodein') : `${tr('संपादित करें:', 'Edit Karein:')} ${editingAstro.name}`}
              </h3>
              <button onClick={() => setEditingAstro(null)} className="p-1 text-[#786a55] hover:text-black cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAstrologer} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">{tr('ज्योतिषाचार्य नाम *', 'Jyotishacharya Naam *')}</label>
                  <input
                    type="text"
                    required
                    value={editingAstro.name || ''}
                    onChange={(e) => setEditingAstro({ ...editingAstro, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">{tr('पद / उपाधि', 'Pad / Visheshagya')}</label>
                  <input
                    type="text"
                    value={editingAstro.title || ''}
                    onChange={(e) => setEditingAstro({ ...editingAstro, title: e.target.value })}
                    placeholder={tr('जैसे वैदिक ज्योतिष एवं वास्तु विशेषज्ञ', 'Jaise Tarot & Vedic Expert')}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">{tr('अनुभव', 'Anubhav')}</label>
                  <input
                    type="text"
                    value={editingAstro.experience || ''}
                    onChange={(e) => setEditingAstro({ ...editingAstro, experience: e.target.value })}
                    placeholder={tr('जैसे 15+ वर्षों का अनुभव', 'Jaise 15+ Saal ka Anubhav')}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">{tr('प्रति मिनट शुल्क (₹) *', 'Prati Minute Shulk (₹) *')}</label>
                  <input
                    type="number"
                    required
                    value={editingAstro.ratePerMin || 20}
                    onChange={(e) => setEditingAstro({ ...editingAstro, ratePerMin: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#453728] mb-1">{tr('परिचय / वैदिक परंपरा', 'Parichay / Vedic Parampara')}</label>
                <textarea
                  rows={2}
                  value={editingAstro.bio || ''}
                  onChange={(e) => setEditingAstro({ ...editingAstro, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                />
              </div>

              {/* Upload Profile Photo */}
              <div className="p-3 rounded-xl bg-[#fcf6ea] border border-[#ebdcb9] space-y-2">
                <label className="block text-xs font-bold text-[#1b4b32]">
                  {tr('ज्योतिषाचार्य प्रोफ़ाइल फ़ोटो अपलोड करें', 'Jyotishacharya Profile Photo Upload Karein')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'astrologer')}
                    className="text-xs text-[#524434] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#1b4b32] file:text-white hover:file:bg-[#153e29]"
                  />
                  {editingAstro.customImageUrl && (
                    <span className="text-[11px] text-emerald-700 font-bold">{tr('✓ कस्टम फ़ोटो संलग्न', '✓ Custom Photo Jod Di Gayi')}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ebdcb9]">
                <button
                  type="button"
                  onClick={() => setEditingAstro(null)}
                  className="px-4 py-2 rounded-full border border-[#ebdcb9] text-xs font-semibold cursor-pointer"
                >
                  {tr('रद्द करें', 'Radd Karein')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#1b4b32] text-white text-xs font-bold hover:bg-[#153e29] cursor-pointer"
                >
                  {tr('ज्योतिषाचार्य सहेजें', 'Jyotishacharya Save Karein')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: UPLOAD REAL VIDEO & PHOTO PROOF */}
      {proofModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#fffdf9] rounded-3xl max-w-lg w-full border-2 border-[#ebdcb9] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#ebdcb9] pb-3">
              <div>
                <h3 className="font-playfair text-lg font-bold text-[#1b4b32]">
                  {tr('सेवा पूर्णता वीडियो प्रमाण अपलोड करें', 'Seva Poornta Video Proof Upload Karein')}
                </h3>
                <p className="text-xs text-[#786a55]">
                  {tr('श्रद्धालु:', 'Shraddhalu:')} <strong>{proofModalBooking.devoteeName}</strong> • {proofModalBooking.bookingId}
                </p>
              </div>
              <button onClick={() => setProofModalBooking(null)} className="p-1 text-[#786a55] hover:text-black cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#453728] mb-1">
                  {tr('वीडियो प्रमाण URL (MP4 / WebM / क्लाउड स्टोरेज) *', 'Video Proof URL (MP4 / WebM / Cloud Storage) *')}
                </label>
                <input
                  type="url"
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  placeholder="https://.../video-proof.mp4"
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                />
                <span className="text-[10px] text-[#786a55]">
                  {tr('डिफ़ॉल्ट सत्यापित HD गौ-सेवा वीडियो उपयोग करने हेतु खाली छोड़ें।', 'Default satyapit HD Gau-Seva video ke liye khaali chhodein.')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#453728] mb-1">
                  {tr('गौशाला प्रमुख / पुरोहित का नाम', 'Goshala Pramukh / Purohit ka Naam')}
                </label>
                <input
                  type="text"
                  value={priestNameInput}
                  onChange={(e) => setPriestNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                />
              </div>

              {/* WhatsApp Message Preview */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                  <span>📱 {tr(`व्हाट्सएप प्रमाण संदेश पूर्वावलोकन (+91 ${proofModalBooking.phone}):`, `WhatsApp Proof Sandesh Preview (+91 ${proofModalBooking.phone}):`)}</span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed font-mono">
                  {tr(
                    `“हरि ओम ${proofModalBooking.devoteeName} जी! आपकी ${proofModalBooking.sevaTitle} व्यवस्था आपके गोत्र (${proofModalBooking.gotra}) के नाम से ${proofModalBooking.goshala} में संपन्न हो गई है। वीडियो प्रमाण यहाँ देखें: [संलग्न HD वीडियो]। जय गौमाता!”`,
                    `“Hari Om ${proofModalBooking.devoteeName} ji! Aapki ${proofModalBooking.sevaTitle} vyavastha aapke Gotra (${proofModalBooking.gotra}) ke naam se ${proofModalBooking.goshala} mein sampann ho gayi hai. Video proof yahan dekhein: [Attached HD Video]. Jai Gaumata!”`
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ebdcb9]">
              <button
                type="button"
                onClick={() => setProofModalBooking(null)}
                className="px-4 py-2 rounded-full border border-[#ebdcb9] text-xs font-semibold cursor-pointer"
              >
                {tr('रद्द करें', 'Radd Karein')}
              </button>
              <button
                type="button"
                onClick={handleSaveProof}
                className="px-6 py-2 rounded-full bg-[#1b4b32] text-white text-xs font-bold hover:bg-[#153e29] cursor-pointer"
              >
                {tr('पुष्टि करें एवं व्हाट्सएप प्रमाण भेजें', 'Confirm Karein aur WhatsApp Proof Bhejein')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
