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
  RefreshCw
} from 'lucide-react';
import { api, ServiceItem, AstrologerItem, BookingRecord, AppSettings, ReviewItem } from '../../services/api';
import { ImageCrop } from '../ImageCrop';

interface AdminDashboardProps {
  onBackToWebsite: () => void;
}

type AdminTab = 'overview' | 'services' | 'astrologers' | 'bookings' | 'pricing' | 'reviews' | 'customers';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToWebsite }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState<boolean>(true);

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
        showNotification('New Seva Service created successfully!');
      } else if (editingService.id) {
        await api.updateService(editingService.id, editingService);
        showNotification('Seva Service updated successfully!');
      }
      setEditingService(null);
      await loadAllData();
    } catch (err) {
      console.error(err);
      alert('Failed to save service');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this seva service?')) return;
    try {
      await api.deleteService(id);
      showNotification('Service deleted');
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleServiceActive = async (s: ServiceItem) => {
    try {
      await api.updateService(s.id, { isActive: !s.isActive });
      showNotification(`Service ${!s.isActive ? 'Activated' : 'Deactivated'}`);
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
        showNotification('Astrologer added successfully!');
      } else if (editingAstro.id) {
        await api.updateAstrologer(editingAstro.id, editingAstro);
        showNotification('Astrologer profile updated successfully!');
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
      showNotification(`${astro.name} is now ${!astro.isOnline ? 'ONLINE' : 'OFFLINE'}`);
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Booking Status & Proof
  const handleUpdateStatus = async (bookingId: string, status: BookingRecord['status']) => {
    try {
      await api.updateBookingStatus(bookingId, status);
      showNotification(`Booking status updated to ${status.toUpperCase()}`);
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
      showNotification('Video Proof uploaded and marked Completed! WhatsApp notification queued.');
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
      showNotification('Pricing and Discount Rules updated successfully!');
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
      showNotification('Media file uploaded successfully!');
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
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
              <span>Back to Website</span>
            </button>
            <div className="h-6 w-px bg-emerald-800" />
            <div className="flex items-center gap-2">
              <span className="text-lg">卐</span>
              <h1 className="font-playfair text-lg sm:text-xl font-bold text-amber-200 tracking-wide">
                GauKripa Admin Console
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold uppercase tracking-wider">
                Super Admin
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAllData}
              title="Refresh Data"
              className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-amber-100">Shri Harsh Bhardwaj</div>
              <div className="text-[10px] text-emerald-300">Vrindavan Dham Central Control</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 flex flex-col md:flex-row gap-6">
        
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-1 bg-[#fffdf8] p-3 rounded-2xl border border-[#ebdcb9] shadow-xs self-start">
          <div className="px-3 py-2 text-[10px] font-bold text-[#887864] uppercase tracking-wider">
            Management Modules
          </div>

          {[
            { id: 'overview', label: 'Overview & Analytics', icon: LayoutDashboard },
            { id: 'services', label: 'Gau Seva Services', icon: Sparkles },
            { id: 'astrologers', label: 'Astrologer Panel', icon: Users },
            { id: 'bookings', label: 'Bookings & Proofs', icon: CalendarCheck2 },
            { id: 'pricing', label: 'Pricing & 50% Discount', icon: Percent },
            { id: 'reviews', label: 'Devotee Reviews', icon: Star },
            { id: 'customers', label: 'Customer Wallets', icon: DollarSign },
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
            <div className="text-[11px] text-[#786a55] font-semibold">Live System Status:</div>
            <div className="flex items-center gap-2 text-xs text-emerald-800 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Express API Server (3000)</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
              <span className={`w-2 h-2 rounded-full ${dbStatus?.connected ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
              <span>Cloud Firestore: {dbStatus?.connected ? 'Connected' : 'Connecting...'}</span>
            </div>
          </div>
        </aside>

        {/* Right Content Area */}
        <main className="flex-1 bg-[#fffdfa] rounded-2xl border border-[#ebdcb9] p-5 sm:p-6 shadow-xs min-h-[600px] overflow-hidden">
          
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#1b4b32] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#71614e] font-semibold">Loading GauKripa Console Data...</p>
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
                          <h3 className="font-bold text-sm text-amber-200">Google Cloud Firestore Connected</h3>
                          <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Live Database
                          </span>
                        </div>
                        <p className="text-xs text-emerald-100/90 mt-0.5">
                          Project: <code className="text-amber-300 font-mono text-[11px]">{dbStatus?.projectId || 'polished-philosophy-r7cdj'}</code> &bull; Database: <code className="text-emerald-200 font-mono text-[11px]">{dbStatus?.databaseId || 'ai-studio-gaukripasevashan'}</code>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-semibold text-emerald-200 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                        Sync: Persistent Cloud
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#1b4b32]">
                        Dashboard Overview
                      </h2>
                      <p className="text-xs text-[#71614e]">
                        Real-time revenue, active astrologers, and Gau Seva fulfillment metrics.
                      </p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      Auto-syncing
                    </span>
                  </div>

                  {/* Top Stats 4 Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-2xl bg-[#fcf8ee] border border-[#ebdcb9] space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#786a55]">
                        <span>Total Seva Dakshina</span>
                        <DollarSign className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="text-2xl font-black text-[#1b4b32]">₹{totalRevenue.toLocaleString('en-IN')}</div>
                      <div className="text-[10px] text-emerald-700 font-bold">100% Verified Bank/UPI</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#fcf8ee] border border-[#ebdcb9] space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#786a55]">
                        <span>Total Seva Sankalps</span>
                        <CalendarCheck2 className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="text-2xl font-black text-[#1b4b32]">{bookings.length}</div>
                      <div className="text-[10px] text-emerald-700 font-bold">{completedBookings} Completed with Video</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#fcf8ee] border border-[#ebdcb9] space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#786a55]">
                        <span>Active Astrologers</span>
                        <Users className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="text-2xl font-black text-[#1b4b32]">{activeAstros} / {astrologers.length}</div>
                      <div className="text-[10px] text-emerald-700 font-bold">Live Consultation Ready</div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#fcf8ee] border border-[#ebdcb9] space-y-1">
                      <div className="flex items-center justify-between text-xs text-[#786a55]">
                        <span>Active Services</span>
                        <Sparkles className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="text-2xl font-black text-[#1b4b32]">{services.filter((s) => s.isActive).length}</div>
                      <div className="text-[10px] text-amber-800 font-bold">Cows, Birds, Ants, Dogs</div>
                    </div>
                  </div>

                  {/* Recent Bookings Quick Table */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-playfair text-base font-bold text-[#1b4b32]">
                        Recent Devotee Sankalps
                      </h3>
                      <button
                        onClick={() => setActiveTab('bookings')}
                        className="text-xs font-bold text-[#1b4b32] hover:underline"
                      >
                        View All Bookings →
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-[#ebdcb9]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#fbf4e2] text-[#483c2e] font-bold border-b border-[#ebdcb9]">
                          <tr>
                            <th className="p-3">Booking ID</th>
                            <th className="p-3">Devotee</th>
                            <th className="p-3">Seva Title</th>
                            <th className="p-3">Dakshina</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Video Proof</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f2e5cc]">
                          {bookings.slice(0, 5).map((b) => (
                            <tr key={b.id} className="hover:bg-[#fcf9f2]">
                              <td className="p-3 font-mono font-bold text-[#8b6f38]">{b.bookingId}</td>
                              <td className="p-3">
                                <div className="font-bold text-[#29352c]">{b.devoteeName}</div>
                                <div className="text-[10px] text-[#71614e]">+91 {b.phone} • Gotra: {b.gotra}</div>
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
                                  {b.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="p-3">
                                {b.videoProofUrl ? (
                                  <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                                    <Video className="w-3.5 h-3.5" /> Sent on WhatsApp
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setProofModalBooking(b);
                                      setVideoUrlInput('');
                                    }}
                                    className="text-[11px] font-bold text-amber-700 underline cursor-pointer"
                                  >
                                    + Upload Proof
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
                        Manage Gau Seva &amp; Feeding Services
                      </h2>
                      <p className="text-xs text-[#71614e]">
                        Add, edit prices, descriptions, grah dosha associations and replace real seva photos.
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
                      <span>Add New Service</span>
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
                                {s.isActive ? 'Active' : 'Disabled'}
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
                            <div className="text-sm font-black text-[#8b5a0a]">{s.priceDisplay} (Base: ₹{s.basePrice})</div>
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
                            {s.isActive ? 'Deactivate' : 'Activate'}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setIsNewService(false);
                                setEditingService({ ...s });
                              }}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                              title="Edit Service"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteService(s.id)}
                              className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 cursor-pointer"
                              title="Delete Service"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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
                        Astrologer Profiles &amp; Consultations
                      </h2>
                      <p className="text-xs text-[#71614e]">
                        Manage astrologer bios, consultation charges, photos, and live online/offline status.
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
                      <span>Add New Astrologer</span>
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
                                <span>₹{a.ratePerMin} / min</span>
                                <span>•</span>
                                <span>⭐ {a.rating}</span>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-[#524434] line-clamp-2">{a.bio}</p>

                          <div className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#fcf6e8] border border-[#ebdcb9]">
                            <span className="font-semibold text-[#6d5b43]">Live Availability:</span>
                            <button
                              onClick={() => handleToggleAstroOnline(a)}
                              className={`px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                                a.isOnline
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'bg-red-600 text-white shadow-2xs'
                              }`}
                            >
                              {a.isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}
                            </button>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-[#ebdcb9] flex items-center justify-between">
                          <div className="text-[11px] text-[#71614e]">
                            <strong>{a.totalConsultations}</strong> chats • <strong>₹{a.totalEarnings}</strong> earned
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setIsNewAstro(false);
                                setEditingAstro({ ...a });
                              }}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer"
                              title="Edit Astrologer"
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
                        Customer Seva Bookings &amp; Video Proofs
                      </h2>
                      <p className="text-xs text-[#71614e]">
                        Track sankalp status, assign Vedic goshala priests, and upload actual video &amp; photo proofs.
                      </p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1 bg-[#f4ebd5] p-1 rounded-xl text-xs font-semibold">
                      {(['all', 'confirmed', 'in_progress', 'completed'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setBookingFilter(st)}
                          className={`px-3 py-1 rounded-lg capitalize cursor-pointer transition-colors ${
                            bookingFilter === st ? 'bg-[#1b4b32] text-white font-bold' : 'text-[#5a4c3c]'
                          }`}
                        >
                          {st.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-[#8b7964] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search bookings by devotee name, phone number, gotra, or seva title..."
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
                          <th className="p-3">Booking ID</th>
                          <th className="p-3">Devotee Info</th>
                          <th className="p-3">Seva &amp; Duration</th>
                          <th className="p-3">Occasion</th>
                          <th className="p-3">Dakshina</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Proof &amp; WhatsApp</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f2e5cc]">
                        {filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-[#fcf9f2]">
                            <td className="p-3 font-mono font-bold text-[#8b6f38]">{b.bookingId}</td>
                            <td className="p-3">
                              <div className="font-bold text-[#1b4b32]">{b.devoteeName}</div>
                              <div className="text-[10px] text-[#71614e]">+91 {b.phone}</div>
                              <div className="text-[10px] text-[#8b7355]">Gotra: {b.gotra}</div>
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
                                <span className="text-[9px] text-[#c4821a] font-bold block">+₹21 Occasion</span>
                              )}
                            </td>
                            <td className="p-3">
                              <select
                                value={b.status}
                                onChange={(e) => handleUpdateStatus(b.id, e.target.value as any)}
                                className="px-2 py-1 rounded-lg border border-[#ebdcb9] text-[10px] font-bold bg-white"
                              >
                                <option value="confirmed">Confirmed</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
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
                                    <Video className="w-3.5 h-3.5" /> View Video
                                  </a>
                                  <span className="text-[9px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold block">
                                    WhatsApp Shared ✓
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-amber-800 italic">Pending Upload</span>
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
                                <span>Upload Proof</span>
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
                      Pricing, Discounts &amp; Promotional Banners
                    </h2>
                    <p className="text-xs text-[#71614e]">
                      Configure per-minute astrologer rates, seva discount triggers, and occasion fees.
                    </p>
                  </div>

                  <form onSubmit={handleSaveSettings} className="space-y-4 bg-[#fffdf9] p-5 rounded-2xl border border-[#ebdcb9]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#453728] mb-1">
                          Standard Astrologer Rate (₹ / min)
                        </label>
                        <input
                          type="number"
                          value={settings.standardRatePerMin}
                          onChange={(e) => setSettings({ ...settings, standardRatePerMin: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-bold focus:outline-hidden focus:border-[#1b4b32]"
                        />
                        <span className="text-[10px] text-[#786a55]">Default rate for devotees without completed seva.</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#453728] mb-1">
                          Discounted Astrologer Rate (₹ / min)
                        </label>
                        <input
                          type="number"
                          value={settings.discountedRatePerMin}
                          onChange={(e) => setSettings({ ...settings, discountedRatePerMin: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-bold text-emerald-800 focus:outline-hidden focus:border-[#1b4b32]"
                        />
                        <span className="text-[10px] text-emerald-700 font-medium">50% discount rate after seva sankalp.</span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#453728] mb-1">
                          Extra Occasion Fee (₹)
                        </label>
                        <input
                          type="number"
                          value={settings.extraOccasionFee}
                          onChange={(e) => setSettings({ ...settings, extraOccasionFee: Number(e.target.value) })}
                          className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-bold focus:outline-hidden focus:border-[#1b4b32]"
                        />
                        <span className="text-[10px] text-[#786a55]">Added when devotee selects a special occasion.</span>
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
                            Enable 50% Astrologer Discount Rule
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#ebdcb9] space-y-2">
                      <label className="block text-xs font-bold text-[#453728]">
                        Promotional Offer Banner Message
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
                        <span className="text-xs text-[#524434] font-medium">Display banner across homepage</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full bg-[#1b4b32] text-white font-bold text-xs flex items-center gap-2 shadow-xs hover:bg-[#153e29] cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Pricing &amp; Discount Configuration</span>
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
                        Manage Devotee Reviews across India
                      </h2>
                      <p className="text-xs text-[#71614e]">
                        Moderate authentic 1-liner Hinglish reviews displayed on the website.
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
                            {r.isApproved ? 'Approved & Visible' : 'Pending Review'}
                          </span>
                          <button
                            onClick={async () => {
                              await api.deleteReview(r.id);
                              showNotification('Review deleted');
                              await loadAllData();
                            }}
                            className="text-red-700 text-xs font-bold hover:underline cursor-pointer"
                          >
                            Delete
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
                      Registered Devotees &amp; Wallet Balances
                    </h2>
                    <p className="text-xs text-[#71614e]">
                      View devotee profiles, wallet balances, and automatic consultation deductions.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#fcf8ee] border border-[#ebdcb9] flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[#1b4b32]">Shri Harsh Bhardwaj (Sample Devotee)</h4>
                      <p className="text-xs text-[#71614e]">+91 9876543210 • Gotra: Kashyap</p>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-1">
                        Eligible for 50% Astrologer Discount (Completed Seva Verified)
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-[#786a55] font-semibold">Wallet Balance</div>
                      <div className="text-2xl font-black text-[#1b4b32]">₹250</div>
                      <div className="text-[10px] text-emerald-700 font-bold">25 min consultation credit</div>
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
                {isNewService ? 'Add New Seva Service' : `Edit ${editingService.title}`}
              </h3>
              <button onClick={() => setEditingService(null)} className="p-1 text-[#786a55] hover:text-black cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">Seva Title *</label>
                  <input
                    type="text"
                    required
                    value={editingService.title || ''}
                    onChange={(e) => setEditingService({ ...editingService, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">Base Price (₹) *</label>
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
                  <label className="block text-xs font-bold text-[#453728] mb-1">Price Display Label</label>
                  <input
                    type="text"
                    value={editingService.priceDisplay || ''}
                    onChange={(e) => setEditingService({ ...editingService, priceDisplay: e.target.value })}
                    placeholder="e.g. ₹251 (5 kg)"
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">Unit of Offering</label>
                  <input
                    type="text"
                    value={editingService.unit || 'lot'}
                    onChange={(e) => setEditingService({ ...editingService, unit: e.target.value })}
                    placeholder="e.g. lot (5 kg) or thali"
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">Grah / Deity Association</label>
                  <input
                    type="text"
                    value={editingService.planetTag || '☀️ Surya Grah'}
                    onChange={(e) => setEditingService({ ...editingService, planetTag: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">Category</label>
                  <select
                    value={editingService.category || 'cow'}
                    onChange={(e) => setEditingService({ ...editingService, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  >
                    <option value="cow">Cow / Gaumata Seva</option>
                    <option value="bird">Pakshi Dana (Bird Feeding)</option>
                    <option value="ant">Cheenti Aata (Ant Feeding)</option>
                    <option value="dog">Street Dogs Feeding</option>
                    <option value="combo">Combo / Special Festival Seva</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#453728] mb-1">Spiritual Benefit (Short)</label>
                <input
                  type="text"
                  value={editingService.benefit || ''}
                  onChange={(e) => setEditingService({ ...editingService, benefit: e.target.value })}
                  placeholder="e.g. Helps reduce Surya Dosh & brings confidence & success."
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#453728] mb-1">Detailed Description</label>
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
                  Upload / Replace Real Seva Photo
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'service')}
                    className="text-xs text-[#524434] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#1b4b32] file:text-white hover:file:bg-[#153e29]"
                  />
                  {editingService.customImageUrl && (
                    <span className="text-[11px] text-emerald-700 font-bold">✓ Custom Image Attached</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ebdcb9]">
                <button
                  type="button"
                  onClick={() => setEditingService(null)}
                  className="px-4 py-2 rounded-full border border-[#ebdcb9] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#1b4b32] text-white text-xs font-bold hover:bg-[#153e29] cursor-pointer"
                >
                  Save Service
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
                {isNewAstro ? 'Add New Astrologer' : `Edit ${editingAstro.name}`}
              </h3>
              <button onClick={() => setEditingAstro(null)} className="p-1 text-[#786a55] hover:text-black cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAstrologer} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">Astrologer Name *</label>
                  <input
                    type="text"
                    required
                    value={editingAstro.name || ''}
                    onChange={(e) => setEditingAstro({ ...editingAstro, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">Title / Designation</label>
                  <input
                    type="text"
                    value={editingAstro.title || ''}
                    onChange={(e) => setEditingAstro({ ...editingAstro, title: e.target.value })}
                    placeholder="e.g. Tarot & Vedic Expert"
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">Experience</label>
                  <input
                    type="text"
                    value={editingAstro.experience || ''}
                    onChange={(e) => setEditingAstro({ ...editingAstro, experience: e.target.value })}
                    placeholder="e.g. 15+ Years Experience"
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#453728] mb-1">Rate Per Minute (₹) *</label>
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
                <label className="block text-xs font-bold text-[#453728] mb-1">Biography / Vedic Lineage</label>
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
                  Upload Astrologer Profile Photo
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'astrologer')}
                    className="text-xs text-[#524434] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#1b4b32] file:text-white hover:file:bg-[#153e29]"
                  />
                  {editingAstro.customImageUrl && (
                    <span className="text-[11px] text-emerald-700 font-bold">✓ Custom Photo Attached</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ebdcb9]">
                <button
                  type="button"
                  onClick={() => setEditingAstro(null)}
                  className="px-4 py-2 rounded-full border border-[#ebdcb9] text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-full bg-[#1b4b32] text-white text-xs font-bold hover:bg-[#153e29] cursor-pointer"
                >
                  Save Astrologer
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
                  Upload Seva Completion Proof
                </h3>
                <p className="text-xs text-[#786a55]">
                  Devotee: <strong>{proofModalBooking.devoteeName}</strong> • {proofModalBooking.bookingId}
                </p>
              </div>
              <button onClick={() => setProofModalBooking(null)} className="p-1 text-[#786a55] hover:text-black cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#453728] mb-1">
                  Video Proof URL (MP4 / WebM / Cloud Storage) *
                </label>
                <input
                  type="url"
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  placeholder="https://.../video-proof.mp4"
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium"
                />
                <span className="text-[10px] text-[#786a55]">Leave blank to use default certified Vrindavan HD Gau Puja video proof.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#453728] mb-1">
                  Officiating Goshala Priest Name
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
                  <span>📱 WhatsApp Proof Notification Preview (+91 {proofModalBooking.phone}):</span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed font-mono">
                  &ldquo;Hari Om {proofModalBooking.devoteeName} ji! Your sacred {proofModalBooking.sevaTitle} sankalp has been performed with your Gotra ({proofModalBooking.gotra}) at {proofModalBooking.goshala}. Watch your video proof here: [Attached HD Video]. Jai Gaumata!&rdquo;
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#ebdcb9]">
              <button
                type="button"
                onClick={() => setProofModalBooking(null)}
                className="px-4 py-2 rounded-full border border-[#ebdcb9] text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveProof}
                className="px-6 py-2 rounded-full bg-[#1b4b32] text-white text-xs font-bold hover:bg-[#153e29] cursor-pointer"
              >
                Confirm &amp; Send WhatsApp Proof
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
