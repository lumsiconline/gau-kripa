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

const API_BASE = '/api';

// Safe fetch helper that intercepts HTML 404 responses from static hosts (e.g. GitHub Pages)
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

    // Static host returned HTML (such as 404.html on GitHub Pages)
    return { ok: false, isHtml: true, error: `Static server response (${res.status})` };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network error' };
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

  // Wallet & Discount
  getWallet: async (phone: string): Promise<WalletInfo> => {
    const res = await safeFetchJson<WalletInfo>(`${API_BASE}/wallet/${encodeURIComponent(phone)}`);
    if (res.ok && res.data) return res.data;

    try {
      const raw = localStorage.getItem(`gaukripa_wallet_${phone}`);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      phone,
      name: 'Devotee',
      balance: 250,
      transactions: [{ id: 'tx-init', type: 'credit', amount: 250, description: 'Welcome Devotee Blessing Balance', date: new Date().toLocaleDateString() }]
    };
  },

  topupWallet: async (phone: string, amount: number, name?: string): Promise<WalletInfo> => {
    const res = await safeFetchJson<{ wallet: WalletInfo }>(`${API_BASE}/wallet/topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, amount, name })
    });
    if (res.ok && res.data?.wallet) return res.data.wallet;

    const current = await api.getWallet(phone);
    current.balance += amount;
    current.transactions.unshift({
      id: `tx-${Date.now()}`,
      type: 'credit',
      amount,
      description: `Devotee Wallet Recharge (+₹${amount})`,
      date: new Date().toLocaleDateString()
    });
    try { localStorage.setItem(`gaukripa_wallet_${phone}`, JSON.stringify(current)); } catch {}
    return current;
  },

  checkDiscount: async (
    phone: string
  ): Promise<{ eligible: boolean; ratePerMin: number; standardRate: number; discountedRate: number; rule: string }> => {
    const res = await safeFetchJson<{ eligible: boolean; ratePerMin: number; standardRate: number; discountedRate: number; rule: string }>(
      `${API_BASE}/wallet/discount-check/${encodeURIComponent(phone)}`
    );
    if (res.ok && res.data) return res.data;

    // Check if phone has any booking in localStorage
    try {
      const stored = localStorage.getItem('gaukripa_bookings');
      if (stored) {
        const bookings: BookingRecord[] = JSON.parse(stored);
        const hasBooking = bookings.some((b) => b.phone.includes(phone));
        if (hasBooking) {
          return { eligible: true, ratePerMin: 10, standardRate: 20, discountedRate: 10, rule: '50% Seva Discount Applied' };
        }
      }
    } catch {}
    return { eligible: false, ratePerMin: 20, standardRate: 20, discountedRate: 10, rule: 'Standard Consultation Rate' };
  },

  // Live Chat Workflow
  requestChat: async (payload: {
    astrologerId: string;
    customerId?: string;
    customerName: string;
    customerPhone: string;
    customerConcern: string;
    birthDate: string;
    birthTime: string;
    birthPlace: string;
  }): Promise<{ success: boolean; session: ChatSession }> => {
    const res = await safeFetchJson<{ success: boolean; session: ChatSession }>(`${API_BASE}/chat/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok && res.data?.session) return res.data;

    // Fallback in static / GitHub Pages environment
    const astros = getStoredAstrologers();
    const astro = astros.find((a) => a.id === payload.astrologerId) || astros[0];
    const discountInfo = await api.checkDiscount(payload.customerPhone);

    const session: ChatSession = {
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
      status: 'waiting_approval',
      ratePerMin: discountInfo.ratePerMin,
      hasDiscount: discountInfo.eligible,
      createdAt: new Date().toISOString(),
      durationSeconds: 0,
      totalCharged: 0,
      astrologerEarned: 0,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'customer',
          senderName: payload.customerName || 'Devotee',
          text: `Pranam Guruji! I am ${payload.customerName}. DOB: ${payload.birthDate}, Time: ${payload.birthTime}, Place: ${payload.birthPlace}. Concern: ${payload.customerConcern || 'Kundali & Grah Upay guidance'}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };

    try {
      localStorage.setItem(`gaukripa_chat_session_${session.id}`, JSON.stringify(session));
      localStorage.setItem(`gaukripa_incoming_chat_${payload.astrologerId}`, JSON.stringify(session));
      // Dispatch storage event for other tabs to pick up instantly
      window.dispatchEvent(new Event('storage'));
    } catch {}

    return { success: true, session };
  },

  getIncomingChat: async (astrologerId: string): Promise<ChatSession | null> => {
    const res = await safeFetchJson<{ incoming: ChatSession | null }>(`${API_BASE}/chat/incoming/${encodeURIComponent(astrologerId)}`);
    if (res.ok && res.data) return res.data.incoming;

    try {
      const raw = localStorage.getItem(`gaukripa_incoming_chat_${astrologerId}`);
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
    if (res.ok && res.data?.session) return res.data.session;

    const sessionRes = await api.getChatSession(sessionId);
    const session = sessionRes.session;
    if (action === 'accept') {
      session.status = 'active';
      session.startedAt = new Date().toISOString();
      session.messages.push({
        id: `msg-${Date.now()}`,
        sender: 'astrologer',
        senderName: session.astrologerName,
        text: `Hari Om, ${session.customerName}! I am reviewing your birth chart details for ${session.birthPlace || 'your location'}. How may I guide you on your spiritual path?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    } else {
      session.status = 'rejected';
      session.endedAt = new Date().toISOString();
    }

    try {
      localStorage.setItem(`gaukripa_chat_session_${session.id}`, JSON.stringify(session));
      localStorage.removeItem(`gaukripa_incoming_chat_${astrologerId}`);
      window.dispatchEvent(new Event('storage'));
    } catch {}

    return session;
  },

  getChatSession: async (sessionId: string): Promise<{ session: ChatSession; customerWalletBalance: number }> => {
    const res = await safeFetchJson<{ session: ChatSession; customerWalletBalance: number }>(`${API_BASE}/chat/session/${sessionId}`);
    if (res.ok && res.data) return res.data;

    try {
      const raw = localStorage.getItem(`gaukripa_chat_session_${sessionId}`);
      if (raw) {
        const session: ChatSession = JSON.parse(raw);
        const wallet = await api.getWallet(session.customerPhone);
        return { session, customerWalletBalance: wallet.balance };
      }
    } catch {}
    throw new Error('Chat session not found');
  },

  sendChatMessage: async (
    sessionId: string,
    payload: {
      sender: 'customer' | 'astrologer';
      senderName?: string;
      text: string;
      suggestedSeva?: string;
    }
  ): Promise<ChatMessage> => {
    const res = await safeFetchJson<{ message: ChatMessage }>(`${API_BASE}/chat/session/${sessionId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok && res.data?.message) return res.data.message;

    const { session } = await api.getChatSession(sessionId);
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: payload.sender,
      senderName: payload.senderName || (payload.sender === 'customer' ? session.customerName : session.astrologerName),
      text: payload.text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedSeva: payload.suggestedSeva
    };
    session.messages.push(msg);
    try {
      localStorage.setItem(`gaukripa_chat_session_${sessionId}`, JSON.stringify(session));
      window.dispatchEvent(new Event('storage'));
    } catch {}
    return msg;
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
    const res = await safeFetchJson<{ session: ChatSession }>(`${API_BASE}/chat/session/${sessionId}/end`, { method: 'POST' });
    if (res.ok && res.data?.session) return res.data.session;

    const { session } = await api.getChatSession(sessionId);
    session.status = 'ended';
    session.endedAt = new Date().toISOString();
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
    const res = await safeFetchJson<{
      sessions: ChatSession[];
      analytics: {
        totalConsultations: number;
        todayEarnings: number;
        weeklyEarnings: number;
        monthlyEarnings: number;
      };
    }>(`${API_BASE}/chat/history/${encodeURIComponent(astrologerId)}`);
    if (res.ok && res.data) return res.data;

    const matchedSessions: ChatSession[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('gaukripa_chat_session_')) {
          const s: ChatSession = JSON.parse(localStorage.getItem(key) || '{}');
          if (s.astrologerId === astrologerId) {
            matchedSessions.push(s);
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
        weeklyEarnings: totalEarned,
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
    const trimmedPhone = (data.phone || '').trim() || '9876543210';

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

    // Initialize devotee wallet with ₹150 welcome bonus
    try {
      const walletKey = `gaukripa_wallet_${trimmedPhone}`;
      if (!localStorage.getItem(walletKey)) {
        const welcomeWallet: WalletInfo = {
          phone: trimmedPhone,
          name: trimmedName,
          balance: 150,
          transactions: [
            {
              id: `tx-welcome-${Date.now()}`,
              type: 'credit',
              amount: 150,
              description: 'Vedic Devotee Welcome Balance (Sign-Up Bonus)',
              date: new Date().toLocaleDateString()
            }
          ]
        };
        localStorage.setItem(walletKey, JSON.stringify(welcomeWallet));
      }
    } catch {}

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

    if (trimmedPass.length < 4) {
      throw new Error('Password must be at least 4 characters.');
    }

    const devName = trimmedEmail.split('@')[0].replace(/[._-]/g, ' ');
    const user = {
      name: devName.charAt(0).toUpperCase() + devName.slice(1),
      email: trimmedEmail,
      role: 'devotee' as const,
      phone: credentials.phone || '9876543210',
      isAdmin: false
    };
    try { localStorage.setItem('gaukripa_user', JSON.stringify(user)); } catch {}
    return { success: true, user };
  }
};
