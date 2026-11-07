import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Clock,
  PhoneOff,
  DollarSign,
  Star,
  ShieldCheck,
  Check,
  X,
  Send,
  Sparkles,
  ArrowLeft,
  Calendar,
  History,
  TrendingUp,
  User,
  Radio,
  Power,
  Volume2,
  RefreshCw,
  Award
} from 'lucide-react';
import { api, AstrologerItem, ChatSession, ChatMessage } from '../../services/api';
import { ImageCrop } from '../ImageCrop';

interface AstrologerDashboardProps {
  onBackToWebsite: () => void;
  selectedAstroId?: string;
}

export const AstrologerDashboard: React.FC<AstrologerDashboardProps> = ({
  onBackToWebsite,
  selectedAstroId,
}) => {
  const [astrologers, setAstrologers] = useState<AstrologerItem[]>([]);
  const [currentAstro, setCurrentAstro] = useState<AstrologerItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Incoming request state
  const [incomingRequest, setIncomingRequest] = useState<ChatSession | null>(null);

  // Active chat state
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [customerWallet, setCustomerWallet] = useState<number>(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Analytics & History
  const [historySessions, setHistorySessions] = useState<ChatSession[]>([]);
  const [analytics, setAnalytics] = useState<{
    totalConsultations: number;
    todayEarnings: number;
    weeklyEarnings: number;
    monthlyEarnings: number;
  }>({ totalConsultations: 0, todayEarnings: 0, weeklyEarnings: 0, monthlyEarnings: 0 });

  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'profile'>('live');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load astrologers list
  const loadAstrologers = async () => {
    try {
      const astros = await api.getAstrologers();
      setAstrologers(astros);
      const chosen = astros.find((a) => a.id === selectedAstroId) || astros[0];
      setCurrentAstro(chosen);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAstrologers();
  }, [selectedAstroId]);

  // Load history & analytics when currentAstro changes
  const loadHistory = async () => {
    if (!currentAstro) return;
    try {
      const data = await api.getAstrologerChatHistory(currentAstro.id);
      setHistorySessions(data.sessions || []);
      setAnalytics(data.analytics || { totalConsultations: 0, todayEarnings: 0, weeklyEarnings: 0, monthlyEarnings: 0 });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentAstro) {
      loadHistory();
    }
  }, [currentAstro]);

  // Polling for incoming requests every 2.5 seconds when not in an active session
  useEffect(() => {
    if (!currentAstro || activeSession) return;

    const interval = setInterval(async () => {
      try {
        const incoming = await api.getIncomingChat(currentAstro.id);
        setIncomingRequest(incoming);
      } catch (err) {
        console.error('Error polling incoming:', err);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [currentAstro, activeSession]);

  // Active chat loop: poll messages every 2s, send heartbeat every 5s
  useEffect(() => {
    if (!activeSession) return;

    // Heartbeat every 5s
    const heartbeatTimer = setInterval(async () => {
      try {
        const hb = await api.sendChatHeartbeat(activeSession.id);
        if (hb.status === 'ended') {
          setActiveSession((prev) => (prev ? { ...prev, status: 'ended' } : null));
          showToast('Consultation ended due to devotee wallet depletion.');
        } else {
          setActiveSession((prev) =>
            prev
              ? {
                  ...prev,
                  durationSeconds: hb.durationSeconds,
                  totalCharged: hb.totalCharged,
                  astrologerEarned: hb.astrologerEarned,
                }
              : null
          );
          setCustomerWallet(hb.walletBalance);
        }
      } catch (err) {
        console.error(err);
      }
    }, 5000);

    // Message poll every 1.5s
    const messagePoll = setInterval(async () => {
      try {
        const res = await api.getChatSession(activeSession.id);
        if (res.session) {
          setChatMessages(res.session.messages || []);
          setCustomerWallet(res.customerWalletBalance);
          if (res.session.status === 'ended' && activeSession.status === 'active') {
            setActiveSession(res.session);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }, 1500);

    return () => {
      clearInterval(heartbeatTimer);
      clearInterval(messagePoll);
    };
  }, [activeSession]);

  // Auto scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Availability Toggle
  const handleToggleOnline = async () => {
    if (!currentAstro) return;
    try {
      const isOnline = await api.setAstrologerAvailability(currentAstro.id, !currentAstro.isOnline);
      setCurrentAstro({ ...currentAstro, isOnline });
      showToast(`Status updated to: ${isOnline ? '🟢 ONLINE (Ready for Chats)' : '🔴 OFFLINE'}`);
    } catch (err) {
      console.error(err);
    }
  };

  // Accept incoming chat request
  const handleAcceptChat = async () => {
    if (!incomingRequest || !currentAstro) return;
    try {
      const session = await api.respondChat(incomingRequest.id, currentAstro.id, 'accept');
      setActiveSession(session);
      setChatMessages(session.messages || []);
      setIncomingRequest(null);
      showToast(`Connected with Devotee ${session.customerName}! Live billing started.`);
    } catch (err) {
      console.error(err);
      alert('Failed to accept chat');
    }
  };

  // Decline incoming chat request
  const handleRejectChat = async () => {
    if (!incomingRequest || !currentAstro) return;
    try {
      await api.respondChat(incomingRequest.id, currentAstro.id, 'reject');
      setIncomingRequest(null);
      showToast('Chat request declined.');
    } catch (err) {
      console.error(err);
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSession || !currentAstro) return;
    const text = inputText;
    setInputText('');
    try {
      const newMsg = await api.sendChatMessage(activeSession.id, {
        sender: 'astrologer',
        senderName: currentAstro.name,
        text,
      });
      setChatMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error(err);
    }
  };

  // Fast Vedic Upay Shortcut Send
  const handleSendQuickUpay = async (sevaName: string, upayText: string) => {
    if (!activeSession || !currentAstro) return;
    try {
      const newMsg = await api.sendChatMessage(activeSession.id, {
        sender: 'astrologer',
        senderName: currentAstro.name,
        text: upayText,
        suggestedSeva: sevaName,
      });
      setChatMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error(err);
    }
  };

  // End consultation
  const handleEndChat = async () => {
    if (!activeSession) return;
    if (!confirm('Are you sure you want to conclude this Vedic consultation session?')) return;
    try {
      const ended = await api.endChat(activeSession.id);
      setActiveSession(ended);
      showToast(`Consultation ended. Total Earned: ₹${ended.astrologerEarned}`);
      loadHistory();
    } catch (err) {
      console.error(err);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading || !currentAstro) {
    return (
      <div className="min-h-screen bg-[#fcf9f2] flex items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <div className="w-10 h-10 border-4 border-[#1b4b32] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#71614e] font-bold">Connecting to Astrologer Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9f2] text-[#2c332d] flex flex-col font-sans">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1b4b32] text-amber-200 px-5 py-3 rounded-2xl shadow-2xl border border-amber-300/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-3">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
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
              <span className="text-xl">🔮</span>
              <h1 className="font-playfair text-base sm:text-lg font-bold text-amber-200">
                GauKripa Astrologer Desk
              </h1>
            </div>
          </div>

          {/* Switch Astrologer Account Dropdown */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-800">
              <User className="w-3.5 h-3.5 text-amber-300" />
              <select
                value={currentAstro.id}
                onChange={(e) => {
                  const found = astrologers.find((a) => a.id === e.target.value);
                  if (found) setCurrentAstro(found);
                }}
                className="bg-transparent text-xs font-bold text-amber-200 focus:outline-hidden cursor-pointer"
              >
                {astrologers.map((a) => (
                  <option key={a.id} value={a.id} className="bg-[#1b4b32] text-white">
                    {a.name} ({a.isOnline ? 'Online' : 'Offline'})
                  </option>
                ))}
              </select>
            </div>

            {/* Prominent Online/Offline Toggle Button */}
            <button
              onClick={handleToggleOnline}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                currentAstro.isOnline
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black animate-pulse'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{currentAstro.isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">
        
        {/* Top Profile & Live Status Banner */}
        <div className="bg-[#fffdf9] rounded-2xl border border-[#ebdcb9] p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#d9ba78] shadow-xs shrink-0 bg-amber-50 relative">
              {currentAstro.customImageUrl ? (
                <img src={currentAstro.customImageUrl} alt={currentAstro.name} className="w-full h-full object-cover" />
              ) : (
                <ImageCrop cropKey={currentAstro.cropKey} className="w-full h-full object-cover" alt={currentAstro.name} />
              )}
              <span
                className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${
                  currentAstro.isOnline ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-playfair text-xl font-bold text-[#1b4b32]">{currentAstro.name}</h2>
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <p className="text-xs text-[#71614e] font-medium">
                {currentAstro.title} • {currentAstro.experience}
              </p>
              <div className="flex items-center gap-2 text-xs text-[#8b5a0a] font-bold mt-0.5">
                <span>Standard Rate: ₹{currentAstro.ratePerMin} / min</span>
                <span>•</span>
                <span>⭐ {currentAstro.rating} Rating</span>
                <span>•</span>
                <span className="text-emerald-700">50% Seva Discount Enabled (₹10/min)</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 w-full md:w-auto text-center">
            <div className="bg-[#fcf8ee] p-2.5 rounded-xl border border-[#ebdcb9]">
              <span className="text-[10px] text-[#786a55] block">Today's Earnings</span>
              <span className="text-base font-black text-[#1b4b32]">₹{analytics.todayEarnings}</span>
            </div>
            <div className="bg-[#fcf8ee] p-2.5 rounded-xl border border-[#ebdcb9]">
              <span className="text-[10px] text-[#786a55] block">Total Consultations</span>
              <span className="text-base font-black text-[#1b4b32]">{currentAstro.totalConsultations}</span>
            </div>
            <div className="bg-[#fcf8ee] p-2.5 rounded-xl border border-[#ebdcb9]">
              <span className="text-[10px] text-[#786a55] block">Total Earned</span>
              <span className="text-base font-black text-emerald-800">₹{currentAstro.totalEarnings}</span>
            </div>
          </div>
        </div>

        {/* INCOMING CHAT REQUEST ALERT (POPPED UP WHEN CUSTOMER CLICKS 'CHAT NOW') */}
        {incomingRequest && !activeSession && (
          <div className="bg-[#fff9ea] border-2 border-[#e5a024] rounded-2xl p-4 sm:p-5 shadow-lg animate-bounce-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                <h3 className="font-playfair text-base sm:text-lg font-bold text-[#1b4b32] flex items-center gap-1.5">
                  <Volume2 className="w-5 h-5 text-amber-600 animate-pulse" />
                  <span>Incoming Live Vedic Chat Request!</span>
                </h3>
              </div>
              <span className="text-xs font-mono font-bold bg-amber-100 text-amber-950 px-2 py-0.5 rounded-md">
                {incomingRequest.id}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white/90 rounded-xl border border-[#ebdcb9] text-xs">
              <div>
                <span className="text-[#887864] block">Devotee Name:</span>
                <strong className="text-[#1b4b32] text-sm">{incomingRequest.customerName}</strong>
                <span className="text-[10px] text-[#71614e] block">+91 {incomingRequest.customerPhone}</span>
              </div>
              <div>
                <span className="text-[#887864] block">Sankalp / Concern:</span>
                <span className="text-[#332b21] font-semibold">{incomingRequest.customerConcern}</span>
              </div>
              <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-[#ebdcb9] pt-2">
                <div><span className="text-[#887864] block">Date of Birth:</span><strong className="text-[#1b4b32]">{incomingRequest.birthDate || 'Not provided'}</strong></div>
                <div><span className="text-[#887864] block">Birth Time:</span><strong className="text-[#1b4b32]">{incomingRequest.birthTime || 'Not provided'}</strong></div>
                <div><span className="text-[#887864] block">Birth Place:</span><strong className="text-[#1b4b32]">{incomingRequest.birthPlace || 'Not provided'}</strong></div>
              </div>
              <div>
                <span className="text-[#887864] block">Billing Rate:</span>
                <strong className="text-emerald-800 text-sm">₹{incomingRequest.ratePerMin} / min</strong>
                {incomingRequest.hasDiscount && (
                  <span className="text-[10px] text-emerald-700 font-bold block">
                    (50% Seva Discount Verified)
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={handleRejectChat}
                className="px-5 py-2 rounded-full border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Decline Request</span>
              </button>
              <button
                onClick={handleAcceptChat}
                className="px-6 py-2 rounded-full bg-[#1b4b32] hover:bg-[#153e29] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer animate-pulse"
              >
                <Check className="w-4 h-4 text-amber-300" />
                <span>Accept Consultation &amp; Start Timer</span>
              </button>
            </div>
          </div>
        )}

        {/* TABS: LIVE CHAT DESK vs CONSULTATION HISTORY */}
        <div className="flex items-center gap-2 border-b border-[#ebdcb9] pb-2">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'live'
                ? 'bg-[#1b4b32] text-amber-200 shadow-xs'
                : 'bg-white text-[#524434] hover:bg-[#f5e9d0]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Live Chat Desk {activeSession && '(Active)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-[#1b4b32] text-amber-200 shadow-xs'
                : 'bg-white text-[#524434] hover:bg-[#f5e9d0]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Consultation History &amp; Earnings ({historySessions.length})</span>
          </button>
        </div>

        {/* CONTENT 1: LIVE CHAT DESK */}
        {activeTab === 'live' && (
          <div className="bg-[#fffdf9] rounded-2xl border border-[#ebdcb9] shadow-xs overflow-hidden flex flex-col h-[600px]">
            {activeSession ? (
              <>
                {/* Active Session Top Bar */}
                <div className="bg-[#1b4b32] text-white p-3.5 flex items-center justify-between border-b border-[#296344]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 font-bold flex items-center justify-center text-sm shrink-0">
                      {activeSession.customerName.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-amber-200">{activeSession.customerName}</span>
                        <span className="text-[10px] bg-emerald-800 text-emerald-100 px-2 py-0.2 rounded-full font-mono">
                          +91 {activeSession.customerPhone}
                        </span>
                      </div>
                      <div className="text-[11px] text-emerald-200/90 truncate max-w-sm">
                        Concern: {activeSession.customerConcern}
                      </div>
                    </div>
                  </div>

                  {/* Active Timer & Per-Minute Earnings */}
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-800 text-center">
                      <span className="text-[9px] text-emerald-300 block uppercase font-bold">Elapsed Time</span>
                      <div className="text-sm font-mono font-bold text-amber-300 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{formatTimer(activeSession.durationSeconds)}</span>
                      </div>
                    </div>

                    <div className="bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-800 text-center">
                      <span className="text-[9px] text-emerald-300 block uppercase font-bold">Your Earnings</span>
                      <span className="text-sm font-black text-emerald-400">
                        ₹{activeSession.astrologerEarned}
                      </span>
                    </div>

                    <div className="bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-800 text-center hidden sm:block">
                      <span className="text-[9px] text-emerald-300 block uppercase font-bold">Devotee Wallet</span>
                      <span className="text-sm font-bold text-amber-200">
                        ₹{customerWallet}
                      </span>
                    </div>

                    <button
                      onClick={handleEndChat}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <PhoneOff className="w-3.5 h-3.5" />
                      <span>End Chat</span>
                    </button>
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#faf5e9]">
                  {chatMessages.map((m) => {
                    const isAstro = m.sender === 'astrologer';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isAstro ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1 text-[10px] text-[#786a55] mb-0.5">
                          <span>{m.senderName}</span>
                          <span>•</span>
                          <span>{m.timestamp}</span>
                        </div>

                        <div
                          className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs ${
                            isAstro
                              ? 'bg-[#1b4b32] text-white rounded-tr-none'
                              : 'bg-white text-[#2c332d] border border-[#ebdcb9] rounded-tl-none font-medium'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>

                          {m.suggestedSeva && (
                            <div className="mt-2 pt-2 border-t border-white/20 text-[11px] font-bold text-amber-300 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-300" />
                              <span>Prescribed Vedic Remedy: {m.suggestedSeva}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Vedic Remedies Bar */}
                <div className="px-4 py-2 bg-[#fcf5e5] border-t border-[#ebdcb9] flex items-center gap-2 overflow-x-auto text-xs">
                  <span className="text-[11px] font-bold text-[#8b6f38] shrink-0">Quick Prescribe:</span>
                  {[
                    { seva: 'Gau Chara Seva', text: 'I prescribe Gau Chara Seva (5 kg fresh green grass) on Sunday morning. This pleases Lord Surya and resolves professional career delays.' },
                    { seva: 'Gau Roti Seva', text: 'Offering warm rotis prepared with desi ghee (Gau Roti Seva) calms Chandra dosha and brings deep mental peace and restful sleep.' },
                    { seva: 'Gau Gud-Chana Seva', text: 'To pacify fiery Manglik dosha and remove debt hurdles, perform Gau Gud-Chana Seva on Tuesday morning.' },
                    { seva: 'Cheenti Aata Seva', text: 'Offering sweet kasar powder to ants under a peepal tree balances unexpected Rahu-Ketu planetary disturbances.' }
                  ].map((preset) => (
                    <button
                      key={preset.seva}
                      type="button"
                      onClick={() => handleSendQuickUpay(preset.seva, preset.text)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#ebdcb9] hover:bg-[#1b4b32] hover:text-white text-[#453728] text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer"
                    >
                      + {preset.seva}
                    </button>
                  ))}
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-3 bg-[#fffdf9] border-t border-[#ebdcb9] flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Reply as ${currentAstro.name}... (e.g. Share birth time, recommend upay)`}
                    className="flex-1 px-4 py-2.5 rounded-full border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium focus:outline-hidden focus:border-[#1b4b32]"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-2.5 rounded-full bg-[#1b4b32] text-white hover:bg-[#153e29] disabled:opacity-50 transition-colors cursor-pointer shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#f4ebd5] text-[#1b4b32] flex items-center justify-center">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-playfair text-xl font-bold text-[#1b4b32]">
                    Astrologer Live Consultation Desk
                  </h3>
                  <p className="text-xs text-[#71614e] max-w-md mx-auto mt-1">
                    Keep your status <strong className="text-emerald-700">ONLINE</strong>. When a customer clicks &ldquo;Chat Now&rdquo; with {currentAstro.name} on the website, their request will instantly appear here with an alert!
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#8b5a0a] bg-[#fff9ea] px-4 py-2 rounded-xl border border-[#ebdcb9]">
                  <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>Listening for incoming devotee chat requests on {currentAstro.name}&apos;s channel...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONTENT 2: CONSULTATION HISTORY & EARNINGS */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#fffdf9] border border-[#ebdcb9] space-y-1">
                <span className="text-xs text-[#786a55]">Today&apos;s Earnings</span>
                <div className="text-2xl font-black text-[#1b4b32]">₹{analytics.todayEarnings}</div>
                <span className="text-[10px] text-emerald-700 font-bold">Settled to Astrologer Bank Account</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#fffdf9] border border-[#ebdcb9] space-y-1">
                <span className="text-xs text-[#786a55]">Weekly Consultation Earnings</span>
                <div className="text-2xl font-black text-[#1b4b32]">₹{analytics.weeklyEarnings}</div>
                <span className="text-[10px] text-emerald-700 font-bold">Updated in real-time</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#fffdf9] border border-[#ebdcb9] space-y-1">
                <span className="text-xs text-[#786a55]">Monthly Total Earnings</span>
                <div className="text-2xl font-black text-emerald-800">₹{analytics.monthlyEarnings}</div>
                <span className="text-[10px] text-emerald-700 font-bold">All Consultations</span>
              </div>
            </div>

            <div className="bg-[#fffdf9] rounded-2xl border border-[#ebdcb9] overflow-hidden">
              <div className="p-4 border-b border-[#ebdcb9] flex items-center justify-between">
                <h3 className="font-playfair text-base font-bold text-[#1b4b32]">
                  Past Customer Chats &amp; Transcripts
                </h3>
                <span className="text-xs text-[#71614e] font-semibold">
                  {historySessions.length} Completed Sessions
                </span>
              </div>

              {historySessions.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#71614e]">
                  No previous consultation records for {currentAstro.name} yet. Completed chats will appear here automatically.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#fbf4e2] text-[#483c2e] font-bold border-b border-[#ebdcb9]">
                      <tr>
                        <th className="p-3">Session ID</th>
                        <th className="p-3">Devotee</th>
                        <th className="p-3">Concern</th>
                        <th className="p-3">Duration</th>
                        <th className="p-3">Rate</th>
                        <th className="p-3">Earnings</th>
                        <th className="p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f2e5cc]">
                      {historySessions.map((s) => (
                        <tr key={s.id} className="hover:bg-[#fcf9f2]">
                          <td className="p-3 font-mono font-bold text-[#8b6f38]">{s.id}</td>
                          <td className="p-3">
                            <div className="font-bold text-[#1b4b32]">{s.customerName}</div>
                            <div className="text-[10px] text-[#71614e]">+91 {s.customerPhone}</div>
                          </td>
                          <td className="p-3 max-w-xs truncate">{s.customerConcern}</td>
                          <td className="p-3 font-mono">{formatTimer(s.durationSeconds)}</td>
                          <td className="p-3">₹{s.ratePerMin}/min {s.hasDiscount && '(50% Seva Off)'}</td>
                          <td className="p-3 font-bold text-emerald-800">₹{s.astrologerEarned}</td>
                          <td className="p-3 text-[11px] text-[#786a55]">
                            {s.endedAt ? new Date(s.endedAt).toLocaleDateString() : 'Today'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
