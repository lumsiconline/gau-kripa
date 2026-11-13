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
  VolumeX,
  RefreshCw,
  Award,
  Bell,
  BellRing,
  BellOff,
  Languages,
} from 'lucide-react';
import { api, AstrologerItem, ChatSession, ChatMessage } from '../../services/api';
import { subscribeToSession, subscribeToAstrologerIncoming } from '../../services/chatSync';
import { ImageCrop } from '../ImageCrop';
import { useLanguage } from '../../i18n/LanguageContext';

interface AstrologerDashboardProps {
  onBackToWebsite: () => void;
  selectedAstroId?: string;
}

// Auspicious Web Audio temple bell chime (100% self-contained, no external mp3 dependency)
function playTempleChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const playTone = (freq: number, start: number, duration: number, vol = 0.25) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    const now = ctx.currentTime;
    // Harmonic temple bell arpeggio (C5 -> E5 -> G5 -> C6)
    playTone(523.25, now, 0.7, 0.22);
    playTone(659.25, now + 0.16, 0.7, 0.22);
    playTone(783.99, now + 0.32, 1.1, 0.28);
    playTone(1046.50, now + 0.48, 1.5, 0.32);
  } catch (err) {
    console.warn('Audio chime playback not allowed or failed:', err);
  }
}

export const AstrologerDashboard: React.FC<AstrologerDashboardProps> = ({
  onBackToWebsite,
  selectedAstroId,
}) => {
  const { lang, setLang, tr } = useLanguage();
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

  // Browser Notification & Sound Alert State
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);
  const lastNotifiedIdRef = useRef<string | null>(null);
  const originalTitleRef = useRef<string>(typeof document !== 'undefined' ? document.title : 'GauKripa');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast(tr('इस ब्राउज़र में नोटिफिकेशन समर्थित नहीं हैं।', 'Browser notifications are not supported in this browser.'));
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        showToast(tr('🔔 ब्राउज़र अलर्ट चालू हो गए! अब सभी नए परामर्श अनुरोधों की सूचना मिलेगी।', '🔔 Browser notifications enabled! You will be alerted for all new devotee consults.'));
        playTempleChime();
        try {
          new Notification(tr('✨ गौकृपा ज्योतिष अलर्ट सक्रिय', '✨ GauKripa Astrologer Alerts Active'), {
            body: tr('जब भी कोई श्रद्धालु लाइव परामर्श का अनुरोध करेगा, आपको तुरंत सूचना मिलेगी!', 'You will receive instant alerts right here whenever a devotee requests a live consultation!'),
            icon: '/favicon.ico',
          });
        } catch (e) {
          console.error(e);
        }
      } else if (perm === 'denied') {
        showToast(tr('ब्राउज़र में नोटिफिकेशन अवरुद्ध हैं। घंटी की ध्वनि फिर भी बजेगी।', 'Notifications blocked in browser. Sound chimes will still play.'));
      }
    } catch (err) {
      console.error('Failed to request notification permission:', err);
    }
  };

  // Test notification button
  const handleTestAlert = () => {
    playTempleChime();
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(tr('🔔 परीक्षण अलर्ट: श्रद्धालु परामर्श तैयार', '🔔 Test Alert: Devotee Consult Ready'), {
          body: tr('यह एक परीक्षण सूचना है। वास्तविक श्रद्धालु जुड़ने पर आपको तुरंत सूचना मिलेगी!', 'This is a test notification. When real devotees connect, you will be notified immediately!'),
          icon: '/favicon.ico',
        });
      } catch (e) {
        console.error(e);
      }
    }
    showToast(tr('🔔 अलर्ट परीक्षण ध्वनि बज गई!', '🔔 Alert test sounded! Temple chime played.'));
  };

  // Dispatch browser notification & sound for new incoming request
  const triggerIncomingAlert = (session: ChatSession) => {
    // 1. Play temple bell chime
    if (!isSoundMuted) {
      playTempleChime();
    }

    // 2. Mobile vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([250, 120, 250, 120, 450]);
      } catch {
        // ignore
      }
    }

    // 3. System browser notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const birthLocation = session.birthPlace ? ` (${session.birthPlace})` : '';
        const notification = new Notification(
          tr(`🔮 नया परामर्श अनुरोध: ${session.customerName}`, `🔮 New Consultation Request: ${session.customerName}`),
          {
            body: tr(
              `श्रद्धालु ${session.customerName}${birthLocation} वैदिक परामर्श के लिए प्रतीक्षा कर रहे हैं!\nविषय: ${session.customerConcern || 'कुंडली एवं ग्रह उपाय'}\nशुल्क: ₹${session.ratePerMin}/मिनट • अभी उत्तर दें!`,
              `Devotee ${session.customerName}${birthLocation} is waiting for Vedic consultation!\nTopic: ${session.customerConcern || 'Kundali & Grah Upay'}\nRate: ₹${session.ratePerMin}/min • Click to respond now!`
            ),
            icon: '/favicon.ico',
            tag: `gaukripa-req-${session.id}`,
            requireInteraction: true,
          }
        );

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      } catch (err) {
        console.warn('Browser notification failed:', err);
      }
    }
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

  // Load history & analytics across all astrologers for unified master view
  const loadHistory = async () => {
    try {
      const data = await api.getAstrologerChatHistory('all');
      setHistorySessions(data.sessions || []);
      setAnalytics(data.analytics || { totalConsultations: 0, todayEarnings: 0, weeklyEarnings: 0, monthlyEarnings: 0 });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Real-time instant BroadcastChannel listener for ALL incoming chats across the platform
  useEffect(() => {
    const unsubscribe = subscribeToAstrologerIncoming('', {
      onIncoming: (session) => {
        setIncomingRequest(session);
        if (session.id !== lastNotifiedIdRef.current) {
          lastNotifiedIdRef.current = session.id;
          triggerIncomingAlert(session);
          showToast(tr(`🔔 ${session.customerName} की ओर से नया परामर्श अनुरोध!`, `🔔 New consultation request from ${session.customerName}!`));
        }
      },
      onMessage: (message, session) => {
        if (activeSession && activeSession.id === session.id) {
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            return [...prev, message];
          });
        }
      }
    });
    return () => unsubscribe();
  }, [activeSession?.id]);

  // Polling for incoming requests across all astrologers as backup
  useEffect(() => {
    if (activeSession) return;

    const interval = setInterval(async () => {
      try {
        const incoming = await api.getIncomingChat('all');
        if (incoming) {
          if (incoming.id !== lastNotifiedIdRef.current) {
            lastNotifiedIdRef.current = incoming.id;
            triggerIncomingAlert(incoming);
            showToast(tr(`🔔 ${incoming.customerName} की ओर से नया परामर्श अनुरोध!`, `🔔 New consultation request from ${incoming.customerName}!`));
          }
          setIncomingRequest(incoming);
        } else {
          lastNotifiedIdRef.current = null;
        }
      } catch (err) {
        console.error('Error polling incoming:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeSession, isSoundMuted]);

  // Repeating alert & title flashing while an incoming request is waiting
  useEffect(() => {
    if (!incomingRequest || activeSession) {
      if (typeof document !== 'undefined') {
        document.title = originalTitleRef.current;
      }
      return;
    }

    let isFlashing = false;
    const titleInterval = setInterval(() => {
      if (typeof document !== 'undefined') {
        isFlashing = !isFlashing;
        document.title = isFlashing
          ? `🔔 (1) NEW CHAT REQUEST! - ${incomingRequest.customerName}`
          : `🔮 Devotee Waiting! - GauKripa`;
      }
    }, 1200);

    // Periodic gentle chime every 8 seconds until accepted or rejected
    const chimeInterval = setInterval(() => {
      if (!isSoundMuted) {
        playTempleChime();
      }
    }, 8000);

    return () => {
      clearInterval(titleInterval);
      clearInterval(chimeInterval);
      if (typeof document !== 'undefined') {
        document.title = originalTitleRef.current;
      }
    };
  }, [incomingRequest, activeSession, isSoundMuted]);

  // Active chat loop: poll messages every 2s, send heartbeat every 5s
  useEffect(() => {
    if (!activeSession) return;

    // Heartbeat every 5s
    const heartbeatTimer = setInterval(async () => {
      try {
        const hb = await api.sendChatHeartbeat(activeSession.id);
        if (hb.status === 'ended') {
          setActiveSession((prev) => (prev ? { ...prev, status: 'ended' } : null));
          showToast(tr('श्रद्धालु का वॉलेट बैलेंस समाप्त होने के कारण परामर्श पूर्ण हुआ।', 'Consultation ended due to devotee wallet depletion.'));
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

    // Real-time broadcast listener for active session messages
    const unsubscribeSession = subscribeToSession(activeSession.id, {
      onMessage: (message) => {
        setChatMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
      },
      onEnd: () => {
        setActiveSession((prev) => (prev ? { ...prev, status: 'ended' } : null));
        showToast(tr('परामर्श सत्र समाप्त हुआ।', 'Consultation session ended.'));
      }
    });

    // Message poll every 1s as reliable backup
    const messagePoll = setInterval(async () => {
      try {
        const res = await api.getChatSession(activeSession.id);
        if (res.session && res.session.messages) {
          setChatMessages((prev) => {
            // Merge newly found messages
            const existingIds = new Set(prev.map((m) => m.id));
            const newOnes = res.session.messages.filter((m) => !existingIds.has(m.id));
            if (newOnes.length > 0) {
              return [...prev, ...newOnes];
            }
            return prev;
          });
          setCustomerWallet(res.customerWalletBalance);
          if (res.session.status === 'ended' && activeSession.status === 'active') {
            setActiveSession(res.session);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }, 1200);

    return () => {
      unsubscribeSession();
      clearInterval(heartbeatTimer);
      clearInterval(messagePoll);
    };
  }, [activeSession?.id]);

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
      showToast(
        tr(
          `स्थिति अपडेट: ${isOnline ? '🟢 ऑनलाइन (परामर्श हेतु उपलब्ध)' : '🔴 ऑफ़लाइन'}`,
          `Status updated to: ${isOnline ? '🟢 ONLINE (Ready for Chats)' : '🔴 OFFLINE'}`
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  // End consultation confirmation state
  const [showEndConfirmModal, setShowEndConfirmModal] = useState<boolean>(false);

  // Accept incoming chat request
  const handleAcceptChat = async () => {
    if (!incomingRequest) return;
    const astroId = incomingRequest.astrologerId || currentAstro?.id || 'astrologer-1';
    try {
      const session = await api.respondChat(incomingRequest.id, astroId, 'accept');
      setActiveSession(session);
      setChatMessages(session.messages || []);
      setIncomingRequest(null);
      showToast(tr(`श्रद्धालु ${session.customerName} से जुड़ गए! लाइव परामर्श सक्रिय है।`, `Connected with Devotee ${session.customerName}! Live consultation active.`));
    } catch (err) {
      console.error(err);
    }
  };

  // Decline incoming chat request
  const handleRejectChat = async () => {
    if (!incomingRequest) return;
    const astroId = incomingRequest.astrologerId || currentAstro?.id || 'astrologer-1';
    try {
      await api.respondChat(incomingRequest.id, astroId, 'reject');
      setIncomingRequest(null);
      showToast(tr('परामर्श अनुरोध अस्वीकार किया गया।', 'Chat request declined.'));
    } catch (err) {
      console.error(err);
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeSession) return;
    const text = inputText.trim();
    setInputText('');
    try {
      const newMsg = await api.sendChatMessage(activeSession.id, {
        sender: 'astrologer',
        senderName: activeSession.astrologerName || currentAstro?.name || 'Vedic Astrologer',
        text,
      });
      setChatMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Fast Vedic Upay Shortcut Send
  const handleSendQuickUpay = async (sevaName: string, upayText: string) => {
    if (!activeSession) return;
    try {
      const newMsg = await api.sendChatMessage(activeSession.id, {
        sender: 'astrologer',
        senderName: activeSession.astrologerName || currentAstro?.name || 'Vedic Astrologer',
        text: upayText,
        suggestedSeva: sevaName,
      });
      setChatMessages((prev) => [...prev, newMsg]);
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger End Consultation Confirmation Popup
  const handleEndChat = () => {
    setShowEndConfirmModal(true);
  };

  // Instant End Consultation Execution
  const confirmAndEndChat = async () => {
    setShowEndConfirmModal(false);
    if (!activeSession) return;
    try {
      const ended = await api.endChat(activeSession.id);
      setActiveSession(ended);
      showToast(tr(`परामर्श समाप्त। कुल अर्जित: ₹${ended.astrologerEarned}`, `Consultation ended. Total Earned: ₹${ended.astrologerEarned}`));
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
          <p className="text-xs text-[#71614e] font-bold">{tr('ज्योतिषाचार्य पोर्टल से जुड़ रहे हैं...', 'Connecting to Astrologer Portal...')}</p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToWebsite}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{tr('वेबसाइट पर वापस जाएं', 'Back to Website')}</span>
            </button>
            <div className="h-6 w-px bg-emerald-800 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xl">🔮</span>
              <h1 className="font-playfair text-base sm:text-lg font-bold text-amber-200">
                {tr('गौकृपा ज्योतिष परामर्श डेस्क', 'GauKripa Astrologer Desk')}
              </h1>
            </div>
          </div>

          {/* Master Consultation Desk Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <div className="inline-flex items-center rounded-full bg-white/10 border border-white/20 p-0.5 text-[11px] font-bold">
              <Languages className="w-3.5 h-3.5 text-amber-300 ml-2 mr-1 hidden sm:block" />
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

            <div className="hidden lg:flex items-center gap-2 bg-emerald-950/90 px-3.5 py-1.5 rounded-full border border-emerald-700/80 text-xs font-bold text-amber-200 shadow-inner">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{tr('मास्टर ज्योतिषाचार्य डेस्क', 'Master Astrologer Desk')}</span>
            </div>

            {/* Browser Notifications Alert Control */}
            {notificationPermission === 'granted' ? (
              <button
                type="button"
                onClick={handleTestAlert}
                className="px-3 py-1.5 rounded-full bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/80 text-xs font-bold text-amber-200 flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                title={tr('ब्राउज़र अलर्ट और ध्वनि सक्रिय हैं। परीक्षण के लिए क्लिक करें!', 'Browser notifications & chime sound active. Click to test alert sound!')}
              >
                <Bell className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden md:inline">{tr('अलर्ट सक्रिय', 'Alerts Active')}</span>
              </button>
            ) : notificationPermission === 'denied' ? (
              <button
                type="button"
                onClick={handleTestAlert}
                className="px-3 py-1.5 rounded-full bg-red-950/80 hover:bg-red-900 border border-red-800 text-xs font-bold text-red-200 flex items-center gap-1.5 cursor-pointer transition-colors"
                title={tr('ब्राउज़र अनुमति अवरुद्ध है। ध्वनि अलर्ट फिर भी बजेगा।', 'Notifications blocked in browser permissions. Chime sound will still ring! Click to test sound.')}
              >
                <BellOff className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden md:inline">{tr('केवल ध्वनि', 'Sound Only')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="px-3.5 py-1.5 rounded-full bg-[#e5a024] hover:bg-[#d4901a] text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95 animate-pulse"
                title={tr('नए परामर्श अनुरोधों के लिए ब्राउज़र अलर्ट सक्षम करें', 'Enable browser notifications for incoming devotee chat requests')}
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>{tr('अलर्ट चालू करें', 'Enable Alerts')}</span>
              </button>
            )}

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
              <span>{currentAstro.isOnline ? tr('ऑनलाइन', 'ONLINE') : tr('ऑफ़लाइन', 'OFFLINE')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">

        {/* Browser Notification Permission Prompt Banner */}
        {notificationPermission === 'default' && !bannerDismissed && (
          <div className="bg-[#fff9ea] border-2 border-[#e5a024] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
                <BellRing className="w-5 h-5 text-amber-700 animate-bounce" />
              </div>
              <div>
                <h4 className="font-playfair text-sm font-bold text-[#1b4b32]">
                  {tr('नए श्रद्धालु परामर्श अनुरोधों के लिए ब्राउज़र अलर्ट चालू करें', 'Enable Browser Notifications for Incoming Devotee Consultations')}
                </h4>
                <p className="text-xs text-[#695844] mt-0.5">
                  {tr(
                    'जैसे ही कोई श्रद्धालु "अभी जुड़ें" पर क्लिक करेगा, आपको तुरंत डेस्कटॉप अलर्ट और घंटी की ध्वनि सुनाई देगी।',
                    'Receive real-time desktop popups and temple bell chimes as soon as a devotee clicks “Connect Now”, even if you are browsing another tab.'
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={requestNotificationPermission}
                className="px-4 py-2 rounded-full bg-[#1b4b32] hover:bg-[#153e29] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Bell className="w-3.5 h-3.5 text-amber-300" />
                <span>{tr('नोटिफिकेशन चालू करें', 'Turn On Notifications')}</span>
              </button>
              <button
                type="button"
                onClick={handleTestAlert}
                className="px-3 py-2 rounded-full bg-white hover:bg-[#faf4e6] text-[#1b4b32] border border-[#ebdcb9] font-bold text-xs transition-colors cursor-pointer"
                title={tr('ध्वनि परीक्षण करें', 'Test audio chime')}
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setBannerDismissed(true)}
                className="p-1.5 text-[#887864] hover:text-[#1b4b32] rounded-full hover:bg-black/5 cursor-pointer"
                title={tr('बैनर हटाएं', 'Dismiss banner')}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Top Master Consultation Desk & Live Status Banner */}
        <div className="bg-[#fffdf9] rounded-2xl border border-[#ebdcb9] p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1b4b32] to-[#0f2d1e] text-amber-300 flex items-center justify-center text-3xl shadow-md border-2 border-amber-300/60 shrink-0">
              🔮
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-playfair text-xl font-bold text-[#1b4b32]">
                  {tr('मास्टर ज्योतिषाचार्य परामर्श डेस्क', 'Master Astrologer Consultation Desk')}
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{tr('सभी ज्योतिषाचार्य सक्रिय', 'All Astrologers Active')}</span>
                </span>
              </div>
              <p className="text-xs text-[#71614e] font-medium mt-0.5">
                {tr(
                  'डॉ. सोफिया शर्मा, आचार्य वेद प्रकाश एवं पंडित राजेश शास्त्री के लिए केंद्रीकृत परामर्श पैनल।',
                  'Centralized consultation panel for Dr. Sophia Sharma, Acharya Ved Prakash, & Pandit Rajesh Shastri.'
                )}
              </p>
              <div className="flex items-center gap-2 text-xs text-[#8b5a0a] font-bold mt-1 flex-wrap">
                <span>{tr('⚡ त्वरित 2-तरफ़ा सिंक', '⚡ Instant 2-Way Sync')}</span>
                <span>•</span>
                <span>{tr('🔔 डेस्कटॉप घंटी अलर्ट', '🔔 Desktop Chime Alerts')}</span>
                <span>•</span>
                <span className="text-emerald-700">{tr('सभी श्रद्धालु चैट अनुरोध सीधे यहाँ प्राप्त होते हैं', 'All incoming devotee chats land directly here')}</span>
              </div>
            </div>
          </div>

          {/* Aggregated Platform Metrics */}
          <div className="grid grid-cols-3 gap-2 w-full md:w-auto text-center">
            <div className="bg-[#fcf8ee] p-2.5 rounded-xl border border-[#ebdcb9]">
              <span className="text-[10px] text-[#786a55] block">{tr('आज की कुल आय', "Today's Total")}</span>
              <span className="text-base font-black text-[#1b4b32]">₹{analytics.todayEarnings}</span>
            </div>
            <div className="bg-[#fcf8ee] p-2.5 rounded-xl border border-[#ebdcb9]">
              <span className="text-[10px] text-[#786a55] block">{tr('कुल परामर्श', 'Total Consults')}</span>
              <span className="text-base font-black text-[#1b4b32]">{analytics.totalConsultations || historySessions.length}</span>
            </div>
            <div className="bg-[#fcf8ee] p-2.5 rounded-xl border border-[#ebdcb9]">
              <span className="text-[10px] text-[#786a55] block">{tr('प्लेटफ़ॉर्म कुल आय', 'Platform Total')}</span>
              <span className="text-base font-black text-emerald-800">₹{analytics.monthlyEarnings}</span>
            </div>
          </div>
        </div>

        {/* INCOMING CHAT REQUEST ALERT (POPPED UP WHEN CUSTOMER CLICKS 'CHAT NOW') */}
        {incomingRequest && !activeSession && (
          <div className="bg-[#fff9ea] border-2 border-[#e5a024] rounded-2xl p-4 sm:p-5 shadow-lg animate-bounce-subtle space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping" />
                <h3 className="font-playfair text-base sm:text-lg font-bold text-[#1b4b32] flex items-center gap-1.5">
                  <Volume2 className="w-5 h-5 text-amber-600 animate-pulse" />
                  <span>{tr('नया लाइव वैदिक परामर्श अनुरोध!', 'Incoming Live Vedic Chat Request!')}</span>
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {notificationPermission === 'granted' && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                    <Bell className="w-3 h-3 text-emerald-700" />
                    <span>{tr('अलर्ट भेजा गया', 'Notification Sent')}</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setIsSoundMuted(!isSoundMuted);
                    showToast(
                      !isSoundMuted
                        ? tr('इस अनुरोध के लिए ध्वनि मूक की गई', 'Sound chime muted for this request')
                        : tr('ध्वनि चालू की गई', 'Sound chime unmuted')
                    );
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                    isSoundMuted
                      ? 'bg-red-50 text-red-700 border-red-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}
                  title={isSoundMuted ? tr('ध्वनि चालू करें', 'Unmute alert sound') : tr('ध्वनि बंद करें', 'Mute alert sound')}
                >
                  {isSoundMuted ? <VolumeX className="w-3.5 h-3.5 text-red-600" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-700" />}
                  <span>{isSoundMuted ? tr('मूक', 'Muted') : tr('ध्वनि बज रही है', 'Sound Ringing')}</span>
                </button>
                <span className="text-xs font-mono font-bold bg-amber-100 text-amber-950 px-2 py-0.5 rounded-md">
                  {incomingRequest.id}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white/90 rounded-xl border border-[#ebdcb9] text-xs">
              <div>
                <span className="text-[#887864] block">{tr('श्रद्धालु का नाम:', 'Devotee Name:')}</span>
                <strong className="text-[#1b4b32] text-sm">{incomingRequest.customerName}</strong>
                <span className="text-[10px] text-[#71614e] block">+91 {incomingRequest.customerPhone}</span>
              </div>
              <div>
                <span className="text-[#887864] block">{tr('संकल्प / मुख्य विषय:', 'Sankalp / Concern:')}</span>
                <span className="text-[#332b21] font-semibold">{incomingRequest.customerConcern}</span>
              </div>
              <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-2 border-t border-[#ebdcb9] pt-2">
                <div><span className="text-[#887864] block">{tr('जन्म तिथि:', 'Date of Birth:')}</span><strong className="text-[#1b4b32]">{incomingRequest.birthDate || tr('उपलब्ध नहीं', 'Not provided')}</strong></div>
                <div><span className="text-[#887864] block">{tr('जन्म समय:', 'Birth Time:')}</span><strong className="text-[#1b4b32]">{incomingRequest.birthTime || tr('उपलब्ध नहीं', 'Not provided')}</strong></div>
                <div><span className="text-[#887864] block">{tr('जन्म स्थान:', 'Birth Place:')}</span><strong className="text-[#1b4b32]">{incomingRequest.birthPlace || tr('उपलब्ध नहीं', 'Not provided')}</strong></div>
              </div>
              <div>
                <span className="text-[#887864] block">{tr('अनुरोधित ज्योतिषाचार्य:', 'Requested Astrologer:')}</span>
                <span className="bg-amber-100 text-amber-950 font-bold px-2 py-0.5 rounded text-xs inline-block mt-0.5 border border-amber-300">
                  {incomingRequest.astrologerName || tr('वैदिक ज्योतिषाचार्य', 'Vedic Astrologer')}
                </span>
              </div>
              <div>
                <span className="text-[#887864] block">{tr('परामर्श शुल्क दर:', 'Billing Rate:')}</span>
                <strong className="text-emerald-800 text-sm">₹{incomingRequest.ratePerMin} / {tr('मिनट', 'min')}</strong>
                {incomingRequest.hasDiscount && (
                  <span className="text-[10px] text-emerald-700 font-bold block">
                    {tr('(50% सेवा छूट सत्यापित)', '(50% Seva Discount Verified)')}
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
                <span>{tr('अनुरोध अस्वीकार करें', 'Decline Request')}</span>
              </button>
              <button
                onClick={handleAcceptChat}
                className="px-6 py-2 rounded-full bg-[#1b4b32] hover:bg-[#153e29] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer animate-pulse"
              >
                <Check className="w-4 h-4 text-amber-300" />
                <span>{tr('परामर्श स्वीकार करें एवं टाइमर शुरू करें', 'Accept Consultation & Start Timer')}</span>
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
            <span>{tr('लाइव चैट डेस्क', 'Live Chat Desk')} {activeSession && tr('(सक्रिय)', '(Active)')}</span>
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
            <span>{tr('परामर्श इतिहास एवं आय', 'Consultation History & Earnings')} ({historySessions.length})</span>
          </button>
        </div>

        {/* CONTENT 1: LIVE CHAT DESK */}
        {activeTab === 'live' && (
          <div className="bg-[#fffdf9] rounded-2xl border border-[#ebdcb9] shadow-xs overflow-hidden flex flex-col h-[600px] relative">
            {/* End Consultation Confirmation Modal */}
            {showEndConfirmModal && (
              <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
                <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border-2 border-red-200 text-center space-y-4 animate-in zoom-in-95">
                  <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-2xl font-bold shadow-inner">
                    ⚠️
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-playfair text-lg font-bold text-[#1b4b32]">
                      {tr('वैदिक परामर्श समाप्त करें?', 'End Vedic Consultation?')}
                    </h4>
                    <p className="text-xs text-[#71614e] leading-relaxed">
                      {tr(
                        'क्या आप वाकई यह परामर्श समाप्त करना चाहते हैं? सत्र तुरंत बंद हो जाएगा और अंतिम आय तय हो जाएगी।',
                        'Are you sure you want to end this consultation? The session will conclude immediately and final earnings will be settled.'
                      )}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEndConfirmModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                    >
                      {tr('रद्द करें', 'Cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={confirmAndEndChat}
                      className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer transition-colors shadow-md active:scale-95"
                    >
                      {tr('हाँ, चैट समाप्त करें', 'Yes, End Chat')}
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                        {tr('विषय:', 'Concern:')} {activeSession.customerConcern}
                      </div>
                    </div>
                  </div>

                  {/* Active Timer & Per-Minute Earnings */}
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-800 text-center">
                      <span className="text-[9px] text-emerald-300 block uppercase font-bold">{tr('व्यतीत समय', 'Elapsed Time')}</span>
                      <div className="text-sm font-mono font-bold text-amber-300 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{formatTimer(activeSession.durationSeconds)}</span>
                      </div>
                    </div>

                    <div className="bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-800 text-center">
                      <span className="text-[9px] text-emerald-300 block uppercase font-bold">{tr('आपकी आय', 'Your Earnings')}</span>
                      <span className="text-sm font-black text-emerald-400">
                        ₹{activeSession.astrologerEarned}
                      </span>
                    </div>

                    <div className="bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-800 text-center hidden sm:block">
                      <span className="text-[9px] text-emerald-300 block uppercase font-bold">{tr('श्रद्धालु वॉलेट', 'Devotee Wallet')}</span>
                      <span className="text-sm font-bold text-amber-200">
                        ₹{customerWallet}
                      </span>
                    </div>

                    <button
                      onClick={handleEndChat}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <PhoneOff className="w-3.5 h-3.5" />
                      <span>{tr('चैट समाप्त करें', 'End Chat')}</span>
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
                              <span>{tr('सुझाई गई वैदिक सेवा व्यवस्था:', 'Prescribed Vedic Remedy:')} {m.suggestedSeva}</span>
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
                  <span className="text-[11px] font-bold text-[#8b6f38] shrink-0">{tr('त्वरित उपाय सुझाव:', 'Quick Prescribe:')}</span>
                  {[
                    {
                      seva: tr('गौ चारा सेवा (हरा चारा)', 'Gau Chara Seva'),
                      text: tr(
                        'मैं रविवार प्रातः गौ चारा सेवा (5 किग्रा ताज़ा हरा चारा) कराने की सलाह देता हूँ। इससे सूर्य देव प्रसन्न होते हैं और करियर की बाधाएं दूर होती हैं।',
                        'I prescribe Gau Chara Seva (5 kg fresh green grass) on Sunday morning. This pleases Lord Surya and resolves professional career delays.'
                      ),
                    },
                    {
                      seva: tr('गौ रोटी सेवा (ताज़ी रोटी)', 'Gau Roti Seva'),
                      text: tr(
                        'देशी घी लगी ताज़ी रोटियों की गौ रोटी सेवा करने से चंद्र दोष शांत होता है तथा मानसिक शांति व सुखद निद्रा प्राप्त होती है।',
                        'Offering warm rotis prepared with desi ghee (Gau Roti Seva) calms Chandra dosha and brings deep mental peace and restful sleep.'
                      ),
                    },
                    {
                      seva: tr('गौ गुड़-चना आहार सेवा', 'Gau Gud-Chana Seva'),
                      text: tr(
                        'मांगलिक दोष की शांति और आर्थिक बाधाएं दूर करने के लिए मंगलवार प्रातः गौ गुड़-चना आहार व्यवस्था करवाएं।',
                        'To pacify fiery Manglik dosha and remove debt hurdles, perform Gau Gud-Chana Seva on Tuesday morning.'
                      ),
                    },
                    {
                      seva: tr('चींटी आटा व्यवस्था', 'Cheenti Aata Seva'),
                      text: tr(
                        'पीपल के वृक्ष के नीचे चींटियों के लिए मीठा आटा/कसार व्यवस्था करवाने से राहु-केतु जनित अस्थिरता संतुलित होती है।',
                        'Offering sweet kasar powder to ants under a peepal tree balances unexpected Rahu-Ketu planetary disturbances.'
                      ),
                    },
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
                    placeholder={tr(
                      `${currentAstro.name} के रूप में उत्तर दें... (जैसे उपाय व मार्गदर्शन साझा करें)`,
                      `Reply as ${currentAstro.name}... (e.g. Share birth time, recommend upay)`
                    )}
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
                    {tr('मास्टर ज्योतिषाचार्य लाइव परामर्श डेस्क', 'Master Astrologer Live Consultation Desk')}
                  </h3>
                  <p className="text-xs text-[#71614e] max-w-md mx-auto mt-1">
                    {tr(
                      'अपनी स्थिति ONLINE रखें। जब भी कोई श्रद्धालु वेबसाइट पर किसी भी ज्योतिषाचार्य से "अभी जुड़ें" पर क्लिक करेगा, उनका अनुरोध सीधे इस स्क्रीन पर आएगा!',
                      'Keep your status ONLINE. When any devotee clicks “Connect Now” with any astrologer on the website, their request will appear directly on this screen!'
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#8b5a0a] bg-[#fff9ea] px-4 py-2 rounded-xl border border-[#ebdcb9]">
                  <Radio className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>{tr('सभी ज्योतिषाचार्यों के लिए आने वाले परामर्श अनुरोधों की प्रतीक्षा की जा रही है...', 'Listening for all incoming devotee chat requests across all astrologers...')}</span>
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
                <span className="text-xs text-[#786a55]">{tr('आज की कुल आय', "Today's Total Earnings")}</span>
                <div className="text-2xl font-black text-[#1b4b32]">₹{analytics.todayEarnings}</div>
                <span className="text-[10px] text-emerald-700 font-bold">{tr('ज्योतिषाचार्य बैंक खाते में समायोजित', 'Settled to Astrologer Bank Account')}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#fffdf9] border border-[#ebdcb9] space-y-1">
                <span className="text-xs text-[#786a55]">{tr('साप्ताहिक परामर्श आय', 'Weekly Consultation Earnings')}</span>
                <div className="text-2xl font-black text-[#1b4b32]">₹{analytics.weeklyEarnings}</div>
                <span className="text-[10px] text-emerald-700 font-bold">{tr('रियल-टाइम में अपडेट', 'Updated in real-time')}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#fffdf9] border border-[#ebdcb9] space-y-1">
                <span className="text-xs text-[#786a55]">{tr('प्लेटफ़ॉर्म कुल आय', 'Platform Total Earnings')}</span>
                <div className="text-2xl font-black text-emerald-800">₹{analytics.monthlyEarnings}</div>
                <span className="text-[10px] text-emerald-700 font-bold">{tr('सभी परामर्श सत्र', 'All Consultations')}</span>
              </div>
            </div>

            <div className="bg-[#fffdf9] rounded-2xl border border-[#ebdcb9] overflow-hidden">
              <div className="p-4 border-b border-[#ebdcb9] flex items-center justify-between">
                <h3 className="font-playfair text-base font-bold text-[#1b4b32]">
                  {tr('पिछले श्रद्धालु परामर्श एवं विवरण', 'Past Customer Chats & Transcripts')}
                </h3>
                <span className="text-xs text-[#71614e] font-semibold">
                  {historySessions.length} {tr('पूर्ण सत्र', 'Completed Sessions')}
                </span>
              </div>

              {historySessions.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#71614e]">
                  {tr(
                    'अभी तक कोई पूर्व परामर्श रिकॉर्ड नहीं है। सभी ज्योतिषाचार्यों के पूर्ण परामर्श सत्र यहाँ स्वतः दिखाई देंगे।',
                    'No previous consultation records yet. Completed chats across all astrologers will appear here automatically.'
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#fbf4e2] text-[#483c2e] font-bold border-b border-[#ebdcb9]">
                      <tr>
                        <th className="p-3">{tr('सत्र आईडी', 'Session ID')}</th>
                        <th className="p-3">{tr('ज्योतिषाचार्य', 'Astrologer')}</th>
                        <th className="p-3">{tr('श्रद्धालु', 'Devotee')}</th>
                        <th className="p-3">{tr('विषय', 'Concern')}</th>
                        <th className="p-3">{tr('अवधि', 'Duration')}</th>
                        <th className="p-3">{tr('दर', 'Rate')}</th>
                        <th className="p-3">{tr('आय', 'Earnings')}</th>
                        <th className="p-3">{tr('तिथि', 'Date')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f2e5cc]">
                      {historySessions.map((s) => (
                        <tr key={s.id} className="hover:bg-[#fcf9f2]">
                          <td className="p-3 font-mono font-bold text-[#8b6f38]">{s.id}</td>
                          <td className="p-3 font-semibold text-[#1b4b32] whitespace-nowrap">
                            {s.astrologerName || tr('वैदिक ज्योतिषाचार्य', 'Vedic Astrologer')}
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-[#1b4b32]">{s.customerName}</div>
                            <div className="text-[10px] text-[#71614e]">+91 {s.customerPhone}</div>
                          </td>
                          <td className="p-3 max-w-xs truncate">{s.customerConcern}</td>
                          <td className="p-3 font-mono">{formatTimer(s.durationSeconds)}</td>
                          <td className="p-3">₹{s.ratePerMin}/{tr('मिनट', 'min')} {s.hasDiscount && tr('(50% सेवा छूट)', '(50% Seva Off)')}</td>
                          <td className="p-3 font-bold text-emerald-800">₹{s.astrologerEarned}</td>
                          <td className="p-3 text-[11px] text-[#786a55]">
                            {s.endedAt ? new Date(s.endedAt).toLocaleDateString() : tr('आज', 'Today')}
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
