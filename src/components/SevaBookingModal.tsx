import React, { useState, useEffect } from 'react';
import { X, Download, CheckCircle2, ShieldCheck, Plus, Video } from 'lucide-react';
import { SevaItem, getLocalizedSevaItems } from '../data/sevaData';
import { ImageCrop } from './ImageCrop';
import { api, normalizePhone } from '../services/api';
import { useLanguage } from '../i18n/LanguageContext';

interface SevaBookingModalProps {
  initialSeva: SevaItem;
  isOpen: boolean;
  onClose: () => void;
  hasAstrologerDiscount?: boolean;
  onBookingSuccess?: (bookingData: any) => void;
}

export const SevaBookingModal: React.FC<SevaBookingModalProps> = ({
  initialSeva,
  isOpen,
  onClose,
  hasAstrologerDiscount: _hasAstrologerDiscount = false,
  onBookingSuccess,
}) => {
  const { lang, tr } = useLanguage();
  const localizedItems = getLocalizedSevaItems(lang);

  const [selectedSeva, setSelectedSeva] = useState<SevaItem>(initialSeva);
  const [quantity, setQuantity] = useState<number>(1);
  const [duration, setDuration] = useState<'once' | '7days' | 'monthly' | 'custom'>('once');
  const [customDays, setCustomDays] = useState<number>(11);
  const [imageBroken, setImageBroken] = useState<boolean>(false);

  // Devotee Sankalp info
  const [devoteeName, setDevoteeName] = useState<string>('');
  const [gotra, setGotra] = useState<string>('कश्यप');
  const [phone, setPhone] = useState<string>('');
  const [sankalpDate, setSankalpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sankalpWish, setSankalpWish] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');

  // Additional family members for sankalp
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [showAddMember, setShowAddMember] = useState<boolean>(false);

  // Checkout status
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [bookingReceipt, setBookingReceipt] = useState<any>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Sync selectedSeva and logged-in user info whenever a different seva is tapped and modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSeva(initialSeva);
      setQuantity(Math.max(1, initialSeva.minQty || 1));
      setDuration('once');
      setSankalpWish('');
      setFamilyMembers([]);
      setNewMemberName('');
      setShowAddMember(false);
      setIsCompleted(false);
      setIsProcessing(false);
      setPaymentError(null);
      setImageBroken(false);

      try {
        const storedUser = localStorage.getItem('gaukripa_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed?.name) setDevoteeName(parsed.name);
          const clean = normalizePhone(parsed?.phone, '');
          if (clean.length === 10) setPhone(clean);
        } else {
          setDevoteeName((prev) => prev || tr('हर्ष भारद्वाज', 'Harsh Bhardwaj'));
          setPhone((prev) => prev || '9876543210');
        }
      } catch {
        setDevoteeName((prev) => prev || tr('हर्ष भारद्वाज', 'Harsh Bhardwaj'));
        setPhone((prev) => prev || '9876543210');
      }
    }
  }, [initialSeva, isOpen]);

  if (!isOpen) return null;

  // Dynamically resolve localized Seva so toggling language preserves custom Admin image & price overrides
  const matchedLocalized = localizedItems.find((s) => s.id === selectedSeva.id);
  const displaySeva: SevaItem = matchedLocalized
    ? {
        ...matchedLocalized,
        customImageUrl: selectedSeva.customImageUrl || matchedLocalized.customImageUrl,
        basePrice: Number(selectedSeva.basePrice ?? matchedLocalized.basePrice),
        priceDisplay: selectedSeva.priceDisplay || matchedLocalized.priceDisplay,
      }
    : selectedSeva;

  const isGauSeva = displaySeva.id.startsWith('gau-');

  const occasionLabel = tr('दैनिक सेवा', 'Dainik Seva');

  const unitPrice = Number(displaySeva.basePrice) || 0;
  const perDayAmount = quantity * unitPrice;

  const getMultiplier = () => {
    if (duration === '7days') return 7;
    if (duration === 'monthly') return 30;
    if (duration === 'custom') return Math.max(1, customDays);
    return 1;
  };

  const getDurationText = () => {
    if (duration === 'once') return tr('1 दिन', '1 Din');
    if (duration === '7days') return tr('7 दिन', '7 Din');
    if (duration === 'monthly') return tr('30 दिन', '30 Din');
    return tr(`${customDays} दिन`, `${customDays} Din`);
  };

  const baseTotal = perDayAmount * getMultiplier();
  const totalAmount = baseTotal;

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      setFamilyMembers((prev) => [...prev, newMemberName.trim()]);
      setNewMemberName('');
      setShowAddMember(false);
    }
  };

  const handleRemoveMember = (idx: number) => {
    setFamilyMembers((prev) => prev.filter((_, i) => i !== idx));
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (!devoteeName.trim()) {
      setPaymentError(
        tr('कृपया संकल्प कर्ता का नाम दर्ज करें।', 'Kripaya Sankalp Karta ka naam darj karein.')
      );
      return;
    }

    const cleanPhone = normalizePhone(phone, '');
    if (cleanPhone.length < 10) {
      setPaymentError(
        tr(
          'आहार वितरण की वीडियो पुष्टि पाने के लिए कृपया मान्य 10-अंकीय मोबाइल नंबर दर्ज करें।',
          'Aahar vitaran ka video proof paane ke liye kripaya sahi 10-digit mobile number darj karein.'
        )
      );
      return;
    }

    setIsProcessing(true);

    try {
      const amountInPaise = Math.round(totalAmount * 100);
      const receiptId = `gk_seva_${Date.now()}`;
      const order = await api.createOrder(amountInPaise, 'INR', receiptId, {
        sevaTitle: displaySeva.title,
        devoteeName: devoteeName.trim() || tr('भक्त', 'Bhakt'),
        phone: cleanPhone,
        gotra: gotra.trim() || tr('कश्यप', 'Kashyap'),
        occasion: occasionLabel,
      });

      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () =>
            reject(
              new Error(
                tr(
                  'सुरक्षित Razorpay चेकआउट लोड नहीं हो सका।',
                  'Surakshit Razorpay Checkout load nahi ho saka.'
                )
              )
            );
          document.body.appendChild(script);
        });
      }

      const RazorpayCheckout = (window as any).Razorpay;
      if (!RazorpayCheckout) {
        throw new Error(
          tr(
            'Razorpay चेकआउट अभी उपलब्ध नहीं है। कृपया पुनः प्रयास करें।',
            'Razorpay Checkout abhi uplabdh nahi hai. Kripaya dobara koshish karein.'
          )
        );
      }

      const keyId = order.key_id || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error(
          tr('Razorpay LIVE कुंजी कॉन्फ़िगर नहीं है।', 'Razorpay LIVE Key ID configure nahi hai.')
        );
      }

      const checkoutOptions: any = {
        key: keyId,
        amount: order.amount || amountInPaise,
        currency: 'INR',
        name: 'GauKripa',
        description: `${displaySeva.title} • ${tr('संकल्प सेवा', 'Sankalp Seva')}`,
        prefill: {
          name: devoteeName.trim() || tr('भक्त', 'Bhakt'),
          contact: cleanPhone,
        },
        notes: {
          sevaTitle: displaySeva.title,
          gotra: gotra.trim() || tr('कश्यप', 'Kashyap'),
          occasion: occasionLabel,
          paymentMethodPreference: paymentMethod,
          purpose: 'GauKripa Feed Arrangement Service',
        },
        theme: { color: '#b54c0d' },
        handler: async (response: any) => {
          try {
            const receipt = {
              id: `bkg-${response.razorpay_payment_id || Date.now()}`,
              bookingId: `GK-${Math.floor(100000 + Math.random() * 900000)}`,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              sevaId: displaySeva.id,
              sevaTitle: displaySeva.title,
              planet: displaySeva.planetTag,
              quantity: `${quantity} × ${displaySeva.unit}`,
              duration: getDurationText(),
              devoteeName: devoteeName.trim() || tr('भक्त', 'Bhakt'),
              gotra: gotra.trim() || tr('कश्यप', 'Kashyap'),
              familyMembers,
              occasion: occasionLabel,
              phone: cleanPhone,
              date: sankalpDate,
              sankalpWish,
              baseAmount: baseTotal,
              extraFee: 0,
              amount: totalAmount,
              goshala: tr('गौकृपा प्रमाणित सेवा केंद्र', 'GauKripa Pramanit Seva Kendra'),
              astrologerCoupon: 'GAU50-FREE-ASTRO',
              timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            };

            const verifyRes = await api.verifyPayment(
              response.razorpay_order_id || order.order_id || '',
              response.razorpay_payment_id,
              response.razorpay_signature || '',
              receipt
            );

            setBookingReceipt(receipt);
            setIsCompleted(true);
            if (!verifyRes?.booking) {
              await api.createBooking({ ...receipt, sevaId: displaySeva.id });
            }
            if (onBookingSuccess) onBookingSuccess(receipt);
          } catch (verifyErr: any) {
            setPaymentError(
              verifyErr?.message ||
                tr('भुगतान हस्ताक्षर सत्यापन असफल रहा।', 'Payment verification asafal raha.')
            );
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
          escape: true,
          confirm_close: true,
        },
      };

      if (order.order_id) {
        checkoutOptions.order_id = order.order_id;
      }

      const checkout = new RazorpayCheckout(checkoutOptions);
      checkout.on('payment.failed', (resp: any) => {
        setPaymentError(
          resp?.error?.description ||
            tr(
              'Razorpay भुगतान पूर्ण नहीं हो सका। कृपया पुनः प्रयास करें।',
              'Razorpay payment poora nahi ho saka. Kripaya dobara koshish karein.'
            )
        );
        setIsProcessing(false);
      });

      checkout.open();
    } catch (err: any) {
      setPaymentError(
        err?.message ||
          tr(
            'सुरक्षित Razorpay चेकआउट प्रारंभ नहीं हो सका।',
            'Surakshit Razorpay checkout shuru nahi ho saka.'
          )
      );
      setIsProcessing(false);
    }
  };

  const showCustomImage = Boolean(displaySeva.customImageUrl && !imageBroken);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-[#fbf6ee] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#e3c9a4] overflow-hidden my-auto max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Terracotta-Saffron Header */}
        <div className="bg-gradient-to-r from-[#a84106] via-[#b84c0c] to-[#c95914] text-white px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span className="text-2xl sm:text-[26px] leading-none shrink-0" aria-hidden="true">
              🙏
            </span>
            <div className="min-w-0">
              <h3 className="font-playfair text-base sm:text-xl font-bold text-white leading-tight truncate">
                {displaySeva.title} • {tr('संकल्प', 'Sankalp')}
              </h3>
              <p className="text-[11px] sm:text-xs text-[#ffe8cc] font-medium truncate mt-0.5">
                {isGauSeva
                  ? tr(
                      'गौमाता के लिए आपकी तरफ से प्रेम और सेवा का संकल्प',
                      'Gaumata ke liye aapki taraf se prem aur seva ka sankalp'
                    )
                  : tr(
                      'आपकी तरफ से करुणा, आहार और सेवा का पावन संकल्प',
                      'Aapki taraf se karuna, aahar aur seva ka pavitra sankalp'
                    )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={tr('बंद करें', 'Close')}
            className="p-1.5 rounded-full hover:bg-white/15 text-white/90 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Body */}
        {!isCompleted ? (
          <form onSubmit={handlePay} className="flex flex-col flex-1 min-h-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 p-4 sm:p-6 overflow-y-auto flex-1 bg-[#fbf6ee]">
              {/* LEFT COLUMN: Particular Seva Details, Quantity & Duration */}
              <div className="lg:col-span-6 space-y-3.5">
                {/* 1. Selected Seva Info Card */}
                <div className="bg-white rounded-2xl border border-[#dfb579] p-3.5 sm:p-4 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3.5 items-start">
                    <div className="w-full sm:w-36 h-40 sm:h-32 rounded-xl overflow-hidden bg-[#f5ead8] shrink-0">
                      {showCustomImage ? (
                        <img
                          src={displaySeva.customImageUrl}
                          alt={displaySeva.title}
                          referrerPolicy="no-referrer"
                          onError={() => setImageBroken(true)}
                          className="w-full h-full object-cover object-center block"
                        />
                      ) : (
                        <ImageCrop
                          cropKey={displaySeva.cropKey}
                          className="w-full h-full"
                          preserveAspectRatio="xMidYMid slice"
                          alt={displaySeva.title}
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <h4 className="font-playfair text-base sm:text-lg font-bold text-[#2e1a0c] leading-snug">
                        {displaySeva.title}
                      </h4>

                      <div className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-[#fde4bc] text-[#8d3d07] font-bold text-xs tabular-nums">
                        {displaySeva.unit} • ₹{unitPrice}
                      </div>

                      <p className="text-xs text-[#4f3a29] leading-relaxed">
                        {displaySeva.detailedDescription}
                      </p>

                      {displaySeva.vedicSignificance && (
                        <p className="text-xs text-[#5d4634] leading-snug">
                          <strong className="text-[#2e1a0c] font-semibold">
                            {tr('वैदिक महत्व:', 'Vedic Mahatva:')}
                          </strong>{' '}
                          {displaySeva.vedicSignificance}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Benefit Highlight Strip */}
                  <div className="px-3 py-2 rounded-xl bg-[#fdf3e1] border border-[#eed7b1] text-xs text-[#4f3a29] leading-snug">
                    <strong className="text-[#2e1a0c]">{tr('सेवा लाभ:', 'Seva Labh:')}</strong>{' '}
                    {displaySeva.benefit}
                  </div>
                </div>

                {/* 2. Quantity Stepper Card */}
                <div className="bg-white rounded-2xl border border-[#e7d3b5] px-4 py-3 flex items-center justify-between gap-2.5 shadow-2xs">
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-[#2e1a0c] truncate">
                      {tr(`आहार मात्रा (${displaySeva.unit})`, `Aahar Matra (${displaySeva.unit})`)}
                    </div>
                    <div className="text-[11px] text-[#755b43] tabular-nums">
                      ₹{unitPrice} {tr('प्रति', 'prati')} {displaySeva.unit}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      aria-label={tr('मात्रा कम करें', 'Decrease quantity')}
                      className="w-8 h-8 rounded-lg bg-[#d97021] hover:bg-[#b54c0d] active:scale-95 text-white font-bold text-base flex items-center justify-center transition-all cursor-pointer disabled:opacity-45"
                    >
                      −
                    </button>
                    <div className="text-xs sm:text-sm font-bold text-[#2e1a0c] whitespace-nowrap tabular-nums min-w-[4.5rem] text-center">
                      {quantity} × {displaySeva.unit}
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      aria-label={tr('मात्रा बढ़ाएं', 'Increase quantity')}
                      className="w-8 h-8 rounded-lg bg-[#d97021] hover:bg-[#b54c0d] active:scale-95 text-white font-bold text-base flex items-center justify-center transition-all cursor-pointer"
                    >
                      +
                    </button>
                    <div className="text-base sm:text-lg font-black text-[#2e1a0c] whitespace-nowrap tabular-nums pl-1 min-w-[3.75rem] text-right">
                      ₹{perDayAmount}
                    </div>
                  </div>
                </div>

                {/* 3. Duration Selector */}
                <div className="space-y-2">
                  <div className="text-xs font-extrabold text-[#2e1a0c] uppercase tracking-wider">
                    {tr('सेवा अवधि चुनें', 'SEVA AVADHI CHUNEIN')}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setDuration('once')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        duration === 'once'
                          ? 'bg-gradient-to-b from-[#d96c1b] to-[#c1500c] text-white border-[#b54c0d] shadow-xs'
                          : 'bg-white text-[#2e1a0c] border-[#e7d4b8] hover:border-[#d26c1d] hover:bg-[#fffaf2]'
                      }`}
                    >
                      <div className="font-bold text-xs sm:text-sm">{tr('1 दिन', '1 Din')}</div>
                      <div className="text-[10px] sm:text-[11px] opacity-85 mt-0.5 leading-tight">
                        {tr('एक दिन की सेवा', 'Ek din ki seva')}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDuration('7days')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        duration === '7days'
                          ? 'bg-gradient-to-b from-[#d96c1b] to-[#c1500c] text-white border-[#b54c0d] shadow-xs'
                          : 'bg-white text-[#2e1a0c] border-[#e7d4b8] hover:border-[#d26c1d] hover:bg-[#fffaf2]'
                      }`}
                    >
                      <div className="font-bold text-xs sm:text-sm">{tr('7 दिन', '7 Din')}</div>
                      <div className="text-[10px] sm:text-[11px] opacity-85 mt-0.5 leading-tight">
                        {tr('साप्ताहिक सेवा', 'Saptahik seva')}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDuration('monthly')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        duration === 'monthly'
                          ? 'bg-gradient-to-b from-[#d96c1b] to-[#c1500c] text-white border-[#b54c0d] shadow-xs'
                          : 'bg-white text-[#2e1a0c] border-[#e7d4b8] hover:border-[#d26c1d] hover:bg-[#fffaf2]'
                      }`}
                    >
                      <div className="font-bold text-xs sm:text-sm">{tr('30 दिन', '30 Din')}</div>
                      <div className="text-[10px] sm:text-[11px] opacity-85 mt-0.5 leading-tight">
                        {tr('महीने भर की सेवा', 'Mahine bhar ki seva')}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDuration('custom')}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        duration === 'custom'
                          ? 'bg-gradient-to-b from-[#d96c1b] to-[#c1500c] text-white border-[#b54c0d] shadow-xs'
                          : 'bg-white text-[#2e1a0c] border-[#e7d4b8] hover:border-[#d26c1d] hover:bg-[#fffaf2]'
                      }`}
                    >
                      <div className="font-bold text-xs sm:text-sm">{tr('अन्य दिन', 'Anya Din')}</div>
                      <div className="text-[10px] sm:text-[11px] opacity-85 mt-0.5 leading-tight">
                        {tr('अपनी अवधि चुनें', 'Apni duration chunein')}
                      </div>
                    </button>
                  </div>

                  {/* Custom Days Control */}
                  {duration === 'custom' && (
                    <div className="p-3 rounded-xl bg-[#fdf3e1] border border-[#e5cb9f] space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#2e1a0c]">
                          {tr('दिनों की संख्या चुनें:', 'Dinon ki Sankhya Chunein:')}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setCustomDays(Math.max(2, customDays - 1))}
                            className="w-7 h-7 rounded-lg bg-white border border-[#dec195] text-[#b54c0d] font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-[#fff6e8]"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={2}
                            max={365}
                            value={customDays}
                            onChange={(e) => setCustomDays(Math.max(2, parseInt(e.target.value, 10) || 2))}
                            className="w-16 px-2 py-1 text-center font-bold text-xs rounded-lg border border-[#dec195] bg-white text-[#2e1a0c] focus:outline-hidden tabular-nums"
                          />
                          <button
                            type="button"
                            onClick={() => setCustomDays(Math.min(365, customDays + 1))}
                            className="w-7 h-7 rounded-lg bg-white border border-[#dec195] text-[#b54c0d] font-bold text-sm flex items-center justify-center cursor-pointer hover:bg-[#fff6e8]"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-[#6d533c] font-semibold mr-0.5">
                          {tr('शुभ अवधि:', 'Shubh Avadhi:')}
                        </span>
                        {[11, 21, 40, 51, 108].map((days) => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => setCustomDays(days)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer tabular-nums ${
                              customDays === days
                                ? 'bg-[#c1500c] text-white border-[#b54c0d]'
                                : 'bg-white text-[#4f3a29] border-[#e2c69c] hover:border-[#c1500c]'
                            }`}
                          >
                            {days} {tr('दिन', 'Din')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Devotee Sankalp Form, Video Proof & Payment Method */}
              <div className="lg:col-span-6 space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#2e1a0c] uppercase tracking-wider">
                    {tr('भक्त संकल्प विवरण', 'BHAKT SANKALP VIVARAN')}
                  </span>

                  <button
                    type="button"
                    onClick={() => setShowAddMember(!showAddMember)}
                    className="text-xs font-bold text-[#b54c0d] hover:text-[#8f3807] inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{tr('परिवार का सदस्य जोड़ें', 'Parivar ka Sadasya Jodein')}</span>
                  </button>
                </div>

                {/* Added Family Members List */}
                {familyMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-[#fdf3e1] border border-[#e7cfa8]">
                    <span className="text-[11px] font-bold text-[#2e1a0c] self-center mr-1">
                      {tr('संकल्प में परिवार:', 'Sankalp mein Parivar:')}
                    </span>
                    {familyMembers.map((member, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white px-2.5 py-0.5 rounded-md border border-[#dfb579] text-[#2e1a0c]"
                      >
                        <span>{member}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(idx)}
                          className="text-rose-600 hover:text-rose-800 ml-0.5 cursor-pointer font-bold"
                          aria-label="Remove member"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Inline Add Family Member Field */}
                {showAddMember && (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#fdf3e1] border border-[#e5cb9f] animate-in fade-in duration-150">
                    <input
                      type="text"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddMember();
                        }
                      }}
                      placeholder={tr('परिवार के सदस्य का नाम लिखें', 'Parivar ke sadasya ka naam likhein')}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-[#dec195] bg-white text-xs text-[#2e1a0c] focus:outline-hidden focus:border-[#b54c0d]"
                    />
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="px-3 py-1.5 rounded-lg bg-[#b54c0d] hover:bg-[#963c08] text-white text-xs font-bold cursor-pointer"
                    >
                      {tr('जोड़ें', 'Jodein')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddMember(false)}
                      className="px-2 py-1.5 text-xs text-[#6e5540] hover:text-[#2e1a0c] cursor-pointer"
                    >
                      {tr('रद्द करें', 'Radd Karein')}
                    </button>
                  </div>
                )}

                {/* 2x2 Primary Sankalp Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#2e1a0c] mb-1">
                      {tr('संकल्प कर्ता का नाम', 'Sankalp Karta ka Naam')}{' '}
                      <span className="text-[#c94a10]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={devoteeName}
                      onChange={(e) => setDevoteeName(e.target.value)}
                      placeholder={tr('जैसे: हर्ष भारद्वाज', 'Jaise: Harsh Bhardwaj')}
                      className="w-full px-3 py-2 rounded-xl border border-[#e3cfb0] bg-white text-xs sm:text-sm font-medium text-[#2e1a0c] focus:outline-hidden focus:border-[#b54c0d]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2e1a0c] mb-1">
                      {tr('गोत्र', 'Gotra')}
                    </label>
                    <input
                      type="text"
                      value={gotra}
                      onChange={(e) => setGotra(e.target.value)}
                      placeholder={tr('जैसे: कश्यप / भारद्वाज', 'Jaise: Kashyap / Bhardwaj')}
                      className="w-full px-3 py-2 rounded-xl border border-[#e3cfb0] bg-white text-xs sm:text-sm font-medium text-[#2e1a0c] focus:outline-hidden focus:border-[#b54c0d]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2e1a0c] mb-1">
                      {tr('व्हाट्सएप नंबर', 'WhatsApp Number')}{' '}
                      <span className="text-[#c94a10]">*</span>
                    </label>
                    <div className="flex items-center rounded-xl border border-[#e3cfb0] bg-white overflow-hidden focus-within:border-[#b54c0d]">
                      <span className="pl-3 pr-1.5 text-xs sm:text-sm font-semibold text-[#5d4634] select-none">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full pr-3 py-2 bg-transparent text-xs sm:text-sm font-medium text-[#2e1a0c] focus:outline-hidden tabular-nums"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#2e1a0c] mb-1">
                      {tr('सेवा शुरू होने की तारीख', 'Seva Shuru Hone ki Tarikh')}
                    </label>
                    <input
                      type="date"
                      value={sankalpDate}
                      onChange={(e) => setSankalpDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#e3cfb0] bg-white text-xs sm:text-sm font-medium text-[#2e1a0c] focus:outline-hidden focus:border-[#b54c0d] tabular-nums"
                    />
                  </div>
                </div>

                {/* Prayer / Wish Full-Width Input */}
                <div>
                  <label className="block text-xs font-semibold text-[#2e1a0c] mb-1">
                    {tr('प्रार्थना / मनोकामना', 'Prarthana / Manokamna')}
                  </label>
                  <input
                    type="text"
                    value={sankalpWish}
                    onChange={(e) => setSankalpWish(e.target.value)}
                    placeholder={tr(
                      'जैसे: परिवार में सुख-शांति, स्वास्थ्य और ग्रह शांति',
                      'Jaise: Parivar mein sukh-shanti, swasthya aur grah shanti'
                    )}
                    className="w-full px-3 py-2 rounded-xl border border-[#e3cfb0] bg-white text-xs sm:text-sm font-medium text-[#2e1a0c] focus:outline-hidden focus:border-[#b54c0d]"
                  />
                </div>

                {/* Video Proof Assurance Box */}
                <div className="p-3 rounded-xl bg-[#fdf3de] border border-[#edd6a8] flex items-center gap-2.5 text-xs text-[#4f3a29] leading-snug">
                  <div className="w-7 h-7 rounded-lg bg-[#f9e1b3] text-[#c1500c] flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <span>
                    {tr(
                      `आपकी सेवा का Video Proof आपके पंजीकृत WhatsApp नंबर${phone ? ` (+91 ${phone})` : ''} पर भेजा जाएगा।`,
                      `Aapki Seva ka Video Proof aapke registered WhatsApp number${phone ? ` (+91 ${phone})` : ''} par bheja jayega.`
                    )}
                  </span>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-bold text-[#2e1a0c] mb-1.5">
                    {tr('भुगतान का माध्यम चुनें', 'Payment ka Madhyam Chunein')}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('upi')}
                      className={`py-2.5 px-2 rounded-xl border text-center text-xs transition-all cursor-pointer whitespace-nowrap ${
                        paymentMethod === 'upi'
                          ? 'bg-gradient-to-r from-[#d96c1b] to-[#c1500c] text-white border-[#b54c0d] font-bold shadow-xs'
                          : 'bg-white text-[#2e1a0c] border-[#e3cfb0] hover:border-[#d26c1d] font-semibold'
                      }`}
                    >
                      UPI / QR
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`py-2.5 px-2 rounded-xl border text-center text-xs transition-all cursor-pointer truncate ${
                        paymentMethod === 'card'
                          ? 'bg-gradient-to-r from-[#d96c1b] to-[#c1500c] text-white border-[#b54c0d] font-bold shadow-xs'
                          : 'bg-white text-[#2e1a0c] border-[#e3cfb0] hover:border-[#d26c1d] font-semibold'
                      }`}
                    >
                      {tr('डेबिट / क्रेडिट कार्ड', 'Debit / Credit Card')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('netbanking')}
                      className={`py-2.5 px-2 rounded-xl border text-center text-xs transition-all cursor-pointer truncate ${
                        paymentMethod === 'netbanking'
                          ? 'bg-gradient-to-r from-[#d96c1b] to-[#c1500c] text-white border-[#b54c0d] font-bold shadow-xs'
                          : 'bg-white text-[#2e1a0c] border-[#e3cfb0] hover:border-[#d26c1d] font-semibold'
                      }`}
                    >
                      {tr('नेट बैंकिंग', 'Net Banking')}
                    </button>
                  </div>
                </div>

                {/* Payment Error Message */}
                {paymentError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
                    {paymentError}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Fixed Summary & Primary Saffron-Gold Pill CTA */}
            <div className="bg-[#fffaf0] border-t border-[#e8d5b7] px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3 shrink-0 shadow-[0_-4px_16px_rgba(92,54,18,0.06)]">
              <div className="min-w-0">
                <div className="text-[11px] sm:text-xs font-semibold text-[#6e5540] truncate">
                  {tr('कुल सेवा शुल्क', 'Kul Seva Shulk')} ({getDurationText()})
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-black text-[#2e1a0c] tabular-nums">
                    ₹{totalAmount}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="px-5 sm:px-8 py-2.5 sm:py-3 rounded-full bg-gradient-to-b from-[#e89828] to-[#cf6d14] hover:brightness-105 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 whitespace-nowrap shrink-0"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{tr('संकल्प दर्ज हो रहा है...', 'Sankalp Darj Ho Raha Hai...')}</span>
                  </>
                ) : (
                  <span>{tr('अपनी सेवा पूरी करें 🙏', 'Apni Seva Puri Karein 🙏')}</span>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Success Screen with Warm Saffron-Cream Digital Certificate */
          <div className="p-5 sm:p-7 text-center space-y-5 overflow-y-auto flex-1 bg-[#fbf6ee]">
            <div className="w-16 h-16 rounded-full bg-[#fdf1d6] border border-[#e7c57c] text-[#b54c0d] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold tracking-widest text-[#b54c0d] uppercase">
                सङ्कल्प सिद्धम्
              </span>
              <h4 className="font-playfair text-2xl font-bold text-[#2e1a0c]">
                {tr('सेवा संकल्प सफलतापूर्वक दर्ज हुआ!', 'Seva Sankalp Safaltapoorvak Darj Hua!')}
              </h4>
              <p className="text-xs sm:text-sm text-[#5d4634] max-w-md mx-auto">
                {tr(
                  `आपकी ${bookingReceipt?.sevaTitle} (${bookingReceipt?.duration}) की व्यवस्था सुनिश्चित हो गई है।`,
                  `Aapki ${bookingReceipt?.sevaTitle} (${bookingReceipt?.duration}) ki seva sunishchit ho gayi hai.`
                )}
              </p>
            </div>

            {/* Digital Certificate Box */}
            <div className="bg-white border-2 border-[#dfb579] rounded-2xl p-4 sm:p-5 text-left max-w-lg mx-auto shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#eed7b1] pb-2">
                <span className="font-playfair font-bold text-[#b54c0d] text-sm">
                  {tr('गौकृपा • आहार व्यवस्था एवं सेवा', 'GauKripa • Aahar Vyavastha aur Seva')}
                </span>
                <span className="text-xs font-mono font-bold text-[#7a5837] tabular-nums">
                  {bookingReceipt?.bookingId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <span className="text-[#7a644e]">{tr('यजमान / भक्त:', 'Yajman / Bhakt:')}</span>
                  <div className="font-bold text-[#2e1a0c]">{bookingReceipt?.devoteeName}</div>
                </div>
                <div>
                  <span className="text-[#7a644e]">{tr('गोत्र:', 'Gotra:')}</span>
                  <div className="font-bold text-[#2e1a0c]">{bookingReceipt?.gotra}</div>
                </div>
                <div>
                  <span className="text-[#7a644e]">{tr('सेवा एवं अवधि:', 'Seva aur Avadhi:')}</span>
                  <div className="font-bold text-[#b54c0d]">
                    {bookingReceipt?.sevaTitle} ({bookingReceipt?.duration})
                  </div>
                </div>
                <div>
                  <span className="text-[#7a644e]">
                    {tr('कुल सेवा शुल्क', 'Kul Seva Shulk')}
                    {bookingReceipt?.extraFee > 0
                      ? tr(' (सहित ₹21 विशेष संकल्प)', ' (₹21 vishesh sankalp sahit)')
                      : ''}
                    :
                  </span>
                  <div className="font-bold text-[#2e1a0c] tabular-nums">₹{bookingReceipt?.amount}</div>
                </div>
              </div>

              {bookingReceipt?.familyMembers?.length > 0 && (
                <div className="text-[11px] pt-1.5 border-t border-[#eed7b1]">
                  <span className="text-[#7a644e]">
                    {tr('संकल्प में सम्मिलित परिवार:', 'Sankalp mein Shamil Parivar:')}{' '}
                  </span>
                  <span className="font-semibold text-[#2e1a0c]">
                    {bookingReceipt.familyMembers.join(', ')}
                  </span>
                </div>
              )}

              <div className="pt-2 border-t border-[#eed7b1] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[#5d4634]">
                <span>
                  {tr(
                    'आहार वितरण की वीडियो पुष्टि WhatsApp पर भेजी जाएगी:',
                    'Aahar vitaran ka video proof WhatsApp par bheja jayega:'
                  )}{' '}
                  <strong className="text-[#2e1a0c] tabular-nums">+91 {bookingReceipt?.phone}</strong>
                </span>
                <span className="text-[#b54c0d] font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />{' '}
                  {tr('प्रत्यक्ष सेवा प्रमाणित', 'Pratyaksh Seva Pramanit')}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-1 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-full border border-[#b54c0d] text-[#b54c0d] font-semibold text-xs flex items-center gap-1.5 hover:bg-[#b54c0d]/5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{tr('संकल्प प्रमाणपत्र सहेजें', 'Sankalp Certificate Save Karein')}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-full bg-gradient-to-b from-[#e89828] to-[#cf6d14] hover:brightness-105 text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                {tr('पूर्ण', 'Poorn')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
