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
import { api, ServiceItem, AstrologerItem, BookingRecord, AppSettings, ReviewItem, AdminCustomerRecord } from '../../services/api';
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
  const [customers, setCustomers] = useState<AdminCustomerRecord[]>([]);
  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    projectId: string;
    databaseId?: string;
    collections?: Record<string, number>;
  } | null>(null);

  // Modals & form states
  const [editingService, setEditingService] = useState<Partial<ServiceItem> | null>(null);
  const [isNewService, setIsNewService] = useState<boolean>(false);

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
      const [srv, ast, bkg, set, rev, dbs, users] = await Promise.all([
        api.getServices(true),
        api.getAstrologers(),
        api.getBookings(),
        api.getSettings(),
        api.getReviews(),
        api.getDatabaseStatus(),
        api.getAdminCustomers(),
      ]);
      setServices(srv);
      setAstrologers(ast);
      setBookings(bkg);
      setSettings(set);
      setReviews(rev);
      setDbStatus(dbs);
      setCustomers(users);
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
        showNotification(tr('नई सेवा सफलतापूर्वक बनाई गई!', 'New Seva Service created successfully!'));
      } else if (editingService.id) {
        await api.updateService(editingService.id, editingService);
        showNotification(tr('सेवा सफलतापूर्वक अपडेट की गई!', 'Seva Service updated successfully!'));
      }
      setEditingService(null);
      await loadAllData();
    } catch (err) {
      console.error(err);
      showNotification(tr('सेवा सहेजने में विफल रहा', 'Failed to save service'));
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await api.deleteService(id);
      setConfirmDeleteServiceId(null);
      showNotification(tr('सेवा हटा दी गई', 'Service deleted'));
      await loadAllData();
    } catch (err) {
      console.error(err);
      showNotification(tr('सेवा हटाने में त्रुटि हुई', 'Failed to delete service'));
    }
  };

  const handleToggleServiceActive = async (s: ServiceItem) => {
    try {
      await api.updateService(s.id, { isActive: !s.isActive });
      showNotification(
        !s.isActive
          ? tr('सेवा सक्रिय कर दी गई', 'Service Activated')
          : tr('सेवा निष्क्रिय कर दी गई', 'Service Deactivated')
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
        showNotification(tr('ज्योतिषाचार्य सफलतापूर्वक जोड़े गए!', 'Astrologer added successfully!'));
      } else if (editingAstro.id) {
        await api.updateAstrologer(editingAstro.id, editingAstro);
        showNotification(tr('ज्योतिषाचार्य प्रोफ़ाइल अपडेट हो गई!', 'Astrologer profile updated successfully!'));
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
        `${astro.name} ${!astro.isOnline ? tr('अब ऑनलाइन हैं', 'is now ONLINE') : tr('अब ऑफ़लाइन हैं', 'is now OFFLINE')}`
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
      showNotification(tr(`बुकिंग स्थिति अपडेट: ${status.toUpperCase()}`, `Booking status updated to ${status.toUpperCase()}`));
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProof = async () => {
    if (!proofModalBooking) return;
    if (!videoUrlInput.trim()) {
      showNotification(tr('कृपया वास्तविक वीडियो प्रमाण URL दर्ज करें।', 'Please enter the actual video proof URL before completing this booking.'));
      return;
    }
    try {
      await api.uploadBookingProof(proofModalBooking.id, {
        videoProofUrl: videoUrlInput.trim(),
        priestName: priestNameInput,
        status: 'completed',
      });
      showNotification(
        tr(
          'वीडियो प्रमाण सहेजा गया और सेवा पूर्ण चिह्नित हुई।',
          'Video proof saved and booking marked completed.'
        )
      );
      setProofModalBooking(null);
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCustomerRoleChange = async (customer: AdminCustomerRecord, role: 'devotee' | 'astrologer') => {
    try {
      const assignedAstrologer = customer.astrologerId || astrologers[0]?.id;
      await api.updateCustomerAccess(customer.id, role, role === 'astrologer' ? assignedAstrologer : undefined);
      showNotification(role === 'astrologer' ? 'Astrologer access assigned.' : 'Devotee access restored.');
      await loadAllData();
    } catch (err: any) {
      showNotification(err?.message || 'Unable to update account role.');
    }
  };

  const handleCustomerAstrologerChange = async (customer: AdminCustomerRecord, astrologerId: string) => {
    try {
      await api.updateCustomerAccess(customer.id, 'astrologer', astrologerId);
      showNotification('Astrologer profile assigned successfully.');
      await loadAllData();
    } catch (err: any) {
      showNotification(err?.message || 'Unable to assign astrologer profile.');
    }
  };

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.updateSettings(settings);
      showNotification(tr('मूल्य और छूट नियम सफलतापूर्वक अपडेट हुए!', 'Pricing and Discount Rules updated successfully!'));
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
      showNotification(tr('मीडिया फ़ाइल सफलतापूर्वक अपलोड हो गई!', 'Media file uploaded successfully!'));
    } catch (err: any) {
      showNotification(tr('अपलोड विफल: ', 'Upload failed: ') + err.message);
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
              <span>{tr('वेबसाइट पर वापस जाएं', 'Back to Website')}</span>
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
              >
                EN
              </button>
            </div>

            <button
              onClick={loadAllData}
              title={tr('डेटा रीफ़्रेश करें', 'Refresh Data')}
              className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-amber-100">{tr('श्री हर्ष भारद्वाज', 'Shri Harsh Bhardwaj')}</div>
              <div className="text-[10px] text-emerald-300">{tr('वृंदावन धाम केंद्रीय नियंत्रण', 'Vrindavan Dham Central Control')}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col md:flex-row gap-6">
        
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-1 bg-[#fffdf8] p-3 rounded-2xl border border-[#ebdcb9] shadow-xs self-start">
          <div className="px-3 py-2 text-[10px] font-bold text-[#887864] uppercase tracking-wider">
            {tr('प्रबंधन मॉड्यूल', 'Management Modules')}
          </div>

          {[
            { id: 'overview', label: tr('सारांश एवं विश्लेषण', 'Overview & Analytics'), icon: LayoutDashboard },
            { id: 'services', label: tr('गौमाता आहार सेवाएं', 'Gau Seva Services'), icon: Sparkles },
            { id: 'astrologers', label: tr('ज्योतिषाचार्य पैनल', 'Astrologer Panel'), icon: Users },
            { id: 'bookings', label: tr('बुकिंग एवं वीडियो प्रमाण', 'Bookings & Proofs'), icon: CalendarCheck2 },
            { id: 'pricing', label: tr('शुल्क एवं 50% छूट नियम', 'Pricing & 50% Discount'), icon: Percent },
            { id: 'reviews', label: tr('श्रद्धालु समीक्षाएं', 'Devotee Reviews'), icon: Star },
            { id: 'customers', label: tr('ग्राहक वॉलेट', 'Customer Wallets'), icon: DollarSign },
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
            <div className="text-[11px] text-[#786a55] font-semibold">{tr('लाइव सिस्टम स्थिति:', 'Live System Status:')}</div>
            <div className="flex items-center gap-2 text-xs text-emerald-800 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{tr('Supabase Edge Functions', 'Supabase Edge Functions')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <span className={`w-2 h-2 rounded-full ${dbStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
              <span>
                {tr('Supabase PostgreSQL:', 'Supabase PostgreSQL:')}{' '}
                {dbStatus?.connected ? tr('कनेक्टेड', 'Connected') : tr('कनेक्ट हो रहा है...', 'Connecting...')}
              </span>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 bg-[#fffdfa] rounded-2xl border border-[#ebdcb9] p-5 sm:p-6 shadow-xs min-h-[600px] overflow-hidden">
          
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#1b4b32] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#71614e] font-semibold">{tr('गौकृपा कंसोल डेटा लोड हो रहा है...', 'Loading GauKripa Console Data...')}</p>
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
                          <h3 className="font-bold text-sm text-amber-200">{tr('Supabase Database Connected', 'Supabase Database Connected')}</h3>
                          <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            {tr('लाइव डेटाबेस', 'Live Database')}
                          </span>
                        </div>
                        <p className="text-xs text-emerald-100/90 mt-0.5">
                          {tr('प्रोजेक्ट:', 'Project:')} <code className="text-amber-300 font-mono text-[11px]">{dbStatus?.projectId || 'nwvsesrnhuhcihftagcp'}</code> &bull; {tr('डेटाबेस:', 'Database:')} <code className="text-emerald-200 font-mono text-[11px]">{dbStatus?.databaseId || 'Supabase PostgreSQL'}</code>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-semibold text-emerald-200 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                        {tr('सिंक: स्थायी क्लाउड', 'Sync: Persistent Cloud')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#1b4b32]">
                        {tr('डैशबोर्ड सारांश', 'Dashboard Overview')}
                      </h2>
                      <p className="text-xs text-[#71614e]">
                        {tr('रियल-टाइम सेवा शुल्क, सक्रिय ज्योतिषाचार्य और गौ-आहार सेवा वितरण आँकड़े।', 'Real-time service fee metrics, active astrologers, and Gau Seva fulfillment stats.')}
                      </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      {tr('ऑटो-सिंक सक्रिय', 'Auto-syncing')}
                    </span>
                  </div>

                  {/* Top Stats 4 Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-2xl bg-[#fcf8ee] border border-[#ebdcb9] space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#786a55]">
                        <span>{tr('कुल सेवा शुल्क', 'Total Service Fee')}</span>
                        <DollarSign className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="text-2xl font-black text-[#1b4b32]">₹{totalRevenue.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-emerald-700 font-bold">{tr('100% सत्यापित UPI/बैंक भुगतान', '100% Verified Bank/UPI')}</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#fcf8ee] border border-[#ebdcb9] space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#786a55]">
                        <span>{tr('कुल सेवा संकल्प', 'Total Seva Sankalps')}</span>
                        <CalendarCheck2 className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="text-2xl font-black text-[#1b4b32]">{bookings.length}</div>
                      <div className="text-[10px] text-emerald-700 font-bold">{completedBookings} {tr('वीडियो प्रमाण सहित पूर्ण', 'Completed with Video')}</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#fcf8ee] border border-[#ebdcb9] space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#786a55]">
                        <span>{tr('सक्रिय ज्योतिषाचार्य', 'Active Astrologers')}</span>
                        <Users className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="text-2xl font-black text-[#1b4b32]">{activeAstros} / {astrologers.length}</div>
                      <div className="text-[10px] text-emerald-700 font-bold">{tr('लाइव परामर्श हेतु उपलब्ध', 'Live Consultation Ready')}</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#fcf8ee] border border-[#ebdcb9] space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#786a55]">
                        <span>{tr('सक्रिय सेवाएं', 'Active Services')}</span>
                        <Sparkles className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="text-2xl font-black text-[#1b4b32]">{services.filter((s) => s.isActive).length}</div>
                      <div className="text-[10px] text-amber-800 font-bold">{tr('गौमाता, पक्षी, चींटी, श्वान आहार', 'Cows, Birds, Ants, Dogs')}</div>
                    </div>
                  </div>

                  {/* Recent Bookings Quick Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-playfair text-base font-bold text-[#1b4b32]">
                        {tr('हाल के श्रद्धालु संकल्प', 'Recent Devotee Sankalps')}
                      </h3>
                      <button
                        onClick={() => setActiveTab('bookings')}
                        className="text-xs font-bold text-[#1b4b32] hover:underline cursor-pointer"
                      >
                        {tr('सभी बुकिंग देखें →', 'View All Bookings →')}
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-[#ebdcb9]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#fbf4e2] text-[#483c2e] font-bold border-b border-[#ebdcb9]">
                          <tr>
                            <th className="p-3">{tr('बुकिंग आईडी', 'Booking ID')}</th>
                            <th className="p-3">{tr('श्रद्धालु', 'Devotee')}</th>
                            <th className="p-3">{tr('सेवा का नाम', 'Seva Title')}</th>
                            <th className="p-3">{tr('सेवा शुल्क', 'Service Fee')}</th>
                            <th className="p-3">{tr('स्थिति', 'Status')}</th>
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
                                    ? tr('पूर्ण', 'completed')
                                    : b.status === 'in_progress'
                                    ? tr('प्रगति पर', 'in progress')
                                    : tr('पुष्ट', 'confirmed')}
                                </span>
                              </td>
                              <td className="p-3">
                                {b.videoProofUrl ? (
                                  <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                                    <Video className="w-3.5 h-3.5" /> {tr('व्हाट्सएप पर भेजा गया', 'Sent on WhatsApp')}
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setProofModalBooking(b);
                                      setVideoUrlInput('');
                                    }}
                                    className="text-[11px] font-bold text-amber-700 underline cursor-pointer"
                                  >
                                    {tr('+ प्रमाण अपलोड करें', '+ Upload Proof')}
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
                        {tr('गौमाता आहार एवं सेवा प्रबंधन', 'Manage Gau Seva & Feeding Services')}
                      </h2>
                      <p className="text-xs text-[#71614e]">
                        {tr('सेवाओं के शुल्क, विवरण, ग्रह-दोष लाभ जोड़ें/संपादित करें और वास्तविक सेवा फोटो बदलें।', 'Add, edit prices, descriptions, grah dosha associations and replace real seva photos.')}
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
                      <span>{tr('नई सेवा जोड़ें', 'Add New Service')}</span>
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
                                {s.isActive ? tr('सक्रिय', 'Active') : tr('निष्क्रिय', 'Disabled')}
                              </span>
                            </div>
                          </div>

                          <div className="h-28 rounded-xl overflow-hidden bg-amber-50 relative border border-[#ebdcb9]">
                            {s.customImageUrl ? (
                              <img src={s.customImageUrl} alt={s.title} className="w-full h-full object-cover" />
                            ) : (
                              <ImageCrop cropKey={s.cropKey} className="w-full h-full object-cover" alt={s.title} />
                            )}
                          </div>

                          <div>
                            <h3 className="font-playfair text-base font-bold text-[#1b4b32]">{s.title}</h3>
                            <div className="text-sm font-black text-[#8b5a0a]">{s.priceDisplay} ({tr('आधार:', 'Base:')} ₹{s.basePrice})</div>
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
                            {s.isActive ? tr('निष्क्रिय करें', 'Deactivate') : tr('सक्रिय करें', 'Activate')}
                          </button>

                          {confirmDeleteServiceId === s.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteService(s.id)}
                                className="px-2 py-1 rounded-lg bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 cursor-pointer"
                              >
                                {tr('हटाएं?', 'Confirm')}
                              </button>
                              <button
                                onClick={() => setConfirmDeleteServiceId(null)}
                                className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold hover:bg-slate-200 cursor-pointer"
                              >
                                {tr('रद्द', 'Cancel')}
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
                                title={tr('सेवा संपादित करें', 'Edit Service')}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteServiceId(s.id)}
                                className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer"
                                title={tr('सेवा हटाएं', 'Delete Service')}
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
                        {tr('ज्योतिषाचार्य प्रोफ़ाइल एवं परामर्श', 'Astrologer Profiles & Consultations')}
                      </h2>
                      <p className="text-xs text-[#71614e]">
                        {tr('ज्योतिषाचार्यों का परिचय, परामर्श शुल्क, फोटो और लाइव ऑनलाइन/ऑफ़लाइन स्थिति प्रबंधित करें।', 'Manage astrologer bios, consultation charges, photos, and live online/offline status.')}
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
                      <span>{tr('नए ज्योतिषाचार्य जोड़ें', 'Add New Astrologer')}</span>
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
                            <span className="font-semibold text-[#6d5b43]">{tr('लाइव उपलब्धता:', 'Live Availability:')}</span>
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
                            <strong>{a.totalConsultations}</strong> {tr('परामर्श', 'chats')} • <strong>₹{a.totalEarnings}</strong> {tr('अर्जित', 'earned')}
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setIsNewAstro(false);
                                setEditingAstro({ ...a });
                              }}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                              title={tr('ज्योतिषाचार्य संपादित करें', 'Edit Astrologer')}
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
                        {tr('श्रद्धालु सेवा बुकिंग एवं वीडियो प्रमाण', 'Customer Seva Bookings & Video Proofs')}
                      </h2>
                      <p className="text-xs text-[#71614e]">
                        {tr('संकल्प स्थिति ट्रैक करें, वैदिक गौशाला पुरोहित नियुक्त करें, और वास्तविक वीडियो व फोटो प्रमाण अपलोड करें।', 'Track sankalp status, assign Vedic goshala priests, and upload actual video & photo proofs.')}
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
                            ? tr('सभी', 'All')
                            : st === 'confirmed'
                            ? tr('पुष्ट', 'Confirmed')
                            : st === 'in_progress'
                            ? tr('प्रगति पर', 'In Progress')
                            : tr('पूर्ण', 'Completed')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#8b7964] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder={tr('श्रद्धालु का नाम, फ़ोन नंबर, गोत्र या सेवा के नाम से खोजें...', 'Search bookings by devotee name, phone number, gotra, or seva title...')}
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
                          <th className="p-3">{tr('श्रद्धालु विवरण', 'Devotee Info')}</th>
                          <th className="p-3">{tr('सेवा एवं अवधि', 'Seva & Duration')}</th>
                          <th className="p-3">{tr('अवसर', 'Occasion')}</th>
                          <th className="p-3">{tr('सेवा शुल्क', 'Service Fee')}</th>
                          <th className="p-3">{tr('स्थिति', 'Status')}</th>
                          <th className="p-3">{tr('प्रमाण एवं व्हाट्सएप', 'Proof & WhatsApp')}</th>
                          <th className="p-3 text-right">{tr('कार्रवाई', 'Actions')}</th>
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
                                <span className="text-[9px] text-[#c4821a] font-bold block">{tr('+₹21 विशेष अवसर', '+₹21 Occasion')}</span>
                              )}
                            </td>
                            <td className="p-3">
                              <select
                                value={b.status}
                                onChange={(e) => handleUpdateStatus(b.id, e.target.value as any)}
                                className="px-2 py-1 rounded-lg border border-[#ebdcb9] text-[10px] font-bold bg-white"
                              >
                                <option value="confirmed">{tr('पुष्ट (Confirmed)', 'Confirmed')}</option>
                                <option value="in_progress">{tr('प्रगति पर (In Progress)', 'In Progress')}</option>
                                <option value="completed">{tr('पूर्ण (Completed)', 'Completed')}</option>
                                <option value="cancelled">{tr('रद्द (Cancelled)', 'Cancelled')}</option>
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
                                    <Video className="w-3.5 h-3.5" /> {tr('वीडियो देखें', 'View Video')}
                                  </a>
                                  <span className="text-[9px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold block">
                                    {tr('व्हाट्सएप पर भेजा गया ✓', 'WhatsApp Shared ✓')}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-amber-800 italic">{tr('अपलोड लंबित', 'Pending Upload')}</span>
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
                                <span>{tr('प्रमाण अपलोड करें', 'Upload Proof')}</span>
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
                      {tr('शुल्क, छूट एवं प्रचार बैनर', 'Pricing, Discounts & Promotional Banners')}
                    </h2>
                    <p className="text-xs text-[#71614e]">
                      {tr('ज्योतिषाचार्य प्रति-मिनट दरें, सेवा छूट नियम और विशेष अवसर शुल्क निर्धारित करें।', 'Configure per-minute astrologer rates, seva discount triggers, and occasion fees.')}
                    </p>
                  </div>

                  <form onSubmit={handleSaveSettings} className="space-y-4 bg-[#fffdf9] p-5 rounded-2xl border border-[#ebdcb9]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#453728] mb-1">
                          {tr('मानक ज्योतिषाचार्य शुल्क (₹ / मिनट)', 'Standard Astrologer Rate (₹ / min)')}
                        </label>
                        <input
                          type="number"
                          value={settings.standardRatePerMin}
                          onChange={(e) => setSettings({ ...settings, standardRatePerMin: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-bold focus:outline-hidden focus:border-[#1b4b32]"
                        />
                        <span className="text-[10px] text-[#786a55]">{tr('पूर्ण गौ-सेवा रहित श्रद्धालुओं के लिए सामान्य दर।', 'Default rate for devotees without completed seva.')}</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#453728] mb-1">
                          {tr('रियायती ज्योतिषाचार्य शुल्क (₹ / मिनट)', 'Discounted Astrologer Rate (₹ / min)')}
                        </label>
                        <input
                          type="number"
                          value={settings.discountedRatePerMin}
                          onChange={(e) => setSettings({ ...settings, discountedRatePerMin: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-bold text-emerald-800 focus:outline-hidden focus:border-[#1b4b32]"
                        />
                        <span className="text-[10px] text-emerald-700 font-medium">{tr('सेवा संकल्प के पश्चात 50% छूट दर।', '50% discount rate after seva sankalp.')}</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#453728] mb-1">
                          {tr('विशेष अवसर अतिरिक्त शुल्क (₹)', 'Extra Occasion Fee (₹)')}
                        </label>
                        <input
                          type="number"
                          value={settings.extraOccasionFee}
                          onChange={(e) => setSettings({ ...settings, extraOccasionFee: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-bold focus:outline-hidden focus:border-[#1b4b32]"
                        />
                        <span className="text-[10px] text-[#786a55]">{tr('विशेष अवसर चुनने पर जोड़ा जाने वाला शुल्क।', 'Added when devotee selects a special occasion.')}</span>
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
                            {tr('50% ज्योतिषाचार्य छूट नियम सक्रिय करें', 'Enable 50% Astrologer Discount Rule')}
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#ebdcb9] space-y-2">
                      <label className="block text-xs font-bold text-[#453728]">
                        {tr('प्रचार ऑफ़र बैनर संदेश', 'Promotional Offer Banner Message')}
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
                        <span className="text-xs text-[#524434] font-medium">{tr('होमपेज पर बैनर प्रदर्शित करें', 'Display banner across homepage')}</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full bg-[#1b4b32] text-white font-bold text-xs flex items-center gap-2 shadow-xs hover:bg-[#153e29] cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{tr('शुल्क एवं छूट विन्यास सहेजें', 'Save Pricing & Discount Configuration')}</span>
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
                        {tr('संपूर्ण भारत की श्रद्धालु समीक्षाएं प्रबंधित करें', 'Manage Devotee Reviews across India')}
                      </h2>
                      <p className="text-xs text-[#71614e]">
                        {tr('वेबसाइट पर प्रदर्शित वास्तविक श्रद्धालु अनुभवों की समीक्षा एवं प्रबंधन करें।', 'Moderate authentic devotee reviews displayed on the website.')}
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
                            {r.isApproved ? tr('स्वीकृत एवं दृश्यमान', 'Approved & Visible') : tr('समीक्षा लंबित', 'Pending Review')}
                          </span>
                          <button
                            onClick={async () => {
                              await api.deleteReview(r.id);
                              showNotification(tr('समीक्षा हटा दी गई', 'Review deleted'));
                              await loadAllData();
                            }}
                            className="text-red-700 text-xs font-bold hover:underline cursor-pointer"
                          >
                            {tr('हटाएं', 'Delete')}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: REGISTERED ACCOUNTS & WALLET BALANCES */}
              {activeTab === 'customers' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#1b4b32]">
                      {tr('पंजीकृत खाते एवं वॉलेट', 'Registered Accounts & Wallets')}
                    </h2>
                    <p className="text-xs text-[#71614e]">
                      {tr('वास्तविक Supabase उपयोगकर्ता, वॉलेट शेष और ज्योतिषाचार्य एक्सेस प्रबंधित करें।', 'Manage real Supabase users, wallet balances and astrologer access.')}
                    </p>
                  </div>
                  {customers.length === 0 ? (
                    <div className="rounded-2xl border border-[#ebdcb9] bg-[#fcf8ee] p-8 text-center text-sm text-[#71614e]">
                      {tr('अभी कोई पंजीकृत खाता नहीं है।', 'No registered accounts yet.')}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customers.map((customer) => (
                        <div key={customer.id} className="rounded-2xl border border-[#ebdcb9] bg-[#fffdf8] p-4 flex flex-col gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-[#1b4b32]">{customer.fullName}</div>
                              <div className="text-xs text-[#71614e] break-all">{customer.email}</div>
                              <div className="text-xs text-[#71614e]">{customer.phone || tr('फोन दर्ज नहीं', 'No phone saved')}</div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="text-[10px] uppercase font-bold text-[#786a55]">{tr('वॉलेट शेष', 'Wallet Balance')}</div>
                              <div className="text-xl font-black text-[#1b4b32]">₹{customer.walletBalance.toFixed(2)}</div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <label className="text-[11px] font-bold text-[#786a55]">
                              {tr('खाता भूमिका', 'Account Role')}
                              {customer.role === 'super_admin' || customer.role === 'admin' ? (
                                <span className="mt-1 block rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">Protected Administrator</span>
                              ) : (
                                <select
                                  value={customer.role === 'astrologer' ? 'astrologer' : 'devotee'}
                                  onChange={(e) => handleCustomerRoleChange(customer, e.target.value as 'devotee' | 'astrologer')}
                                  className="mt-1 w-full rounded-lg border border-[#ebdcb9] bg-white p-2 text-xs text-[#2d3a31]"
                                >
                                  <option value="devotee">Devotee</option>
                                  <option value="astrologer">Astrologer</option>
                                </select>
                              )}
                            </label>
                            {customer.role === 'astrologer' && (
                              <label className="text-[11px] font-bold text-[#786a55]">
                                {tr('ज्योतिषाचार्य प्रोफ़ाइल', 'Astrologer Profile')}
                                <select
                                  value={customer.astrologerId || ''}
                                  onChange={(e) => handleCustomerAstrologerChange(customer, e.target.value)}
                                  className="mt-1 w-full rounded-lg border border-[#ebdcb9] bg-white p-2 text-xs text-[#2d3a31]"
                                >
                                  <option value="" disabled>Select astrologer</option>
                                  {astrologers.map((astro) => <option key={astro.id} value={astro.id}>{astro.name}</option>)}
                                </select>
                              </label>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
                {isNewService ? tr('नई सेवा जोड़ें', 'Add New Seva Service') : `${tr('संपादित करें:', 'Edit')} ${editingService.title}`}
              </h3>
              <button onClick={() => setEditingService(null)} className="p-1 text-[#786a55] hover:text-black cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">{tr('सेवा का नाम *', 'Seva Title *')}</label>
                  <input
                    type="text"
                    required
                    value={editingService.title || ''}
                    onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">{tr('आधार सेवा शुल्क (₹) *', 'Base Price (₹) *')}</label>
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
                  <label className="block text-xs font-bold text-[#453728] mb-1">{tr('प्रदर्शित शुल्क लेबल', 'Price Display Label')}</label>
                  <input
                    type="text"
                    value={editingService.priceDisplay || ''}
                    onChange={(e) => setEditingService({ ...editingService, priceDisplay: e.target.value })}
                    placeholder={tr('जैसे ₹251 (5 किग्रा)', 'e.g. ₹251 (5 kg)')}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">{tr('सेवा इकाई', 'Unit of Service')}</label>
                  <input
                    type="text"
                    value={editingService.unit || 'lot'}
                    onChange={(e) => setEditingService({ ...editingService, unit: e.target.value })}
                    placeholder={tr('जैसे 5 किग्रा या थाली', 'e.g. lot (5 kg) or thali')}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">{tr('ग्रह / देवता संबंध', 'Grah / Deity Association')}</label>
                  <input
                    type="text"
                    value={editingService.planetTag || '☀️ Surya Grah'}
                    onChange={(e) => setEditingService({ ...editingService, planetTag: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">{tr('श्रेणी', 'Category')}</label>
                  <select
                    value={editingService.category || 'cow'}
                    onChange={(e) => setEditingService({ ...editingService, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  >
                    <option value="cow">{tr('गौमाता आहार सेवा', 'Cow / Gaumata Seva')}</option>
                    <option value="bird">{tr('पक्षी दाना व्यवस्था', 'Pakshi Dana (Bird Feeding)')}</option>
                    <option value="ant">{tr('चींटी आटा व्यवस्था', 'Cheenti Aata (Ant Feeding)')}</option>
                    <option value="dog">{tr('श्वान आहार व्यवस्था', 'Street Dogs Feeding')}</option>
                    <option value="combo">{tr('विशेष उत्सव संयुक्त सेवा', 'Combo / Special Festival Seva')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#453728] mb-1">{tr('आध्यात्मिक लाभ (संक्षिप्त)', 'Spiritual Benefit (Short)')}</label>
                <input
                  type="text"
                  value={editingService.benefit || ''}
                  onChange={(e) => setEditingService({ ...editingService, benefit: e.target.value })}
                  placeholder={tr('जैसे सूर्य दोष शांति व आत्मविश्वास में सहायक।', 'e.g. Helps reduce Surya Dosh & brings confidence & success.')}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#453728] mb-1">{tr('विस्तृत विवरण', 'Detailed Description')}</label>
                <textarea
                  rows={2}
                  value={editingService.detailedDescription || ''}
                  onChange={(e) => setEditingService({ ...editingService, detailedDescription: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                />
              </div>

              {/* Upload Real Image */}
              <div className="p-3 rounded-xl bg-[#fcf6ea] border border-[#ebdcb9] space-y-2">
                <label className="block text-xs font-bold text-[#1b4b32]">
                  {tr('वास्तविक सेवा फोटो अपलोड / बदलें', 'Upload / Replace Real Seva Photo')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'service')}
                    className="text-xs text-[#524434] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#1b4b32] file:text-white hover:file:bg-[#153e29]"
                  />
                  {editingService.customImageUrl && (
                    <span className="text-[11px] text-emerald-700 font-bold">{tr('✓ कस्टम फ़ोटो संलग्न', '✓ Custom Image Attached')}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ebdcb9]">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded-full border border-[#ebdcb9] text-xs font-semibold cursor-pointer"
                >
                  {tr('रद्द करें', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#1b4b32] text-white text-xs font-bold hover:bg-[#153e29] cursor-pointer"
                >
                  {tr('सेवा सहेजें', 'Save Service')}
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
                {isNewAstro ? tr('नए ज्योतिषाचार्य जोड़ें', 'Add New Astrologer') : `${tr('संपादित करें:', 'Edit')} ${editingAstro.name}`}
              </h3>
              <button onClick={() => setEditingAstro(null)} className="p-1 text-[#786a55] hover:text-black cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAstrologer} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">{tr('ज्योतिषाचार्य नाम *', 'Astrologer Name *')}</label>
                  <input
                    type="text"
                    required
                    value={editingAstro.name || ''}
                    onChange={(e) => setEditingAstro({ ...editingAstro, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">{tr('पद / उपाधि', 'Title / Designation')}</label>
                  <input
                    type="text"
                    value={editingAstro.title || ''}
                    onChange={(e) => setEditingAstro({ ...editingAstro, title: e.target.value })}
                    placeholder={tr('जैसे वैदिक ज्योतिष एवं वास्तु विशेषज्ञ', 'e.g. Tarot & Vedic Expert')}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">{tr('अनुभव', 'Experience')}</label>
                  <input
                    type="text"
                    value={editingAstro.experience || ''}
                    onChange={(e) => setEditingAstro({ ...editingAstro, experience: e.target.value })}
                    placeholder={tr('जैसे 15+ वर्षों का अनुभव', 'e.g. 15+ Years Experience')}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">{tr('प्रति मिनट शुल्क (₹) *', 'Rate Per Minute (₹) *')}</label>
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
                <label className="block text-xs font-bold text-[#453728] mb-1">{tr('परिचय / वैदिक परंपरा', 'Biography / Vedic Lineage')}</label>
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
                  {tr('ज्योतिषाचार्य प्रोफ़ाइल फ़ोटो अपलोड करें', 'Upload Astrologer Profile Photo')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'astrologer')}
                    className="text-xs text-[#524434] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#1b4b32] file:text-white hover:file:bg-[#153e29]"
                  />
                  {editingAstro.customImageUrl && (
                    <span className="text-[11px] text-emerald-700 font-bold">{tr('✓ कस्टम फ़ोटो संलग्न', '✓ Custom Photo Attached')}</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ebdcb9]">
                <button
                  type="button"
                  onClick={() => setEditingAstro(null)}
                  className="px-4 py-2 rounded-full border border-[#ebdcb9] text-xs font-semibold cursor-pointer"
                >
                  {tr('रद्द करें', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#1b4b32] text-white text-xs font-bold hover:bg-[#153e29] cursor-pointer"
                >
                  {tr('ज्योतिषाचार्य सहेजें', 'Save Astrologer')}
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
                  {tr('सेवा पूर्णता वीडियो प्रमाण अपलोड करें', 'Upload Seva Completion Proof')}
                </h3>
                <p className="text-xs text-[#786a55]">
                  {tr('श्रद्धालु:', 'Devotee:')} <strong>{proofModalBooking.devoteeName}</strong> • {proofModalBooking.bookingId}
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
                  {tr('डिफ़ॉल्ट सत्यापित वृंदावन HD गौ-सेवा वीडियो उपयोग करने हेतु खाली छोड़ें।', 'Leave blank to use default certified Vrindavan HD Gau Puja video proof.')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#453728] mb-1">
                  {tr('गौशाला प्रमुख / पुरोहित का नाम', 'Officiating Goshala Priest Name')}
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
                  <span>📱 {tr(`व्हाट्सएप प्रमाण संदेश पूर्वावलोकन (+91 ${proofModalBooking.phone}):`, `WhatsApp Proof Notification Preview (+91 ${proofModalBooking.phone}):`)}</span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed font-mono">
                  {tr(
                    `“हरि ओम ${proofModalBooking.devoteeName} जी! आपकी ${proofModalBooking.sevaTitle} व्यवस्था आपके गोत्र (${proofModalBooking.gotra}) के नाम से ${proofModalBooking.goshala} में संपन्न हो गई है। वीडियो प्रमाण यहाँ देखें: [संलग्न HD वीडियो]। जय गौमाता!”`,
                    `“Hari Om ${proofModalBooking.devoteeName} ji! Your sacred ${proofModalBooking.sevaTitle} sankalp has been performed with your Gotra (${proofModalBooking.gotra}) at ${proofModalBooking.goshala}. Watch your video proof here: [Attached HD Video]. Jai Gaumata!”`
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
                {tr('रद्द करें', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleSaveProof}
                className="px-6 py-2 rounded-full bg-[#1b4b32] text-white text-xs font-bold hover:bg-[#153e29] cursor-pointer"
              >
                {tr('पुष्टि करें एवं व्हाट्सएप प्रमाण भेजें', 'Confirm & Send WhatsApp Proof')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
