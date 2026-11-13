// Client API service for GauKripa Full-Stack Application
export interface ServiceItem {
  id: string;
  title: string;
  planet: string;
  planetTag: string;
  tagColor: string;
  priceDisplay: string;
  basePrice: number;
  unit: string;
  minQty: number;
  benefit: string;
  cropKey: 'sevaChara' | 'sevaRoti' | 'sevaGudChana' | 'sevaPakshi' | 'sevaCheenti' | 'sevaDogs';
  customImageUrl?: string;
  detailedDescription: string;
  vedicSignificance: string;
  isActive: boolean;
  category: 'cow' | 'bird' | 'ant' | 'dog' | 'combo' | 'diwali';
}

export interface AstrologerItem {
  id: string;
  name: string;
  title: string;
  experience: string;
  rating: number;
  reviewsCount: string;
  ratePerMin: number;
  cropKey: 'astroSophia' | 'astroRohan' | 'astroMaria';
  customImageUrl?: string;
  languages: string[];
  bio: string;
  specializations: string[];
  isOnline: boolean;
  totalConsultations: number;
  totalEarnings: number;
}

export interface BookingRecord {
  id: string;
  bookingId: string;
  devoteeName: string;
  phone: string;
  email?: string;
  gotra: string;
  sevaId: string;
  sevaTitle: string;
  quantity: string;
  duration: string;
  occasion: string;
  amount: number;
  baseAmount: number;
  extraFee: number;
  status: 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  date: string;
  familyMembers: string[];
  sankalpWish?: string;
  goshala: string;
  videoProofUrl?: string;
  photoProofUrls?: string[];
  priestName?: string;
  whatsappSent?: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'astrologer';
  senderName: string;
  text: string;
  timestamp: string;
  suggestedSeva?: string;
  clientMessageId?: string;
}

export interface ChatSession {
  id: string;
  astrologerId: string;
  astrologerName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerConcern: string;
  birthDate?: string;
  birthTime?: string;
  birthPlace?: string;
  status: 'waiting_approval' | 'active' | 'rejected' | 'ended';
  ratePerMin: number;
  hasDiscount: boolean;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds: number;
  totalCharged: number;
  astrologerEarned: number;
  messages: ChatMessage[];
  lastHeartbeat?: string;
}

export interface WalletInfo {
  phone: string;
  name: string;
  balance: number;
  transactions: {
    id: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    date: string;
  }[];
}

export interface AppSettings {
  standardRatePerMin: number;
  discountedRatePerMin: number;
  discountEnabled: boolean;
  extraOccasionFee: number;
  promoBannerText: string;
  bannerEnabled: boolean;
  trustName: string;
}

export interface ReviewItem {
  id: string;
  name: string;
  city: string;
  seva: string;
  oneLiner: string;
  stars: number;
  isApproved: boolean;
  createdAt: string;
}

import { SEVA_ITEMS, ASTROLOGERS, SevaItem as DefaultSevaItem, Astrologer as DefaultAstrologer } from '../data/sevaData';
import { saveLocalSession, getLocalSession, getAstrologerActiveSession, broadcastChatEvent } from './chatSync';

const rawApiBase = String((import.meta as any).env?.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');
export const API_BASE = rawApiBase
  ? (rawApiBase.endsWith('/api') ? rawApiBase : `${rawApiBase}/api`)
  : '/api';

export function normalizePhone(rawPhone: string | undefined | null, fallback = '9876543210'): string {
  const digits = String(rawPhone || '').replace(/[^0-9]/g, '');
  if (!digits) return fallback;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

// Safe fetch helper that intercepts HTML 404/405 responses from static hosts or undeployed functions
async function safeFetchJson<T>(
  url: string,
  options?: RequestInit
): Promise<{ ok: boolean; data?: T; error?: string; isHtml?: boolean }> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    const text = await res.text();
    const isJson = contentType.includes('application/json') || (text.trim().startsWith('{') && text.trim().endsWith('}')) || (text.trim().startsWith('[') && text.trim().endsWith(']'));

    if (isJson) {
      try {
        const data = JSON.parse(text);
        if (res.ok) {
          return { ok: true, data };
        }
        return { ok: false, error: data?.error || `Request failed (${res.status})`, data };
      } catch {
        return { ok: false, error: 'Malformed JSON response', isHtml: false };
      }
    }

    // Static host or undeployed Cloud Function returned HTML (404 / 405)
    return {
      ok: false,
      isHtml: true,
      error: `Backend endpoint returned HTTP ${res.status}. Use the configured Supabase Edge Functions for hosted production requests.`
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network error connecting to backend server.' };
  }
}

// Initial storage bootstrap helpers for static environments (GitHub Pages, etc.)
function getStoredServices(): ServiceItem[] {
  try {
    const raw = localStorage.getItem('gaukripa_services');
    if (raw) return JSON.parse(raw);
  } catch {}
  const defaults: ServiceItem[] = SEVA_ITEMS.map((s, idx) => ({
    ...s,
    isActive: true,
    category: (idx === 3 ? 'bird' : idx === 4 ? 'ant' : idx === 5 ? 'dog' : 'cow') as any
  }));
  try { localStorage.setItem('gaukripa_services', JSON.stringify(defaults)); } catch {}
  return defaults;
}

function getStoredAstrologers(): AstrologerItem[] {
  try {
    const raw = localStorage.getItem('gaukripa_astrologers');
    if (raw) return JSON.parse(raw);
  } catch {}
  const defaults: AstrologerItem[] = ASTROLOGERS.map((a, idx) => ({
    ...a,
    isOnline: true,
    totalConsultations: 120 + idx * 45,
    totalEarnings: 24000 + idx * 8500
  }));
  try { localStorage.setItem('gaukripa_astrologers', JSON.stringify(defaults)); } catch {}
  return defaults;
}

export const api = {
  // Services
  getServices: async (all = false): Promise<ServiceItem[]> => {
    try {
      const { supabaseRest, getSupabaseSession } = await import('./supabaseClient');
      const session = getSupabaseSession();
      const filters = all && session?.access_token ? '' : '&is_active=eq.true';
      const rows = await supabaseRest<Array<{data: ServiceItem; is_active: boolean}>>(
        'services', `?select=data,is_active&order=created_at.asc${filters}`, session?.access_token
      );
      return rows.map((row) => ({ ...row.data, isActive: row.is_active }));
    } catch (error) {
      console.error('Supabase services read failed', error);
      const services = getStoredServices();
      return all ? services : services.filter((item) => item.isActive);
    }
  },

  createService: async (service: Partial<ServiceItem>): Promise<ServiceItem> => {
    const newService: ServiceItem = {
      id: service.id || `seva-${Date.now()}`,
      title: service.title || 'New Sacred Seva',
      planet: service.planet || 'Surya Grah',
      planetTag: service.planetTag || '☀️ Surya Grah',
      tagColor: service.tagColor || 'bg-amber-100 text-amber-900 border-amber-300',
      priceDisplay: service.priceDisplay || `₹${service.basePrice || 251}`,
      basePrice: service.basePrice || 251,
      unit: service.unit || 'unit',
      minQty: service.minQty || 1,
      benefit: service.benefit || 'Brings peace and positive karma.',
      cropKey: (service.cropKey as any) || 'sevaChara',
      customImageUrl: service.customImageUrl,
      detailedDescription: service.detailedDescription || 'Sacred Gau Seva performed with Vedic rituals.',
      vedicSignificance: service.vedicSignificance || 'Pleasing Gaumata brings blessings of Lord Krishna.',
      isActive: service.isActive !== false,
      category: service.category || 'cow'
    };
    const { supabaseMutation } = await import('./supabaseClient');
    const rows = await supabaseMutation<Array<{data: ServiceItem}>>(
      'services', 'POST', '?select=data', [{ id: newService.id, data: newService, is_active: newService.isActive }]
    );
    if (!rows[0]?.data) throw new Error('Supabase did not save the seva service.');
    return rows[0].data;
  },

  updateService: async (id: string, service: Partial<ServiceItem>): Promise<ServiceItem> => {
    const current = (await api.getServices(true)).find((item) => item.id === id);
    if (!current) throw new Error('Seva service was not found.');
    const updated = { ...current, ...service, id };
    const { supabaseMutation } = await import('./supabaseClient');
    const rows = await supabaseMutation<Array<{data: ServiceItem}>>(
      'services', 'PATCH', `?id=eq.${encodeURIComponent(id)}&select=data`,
      { data: updated, is_active: updated.isActive, updated_at: new Date().toISOString() }
    );
    if (!rows[0]?.data) throw new Error('Supabase did not update the seva service.');
    return rows[0].data;
  },

  deleteService: async (id: string): Promise<boolean> => {
    const { supabaseMutation } = await import('./supabaseClient');
    await supabaseMutation('services', 'DELETE', `?id=eq.${encodeURIComponent(id)}`);
    return true;
  },

  // Astrologers
  getAstrologers: async (): Promise<AstrologerItem[]> => {
    try {
      const { supabaseRest, getSupabaseSession } = await import('./supabaseClient');
      const session = getSupabaseSession();
      const rows = await supabaseRest<Array<{data: AstrologerItem; is_online: boolean}>>(
        'astrologers', '?select=data,is_online&order=created_at.asc', session?.access_token
      );
      return rows.map((row) => ({ ...row.data, isOnline: row.is_online }));
    } catch (error) {
      console.error('Supabase astrologers read failed', error);
      return getStoredAstrologers();
    }
  },

  createAstrologer: async (astro: Partial<AstrologerItem>): Promise<AstrologerItem> => {
    const newAstro: AstrologerItem = {
      id: astro.id || `astro-${Date.now()}`,
      name: astro.name || 'New Astrologer',
      title: astro.title || 'Vedic Jyotish Expert',
      experience: astro.experience || '10+ Years Experience',
      rating: astro.rating || 4.9,
      reviewsCount: astro.reviewsCount || '1k+ reviews',
      ratePerMin: astro.ratePerMin || 20,
      cropKey: (astro.cropKey as any) || 'astroSophia',
      customImageUrl: astro.customImageUrl,
      languages: astro.languages || ['Hindi', 'English'],
      bio: astro.bio || 'Vedic astrologer trained in Parashara Jyotish.',
      specializations: astro.specializations || ['Kundali', 'Grah Shanti'],
      isOnline: astro.isOnline !== false,
      totalConsultations: astro.totalConsultations || 0,
      totalEarnings: astro.totalEarnings || 0
    };
    const { supabaseMutation } = await import('./supabaseClient');
    const rows = await supabaseMutation<Array<{data: AstrologerItem}>>(
      'astrologers', 'POST', '?select=data', [{ id: newAstro.id, data: newAstro, is_online: newAstro.isOnline }]
    );
    if (!rows[0]?.data) throw new Error('Supabase did not save the astrologer.');
    return rows[0].data;
  },

  updateAstrologer: async (id: string, astro: Partial<AstrologerItem>): Promise<AstrologerItem> => {
    const current = (await api.getAstrologers()).find((item) => item.id === id);
    if (!current) throw new Error('Astrologer was not found.');
    const updated = { ...current, ...astro, id };
    const { supabaseMutation } = await import('./supabaseClient');
    const rows = await supabaseMutation<Array<{data: AstrologerItem}>>(
      'astrologers', 'PATCH', `?id=eq.${encodeURIComponent(id)}&select=data`,
      { data: updated, is_online: updated.isOnline, updated_at: new Date().toISOString() }
    );
    if (!rows[0]?.data) throw new Error('Supabase did not update the astrologer.');
    return rows[0].data;
  },

  setAstrologerAvailability: async (id: string, isOnline: boolean): Promise<boolean> => {
    const current = (await api.getAstrologers()).find((item) => item.id === id);
    if (!current) throw new Error('Astrologer was not found.');
    const updated = { ...current, isOnline };
    const { supabaseMutation } = await import('./supabaseClient');
    await supabaseMutation(
      'astrologers', 'PATCH', `?id=eq.${encodeURIComponent(id)}`,
      { data: updated, is_online: isOnline, updated_at: new Date().toISOString() }
    );
    return isOnline;
  },

  // Bookings
  getBookings: async (phone?: string): Promise<BookingRecord[]> => {
    const { supabaseRest, getSupabaseSession } = await import('./supabaseClient');
    const session = getSupabaseSession();
    if (!session?.access_token) return [];
    const phoneFilter = phone ? `&phone=eq.${encodeURIComponent(normalizePhone(phone,''))}` : '';
    const rows = await supabaseRest<Array<{id:string;booking_id:string;phone:string;email:string|null;status:string;amount:number;data:BookingRecord;created_at:string}>>(
      'bookings', `?select=id,booking_id,phone,email,status,amount,data,created_at&order=created_at.desc${phoneFilter}`, session.access_token
    );
    return rows.map((row) => ({ ...row.data, id: row.id, bookingId: row.booking_id, phone: row.phone, email: row.email || undefined, status: row.status as BookingRecord['status'], amount: Number(row.amount), createdAt: row.created_at }));
  },

  createBooking: async (booking: Partial<BookingRecord>): Promise<BookingRecord> => {
    const { supabaseRest, supabaseMutation, getSupabaseSession } = await import('./supabaseClient');
    const session = getSupabaseSession();
    if (!session?.access_token) throw new Error('Please sign in before booking a seva.');
    const profiles = await supabaseRest<Array<{id:string;phone:string|null;email:string}>>(
      'app_users', '?select=id,phone,email&limit=1', session.access_token
    );
    const profile = profiles[0];
    if (!profile) throw new Error('Your account profile is not ready. Please sign in again.');
    const newBooking: BookingRecord = {
      id: booking.id || `bkg-${crypto.randomUUID()}`,
      bookingId: booking.bookingId || `GK-${Math.floor(100000 + Math.random() * 900000)}`,
      devoteeName: booking.devoteeName || 'Devotee',
      phone: profile.phone || booking.phone || '',
      email: profile.email,
      gotra: booking.gotra || '',
      sevaId: booking.sevaId || '',
      sevaTitle: booking.sevaTitle || '',
      quantity: booking.quantity || '1 unit',
      duration: booking.duration || '1 Day',
      occasion: booking.occasion || 'General Daily Seva',
      amount: Number(booking.amount || 0),
      baseAmount: Number(booking.baseAmount || booking.amount || 0),
      extraFee: Number(booking.extraFee || 0),
      status: 'confirmed',
      date: booking.date || new Date().toISOString().split('T')[0],
      familyMembers: booking.familyMembers || [],
      sankalpWish: booking.sankalpWish,
      goshala: booking.goshala || '',
      createdAt: new Date().toISOString()
    };
    const rows = await supabaseMutation<Array<{id:string}>>(
      'bookings', 'POST', '?select=id',
      [{ id: newBooking.id, booking_id: newBooking.bookingId, user_id: profile.id, phone: newBooking.phone, email: newBooking.email, status: newBooking.status, amount: newBooking.amount, data: newBooking }]
    );
    if (!rows[0]) throw new Error('Supabase did not save the seva booking.');
    return newBooking;
  },

  updateBookingStatus: async (id: string, status: BookingRecord['status']): Promise<BookingRecord> => {
    const { supabaseRest, supabaseMutation, getSupabaseSession } = await import('./supabaseClient');
    const session = getSupabaseSession();
    if (!session?.access_token) throw new Error('Please sign in with an administrator account.');
    const rows = await supabaseRest<Array<{data:BookingRecord}>>(
      'bookings', `?select=data&id=eq.${encodeURIComponent(id)}&limit=1`, session.access_token
    );
    if (!rows[0]) throw new Error('Booking was not found or access is denied.');
    const updated = { ...rows[0].data, status };
    await supabaseMutation('bookings', 'PATCH', `?id=eq.${encodeURIComponent(id)}`, { status, data: updated, updated_at: new Date().toISOString() });
    return updated;
  },

  uploadBookingProof: async (
    id: string,
    proof: { videoProofUrl?: string; photoProofUrls?: string[]; priestName?: string; status?: string }
  ): Promise<BookingRecord> => {
    const { supabaseRest, supabaseMutation, getSupabaseSession } = await import('./supabaseClient');
    const session = getSupabaseSession();
    if (!session?.access_token) throw new Error('Please sign in with an administrator account.');
    const rows = await supabaseRest<Array<{data:BookingRecord}>>(
      'bookings', `?select=data&id=eq.${encodeURIComponent(id)}&limit=1`, session.access_token
    );
    if (!rows[0]) throw new Error('Booking was not found or access is denied.');
    const updated = { ...rows[0].data, ...proof, status: proof.status || 'completed' };
    await supabaseMutation('bookings', 'PATCH', `?id=eq.${encodeURIComponent(id)}`, { status: updated.status, data: updated, updated_at: new Date().toISOString() });
    return updated;
  },

  // Wallet: balances and transaction history (Supabase Edge Function)
  getWallet: async (phone: string): Promise<WalletInfo> => {
    const cleanPhone = normalizePhone(phone, '');
    if (cleanPhone.length !== 10) throw new Error('Please sign in with a valid mobile number.');
    const { invokeGauKripaPayments } = await import('./supabaseClient');
    const wallet = await invokeGauKripaPayments<WalletInfo>({ action: 'get-wallet', phone: cleanPhone });
    try { localStorage.setItem(`gaukripa_wallet_${cleanPhone}`, JSON.stringify(wallet)); } catch {}
    return wallet;
  },

  // Standard Razorpay Checkout Methods (Express Backend LIVE Payments)
  createOrder: async (amountInPaise: number, currency = 'INR', receipt?: string, notes?: Record<string, string>) => {
    if (!amountInPaise || amountInPaise < 100) {
      throw new Error('Minimum order amount must be at least 100 paise (₹1).');
    }

    const payload = {
      amount: amountInPaise,
      amountInPaise,
      isPaise: true,
      currency,
      receipt: receipt || `gk_${Date.now()}`,
      notes
    };

    const res = await safeFetchJson<{ order_id?: string; orderId?: string; amount: number; currency: string; key_id?: string; keyId?: string }>(
      `${API_BASE}/create-order`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    const orderId = res.data?.order_id || res.data?.orderId;
    const keyId = res.data?.key_id || res.data?.keyId || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID;

    if (res.ok && orderId && keyId) {
      return {
        order_id: orderId,
        amount: res.data?.amount || amountInPaise,
        currency: (res.data?.currency || 'INR') as string,
        key_id: keyId
      };
    }
    throw new Error(res.error || 'Unable to create Razorpay order. Please check the payment server.');
  },

  verifyPayment: async (order_id: string, payment_id: string, signature: string) => {
    if (!order_id || !payment_id || !signature) {
      throw new Error('order_id, payment_id, and signature are required.');
    }

    const res = await safeFetchJson<{ success: boolean; verified: boolean; message: string }>(
      `${API_BASE}/verify-payment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id, payment_id, signature })
      }
    );

    if (res.ok && res.data?.success && res.data?.verified) {
      return res.data;
    }
    throw new Error(res.error || 'Payment verification failed. Please contact support before retrying.');
  },

  createWalletOrder: async (phone: string, amount: number, name: string, email?: string) => {
    const numAmount = Number(amount);
    if (!Number.isInteger(numAmount) || numAmount < 50 || numAmount > 100000) {
      throw new Error('Minimum wallet recharge is ₹50 (whole-rupee amount up to ₹1,00,000).');
    }
    const cleanPhone = normalizePhone(phone, '');
    if (cleanPhone.length !== 10) throw new Error('Please add a valid 10-digit mobile number to your profile.');
    const { invokeGauKripaPayments } = await import('./supabaseClient');
    const result = await invokeGauKripaPayments<{order_id:string;amount:number;currency:string;key_id:string}>({
      action: 'create-order', phone: cleanPhone, amount: numAmount, name, email
    });
    if (!result.order_id || !result.key_id) throw new Error('Supabase did not return a valid Razorpay order.');
    return result;
  },

  verifyWalletPayment: async (payload: { order_id: string; payment_id: string; signature: string; phone: string; amount?: number }) => {
    if (!payload.order_id || !payload.payment_id || !payload.signature) {
      throw new Error('Missing Razorpay payment signature details. Verification cannot proceed.');
    }
    const cleanPhone = normalizePhone(payload.phone, '');
    if (cleanPhone.length !== 10) throw new Error('A valid 10-digit mobile number is required to verify wallet payment.');
    const { invokeGauKripaPayments } = await import('./supabaseClient');
    const result = await invokeGauKripaPayments<{success:boolean;verified:boolean;credited:boolean;already_credited:boolean;balance:number}>({
      action: 'verify-payment',
      order_id: payload.order_id,
      payment_id: payload.payment_id,
      signature: payload.signature,
      phone: cleanPhone
    });
    if (!result.success || !result.verified) throw new Error('Razorpay payment could not be verified.');
    return {
      success: true,
      verified: true,
      credited: result.credited,
      balance: Number(result.balance || 0)
    };
  },

  topupWallet: async (_phone: string, _amount: number, _name?: string): Promise<WalletInfo> => {
    throw new Error('Use secure Razorpay Checkout to recharge this wallet.');
  },

  checkDiscount: async (
    phone: string
  ): Promise<{ eligible: boolean; ratePerMin: number; standardRate: number; discountedRate: number; rule: string }> => {
    const cleanPhone = normalizePhone(phone);
    const res = await safeFetchJson<{ eligible: boolean; ratePerMin: number; standardRate: number; discountedRate: number; rule: string }>(
      `${API_BASE}/wallet/discount-check/${encodeURIComponent(cleanPhone)}`
    );
    if (res.ok && res.data) return res.data;

    // Check if phone has any booking in localStorage
    try {
      const stored = localStorage.getItem('gaukripa_bookings');
      if (stored) {
        const bookings: BookingRecord[] = JSON.parse(stored);
        const hasBooking = bookings.some((b) => normalizePhone(b.phone) === cleanPhone || b.phone.includes(cleanPhone));
        if (hasBooking) {
          return { eligible: true, ratePerMin: 10, standardRate: 20, discountedRate: 10, rule: '50% Seva Discount Applied' };
        }
      }
    } catch {}
    return { eligible: false, ratePerMin: 20, standardRate: 20, discountedRate: 10, rule: 'Standard Consultation Rate' };
  },

  // Live Chat Workflow (Unified Real-Time 2-Way Sync)
  requestChat: async (payload: {
    astrologerId: string;
    customerId?: string;
    customerName: string;
    customerPhone: string;
    customerConcern: string;
    birthDate: string;
    birthTime: string;
    birthPlace: string;
    initialMessages?: ChatMessage[];
  }): Promise<{ success: boolean; session: ChatSession }> => {
    // 1. Try hitting the server API
    const res = await safeFetchJson<{ success: boolean; session: ChatSession }>(`${API_BASE}/chat/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    let session: ChatSession;
    if (res.ok && res.data?.session) {
      session = res.data.session;
    } else {
      // 2. Client-side static fallback
      const astros = getStoredAstrologers();
      const astro = astros.find((a) => a.id === payload.astrologerId) || astros[0];
      const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const defaultMessages: ChatMessage[] = payload.initialMessages && payload.initialMessages.length > 0
        ? payload.initialMessages
        : [
            {
              id: `msg-intake-${Date.now()}`,
              sender: 'customer',
              senderName: payload.customerName || 'Devotee',
              text: `📋 VEDIC KUNDALI INTAKE DETAILS:\n• Name: ${payload.customerName}\n• Date of Birth: ${payload.birthDate}\n• Birth Time: ${payload.birthTime}\n• Birth Place: ${payload.birthPlace}\n• Guidance Needed: ${payload.customerConcern || 'Kundali & Grah Upay guidance'}\n\nPranam Guruji! Here are my complete birth details. Please analyze my chart and guide me.`,
              timestamp: currentTimeStr
            },
            {
              id: `msg-welcome-${Date.now() + 1}`,
              sender: 'astrologer',
              senderName: astro?.name || 'Vedic Astrologer',
              text: `Pranam ${payload.customerName} ji! 🙏 Har Har Mahadev. I have received your complete birth details (DOB: ${payload.birthDate}, Time: ${payload.birthTime}, Place: ${payload.birthPlace}). I am analyzing your Lagna Kundali now for ${payload.customerConcern || 'your spiritual guidance'}. Please feel free to ask your questions.`,
              timestamp: currentTimeStr
            }
          ];

      session = {
        id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        astrologerId: payload.astrologerId,
        astrologerName: astro?.name || 'Vedic Astrologer',
        customerId: payload.customerId || payload.customerPhone,
        customerName: payload.customerName || 'Devotee',
        customerPhone: payload.customerPhone,
        customerConcern: payload.customerConcern || 'Vedic Guidance',
        birthDate: payload.birthDate,
        birthTime: payload.birthTime,
        birthPlace: payload.birthPlace,
        status: 'active',
        ratePerMin: 20,
        hasDiscount: true,
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        durationSeconds: 0,
        totalCharged: 0,
        astrologerEarned: 0,
        messages: defaultMessages
      };
    }

    // Persist and broadcast live event to Astro Dashboard
    saveLocalSession(session);
    broadcastChatEvent({ type: 'NEW_CHAT_REQUEST', session });

    return { success: true, session };
  },

  getIncomingChat: async (astrologerId: string): Promise<ChatSession | null> => {
    const targetAstro = astrologerId || 'all';
    // Check server first
    const res = await safeFetchJson<{ incoming: ChatSession | null }>(`${API_BASE}/chat/incoming/${encodeURIComponent(targetAstro)}`);
    if (res.ok && res.data?.incoming) {
      saveLocalSession(res.data.incoming);
      return res.data.incoming;
    }

    // Check local session store
    if (targetAstro !== 'all') {
      const local = getAstrologerActiveSession(targetAstro);
      if (local) return local;
    } else {
      // Look across all stored sessions for any active or waiting consultation
      try {
        const latestId = localStorage.getItem('gaukripa_latest_chat_id');
        if (latestId) {
          const s = getLocalSession(latestId);
          if (s && (s.status === 'active' || s.status === 'waiting_approval')) return s;
        }
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('gaukripa_session_')) {
            const raw = localStorage.getItem(k);
            if (raw) {
              const sess: ChatSession = JSON.parse(raw);
              if (sess.status === 'active' || sess.status === 'waiting_approval') return sess;
            }
          }
        }
      } catch {}
    }

    try {
      const raw = localStorage.getItem(`gaukripa_incoming_chat_${targetAstro}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  },

  respondChat: async (sessionId: string, astrologerId: string, action: 'accept' | 'reject'): Promise<ChatSession> => {
    const res = await safeFetchJson<{ session: ChatSession }>(`${API_BASE}/chat/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, astrologerId, action })
    });

    let session: ChatSession;
    if (res.ok && res.data?.session) {
      session = res.data.session;
    } else {
      const existing = getLocalSession(sessionId);
      session = existing || (await api.getChatSession(sessionId)).session;
      if (action === 'accept') {
        session.status = 'active';
        if (!session.startedAt) session.startedAt = new Date().toISOString();
      } else {
        session.status = 'rejected';
        session.endedAt = new Date().toISOString();
      }
    }

    saveLocalSession(session);
    broadcastChatEvent({ type: 'CHAT_ACCEPTED', session });
    return session;
  },

  getChatSession: async (sessionId: string): Promise<{ session: ChatSession; customerWalletBalance: number }> => {
    // 1. Check local session first for instant retrieval
    const local = getLocalSession(sessionId);

    // 2. Check server
    const res = await safeFetchJson<{ session: ChatSession; customerWalletBalance: number }>(`${API_BASE}/chat/session/${sessionId}`);
    if (res.ok && res.data?.session) {
      // Merge messages if server has more
      if (local && local.messages.length > (res.data.session.messages?.length || 0)) {
        res.data.session.messages = local.messages;
      }
      saveLocalSession(res.data.session);
      return res.data;
    }

    if (local) {
      return { session: local, customerWalletBalance: 0 };
    }

    throw new Error('Chat session not found');
  },

  sendChatMessage: async (
    sessionId: string,
    payload: {
      sender: 'customer' | 'astrologer';
      senderName?: string;
      text: string;
      suggestedSeva?: string;
      clientMessageId?: string;
    }
  ): Promise<ChatMessage> => {
    // Persist first; only broadcast the server-confirmed message once.
    const res = await safeFetchJson<{ success: boolean; message: ChatMessage; session: ChatSession }>(
      `${API_BASE}/chat/session/${sessionId}/message`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    if (res.ok && res.data?.message && res.data?.session) {
      saveLocalSession(res.data.session);
      broadcastChatEvent({
        type: 'NEW_MESSAGE',
        sessionId,
        message: res.data.message,
        session: res.data.session
      });
      return res.data.message;
    }

    // Offline fallback: append exactly once to the local session.
    const local = getLocalSession(sessionId);
    if (!local) throw new Error('Chat session is unavailable. Please reconnect and try again.');
    const message: ChatMessage = {
      id: payload.clientMessageId || `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sender: payload.sender,
      senderName: payload.senderName || (payload.sender === 'customer' ? 'Devotee' : 'Vedic Astrologer'),
      text: payload.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedSeva: payload.suggestedSeva
    };
    if (!local.messages.some((item) => item.id === message.id)) {
      local.messages.push(message);
      saveLocalSession(local);
      broadcastChatEvent({ type: 'NEW_MESSAGE', sessionId, message, session: local });
    }
    return message;
  },

  sendChatHeartbeat: async (
    sessionId: string
  ): Promise<{
    durationSeconds: number;
    totalCharged: number;
    astrologerEarned: number;
    walletBalance: number;
    status: string;
  }> => {
    const res = await safeFetchJson<{
      durationSeconds: number;
      totalCharged: number;
      astrologerEarned: number;
      walletBalance: number;
      status: string;
    }>(`${API_BASE}/chat/session/${sessionId}/heartbeat`, { method: 'POST' });
    if (res.ok && res.data) return res.data;

    const { session, customerWalletBalance } = await api.getChatSession(sessionId);
    session.durationSeconds = (session.durationSeconds || 0) + 5;
    const costPer5s = session.ratePerMin / 12;
    session.totalCharged = Number(((session.totalCharged || 0) + costPer5s).toFixed(2));
    session.astrologerEarned = Number((session.totalCharged * 0.7).toFixed(2));
    const newBal = Math.max(0, Number((customerWalletBalance - costPer5s).toFixed(2)));

    if (newBal <= 0) {
      session.status = 'ended';
      session.endedAt = new Date().toISOString();
    }

    try {
      localStorage.setItem(`gaukripa_chat_session_${sessionId}`, JSON.stringify(session));
      const w = await api.getWallet(session.customerPhone);
      w.balance = newBal;
      localStorage.setItem(`gaukripa_wallet_${session.customerPhone}`, JSON.stringify(w));
      window.dispatchEvent(new Event('storage'));
    } catch {}

    return {
      durationSeconds: session.durationSeconds,
      totalCharged: session.totalCharged,
      astrologerEarned: session.astrologerEarned,
      walletBalance: newBal,
      status: session.status
    };
  },

  endChat: async (sessionId: string): Promise<ChatSession> => {
    // Broadcast immediately so all listeners react instantly
    broadcastChatEvent({ type: 'CHAT_ENDED', sessionId });

    const res = await safeFetchJson<{ session: ChatSession }>(`${API_BASE}/chat/session/${sessionId}/end`, { method: 'POST' });
    if (res.ok && res.data?.session) {
      saveLocalSession(res.data.session);
      return res.data.session;
    }

    const { session } = await api.getChatSession(sessionId);
    session.status = 'ended';
    session.endedAt = new Date().toISOString();
    saveLocalSession(session);
    try {
      localStorage.setItem(`gaukripa_chat_session_${sessionId}`, JSON.stringify(session));
      window.dispatchEvent(new Event('storage'));
    } catch {}
    return session;
  },

  getAstrologerChatHistory: async (
    astrologerId: string
  ): Promise<{
    sessions: ChatSession[];
    analytics: {
      totalConsultations: number;
      todayEarnings: number;
      weeklyEarnings: number;
      monthlyEarnings: number;
    };
  }> => {
    const isAll = !astrologerId || astrologerId === 'all';
    const res = await safeFetchJson<{
      sessions: ChatSession[];
      analytics: {
        totalConsultations: number;
        todayEarnings: number;
        weeklyEarnings: number;
        monthlyEarnings: number;
      };
    }>(`${API_BASE}/chat/history/${encodeURIComponent(isAll ? 'all' : astrologerId)}`);
    if (res.ok && res.data) return res.data;

    const matchedSessions: ChatSession[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('gaukripa_chat_session_') || key.startsWith('gaukripa_session_'))) {
          const s: ChatSession = JSON.parse(localStorage.getItem(key) || '{}');
          if (s && s.id && (isAll || s.astrologerId === astrologerId)) {
            if (!matchedSessions.some((existing) => existing.id === s.id)) {
              matchedSessions.push(s);
            }
          }
        }
      }
    } catch {}

    const totalEarned = matchedSessions.reduce((sum, s) => sum + (s.astrologerEarned || 0), 0);
    return {
      sessions: matchedSessions,
      analytics: {
        totalConsultations: matchedSessions.length,
        todayEarnings: totalEarned,
        weeklyEarnings: Math.round(totalEarned * 0.4),
        monthlyEarnings: totalEarned
      }
    };
  },

  // Settings
  getSettings: async (): Promise<AppSettings> => {
    try {
      const { supabaseRest, getSupabaseSession } = await import('./supabaseClient');
      const session = getSupabaseSession();
      const rows = await supabaseRest<Array<{data: AppSettings}>>(
        'app_settings', '?select=data&id=eq.global&limit=1', session?.access_token
      );
      if (rows[0]?.data) return rows[0].data;
    } catch (error) {
      console.error('Supabase settings read failed', error);
    }
    try {
      const stored = localStorage.getItem('gaukripa_settings');
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      standardRatePerMin: 20,
      discountedRatePerMin: 10,
      discountEnabled: true,
      extraOccasionFee: 21,
      promoBannerText: 'Flat 50% Off On Astrologer Consultation After Booking Any Gau Seva!',
      bannerEnabled: true,
      trustName: 'GauKripa Seva Trust'
    };
  },

  updateSettings: async (settings: Partial<AppSettings>): Promise<AppSettings> => {
    const current = await api.getSettings();
    const updated = { ...current, ...settings };
    const { supabaseMutation } = await import('./supabaseClient');
    await supabaseMutation(
      'app_settings', 'PATCH', '?id=eq.global',
      { data: updated, updated_at: new Date().toISOString() }
    );
    return updated;
  },

  // Reviews
  getReviews: async (): Promise<ReviewItem[]> => {
    try {
      const { supabaseRest } = await import('./supabaseClient');
      const rows = await supabaseRest<Array<{data: ReviewItem}>>(
        'reviews', '?select=data&order=created_at.desc'
      );
      return rows.map((row) => ({ ...row.data, isApproved: Boolean((row.data as any).isApproved) }));
    } catch (error) {
      console.error('Supabase reviews read failed', error);
      try {
        const stored = localStorage.getItem('gaukripa_reviews');
        if (stored) return JSON.parse(stored);
      } catch {}
      return [];
    }
  },

  createReview: async (review: Partial<ReviewItem>): Promise<ReviewItem> => {
    const res = await safeFetchJson<{ review: ReviewItem }>(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
    if (res.ok && res.data?.review) return res.data.review;

    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      name: review.name || 'Devotee',
      city: review.city || 'India',
      seva: review.seva || 'Gau Seva',
      oneLiner: review.oneLiner || 'Sacred experience with GauKripa.',
      stars: review.stars || 5,
      isApproved: true,
      createdAt: new Date().toISOString()
    };
    const reviews = await api.getReviews();
    reviews.unshift(newRev);
    try { localStorage.setItem('gaukripa_reviews', JSON.stringify(reviews)); } catch {}
    return newRev;
  },

  approveReview: async (id: string, isApproved: boolean): Promise<ReviewItem> => {
    const res = await safeFetchJson<{ review: ReviewItem }>(`${API_BASE}/reviews/${id}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isApproved })
    });
    if (res.ok && res.data?.review) return res.data.review;

    const reviews = await api.getReviews();
    const idx = reviews.findIndex((r) => r.id === id);
    if (idx !== -1) {
      reviews[idx].isApproved = isApproved;
      try { localStorage.setItem('gaukripa_reviews', JSON.stringify(reviews)); } catch {}
      return reviews[idx];
    }
    return { id, isApproved } as any;
  },

  deleteReview: async (id: string): Promise<boolean> => {
    const res = await safeFetchJson<{ success: boolean }>(`${API_BASE}/reviews/${id}`, { method: 'DELETE' });
    if (res.ok) return true;

    const reviews = (await api.getReviews()).filter((r) => r.id !== id);
    try { localStorage.setItem('gaukripa_reviews', JSON.stringify(reviews)); } catch {}
    return true;
  },

  // Media Upload helper (supports file reader data URLs on static hosts)
  uploadMediaFile: async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          // Try backend endpoint first
          const res = await safeFetchJson<{ url: string }>(`${API_BASE}/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataUrl, fileName: file.name })
          });
          if (res.ok && res.data?.url) {
            resolve(res.data.url);
          } else {
            // On static hosts (GitHub Pages), resolve dataUrl directly
            resolve(dataUrl);
          }
        } catch {
          resolve(reader.result as string);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  },

  getDatabaseStatus: async (): Promise<{
    connected: boolean;
    projectId: string;
    databaseId?: string;
    collections?: Record<string, number>;
    error?: string;
  }> => {
    try {
      const { supabaseRest } = await import('./supabaseClient');
      const [services, astrologers, reviews] = await Promise.all([
        supabaseRest<Array<{id:string}>>('services', '?select=id&is_active=eq.true'),
        supabaseRest<Array<{id:string}>>('astrologers', '?select=id&is_online=eq.true'),
        supabaseRest<Array<{id:string}>>('reviews', '?select=id&is_approved=eq.true')
      ]);
      return {
        connected: true,
        projectId: 'nwvsesrnhuhcihftagcp',
        databaseId: 'Supabase PostgreSQL',
        collections: { services: services.length, astrologers: astrologers.length, reviews: reviews.length }
      };
    } catch (error: any) {
      return {
        connected: false,
        projectId: 'nwvsesrnhuhcihftagcp',
        databaseId: 'Supabase PostgreSQL',
        error: error?.message || 'Unable to connect to Supabase.'
      };
    }
  },

  // User Registration
  registerUser: async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const name = (data.name || '').trim();
    const email = (data.email || '').trim().toLowerCase();
    const password = (data.password || '').trim();
    const phone = normalizePhone(data.phone, '');

    if (!name) throw new Error('Please enter your full name.');
    if (!email) throw new Error('Please enter your email address.');
    if (password.length < 8) throw new Error('Password must be at least 8 characters long.');

    const { supabaseAuth } = await import('./supabaseClient');
    await supabaseAuth('signup', {
      email,
      password,
      data: { full_name: name, phone }
    });

    return {
      success: true,
      message: 'Account created. If email confirmation is enabled, verify your email before signing in.'
    };
  },

  // Supabase Auth is the only authentication authority; no browser-side password hashes.
  login: async (credentials: { email: string; password: string; phone?: string }): Promise<{
    success: boolean;
    user: {
      name: string;
      email: string;
      role: 'super_admin' | 'devotee';
      phone?: string;
      isAdmin?: boolean;
    };
  }> => {
    const email = (credentials.email || '').trim().toLowerCase();
    const password = (credentials.password || '').trim();
    if (!email) throw new Error('Please enter your email address.');
    if (!password) throw new Error('Please enter your password.');

    const { supabaseAuth, saveSupabaseSession, supabaseRest } = await import('./supabaseClient');
    const session = await supabaseAuth('token?grant_type=password', { email, password });
    if (!session?.access_token || !session?.user?.id) {
      throw new Error('Supabase did not return a valid login session.');
    }
    await saveSupabaseSession(session);

    type Profile = { full_name: string; email: string; phone: string | null; role: string };
    const profiles = await supabaseRest<Profile[]>(
      'app_users',
      `?select=full_name,email,phone,role&auth_user_id=eq.${encodeURIComponent(session.user.id)}&limit=1`,
      session.access_token
    );
    const profile = profiles[0];
    const role = profile?.role === 'super_admin' || profile?.role === 'admin' ? 'super_admin' : 'devotee';
    const user = {
      name: profile?.full_name || String(session.user.user_metadata?.full_name || email.split('@')[0]),
      email,
      role,
      phone: profile?.phone || String(session.user.user_metadata?.phone || credentials.phone || ''),
      isAdmin: role === 'super_admin'
    };
    try { localStorage.setItem('gaukripa_user', JSON.stringify(user)); } catch {}
    return { success: true, user };
  }
};
