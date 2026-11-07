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

const API_BASE = '/api';

export const api = {
  // Services
  getServices: async (all = false): Promise<ServiceItem[]> => {
    const res = await fetch(`${API_BASE}/services${all ? '?all=true' : ''}`);
    return res.json();
  },
  createService: async (service: Partial<ServiceItem>): Promise<ServiceItem> => {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    });
    const data = await res.json();
    return data.service;
  },
  updateService: async (id: string, service: Partial<ServiceItem>): Promise<ServiceItem> => {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(service)
    });
    const data = await res.json();
    return data.service;
  },
  deleteService: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_BASE}/services/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  // Astrologers
  getAstrologers: async (): Promise<AstrologerItem[]> => {
    const res = await fetch(`${API_BASE}/astrologers`);
    return res.json();
  },
  createAstrologer: async (astro: Partial<AstrologerItem>): Promise<AstrologerItem> => {
    const res = await fetch(`${API_BASE}/astrologers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(astro)
    });
    const data = await res.json();
    return data.astrologer;
  },
  updateAstrologer: async (id: string, astro: Partial<AstrologerItem>): Promise<AstrologerItem> => {
    const res = await fetch(`${API_BASE}/astrologers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(astro)
    });
    const data = await res.json();
    return data.astrologer;
  },
  setAstrologerAvailability: async (id: string, isOnline: boolean): Promise<boolean> => {
    const res = await fetch(`${API_BASE}/astrologers/${id}/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isOnline })
    });
    const data = await res.json();
    return data.isOnline;
  },

  // Bookings
  getBookings: async (phone?: string): Promise<BookingRecord[]> => {
    const url = phone ? `${API_BASE}/bookings?phone=${encodeURIComponent(phone)}` : `${API_BASE}/bookings`;
    const res = await fetch(url);
    return res.json();
  },
  createBooking: async (booking: Partial<BookingRecord>): Promise<BookingRecord> => {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking)
    });
    const data = await res.json();
    return data.booking;
  },
  updateBookingStatus: async (id: string, status: BookingRecord['status']): Promise<BookingRecord> => {
    const res = await fetch(`${API_BASE}/bookings/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    return data.booking;
  },
  uploadBookingProof: async (id: string, proof: { videoProofUrl?: string; photoProofUrls?: string[]; priestName?: string; status?: string }): Promise<BookingRecord> => {
    const res = await fetch(`${API_BASE}/bookings/${id}/proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proof)
    });
    const data = await res.json();
    return data.booking;
  },

  // Wallet & Discount
  getWallet: async (phone: string): Promise<WalletInfo> => {
    const res = await fetch(`${API_BASE}/wallet/${encodeURIComponent(phone)}`);
    return res.json();
  },
  topupWallet: async (phone: string, amount: number, name?: string): Promise<WalletInfo> => {
    const res = await fetch(`${API_BASE}/wallet/topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, amount, name })
    });
    const data = await res.json();
    return data.wallet;
  },
  checkDiscount: async (phone: string): Promise<{ eligible: boolean; ratePerMin: number; standardRate: number; discountedRate: number; rule: string }> => {
    const res = await fetch(`${API_BASE}/wallet/discount-check/${encodeURIComponent(phone)}`);
    return res.json();
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
    const res = await fetch(`${API_BASE}/chat/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const contentType = res.headers.get('content-type') || '';
    const raw = await res.text();
    let data: any;
    try { data = contentType.includes('application/json') ? JSON.parse(raw) : null; } catch { data = null; }
    if (!res.ok || !data) {
      const message = data?.error || (raw.trim().startsWith('<')
        ? 'The chat service returned a webpage instead of JSON. Please refresh and try again.'
        : `Unable to connect to chat service (HTTP ${res.status}).`);
      throw new Error(message);
    }
    return data;
  },

  getIncomingChat: async (astrologerId: string): Promise<ChatSession | null> => {
    const res = await fetch(`${API_BASE}/chat/incoming/${encodeURIComponent(astrologerId)}`);
    const data = await res.json();
    return data.incoming;
  },

  respondChat: async (sessionId: string, astrologerId: string, action: 'accept' | 'reject'): Promise<ChatSession> => {
    const res = await fetch(`${API_BASE}/chat/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, astrologerId, action })
    });
    const data = await res.json();
    return data.session;
  },

  getChatSession: async (sessionId: string): Promise<{ session: ChatSession; customerWalletBalance: number }> => {
    const res = await fetch(`${API_BASE}/chat/session/${sessionId}`);
    return res.json();
  },

  sendChatMessage: async (sessionId: string, payload: {
    sender: 'customer' | 'astrologer';
    senderName?: string;
    text: string;
    suggestedSeva?: string;
  }): Promise<ChatMessage> => {
    const res = await fetch(`${API_BASE}/chat/session/${sessionId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data.message;
  },

  sendChatHeartbeat: async (sessionId: string): Promise<{
    durationSeconds: number;
    totalCharged: number;
    astrologerEarned: number;
    walletBalance: number;
    status: string;
  }> => {
    const res = await fetch(`${API_BASE}/chat/session/${sessionId}/heartbeat`, { method: 'POST' });
    return res.json();
  },

  endChat: async (sessionId: string): Promise<ChatSession> => {
    const res = await fetch(`${API_BASE}/chat/session/${sessionId}/end`, { method: 'POST' });
    const data = await res.json();
    return data.session;
  },

  getAstrologerChatHistory: async (astrologerId: string): Promise<{
    sessions: ChatSession[];
    analytics: {
      totalConsultations: number;
      todayEarnings: number;
      weeklyEarnings: number;
      monthlyEarnings: number;
    };
  }> => {
    const res = await fetch(`${API_BASE}/chat/history/${encodeURIComponent(astrologerId)}`);
    return res.json();
  },

  // Settings
  getSettings: async (): Promise<AppSettings> => {
    const res = await fetch(`${API_BASE}/settings`);
    return res.json();
  },
  updateSettings: async (settings: Partial<AppSettings>): Promise<AppSettings> => {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    const data = await res.json();
    return data.settings;
  },

  // Reviews
  getReviews: async (): Promise<ReviewItem[]> => {
    const res = await fetch(`${API_BASE}/reviews`);
    return res.json();
  },
  createReview: async (review: Partial<ReviewItem>): Promise<ReviewItem> => {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
    const data = await res.json();
    return data.review;
  },
  approveReview: async (id: string, isApproved: boolean): Promise<ReviewItem> => {
    const res = await fetch(`${API_BASE}/reviews/${id}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isApproved })
    });
    const data = await res.json();
    return data.review;
  },
  deleteReview: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_BASE}/reviews/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  // Media Upload helper
  uploadMediaFile: async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const dataUrl = reader.result as string;
          const res = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dataUrl, fileName: file.name })
          });
          const data = await res.json();
          if (data.url) {
            resolve(data.url);
          } else {
            reject(new Error(data.error || 'Upload failed'));
          }
        } catch (e) {
          reject(e);
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
    const res = await fetch(`${API_BASE}/database/status`);
    return res.json();
  },

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
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Authentication failed');
    }
    return data;
  }
};
