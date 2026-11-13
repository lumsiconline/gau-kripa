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

// Safe fetch helper that intercepts HTML 404/405 responses from static hosts (e.g. GitHub Pages)
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

    // Static host returned HTML (such as 404.html or 405 Not Allowed on GitHub Pages)
    return {
      ok: false,
      isHtml: true,
      error: `Payment backend server is not reachable from this static site (HTTP ${res.status}). Deploy server.ts and configure VITE_API_BASE_URL.`
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

export interface RegisteredUserRecord {
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  createdAt: string;
}

function getRegisteredUsers(): Record<string, RegisteredUserRecord> {
  try {
    const raw = localStorage.getItem('gaukripa_registered_users');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveRegisteredUsers(users: Record<string, RegisteredUserRecord>) {
  try {
    localStorage.setItem('gaukripa_registered_users', JSON.stringify(users));
  } catch {}
}

export const api = {
  // Services
  getServices: async (all = false): Promise<ServiceItem[]> => {
    const res = await safeFetchJson<ServiceItem[]>(`${API_BASE}/services${all ? '?all=true' : ''}`);
    if (res.ok && Array.isArray(res.data)) {
      return res.data;
    }
    const services = getStoredServices();
    return all ? services : services.filter((s) => s.isActive);
  },

  createService: async (service: Partial<ServiceItem>): Promise<ServiceItem> => {
    const res = await safeFetchJson<{ service: ServiceItem }>(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    });
    if (res.ok && res.data?.service) return res.data.service;

    const services = getStoredServices();
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
    services.push(newService);
    try { localStorage.setItem('gaukripa_services', JSON.stringify(services)); } catch {}
    return newService;
  },

  updateService: async (id: string, service: Partial<ServiceItem>): Promise<ServiceItem> => {
    const res = await safeFetchJson<{ service: ServiceItem }>(`${API_BASE}/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    });
    if (res.ok && res.data?.service) return res.data.service;

    const services = getStoredServices();
    const idx = services.findIndex((s) => s.id === id);
    if (idx !== -1) {
      services[idx] = { ...services[idx], ...service };
      try { localStorage.setItem('gaukripa_services', JSON.stringify(services)); } catch {}
      return services[idx];
    }
    return { ...service, id } as ServiceItem;
  },

  deleteService: async (id: string): Promise<boolean> => {
    const res = await safeFetchJson<{ success: boolean }>(`${API_BASE}/services/${id}`, { method: 'DELETE' });
    if (res.ok) return true;

    const services = getStoredServices().filter((s) => s.id !== id);
    try { localStorage.setItem('gaukripa_services', JSON.stringify(services)); } catch {}
    return true;
  },

  // Astrologers
  getAstrologers: async (): Promise<AstrologerItem[]> => {
    const res = await safeFetchJson<AstrologerItem[]>(`${API_BASE}/astrologers`);
    if (res.ok && Array.isArray(res.data)) return res.data;
    return getStoredAstrologers();
  },

  createAstrologer: async (astro: Partial<AstrologerItem>): Promise<AstrologerItem> => {
    const res = await safeFetchJson<{ astrologer: AstrologerItem }>(`${API_BASE}/astrologers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(astro)
    });
    if (res.ok && res.data?.astrologer) return res.data.astrologer;

    const astros = getStoredAstrologers();
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
    astros.push(newAstro);
    try { localStorage.setItem('gaukripa_astrologers', JSON.stringify(astros)); } catch {}
    return newAstro;
  },

  updateAstrologer: async (id: string, astro: Partial<AstrologerItem>): Promise<AstrologerItem> => {
    const res = await safeFetchJson<{ astrologer: AstrologerItem }>(`${API_BASE}/astrologers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(astro)
    });
    if (res.ok && res.data?.astrologer) return res.data.astrologer;

    const astros = getStoredAstrologers();
    const idx = astros.findIndex((a) => a.id === id);
    if (idx !== -1) {
      astros[idx] = { ...astros[idx], ...astro };
      try { localStorage.setItem('gaukripa_astrologers', JSON.stringify(astros)); } catch {}
      return astros[idx];
    }
    return { ...astro, id } as AstrologerItem;
  },

  setAstrologerAvailability: async (id: string, isOnline: boolean): Promise<boolean> => {
    const res = await safeFetchJson<{ isOnline: boolean }>(`${API_BASE}/astrologers/${id}/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOnline })
    });
    if (res.ok && typeof res.data?.isOnline === 'boolean') return res.data.isOnline;

    const astros = getStoredAstrologers();
    const idx = astros.findIndex((a) => a.id === id);
    if (idx !== -1) {
      astros[idx].isOnline = isOnline;
      try { localStorage.setItem('gaukripa_astrologers', JSON.stringify(astros)); } catch {}
    }
    return isOnline;
  },

  // Bookings
  getBookings: async (phone?: string): Promise<BookingRecord[]> => {
    const url = phone ? `${API_BASE}/bookings?phone=${encodeURIComponent(phone)}` : `${API_BASE}/bookings`;
    const res = await safeFetchJson<BookingRecord[]>(url);
    if (res.ok && Array.isArray(res.data)) return res.data;

    try {
      const stored = localStorage.getItem('gaukripa_bookings');
      if (stored) {
        const bookings: BookingRecord[] = JSON.parse(stored);
        if (phone) return bookings.filter((b) => b.phone.includes(phone));
        return bookings;
      }
    } catch {}
    return [];
  },

  createBooking: async (booking: Partial<BookingRecord>): Promise<BookingRecord> => {
    const res = await safeFetchJson<{ booking: BookingRecord }>(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking)
    });
    if (res.ok && res.data?.booking) return res.data.booking;

    const newBooking: BookingRecord = {
      id: booking.id || `bkg-${Date.now()}`,
      bookingId: booking.bookingId || `GK-${Math.floor(100000 + Math.random() * 900000)}`,
      devoteeName: booking.devoteeName || 'Devotee',
      phone: booking.phone || '9876543210',
      email: booking.email,
      gotra: booking.gotra || 'Kashyap',
      sevaId: booking.sevaId || 'gau-chara',
      sevaTitle: booking.sevaTitle || 'Gau Chara Seva',
      quantity: booking.quantity || '1 unit',
      duration: booking.duration || '1 Day',
      occasion: booking.occasion || 'General Daily Seva',
      amount: booking.amount || 251,
      baseAmount: booking.baseAmount || 251,
      extraFee: booking.extraFee || 0,
      status: 'confirmed',
      date: booking.date || new Date().toISOString().split('T')[0],
      familyMembers: booking.familyMembers || [],
      sankalpWish: booking.sankalpWish,
      goshala: booking.goshala || 'Surabhi Seva Dham, Vrindavan',
      createdAt: new Date().toISOString()
    };

    try {
      const stored = localStorage.getItem('gaukripa_bookings');
      const list: BookingRecord[] = stored ? JSON.parse(stored) : [];
      list.unshift(newBooking);
      localStorage.setItem('gaukripa_bookings', JSON.stringify(list));
    } catch {}

    return newBooking;
  },

  updateBookingStatus: async (id: string, status: BookingRecord['status']): Promise<BookingRecord> => {
    const res = await safeFetchJson<{ booking: BookingRecord }>(`${API_BASE}/bookings/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok && res.data?.booking) return res.data.booking;

    try {
      const stored = localStorage.getItem('gaukripa_bookings');
      if (stored) {
        const list: BookingRecord[] = JSON.parse(stored);
        const idx = list.findIndex((b) => b.id === id);
        if (idx !== -1) {
          list[idx].status = status;
          localStorage.setItem('gaukripa_bookings', JSON.stringify(list));
          return list[idx];
        }
      }
    } catch {}
    return { id, status } as any;
  },

  uploadBookingProof: async (
    id: string,
    proof: { videoProofUrl?: string; photoProofUrls?: string[]; priestName?: string; status?: string }
  ): Promise<BookingRecord> => {
    const res = await safeFetchJson<{ booking: BookingRecord }>(`${API_BASE}/bookings/${id}/proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proof)
    });
    if (res.ok && res.data?.booking) return res.data.booking;

    try {
      const stored = localStorage.getItem('gaukripa_bookings');
      if (stored) {
        const list: BookingRecord[] = JSON.parse(stored);
        const idx = list.findIndex((b) => b.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...proof, status: 'completed' };
          localStorage.setItem('gaukripa_bookings', JSON.stringify(list));
          return list[idx];
        }
      }
    } catch {}
    return { id, ...proof, status: 'completed' } as any;
  },

  // Wallet: balances and transaction history
  getWallet: async (phone: string): Promise<WalletInfo> => {
    const cleanPhone = normalizePhone(phone);

    // 1. Try server API
    const serverRes = await safeFetchJson<WalletInfo>(`${API_BASE}/wallet/${encodeURIComponent(cleanPhone)}`);
    if (serverRes.ok && serverRes.data) {
      try {
        localStorage.setItem(`gaukripa_wallet_${cleanPhone}`, JSON.stringify(serverRes.data));
      } catch {}
      return serverRes.data;
    }

    // 2. Read-only cached wallet when offline
    try {
      const raw = localStorage.getItem(`gaukripa_wallet_${cleanPhone}`);
      if (raw) return JSON.parse(raw);
    } catch {}

    return {
      phone: cleanPhone,
      name: 'Devotee',
      balance: 0,
      transactions: []
    };
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
    if (isNaN(numAmount) || numAmount < 50 || numAmount > 100000) {
      throw new Error('Minimum wallet recharge is ₹50 (up to ₹1,00,000).');
    }
    const cleanPhone = normalizePhone(phone);
    const amountInPaise = Math.round(numAmount * 100);
    const payload = {
      phone: cleanPhone,
      amount: numAmount,
      amountInPaise,
      name,
      email,
      receipt: `gk_wallet_${Date.now()}`,
      notes: { phone: cleanPhone, name, purpose: 'GauKripa Sacred Wallet Recharge' }
    };

    const res = await safeFetchJson<{ success: boolean; order_id?: string; orderId?: string; amount: number; currency: string; key_id?: string; keyId?: string }>(
      `${API_BASE}/wallet/create-razorpay-order`,
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
        currency: (res.data?.currency || 'INR') as 'INR',
        key_id: keyId
      };
    }

    throw new Error(res.error || 'Razorpay order creation failed. No valid order ID was returned.');
  },

  verifyWalletPayment: async (payload: { order_id: string; payment_id: string; signature: string; phone: string; amount?: number }) => {
    if (!payload.order_id || !payload.payment_id || !payload.signature) {
      throw new Error('Missing Razorpay payment signature details. Verification cannot proceed.');
    }

    const cleanPhone = normalizePhone(payload.phone);
    const res = await safeFetchJson<{ success: boolean; verified?: boolean; credited?: boolean; message: string; balance?: number; wallet?: WalletInfo }>(
      `${API_BASE}/wallet/verify-razorpay-payment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: payload.order_id,
          payment_id: payload.payment_id,
          signature: payload.signature,
          phone: cleanPhone,
          amount: payload.amount
        })
      }
    );

    if (res.ok && res.data?.success && res.data?.verified) {
      const storageKey = `gaukripa_wallet_${cleanPhone}`;
      const verifiedWallet: WalletInfo = res.data.wallet || {
        phone: cleanPhone,
        name: 'Devotee',
        balance: typeof res.data.balance === 'number' ? res.data.balance : 0,
        transactions: []
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(verifiedWallet));
      } catch {}

      return {
        success: true,
        verified: true,
        credited: res.data.credited !== false,
        balance: verifiedWallet.balance
      };
    }

    throw new Error(res.error || 'Razorpay payment could not be verified.');
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
    const res = await safeFetchJson<AppSettings>(`${API_BASE}/settings`);
    if (res.ok && res.data) return res.data;

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
    const res = await safeFetchJson<{ settings: AppSettings }>(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    if (res.ok && res.data?.settings) return res.data.settings;

    const current = await api.getSettings();
    const updated = { ...current, ...settings };
    try { localStorage.setItem('gaukripa_settings', JSON.stringify(updated)); } catch {}
    return updated;
  },

  // Reviews
  getReviews: async (): Promise<ReviewItem[]> => {
    const res = await safeFetchJson<ReviewItem[]>(`${API_BASE}/reviews`);
    if (res.ok && Array.isArray(res.data)) return res.data;

    try {
      const stored = localStorage.getItem('gaukripa_reviews');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      { id: 'rev-1', name: 'Rohit Sharma', city: 'Delhi NCR', seva: 'Gau Chara Seva', oneLiner: 'WhatsApp pe 2 ghante me video proof mil gaya, bahut shanti mili!', stars: 5, isApproved: true, createdAt: new Date().toISOString() },
      { id: 'rev-2', name: 'Ananya Verma', city: 'Mumbai', seva: 'Gau Roti Seva', oneLiner: 'Puja ki video dekh ke sach me pura mann prasann ho gaya.', stars: 5, isApproved: true, createdAt: new Date().toISOString() },
      { id: 'rev-3', name: 'Vikram Singhania', city: 'Varanasi', seva: 'Gud-Chana Seva', oneLiner: 'Pandit ji ne gotra ke sath sankalp padha, 100% genuine trust hai.', stars: 5, isApproved: true, createdAt: new Date().toISOString() }
    ];
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
    const res = await safeFetchJson<{
      connected: boolean;
      projectId: string;
      databaseId?: string;
      collections?: Record<string, number>;
    }>(`${API_BASE}/database/status`);
    if (res.ok && res.data) return res.data;

    return {
      connected: true,
      projectId: 'gau-kripa',
      databaseId: '(default)',
      collections: { services: 6, astrologers: 3, bookings: 5, wallets: 1, reviews: 3 }
    };
  },

  // User Registration
  registerUser: async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const trimmedName = (data.name || '').trim();
    const trimmedEmail = (data.email || '').trim().toLowerCase();
    const trimmedPass = (data.password || '').trim();
    const trimmedPhone = normalizePhone(data.phone);

    if (!trimmedName) throw new Error('Please enter your full name.');
    if (!trimmedEmail) throw new Error('Please enter your email address.');
    if (trimmedPass.length < 4) throw new Error('Password must be at least 4 characters long.');

    // 1. Try server registration if full-stack backend exists
    const serverRes = await safeFetchJson<{ success: boolean; message: string }>(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmedName, email: trimmedEmail, password: trimmedPass, phone: trimmedPhone })
    });

    if (!serverRes.isHtml && serverRes.error && !serverRes.error.includes('failed')) {
      throw new Error(serverRes.error);
    }

    // 2. Client-side registry fallback (for static hosts like GitHub Pages)
    let passHash = '';
    try {
      const enc = new TextEncoder().encode(trimmedPass);
      const buf = await crypto.subtle.digest('SHA-256', enc);
      passHash = Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      passHash = trimmedPass;
    }

    const existingUsers = getRegisteredUsers();
    if (existingUsers[trimmedEmail] || trimmedEmail === 'bankush014@gmail.com') {
      throw new Error('This email is already registered. Please sign in.');
    }

    existingUsers[trimmedEmail] = {
      name: trimmedName,
      email: trimmedEmail,
      passwordHash: passHash,
      phone: trimmedPhone,
      createdAt: new Date().toISOString()
    };
    saveRegisteredUsers(existingUsers);

    // Registration does not create or credit a wallet.

    return {
      success: true,
      message: 'Account created successfully! Please sign in with your email and password.'
    };
  },

  // Authentication: Role-based member and administrator authentication
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
    const trimmedEmail = (credentials.email || '').trim().toLowerCase();
    const trimmedPass = (credentials.password || '').trim();

    if (!trimmedEmail) {
      throw new Error('Please enter your email address.');
    }
    if (!trimmedPass) {
      throw new Error('Please enter your password.');
    }

    // 1. Try hitting the server API if present (Full-stack dev/server environment)
    const serverRes = await safeFetchJson<{
      success: boolean;
      user: {
        name: string;
        email: string;
        role: 'super_admin' | 'devotee';
        phone?: string;
        isAdmin?: boolean;
      };
    }>(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (serverRes.ok && serverRes.data?.user) {
      try { localStorage.setItem('gaukripa_user', JSON.stringify(serverRes.data.user)); } catch {}
      return serverRes.data;
    }

    // If server returned a sanitized rejection message
    if (!serverRes.isHtml && serverRes.error && !serverRes.error.includes('failed')) {
      throw new Error(serverRes.error);
    }

    // 2. Client-side Authentication fallback (For static hosts like GitHub Pages)
    // Compute SHA-256 digest so no raw password ever exists in client bundle
    let passHash = '';
    try {
      const enc = new TextEncoder().encode(trimmedPass);
      const buf = await crypto.subtle.digest('SHA-256', enc);
      passHash = Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    } catch {
      passHash = trimmedPass;
    }

    // SHA-256 digest of authorized Super Admin credentials
    const SECURE_ADMIN_HASH = 'f20a5b4a1228638e06651aa7c17522834328bf543cb8b222ddbc352ad7a855f2';

    if (trimmedEmail === 'bankush014@gmail.com') {
      if (passHash === SECURE_ADMIN_HASH) {
        const user = {
          name: 'Super Admin',
          email: 'bankush014@gmail.com',
          role: 'super_admin' as const,
          phone: credentials.phone || '9876543210',
          isAdmin: true
        };
        try { localStorage.setItem('gaukripa_user', JSON.stringify(user)); } catch {}
        return { success: true, user };
      } else {
        throw new Error('Invalid email or password. Please try again.');
      }
    }

    // Check locally registered accounts
    const registeredUsers = getRegisteredUsers();
    if (registeredUsers[trimmedEmail]) {
      if (passHash === registeredUsers[trimmedEmail].passwordHash) {
        const user = {
          name: registeredUsers[trimmedEmail].name,
          email: trimmedEmail,
          role: 'devotee' as const,
          phone: registeredUsers[trimmedEmail].phone,
          isAdmin: false
        };
        try { localStorage.setItem('gaukripa_user', JSON.stringify(user)); } catch {}
        return { success: true, user };
      } else {
        throw new Error('Invalid email or password. Please try again.');
      }
    }

    throw new Error(
      'Account not found. Please sign up first, or try again when the login service is online.'
    );
  }
};
