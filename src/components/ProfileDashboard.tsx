import React, { useEffect, useMemo, useState } from 'react';
import {
  User,
  Wallet,
  HeartHandshake,
  History,
  CreditCard,
  FileText,
  Users,
  Sparkles,
  Bell,
  HelpCircle,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  PlusCircle,
  Video,
  Edit3,
  Trash2,
  ShieldCheck,
  Send,
  AlertCircle,
} from 'lucide-react';
import { AuthUser } from './AuthModal';
import { api, BookingRecord, normalizePhone, WalletInfo } from '../services/api';
import { clearSupabaseSession, getValidSupabaseSession } from '../services/supabaseClient';
import { useLanguage } from '../i18n/LanguageContext';

export type ProfileTab =
  | 'overview'
  | 'wallet'
  | 'seva'
  | 'history'
  | 'payments'
  | 'details'
  | 'family'
  | 'jyotish'
  | 'notifications'
  | 'support';

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  gotra?: string;
}

interface ProfileDashboardProps {
  currentUser: AuthUser;
  initialTab?: ProfileTab;
  onTabChange?: (tab: ProfileTab) => void;
  onUpdateUser: (user: AuthUser) => void;
  onLogout: () => void;
  onBackToWebsite: () => void;
  onBookSevaClick: () => void;
  onOpenProofGallery: () => void;
  onOpenAdmin?: () => void;
  onOpenAstrologer?: () => void;
}

export const ProfileDashboard: React.FC<ProfileDashboardProps> = ({
  currentUser,
  initialTab = 'overview',
  onTabChange,
  onUpdateUser,
  onLogout,
  onBackToWebsite,
  onBookSevaClick,
  onOpenProofGallery,
  onOpenAdmin,
  onOpenAstrologer,
}) => {
  const { lang, setLang, tr } = useLanguage();
  const [activeTab, setActiveTab] = useState<ProfileTab>(initialTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);

  // Wallet recharge state
  const [topupAmount, setTopupAmount] = useState<number>(100);
  const [customTopup, setCustomTopup] = useState<string>('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletSuccess, setWalletSuccess] = useState<string | null>(null);
  const [sessionNeedsRefresh, setSessionNeedsRefresh] = useState(false);

  // My Details editable state
  const profileStorageKey = `gaukripa_profile_meta_${currentUser.email.toLowerCase()}`;
  const [editName, setEditName] = useState(currentUser.name);
  const [editPhone, setEditPhone] = useState(normalizePhone(currentUser.phone, ''));
  const [editGotra, setEditGotra] = useState(() => {
    try {
      const saved = localStorage.getItem(profileStorageKey);
      return saved ? JSON.parse(saved)?.gotra || 'Kashyap' : 'Kashyap';
    } catch {
      return 'Kashyap';
    }
  });
  const [editCity, setEditCity] = useState(() => {
    try {
      const saved = localStorage.getItem(profileStorageKey);
      return saved ? JSON.parse(saved)?.city || '' : '';
    } catch {
      return '';
    }
  });
  const [memberSince] = useState(() => {
    try {
      const saved = localStorage.getItem(profileStorageKey);
      const parsed = saved ? JSON.parse(saved) : null;
      if (parsed?.memberSince) return parsed.memberSince;
      const formatted = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      localStorage.setItem(profileStorageKey, JSON.stringify({ ...(parsed || {}), memberSince: formatted }));
      return formatted;
    } catch {
      return '2026';
    }
  });
  const [detailsSaved, setDetailsSaved] = useState(false);

  // Family members state
  const familyStorageKey = `gaukripa_family_${currentUser.email.toLowerCase()}`;
  const [familyList, setFamilyList] = useState<FamilyMember[]>(() => {
    try {
      const raw = localStorage.getItem(familyStorageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [newFamName, setNewFamName] = useState('');
  const [newFamRelation, setNewFamRelation] = useState('');
  const [newFamGotra, setNewFamGotra] = useState(editGotra || 'Kashyap');

  // Notifications read state
  const [notificationsRead, setNotificationsRead] = useState(false);

  // Support form
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSent, setSupportSent] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const switchTab = (tab: ProfileTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);
    setMobileMenuOpen(false);
    setWalletError(null);
    setWalletSuccess(null);
  };

  useEffect(() => {
    let active = true;
    setLoadingData(true);

    getValidSupabaseSession()
      .then((session) => {
        if (active) setSessionNeedsRefresh(!session?.access_token);
      })
      .catch(() => {
        if (active) setSessionNeedsRefresh(true);
      });

    const cleanPhone = normalizePhone(currentUser.phone, '');
    const walletPromise =
      cleanPhone.length >= 7
        ? api.getWallet(cleanPhone).catch(() => ({
            phone: cleanPhone,
            name: currentUser.name,
            balance: 0,
            transactions: [],
          }))
        : Promise.resolve({ phone: '', name: currentUser.name, balance: 0, transactions: [] });

    const bookingsPromise = api
      .getBookings()
      .then((all) =>
        all.filter(
          (b) =>
            (cleanPhone && (normalizePhone(b.phone, '') === cleanPhone || b.phone.includes(cleanPhone))) ||
            (currentUser.email && b.email?.toLowerCase() === currentUser.email.toLowerCase())
        )
      )
      .catch(() => [] as BookingRecord[]);

    Promise.all([walletPromise, bookingsPromise]).then(([w, b]) => {
      if (!active) return;
      setWallet(w);
      setBookings(b);
      setLoadingData(false);
    });

    return () => {
      active = false;
    };
  }, [currentUser]);

  const initials = useMemo(() => {
    const parts = (currentUser.name || 'Bhakt').trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return (parts[0]?.slice(0, 2) || 'GK').toUpperCase();
  }, [currentUser.name]);

  const totalAdded = useMemo(() => {
    return (wallet?.transactions || [])
      .filter((t) => t.type === 'credit')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [wallet]);

  const totalUsed = useMemo(() => {
    return (wallet?.transactions || [])
      .filter((t) => t.type === 'debit')
      .reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [wallet]);

  const activeSevaCount = useMemo(
    () => bookings.filter((b) => b.status === 'confirmed' || b.status === 'in_progress').length,
    [bookings]
  );
  const completedSevaCount = useMemo(
    () => bookings.filter((b) => b.status === 'completed').length,
    [bookings]
  );
  const pendingSevaCount = useMemo(
    () => bookings.filter((b) => b.status === 'confirmed').length,
    [bookings]
  );

  const latestBooking = bookings[0] || null;

  const isSuperAdmin =
    currentUser?.email?.toLowerCase() === 'bankush014@gmail.com' ||
    currentUser?.role === 'super_admin' ||
    currentUser?.role === 'admin';

  const handleWalletRecharge = async () => {
    const amount = customTopup.trim() ? Number(customTopup) : topupAmount;
    const cleanPhone = normalizePhone(editPhone || currentUser.phone, '');
    if (!Number.isInteger(amount) || amount < 50 || amount > 100000) {
      setWalletError(
        tr(
          'न्यूनतम वॉलेट रिचार्ज ₹50 है। कृपया सही राशि दर्ज करें।',
          'Kam se kam wallet recharge ₹50 hai. Kripaya sahi rashi darj karein.'
        )
      );
      return;
    }
    if (cleanPhone.length < 10) {
      setWalletError(
        tr(
          'रिचार्ज से पहले "My Details" में मान्य 10-अंकीय मोबाइल नंबर सहेजें।',
          'Recharge se pehle "My Details" mein sahi 10-digit mobile number save karein.'
        )
      );
      return;
    }

    setWalletError(null);
    setWalletSuccess(null);
    setTopupLoading(true);
    try {
      const order = await api.createWalletOrder(cleanPhone, amount, currentUser.name, currentUser.email);
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () =>
            reject(new Error(tr('Razorpay चेकआउट लोड नहीं हो सका।', 'Razorpay Checkout load nahi ho saka.')));
          document.body.appendChild(script);
        });
      }

      const RazorpayCheckout = (window as any).Razorpay;
      if (!RazorpayCheckout || !order.key_id) {
        throw new Error(tr('Razorpay चेकआउट उपलब्ध नहीं है।', 'Razorpay Checkout abhi uplabdh nahi hai.'));
      }

      const checkout = new RazorpayCheckout({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'GauKripa',
        description: tr('गौकृपा वॉलेट रिचार्ज', 'GauKripa Wallet Recharge'),
        order_id: order.order_id,
        prefill: { name: currentUser.name, email: currentUser.email, contact: cleanPhone },
        theme: { color: '#b54c0d' },
        handler: async (response: any) => {
          try {
            const result = await api.verifyWalletPayment({
              order_id: response.razorpay_order_id || order.order_id || '',
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature || '',
              phone: cleanPhone,
              amount,
            });
            const freshWallet = await api.getWallet(cleanPhone);
            setWallet(freshWallet);
            setWalletSuccess(
              result.credited
                ? tr(
                    `भुगतान सफल! आपके वॉलेट में ₹${amount} जोड़ दिए गए हैं।`,
                    `Payment safal! Aapke wallet mein ₹${amount} jod diye gaye hain.`
                  )
                : tr('यह भुगतान पहले ही वॉलेट में जोड़ा जा चुका है।', 'Yeh payment pehle hi wallet mein joda ja chuka hai.')
            );
            setCustomTopup('');
          } catch (err: any) {
            setWalletError(err?.message || tr('भुगतान सत्यापन लंबित है।', 'Payment verification asafal raha.'));
          } finally {
            setTopupLoading(false);
          }
        },
        modal: { ondismiss: () => setTopupLoading(false), escape: true },
      });
      checkout.on('payment.failed', (resp: any) => {
        setWalletError(resp?.error?.description || tr('Razorpay भुगतान असफल रहा।', 'Razorpay payment fail ho gaya.'));
        setTopupLoading(false);
      });
      setTopupLoading(false);
      checkout.open();
    } catch (err: any) {
      const msg = err?.message || tr('वॉलेट रिचार्ज प्रारंभ नहीं हो सका।', 'Wallet recharge shuru nahi ho saka.');
      if (msg.toLowerCase().includes('session') || msg.toLowerCase().includes('sign in')) {
        setSessionNeedsRefresh(true);
      }
      setWalletError(msg);
      setTopupLoading(false);
    }
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = normalizePhone(editPhone, currentUser.phone || '');
    const updatedUser: AuthUser = {
      ...currentUser,
      name: editName.trim() || currentUser.name,
      phone: cleanPhone,
    };
    try {
      localStorage.setItem(
        profileStorageKey,
        JSON.stringify({ gotra: editGotra.trim() || 'Kashyap', city: editCity.trim(), memberSince })
      );
    } catch {}
    onUpdateUser(updatedUser);
    setDetailsSaved(true);
    setTimeout(() => setDetailsSaved(false), 2500);
  };

  const handleAddFamily = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFamName.trim()) return;
    const updated = [
      ...familyList,
      {
        id: `fam-${Date.now()}`,
        name: newFamName.trim(),
        relation: newFamRelation.trim() || tr('परिवार सदस्य', 'Parivar Sadasya'),
        gotra: newFamGotra.trim() || editGotra || 'Kashyap',
      },
    ];
    setFamilyList(updated);
    try {
      localStorage.setItem(familyStorageKey, JSON.stringify(updated));
    } catch {}
    setNewFamName('');
    setNewFamRelation('');
  };

  const handleDeleteFamily = (id: string) => {
    const updated = familyList.filter((m) => m.id !== id);
    setFamilyList(updated);
    try {
      localStorage.setItem(familyStorageKey, JSON.stringify(updated));
    } catch {}
  };

  const handleLogoutClick = () => {
    clearSupabaseSession();
    onLogout();
  };

  const primarySidebarItems: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: tr('प्रोफ़ाइल अवलोकन', 'Profile Overview'), icon: <User className="w-4 h-4" /> },
    { id: 'wallet', label: tr('मेरा वॉलेट', 'Mera Wallet'), icon: <Wallet className="w-4 h-4" /> },
    { id: 'seva', label: tr('मेरी सेवा', 'Meri Seva'), icon: <HeartHandshake className="w-4 h-4" /> },
    { id: 'history', label: tr('सेवा इतिहास', 'Seva History'), icon: <History className="w-4 h-4" /> },
    { id: 'payments', label: tr('भुगतान विवरण', 'Payment History'), icon: <CreditCard className="w-4 h-4" /> },
    { id: 'details', label: tr('मेरी जानकारी', 'My Details'), icon: <FileText className="w-4 h-4" /> },
    { id: 'family', label: tr('मेरा परिवार', 'My Family'), icon: <Users className="w-4 h-4" /> },
    { id: 'jyotish', label: tr('मेरा ज्योतिष', 'My Jyotish'), icon: <Sparkles className="w-4 h-4" /> },
  ];

  const secondarySidebarItems: { id: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { id: 'notifications', label: tr('सूचनाएं', 'Notifications'), icon: <Bell className="w-4 h-4" /> },
    { id: 'support', label: tr('सहायता केंद्र', 'Help & Support'), icon: <HelpCircle className="w-4 h-4" /> },
  ];

  const formatCurrency = (val: number) =>
    `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const renderSidebarLinks = () => (
    <div className="flex flex-col h-full justify-between py-4 px-3">
      <div className="space-y-1">
        {primarySidebarItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => switchTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer text-left ${
                isActive
                  ? 'bg-[#d86416] text-white shadow-xs'
                  : 'text-[#3b2615] hover:bg-[#fbf2e4] hover:text-[#b54c0d]'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-[#876546]'}>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        <div className="my-3 border-t border-[#efe2cf]" />

        {secondarySidebarItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => switchTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold transition-all cursor-pointer text-left ${
                isActive
                  ? 'bg-[#d86416] text-white shadow-xs'
                  : 'text-[#3b2615] hover:bg-[#fbf2e4] hover:text-[#b54c0d]'
              }`}
            >
              <span className={isActive ? 'text-white' : 'text-[#876546]'}>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}

        {isSuperAdmin && (onOpenAdmin || onOpenAstrologer) && (
          <>
            <div className="my-3 border-t border-[#efe2cf]" />
            {onOpenAdmin && (
              <button
                type="button"
                onClick={onOpenAdmin}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-[#9a460b] bg-[#fdf3e1] hover:bg-[#fae6c5] cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{tr('एडमिन डैशबोर्ड', 'Admin Console')}</span>
              </button>
            )}
            {onOpenAstrologer && (
              <button
                type="button"
                onClick={onOpenAstrologer}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold text-[#6e4823] hover:bg-[#fbf2e4] cursor-pointer mt-1"
              >
                <Sparkles className="w-4 h-4 text-[#d86416]" />
                <span>{tr('ज्योतिष डेस्क', 'Jyotish Desk')}</span>
              </button>
            )}
          </>
        )}
      </div>

      <div className="pt-3 border-t border-[#efe2cf] space-y-1">
        <button
          type="button"
          onClick={onBackToWebsite}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold text-[#5e442c] hover:bg-[#fbf2e4] hover:text-[#b54c0d] cursor-pointer text-left"
        >
          <ArrowLeft className="w-4 h-4 text-[#876546]" />
          <span>{tr('मुख्य वेबसाइट पर जाएं', 'Back to Website')}</span>
        </button>
        <button
          type="button"
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] font-semibold text-[#8c2f19] hover:bg-rose-50 cursor-pointer text-left"
        >
          <LogOut className="w-4 h-4 text-[#b84023]" />
          <span>{tr('लॉग आउट', 'Logout')}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf6ee] text-[#2e1a0c]">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#eddcc4] h-14 sm:h-16 px-3.5 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBackToWebsite}
            className="flex items-center gap-2 cursor-pointer group"
            title={tr('मुख्य वेबसाइट पर लौटें', 'Back to Website')}
          >
            <svg
              className="w-8 h-7 sm:w-9 sm:h-8 text-[#d86416] shrink-0"
              viewBox="0 0 64 52"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M22 10c3-4 6-6 10-6s7 2 10 6" strokeOpacity="0.55" />
              <path d="M22 17c-4-5-3-10 1-12" />
              <path d="M42 17c4-5 3-10-1-12" />
              <path d="M20 20c-7-1-12 2-13 6 4 2 9 2 12 0" />
              <path d="M44 20c7-1 12 2 13 6-4 2-9 2-12 0" />
              <path d="M21 18c-2 8-2 15 2 22 2 4 5 6 9 6s7-2 9-6c4-7 4-14 2-22-4-3-18-3-22 0z" />
              <path d="M32 18v5" stroke="#b54c0d" strokeWidth="2.2" />
              <circle cx="26.5" cy="26" r="1.3" fill="currentColor" stroke="none" />
              <circle cx="37.5" cy="26" r="1.3" fill="currentColor" stroke="none" />
              <path d="M26 37c2 1.5 10 1.5 12 0" />
            </svg>
            <span className="font-playfair text-xl sm:text-2xl font-bold text-[#2e1a0c] tracking-tight">
              GauKripa
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switch */}
          <div className="inline-flex items-center gap-1 rounded-full bg-[#fbf6ee] border border-[#e3cfb0] px-2.5 py-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`cursor-pointer ${lang === 'en' ? 'text-[#2e1a0c]' : 'text-[#8c7660]'}`}
            >
              EN
            </button>
            <span className="text-[#cbb9a1]">|</span>
            <button
              type="button"
              onClick={() => setLang('hi')}
              className={`cursor-pointer ${lang === 'hi' ? 'text-[#b54c0d]' : 'text-[#8c7660]'}`}
            >
              हिं
            </button>
          </div>

          <button
            type="button"
            onClick={onBackToWebsite}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#e3cfb0] bg-[#fbf6ee] hover:bg-[#f4e7d2] text-xs font-semibold text-[#5a3b24] cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{tr('वेबसाइट', 'Website')}</span>
          </button>

          {/* Three-Line Hamburger Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={tr('प्रोफ़ाइल मेनू खोलें', 'Open Profile Menu')}
            className="p-2 rounded-lg text-[#2e1a0c] hover:bg-[#fbf2e4] transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Body Wrapper */}
      <div className="flex-1 flex relative max-w-7xl w-full mx-auto">
        {/* Desktop Persistent Sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 bg-white border-r border-[#eddcc4] flex-col">
          {renderSidebarLinks()}
        </aside>

        {/* Three-Line Drawer (Works on both Mobile & Desktop) */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/45 backdrop-blur-xs">
            <div
              className="fixed inset-0"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative z-10 w-76 max-w-[86vw] bg-white h-full shadow-2xl border-l border-[#eddcc4] flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200">
              <div className="px-4 py-3.5 border-b border-[#eddcc4] flex items-center justify-between bg-[#fbf6ee]">
                <span className="font-playfair font-bold text-lg text-[#2e1a0c]">
                  {tr('प्रोफ़ाइल मेनू', 'Profile Menu')}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onBackToWebsite();
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#e3cfb0] bg-white hover:bg-[#f4e7d2] text-[11px] font-semibold text-[#5a3b24] cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>{tr('वेबसाइट', 'Home')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-[#fbf2e4] cursor-pointer"
                    aria-label={tr('मेनू बंद करें', 'Close Menu')}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">{renderSidebarLinks()}</div>
            </div>
          </div>
        )}

        {/* Main Content Canvas */}
        <main className="flex-1 p-3.5 sm:p-6 pb-24 lg:pb-8 overflow-y-auto space-y-5">
          {activeTab === 'overview' && (
            <>
              {/* Top 2-Card Profile & Wallet Row (2-col side-by-side on both Mobile & Desktop matching mockup) */}
              <div className="grid grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-5 items-stretch">
                {/* Customer Info Card */}
                <div className="col-span-1 lg:col-span-7 bg-white rounded-2xl border border-[#ede0ca] shadow-[0_6px_18px_rgba(92,54,18,0.05)] p-3 sm:p-6 flex flex-col justify-between gap-3">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-5 text-center sm:text-left">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-[#d86416] text-white font-bold text-xl sm:text-3xl flex items-center justify-center shrink-0 shadow-xs">
                      {initials}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1 sm:space-y-1.5 w-full">
                      <div>
                        <div className="hidden sm:block text-[11px] font-medium text-[#755b43]">
                          {tr('ग्राहक का नाम', 'Customer Name')}
                        </div>
                        <h2 className="text-sm sm:text-xl font-bold text-[#2e1a0c] truncate">
                          {currentUser.name}
                        </h2>
                      </div>

                      <div>
                        <div className="hidden sm:block text-[11px] font-medium text-[#755b43]">
                          {tr('मोबाइल', 'Mobile')}
                        </div>
                        <div className="text-[11px] sm:text-sm font-semibold text-[#3f2c1b] tabular-nums truncate">
                          +91 {normalizePhone(currentUser.phone, '9876543210')}
                        </div>
                      </div>

                      <div>
                        <div className="hidden sm:block text-[11px] font-medium text-[#755b43]">
                          {tr('ईमेल', 'Email')}
                        </div>
                        <div className="text-[11px] sm:text-sm font-medium text-[#4f3a29] truncate">
                          {currentUser.email}
                        </div>
                      </div>

                      <div>
                        <div className="hidden sm:block text-[11px] font-medium text-[#755b43]">
                          {tr('खाता तिथि', 'Account Creation Date')}
                        </div>
                        <div className="text-[10px] sm:text-xs font-medium text-[#6c543e]">
                          {tr('सदस्य:', 'Member Since:')} {memberSince}
                        </div>
                      </div>

                      <div className="pt-0.5">
                        <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full bg-[#fdf1da] border border-[#ebd09c] text-[10px] sm:text-xs font-bold text-[#9a460b]">
                          {tr('गौकृपा सदस्य 🙏', 'GauKripa Member 🙏')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Profile Edit CTA */}
                  <button
                    type="button"
                    onClick={() => switchTab('details')}
                    className="sm:hidden w-full py-2 rounded-xl bg-[#d86416] hover:bg-[#b54c0d] text-white font-bold text-xs shadow-xs cursor-pointer transition-colors"
                  >
                    {tr('प्रोफ़ाइल बदलें', 'Profile Edit')}
                  </button>
                </div>

                {/* GauKripa Wallet Card */}
                <div className="col-span-1 lg:col-span-5 bg-white rounded-2xl border border-[#ede0ca] shadow-[0_6px_18px_rgba(92,54,18,0.05)] p-3 sm:p-5 flex flex-col justify-between gap-2.5 sm:gap-3">
                  <div className="space-y-2.5">
                    <h3 className="text-xs sm:text-base font-bold text-[#2e1a0c]">
                      {tr('गौकृपा वॉलेट', 'GauKripa Wallet')}
                    </h3>

                    <div className="bg-[#2b1507] text-white rounded-xl p-2.5 sm:p-4">
                      <div className="text-[10px] sm:text-xs text-[#e5cfb7] font-medium">
                        {tr('उपलब्ध शेष राशि', 'Available Wallet Balance')}
                      </div>
                      <div className="text-base sm:text-3xl font-black tracking-tight tabular-nums mt-0.5">
                        {formatCurrency(wallet?.balance || 0)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-3 pt-0.5">
                      <div>
                        <div className="text-[10px] sm:text-[11px] text-[#755b43] font-medium">
                          {tr('कुल जोड़ी गई राशि', 'Total Added')}
                        </div>
                        <div className="text-xs sm:text-base font-bold text-[#2e1a0c] tabular-nums">
                          {formatCurrency(totalAdded)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] sm:text-[11px] text-[#755b43] font-medium">
                          {tr('कुल उपयोग राशि', 'Total Used')}
                        </div>
                        <div className="text-xs sm:text-base font-bold text-[#2e1a0c] tabular-nums">
                          {formatCurrency(totalUsed)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => switchTab('wallet')}
                    className="w-full py-2 sm:py-2.5 rounded-xl bg-[#d86416] hover:bg-[#b54c0d] text-white font-bold text-[11px] sm:text-sm shadow-xs cursor-pointer transition-colors whitespace-nowrap"
                  >
                    <span className="sm:hidden">{tr('वॉलेट जोड़ें', 'Wallet Jodein')}</span>
                    <span className="hidden sm:inline">{tr('वॉलेट में पैसे जोड़ें', 'Wallet Mein Paise Jodein')}</span>
                  </button>
                </div>
              </div>

              {/* Meri Seva Summary Section */}
              <div className="space-y-3">
                <h3 className="text-sm sm:text-lg font-bold text-[#2e1a0c]">
                  {tr('मेरी सेवा सारांश', 'Meri Seva Summary')}
                </h3>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-white rounded-2xl border border-[#ede0ca] p-3 sm:p-4 shadow-2xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#fdf1da] text-[#d86416] flex items-center justify-center shrink-0">
                        <HeartHandshake className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] sm:text-xs font-medium text-[#6c543e] truncate">
                          {tr('कुल सेवा बुकिंग', 'Total Seva Bookings')}
                        </div>
                        <div className="text-lg sm:text-2xl font-black text-[#2e1a0c] tabular-nums leading-tight">
                          {loadingData ? '—' : bookings.length}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#ede0ca] p-3 sm:p-4 shadow-2xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#fdf1da] text-[#d86416] flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] sm:text-xs font-medium text-[#6c543e] truncate">
                          {tr('सक्रिय सेवा', 'Active Seva')}
                        </div>
                        <div className="text-lg sm:text-2xl font-black text-[#2e1a0c] tabular-nums leading-tight">
                          {loadingData ? '—' : activeSevaCount}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#ede0ca] p-3 sm:p-4 shadow-2xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#fdf1da] text-[#d86416] flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] sm:text-xs font-medium text-[#6c543e] truncate">
                          {tr('पूर्ण सेवा', 'Completed Seva')}
                        </div>
                        <div className="text-lg sm:text-2xl font-black text-[#2e1a0c] tabular-nums leading-tight">
                          {loadingData ? '—' : completedSevaCount}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl border border-[#ede0ca] p-3 sm:p-4 shadow-2xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#fdf1da] text-[#d86416] flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] sm:text-xs font-medium text-[#6c543e] truncate">
                          {tr('लंबित / आगामी', 'Pending Seva')}
                        </div>
                        <div className="text-lg sm:text-2xl font-black text-[#2e1a0c] tabular-nums leading-tight">
                          {loadingData ? '—' : pendingSevaCount}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Seva Booking Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-lg font-bold text-[#2e1a0c]">
                    {tr('हाल की सेवा बुकिंग', 'Recent Seva Booking')}
                  </h3>
                  {bookings.length > 0 && (
                    <button
                      type="button"
                      onClick={() => switchTab('history')}
                      className="text-xs font-bold text-[#b54c0d] hover:underline cursor-pointer"
                    >
                      {tr('सभी देखें', 'View All')}
                    </button>
                  )}
                </div>

                {latestBooking ? (
                  <div className="bg-white rounded-2xl border border-[#ede0ca] p-4 sm:p-5 shadow-2xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-sm sm:text-base text-[#2e1a0c]">
                        {latestBooking.sevaTitle}
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#fdf1da] border border-[#ebd09c] text-[10px] sm:text-xs font-bold text-[#9a460b] shrink-0">
                        {latestBooking.status === 'completed'
                          ? tr('पूर्ण', 'Completed')
                          : tr('सक्रिय', 'Active')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <div className="text-[11px] text-[#755b43]">{tr('मात्रा / प्रकार', 'Item')}</div>
                        <div className="font-bold text-[#2e1a0c] truncate">{latestBooking.quantity}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#755b43]">{tr('बुकिंग आईडी', 'Booking ID')}</div>
                        <div className="font-bold text-[#2e1a0c] font-mono">{latestBooking.bookingId}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#755b43]">{tr('तारीख', 'Date')}</div>
                        <div className="font-bold text-[#2e1a0c] tabular-nums">{latestBooking.date}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#755b43]">{tr('राशि', 'Amount')}</div>
                        <div className="font-bold text-[#2e1a0c] tabular-nums">
                          {formatCurrency(latestBooking.amount)}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#f3e8d6] flex items-center justify-between gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={onOpenProofGallery}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fdf1da] hover:bg-[#fbe5ba] text-[#9a460b] text-[11px] font-bold cursor-pointer transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>{tr('वीडियो प्रमाण उपलब्ध', 'Video Proof Available')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedBooking(latestBooking)}
                        className="px-3.5 py-1 rounded-lg border border-[#e3cfb0] hover:border-[#b54c0d] text-xs font-bold text-[#2e1a0c] hover:text-[#b54c0d] cursor-pointer transition-colors"
                      >
                        {tr('विवरण देखें', 'View Details')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-[#ede0ca] p-6 text-center space-y-3">
                    <p className="text-xs sm:text-sm text-[#6c543e]">
                      {tr(
                        'अभी कोई सेवा बुकिंग दर्ज नहीं है। गाय को हरा चारा या आहार सेवा बुक करके शुरुआत करें।',
                        'Abhi koi seva booking darj nahi hai. Gaumata ko hara chara ya aahar seva book karke shuruat karein.'
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={onBookSevaClick}
                      className="px-5 py-2 rounded-full bg-[#d86416] hover:bg-[#b54c0d] text-white font-bold text-xs cursor-pointer transition-colors"
                    >
                      {tr('पहली सेवा बुक करें 🙏', 'Apni Seva Book Karein 🙏')}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'wallet' && (
            <div className="max-w-2xl space-y-4">
              <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#2e1a0c]">
                {tr('मेरा गौकृपा वॉलेट', 'Mera GauKripa Wallet')}
              </h2>

              <div className="bg-white rounded-2xl border border-[#ede0ca] p-4 sm:p-5 space-y-4 shadow-2xs">
                <div className="bg-[#2b1507] text-white rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#e5cfb7]">{tr('उपलब्ध शेष राशि', 'Available Wallet Balance')}</div>
                    <div className="text-3xl font-black tabular-nums mt-0.5">
                      {formatCurrency(wallet?.balance || 0)}
                    </div>
                  </div>
                  <Wallet className="w-8 h-8 text-[#f0b33a]" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4f3a29] mb-2">
                    {tr('त्वरित रिचार्ज राशि चुनें', 'Quick Recharge Amount Chunein')}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[50, 100, 250, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setTopupAmount(amt);
                          setCustomTopup('');
                          setWalletError(null);
                        }}
                        className={`py-2 rounded-xl border text-xs font-bold cursor-pointer tabular-nums ${
                          !customTopup && topupAmount === amt
                            ? 'bg-[#d86416] border-[#b54c0d] text-white'
                            : 'bg-[#fbf6ee] border-[#e3cfb0] text-[#2e1a0c]'
                        }`}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#4f3a29] mb-1">
                    {tr('अन्य राशि दर्ज करें (₹50+)', 'Custom Amount (₹50+)')}
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100000"
                    value={customTopup}
                    onChange={(e) => {
                      setCustomTopup(e.target.value);
                      setWalletError(null);
                    }}
                    placeholder={tr('₹50 या अधिक दर्ज करें', '₹50 ya adhik darj karein')}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e3cfb0] bg-[#fbf6ee] text-sm font-semibold focus:outline-hidden focus:border-[#b54c0d]"
                  />
                </div>

                {sessionNeedsRefresh && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-2">
                    <p className="font-semibold">
                      {tr(
                        'लाइव पेमेंट सर्वर से जुड़ने के लिए कृपया एक बार पुनः लॉगिन करें।',
                        'Live Razorpay payment ke liye kripaya ek baar dobara Sign In karein.'
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={handleLogoutClick}
                      className="px-3 py-1.5 rounded-lg bg-[#d86416] text-white font-bold text-xs cursor-pointer"
                    >
                      {tr('पुनः लॉगिन करें', 'Dobara Sign In Karein')}
                    </button>
                  </div>
                )}

                {walletSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{walletSuccess}</span>
                  </div>
                )}
                {walletError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{walletError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleWalletRecharge}
                  disabled={topupLoading}
                  className="w-full py-3 rounded-full bg-[#d86416] hover:bg-[#b54c0d] text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>
                    {topupLoading
                      ? tr('प्रक्रिया जारी है...', 'Payment Jaari Hai...')
                      : tr(
                          `₹${customTopup.trim() ? Number(customTopup) || 0 : topupAmount} वॉलेट में जोड़ें`,
                          `₹${customTopup.trim() ? Number(customTopup) || 0 : topupAmount} Wallet Mein Jodein`
                        )}
                  </span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-[#ede0ca] p-4 space-y-2.5">
                <h3 className="text-sm font-bold text-[#2e1a0c]">
                  {tr('वॉलेट लेनदेन इतिहास', 'Wallet Transactions')}
                </h3>
                {wallet?.transactions?.length ? (
                  wallet.transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-2 border-b border-[#f3e8d6] last:border-0 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#2e1a0c]">{tx.description}</div>
                        <div className="text-[11px] text-[#755b43]">{new Date(tx.date).toLocaleString()}</div>
                      </div>
                      <span
                        className={`font-bold tabular-nums ${
                          tx.type === 'debit' ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {tx.type === 'debit' ? '-' : '+'}₹{Number(tx.amount).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#755b43]">
                    {tr('अभी कोई वॉलेट लेनदेन नहीं है।', 'Abhi koi wallet transaction nahi hai.')}
                  </p>
                )}
              </div>
            </div>
          )}

          {(activeTab === 'seva' || activeTab === 'history') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#2e1a0c]">
                  {activeTab === 'seva' ? tr('मेरी सक्रिय सेवाएं', 'Meri Seva') : tr('मेरा सेवा इतिहास', 'Seva History')}
                </h2>
                <button
                  type="button"
                  onClick={onBookSevaClick}
                  className="px-4 py-2 rounded-full bg-[#d86416] hover:bg-[#b54c0d] text-white font-bold text-xs cursor-pointer"
                >
                  {tr('+ नई सेवा बुक करें', '+ Nayi Seva Book Karein')}
                </button>
              </div>

              {bookings.length > 0 ? (
                <div className="space-y-3">
                  {(activeTab === 'seva'
                    ? bookings.filter((b) => b.status === 'confirmed' || b.status === 'in_progress')
                    : bookings
                  ).map((b) => (
                    <div
                      key={b.id}
                      className="bg-white rounded-2xl border border-[#ede0ca] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#2e1a0c]">{b.sevaTitle}</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#fdf1da] text-[#9a460b] text-[10px] font-bold">
                            {b.status === 'completed' ? tr('पूर्ण', 'Completed') : tr('सक्रिय', 'Active')}
                          </span>
                        </div>
                        <div className="text-xs text-[#755b43]">
                          {b.bookingId} • {b.quantity} • {b.duration} • {b.date}
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <span className="text-base font-black text-[#2e1a0c] tabular-nums">
                          {formatCurrency(b.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(b)}
                          className="px-3 py-1.5 rounded-lg border border-[#e3cfb0] hover:border-[#b54c0d] text-xs font-bold text-[#2e1a0c] cursor-pointer"
                        >
                          {tr('विवरण', 'View Details')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-[#ede0ca] p-6 text-center space-y-3">
                  <p className="text-xs sm:text-sm text-[#6c543e]">
                    {tr('अभी कोई सेवा बुकिंग नहीं है।', 'Abhi koi seva booking nahi hai.')}
                  </p>
                  <button
                    type="button"
                    onClick={onBookSevaClick}
                    className="px-5 py-2 rounded-full bg-[#d86416] text-white font-bold text-xs cursor-pointer"
                  >
                    {tr('सेवा बुक करें', 'Seva Book Karein')}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="max-w-3xl space-y-4">
              <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#2e1a0c]">
                {tr('भुगतान इतिहास', 'Payment History')}
              </h2>
              <div className="bg-white rounded-2xl border border-[#ede0ca] p-4 space-y-2">
                {bookings.length === 0 && !(wallet?.transactions?.length) ? (
                  <p className="text-xs text-[#755b43] py-4 text-center">
                    {tr('अभी कोई भुगतान रिकॉर्ड उपलब्ध नहीं है।', 'Abhi koi payment record nahi hai.')}
                  </p>
                ) : (
                  <>
                    {bookings.map((b) => (
                      <div
                        key={`pay-${b.id}`}
                        className="flex items-center justify-between py-2.5 border-b border-[#f3e8d6] text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#2e1a0c]">
                            {b.sevaTitle} ({b.bookingId})
                          </div>
                          <div className="text-[11px] text-[#755b43]">{b.date}</div>
                        </div>
                        <span className="font-bold text-[#2e1a0c] tabular-nums">{formatCurrency(b.amount)}</span>
                      </div>
                    ))}
                    {(wallet?.transactions || []).map((tx) => (
                      <div
                        key={`wtx-${tx.id}`}
                        className="flex items-center justify-between py-2.5 border-b border-[#f3e8d6] last:border-0 text-xs"
                      >
                        <div>
                          <div className="font-bold text-[#2e1a0c]">{tx.description}</div>
                          <div className="text-[11px] text-[#755b43]">{new Date(tx.date).toLocaleDateString()}</div>
                        </div>
                        <span
                          className={`font-bold tabular-nums ${
                            tx.type === 'debit' ? 'text-rose-700' : 'text-emerald-700'
                          }`}
                        >
                          {tx.type === 'debit' ? '-' : '+'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="max-w-xl space-y-4">
              <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#2e1a0c]">
                {tr('मेरी व्यक्तिगत जानकारी', 'My Details')}
              </h2>
              <form
                onSubmit={handleSaveDetails}
                className="bg-white rounded-2xl border border-[#ede0ca] p-5 space-y-3.5 shadow-2xs"
              >
                <div>
                  <label className="block text-xs font-bold text-[#4f3a29] mb-1">
                    {tr('पूरा नाम', 'Customer Name')}
                  </label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#e3cfb0] bg-[#fbf6ee] text-sm font-medium focus:outline-hidden focus:border-[#b54c0d]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#4f3a29] mb-1">
                      {tr('व्हाट्सएप मोबाइल', 'Mobile Number')}
                    </label>
                    <input
                      type="tel"
                      required
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#e3cfb0] bg-[#fbf6ee] text-sm font-medium focus:outline-hidden focus:border-[#b54c0d]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4f3a29] mb-1">{tr('गोत्र', 'Gotra')}</label>
                    <input
                      type="text"
                      value={editGotra}
                      onChange={(e) => setEditGotra(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#e3cfb0] bg-[#fbf6ee] text-sm font-medium focus:outline-hidden focus:border-[#b54c0d]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#4f3a29] mb-1">{tr('ईमेल', 'Email')}</label>
                    <input
                      type="email"
                      disabled
                      value={currentUser.email}
                      className="w-full px-3 py-2 rounded-xl border border-[#e3cfb0] bg-[#f5ede0] text-sm font-medium text-[#755b43]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#4f3a29] mb-1">{tr('शहर', 'City')}</label>
                    <input
                      type="text"
                      value={editCity}
                      onChange={(e) => setEditCity(e.target.value)}
                      placeholder={tr('जैसे: नई दिल्ली', 'Jaise: New Delhi')}
                      className="w-full px-3 py-2 rounded-xl border border-[#e3cfb0] bg-[#fbf6ee] text-sm font-medium focus:outline-hidden focus:border-[#b54c0d]"
                    />
                  </div>
                </div>
                {detailsSaved && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{tr('प्रोफ़ाइल जानकारी सफलतापूर्वक सहेजी गई!', 'Profile details safaltapoorvak save ho gayi!')}</span>
                  </div>
                )}
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#d86416] hover:bg-[#b54c0d] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{tr('जानकारी सहेजें', 'Save Changes')}</span>
                </button>
              </form>
            </div>
          )}

          {activeTab === 'family' && (
            <div className="max-w-xl space-y-4">
              <h2 className="font-playfair text-xl sm:text-2xl font-bold text-[#2e1a0c]">
                {tr('संकल्प के लिए परिवार के सदस्य', 'My Family')}
              </h2>

              <form
                onSubmit={handleAddFamily}
                className="bg-white rounded-2xl border border-[#ede0ca] p-4 space-y-3 shadow-2xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    required
                    value={newFamName}
                    onChange={(e) => setNewFamName(e.target.value)}
                    placeholder={tr('सदस्य का नाम', 'Sadasya ka Naam')}
                    className="px-3 py-2 rounded-xl border border-[#e3cfb0] bg-[#fbf6ee] text-xs font-medium"
                  />
                  <input
                    type="text"
                    value={newFamRelation}
                    onChange={(e) => setNewFamRelation(e.target.value)}
                    placeholder={tr('संबंध (जैसे: माताजी)', 'Relation (Jaise: Mataji)')}
                    className="px-3 py-2 rounded-xl border border-[#e3cfb0] bg-[#fbf6ee] text-xs font-medium"
                  />
                  <input
                    type="text"
                    value={newFamGotra}
                    onChange={(e) => setNewFamGotra(e.target.value)}
                    placeholder={tr('गोत्र', 'Gotra')}
                    className="px-3 py-2 rounded-xl border border-[#e3cfb0] bg-[#fbf6ee] text-xs font-medium"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#d86416] hover:bg-[#b54c0d] text-white font-bold text-xs cursor-pointer"
                >
                  {tr('+ परिवार का सदस्य जोड़ें', '+ Parivar Sadasya Jodein')}
                </button>
              </form>

              <div className="space-y-2">
                {familyList.length > 0 ? (
                  familyList.map((m) => (
                    <div
                      key={m.id}
                      className="bg-white rounded-xl border border-[#ede0ca] px-4 py-3 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-[#2e1a0c]">{m.name}</div>
                        <div className="text-[#755b43]">
                          {m.relation} • {tr('गोत्र:', 'Gotra:')} {m.gotra}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteFamily(m.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                        aria-label="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#755b43]">
                    {tr('अभी कोई परिवार सदस्य नहीं जोड़ा गया है।', 'Abhi koi family member add nahi hai.')}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'jyotish' && (
            <div className="max-w-xl bg-white rounded-2xl border border-[#ede0ca] p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#fdf1da] text-[#d86416] flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="font-playfair text-xl font-bold text-[#2e1a0c]">
                {tr('मेरा वैदिक ज्योतिष परामर्श', 'My Jyotish')}
              </h2>
              <p className="text-xs sm:text-sm text-[#6c543e]">
                {tr(
                  'लाइव ज्योतिष परामर्श सुविधा जल्द आ रही है। अभी आप गाय को हरा चारा एवं ग्रह-शांति आहार सेवा बुक कर सकते हैं।',
                  'Live Jyotish paramarsh suvidha jald aa rahi hai. Abhi aap Gaumata Hara Chara aur aahar seva book kar sakte hain.'
                )}
              </p>
              <span className="inline-block px-4 py-1.5 rounded-full bg-[#d86416] text-white font-bold text-xs">
                Coming Soon
              </span>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="max-w-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-playfair text-xl font-bold text-[#2e1a0c]">
                  {tr('सूचनाएं', 'Notifications')}
                </h2>
                <button
                  type="button"
                  onClick={() => setNotificationsRead(true)}
                  className="text-xs font-bold text-[#b54c0d] cursor-pointer"
                >
                  {tr('सभी पढ़े हुए चिह्नित करें', 'Mark all as read')}
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-[#ede0ca] divide-y divide-[#f3e8d6]">
                <div className={`p-4 text-xs ${notificationsRead ? 'opacity-70' : ''}`}>
                  <div className="font-bold text-[#2e1a0c]">
                    {tr('गौकृपा परिवार में आपका स्वागत है 🙏', 'GauKripa Parivar mein aapka swagat hai 🙏')}
                  </div>
                  <div className="text-[#6c543e] mt-0.5">
                    {tr(
                      'गाय को हरा चारा सेवा बुक करने पर वीडियो पुष्टि सीधे आपके WhatsApp नंबर पर भेजी जाती है।',
                      'Gaumata Hara Chara seva book karne par video proof seedhe aapke WhatsApp par bheja jata hai.'
                    )}
                  </div>
                </div>
                {bookings.slice(0, 3).map((b) => (
                  <div key={`notif-${b.id}`} className={`p-4 text-xs ${notificationsRead ? 'opacity-70' : ''}`}>
                    <div className="font-bold text-[#2e1a0c]">
                      {b.sevaTitle} • {b.bookingId}
                    </div>
                    <div className="text-[#6c543e] mt-0.5">
                      {b.status === 'completed'
                        ? tr('आहार वितरण पूर्ण हुआ और वीडियो प्रमाण तैयार है।', 'Aahar vitaran poorn hua aur video proof taiyar hai.')
                        : tr('आपका सेवा संकल्प दर्ज कर लिया गया है।', 'Aapka seva sankalp darj kar liya gaya hai.')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="max-w-xl space-y-4">
              <h2 className="font-playfair text-xl font-bold text-[#2e1a0c]">
                {tr('सहायता एवं संपर्क', 'Help & Support')}
              </h2>
              <div className="bg-white rounded-2xl border border-[#ede0ca] p-5 space-y-3">
                <div className="text-xs text-[#5d4634] space-y-1">
                  <div>
                    <strong>{tr('हेल्पलाइन:', 'Helpline:')}</strong> +91 98765-43210 (WhatsApp)
                  </div>
                  <div>
                    <strong>{tr('ईमेल:', 'Email:')}</strong> seva@gaukripa.org
                  </div>
                </div>
                {supportSent ? (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                    {tr(
                      'आपका सहायता संदेश प्राप्त हो गया है। हमारी टीम शीघ्र संपर्क करेगी।',
                      'Aapka sahayata sandesh prapt ho gaya hai. Hamari team jald sampark karegi.'
                    )}
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (supportMessage.trim()) setSupportSent(true);
                    }}
                    className="space-y-3"
                  >
                    <textarea
                      required
                      rows={3}
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder={tr('अपनी सेवा बुकिंग या वॉलेट से जुड़ा प्रश्न लिखें...', 'Apni seva booking ya wallet se juda prashna likhein...')}
                      className="w-full px-3 py-2 rounded-xl border border-[#e3cfb0] bg-[#fbf6ee] text-xs"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#d86416] hover:bg-[#b54c0d] text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{tr('संदेश भेजें', 'Sandesh Bhejein')}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-[#e3cfb0] p-5 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#f3e8d6] pb-2">
              <h4 className="font-playfair font-bold text-lg text-[#2e1a0c]">{selectedBooking.sevaTitle}</h4>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="p-1 rounded-lg hover:bg-[#fbf2e4] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div>
                <span className="text-[#755b43]">Booking ID:</span>
                <div className="font-bold font-mono">{selectedBooking.bookingId}</div>
              </div>
              <div>
                <span className="text-[#755b43]">Amount:</span>
                <div className="font-bold tabular-nums">{formatCurrency(selectedBooking.amount)}</div>
              </div>
              <div>
                <span className="text-[#755b43]">Quantity:</span>
                <div className="font-bold">{selectedBooking.quantity}</div>
              </div>
              <div>
                <span className="text-[#755b43]">Duration:</span>
                <div className="font-bold">{selectedBooking.duration}</div>
              </div>
              <div>
                <span className="text-[#755b43]">Gotra:</span>
                <div className="font-bold">{selectedBooking.gotra}</div>
              </div>
              <div>
                <span className="text-[#755b43]">Date:</span>
                <div className="font-bold">{selectedBooking.date}</div>
              </div>
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedBooking(null);
                  onOpenProofGallery();
                }}
                className="px-4 py-2 rounded-xl bg-[#fdf1da] text-[#9a460b] font-bold text-xs cursor-pointer"
              >
                {tr('वीडियो प्रमाण देखें', 'Video Proof')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 rounded-xl bg-[#d86416] text-white font-bold text-xs cursor-pointer"
              >
                {tr('बंद करें', 'Close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar matching Mockup */}
      <nav
        aria-label={tr('प्रोफ़ाइल नेविगेशन', 'Profile Navigation')}
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#eddcc4] px-1 py-1.5 grid grid-cols-6 shadow-[0_-4px_16px_rgba(80,45,12,0.08)]"
      >
        <button
          type="button"
          onClick={() => switchTab('overview')}
          className={`flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold cursor-pointer ${
            activeTab === 'overview' ? 'text-[#d86416]' : 'text-[#5e442c]'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <button
          type="button"
          onClick={() => switchTab('wallet')}
          className={`flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold cursor-pointer ${
            activeTab === 'wallet' ? 'text-[#d86416]' : 'text-[#5e442c]'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Wallet</span>
        </button>
        <button
          type="button"
          onClick={() => switchTab('seva')}
          className={`flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold cursor-pointer ${
            activeTab === 'seva' || activeTab === 'history' ? 'text-[#d86416]' : 'text-[#5e442c]'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          <span>Seva</span>
        </button>
        <button
          type="button"
          onClick={() => switchTab('details')}
          className={`flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold cursor-pointer ${
            activeTab === 'details' || activeTab === 'family' ? 'text-[#d86416]' : 'text-[#5e442c]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Account</span>
        </button>
        <button
          type="button"
          onClick={() => switchTab('support')}
          className={`flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold cursor-pointer ${
            activeTab === 'support' ? 'text-[#d86416]' : 'text-[#5e442c]'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Help</span>
        </button>
        <button
          type="button"
          onClick={handleLogoutClick}
          className="flex flex-col items-center gap-0.5 py-1 text-[10px] font-bold text-[#8c2f19] cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
};
