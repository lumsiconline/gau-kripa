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
  ArrowRight
} from 'lucide-react';
import { api, WalletInfo, BookingRecord } from '../services/api';

export interface AuthUser {
  name: string;
  phone?: string;
  email: string;
  role?: 'super_admin' | 'devotee';
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
  // Tabs: 'login' | 'signup'
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('9876543210');

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Logged-in profile states
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [topupAmount, setTopupAmount] = useState<number>(250);
  const [customTopup, setCustomTopup] = useState<string>('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState<string | null>(null);
  const [recentBookings, setRecentBookings] = useState<BookingRecord[]>([]);

  // Load wallet and bookings when user is logged in
  useEffect(() => {
    if (currentUser && isOpen) {
      const userPhone = currentUser.phone || '9876543210';
      api.getWallet(userPhone).then(setWallet).catch(console.error);
      api.getBookings().then((all) => {
        const userMatches = all.filter(
          (b) =>
            b.phone.includes(userPhone) ||
            (currentUser.email && b.email?.toLowerCase() === currentUser.email.toLowerCase())
        );
        setRecentBookings(userMatches.slice(0, 3));
      }).catch(console.error);
    }
  }, [currentUser, isOpen]);

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
      setErrorMsg(err.message || 'Login failed. Please verify your credentials.');
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
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    if (password.length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.registerUser({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        phone: phone.trim() || '9876543210'
      });

      if (res.success) {
        setSuccessMsg('Account created successfully! Please sign in with your email and password.');
        setAuthMode('login');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin =
    currentUser?.email?.toLowerCase() === 'bankush014@gmail.com' || currentUser?.role === 'super_admin';

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
                  ? 'Super Admin Console & Profile'
                  : 'My Devotee Profile'
                : authMode === 'login'
                ? 'Sign In to GauKripa'
                : 'Create Devotee Account'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Close"
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
              Sign In (Login)
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
              <span>Create Account (Sign Up)</span>
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {currentUser ? (
            /* ============================================================
               LOGGED IN STATE: USER PROFILE + SANKALPS + LOGOUT
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
                        SUPER ADMIN
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                        Verified Devotee
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#71614e] font-medium truncate">{currentUser.email}</p>
                  {currentUser.phone && (
                    <p className="text-[11px] text-[#93836d]">+91 {currentUser.phone}</p>
                  )}
                </div>
              </div>

              {/* Super Admin Management Consoles */}
              {isSuperAdmin && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#2a1c0d] to-[#3a2813] text-white space-y-2 border border-amber-600/40 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      Super Admin Portals
                    </span>
                    <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                      FULL PRIVILEGES
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-100/80">
                    You have master control to manage Seva catalogs, live video proofs, astrologer payouts, and chat queues.
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
                        <span>Admin Console</span>
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
                        <span>Astrologer Desk</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Devotee Recent Bookings */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#5c4e3b]">
                  <span className="flex items-center gap-1">
                    <History className="w-3.5 h-3.5" /> Recent Seva Bookings &amp; Sankalps
                  </span>
                  <span className="text-[#c4821a]">Vrindavan Dham</span>
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
                            Gotra: {b.gotra || 'Kashyap'} • {b.date || 'Recent'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-amber-700">₹{b.amount}</div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            {b.status === 'completed' ? 'Verified' : 'Active'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[#faf6ed] border border-[#f0e4cc] text-center text-xs text-[#71614e]">
                    <span>No bookings yet. Explore our sacred Gau Sevas below to start.</span>
                  </div>
                )}
              </div>

              {/* LOGOUT BUTTON AND DONE */}
              <div className="pt-3 border-t border-[#ebdcb9] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Log Out of Account</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 rounded-full bg-[#1b4b32] text-white font-bold text-xs hover:bg-[#153e29] cursor-pointer shadow-xs transition-colors"
                >
                  Done
                </button>
              </div>

            </div>
          ) : authMode === 'login' ? (
            /* ============================================================
               SIGN IN (LOGIN) TAB
               ============================================================ */
            <div className="space-y-4">
              <p className="text-xs text-[#6e5d48] text-center">
                Sign in with your registered email and password to book Gau Sevas, access live astrologer consultations, and manage your wallet.
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
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#8a7a67] absolute left-3 top-3" />
                    <input
                      type="email"
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
                    Password
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
                  <span>{loading ? 'Authenticating...' : 'Sign In with Email & Password'}</span>
                </button>
              </form>

              {/* Link to Switch to Sign Up */}
              <div className="pt-3 border-t border-[#ebdcb9] text-center">
                <p className="text-xs text-[#71614e]">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="font-bold text-[#1b4b32] underline hover:text-[#0e2c1d] cursor-pointer ml-1"
                  >
                    Create Account (Sign Up)
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
                  Join GauKripa Parivar today to receive a <strong>₹150 welcome wallet bonus</strong>, 50% discount on astrologer consultations, and verified video proofs.
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSignupSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#483d2e] mb-1">
                    Full Name / Devotee Name <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#8a7a67] absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Sharma"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs focus:outline-hidden focus:border-[#1b4b32] font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#483d2e] mb-1">
                    Email Address <span className="text-rose-600">*</span>
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
                    Mobile Number (for WhatsApp Sankalp Updates)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-[#8a7a67] absolute left-3 top-3" />
                    <input
                      type="tel"
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
                      Password <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#8a7a67] absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min 4 characters"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs focus:outline-hidden focus:border-[#1b4b32] font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#483d2e] mb-1">
                      Confirm Password <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#8a7a67] absolute left-3 top-3" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
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
                  <span>{loading ? 'Creating Account...' : 'Create Account & Get ₹150 Bonus'}</span>
                </button>
              </form>

              {/* Link to Switch to Sign In */}
              <div className="pt-3 border-t border-[#ebdcb9] text-center">
                <p className="text-xs text-[#71614e]">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="font-bold text-[#1b4b32] underline hover:text-[#0e2c1d] cursor-pointer ml-1"
                  >
                    Sign In
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
