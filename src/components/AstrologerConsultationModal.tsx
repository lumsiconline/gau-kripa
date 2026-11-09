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
  CheckCheck,
  Clock,
  Wallet,
  PlusCircle,
  AlertCircle,
  ArrowRight,
  Smile,
  Paperclip,
  Video,
  FileText,
  User,
  Calendar,
  MapPin,
  HelpCircle
} from 'lucide-react';
import { Astrologer } from '../data/sevaData';
import { ImageCrop } from './ImageCrop';
import { api, ChatSession, ChatMessage } from '../services/api';
import { subscribeToSession } from '../services/chatSync';

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

  // States: 'idle' (birth details form) -> 'active' (WhatsApp chat fitted to screen) -> 'ended'
  const [chatStatus, setChatStatus] = useState<'idle' | 'active' | 'ended'>('idle');
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [concern, setConcern] = useState<string>('Career and Grah Shanti guidance');
  const [formStep, setFormStep] = useState(0);

  // Birth Details state
  const [birthDetails, setBirthDetails] = useState({
    name: customerName || '',
    birthDate: '1998-05-15',
    birthPlace: 'New Delhi, India',
  });

  // Dedicated 12-hour Time state with explicit AM / PM selector
  const [timeHour, setTimeHour] = useState<string>('09');
  const [timeMinute, setTimeMinute] = useState<string>('20');
  const [timePeriod, setTimePeriod] = useState<'AM' | 'PM'>('AM');

  // Wallet & simulation state
  const [walletBalance, setWalletBalance] = useState<number>(150);
  const [isTopupOpen, setIsTopupOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Call simulation state
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [callSeconds, setCallSeconds] = useState<number>(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Formatted birth time with AM/PM
  const formattedBirthTime = `${timeHour.padStart(2, '0')}:${timeMinute.padStart(2, '0')} ${timePeriod}`;

  // Reset or initialize on open
  useEffect(() => {
    if (!isOpen) return;

    setChatStatus('idle');
    setFormStep(0);
    setBirthDetails({
      name: customerName || '',
      birthDate: '1998-05-15',
      birthPlace: 'New Delhi, India',
    });
    setTimeHour('09');
    setTimeMinute('20');
    setTimePeriod('AM');
    setSession(null);
    setMessages([]);
    setErrorMessage(null);

    // Fetch user wallet
    api.getWallet(customerPhone)
      .then((w) => setWalletBalance(w.balance))
      .catch(console.error);
  }, [isOpen, customerPhone, customerName]);

  // Real-time listener for incoming messages from the astrologer + polling fallback
  useEffect(() => {
    if (!session || chatStatus !== 'active') return;

    // Zero-latency BroadcastChannel subscription
    const unsubscribe = subscribeToSession(session.id, {
      onMessage: (message) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      },
      onEnd: () => {
        setChatStatus('ended');
      }
    });

    // 1-second polling fallback
    const pollInterval = setInterval(async () => {
      try {
        const res = await api.getChatSession(session.id);
        if (res.session && res.session.messages) {
          setSession(res.session);
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const newOnes = res.session.messages.filter((m) => !existingIds.has(m.id));
            if (newOnes.length > 0) {
              return [...prev, ...newOnes];
            }
            return prev;
          });
          if (res.session.status === 'ended') {
            setChatStatus('ended');
          }
        }
      } catch (err) {
        console.error('Error polling chat session:', err);
      }
    }, 1200);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, [session?.id, chatStatus]);

  // Auto scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatStatus]);

  // Call timer simulation
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

  // Initiate WhatsApp chat and automatically drop down devotee's intake form
  const handleStartChatRequest = async () => {
    setErrorMessage(null);

    const currentTimeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Structured intake card message sent automatically from devotee's side
    const devoteeIntakeText = `📋 VEDIC KUNDALI INTAKE DETAILS:\n• Name: ${birthDetails.name.trim()}\n• Date of Birth: ${birthDetails.birthDate}\n• Birth Time: ${formattedBirthTime}\n• Birth Place: ${birthDetails.birthPlace.trim()}\n• Guidance Needed: ${concern.trim() || 'Kundali & Grah Upay guidance'}\n\nPranam Guruji! Here are my complete birth details. Please analyze my chart and guide me.`;

    const initialDevoteeMsg: ChatMessage = {
      id: `msg-intake-${Date.now()}`,
      sender: 'customer',
      senderName: birthDetails.name.trim() || 'Devotee',
      text: devoteeIntakeText,
      timestamp: currentTimeString,
    };

    // 2. Initial warm response from the Astrologer
    const initialAstroMsg: ChatMessage = {
      id: `msg-welcome-${Date.now() + 1}`,
      sender: 'astrologer',
      senderName: astrologer.name,
      text: `Pranam ${birthDetails.name.trim()} ji! 🙏 Har Har Mahadev. I have received your complete birth details (DOB: ${birthDetails.birthDate}, Time: ${formattedBirthTime}, Place: ${birthDetails.birthPlace.trim()}).\n\nI am analyzing your Lagna Kundali, planetary positions, and current Mahadasha regarding ${concern.trim() || 'your guidance'}.\n\nPlease feel free to ask your specific questions here.`,
      timestamp: currentTimeString,
    };

    const combinedMessages = [initialDevoteeMsg, initialAstroMsg];
    setMessages(combinedMessages);
    setChatStatus('active');

    try {
      // Send chat request to backend and storage so it lands directly on the Astro Dashboard
      const res = await api.requestChat({
        astrologerId: astrologer.id,
        customerId: customerPhone,
        customerName: birthDetails.name.trim(),
        customerPhone,
        customerConcern: concern.trim(),
        birthDate: birthDetails.birthDate,
        birthTime: formattedBirthTime,
        birthPlace: birthDetails.birthPlace.trim(),
        initialMessages: combinedMessages,
      });

      if (res.session) {
        setSession(res.session);
        if (res.session.messages && res.session.messages.length > 0) {
          setMessages(res.session.messages);
        }
      }
    } catch (err: any) {
      console.warn('Backend chat sync notice:', err);
    }
  };

  // Send new message from devotee
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'customer',
      senderName: birthDetails.name || customerName || 'Devotee',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);

    // Send to server/localStorage and broadcast in real-time
    if (session) {
      try {
        const sent = await api.sendChatMessage(session.id, {
          sender: 'customer',
          senderName: birthDetails.name || customerName || 'Devotee',
          text,
        });

        setMessages((prev) => {
          if (prev.some((m) => m.id === sent.id)) return prev;
          return [...prev, sent];
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // End chat confirmation state
  const [showEndConfirm, setShowEndConfirm] = useState<boolean>(false);

  // Trigger end chat confirmation popup
  const handleEndChat = () => {
    setShowEndConfirm(true);
  };

  // Instant confirmation execution
  const confirmAndEndChat = async () => {
    setShowEndConfirm(false);
    if (session) {
      try {
        const ended = await api.endChat(session.id);
        setSession(ended);
      } catch (err) {
        console.error(err);
      }
    }
    setChatStatus('ended');
  };

  // Top up devotee wallet
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Container fitted to screen */}
      <div className="relative w-full max-w-xl bg-[#fffdfa] rounded-3xl shadow-2xl border-2 border-[#ebdcb9] overflow-hidden flex flex-col h-[90vh] max-h-[720px]">
        
        {/* ============================================================
            CASE A: WHATSAPP CHAT INTERFACE (STAGE: ACTIVE OR ENDED)
            ============================================================ */}
        {chatStatus === 'active' || chatStatus === 'ended' ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#efeae2] relative">
            
            {/* WhatsApp Teal Header */}
            <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0 border-b border-[#054c44]">
              
              {/* Astrologer Identity */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => setChatStatus('idle')}
                  className="p-1 rounded-full hover:bg-white/10 text-white/90 mr-0.5 cursor-pointer"
                  title="Back to Details"
                >
                  <ArrowRight className="w-5 h-5 rotate-180" />
                </button>

                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/60 shadow-xs bg-amber-50">
                    <ImageCrop cropKey={astrologer.cropKey} className="w-full h-full object-cover" alt={astrologer.name} />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#25d366] border-2 border-[#075e54]" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm sm:text-base text-white truncate leading-tight">
                      {astrologer.name}
                    </h3>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  </div>
                  <div className="text-[11px] text-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#25d366] animate-pulse" />
                    <span>online • Vedic Astrologer</span>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setMode('call');
                    setCallStatus('connecting');
                    setCallSeconds(0);
                    setTimeout(() => setCallStatus('connected'), 1200);
                  }}
                  className="p-2 rounded-full hover:bg-white/15 text-white transition-colors cursor-pointer"
                  title="Audio Consultation Call"
                >
                  <Phone className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleEndChat}
                  className="px-2.5 py-1 rounded-full bg-red-600/90 hover:bg-red-700 text-white text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                  title="End Chat"
                >
                  End Chat
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

            {/* WhatsApp Chat Body with Doodle Texture Background */}
            <div
              className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3"
              style={{
                backgroundColor: '#efeae2',
                backgroundImage: `radial-gradient(#d6cdc0 1px, transparent 1px)`,
                backgroundSize: '16px 16px',
              }}
            >
              
              {/* WhatsApp Security Badge */}
              <div className="flex justify-center my-1">
                <div className="bg-[#ffeecd] text-[#5e4b2d] text-[10px] sm:text-[11px] font-medium px-3.5 py-1.5 rounded-xl shadow-2xs border border-[#ebdcb9] max-w-sm text-center leading-relaxed">
                  🔒 Messages are end-to-end encrypted with Vedic confidentiality. Your birth details are sent directly to {astrologer.name}.
                </div>
              </div>

              {/* Centered Date Badge */}
              <div className="flex justify-center my-1">
                <span className="bg-[#ffffff]/90 text-[#54656f] text-[10px] font-bold px-3 py-0.5 rounded-md shadow-2xs uppercase tracking-wider">
                  TODAY
                </span>
              </div>

              {/* Messages Feed */}
              {messages.map((m, idx) => {
                const isDevotee = m.sender === 'customer';
                const isIntakeMessage = idx === 0 && isDevotee && m.text.includes('VEDIC KUNDALI INTAKE');

                return (
                  <div
                    key={m.id || idx}
                    className={`flex flex-col ${isDevotee ? 'items-end' : 'items-start'} animate-in fade-in duration-150`}
                  >
                    <div
                      className={`relative max-w-[88%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs leading-relaxed ${
                        isDevotee
                          ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-2xs border border-[#c2f0bb]'
                          : 'bg-white text-[#111b21] rounded-tl-2xs border border-[#e1ded7]'
                      }`}
                    >
                      {/* AUTOMATED INTAKE FORM CARD (DROPPED DOWN FROM DEVOTEE SIDE) */}
                      {isIntakeMessage ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 pb-1.5 border-b border-emerald-300/60 font-bold text-[#1b4b32]">
                            <FileText className="w-4 h-4 text-emerald-700" />
                            <span>Vedic Kundali Intake Form</span>
                          </div>

                          <div className="bg-white/80 rounded-xl p-2.5 space-y-1.5 border border-emerald-200/60 text-[11px] text-[#2c3e2e]">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="font-semibold text-slate-800">Devotee Name:</span>
                              <span className="font-bold text-[#1b4b32]">{birthDetails.name || 'Devotee'}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="font-semibold text-slate-800">Date of Birth:</span>
                              <span className="font-medium text-slate-900">{birthDetails.birthDate}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="font-semibold text-slate-800">Birth Time:</span>
                              <span className="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-mono">
                                {formattedBirthTime}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="font-semibold text-slate-800">Birth Place:</span>
                              <span className="font-medium text-slate-900">{birthDetails.birthPlace}</span>
                            </div>

                            <div className="flex items-start gap-1.5 pt-1 border-t border-emerald-100">
                              <HelpCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold text-slate-800">Consultation Focus:</span>
                                <p className="text-[#1b4b32] font-medium">{concern || 'Kundali & Grah Upay'}</p>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-[#1e3a24] font-medium pt-0.5">
                            Pranam Guruji! Here are my complete birth details. Please analyze my chart and guide me.
                          </p>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{m.text}</p>
                      )}

                      {/* Prescribed Remedy Seva Action if sent by Astrologer */}
                      {m.suggestedSeva && (
                        <div className="mt-2.5 pt-2 border-t border-[#ebdcb9] space-y-1.5 bg-amber-50/70 p-2 rounded-xl">
                          <span className="text-[11px] font-bold text-[#1b4b32] flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                            <span>Prescribed Sacred Seva Remedy:</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              if (onBookPrescribedSeva) onBookPrescribedSeva(m.suggestedSeva!);
                            }}
                            className="w-full py-1.5 px-3 rounded-xl bg-[#e5a024] hover:bg-[#d8941d] text-slate-950 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            <span>Book {m.suggestedSeva} Now</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* WhatsApp Time & Checkmark footer */}
                      <div className="flex items-center justify-end gap-1 text-[10px] text-[#667781] mt-1 select-none">
                        <span>{m.timestamp || 'Now'}</span>
                        {isDevotee && (
                          <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* Confirmation Popup Modal for End Chat */}
            {showEndConfirm && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-2 border-red-200 text-center space-y-4 animate-in zoom-in-95">
                  <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-2xl font-bold shadow-inner">
                    ⚠️
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-playfair text-lg font-bold text-[#1b4b32]">
                      End Vedic Consultation?
                    </h4>
                    <p className="text-xs text-[#71614e] leading-relaxed">
                      Are you sure you want to end this consultation? The session will conclude instantly.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEndConfirm(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmAndEndChat}
                      className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer transition-colors shadow-md active:scale-95"
                    >
                      Yes, End Chat
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* WhatsApp Message Input Bar or Concluded Notice */}
            {chatStatus === 'ended' ? (
              <div className="bg-[#f0f2f5] px-4 py-3.5 border-t border-[#d1d7db] flex items-center justify-between gap-3 text-xs shrink-0 animate-in fade-in">
                <div className="flex items-center gap-2 text-[#3b4a54]">
                  <span className="text-lg">🙏</span>
                  <span className="font-semibold">This consultation has concluded. Har Har Mahadev!</span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full bg-[#075e54] hover:bg-[#054c44] text-white font-bold text-xs cursor-pointer shadow-xs transition-colors shrink-0"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <div className="bg-[#f0f2f5] px-3 py-2.5 border-t border-[#d1d7db] flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  className="p-1.5 text-[#54656f] hover:text-[#111b21] transition-colors cursor-pointer"
                  title="Emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  className="p-1.5 text-[#54656f] hover:text-[#111b21] transition-colors cursor-pointer"
                  title="Attach"
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message to Guruji..."
                    className="flex-1 px-4 py-2.5 rounded-full bg-white text-xs sm:text-sm text-[#111b21] placeholder-[#667781] border border-white focus:outline-hidden shadow-2xs"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-40 shrink-0 active:scale-95"
                    title="Send Message"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>
              </div>
            )}

          </div>
        ) : (
          /* ============================================================
             CASE B: BIRTH DETAILS INTAKE FORM (NO PRICE DISPLAYED)
             ============================================================ */
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#faf5e8]">
            
            {/* Modal Top Bar */}
            <div className="bg-gradient-to-r from-[#173e2a] via-[#1b4b32] to-[#173e2a] text-white px-5 py-4 border-b border-[#296344] shrink-0 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                
                {/* Astrologer Profile & Credentials (Price Removed) */}
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

                    {/* Vedic rating (NO PER-MINUTE PRICE DISPLAYED) */}
                    <div className="flex items-center gap-2 text-[11px] text-amber-300/95 font-medium mt-0.5">
                      <span className="flex items-center text-amber-300 font-semibold">
                        <Star className="w-3 h-3 fill-amber-300 text-amber-300 mr-1" />
                        {astrologer.rating} Vedic Rating
                      </span>
                      <span className="text-emerald-400/60">•</span>
                      <span className="text-emerald-200 font-medium">Confidential Live Consultation</span>
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

            {/* Form Body (Step 1 to 4) */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              
              {/* Vedic Reassurance Banner (Price Removed) */}
              <div className="p-3.5 rounded-2xl bg-[#f5ede0] border border-[#ebdcb9] text-xs text-[#3a2e22] flex items-center gap-2.5 shadow-2xs">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <strong className="text-[#1b4b32] font-playfair text-sm block">
                    Direct Vedic Kundali &amp; Grah Consultation
                  </strong>
                  <p className="text-[11px] text-[#71614e]">
                    Enter your birth details below. Your chart will be generated instantly and sent to {astrologer.name} for live consultation.
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Step indicator */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1b4b32]">Your birth details</span>
                  <span className="text-[11px] font-semibold text-[#887864]">Step {formStep + 1} of 4</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#eadfc8] overflow-hidden">
                  <div
                    className="h-full bg-[#1b4b32] transition-all duration-300"
                    style={{ width: `${((formStep + 1) / 4) * 100}%` }}
                  />
                </div>

                {/* STEP 1: NAME */}
                {formStep === 0 && (
                  <label className="block text-xs font-bold text-[#453728]">
                    What is your full name?
                    <input
                      autoFocus
                      type="text"
                      value={birthDetails.name}
                      onChange={(e) => setBirthDetails({ ...birthDetails, name: e.target.value })}
                      placeholder="Enter your full name"
                      className="mt-2 w-full px-3.5 py-3 rounded-xl border border-[#ebdcb9] bg-white text-sm font-medium focus:outline-hidden focus:border-[#1b4b32]"
                    />
                  </label>
                )}

                {/* STEP 2: DATE OF BIRTH */}
                {formStep === 1 && (
                  <label className="block text-xs font-bold text-[#453728]">
                    What is your date of birth?
                    <input
                      autoFocus
                      type="date"
                      value={birthDetails.birthDate}
                      onChange={(e) => setBirthDetails({ ...birthDetails, birthDate: e.target.value })}
                      className="mt-2 w-full px-3.5 py-3 rounded-xl border border-[#ebdcb9] bg-white text-sm font-medium focus:outline-hidden focus:border-[#1b4b32]"
                    />
                  </label>
                )}

                {/* STEP 3: EXACT BIRTH TIME WITH AM / PM SECTION */}
                {formStep === 2 && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#453728]">
                      What is your exact birth time?
                    </label>

                    <div className="mt-2 p-3.5 rounded-2xl bg-white border border-[#ebdcb9] shadow-2xs space-y-3">
                      
                      {/* Hours, Minutes, and AM/PM Selector */}
                      <div className="grid grid-cols-3 gap-2 items-center">
                        
                        {/* Hour Selector */}
                        <div>
                          <span className="block text-[11px] font-bold text-[#71614e] mb-1">Hour (1-12)</span>
                          <select
                            value={timeHour}
                            onChange={(e) => setTimeHour(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-[#ebdcb9] bg-[#fffdfa] text-sm font-bold text-[#1b4b32] focus:outline-hidden focus:border-[#1b4b32]"
                          >
                            {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Minute Selector */}
                        <div>
                          <span className="block text-[11px] font-bold text-[#71614e] mb-1">Minute (00-59)</span>
                          <select
                            value={timeMinute}
                            onChange={(e) => setTimeMinute(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-[#ebdcb9] bg-[#fffdfa] text-sm font-bold text-[#1b4b32] focus:outline-hidden focus:border-[#1b4b32]"
                          >
                            {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                              <option key={m} value={m}>
                                {m}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* AM / PM SECTION (PROMINENT TOGGLE BUTTONS) */}
                        <div>
                          <span className="block text-[11px] font-bold text-[#71614e] mb-1">AM / PM</span>
                          <div className="grid grid-cols-2 gap-1 bg-[#f3ebd7] p-1 rounded-xl border border-[#ebdcb9]">
                            <button
                              type="button"
                              onClick={() => setTimePeriod('AM')}
                              className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                timePeriod === 'AM'
                                  ? 'bg-[#1b4b32] text-white shadow-xs'
                                  : 'text-[#5a4835] hover:bg-[#eae0c6]'
                              }`}
                            >
                              AM
                            </button>
                            <button
                              type="button"
                              onClick={() => setTimePeriod('PM')}
                              className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                timePeriod === 'PM'
                                  ? 'bg-[#1b4b32] text-white shadow-xs'
                                  : 'text-[#5a4835] hover:bg-[#eae0c6]'
                              }`}
                            >
                              PM
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* Selected Time Preview Badge */}
                      <div className="flex items-center justify-between pt-1 border-t border-[#f0e3c5] text-xs">
                        <span className="text-[#71614e]">Formatted Birth Time:</span>
                        <span className="font-mono font-bold text-[#1b4b32] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                          ⏰ {formattedBirthTime}
                        </span>
                      </div>

                    </div>
                  </div>
                )}

                {/* STEP 4: BIRTH PLACE */}
                {formStep === 3 && (
                  <label className="block text-xs font-bold text-[#453728]">
                    Where were you born?
                    <input
                      autoFocus
                      type="text"
                      value={birthDetails.birthPlace}
                      onChange={(e) => setBirthDetails({ ...birthDetails, birthPlace: e.target.value })}
                      placeholder="e.g. New Delhi, Mumbai, Varanasi, Jaipur..."
                      className="mt-2 w-full px-3.5 py-3 rounded-xl border border-[#ebdcb9] bg-white text-sm font-medium focus:outline-hidden focus:border-[#1b4b32]"
                    />
                  </label>
                )}

                {/* Navigation Buttons (Price Removed from Connect button) */}
                <div className="flex gap-2 pt-1">
                  {formStep > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormStep((step) => step - 1)}
                      className="px-5 py-3 rounded-full border border-[#1b4b32]/30 text-[#1b4b32] text-xs font-bold hover:bg-[#f6efe0] cursor-pointer"
                    >
                      Back
                    </button>
                  )}

                  {formStep < 3 ? (
                    <button
                      type="button"
                      disabled={
                        ![
                          birthDetails.name.trim(),
                          birthDetails.birthDate,
                          formattedBirthTime,
                          birthDetails.birthPlace.trim(),
                        ][formStep]
                      }
                      onClick={() => setFormStep((step) => step + 1)}
                      className="flex-1 py-3 px-5 rounded-full bg-[#1b4b32] text-white font-bold text-sm disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    /* Final Button - Price completely removed as requested */
                    <button
                      type="button"
                      disabled={!birthDetails.birthPlace.trim() || !birthDetails.name.trim() || !birthDetails.birthDate}
                      onClick={handleStartChatRequest}
                      className="flex-1 py-3 px-5 rounded-full bg-[#1b4b32] hover:bg-[#153e29] text-amber-200 font-bold text-sm shadow-md disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
                    >
                      <MessageSquare className="w-4 h-4 text-amber-300" />
                      <span>Start Live Chat with {astrologer.name}</span>
                    </button>
                  )}
                </div>

              </div>

              {/* Consultation Focus Field */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-[#453728]">
                  What guidance do you need? (optional)
                </label>
                <input
                  type="text"
                  value={concern}
                  onChange={(e) => setConcern(e.target.value)}
                  placeholder="Career, marriage, relationship, health, business, finances..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#ebdcb9] bg-white text-xs font-medium focus:outline-hidden focus:border-[#1b4b32]"
                />
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
