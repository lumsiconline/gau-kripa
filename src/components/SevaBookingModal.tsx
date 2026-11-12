import React, { useState, useEffect } from 'react';
import { X, Sparkles, Download, ArrowRight, User as UserIcon, CheckCircle2, ShieldCheck, Heart, Calendar, Plus, Trash2, Video } from 'lucide-react';
import { SevaItem } from '../data/sevaData';
import { ImageCrop } from './ImageCrop';
import { api } from '../services/api';

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
  hasAstrologerDiscount = false,
  onBookingSuccess,
}) => {
  const [selectedSeva, setSelectedSeva] = useState<SevaItem>(initialSeva);
  const [quantity, setQuantity] = useState<number>(1);
  const [duration, setDuration] = useState<'once' | '7days' | 'monthly' | 'custom'>('once');
  const [customDays, setCustomDays] = useState<number>(11);
  
  // Devotee Sankalp info
  const [devoteeName, setDevoteeName] = useState<string>('Harsh Bhardwaj');
  const [gotra, setGotra] = useState<string>('Kashyap');
  const [phone, setPhone] = useState<string>('9876543210');
  const [sankalpDate, setSankalpDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [sankalpWish, setSankalpWish] = useState<string>('Health, Peace & Removal of Grah Dosh');
  const [occasion, setOccasion] = useState<string>('General Daily Seva');
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

  // Sync selectedSeva whenever a different seva is clicked and modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSeva(initialSeva);
      setQuantity(1);
      setDuration('once');
      setOccasion('General Daily Seva');
      setIsCompleted(false);
      setIsProcessing(false);
      setPaymentError(null);
    }
  }, [initialSeva, isOpen]);

  if (!isOpen) return null;

  const occasionPresets = [
    { name: 'General Daily Seva', isExtra: false },
    { name: 'Diwali / Govardhan Puja', isExtra: true },
    { name: 'Birthday Blessing', isExtra: true },
    { name: 'Wedding Anniversary', isExtra: true },
    { name: 'Purnima / Ekadashi', isExtra: true },
    { name: 'Pitra Shanti / Ancestors', isExtra: true },
    { name: 'Health & Speedy Recovery', isExtra: true },
  ];

  // Extra ₹21 is added only when an extra special occasion is selected
  const isExtraOccasion = occasion !== 'General Daily Seva';
  const extraOccasionFee = isExtraOccasion ? 21 : 0;

  // Calculate pricing based on 1 day, 7 days, 30 days, or custom days
  const calculateBaseTotal = () => {
    const basePerDay = quantity * selectedSeva.basePrice;

    let multiplier = 1;
    if (duration === '7days') multiplier = 7;
    else if (duration === 'monthly') multiplier = 30;
    else if (duration === 'custom') multiplier = Math.max(1, customDays);

    return basePerDay * multiplier;
  };

  const getDurationText = () => {
    if (duration === 'once') return '1 Day (Single Seva)';
    if (duration === '7days') return '7 Days (Weekly Sankalp)';
    if (duration === 'monthly') return '30 Days (Monthly Sankalp)';
    return `${customDays} Days (Custom Sankalp)`;
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

    const cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      setPaymentError('Please enter a valid 10-digit mobile number for Sankalp video proof.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create real order on LIVE backend / Cloud Function
      const amountInPaise = Math.round(totalAmount * 100);
      const receiptId = `gk_seva_${Date.now()}`;
      const order = await api.createOrder(amountInPaise, 'INR', receiptId, {
        sevaTitle: selectedSeva.title,
        devoteeName: devoteeName || 'Devotee',
        phone: cleanPhone,
        gotra: gotra || 'Kashyap',
        occasion
      });

      // 2. Ensure Razorpay checkout.js script is loaded
      if (!(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Unable to load secure Razorpay Checkout.'));
          document.body.appendChild(script);
        });
      }

      const RazorpayCheckout = (window as any).Razorpay;
      if (!RazorpayCheckout) {
        throw new Error('Razorpay Checkout is currently unavailable. Please try again.');
      }

      const keyId = order.key_id || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID;
      if (!keyId) {
        throw new Error('Razorpay LIVE Key ID is not configured.');
      }

      const checkoutOptions: any = {
        key: keyId,
        amount: order.amount || amountInPaise,
        currency: 'INR',
        name: 'GauKripa',
        description: `${selectedSeva.title} • Sacred Seva Sankalp`,
        prefill: {
          name: devoteeName || 'Devotee',
          contact: cleanPhone
        },
        notes: {
          sevaTitle: selectedSeva.title,
          gotra: gotra || 'Kashyap',
          occasion: occasion,
          purpose: 'Sacred Seva Booking'
        },
        theme: { color: '#1b4b32' },
        handler: async (response: any) => {
          try {
            // 3. Cryptographic signature verification on backend
            await api.verifyPayment(
              response.razorpay_order_id || order.order_id || '',
              response.razorpay_payment_id,
              response.razorpay_signature || ''
            );

            const receipt = {
              bookingId: `GK-${Math.floor(100000 + Math.random() * 900000)}`,
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              sevaTitle: selectedSeva.title,
              planet: selectedSeva.planetTag,
              quantity: `${quantity} ${selectedSeva.unit}`,
              duration: getDurationText(),
              devoteeName: devoteeName || 'Devotee',
              gotra: gotra || 'Kashyap',
              familyMembers,
              occasion,
              phone: cleanPhone,
              date: sankalpDate,
              baseAmount: baseTotal,
              extraFee: extraOccasionFee,
              amount: totalAmount,
              goshala: 'Surabhi Seva Dham, Vrindavan',
              astrologerCoupon: 'GAU50-FREE-ASTRO',
              timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
            };

            setBookingReceipt(receipt);
            setIsCompleted(true);
            await api.createBooking({ ...receipt, sevaId: selectedSeva.id });
            if (onBookingSuccess) onBookingSuccess(receipt);
          } catch (verifyErr: any) {
            setPaymentError(verifyErr?.message || 'Payment signature verification failed.');
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
        setPaymentError(resp?.error?.description || 'Razorpay payment was not completed. Please try again.');
        setIsProcessing(false);
      });

      checkout.open();
    } catch (err: any) {
      setPaymentError(err?.message || 'Failed to initiate secure Razorpay checkout.');
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
                {selectedSeva.title} • Sankalp
              </h3>
              <p className="text-xs text-emerald-100/90 font-medium">
                Dedicated Seva at Surabhi Seva Dham, Vrindavan
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
                  <ImageCrop
                    cropKey={selectedSeva.cropKey}
                    className="w-full h-full object-cover"
                    alt={selectedSeva.title}
                  />
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#faedd0]/95 text-[#6d460d] border border-[#d6ba7f] shadow-xs backdrop-blur-xs">
                      {selectedSeva.planetTag}
                    </span>
                  </div>
                </div>

                {/* Details text */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-playfair text-lg sm:text-xl font-bold text-[#1b4b32]">
                      {selectedSeva.title}
                    </h4>
                    <span className="text-base sm:text-lg font-black text-[#1b4b32]">
                      {selectedSeva.priceDisplay}
                    </span>
                  </div>

                  <p className="text-xs text-[#524434] font-medium leading-relaxed">
                    {selectedSeva.detailedDescription}
                  </p>

                  <p className="text-[11px] text-[#715f4a] italic pt-0.5 leading-snug">
                    <strong className="text-[#1b4b32] not-italic">Vedic Mahatmya: </strong>
                    {selectedSeva.vedicSignificance}
                  </p>
                </div>
              </div>

              {/* Benefit Banner */}
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/90 flex items-center gap-2 text-xs text-[#634f31]">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span><strong className="text-[#1b4b32]">Spiritual Benefit:</strong> {selectedSeva.benefit}</span>
              </div>
            </div>

            {/* 2. Quantity & Offering Stepper */}
            <div className="bg-[#fffcf7] p-3.5 rounded-2xl border border-[#ebdcb9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="block text-xs font-bold text-[#453728]">
                  Offering Quantity ({selectedSeva.unit})
                </label>
                <span className="text-[11px] text-[#756653]">
                  Rate: ₹{selectedSeva.basePrice} per {selectedSeva.unit}
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
                  {quantity} {selectedSeva.unit}
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
                Select Sankalp Period (सेवा अवधि)
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
                  <div className="font-bold text-xs">1 Day</div>
                  <div className="text-[10px] opacity-80">Single Sankalp</div>
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
                  <div className="font-bold text-xs">7 Days</div>
                  <div className="text-[10px] opacity-80">Weekly Sankalp</div>
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
                  <div className="font-bold text-xs">30 Days</div>
                  <div className="text-[10px] opacity-80">Full Month Seva</div>
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
                  <div className="font-bold text-xs">Custom Days</div>
                  <div className="text-[10px] opacity-80">Pick any days</div>
                </button>
              </div>

              {/* Custom Days Input & Shortcut Chips (revealed when Custom is selected) */}
              {duration === 'custom' && (
                <div className="p-3 rounded-2xl bg-[#faf3e2] border border-[#e4d4ad] space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1b4b32]">Choose Number of Days:</span>
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
                    <span className="text-[11px] text-[#715f4a] font-medium mr-1">Auspicious Periods:</span>
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
                        {days} Days {days === 40 && '(Mandal)'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4. Occasion Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#453728] uppercase tracking-wider">
                  Occasion (अवसर)
                </label>
                <span className="text-[11px] text-[#786955]">
                  Select an occasion for personalized sankalp
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {occasionPresets.map((occ) => {
                  const isSelected = occasion === occ.name;
                  return (
                    <button
                      key={occ.name}
                      type="button"
                      onClick={() => setOccasion(occ.name)}
                      className={`px-3 py-1.5 text-xs rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#1b4b32] text-white font-bold border-[#1b4b32] shadow-xs'
                          : 'bg-[#fffcf7] text-[#554737] border-[#ebdcb9] hover:bg-[#f6eee0]'
                      }`}
                    >
                      <span>{occ.name}</span>
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
                  Devotee Sacred Sankalp Details
                </span>
                
                {/* Button to add family members */}
                <button
                  type="button"
                  onClick={() => setShowAddMember(true)}
                  className="text-[11px] font-bold text-[#c4821a] hover:text-[#9e6612] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Family Member</span>
                </button>
              </div>

              {/* Family members tag list if added */}
              {familyMembers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-amber-50/80 border border-amber-200">
                  <span className="text-[11px] font-bold text-[#1b4b32] self-center">Family in Sankalp:</span>
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
                    placeholder="Enter family member's name"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#ebdcb9] bg-white text-xs focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleAddMember}
                    className="px-3 py-1.5 rounded-lg bg-[#1b4b32] text-white text-xs font-bold cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddMember(false)}
                    className="px-2 py-1.5 text-xs text-[#756653] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#483d2e] mb-1">
                    Primary Devotee Name (सङ्कल्प कर्ता) *
                  </label>
                  <input
                    type="text"
                    required
                    value={devoteeName}
                    onChange={(e) => setDevoteeName(e.target.value)}
                    placeholder="e.g. Harsh Bhardwaj"
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium focus:outline-hidden focus:border-[#1b4b32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#483d2e] mb-1">
                    Gotra (गोत्र)
                  </label>
                  <input
                    type="text"
                    value={gotra}
                    onChange={(e) => setGotra(e.target.value)}
                    placeholder="e.g. Kashyap / Bhardwaj"
                    className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium focus:outline-hidden focus:border-[#1b4b32]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#483d2e] mb-1">
                    WhatsApp Number (for Video &amp; Photo Proof) *
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
                    Starting Date of Seva
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
                  Prayer / Sankalp Wish (मनोकामना)
                </label>
                <input
                  type="text"
                  value={sankalpWish}
                  onChange={(e) => setSankalpWish(e.target.value)}
                  placeholder="e.g. Family peace, removal of planetary obstacles, prosperity"
                  className="w-full px-3 py-2 rounded-xl border border-[#ebdcb9] bg-[#fffcf5] text-xs font-medium focus:outline-hidden focus:border-[#1b4b32]"
                />
              </div>
            </div>

            {/* Video Proof Guarantee Banner */}
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5">
              <Video className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                <strong>Video Proof:</strong> Video will be shared on your registered number{phone ? ` (+91 ${phone})` : ''}.
              </span>
            </div>

            {/* 6. Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-[#5c4e3a] mb-1.5">
                Select Payment Mode
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
                  ⚡ UPI / QR
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
                  💳 Debit / Card
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
                  🏦 NetBanking
                </button>
              </div>
            </div>

            {/* ₹21 Extra Occasion Fee Banner - Revealed only when extra occasion is selected */}
            {isExtraOccasion && (
              <div className="p-3 rounded-xl bg-[#fff9ea] border border-[#e6c989] flex items-center justify-between text-xs text-[#523d1b] shadow-2xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <span className="text-base text-[#b87611] font-bold">卐</span>
                  <div>
                    <strong className="text-[#1b4b32]">Special Occasion Sankalp:</strong>{' '}
                    <span className="text-[#6d5b3d]">₹21 extra added for {occasion}</span>
                  </div>
                </div>
                <span className="font-extrabold text-[#1b4b32] text-xs shrink-0 bg-[#faedd0] px-2.5 py-1 rounded-lg border border-[#d6ba7f]">
                  +₹21 Extra
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
                <span className="text-xs text-[#716450] font-medium">Total Seva Dakshina ({getDurationText()}):</span>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-black text-[#1b4b32]">₹{totalAmount}</div>
                  {isExtraOccasion && (
                    <span className="text-xs text-[#8c7a64] font-medium">
                      (₹{baseTotal} seva + ₹21 extra occasion)
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
                    <span>Taking Sacred Sankalp...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Seva &amp; Pay ₹{totalAmount}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>
        ) : (
          /* Success Screen with Sacred Certificate */
          <div className="p-6 text-center space-y-5 overflow-y-auto flex-1">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold tracking-widest text-[#c4821a] uppercase">सङ्कल्प सिद्धम्</span>
              <h4 className="font-playfair text-2xl font-bold text-[#1b4b32]">
                Seva Sankalp Registered!
              </h4>
              <p className="text-xs sm:text-sm text-[#5c4e3a] max-w-md mx-auto">
                Jai Gaumata! Your dedicated <strong className="text-[#1b4b32]">{bookingReceipt?.sevaTitle}</strong> for{' '}
                <strong className="text-[#1b4b32]">{bookingReceipt?.duration}</strong> is confirmed.
              </p>
            </div>

            {/* Digital Certificate Box */}
            <div className="bg-[#fff9ea] border-2 border-[#d9ba78] rounded-2xl p-4 text-left max-w-lg mx-auto shadow-xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-[#ebdcb9] pb-2">
                <span className="font-playfair font-bold text-[#1b4b32] text-sm">GauKripa Seva Trust</span>
                <span className="text-xs font-mono font-bold text-[#8b6f38]">{bookingReceipt?.bookingId}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[#887863]">Devotee:</span>
                  <div className="font-bold text-[#2d3a31]">{bookingReceipt?.devoteeName}</div>
                </div>
                <div>
                  <span className="text-[#887863]">Gotra:</span>
                  <div className="font-bold text-[#2d3a31]">{bookingReceipt?.gotra}</div>
                </div>
                <div>
                  <span className="text-[#887863]">Seva &amp; Duration:</span>
                  <div className="font-bold text-[#1b4b32]">{bookingReceipt?.sevaTitle} ({bookingReceipt?.duration})</div>
                </div>
                <div>
                  <span className="text-[#887863]">Total Dakshina{bookingReceipt?.extraFee > 0 ? ' (incl. ₹21 extra)' : ''}:</span>
                  <div className="font-bold text-[#1b4b32]">₹{bookingReceipt?.amount}</div>
                </div>
              </div>

              {bookingReceipt?.familyMembers?.length > 0 && (
                <div className="text-[11px] pt-1 border-t border-[#ebdcb9]">
                  <span className="text-[#887863]">Family in Sankalp: </span>
                  <span className="font-semibold text-[#1b4b32]">{bookingReceipt.familyMembers.join(', ')}</span>
                </div>
              )}

              <div className="pt-2 border-t border-[#ebdcb9] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-[#6d5f4c]">
                <span>Video will be shared on your registered number: <strong className="text-[#1b4b32]">+91 {bookingReceipt?.phone}</strong></span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Priest
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
                <span>Save Sankalp Certificate</span>
              </button>

              <button
                onClick={onClose}
                className="px-6 py-2 rounded-full bg-[#1b4b32] hover:bg-[#153e29] text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
