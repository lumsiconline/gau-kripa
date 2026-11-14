import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Lock,
  Mail,
  ShieldCheck,
  History,
  LogOut,
  KeyRound,
  Sparkles,
  AlertCircle,
  Coins,
  PlusCircle,
  CheckCircle2,
  Phone,
} from 'lucide-react';
import { api, normalizePhone, WalletInfo, BookingRecord } from '../services/api';
import { clearSupabaseSession, getValidSupabaseSession } from '../services/supabaseClient';
import { useLanguage } from '../i18n/LanguageContext';

export interface AuthUser {
  name: string;
  phone?: string;
  astrologerId?: string;
  email: string;
  role?: 'super_admin' | 'admin' | 'astrologer' | 'devotee';
  isAdmin?: boolean;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AuthUser | null;
  onLogin: (user: AuthUser) => void;
  onLogout: () => void;
  onOpenAdmin?: () => void;
  onOpenAstrologer?: () => void;
  customMessage?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  onOpenAdmin,
  onOpenAstrologer,
  customMessage,
}) => {
  const { tr } = useLanguage();

  // Tabs: 'login' | 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Logged-in profile states
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [topupAmount, setTopupAmount] = useState<number>(50);
  const [customTopup, setCustomTopup] = useState<string>('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState<string | null>(null);
  const [recentBookings, setRecentBookings] = useState<BookingRecord[]>([]);
  const [sessionNeedsRefresh, setSessionNeedsRefresh] = useState(false);

  // Load wallet, Supabase session status, and bookings when user is logged in
  useEffect(() => {
    if (currentUser && isOpen) {
      let active = true;
      getValidSupabaseSession()
        .then((session) => {
          if (active) setSessionNeedsRefresh(!session?.access_token);
        })
        .catch(() => {
          if (active) setSessionNeedsRefresh(true);
        });

      const userPhone = currentUser.phone || '';
      const digits = userPhone.replace(/\D/g, '');
      const cleanPhone = normalizePhone(userPhone, '');
      if (digits.length >= 7) {
        api.getWallet(cleanPhone).then(setWallet).catch(() => setWallet({ phone: cleanPhone, name: currentUser.name, balance: 0, transactions: [] }));
      } else {
        setWallet({ phone: '', name: currentUser.name, balance: 0, transactions: [] });
      }
      api.getBookings().then((all) => {
        const userMatches = all.filter(
          (b) =>
            (cleanPhone && (normalizePhone(b.phone, '') === cleanPhone || b.phone.includes(cleanPhone))) ||
            (currentUser.email && b.email?.toLowerCase() === currentUser.email.toLowerCase())
        );
        setRecentBookings(userMatches.slice(0, 3));
      }).catch(console.error);

      return () => {
        active = false;
      };
    } else {
      setSessionNeedsRefresh(false);
    }
  }, [currentUser, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setPhone('');
      setAuthMode('login');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await api.login({
        email: email.trim(),
        password: password.trim(),
        phone: phone.trim()
      });

      if (res.success && res.user) {
        onLogin(res.user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || tr('लॉगिन विफल रहा। कृपया अपनी जानकारी जाँचें।', 'Login failed. Please verify your credentials.'));
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg(tr('कृपया अपना पूरा नाम दर्ज करें।', 'Please enter your full name.'));
      return;
    }
    if (!email.trim()) {
      setErrorMsg(tr('कृपया अपना ईमेल पता दर्ज करें।', 'Please enter your email address.'));
      return;
    }
    if (password.length < 8) {
      setErrorMsg(tr('पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।', 'Password must be at least 8 characters long.'));
      return;
    }
    if (normalizePhone(phone, '').length !== 10) {
      setErrorMsg(tr('कृपया मान्य 10 अंकों का मोबाइल नंबर दर्ज करें।', 'Please enter a valid 10-digit mobile number for secure payments and consultations.'));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(tr('दोनों पासवर्ड मेल नहीं खा रहे हैं। कृपया पुनः लिखें।', 'Passwords do not match. Please re-enter.'));
      return;
    }

    setLoading(true);
    try {
      const res = await api.registerUser({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        phone: phone.trim()
      });

      if (res.success) {
        setSuccessMsg(
          tr(
            'खाता सफलतापूर्वक बन गया! कृपया अपने ईमेल और पासवर्ड से लॉगिन करें।',
            'Account created successfully! Please sign in with your email and password.'
          )
        );
        setAuthMode('login');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || tr('खाता बनाने में समस्या आई। कृपया पुनः प्रयास करें।', 'Failed to create account. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleWalletRecharge = async () => {
    const amount = customTopup.trim() ? Number(customTopup) : topupAmount;
    const userPhone = currentUser?.phone || '';
    const cleanPhone = normalizePhone(userPhone, '');
    if (!Number.isInteger(amount) || amount < 50 || amount > 100000) {
      setErrorMsg(tr('न्यूनतम वॉलेट रिचार्ज ₹50 है। कृपया सही राशि दर्ज करें।', 'Minimum wallet recharge is ₹50. Enter a whole-rupee amount.'));
      return;
    }
    if (cleanPhone.length < 10) {
      setErrorMsg(
        tr(
          'रिचार्ज करने से पहले कृपया प्रोफ़ाइल में वैध 10-अंकीय मोबाइल नंबर जोड़ें।',
          'Please update your profile with a valid 10-digit mobile number before recharging.'
        )
      );
      return;
    }

    setErrorMsg(null);
    setTopupSuccess(null);
    setTopupLoading(true);
    try {
      const order = await api.createWalletOrder(cleanPhone, amount, currentUser?.name || tr('भक्त', 'Devotee'), currentUser?.email || '');
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(tr('Razorpay चेकआउट लोड नहीं हो सका।', 'Unable to load secure Razorpay Checkout.')));
          document.body.appendChild(script);
        });
      }
      const RazorpayCheckout = (window as any).Razorpay;
      if (!RazorpayCheckout) throw new Error(tr('Razorpay चेकआउट उपलब्ध नहीं है। पुनः प्रयास करें।', 'Razorpay Checkout is unavailable. Please try again.'));

      const keyId = order.key_id;
      if (!keyId) {
        throw new Error(tr('Razorpay LIVE कुंजी कॉन्फ़िगर नहीं है।', 'Razorpay LIVE Key ID is not configured.'));
      }

      const checkoutOptions: any = {
        key: keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'GauKripa',
        description: tr('गौकृपा सुरक्षित वॉलेट रिचार्ज', 'GauKripa Wallet Recharge'),
        prefill: { name: currentUser?.name || tr('भक्त', 'Devotee'), email: currentUser?.email || '', contact: cleanPhone },
        notes: { purpose: 'GauKripa wallet recharge', phone: cleanPhone },
        theme: { color: '#1b4b32' },
        handler: async (response: any) => {
          try {
            const result = await api.verifyWalletPayment({
              order_id: response.razorpay_order_id || order.order_id || '',
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature || '',
              phone: cleanPhone,
              amount
            });
            const freshWallet = await api.getWallet(cleanPhone);
            setWallet(freshWallet);
            setTopupSuccess(
              result.credited
                ? tr(`भुगतान सफल! आपके वॉलेट में ₹${amount} जोड़ दिए गए हैं।`, `Payment successful! ₹${amount} added to your wallet.`)
                : tr('यह भुगतान पहले ही आपके वॉलेट में जोड़ा जा चुका है।', 'This payment was already added to your wallet.')
            );
            setErrorMsg(null);
          } catch (verificationError: any) {
            setErrorMsg(
              verificationError.message ||
                tr('Razorpay भुगतान सत्यापन लंबित है। पुनः प्रयास करने से पहले सहायता से संपर्क करें।', 'Razorpay payment verification is pending. Please contact support before retrying.')
            );
          } finally {
            setTopupLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setTopupLoading(false);
          },
          escape: true,
          confirm_close: true
        }
      };

      if (order.order_id) {
        checkoutOptions.order_id = order.order_id;
      }

      const checkout = new RazorpayCheckout(checkoutOptions);
      checkout.on('payment.failed', (response: any) => {
        setErrorMsg(response?.error?.description || tr('Razorpay भुगतान असफल रहा। कृपया पुनः प्रयास करें।', 'Razorpay payment failed. You can try again.'));
        setTopupLoading(false);
      });
      setTopupLoading(false);
      checkout.open();
    } catch (error: any) {
      const msg = error?.message || tr('वॉलेट रिचार्ज प्रारंभ नहीं हो सका।', 'Unable to start Razorpay wallet recharge.');
      if (msg.toLowerCase().includes('session') || msg.toLowerCase().includes('sign in')) {
        setSessionNeedsRefresh(true);
      }
      setErrorMsg(msg);
      setTopupLoading(false);
    }
  };

  const isSuperAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin';
  const isAstrologer = currentUser?.role === 'astrologer';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#fffdfa] rounded-3xl shadow-2xl border-2 border-[#ebdcb9] overflow-hidden my-6 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-[#1b4b32] text-white px-6 py-4 flex items-center justify-between border-b border-[#296344] shrink-0">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-300" />
            <h3 className="font-playfair text-lg font-bold text-amber-200">
              {currentUser
                ? isSuperAdmin
                  ? tr('सुपर एडमिन कंसोल एवं प्रोफ़ाइल', 'Super Admin Console & Profile')
                  : isAstrologer
                    ? tr('ज्योतिषाचार्य डेस्क', 'Astrologer Desk')
                  : tr('मेरी भक्त प्रोफ़ाइल', 'My Devotee Profile')
                : authMode === 'login'
                ? tr('गौकृपा में साइन इन करें', 'Sign In to GauKripa')
                : tr('नया भक्त खाता बनाएँ', 'Create Devotee Account')}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label={tr('बंद करें', 'Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom prompt message if redirected */}
        {customMessage && !currentUser && (
          <div className="bg-amber-100/90 border-b border-amber-300 text-[#684b16] px-5 py-2.5 text-xs font-semibold flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{customMessage}</span>
          </div>
        )}

        {/* Tabs for Not-Logged-In Users (Sign In vs Sign Up) */}
        {!currentUser && (
          <div className="flex border-b border-[#ebdcb9] bg-[#fbf6ec] shrink-0">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold transition-all text-center cursor-pointer border-b-2 ${
                authMode === 'login'
                  ? 'border-[#1b4b32] text-[#1b4b32] bg-[#fffdfa]'
                  : 'border-transparent text-[#7c6a53] hover:text-[#1b4b32]'
              }`}
            >
              {tr('लॉगिन (Sign In)', 'Sign In (Login)')}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold transition-all text-center cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
                authMode === 'signup'
                  ? 'border-[#1b4b32] text-[#1b4b32] bg-[#fffdfa]'
                  : 'border-transparent text-[#7c6a53] hover:text-[#1b4b32]'
              }`}
            >
              <span>{tr('नया खाता बनाएँ (Sign Up)', 'Create Account (Sign Up)')}</span>
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {currentUser ? (
            /* ============================================================
               LOGGED IN STATE: USER PROFILE + WALLET + BOOKINGS + LOGOUT
               ============================================================ */
            <div className="space-y-4">
              
              {/* Profile Card */}
              <div className="p-4 rounded-2xl bg-[#faf3e2] border border-[#ebdcb9] flex items-center gap-3 shadow-2xs">
                <div
                  className={`w-14 h-14 rounded-full ${
                    isSuperAdmin ? 'bg-amber-600 text-amber-100' : 'bg-[#1b4b32] text-white'
                  } font-bold text-xl flex items-center justify-center shadow-xs shrink-0`}
                >
                  {isSuperAdmin ? '👑' : currentUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-base text-[#1b4b32] truncate">{currentUser.name}</h4>
                    {isSuperAdmin ? (
                      <span className="text-[10px] font-black tracking-wider uppercase bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full shadow-xs shrink-0">
                        {tr('सुपर एडमिन', 'SUPER ADMIN')}
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        {tr('सत्यापित भक्त', 'Verified Devotee')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#71614e] font-medium truncate">{currentUser.email}</p>
                  {currentUser.phone && (
                    <p className="text-[11px] text-[#93836d]">+91 {normalizePhone(currentUser.phone)}</p>
                  )}
                </div>
              </div>

              {/* REAL WALLET — funds are credited only after Razorpay server verification */}
              <div className="p-4 rounded-2xl bg-white border border-[#ebdcb9] shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#1b4b32] font-bold text-sm">
                      <Coins className="w-4 h-4 text-amber-600" />
                      <span>{tr('मेरा गौकृपा वॉलेट', 'My GauKripa Wallet')}</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-1">
                      {tr('सुरक्षित', 'Secure')}
                    </span>
                  </div>
                  <div className="rounded-xl bg-[#1b4b32] text-white p-4">
                    <p className="text-[11px] text-emerald-100">{tr('उपलब्ध शेष राशि', 'Available Balance')}</p>
                    <p className="text-3xl font-black tracking-tight">₹{(wallet?.balance || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#483d2e] mb-2">{tr('त्वरित रिचार्ज', 'Quick Recharge')}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[50, 100, 250].map((amount) => (
                        <button key={amount} type="button" onClick={() => { setTopupAmount(amount); setCustomTopup(''); setErrorMsg(null); }}
                          className={`py-2 rounded-lg border text-xs font-bold cursor-pointer ${!customTopup && topupAmount === amount ? 'bg-[#e5a024] border-[#d4901a] text-slate-950' : 'bg-[#fffcf5] border-[#ebdcb9] text-[#1b4b32]'}`}>
                          ₹{amount}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#483d2e] mb-1">
                      {tr('अन्य राशि दर्ज करें (₹)', 'Custom Amount (₹)')}
                    </label>
                    <input type="number" min="50" max="100000" step="1" value={customTopup}
                      onChange={(e) => { setCustomTopup(e.target.value); setErrorMsg(null); }}
                      placeholder={tr('₹50 या अधिक दर्ज करें', 'Enter ₹50 or more')}
                      className="w-full px-3 py-2.5 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-sm font-semibold focus:outline-hidden focus:border-[#1b4b32]" />
                    <p className="text-[10px] text-[#8a7a67] mt-1">
                      {tr('न्यूनतम रिचार्ज ₹50। अधिकतम ₹1,00,000 तक।', 'Minimum recharge ₹50. Custom amount up to ₹1,00,000.')}
                    </p>
                  </div>
                  {sessionNeedsRefresh && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-2">
                      <p className="font-semibold">
                        {tr(
                          'सुरक्षित लाइव भुगतान सर्वर से जुड़ने के लिए कृपया एक बार पुनः साइन इन करें।',
                          'To connect with the live Razorpay payment server, please sign in again once.'
                        )}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const savedEmail = currentUser?.email || '';
                          clearSupabaseSession();
                          onLogout();
                          setEmail(savedEmail);
                          setPassword('');
                          setAuthMode('login');
                          setErrorMsg(null);
                          setTopupSuccess(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#1b4b32] hover:bg-[#153e29] text-amber-200 font-bold text-xs cursor-pointer"
                      >
                        {tr('पुनः साइन इन करें', 'Sign In Again')}
                      </button>
                    </div>
                  )}
                  {topupSuccess && <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{topupSuccess}</div>}
                  {errorMsg && <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">{errorMsg}</div>}
                  <button type="button" onClick={handleWalletRecharge} disabled={topupLoading || (!customTopup.trim() && topupAmount < 50)}
                    className="w-full py-3 rounded-full bg-[#e5a024] hover:bg-[#d4901a] text-slate-950 font-bold text-sm shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
                    <PlusCircle className="w-4 h-4" />
                    {topupLoading
                      ? tr('सुरक्षित भुगतान प्रक्रिया जारी…', 'Processing Secure Payment…')
                      : tr(
                          `₹${customTopup.trim() ? (Number(customTopup) || 0) : topupAmount} रिचार्ज करें`,
                          `Recharge ₹${customTopup.trim() ? (Number(customTopup) || 0) : topupAmount}`
                        )}
                  </button>
                  <div className="border-t border-[#f0e4cc] pt-2">
                    <p className="text-xs font-bold text-[#5c4e3b] mb-2">
                      {tr('हाल के वॉलेट लेनदेन', 'Recent Wallet Transactions')}
                    </p>
                    {wallet?.transactions?.length ? wallet.transactions.slice(0, 4).map((transaction) => {
                      const isDebit = transaction.type === 'debit';
                      return (
                        <div key={transaction.id} className="flex items-center justify-between py-1.5 text-xs border-b border-[#f7f0e4] last:border-0">
                          <div><p className="font-semibold text-[#1b4b32]">{transaction.description}</p><p className="text-[10px] text-[#8a7a67]">{new Date(transaction.date).toLocaleString()}</p></div>
                          <span className={`font-bold ${isDebit ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {isDebit ? '-' : '+'}₹{Number(transaction.amount).toFixed(2)}
                          </span>
                        </div>
                      );
                    }) : <p className="text-[11px] text-[#8a7a67]">{tr('अभी कोई वॉलेट लेनदेन नहीं है।', 'No wallet transactions yet.')}</p>}
                  </div>
                </div>

              {/* Super Admin Management Consoles */}
              {isSuperAdmin && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#2a1c0d] to-[#3a2813] text-white space-y-2 border border-amber-600/40 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      {tr('सुपर एडमिन पोर्टल', 'Super Admin Portals')}
                    </span>
                    <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                      {tr('पूर्ण अधिकार', 'FULL PRIVILEGES')}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-100/80">
                    {tr(
                      'सेवा सूची, वीडियो प्रमाण, ज्योतिषी भुगतान और लाइव चैट कतार प्रबंधन का पूरा नियंत्रण आपके पास है।',
                      'You have master control to manage Seva catalogs, live video proofs, astrologer payouts, and chat queues.'
                    )}
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {onOpenAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenAdmin();
                        }}
                        className="py-2.5 px-3 rounded-xl bg-[#e5a024] hover:bg-[#d4901a] text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-transform active:scale-95"
                      >
                        <span>🛡️</span>
                        <span>{tr('एडमिन कंसोल', 'Admin Console')}</span>
                      </button>
                    )}
                    {onOpenAstrologer && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenAstrologer();
                        }}
                        className="py-2.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-amber-200 border border-white/20 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95"
                      >
                        <span>🔮</span>
                        <span>{tr('ज्योतिषी डेस्क', 'Astrologer Desk')}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Devotee Recent Bookings */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#5c4e3b]">
                  <span className="flex items-center gap-1">
                    <History className="w-3.5 h-3.5" /> {tr('हाल की सेवा बुकिंग एवं संकल्प', 'Recent Seva Bookings & Sankalps')}
                  </span>
                  <span className="text-[#c4821a]">{tr('वृन्दावन धाम', 'Vrindavan Dham')}</span>
                </div>
                {recentBookings.length > 0 ? (
                  <div className="space-y-1.5">
                    {recentBookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-xl bg-white border border-[#ebdcb9] text-xs flex items-center justify-between shadow-2xs"
                      >
                        <div>
                          <div className="font-bold text-[#1b4b32]">{b.sevaTitle}</div>
                          <div className="text-[11px] text-[#71614e]">
                            {tr('गोत्र:', 'Gotra:')} {b.gotra || tr('कश्यप', 'Kashyap')} • {b.date || tr('हाल ही में', 'Recent')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-amber-700">₹{b.amount}</div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {b.status === 'completed' ? tr('सत्यापित', 'Verified') : tr('सक्रिय', 'Active')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[#faf6ed] border border-[#f0e4cc] text-center text-xs text-[#71614e]">
                    <span>
                      {tr(
                        'अभी कोई बुकिंग नहीं है। नीचे दी गई गौ-आहार सेवाओं से शुरुआत करें।',
                        'No bookings yet. Explore our Gau-Aahar Sevas on the homepage to begin.'
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* LOGOUT BUTTON AND DONE */}
              <div className="pt-3 border-t border-[#ebdcb9] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    clearSupabaseSession();
                    onLogout();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>{tr('खाते से लॉग आउट करें', 'Log Out of Account')}</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 rounded-full bg-[#1b4b32] text-white font-bold text-xs hover:bg-[#153e29] cursor-pointer shadow-xs transition-colors"
                >
                  {tr('पूर्ण', 'Done')}
                </button>
              </div>

            </div>
          ) : authMode === 'login' ? (
            /* ============================================================
               SIGN IN (LOGIN) TAB
               ============================================================ */
            <div className="space-y-4">
              <p className="text-xs text-[#6e5d48] text-center">
                {tr(
                  'गौ-आहार सेवा बुक करने, लाइव ज्योतिष परामर्श लेने और अपना वॉलेट प्रबंधित करने के लिए अपने ईमेल और पासवर्ड से लॉगिन करें।',
                  'Sign in with your registered email and password to book Gau Sevas, access live astrologer consultations, and manage your wallet.'
                )}
              </p>

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#483d2e] mb-1">
                    {tr('ईमेल पता (Email Address)', 'Email Address')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8a7a67] absolute left-3 top-3" />
                    <input
                      type="email"
                      autoComplete="off"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. devotee@example.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs focus:outline-hidden focus:border-[#1b4b32] font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#483d2e] mb-1">
                    {tr('पासवर्ड (Password)', 'Password')}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8a7a67] absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs focus:outline-hidden focus:border-[#1b4b32] font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-full bg-[#e5a024] hover:bg-[#d4901a] text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50 mt-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>
                    {loading
                      ? tr('सत्यापित किया जा रहा है...', 'Authenticating...')
                      : tr('ईमेल और पासवर्ड से लॉगिन करें', 'Sign In with Email & Password')}
                  </span>
                </button>
              </form>

              {/* Link to Switch to Sign Up */}
              <div className="pt-3 border-t border-[#ebdcb9] text-center">
                <p className="text-xs text-[#71614e]">
                  {tr('क्या आपका खाता नहीं है?', "Don't have an account yet?")}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="font-bold text-[#1b4b32] underline hover:text-[#0e2c1d] cursor-pointer ml-1"
                  >
                    {tr('नया खाता बनाएँ', 'Create Account (Sign Up)')}
                  </button>
                </p>
              </div>

            </div>
          ) : (
            /* ============================================================
               CREATE ACCOUNT (SIGN UP) TAB
               ============================================================ */
            <div className="space-y-4">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-xs text-[#684b16] font-medium leading-relaxed">
                  {tr(
                    'सुरक्षित वॉलेट भुगतान, ज्योतिष परामर्श पर 50% विशेष छूट और सेवा वीडियो पुष्टि पाने के लिए गौकृपा परिवार से जुड़ें।',
                    'Join GauKripa Parivar for secure wallet payments, 50% discount eligibility on astrologer consultations, and verified seva video proofs.'
                  )}
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSignupSubmit} autoComplete="off" className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#483d2e] mb-1">
                    {tr('पूरा नाम', 'Full Name / Devotee Name')} <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#8a7a67] absolute left-3 top-3" />
                    <input
                      type="text"
                      autoComplete="off"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={tr('जैसे: रमेश शर्मा', 'e.g. Ramesh Sharma')}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs focus:outline-hidden focus:border-[#1b4b32] font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#483d2e] mb-1">
                    {tr('ईमेल पता', 'Email Address')} <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8a7a67] absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. ramesh@example.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs focus:outline-hidden focus:border-[#1b4b32] font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#483d2e] mb-1">
                    {tr('मोबाइल नंबर (व्हाट्सएप वीडियो पुष्टि हेतु)', 'Mobile Number (for WhatsApp Sankalp Updates)')}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#8a7a67] absolute left-3 top-3" />
                    <input
                      type="tel"
                      autoComplete="off"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs focus:outline-hidden focus:border-[#1b4b32] font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-[#483d2e] mb-1">
                      {tr('पासवर्ड', 'Password')} <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#8a7a67] absolute left-3 top-3" />
                      <input
                        type="password"
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={tr('न्यूनतम 8 अक्षर', 'Min 8 characters')}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs focus:outline-hidden focus:border-[#1b4b32] font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#483d2e] mb-1">
                      {tr('पासवर्ड पुष्टि करें', 'Confirm Password')} <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#8a7a67] absolute left-3 top-3" />
                      <input
                        type="password"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={tr('पासवर्ड पुनः लिखें', 'Re-enter password')}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs focus:outline-hidden focus:border-[#1b4b32] font-medium"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-full bg-[#1b4b32] hover:bg-[#153e29] text-amber-200 font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50 mt-2"
                >
                  <PlusCircle className="w-4 h-4 text-amber-300" />
                  <span>
                    {loading
                      ? tr('खाता बन रहा है...', 'Creating Account...')
                      : tr('नया खाता बनाएँ', 'Create Account')}
                  </span>
                </button>
              </form>

              {/* Link to Switch to Sign In */}
              <div className="pt-3 border-t border-[#ebdcb9] text-center">
                <p className="text-xs text-[#71614e]">
                  {tr('क्या आपका खाता पहले से है?', 'Already have an account?')}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="font-bold text-[#1b4b32] underline hover:text-[#0e2c1d] cursor-pointer ml-1"
                  >
                    {tr('लॉगिन करें', 'Sign In')}
                  </button>
                </p>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};

