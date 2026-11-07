import React, { useState } from 'react';
import { X, User, Lock, Mail, ShieldCheck, History, LogOut, KeyRound, Sparkles, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('9876543210');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
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


  const isSuperAdmin = currentUser?.email?.toLowerCase() === 'bankush014@gmail.com' || currentUser?.role === 'super_admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#fffdfa] rounded-3xl shadow-2xl border-2 border-[#ebdcb9] overflow-hidden my-6">
        
        {/* Header */}
        <div className="bg-[#1b4b32] text-white p-5 flex items-center justify-between border-b border-[#296344]">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-300" />
            <h3 className="font-playfair text-lg font-bold text-amber-200">
              {currentUser ? (isSuperAdmin ? 'Super Admin Console Control' : 'Devotee Account Profile') : 'Sign In with Email & Password'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom prompt message if user was redirected from Booking or Astrologer chat */}
        {customMessage && !currentUser && (
          <div className="bg-amber-100/90 border-b border-amber-300 text-[#684b16] px-4 py-2.5 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{customMessage}</span>
          </div>
        )}

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {currentUser ? (
            /* Logged In State */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#faf3e2] border border-[#ebdcb9] flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full ${isSuperAdmin ? 'bg-amber-600 text-amber-100' : 'bg-[#1b4b32] text-white'} font-bold text-lg flex items-center justify-center shadow-xs`}>
                  {isSuperAdmin ? '👑' : currentUser.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-[#1b4b32]">{currentUser.name}</h4>
                    {isSuperAdmin ? (
                      <span className="text-[10px] font-black tracking-wider uppercase bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full shadow-xs">
                        SUPER ADMIN
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                        Devotee Member
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#71614e] font-medium">{currentUser.email}</p>
                  {currentUser.phone && (
                    <p className="text-[11px] text-[#93836d]">+91 {currentUser.phone}</p>
                  )}
                </div>
              </div>

              {/* ONLY DISPLAY STAFF & ADMIN PORTALS FOR SUPER ADMIN (bankush014@gmail.com) */}
              {isSuperAdmin ? (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1b4b32] to-[#255e40] text-white space-y-2 border border-emerald-800 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-300" />
                      Super Admin Access Portals
                    </span>
                    <span className="text-[10px] bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded-full">
                      Full Control
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-100">
                    You are logged in as the Super Admin. Full management of services, astrologers, bookings, video proofs, and live chat is unlocked.
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
              ) : (
                /* Regular Devotee Past Sevas */
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#5c4e3b]">
                    <span className="flex items-center gap-1">
                      <History className="w-3.5 h-3.5" /> Recent Sankalps
                    </span>
                    <span className="text-[#c4821a]">Active Parivar Devotee</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="p-2.5 rounded-xl bg-white border border-[#ebdcb9] text-xs flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#1b4b32]">Gau Chara Seva (10 kg)</div>
                        <div className="text-[11px] text-[#71614e]">Vrindavan Dham • Verified</div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Completed
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Logout & Close */}
              <div className="pt-2 border-t border-[#ebdcb9] flex items-center justify-between">
                <button
                  onClick={onLogout}
                  className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer py-1.5 px-3 rounded-lg hover:bg-rose-50"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-full bg-[#1b4b32] text-white font-bold text-xs hover:bg-[#153e29] cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Email & Password Login Form */
            <div className="space-y-4">
              <p className="text-xs text-[#6e5d48] text-center">
                Sign in with your email and password to book Gau Sevas, access live astrologer consultations, and manage your account.
              </p>

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
                    <Mail className="w-4 h-4 text-[#8a7a67] absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. bankush014@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs focus:outline-hidden focus:border-[#1b4b32] font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#483d2e] mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#8a7a67] absolute left-3 top-2.5" />
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
                  className="w-full py-2.5 rounded-full bg-[#e5a024] hover:bg-[#d4901a] text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-98 disabled:opacity-50"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{loading ? 'Authenticating...' : 'Sign In with Email & Password'}</span>
                </button>
              </form>


            </div>
          )}
        </div>

      </div>
    </div>
  );
};
