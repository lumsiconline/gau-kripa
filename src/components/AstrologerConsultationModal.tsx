import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  Send,
  Sparkles,
  PhoneOff,
  Star,
  ShieldCheck,
  Check,
  Clock,
  Wallet,
  PlusCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Astrologer } from '../data/sevaData';
import { ImageCrop } from './ImageCrop';
import { api, ChatSession, ChatMessage } from '../services/api';

interface AstrologerConsultationModalProps {
  astrologer: Astrologer;
  initialMode?: 'chat' | 'call';
  isOpen: boolean;
  onClose: () => void;
  hasDiscount?: boolean;
  customerPhone?: string;
  customerName?: string;
  onBookPrescribedSeva?: (sevaTitle: string) => void;
}

export const AstrologerConsultationModal: React.FC<AstrologerConsultationModalProps> = ({
  astrologer,
  initialMode = 'chat',
  isOpen,
  onClose,
  hasDiscount = false,
  customerPhone = '9876543210',
  customerName = 'Harsh Bhardwaj',
  onBookPrescribedSeva,
}) => {
  const [mode, setMode] = useState<'chat' | 'call'>(initialMode);
  
  // Real workflow states: 'idle' -> 'requesting' -> 'waiting_acceptance' -> 'active' -> 'ended'
  const [chatStatus, setChatStatus] = useState<'idle' | 'requesting' | 'waiting_acceptance' | 'active' | 'ended'>('idle');
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [concern, setConcern] = useState<string>('Career and Grah Shanti guidance');
  const [formStep, setFormStep] = useState(0);
  const [birthDetails, setBirthDetails] = useState({ name: customerName || '', birthDate: '', birthTime: '', birthPlace: '' });

  // Wallet & Discount state
  const [walletBalance, setWalletBalance] = useState<number>(250);
  const [isDiscountEligible, setIsDiscountEligible] = useState<boolean>(hasDiscount);
  const [activeRatePerMin, setActiveRatePerMin] = useState<number>(hasDiscount ? 10 : 20);
  const [isTopupOpen, setIsTopupOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Call simulation state
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [callSeconds, setCallSeconds] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load wallet and verified discount on open
  useEffect(() => {
    if (!isOpen) return;

    setChatStatus('idle');
    setFormStep(0);
    setBirthDetails({ name: customerName || '', birthDate: '', birthTime: '', birthPlace: '' });
    setSession(null);
    setMessages([]);
    setErrorMessage(null);

    async function checkEligibility() {
      try {
        const [w, d] = await Promise.all([
          api.getWallet(customerPhone),
          api.checkDiscount(customerPhone),
        ]);
        setWalletBalance(w.balance);
        setIsDiscountEligible(d.eligible || hasDiscount);
        setActiveRatePerMin(d.eligible || hasDiscount ? d.discountedRate : astrologer.ratePerMin || 20);
      } catch (err) {
        console.error('Failed to load wallet/discount info:', err);
      }
    }
    checkEligibility();
  }, [isOpen, customerPhone, astrologer, hasDiscount]);

  // Polling loop when session is requested or active
  useEffect(() => {
    if (!session || chatStatus === 'idle' || chatStatus === 'ended') return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await api.getChatSession(session.id);
        if (res.session) {
          setSession(res.session);
          setMessages(res.session.messages || []);
          setWalletBalance(res.customerWalletBalance);

          if (res.session.status === 'active' && chatStatus === 'waiting_acceptance') {
            setChatStatus('active');
          } else if (res.session.status === 'rejected') {
            setChatStatus('idle');
            setErrorMessage(`${astrologer.name} is currently busy with sacred rituals. Please try again or choose another astrologer.`);
          } else if (res.session.status === 'ended') {
            setChatStatus('ended');
          }
        }
      } catch (err) {
        console.error('Error polling chat session:', err);
      }
    }, 1500);

    return () => clearInterval(pollInterval);
  }, [session, chatStatus, astrologer.name]);

  // Auto scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Call timer effect
  useEffect(() => {
    let interval: any;
    if (mode === 'call' && callStatus === 'connected') {
      interval = setInterval(() => {
        setCallSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, callStatus]);

  if (!isOpen) return null;

  // Initiate chat request to the specific astrologer
  const handleStartChatRequest = async () => {
    setErrorMessage(null);
    setChatStatus('requesting');
    try {
      const res = await api.requestChat({
        astrologerId: astrologer.id,
        customerId: customerPhone,
        customerName: birthDetails.name.trim(),
        customerPhone,
        customerConcern: concern,
        birthDate: birthDetails.birthDate,
        birthTime: birthDetails.birthTime,
        birthPlace: birthDetails.birthPlace,
      });

      if (res.session) {
        setSession(res.session);
        setMessages(res.session.messages || []);
        setChatStatus('waiting_acceptance');
      }
    } catch (err: any) {
      setChatStatus('idle');
      setErrorMessage(err.message || 'Unable to connect with astrologer right now.');
    }
  };

  // Send message from customer
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !session || chatStatus !== 'active') return;
    const text = inputText;
    setInputText('');

    try {
      const newMsg = await api.sendChatMessage(session.id, {
        sender: 'customer',
        senderName: customerName || 'Devotee',
        text,
      });
      setMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error(err);
    }
  };

  // End chat
  const handleEndChat = async () => {
    if (!session) return;
    if (!confirm('Are you sure you want to end this consultation?')) return;
    try {
      const ended = await api.endChat(session.id);
      setSession(ended);
      setChatStatus('ended');
    } catch (err) {
      console.error(err);
    }
  };

  // Quick Wallet Top-up
  const handleTopup = async (amt: number) => {
    try {
      const updated = await api.topupWallet(customerPhone, amt, customerName);
      setWalletBalance(updated.balance);
      setIsTopupOpen(false);
      setErrorMessage(null);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-[#fffdfa] rounded-3xl shadow-2xl border-2 border-[#ebdcb9] overflow-hidden flex flex-col h-[85vh] max-h-[680px]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#173e2a] via-[#1b4b32] to-[#173e2a] text-white px-5 py-4 border-b border-[#296344] shrink-0 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            {/* Astrologer Profile & Info */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-13 h-13 rounded-full overflow-hidden border-2 border-amber-300/90 shadow-md bg-amber-50">
                  <ImageCrop cropKey={astrologer.cropKey} className="w-full h-full object-cover" alt={astrologer.name} />
                </div>
                {/* Online Green Dot Indicator */}
                <span className="absolute bottom-0 right-0 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#1b4b32]" />
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-playfair text-base sm:text-lg font-bold text-amber-200 truncate">
                    {astrologer.name}
                  </h3>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </span>
                </div>
                <div className="text-xs text-emerald-100/90 font-medium truncate mt-0.5">
                  {astrologer.title} • {astrologer.experience}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-amber-300/95 font-medium mt-0.5">
                  <span className="flex items-center text-amber-300 font-semibold">
                    <Star className="w-3 h-3 fill-amber-300 text-amber-300 mr-1" />
                    {astrologer.rating}
                  </span>
                  <span className="text-emerald-400/60">•</span>
                  <span className="font-semibold text-white">
                    ₹{activeRatePerMin}/min
                    {isDiscountEligible && (
                      <span className="line-through text-white/50 text-[10px] ml-1.5">₹20</span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Devotee Wallet & Close Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsTopupOpen(!isTopupOpen)}
                className="bg-emerald-950/85 hover:bg-emerald-900 px-3 py-1.5 rounded-xl border border-emerald-700/80 text-xs font-bold text-amber-200 flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs hover:border-amber-400/40 active:scale-95"
                title="Devotee Wallet Balance (Click to Top Up)"
              >
                <Wallet className="w-3.5 h-3.5 text-amber-400" />
                <span>₹{walletBalance}</span>
                <PlusCircle className="w-3 h-3 text-emerald-400" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 gap-2 mt-3.5 pt-2.5 border-t border-emerald-800/80">
            <button
              type="button"
              onClick={() => setMode('chat')}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'chat'
                  ? 'bg-[#e5a024] hover:bg-[#d4901a] text-slate-950 shadow-xs'
                  : 'bg-emerald-900/60 text-emerald-100 hover:bg-emerald-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Live Vedic Chat</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('call');
                setCallStatus('connecting');
                setCallSeconds(0);
                setTimeout(() => setCallStatus('connected'), 1500);
              }}
              className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                mode === 'call'
                  ? 'bg-[#e5a024] hover:bg-[#d4901a] text-slate-950 shadow-xs'
                  : 'bg-emerald-900/60 text-emerald-100 hover:bg-emerald-900'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Instant Call</span>
            </button>
          </div>
        </div>

        {/* Top-Up Quick Drawer */}
        {isTopupOpen && (
          <div className="p-3 bg-[#fff9ea] border-b border-[#ebdcb9] flex items-center justify-between gap-2 text-xs animate-in slide-in-from-top-2">
            <span className="font-bold text-[#1b4b32]">Recharge Devotee Wallet:</span>
            <div className="flex items-center gap-2">
              {[100, 250, 500].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleTopup(amt)}
                  className="px-2.5 py-1 rounded-lg bg-[#1b4b32] text-white font-bold hover:bg-[#153e29] cursor-pointer"
                >
                  +₹{amt}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsTopupOpen(false)}
                className="text-xs text-[#71614e] underline ml-1 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        {mode === 'chat' ? (
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#faf5e8]">
            
            {/* STAGE 1: BEFORE CHAT CONNECTED (IDLE / PROMPT SELECTION) */}
            {chatStatus === 'idle' && (
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                
                {/* 50% Seva Discount Banner */}
                {isDiscountEligible ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center gap-2.5 shadow-2xs">
                    <Sparkles className="w-5 h-5 text-emerald-700 shrink-0" />
                    <div>
                      <strong className="text-emerald-900">50% Seva Discount Verified!</strong>
                      <p className="text-[11px] text-emerald-800">
                        Because you have booked Gau Seva with GauKripa, your consultation rate is only{' '}
                        <strong className="text-emerald-950">₹10/min</strong> (Standard: ₹20/min).
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                    <span>Standard Consultation Rate: <strong>₹{astrologer.ratePerMin}/min</strong></span>
                    <span className="text-[10px] text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full font-bold">
                      Book any Gau Seva to unlock 50% Off (₹10/min)
                    </span>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Step-by-step birth details before opening the live chat */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1b4b32]">Your birth details</span>
                    <span className="text-[11px] font-semibold text-[#887864]">Step {formStep + 1} of 4</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#eadfc8] overflow-hidden">
                    <div className="h-full bg-[#1b4b32] transition-all" style={{ width: `${((formStep + 1) / 4) * 100}%` }} />
                  </div>
                  {formStep === 0 && <label className="block text-xs font-bold text-[#453728]">What is your full name?
                    <input autoFocus type="text" value={birthDetails.name} onChange={(e) => setBirthDetails({ ...birthDetails, name: e.target.value })} placeholder="Enter your full name" className="mt-2 w-full px-3.5 py-3 rounded-xl border border-[#ebdcb9] bg-white text-sm font-medium focus:outline-hidden focus:border-[#1b4b32]" />
                  </label>}
                  {formStep === 1 && <label className="block text-xs font-bold text-[#453728]">What is your date of birth?
                    <input autoFocus type="date" value={birthDetails.birthDate} onChange={(e) => setBirthDetails({ ...birthDetails, birthDate: e.target.value })} className="mt-2 w-full px-3.5 py-3 rounded-xl border border-[#ebdcb9] bg-white text-sm font-medium focus:outline-hidden focus:border-[#1b4b32]" />
                  </label>}
                  {formStep === 2 && <label className="block text-xs font-bold text-[#453728]">What is your exact birth time?
                    <input autoFocus type="time" value={birthDetails.birthTime} onChange={(e) => setBirthDetails({ ...birthDetails, birthTime: e.target.value })} className="mt-2 w-full px-3.5 py-3 rounded-xl border border-[#ebdcb9] bg-white text-sm font-medium focus:outline-hidden focus:border-[#1b4b32]" />
                  </label>}
                  {formStep === 3 && <label className="block text-xs font-bold text-[#453728]">Where were you born?
                    <input autoFocus type="text" value={birthDetails.birthPlace} onChange={(e) => setBirthDetails({ ...birthDetails, birthPlace: e.target.value })} placeholder="City, State, Country" className="mt-2 w-full px-3.5 py-3 rounded-xl border border-[#ebdcb9] bg-white text-sm font-medium focus:outline-hidden focus:border-[#1b4b32]" />
                  </label>}
                  <div className="flex gap-2">
                    {formStep > 0 && <button type="button" onClick={() => setFormStep((step) => step - 1)} className="px-5 py-3 rounded-full border border-[#1b4b32]/30 text-[#1b4b32] text-xs font-bold">Back</button>}
                    {formStep < 3 ? (
                      <button type="button" disabled={![birthDetails.name.trim(), birthDetails.birthDate, birthDetails.birthTime, birthDetails.birthPlace.trim()][formStep]} onClick={() => setFormStep((step) => step + 1)} className="flex-1 py-3 px-5 rounded-full bg-[#1b4b32] text-white font-bold text-sm disabled:opacity-40">Continue <ArrowRight className="inline w-4 h-4 ml-1" /></button>
                    ) : (
                      <button type="button" disabled={!birthDetails.birthPlace.trim() || !birthDetails.name.trim() || !birthDetails.birthDate || !birthDetails.birthTime} onClick={handleStartChatRequest} className="flex-1 py-3 px-5 rounded-full bg-[#1b4b32] hover:bg-[#153e29] text-white font-bold text-sm shadow-md disabled:opacity-40 flex items-center justify-center gap-2">
                        <MessageSquare className="w-4 h-4 text-amber-300" /> Connect with {astrologer.name} (₹{activeRatePerMin}/min)
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#453728]">What guidance do you need? (optional)</label>
                  <input type="text" value={concern} onChange={(e) => setConcern(e.target.value)} placeholder="Career, relationship, marriage, finances..." className="w-full px-3.5 py-2.5 rounded-xl border border-[#ebdcb9] bg-white text-xs font-medium focus:outline-hidden focus:border-[#1b4b32]" />
                </div>
              </div>
            )}

            {/* STAGE 2: WAITING FOR ASTROLOGER TO ACCEPT INCOMING REQUEST */}
            {chatStatus === 'waiting_acceptance' && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-400 flex items-center justify-center text-amber-700 animate-pulse">
                    <Clock className="w-8 h-8" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 animate-ping" />
                </div>

                <div>
                  <h3 className="font-playfair text-lg font-bold text-[#1b4b32]">
                    Connecting directly to {astrologer.name}...
                  </h3>
                  <p className="text-xs text-[#71614e] max-w-sm mx-auto mt-1">
                    Your request has been sent to {astrologer.name}&apos;s live Vedic dashboard. Please wait while Guruji accepts your consultation.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#ebdcb9] text-xs text-[#453728] max-w-sm w-full space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#887864]">Consultation Rate:</span>
                    <strong className="text-emerald-800">₹{activeRatePerMin} / min</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#887864]">Your Wallet Balance:</span>
                    <strong className="text-[#1b4b32]">₹{walletBalance}</strong>
                  </div>
                </div>

                <button
                  onClick={() => setChatStatus('idle')}
                  className="text-xs text-red-700 font-bold hover:underline cursor-pointer"
                >
                  Cancel Request
                </button>
              </div>
            )}

            {/* STAGE 3: ACTIVE LIVE CHAT ROOM */}
            {(chatStatus === 'active' || chatStatus === 'ended') && (
              <>
                {/* Active Session Status Strip */}
                <div className="bg-[#fff9ea] border-b border-[#ebdcb9] px-4 py-2 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${chatStatus === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    <span className="font-bold text-[#1b4b32]">
                      {chatStatus === 'active' ? 'Live Session Active' : 'Session Ended'}
                    </span>
                    <span className="text-[#786a55]">
                      (₹{session?.ratePerMin || activeRatePerMin}/min)
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="font-mono font-bold text-[#1b4b32] flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{formatTimer(session?.durationSeconds || 0)}</span>
                    </div>

                    <div className="text-[#8b5a0a] font-bold">
                      Dakshina: ₹{session?.totalCharged || 0}
                    </div>

                    {chatStatus === 'active' && (
                      <button
                        onClick={handleEndChat}
                        className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-bold text-[11px] hover:bg-red-700 cursor-pointer"
                      >
                        End Chat
                      </button>
                    )}
                  </div>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#faf5e8]">
                  {messages.map((m) => {
                    const isDevotee = m.sender === 'customer';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isDevotee ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1 text-[10px] text-[#786a55] mb-0.5">
                          <span>{m.senderName}</span>
                          <span>•</span>
                          <span>{m.timestamp}</span>
                        </div>

                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs ${
                            isDevotee
                              ? 'bg-[#1b4b32] text-white rounded-tr-none'
                              : 'bg-white text-[#2c332d] border border-[#ebdcb9] rounded-tl-none font-medium'
                          }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>

                          {m.suggestedSeva && (
                            <div className="mt-2.5 pt-2 border-t border-[#ebdcb9] space-y-1.5">
                              <span className="text-[11px] font-bold text-[#1b4b32] flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                <span>Astrologer Prescribed Remedy:</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  if (onBookPrescribedSeva) onBookPrescribedSeva(m.suggestedSeva!);
                                }}
                                className="w-full py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              >
                                <span>Book {m.suggestedSeva} Now</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                {chatStatus === 'active' ? (
                  <form onSubmit={handleSendMessage} className="p-3 bg-[#fffdf9] border-t border-[#ebdcb9] flex items-center gap-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type your reply or birth details (DOB, Time, Place)..."
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
                ) : (
                  <div className="p-4 bg-[#fff9ea] border-t border-[#ebdcb9] text-center space-y-2">
                    <p className="text-xs font-bold text-[#1b4b32]">
                      Consultation concluded with {astrologer.name}. Total Dakshina: ₹{session?.totalCharged || 0}.
                    </p>
                    <button
                      type="button"
                      onClick={() => setChatStatus('idle')}
                      className="px-5 py-2 rounded-full bg-[#1b4b32] text-white text-xs font-bold hover:bg-[#153e29] cursor-pointer"
                    >
                      Start New Consultation
                    </button>
                  </div>
                )}
              </>
            )}

          </div>
        ) : (
          /* Instant Call simulation tab */
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-5 bg-[#faf5e8]">
            <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-amber-400 shadow-md">
              <ImageCrop cropKey={astrologer.cropKey} className="w-full h-full object-cover" alt={astrologer.name} />
            </div>

            <div>
              <h3 className="font-playfair text-xl font-bold text-[#1b4b32]">{astrologer.name}</h3>
              <p className="text-xs text-[#71614e] font-medium">{astrologer.title}</p>
              <div className="mt-2 text-sm font-mono font-bold text-emerald-800">
                {callStatus === 'connecting' ? 'Calling Priest...' : formatTimer(callSeconds)}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCallStatus('ended')}
                className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md cursor-pointer"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
