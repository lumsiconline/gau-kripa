import React, { useState, useEffect } from 'react';
import { X, Sparkles, Download, ArrowRight, User as UserIcon, CheckCircle2, ShieldCheck, Plus, Video } from 'lucide-react';
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
  const { lang, isHi, tr } = useLanguage();
  const localizedItems = getLocalizedSevaItems(lang);

  const [selectedSeva, setSelectedSeva] = useState<SevaItem>(initialSeva);
  const [quantity, setQuantity] = useState<number>(1);
  const [duration, setDuration] = useState<'once' | '7days' | 'monthly' | 'custom'>('once');
  const [customDays, setCustomDays] = useState<number>(11);
  
  // Devotee Sankalp info
  const [devoteeName, setDevoteeName] = useState<string>('हर्ष भारद्वाज');
  const [gotra, setGotra] = useState<string>('कश्यप');
  const [phone, setPhone] = useState<string>('9876543210');
  const [sankalpDate, setSankalpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sankalpWish, setSankalpWish] = useState<string>('');
  const [occasionId, setOccasionId] = useState<string>('general');
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

  // Sync selectedSeva and logged-in user info whenever a different seva is clicked and modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSeva(initialSeva);
      setQuantity(1);
      setDuration('once');
      setOccasionId('general');
      setIsCompleted(false);
      setIsProcessing(false);
      setPaymentError(null);
      try {
        const storedUser = localStorage.getItem('gaukripa_user');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          if (parsed?.name) setDevoteeName(parsed.name);
          const clean = normalizePhone(parsed?.phone, '');
          if (clean.length === 10) setPhone(clean);
        }
      } catch {}
    }
  }, [initialSeva, isOpen]);

  if (!isOpen) return null;

  // Dynamically resolve localized Seva so toggling language inside modal preserves custom Admin image & price overrides
  const matchedLocalized = localizedItems.find((s) => s.id === selectedSeva.id);
  const displaySeva = matchedLocalized
    ? {
        ...matchedLocalized,
        customImageUrl: selectedSeva.customImageUrl || matchedLocalized.customImageUrl,
        basePrice: selectedSeva.basePrice ?? matchedLocalized.basePrice,
        priceDisplay: selectedSeva.priceDisplay || matchedLocalized.priceDisplay,
      }
    : selectedSeva;

  const occasionPresets = [
    { id: 'general', hi: 'दैनिक गौ-आहार सेवा', en: 'Dainik Gau-Aahar Seva', isExtra: false },
    { id: 'diwali', hi: 'दीपावली / गोवर्धन पूजा', en: 'Diwali / Govardhan Puja', isExtra: true },
    { id: 'birthday', hi: 'जन्मदिवस संकल्प', en: 'Janamdin Sankalp', isExtra: true },
    { id: 'anniversary', hi: 'विवाह वर्षगांठ', en: 'Vivah Varshgaanth', isExtra: true },
    { id: 'purnima', hi: 'पूर्णिमा / एकादशी', en: 'Purnima / Ekadashi', isExtra: true },
    { id: 'pitra', hi: 'पितृ शांति विशेष', en: 'Pitra Shanti Vishesh', isExtra: true },
    { id: 'health', hi: 'स्वास्थ्य एवं सुख-शांति', en: 'Swasthya aur Sukh-Shanti', isExtra: true },
  ];

  const selectedOccasion = occasionPresets.find((o) => o.id === occasionId) || occasionPresets[0];
  const occasionLabel = isHi ? selectedOccasion.hi : selectedOccasion.en;
  const isExtraOccasion = selectedOccasion.isExtra;
  const extraOccasionFee = isExtraOccasion ? 21 : 0;

  // Calculate pricing based on 1 day, 7 days, 30 days, or custom days
  const calculateBaseTotal = () => {
    const basePerDay = quantity * displaySeva.basePrice;

    let multiplier = 1;
    if (duration === '7days') multiplier = 7;
    else if (duration === 'monthly') multiplier = 30;
    else if (duration === 'custom') multiplier = Math.max(1, customDays);

    return basePerDay * multiplier;
  };

  const getDurationText = () => {
    if (duration === 'once') return tr('1 दिन (एक दिवसीय सेवा)', '1 Din (Ek Divasiya Seva)');
    if (duration === '7days') return tr('7 दिन (साप्ताहिक संकल्प)', '7 Din (Saptahik Sankalp)');
    if (duration === 'monthly') return tr('30 दिन (मासिक संकल्प)', '30 Din (Masik Sankalp)');
    return tr(`${customDays} दिन (विशेष संकल्प)`, `${customDays} Din (Vishesh Sankalp)`);
  };

  const baseTotal = calculateBaseTotal();
  const totalAmount = baseTotal + extraOccasionFee;

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      setFamilyMembers([...familyMembers, newMemberName.trim()]);
      setNewMemberName('');
      setShowAddMember(false);
    }
  };

  const handleRemoveMember = (idx: number) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== idx));
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

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
      // 1. Create real order on LIVE backend
      const amountInPaise = Math.round(totalAmount * 100);
      const receiptId = `gk_seva_${Date.now()}`;
      const order = await api.createOrder(amountInPaise, 'INR', receiptId, {
        sevaTitle: displaySeva.title,
        devoteeName: devoteeName || tr('भक्त', 'Bhakt'),
        phone: cleanPhone,
        gotra: gotra || tr('कश्यप', 'Kashyap'),
        occasion: occasionLabel
      });

      // 2. Ensure Razorpay checkout.js script is loaded
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(tr('सुरक्षित Razorpay चेकआउट लोड नहीं हो सका।', 'Surakshit Razorpay Checkout load nahi ho saka.')));
          document.body.appendChild(script);
        });
      }

      const RazorpayCheckout = (window as any).Razorpay;
      if (!RazorpayCheckout) {
        throw new Error(tr('Razorpay चेकआउट अभी उपलब्ध नहीं है। कृपया पुनः प्रयास करें।', 'Razorpay Checkout abhi uplabdh nahi hai. Kripaya dobara koshish karein.'));
      }

      const keyId = order.key_id || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error(tr('Razorpay LIVE कुंजी कॉन्फ़िगर नहीं है।', 'Razorpay LIVE Key ID configure nahi hai.'));
      }

      const checkoutOptions: any = {
        key: keyId,
        amount: order.amount || amountInPaise,
        currency: 'INR',
        name: 'GauKripa',
        description: `${displaySeva.title} • ${tr('संकल्प सेवा', 'Sankalp Seva')}`,
        prefill: {
          name: devoteeName || tr('भक्त', 'Bhakt'),
          contact: cleanPhone
        },
        notes: {
          sevaTitle: displaySeva.title,
          gotra: gotra || tr('कश्यप', 'Kashyap'),
          occasion: occasionLabel,
          purpose: 'GauKripa Feed Arrangement Service'
        },
        theme: { color: '#1b4b32' },
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
              devoteeName: devoteeName || tr('भक्त', 'Bhakt'),
              gotra: gotra || tr('कश्यप', 'Kashyap'),
              familyMembers,
              occasion: occasionLabel,
              phone: cleanPhone,
              date: sankalpDate,
              sankalpWish,
              baseAmount: baseTotal,
              extraFee: extraOccasionFee,
              amount: totalAmount,
              goshala: tr('गौकृपा प्रमाणित गौशाला', 'GauKripa Pramanit Goshala'),
              astrologerCoupon: 'GAU50-FREE-ASTRO',
              timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            };

            // 3. Cryptographic signature verification + booking persistence on backend
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
            setPaymentError(verifyErr?.message || tr('भुगतान हस्ताक्षर सत्यापन असफल रहा।', 'Payment verification asafal raha.'));
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
          },
          escape: true,
          confirm_close: true
        }
      };

      if (order.order_id) {
        checkoutOptions.order_id = order.order_id;
      }

      const checkout = new RazorpayCheckout(checkoutOptions);
      checkout.on('payment.failed', (resp: any) => {
        setPaymentError(resp?.error?.description || tr('Razorpay भुगतान पूर्ण नहीं हो सका। कृपया पुनः प्रयास करें।', 'Razorpay payment poora nahi ho saka. Kripaya dobara koshish karein.'));
        setIsProcessing(false);
      });

      checkout.open();
    } catch (err: any) {
      setPaymentError(err?.message || tr('सुरक्षित Razorpay चेकआउट प्रारंभ नहीं हो सका।', 'Surakshit Razorpay checkout shuru nahi ho saka.'));
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#fffdfa] rounded-3xl shadow-2xl border-2 border-[#ebdcb9] overflow-hidden my-4 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-[#1b4b32] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-[#296344] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🙏</span>
            <div>
              <h3 className="font-playfair text-lg sm:text-xl font-bold text-amber-200 leading-tight">
                {displaySeva.title} • {tr('संकल्प', 'Sankalp')}
              </h3>
              <p className="text-xs text-emerald-100/90 font-medium">
                {tr('प्रमाणित गौशाला में प्रत्यक्ष गौ-आहार व्यवस्था', 'Pramanit Goshala mein Pratyaksh Gau-Aahar Seva')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {!isCompleted ? (
          <form onSubmit={handlePay} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
            
            {/* 1. Particular Details of That Seva Only */}
            <div className="bg-[#fcf8ee] rounded-2xl p-4 sm:p-5 border border-[#ebdcb9] space-y-3 shadow-2xs">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {/* Big HD Image of this particular seva */}
                <div className="w-full sm:w-40 h-36 sm:h-32 rounded-xl overflow-hidden shrink-0 border border-[#d9ba78] shadow-xs relative bg-amber-50">
                  {displaySeva.customImageUrl ? (
                    <img
                      src={displaySeva.customImageUrl}
                      alt={displaySeva.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageCrop
                      cropKey={displaySeva.cropKey}
                      className="w-full h-full object-cover"
                      alt={displaySeva.title}
                    />
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#faedd0]/95 text-[#6d460d] border border-[#d6ba7f] shadow-xs backdrop-blur-xs">
                      {displaySeva.planetTag}
                    </span>
                  </div>
                </div>

                {/* Details text */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-playfair text-lg sm:text-xl font-bold text-[#1b4b32]">
                      {displaySeva.title}
                    </h4>
                    <span className="text-base sm:text-lg font-black text-[#1b4b32] shrink-0">
                      {displaySeva.priceDisplay}
                    </span>
                  </div>

                  <p className="text-xs text-[#524434] font-medium leading-relaxed">
                    {displaySeva.detailedDescription}
                  </p>

                  <p className="text-[11px] text-[#715f4a] italic pt-0.5 leading-snug">
                    <strong className="text-[#1b4b32] not-italic">{tr('वैदिक महत्व: ', 'Vedic Mahatva: ')}</strong>
                    {displaySeva.vedicSignificance}
                  </p>
                </div>
              </div>

              {/* Benefit Banner */}
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/90 flex items-center gap-2 text-xs text-[#634f31]">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong className="text-[#1b4b32]">{tr('सेवा लाभ:', 'Seva Labh:')}</strong> {displaySeva.benefit}
                </span>
              </div>
            </div>

            {/* 2. Quantity & Offering Stepper */}
            <div className="bg-[#fffcf7] p-3.5 rounded-2xl border border-[#ebdcb9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-[#453728]">
                  {tr(`आहार मात्रा (${displaySeva.unit})`, `Aahar Matra (${displaySeva.unit})`)}
                </label>
                <span className="text-[11px] text-[#756653]">
                  {tr(`दर: ₹${displaySeva.basePrice} प्रति ${displaySeva.unit}`, `Dar: ₹${displaySeva.basePrice} prati ${displaySeva.unit}`)}
                </span>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-xl bg-[#f5ecda] hover:bg-[#ede0c7] text-[#1b4b32] font-bold text-base flex items-center justify-center transition-colors cursor-pointer"
                >
                  -
                </button>
                <div className="min-w-24 px-3 py-1.5 text-center font-bold text-sm text-[#1b4b32] bg-[#fffaf0] rounded-xl border border-[#ebdcb9]">
                  {quantity} × {displaySeva.unit}
                </div>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-9 h-9 rounded-xl bg-[#f5ecda] hover:bg-[#ede0c7] text-[#1b4b32] font-bold text-base flex items-center justify-center transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* 3. Duration Selector: 1 Day, 7 Days, 30 Days and Custom Buttons */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#453728] uppercase tracking-wider">
                {tr('सेवा अवधि चुनें', 'Seva Avadhi Chunein')}
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* 1 Day */}
                <button
                  type="button"
                  onClick={() => setDuration('once')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    duration === 'once'
                      ? 'bg-[#1b4b32] text-white border-[#1b4b32] shadow-xs'
                      : 'bg-[#fcf8ee] text-[#3d3224] border-[#ebdcb9] hover:bg-[#f6efe0]'
                  }`}
                >
                  <div className="font-bold text-xs">{tr('1 दिन', '1 Din')}</div>
                  <div className="text-[10px] opacity-80">{tr('एक दिवसीय सेवा', 'Ek Din ki Seva')}</div>
                </button>

                {/* 7 Days */}
                <button
                  type="button"
                  onClick={() => setDuration('7days')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    duration === '7days'
                      ? 'bg-[#1b4b32] text-white border-[#1b4b32] shadow-xs'
                      : 'bg-[#fcf8ee] text-[#3d3224] border-[#ebdcb9] hover:bg-[#f6efe0]'
                  }`}
                >
                  <div className="font-bold text-xs">{tr('7 दिन', '7 Din')}</div>
                  <div className="text-[10px] opacity-80">{tr('साप्ताहिक संकल्प', 'Saptahik Sankalp')}</div>
                </button>

                {/* 30 Days (Monthly) */}
                <button
                  type="button"
                  onClick={() => setDuration('monthly')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    duration === 'monthly'
                      ? 'bg-[#1b4b32] text-white border-[#1b4b32] shadow-xs'
                      : 'bg-[#fcf8ee] text-[#3d3224] border-[#ebdcb9] hover:bg-[#f6efe0]'
                  }`}
                >
                  <div className="font-bold text-xs">{tr('30 दिन', '30 Din')}</div>
                  <div className="text-[10px] opacity-80">{tr('मासिक सेवा', 'Masik Seva')}</div>
                </button>

                {/* Custom Days Button */}
                <button
                  type="button"
                  onClick={() => setDuration('custom')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    duration === 'custom'
                      ? 'bg-[#1b4b32] text-white border-[#1b4b32] shadow-xs'
                      : 'bg-[#fcf8ee] text-[#3d3224] border-[#ebdcb9] hover:bg-[#f6efe0]'
                  }`}
                >
                  <div className="font-bold text-xs">{tr('अन्य दिन', 'Anya Din')}</div>
                  <div className="text-[10px] opacity-80">{tr('मनचाहे दिन चुनें', 'Apne din chunein')}</div>
                </button>
              </div>

              {/* Custom Days Input & Shortcut Chips */}
              {duration === 'custom' && (
                <div className="p-3 rounded-2xl bg-[#faf3e2] border border-[#e4d4ad] space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1b4b32]">
                      {tr('दिनों की संख्या चुनें:', 'Dinon ki Sankhya Chunein:')}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomDays(Math.max(2, customDays - 1))}
                        className="w-7 h-7 rounded-lg bg-white border border-[#ebdcb9] text-[#1b4b32] font-bold text-sm flex items-center justify-center cursor-pointer"
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={2}
                        max={365}
                        value={customDays}
                        onChange={(e) => setCustomDays(Math.max(2, parseInt(e.target.value) || 2))}
                        className="w-16 px-2 py-1 text-center font-bold text-xs rounded-lg border border-[#ebdcb9] bg-white focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setCustomDays(customDays + 1)}
                        className="w-7 h-7 rounded-lg bg-white border border-[#ebdcb9] text-[#1b4b32] font-bold text-sm flex items-center justify-center cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Auspicious Shortcut Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[11px] text-[#715f4a] font-medium mr-1">
                      {tr('शुभ अवधि:', 'Shubh Avadhi:')}
                    </span>
                    {[11, 21, 40, 51, 108].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setCustomDays(days)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                          customDays === days
                            ? 'bg-[#1b4b32] text-white border-[#1b4b32]'
                            : 'bg-white text-[#524434] border-[#ebdcb9] hover:bg-[#f6eee0]'
                        }`}
                      >
                        {days} {tr('दिन', 'Din')} {days === 40 && tr('(मंडल)', '(Mandal)')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Occasion Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <label className="block text-xs font-bold text-[#453728] uppercase tracking-wider">
                  {tr('विशेष अवसर', 'Vishesh Avsar')}
                </label>
                <span className="text-[11px] text-[#786955]">
                  {tr('व्यक्तिगत संकल्प हेतु अवसर चुनें', 'Vyaktigat sankalp ke liye avsar chunein')}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {occasionPresets.map((occ) => {
                  const isSelected = occasionId === occ.id;
                  return (
                    <button
                      key={occ.id}
                      type="button"
                      onClick={() => setOccasionId(occ.id)}
                      className={`px-3 py-1.5 text-xs rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#1b4b32] text-white font-bold border-[#1b4b32] shadow-xs'
                          : 'bg-[#fffcf7] text-[#554737] border-[#ebdcb9] hover:bg-[#f6eee0]'
                      }`}
                    >
                      <span>{isHi ? occ.hi : occ.en}</span>
                      {occ.isExtra && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                            isSelected
                              ? 'bg-amber-400 text-amber-950'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          +₹21
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Devotee Sankalp Form Details */}
            <div className="space-y-3 pt-2 border-t border-[#ebdcb9]">
              <div className="text-xs font-bold text-[#1b4b32] uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5" />
                  {tr('संकल्प विवरण', 'Bhakt Sankalp Vivaran')}
                </span>
                
                {/* Button to add family members */}
                <button
                  type="button"
                  onClick={() => setShowAddMember(true)}
                  className="text-[11px] font-bold text-[#c4821a] hover:text-[#9e6612] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{tr('परिवार का सदस्य जोड़ें', 'Parivar ka Sadasya Jodein')}</span>
                </button>
              </div>

              {/* Family members tag list if added */}
              {familyMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-amber-50/80 border border-amber-200">
                  <span className="text-[11px] font-bold text-[#1b4b32] self-center">
                    {tr('संकल्प में परिवार:', 'Sankalp mein Parivar:')}
                  </span>
                  {familyMembers.map((member, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white px-2 py-0.5 rounded-md border border-[#ebdcb9] text-[#453728]"
                    >
                      <span>{member}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(idx)}
                        className="text-rose-500 hover:text-rose-700 ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add member input popup */}
              {showAddMember && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#faf3e2] border border-[#e4d4ad]">
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder={tr('परिवार के सदस्य का नाम लिखें', 'Parivar ke sadasya ka naam likhein')}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#ebdcb9] bg-white text-xs focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="px-3 py-1.5 rounded-lg bg-[#1b4b32] text-white text-xs font-bold cursor-pointer"
                  >
                    {tr('जोड़ें', 'Jodein')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddMember(false)}
                    className="px-2 py-1.5 text-xs text-[#756653] cursor-pointer"
                  >
                    {tr('रद्द करें', 'Radd Karein')}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#483d2e] mb-1">
                    {tr('संकल्प कर्ता का नाम *', 'Sankalp Karta ka Naam *')}
                  </label>
                  <input
                    type="text"
                    required
                    value={devoteeName}
                    onChange={(e) => setDevoteeName(e.target.value)}
                    placeholder={tr('जैसे: हर्ष भारद्वाज', 'Jaise: Harsh Bhardwaj')}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium focus:outline-hidden focus:border-[#1b4b32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#483d2e] mb-1">
                    {tr('गोत्र', 'Gotra')}
                  </label>
                  <input
                    type="text"
                    value={gotra}
                    onChange={(e) => setGotra(e.target.value)}
                    placeholder={tr('जैसे: कश्यप / भारद्वाज', 'Jaise: Kashyap / Bhardwaj')}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium focus:outline-hidden focus:border-[#1b4b32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#483d2e] mb-1">
                    {tr('व्हाट्सएप नंबर (वीडियो पुष्टि हेतु) *', 'WhatsApp Number (Video Proof ke Liye) *')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-[#7d705c] font-semibold">+91</span>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-11 pr-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium focus:outline-hidden focus:border-[#1b4b32]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#483d2e] mb-1">
                    {tr('सेवा प्रारंभ तिथि', 'Seva Shuru Hone ki Tarikh')}
                  </label>
                  <input
                    type="date"
                    value={sankalpDate}
                    onChange={(e) => setSankalpDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium focus:outline-hidden focus:border-[#1b4b32]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#483d2e] mb-1">
                  {tr('प्रार्थना / मनोकामना', 'Prarthana / Manokamna')}
                </label>
                <input
                  type="text"
                  value={sankalpWish}
                  onChange={(e) => setSankalpWish(e.target.value)}
                  placeholder={tr('जैसे: परिवार में सुख-शांति, स्वास्थ्य व ग्रह शांति', 'Jaise: Parivar mein sukh-shanti, swasthya aur grah shanti')}
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium focus:outline-hidden focus:border-[#1b4b32]"
                />
              </div>
            </div>

            {/* Video Proof Guarantee Banner */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
              <Video className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>{tr('आहार वितरण की वीडियो पुष्टि:', 'Aahar Vitaran ka Video Proof:')}</strong>{' '}
                {tr(
                  `वीडियो आपके पंजीकृत नंबर${phone ? ` (+91 ${phone})` : ''} पर साझा किया जाएगा।`,
                  `Video aapke registered number${phone ? ` (+91 ${phone})` : ''} par bheja jayega.`
                )}
              </span>
            </div>

            {/* 6. Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-[#5c4e3a] mb-1.5">
                {tr('भुगतान माध्यम चुनें', 'Payment ka Madhyam Chunein')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-2 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'bg-[#1b4b32] text-white border-[#1b4b32]'
                      : 'bg-[#fffcf5] text-[#332b21] border-[#ebdcb9]'
                  }`}
                >
                  ⚡ {tr('UPI / QR', 'UPI / QR')}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-2 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-[#1b4b32] text-white border-[#1b4b32]'
                      : 'bg-[#fffcf5] text-[#332b21] border-[#ebdcb9]'
                  }`}
                >
                  💳 {tr('डेबिट / क्रेडिट कार्ड', 'Debit / Credit Card')}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-2 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer ${
                    paymentMethod === 'netbanking'
                      ? 'bg-[#1b4b32] text-white border-[#1b4b32]'
                      : 'bg-[#fffcf5] text-[#332b21] border-[#ebdcb9]'
                  }`}
                >
                  🏦 {tr('नेट बैंकिंग', 'NetBanking')}
                </button>
              </div>
            </div>

            {/* ₹21 Extra Occasion Fee Banner */}
            {isExtraOccasion && (
              <div className="p-3 rounded-xl bg-[#fff9ea] border border-[#e6c989] flex items-center justify-between text-xs text-[#523d1b] shadow-2xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <span className="text-base text-[#b87611] font-bold">卐</span>
                  <div>
                    <strong className="text-[#1b4b32]">{tr('विशेष अवसर संकल्प:', 'Vishesh Avsar Sankalp:')}</strong>{' '}
                    <span className="text-[#6d5b3d]">
                      {tr(`${occasionLabel} हेतु ₹21 विशेष संकल्प शुल्क`, `${occasionLabel} ke liye ₹21 vishesh sankalp shulk`)}
                    </span>
                  </div>
                </div>
                <span className="font-extrabold text-[#1b4b32] text-xs shrink-0 bg-[#faedd0] px-2.5 py-1 rounded-lg border border-[#d6ba7f]">
                  +₹21 {tr('अतिरिक्त', 'Atirikt')}
                </span>
              </div>
            )}

            {/* Payment error message */}
            {paymentError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Total and Submit CTA */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#ebdcb9]">
              <div>
                <span className="text-xs text-[#716450] font-medium">
                  {tr(`कुल सेवा शुल्क (${getDurationText()}):`, `Kul Seva Shulk (${getDurationText()}):`)}
                </span>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-black text-[#1b4b32]">₹{totalAmount}</div>
                  {isExtraOccasion && (
                    <span className="text-xs text-[#8c7a64] font-medium">
                      {tr(`(₹${baseTotal} सेवा + ₹21 विशेष अवसर)`, `(₹${baseTotal} seva + ₹21 vishesh avsar)`)}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#1b4b32] hover:bg-[#153e29] active:scale-98 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{tr('संकल्प दर्ज हो रहा है...', 'Sankalp Darj Ho Raha Hai...')}</span>
                  </>
                ) : (
                  <>
                    <span>{tr(`सेवा बुक करें एवं ₹${totalAmount} भुगतान करें`, `Seva Book Karein aur ₹${totalAmount} Bhugtan Karein`)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>
        ) : (
          /* Success Screen with Certificate */
          <div className="p-6 text-center space-y-5 overflow-y-auto flex-1">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold tracking-widest text-[#c4821a] uppercase">सङ्कल्प सिद्धम्</span>
              <h4 className="font-playfair text-2xl font-bold text-[#1b4b32]">
                {tr('सेवा संकल्प सफलतापूर्वक दर्ज हुआ!', 'Seva Sankalp Safaltapoorvak Darj Hua!')}
              </h4>
              <p className="text-xs sm:text-sm text-[#5c4e3a] max-w-md mx-auto">
                {tr(
                  `जय गौमाता! आपकी ${bookingReceipt?.sevaTitle} (${bookingReceipt?.duration}) की व्यवस्था सुनिश्चित हो गई है।`,
                  `Jai Gaumata! Aapki ${bookingReceipt?.sevaTitle} (${bookingReceipt?.duration}) ki seva sunishchit ho gayi hai.`
                )}
              </p>
            </div>

            {/* Digital Certificate Box */}
            <div className="bg-[#fff9ea] border-2 border-[#d9ba78] rounded-2xl p-4 text-left max-w-lg mx-auto shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#ebdcb9] pb-2">
                <span className="font-playfair font-bold text-[#1b4b32] text-sm">
                  {tr('गौकृपा • गौमाता आहार व्यवस्था एवं सेवा', 'GauKripa • Gaumata Aahar Vyavastha aur Seva')}
                </span>
                <span className="text-xs font-mono font-bold text-[#8b6f38]">{bookingReceipt?.bookingId}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#887863]">{tr('यजमान / भक्त:', 'Yajman / Bhakt:')}</span>
                  <div className="font-bold text-[#2d3a31]">{bookingReceipt?.devoteeName}</div>
                </div>
                <div>
                  <span className="text-[#887863]">{tr('गोत्र:', 'Gotra:')}</span>
                  <div className="font-bold text-[#2d3a31]">{bookingReceipt?.gotra}</div>
                </div>
                <div>
                  <span className="text-[#887863]">{tr('सेवा एवं अवधि:', 'Seva aur Avadhi:')}</span>
                  <div className="font-bold text-[#1b4b32]">{bookingReceipt?.sevaTitle} ({bookingReceipt?.duration})</div>
                </div>
                <div>
                  <span className="text-[#887863]">
                    {tr('कुल सेवा शुल्क', 'Kul Seva Shulk')}
                    {bookingReceipt?.extraFee > 0 ? tr(' (सहित ₹21 विशेष संकल्प)', ' (₹21 vishesh sankalp sahit)') : ''}:
                  </span>
                  <div className="font-bold text-[#1b4b32]">₹{bookingReceipt?.amount}</div>
                </div>
              </div>

              {bookingReceipt?.familyMembers?.length > 0 && (
                <div className="text-[11px] pt-1 border-t border-[#ebdcb9]">
                  <span className="text-[#887863]">{tr('संकल्प में सम्मिलित परिवार:', 'Sankalp mein Shamil Parivar:')} </span>
                  <span className="font-semibold text-[#1b4b32]">{bookingReceipt.familyMembers.join(', ')}</span>
                </div>
              )}

              <div className="pt-2 border-t border-[#ebdcb9] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[#6d5f4c]">
                <span>
                  {tr('आहार वितरण की वीडियो पुष्टि WhatsApp पर भेजी जाएगी:', 'Aahar vitaran ka video proof WhatsApp par bheja jayega:')}{' '}
                  <strong className="text-[#1b4b32]">+91 {bookingReceipt?.phone}</strong>
                </span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> {tr('प्रत्यक्ष गौशाला सेवा', 'Pratyaksh Goshala Seva')}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-full border border-[#1b4b32] text-[#1b4b32] font-semibold text-xs flex items-center gap-1.5 hover:bg-[#1b4b32]/5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{tr('संकल्प प्रमाणपत्र सहेजें', 'Sankalp Certificate Save Karein')}</span>
              </button>

              <button
                onClick={onClose}
                className="px-6 py-2 rounded-full bg-[#1b4b32] hover:bg-[#153e29] text-white font-semibold text-xs shadow-xs cursor-pointer"
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

