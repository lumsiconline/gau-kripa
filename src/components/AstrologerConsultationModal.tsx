import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  Send,
  Sparkles,
  Star,
  ShieldCheck,
  CheckCheck,
  Clock,
  Wallet,
  PlusCircle,
  AlertCircle,
  ArrowRight,
  Smile,
  Paperclip,
  FileText,
  User,
  Calendar,
  MapPin,
  HelpCircle
} from 'lucide-react';
import { Astrologer } from '../data/sevaData';
import { ImageCrop } from './ImageCrop';
import { api, normalizePhone, ChatSession, ChatMessage } from '../services/api';
import { subscribeToSession } from '../services/chatSync';
import { useLanguage } from '../i18n/LanguageContext';

// Merge optimistic, broadcast and polled messages without rendering the same send twice.
const mergeChatMessages = (current: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] => {
  const merged = [...current];
  for (const message of incoming) {
    const duplicateIndex = merged.findIndex((existing) =>
      existing.id === message.id ||
      (existing.sender === message.sender &&
        existing.text === message.text &&
        existing.senderName === message.senderName &&
        (existing.id.startsWith('msg-') || existing.timestamp === message.timestamp))
    );
    if (duplicateIndex >= 0) {
      if (merged[duplicateIndex].id.startsWith('msg-') && !message.id.startsWith('msg-')) {
        merged[duplicateIndex] = message;
      }
    } else {
      merged.push(message);
    }
  }
  return merged;
};

interface AstrologerConsultationModalProps {
  astrologer: Astrologer;
  initialMode?: 'chat' | 'call';
  isOpen: boolean;
  onClose: () => void;
  hasDiscount?: boolean;
  customerPhone?: string;
  customerName?: string;
  onBookPrescribedSeva?: (sevaTitle: string) => void;
  initialConcern?: string;
}

export const AstrologerConsultationModal: React.FC<AstrologerConsultationModalProps> = ({
  astrologer,
  initialMode = 'chat',
  isOpen,
  onClose,
  hasDiscount: _hasDiscount = false,
  customerPhone = '9876543210',
  customerName = 'हर्ष भारद्वाज',
  onBookPrescribedSeva,
  initialConcern,
}) => {
  const { tr } = useLanguage();
  const [mode, setMode] = useState<'chat' | 'call'>(initialMode);

  // States: 'idle' (birth details form) -> 'active' (WhatsApp chat fitted to screen) -> 'ended'
  const [chatStatus, setChatStatus] = useState<'idle' | 'active' | 'ended'>('idle');
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [concern, setConcern] = useState<string>(
    initialConcern || tr('वैदिक ज्योतिष एवं ग्रह शांति मार्गदर्शन', 'Vedic Jyotish aur Grah Shanti Margdarshan')
  );
  const [formStep, setFormStep] = useState(0);

  // Birth Details state
  const [birthDetails, setBirthDetails] = useState({
    name: customerName || '',
    birthDate: '1998-05-15',
    birthPlace: tr('नई दिल्ली, भारत', 'Nayi Dilli, Bharat'),
  });

  // Dedicated 12-hour Time state with explicit AM / PM selector
  const [timeHour, setTimeHour] = useState<string>('09');
  const [timeMinute, setTimeMinute] = useState<string>('20');
  const [timePeriod, setTimePeriod] = useState<'AM' | 'PM'>('AM');

  // Wallet & simulation state
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [isTopupOpen, setIsTopupOpen] = useState<boolean>(false);
  const [topupLoading, setTopupLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Call state
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [_callSeconds, setCallSeconds] = useState<number>(0);
  const [showEndConfirm, setShowEndConfirm] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendingMessageRef = useRef(false);

  // Formatted birth time with AM/PM
  const formattedBirthTime = `${timeHour.padStart(2, '0')}:${timeMinute.padStart(2, '0')} ${timePeriod}`;

  // Reset or initialize on open
  useEffect(() => {
    if (!isOpen) return;

    setMode(initialMode === 'call' ? 'chat' : initialMode);
    setChatStatus('idle');
    setFormStep(0);
    setBirthDetails({
      name: customerName || '',
      birthDate: '1998-05-15',
      birthPlace: tr('नई दिल्ली, भारत', 'Nayi Dilli, Bharat'),
    });
    setTimeHour('09');
    setTimeMinute('20');
    setTimePeriod('AM');
    setSession(null);
    setMessages([]);
    setErrorMessage(initialMode === 'call' ? tr('वॉइस कॉल सेवा अभी कॉन्फ़िगर नहीं है। कृपया लाइव चैट का उपयोग करें।', 'Voice call seva abhi shuru nahi hai. Kripaya Live Vedic Chat ka upyog karein.') : null);
    setConcern(initialConcern || tr('वैदिक ज्योतिष एवं ग्रह शांति मार्गदर्शन', 'Vedic Jyotish aur Grah Shanti Margdarshan'));

    // Fetch user wallet
    const cleanPhone = normalizePhone(customerPhone);
    api.getWallet(cleanPhone)
      .then((w) => setWalletBalance(w.balance))
      .catch(console.error);
  }, [isOpen, customerPhone, customerName, initialConcern, initialMode]);

  // Real-time listener for incoming messages from the astrologer + polling fallback
  useEffect(() => {
    if (!session || chatStatus !== 'active') return;

    const unsubscribe = subscribeToSession(session.id, {
      onMessage: (message) => {
        setMessages((prev) => mergeChatMessages(prev, [message]));
      },
      onEnd: () => {
        setChatStatus('ended');
      }
    });

    const pollInterval = setInterval(async () => {
      try {
        const res = await api.getChatSession(session.id);
        if (res.session && res.session.messages) {
          setSession(res.session);
          setMessages((prev) => mergeChatMessages(prev, res.session.messages));
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

  // Call timer
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
    const topicText = concern.trim() || tr('जन्म कुंडली एवं ग्रह शांति मार्गदर्शन', 'Kundali aur Grah Upay margdarshan');

    // 1. Structured intake card message sent automatically from devotee's side
    const devoteeIntakeText = tr(
      `📋 VEDIC KUNDALI INTAKE DETAILS:\n• नाम: ${birthDetails.name.trim()}\n• जन्म तिथि: ${birthDetails.birthDate}\n• जन्म समय: ${formattedBirthTime}\n• जन्म स्थान: ${birthDetails.birthPlace.trim()}\n• परामर्श विषय: ${topicText}\n\nप्रणाम गुरुजी! यह मेरा जन्म विवरण है। कृपया मेरी कुंडली का विश्लेषण कर उचित मार्गदर्शन प्रदान करें।`,
      `📋 VEDIC KUNDALI INTAKE DETAILS:\n• Naam: ${birthDetails.name.trim()}\n• Janam Tarikh: ${birthDetails.birthDate}\n• Janam Samay: ${formattedBirthTime}\n• Janam Sthan: ${birthDetails.birthPlace.trim()}\n• Paramarsh Vishay: ${topicText}\n\nPranam Guruji! Yeh mera poora janam vivaran hai. Kripaya meri kundali dekhkar sahi margdarshan dein.`
    );

    const initialDevoteeMsg: ChatMessage = {
      id: `msg-intake-${Date.now()}`,
      sender: 'customer',
      senderName: birthDetails.name.trim() || tr('भक्त', 'Bhakt'),
      text: devoteeIntakeText,
      timestamp: currentTimeString,
    };

    // 2. Initial warm response from the Astrologer
    const initialAstroMsg: ChatMessage = {
      id: `msg-welcome-${Date.now() + 1}`,
      sender: 'astrologer',
      senderName: astrologer.name,
      text: tr(
        `प्रणाम ${birthDetails.name.trim()} जी! 🙏 हर हर महादेव। मुझे आपका जन्म विवरण (तिथि: ${birthDetails.birthDate}, समय: ${formattedBirthTime}, स्थान: ${birthDetails.birthPlace.trim()}) प्राप्त हो गया है।\n\nमैं आपकी लग्न कुंडली, ग्रह स्थिति और वर्तमान महादशा का अध्ययन कर रहा/रही हूँ (${topicText})।\n\nकृपया आप अपना विशेष प्रश्न यहाँ पूछें।`,
        `Pranam ${birthDetails.name.trim()} ji! 🙏 Har Har Mahadev. Mujhe aapka poora janam vivaran (Tarikh: ${birthDetails.birthDate}, Samay: ${formattedBirthTime}, Sthan: ${birthDetails.birthPlace.trim()}) mil gaya hai.\n\nMain aapki Lagna Kundali, grah sthiti aur vartaman Mahadasha ka adhyayan kar raha/rahi hoon (${topicText}).\n\nKripaya apna vishesh prashn yahan poochhein.`
      ),
      timestamp: currentTimeString,
    };

    const combinedMessages = [initialDevoteeMsg, initialAstroMsg];
    setMessages(combinedMessages);
    setChatStatus('active');

    try {
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
    const text = inputText.trim();
    if (!text || sendingMessageRef.current || !session) return;

    sendingMessageRef.current = true;
    setInputText('');

    const clientMessageId = `client-${session.id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const optimisticMessage: ChatMessage = {
      id: clientMessageId,
      sender: 'customer',
      senderName: birthDetails.name || customerName || tr('भक्त', 'Bhakt'),
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    try {
      const sent = await api.sendChatMessage(session.id, {
        sender: 'customer',
        senderName: birthDetails.name || customerName || tr('भक्त', 'Bhakt'),
        text,
        clientMessageId,
      });
      setMessages((prev) => mergeChatMessages(prev, [sent]));
    } catch (err) {
      console.error('Unable to send chat message:', err);
      setMessages((prev) => prev.filter((message) => message.id !== clientMessageId));
      setInputText(text);
      setErrorMessage(tr('संदेश भेजा नहीं जा सका। कृपया पुनः प्रयास करें।', 'Sandesh bheja nahi ja saka. Kripaya dobara koshish karein.'));
    } finally {
      sendingMessageRef.current = false;
    }
  };

  const handleEndChat = () => {
    setShowEndConfirm(true);
  };

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

  const handleTopup = async (amt: number) => {
    const cleanPhone = normalizePhone(customerPhone, '');
    if (cleanPhone.length < 10) {
      setErrorMessage(tr('रिचार्ज करने के लिए वैध 10-अंकीय मोबाइल नंबर आवश्यक है।', 'Recharge ke liye sahi 10-digit mobile number zaroori hai.'));
      return;
    }

    setErrorMessage(null);
    setTopupLoading(true);
    try {
      const order = await api.createWalletOrder(cleanPhone, amt, customerName || tr('भक्त', 'Bhakt'));
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(tr('Razorpay चेकआउट लोड नहीं हो सका।', 'Surakshit Razorpay Checkout load nahi ho saka.')));
          document.body.appendChild(script);
        });
      }
      const RazorpayCheckout = (window as any).Razorpay;
      if (!RazorpayCheckout) {
        throw new Error(tr('Razorpay चेकआउट उपलब्ध नहीं है।', 'Razorpay Checkout abhi uplabdh nahi hai.'));
      }
      const keyId = order.key_id || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error(tr('Razorpay LIVE कुंजी कॉन्फ़िगर नहीं है।', 'Razorpay LIVE Key ID configure nahi hai.'));
      }

      const checkoutOptions: any = {
        key: keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'GauKripa',
        description: tr('गौकृपा सुरक्षित वॉलेट रिचार्ज', 'GauKripa Surakshit Wallet Recharge'),
        prefill: { name: customerName || tr('भक्त', 'Bhakt'), contact: cleanPhone },
        notes: { purpose: 'GauKripa wallet recharge', phone: cleanPhone },
        theme: { color: '#1b4b32' },
        handler: async (response: any) => {
          try {
            await api.verifyWalletPayment({
              order_id: response.razorpay_order_id || order.order_id || '',
              payment_id: response.razorpay_payment_id,
              signature: response.razorpay_signature || '',
              phone: cleanPhone,
              amount: amt
            });
            const updated = await api.getWallet(cleanPhone);
            setWalletBalance(updated.balance);
            setIsTopupOpen(false);
            setErrorMessage(null);
          } catch (verifyErr: any) {
            setErrorMessage(verifyErr?.message || tr('Razorpay भुगतान सत्यापन असफल रहा।', 'Razorpay payment verification asafal raha.'));
          } finally {
            setTopupLoading(false);
          }
        },
        modal: {
          ondismiss: () => setTopupLoading(false),
          escape: true,
          confirm_close: true
        }
      };

      if (order.order_id) {
        checkoutOptions.order_id = order.order_id;
      }

      const checkout = new RazorpayCheckout(checkoutOptions);
      checkout.on('payment.failed', (resp: any) => {
        setErrorMessage(resp?.error?.description || tr('Razorpay भुगतान असफल रहा।', 'Razorpay payment fail ho gaya.'));
        setTopupLoading(false);
      });
      setTopupLoading(false);
      checkout.open();
    } catch (err: any) {
      setErrorMessage(err?.message || tr('वॉलेट रिचार्ज प्रारंभ नहीं हो सका।', 'Wallet recharge shuru nahi ho saka.'));
      setTopupLoading(false);
    }
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
                  title={tr('विवरण पृष्ठ पर वापस जाएँ', 'Vivaran par wapas jayein')}
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
                    <span>{tr('ऑनलाइन • वैदिक ज्योतिषाचार्य', 'Online • Vedic Jyotishacharya')}</span>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setErrorMessage(tr('वॉइस कॉल सेवा अभी कॉन्फ़िगर नहीं है। कृपया लाइव चैट का उपयोग करें।', 'Voice call seva abhi shuru nahi hai. Kripaya Live Vedic Chat ka upyog karein.'))}
                  disabled
                  className="p-2 rounded-full text-white/40 cursor-not-allowed"
                  title={tr('वॉइस कॉल सेटअप लंबित', 'Voice call setup baki hai')}
                >
                  <Phone className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleEndChat}
                  className="px-2.5 py-1 rounded-full bg-red-600/90 hover:bg-red-700 text-white text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
                  title={tr('चैट समाप्त करें', 'Chat Band Karein')}
                >
                  {tr('चैट समाप्त करें', 'Chat Band Karein')}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                  title={tr('बंद करें', 'Band Karein')}
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
                  {tr(
                    `🔒 आपकी बातचीत पूर्णतः गोपनीय एवं सुरक्षित है। आपका जन्म विवरण सीधे ${astrologer.name} को भेजा गया है।`,
                    `🔒 Aapki baatcheet poori tarah gopniya aur surakshit hai. Aapka janam vivaran seedhe ${astrologer.name} ko bhej diya gaya hai.`
                  )}
                </div>
              </div>

              {/* Centered Date Badge */}
              <div className="flex justify-center my-1">
                <span className="bg-[#ffffff]/90 text-[#54656f] text-[10px] font-bold px-3 py-0.5 rounded-md shadow-2xs uppercase tracking-wider">
                  {tr('आज', 'AAJ')}
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
                      {/* AUTOMATED INTAKE FORM CARD */}
                      {isIntakeMessage ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 pb-1.5 border-b border-emerald-300/60 font-bold text-[#1b4b32]">
                            <FileText className="w-4 h-4 text-emerald-700" />
                            <span>{tr('वैदिक कुंडली विवरण पत्र', 'Vedic Kundali Vivaran Patra')}</span>
                          </div>

                          <div className="bg-white/80 rounded-xl p-2.5 space-y-1.5 border border-emerald-200/60 text-[11px] text-[#2c3e2e]">
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="font-semibold text-slate-800">{tr('नाम:', 'Naam:')}</span>
                              <span className="font-bold text-[#1b4b32]">{birthDetails.name || tr('भक्त', 'Bhakt')}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="font-semibold text-slate-800">{tr('जन्म तिथि:', 'Janam Tarikh:')}</span>
                              <span className="font-medium text-slate-900">{birthDetails.birthDate}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="font-semibold text-slate-800">{tr('जन्म समय:', 'Janam Samay:')}</span>
                              <span className="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded font-mono">
                                {formattedBirthTime}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                              <span className="font-semibold text-slate-800">{tr('जन्म स्थान:', 'Janam Sthan:')}</span>
                              <span className="font-medium text-slate-900">{birthDetails.birthPlace}</span>
                            </div>

                            <div className="flex items-start gap-1.5 pt-1 border-t border-emerald-100">
                              <HelpCircle className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold text-slate-800">{tr('परामर्श विषय:', 'Paramarsh Vishay:')}</span>
                                <p className="text-[#1b4b32] font-medium">
                                  {concern || tr('कुंडली विश्लेषण व ग्रह उपाय', 'Kundali vishleshan aur Grah Upay')}
                                </p>
                              </div>
                            </div>
                          </div>

                          <p className="text-xs text-[#1e3a24] font-medium pt-0.5">
                            {tr(
                              'प्रणाम गुरुजी! यह मेरा संपूर्ण जन्म विवरण है। कृपया मेरी कुंडली का विश्लेषण कर उचित मार्गदर्शन दें।',
                              'Pranam Guruji! Yeh mera poora janam vivaran hai. Kripaya meri kundali dekhkar sahi margdarshan dein.'
                            )}
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
                            <span>{tr('सुझाई गई गौ-आहार उपाय सेवा:', 'Sujhayi Gayi Gau-Aahar Upay Seva:')}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              if (onBookPrescribedSeva) onBookPrescribedSeva(m.suggestedSeva!);
                            }}
                            className="w-full py-1.5 px-3 rounded-xl bg-[#e5a024] hover:bg-[#d8941d] text-slate-950 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
                          >
                            <span>{tr(`${m.suggestedSeva} अभी बुक करें`, `${m.suggestedSeva} Abhi Book Karein`)}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* WhatsApp Time & Checkmark footer */}
                      <div className="flex items-center justify-end gap-1 text-[10px] text-[#667781] mt-1 select-none">
                        <span>{m.timestamp || tr('अभी', 'Abhi')}</span>
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
                      {tr('वैदिक परामर्श समाप्त करें?', 'Vedic Paramarsh Samapt Karein?')}
                    </h4>
                    <p className="text-xs text-[#71614e] leading-relaxed">
                      {tr(
                        'क्या आप वाकई यह परामर्श सत्र समाप्त करना चाहते हैं? सत्र तुरंत समाप्त हो जाएगा।',
                        'Kya aap sach mein yeh paramarsh band karna chahte hain? Yeh chat turant samapt ho jayegi.'
                      )}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEndConfirm(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
                    >
                      {tr('रद्द करें', 'Radd Karein')}
                    </button>
                    <button
                      type="button"
                      onClick={confirmAndEndChat}
                      className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer transition-colors shadow-md active:scale-95"
                    >
                      {tr('हाँ, चैट समाप्त करें', 'Haan, Chat Band Karein')}
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
                  <span className="font-semibold">
                    {tr('यह परामर्श सत्र समाप्त हो गया है। हर हर महादेव!', 'Yeh paramarsh satra samapt ho gaya hai. Har Har Mahadev!')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full bg-[#075e54] hover:bg-[#054c44] text-white font-bold text-xs cursor-pointer shadow-xs transition-colors shrink-0"
                >
                  {tr('विंडो बंद करें', 'Band Karein')}
                </button>
              </div>
            ) : (
              <div className="bg-[#f0f2f5] px-3 py-2.5 border-t border-[#d1d7db] flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  className="p-1.5 text-[#54656f] hover:text-[#111b21] transition-colors cursor-pointer"
                  title={tr('इमोजी', 'Emoji')}
                >
                  <Smile className="w-5 h-5" />
                </button>

                <button
                  type="button"
                  className="p-1.5 text-[#54656f] hover:text-[#111b21] transition-colors cursor-pointer"
                  title={tr('संलग्न करें', 'File Jodein')}
                >
                  <Paperclip className="w-5 h-5" />
                </button>

                <form onSubmit={handleSendMessage} className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={tr('गुरुजी को संदेश लिखें...', 'Guruji ko sandesh likhein...')}
                    className="flex-1 px-4 py-2.5 rounded-full bg-white text-xs sm:text-sm text-[#111b21] placeholder-[#667781] border border-white focus:outline-hidden shadow-2xs"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || !session}
                    className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center transition-all cursor-pointer shadow-xs disabled:opacity-40 shrink-0 active:scale-95"
                    title={tr('संदेश भेजें', 'Sandesh Bhejein')}
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </form>
              </div>
            )}

          </div>
        ) : (
          /* ============================================================
             CASE B: BIRTH DETAILS INTAKE FORM
             ============================================================ */
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#faf5e8]">
            
            {/* Modal Top Bar */}
            <div className="bg-gradient-to-r from-[#173e2a] via-[#1b4b32] to-[#173e2a] text-white px-5 py-4 border-b border-[#296344] shrink-0 shadow-xs">
              <div className="flex items-center justify-between gap-3">
                
                {/* Astrologer Profile & Credentials */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-13 h-13 rounded-full overflow-hidden border-2 border-amber-300/90 shadow-md bg-amber-50">
                      <ImageCrop cropKey={astrologer.cropKey} className="w-full h-full object-cover" alt={astrologer.name} />
                    </div>
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
                        {tr('ऑनलाइन', 'ONLINE')}
                      </span>
                    </div>

                    <div className="text-xs text-emerald-100/90 font-medium truncate mt-0.5">
                      {astrologer.title} • {astrologer.experience}
                    </div>

                    {/* Vedic rating */}
                    <div className="flex items-center gap-2 text-[11px] text-amber-300/95 font-medium mt-0.5">
                      <span className="flex items-center text-amber-300 font-semibold">
                        <Star className="w-3 h-3 fill-amber-300 text-amber-300 mr-1" />
                        {astrologer.rating} {tr('वैदिक रेटिंग', 'Vedic Rating')}
                      </span>
                      <span className="text-emerald-400/60">•</span>
                      <span className="text-emerald-200 font-medium">
                        {tr('गोपनीय लाइव परामर्श', 'Gopniya Live Paramarsh')}
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
                    title={tr('भक्त वॉलेट शेष (रिचार्ज के लिए क्लिक करें)', 'Bhakt Wallet Balance (Recharge ke liye click karein)')}
                  >
                    <Wallet className="w-3.5 h-3.5 text-amber-400" />
                    <span>₹{walletBalance}</span>
                    <PlusCircle className="w-3 h-3 text-emerald-400" />
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                    title={tr('बंद करें', 'Band Karein')}
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
                  <span>{tr('लाइव वैदिक चैट', 'Live Vedic Chat')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setErrorMessage(tr('वॉइस कॉल सेवा अभी कॉन्फ़िगर नहीं है। कृपया लाइव चैट का उपयोग करें।', 'Voice call seva abhi shuru nahi hai. Kripaya Live Vedic Chat ka upyog karein.'))}
                  disabled
                  className="py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-slate-400/30 text-slate-500 cursor-not-allowed"
                  title={tr('वॉइस कॉल सेटअप लंबित', 'Voice call setup baki hai')}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{tr('कॉल सेटअप लंबित', 'Call Setup Baki Hai')}</span>
                </button>
              </div>
            </div>

            {/* Top-Up Quick Drawer */}
            {isTopupOpen && (
              <div className="p-3 bg-[#fff9ea] border-b border-[#ebdcb9] flex items-center justify-between gap-2 text-xs animate-in slide-in-from-top-2">
                <span className="font-bold text-[#1b4b32]">{tr('वॉलेट रिचार्ज करें:', 'Wallet Recharge Karein:')}</span>
                <div className="flex items-center gap-2">
                  {[100, 250, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      disabled={topupLoading}
                      onClick={() => handleTopup(amt)}
                      className="px-2.5 py-1 rounded-lg bg-[#1b4b32] text-white font-bold hover:bg-[#153e29] cursor-pointer disabled:opacity-50"
                    >
                      +₹{amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsTopupOpen(false)}
                    className="text-xs text-[#71614e] underline ml-1 cursor-pointer"
                  >
                    {tr('बंद करें', 'Band Karein')}
                  </button>
                </div>
              </div>
            )}

            {/* Form Body (Step 1 to 4) */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              
              {/* Vedic Reassurance Banner */}
              <div className="p-3.5 rounded-2xl bg-[#f5ede0] border border-[#ebdcb9] text-xs text-[#3a2e22] flex items-center gap-2.5 shadow-2xs">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <strong className="text-[#1b4b32] font-playfair text-sm block">
                    {tr('प्रत्यक्ष वैदिक कुंडली एवं ग्रह परामर्श', 'Pratyaksh Vedic Kundali aur Grah Paramarsh')}
                  </strong>
                  <p className="text-[11px] text-[#71614e]">
                    {tr(
                      `नीचे अपना जन्म विवरण दर्ज करें। आपकी कुंडली तुरंत तैयार कर लाइव परामर्श हेतु ${astrologer.name} को भेजी जाएगी।`,
                      `Neeche apna janam vivaran darj karein. Aapki kundali turant taiyar karke live paramarsh ke liye ${astrologer.name} ko bheji jayegi.`
                    )}
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
                  <span className="text-xs font-bold text-[#1b4b32]">
                    {tr('आपका जन्म विवरण', 'Aapka Janam Vivaran')}
                  </span>
                  <span className="text-[11px] font-semibold text-[#887864]">
                    {tr(`चरण ${formStep + 1} / 4`, `Charan ${formStep + 1} / 4`)}
                  </span>
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
                    {tr('आपका पूरा नाम क्या है?', 'Aapka poora naam kya hai?')}
                    <input
                      autoFocus
                      type="text"
                      value={birthDetails.name}
                      onChange={(e) => setBirthDetails({ ...birthDetails, name: e.target.value })}
                      placeholder={tr('अपना पूरा नाम लिखें', 'Apna poora naam likhein')}
                      className="mt-2 w-full px-3.5 py-3 rounded-xl border border-[#ebdcb9] bg-white text-sm font-medium focus:outline-hidden focus:border-[#1b4b32]"
                    />
                  </label>
                )}

                {/* STEP 2: DATE OF BIRTH */}
                {formStep === 1 && (
                  <label className="block text-xs font-bold text-[#453728]">
                    {tr('आपकी जन्म तिथि क्या है?', 'Aapki janam tarikh kya hai?')}
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
                      {tr('आपका सटीक जन्म समय क्या है?', 'Aapka sahi janam samay kya hai?')}
                    </label>

                    <div className="mt-2 p-3.5 rounded-2xl bg-white border border-[#ebdcb9] shadow-2xs space-y-3">
                      
                      {/* Hours, Minutes, and AM/PM Selector */}
                      <div className="grid grid-cols-3 gap-2 items-center">
                        
                        {/* Hour Selector */}
                        <div>
                          <span className="block text-[11px] font-bold text-[#71614e] mb-1">
                            {tr('घंटा (1-12)', 'Ghanta (1-12)')}
                          </span>
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
                          <span className="block text-[11px] font-bold text-[#71614e] mb-1">
                            {tr('मिनट (00-59)', 'Minute (00-59)')}
                          </span>
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

                        {/* AM / PM SECTION */}
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
                        <span className="text-[#71614e]">{tr('चयनित जन्म समय:', 'Chuna Gaya Janam Samay:')}</span>
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
                    {tr('आपका जन्म स्थान (शहर/जिला) क्या है?', 'Aapka janam sthan (Shahar/Jila) kya hai?')}
                    <input
                      autoFocus
                      type="text"
                      value={birthDetails.birthPlace}
                      onChange={(e) => setBirthDetails({ ...birthDetails, birthPlace: e.target.value })}
                      placeholder={tr('जैसे: नई दिल्ली, वाराणसी, जयपुर, मुंबई...', 'Jaise: Nayi Dilli, Varanasi, Jaipur, Mumbai...')}
                      className="mt-2 w-full px-3.5 py-3 rounded-xl border border-[#ebdcb9] bg-white text-sm font-medium focus:outline-hidden focus:border-[#1b4b32]"
                    />
                  </label>
                )}

                {/* Navigation Buttons */}
                <div className="flex gap-2 pt-1">
                  {formStep > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormStep((step) => step - 1)}
                      className="px-5 py-3 rounded-full border border-[#1b4b32]/30 text-[#1b4b32] text-xs font-bold hover:bg-[#f6efe0] cursor-pointer"
                    >
                      {tr('पीछे', 'Peeche')}
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
                      <span>{tr('आगे बढ़ें', 'Aage Badhein')}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!birthDetails.birthPlace.trim() || !birthDetails.name.trim() || !birthDetails.birthDate}
                      onClick={handleStartChatRequest}
                      className="flex-1 py-3 px-5 rounded-full bg-[#1b4b32] hover:bg-[#153e29] text-amber-200 font-bold text-sm shadow-md disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
                    >
                      <MessageSquare className="w-4 h-4 text-amber-300" />
                      <span>{tr(`${astrologer.name} से लाइव चैट शुरू करें`, `${astrologer.name} se Live Chat Shuru Karein`)}</span>
                    </button>
                  )}
                </div>

              </div>

              {/* Consultation Focus Field */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-[#453728]">
                  {tr('आपको किस विषय में मार्गदर्शन चाहिए? (वैकल्पिक)', 'Aapko kis vishay mein margdarshan chahiye? (Vaikalpik)')}
                </label>
                <input
                  type="text"
                  value={concern}
                  onChange={(e) => setConcern(e.target.value)}
                  placeholder={tr('करियर, विवाह, प्रेम संबंध, स्वास्थ्य, व्यापार, आर्थिक स्थिति...', 'Career, vivah, prem sambandh, swasthya, vyapar, arthik sthiti...')}
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

