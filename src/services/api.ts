// Client API service for GauKripa Full-Stack Application (Supabase PostgreSQL + Edge Functions + Auth)
import { SEVA_ITEMS, ASTROLOGERS } from '../data/sevaData';
import { saveLocalSession, getLocalSession, getAstrologerActiveSession, broadcastChatEvent } from './chatSync';
import {
  supabase,
  isSupabaseConfigured,
  getSupabaseProjectRef
} from '../lib/supabase';
import {
  supabaseAuth,
  supabaseRest,
  supabaseMutation,
  saveSupabaseSession,
  getValidSupabaseSession,
  clearSupabaseSession,
  invokeGauKripaPayments,
  invokeGauKripaChat,
  uploadGauKripaMedia,
  SupabaseSession
} from './supabaseClient';

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

export interface RegisteredUserRecord {
  name: string;
  email: string;
  passwordHash: string;
  phone: string;
  createdAt: string;
}

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
    const isJson =
      contentType.includes('application/json') ||
      (text.trim().startsWith('{') && text.trim().endsWith('}')) ||
      (text.trim().startsWith('[') && text.trim().endsWith(']'));

    if (isJson) {
      try {
        const data = JSON.parse(text);
        if (res.ok) {
          return { ok: true, data };
        }
        return { ok: false, error: data?.error || data?.message || `Request failed (${res.status})`, data };
      } catch {
        return { ok: false, error: 'Malformed JSON response', isHtml: false };
      }
    }

    const isSupabaseFn = url.includes('/functions/v1/');
    return {
      ok: false,
      isHtml: true,
      error: isSupabaseFn
        ? `Supabase Edge Function returned HTTP ${res.status}. Ensure Edge Functions are deployed on your Supabase project.`
        : `Backend server is not reachable from this static site (HTTP ${res.status}). Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.`
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network error connecting to backend server.' };
  }
}

async function getActiveSessionSafe(): Promise<SupabaseSession | null> {
  try {
    return await getValidSupabaseSession();
  } catch {
    return null;
  }
}

function getStoredUserPhone(): string {
  try {
    const raw = localStorage.getItem('gaukripa_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      return normalizePhone(parsed?.phone, '');
    }
  } catch {}
  return '';
}

function unwrapRow(row: any): any {
  if (!row || typeof row !== 'object') return row;
  if (row.data && typeof row.data === 'object' && !Array.isArray(row.data)) {
    const { data, ...topLevel } = row;
    return { ...data, ...topLevel };
  }
  return row;
}

function sanitizeLegacyLocationText(val?: string): string {
  if (!val) return '';
  return String(val)
    .replace(/Surabhi\s*(Gau\s*)?Seva\s*Dham,?\s*Vrindavan/gi, 'GauKripa Pramanit Goshala')
    .replace(/सुरभि\s*(गौ\s*)?सेवा\s*धाम,?\s*(वृन्दावन|वृंदावन)/g, 'गौकृपा प्रमाणित गौशाला')
    .replace(/परिक्रमा\s*मार्ग,?\s*रमण\s*रेती,?\s*(वृन्दावन|वृंदावन)[^.]*\.?/g, 'गौकृपा प्रमाणित गौशाला')
    .replace(/Parikrama\s*Marg,?\s*Raman\s*Reti,?\s*Vrindavan[^.]*\.?/gi, 'GauKripa Pramanit Goshala')
    .replace(/•\s*Vrindavan\s*&?\s*Mathura/gi, '')
    .replace(/Vrindavan\s*goshala/gi, 'Pramanit goshala')
    .replace(/(वृन्दावन|वृंदावन)\s*गौशाला/g, 'प्रमाणित गौशाला')
    .replace(/\bVrindavan\b/gi, 'GauKripa')
    .replace(/वृन्दावन|वृंदावन/g, 'गौकृपा')
    .replace(/\bSurabhi\b/gi, 'GauKripa')
    .replace(/सुरभि/g, 'गौकृपा')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Row <-> App Mappers for Supabase PostgreSQL tables (supports both JSONB data column and flat columns)
function mapServiceRow(raw: any): ServiceItem {
  const row = unwrapRow(raw) || {};
  return {
    id: row.id,
    title: row.title,
    planet: row.planet,
    planetTag: row.planet_tag ?? row.planetTag,
    tagColor: row.tag_color ?? row.tagColor,
    priceDisplay: row.price_display ?? row.priceDisplay,
    basePrice: Number(row.base_price ?? row.basePrice ?? 251),
    unit: row.unit,
    minQty: Number(row.min_qty ?? row.minQty ?? 1),
    benefit: row.benefit,
    cropKey: row.crop_key ?? row.cropKey ?? 'sevaChara',
    customImageUrl: row.custom_image_url ?? row.customImageUrl ?? undefined,
    detailedDescription: row.detailed_description ?? row.detailedDescription ?? '',
    vedicSignificance: row.vedic_significance ?? row.vedicSignificance ?? '',
    isActive: row.is_active ?? row.isActive ?? true,
    category: row.category ?? 'cow'
  };
}

function mapAstrologerRow(raw: any): AstrologerItem {
  const row = unwrapRow(raw) || {};
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    experience: row.experience,
    rating: Number(row.rating ?? 4.9),
    reviewsCount: row.reviews_count ?? row.reviewsCount ?? '100+ reviews',
    ratePerMin: Number(row.rate_per_min ?? row.ratePerMin ?? 20),
    cropKey: row.crop_key ?? row.cropKey ?? 'astroSophia',
    customImageUrl: row.custom_image_url ?? row.customImageUrl ?? undefined,
    languages: Array.isArray(row.languages) ? row.languages : ['Hindi', 'English'],
    bio: row.bio ?? '',
    specializations: Array.isArray(row.specializations) ? row.specializations : [],
    isOnline: row.is_online ?? row.isOnline ?? true,
    totalConsultations: Number(row.total_consultations ?? row.totalConsultations ?? 0),
    totalEarnings: Number(row.total_earnings ?? row.totalEarnings ?? 0)
  };
}

function mapBookingRow(raw: any): BookingRecord {
  const row = unwrapRow(raw) || {};
  return {
    id: row.id,
    bookingId: row.booking_id ?? row.bookingId,
    devoteeName: row.devotee_name ?? row.devoteeName,
    phone: row.phone,
    email: row.email ?? undefined,
    gotra: row.gotra ?? 'Kashyap',
    sevaId: row.seva_id ?? row.sevaId,
    sevaTitle: row.seva_title ?? row.sevaTitle,
    quantity: row.quantity,
    duration: row.duration,
    occasion: row.occasion ?? 'General Daily Seva',
    amount: Number(row.amount ?? 0),
    baseAmount: Number(row.base_amount ?? row.baseAmount ?? 0),
    extraFee: Number(row.extra_fee ?? row.extraFee ?? 0),
    status: row.status ?? 'confirmed',
    date: row.date,
    familyMembers: Array.isArray(row.family_members ?? row.familyMembers) ? (row.family_members ?? row.familyMembers) : [],
    sankalpWish: row.sankalp_wish ?? row.sankalpWish ?? undefined,
    goshala: sanitizeLegacyLocationText(row.goshala) || 'GauKripa Pramanit Goshala',
    videoProofUrl: row.video_proof_url ?? row.videoProofUrl ?? undefined,
    photoProofUrls: Array.isArray(row.photo_proof_urls ?? row.photoProofUrls) ? (row.photo_proof_urls ?? row.photoProofUrls) : undefined,
    priestName: row.priest_name ?? row.priestName ?? undefined,
    whatsappSent: row.whatsapp_sent ?? row.whatsappSent ?? false,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString()
  };
}

function mapChatSessionRow(raw: any): ChatSession {
  const row = unwrapRow(raw) || {};
  return {
    id: row.id,
    astrologerId: row.astrologer_id ?? row.astrologerId,
    astrologerName: row.astrologer_name ?? row.astrologerName,
    customerId: row.customer_id ?? row.customerId,
    customerName: row.customer_name ?? row.customerName,
    customerPhone: row.customer_phone ?? row.customerPhone,
    customerConcern: row.customer_concern ?? row.customerConcern,
    birthDate: row.birth_date ?? row.birthDate ?? undefined,
    birthTime: row.birth_time ?? row.birthTime ?? undefined,
    birthPlace: row.birth_place ?? row.birthPlace ?? undefined,
    status: row.status ?? 'active',
    ratePerMin: Number(row.rate_per_min ?? row.ratePerMin ?? 20),
    hasDiscount: Boolean(row.has_discount ?? row.hasDiscount),
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
    startedAt: row.started_at ?? row.startedAt ?? undefined,
    endedAt: row.ended_at ?? row.endedAt ?? undefined,
    lastHeartbeat: row.last_heartbeat ?? row.lastHeartbeat ?? undefined,
    durationSeconds: Number(row.duration_seconds ?? row.durationSeconds ?? 0),
    totalCharged: Number(row.total_charged ?? row.totalCharged ?? 0),
    astrologerEarned: Number(row.astrologer_earned ?? row.astrologerEarned ?? 0),
    messages: Array.isArray(row.messages) ? row.messages : []
  };
}

function mapSettingsRow(raw: any): AppSettings {
  const row = unwrapRow(raw) || {};
  return {
    standardRatePerMin: Number(row.standard_rate_per_min ?? row.standardRatePerMin ?? 20),
    discountedRatePerMin: Number(row.discounted_rate_per_min ?? row.discountedRatePerMin ?? 10),
    discountEnabled: row.discount_enabled ?? row.discountEnabled ?? true,
    extraOccasionFee: Number(row.extra_occasion_fee ?? row.extraOccasionFee ?? 21),
    promoBannerText:
      row.promo_banner_text ??
      row.promoBannerText ??
      'Flat 50% Off On Astrologer Consultation After Booking Any Gau Seva!',
    bannerEnabled: row.banner_enabled ?? row.bannerEnabled ?? true,
    trustName: sanitizeLegacyLocationText(row.trust_name ?? row.trustName) || 'GauKripa Seva Trust'
  };
}

function mapReviewRow(raw: any): ReviewItem {
  const row = unwrapRow(raw) || {};
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    seva: row.seva,
    oneLiner: sanitizeLegacyLocationText(row.one_liner ?? row.oneLiner),
    stars: Number(row.stars ?? 5),
    isApproved: row.is_approved ?? row.isApproved ?? true,
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString()
  };
}

function notifyServicesUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gaukripa_services_updated'));
  }
}

function notifyAstrologersUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('gaukripa_astrologers_updated'));
  }
}

function saveStoredServices(services: ServiceItem[]) {
  try {
    localStorage.setItem('gaukripa_services', JSON.stringify(services));
  } catch {}
}

function saveStoredAstrologers(astrologers: AstrologerItem[]) {
  try {
    localStorage.setItem('gaukripa_astrologers', JSON.stringify(astrologers));
  } catch {}
}

function getLocalServiceOverrides(): Record<string, Partial<ServiceItem>> {
  try {
    const raw = localStorage.getItem('gaukripa_service_overrides');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function setLocalServiceOverride(id: string, patch: Partial<ServiceItem> | null) {
  try {
    const current = getLocalServiceOverrides();
    if (patch === null) {
      delete current[id];
    } else {
      current[id] = { ...(current[id] || {}), ...patch };
    }
    localStorage.setItem('gaukripa_service_overrides', JSON.stringify(current));
  } catch {}
}

function applyServiceOverrides(list: ServiceItem[]): ServiceItem[] {
  const overrides = getLocalServiceOverrides();
  if (Object.keys(overrides).length === 0) return list;
  return list.map((s) => (overrides[s.id] ? { ...s, ...overrides[s.id] } : s));
}

// Initial local catalog helpers when offline
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
  saveStoredServices(defaults);
  return defaults;
}

function getStoredAstrologers(): AstrologerItem[] {
  try {
    const raw = localStorage.getItem('gaukripa_astrologers');
    if (raw) {
      const parsed: AstrologerItem[] = JSON.parse(raw);
      const hasLegacySeeds = parsed.some((a) =>
        ['dr-sophia', 'acharya-rohan', 'maria-kapoor'].includes(a.id)
      );
      if (!hasLegacySeeds && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  const defaults: AstrologerItem[] = ASTROLOGERS.map((a, idx) => ({
    ...a,
    isOnline: true,
    totalConsultations: idx === 0 ? 5239 : 7648,
    totalEarnings: idx === 0 ? 104780 : 152960
  }));
  saveStoredAstrologers(defaults);
  return defaults;
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
    if (isSupabaseConfigured) {
      try {
        const query = all ? '?select=*' : '?is_active=eq.true&select=*';
        const data = await supabaseRest<any[]>('services', query);
        if (Array.isArray(data) && data.length > 0) {
          const mapped = applyServiceOverrides(data.map(mapServiceRow));
          if (all) {
            saveStoredServices(mapped);
          } else {
            const cached = getStoredServices();
            const mapById = new Map(cached.map((c) => [c.id, c]));
            for (const m of mapped) mapById.set(m.id, m);
            saveStoredServices(Array.from(mapById.values()));
          }
          return all ? mapped : mapped.filter((s) => s.isActive);
        }
      } catch {}
    }

    const res = await safeFetchJson<ServiceItem[]>(`${API_BASE}/services${all ? '?all=true' : ''}`);
    if (res.ok && Array.isArray(res.data)) {
      const mapped = applyServiceOverrides(res.data);
      if (all) {
        saveStoredServices(mapped);
      } else {
        const cached = getStoredServices();
        const mapById = new Map(cached.map((c) => [c.id, c]));
        for (const m of mapped) mapById.set(m.id, m);
        saveStoredServices(Array.from(mapById.values()));
      }
      return all ? mapped : mapped.filter((s) => s.isActive);
    }
    const services = applyServiceOverrides(getStoredServices());
    return all ? services : services.filter((s) => s.isActive);
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

    let created = newService;
    if (isSupabaseConfigured) {
      try {
        const rows = await supabaseMutation<any[]>('services', 'POST', '', {
          id: newService.id,
          is_active: newService.isActive,
          data: newService,
          updated_at: new Date().toISOString()
        });
        if (Array.isArray(rows) && rows[0]) {
          created = mapServiceRow(rows[0]);
        }
      } catch {}
    } else {
      const res = await safeFetchJson<{ service: ServiceItem }>(`${API_BASE}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newService)
      });
      if (res.ok && res.data?.service) created = res.data.service;
    }

    const services = getStoredServices().filter((s) => s.id !== created.id);
    services.unshift(created);
    saveStoredServices(services);
    notifyServicesUpdated();
    return created;
  },

  updateService: async (id: string, service: Partial<ServiceItem>): Promise<ServiceItem> => {
    let updated: ServiceItem | null = null;
    let persistedRemotely = false;

    const existingList = getStoredServices();
    const existingLocal = existingList.find((s) => s.id === id);

    if (isSupabaseConfigured) {
      try {
        const remoteRows = await supabaseRest<any[]>('services', `?id=eq.${encodeURIComponent(id)}&select=*`).catch(() => []);
        const remoteItem = remoteRows?.[0] ? mapServiceRow(remoteRows[0]) : existingLocal;
        const merged: ServiceItem = { ...(remoteItem || { id }), ...service, id } as ServiceItem;
        const patched = await supabaseMutation<any[]>('services', 'PATCH', `?id=eq.${encodeURIComponent(id)}`, {
          is_active: merged.isActive !== false,
          data: merged,
          updated_at: new Date().toISOString()
        });
        if (Array.isArray(patched) && patched[0]) {
          updated = mapServiceRow(patched[0]);
          persistedRemotely = true;
        } else {
          const inserted = await supabaseMutation<any[]>('services', 'POST', '', {
            id,
            is_active: merged.isActive !== false,
            data: merged,
            updated_at: new Date().toISOString()
          });
          if (Array.isArray(inserted) && inserted[0]) {
            updated = mapServiceRow(inserted[0]);
            persistedRemotely = true;
          }
        }
      } catch {}
    }

    if (!updated && !isSupabaseConfigured) {
      const res = await safeFetchJson<{ service: ServiceItem }>(`${API_BASE}/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service)
      });
      if (res.ok && res.data?.service) {
        updated = res.data.service;
        persistedRemotely = true;
      }
    }

    if (persistedRemotely) {
      setLocalServiceOverride(id, null);
    } else {
      setLocalServiceOverride(id, service);
    }

    const services = getStoredServices();
    const idx = services.findIndex((s) => s.id === id);
    if (updated) {
      if (idx !== -1) services[idx] = updated;
      else services.push(updated);
      saveStoredServices(services);
      notifyServicesUpdated();
      return updated;
    }

    if (idx !== -1) {
      services[idx] = { ...services[idx], ...service };
      saveStoredServices(services);
      notifyServicesUpdated();
      return services[idx];
    }
    notifyServicesUpdated();
    return { ...service, id } as ServiceItem;
  },

  deleteService: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured) {
      try {
        await supabaseMutation('services', 'DELETE', `?id=eq.${encodeURIComponent(id)}`);
      } catch {}
    } else {
      await safeFetchJson<{ success: boolean }>(`${API_BASE}/services/${id}`, { method: 'DELETE' });
    }

    const services = getStoredServices().filter((s) => s.id !== id);
    saveStoredServices(services);
    notifyServicesUpdated();
    return true;
  },

  // Astrologers
  getAstrologers: async (): Promise<AstrologerItem[]> => {
    const LEGACY_IDS = new Set(['dr-sophia', 'acharya-rohan', 'maria-kapoor']);
    const defaults: AstrologerItem[] = ASTROLOGERS.map((a, idx) => ({
      ...a,
      isOnline: true,
      totalConsultations: idx === 0 ? 5239 : 7648,
      totalEarnings: idx === 0 ? 104780 : 152960
    }));

    if (isSupabaseConfigured) {
      try {
        const data = await supabaseRest<any[]>('astrologers', '?select=*');
        if (Array.isArray(data) && data.length > 0) {
          const nonLegacy = data.map(mapAstrologerRow).filter((a) => !LEGACY_IDS.has(a.id));
          if (nonLegacy.length > 0) {
            const byId = new Map(nonLegacy.map((a) => [a.id, a]));
            for (const def of defaults) {
              if (!byId.has(def.id)) byId.set(def.id, def);
            }
            const merged = Array.from(byId.values());
            saveStoredAstrologers(merged);
            return merged;
          }
        }
      } catch {}
    } else {
      const res = await safeFetchJson<AstrologerItem[]>(`${API_BASE}/astrologers`);
      if (res.ok && Array.isArray(res.data)) {
        const nonLegacy = res.data.filter((a) => !LEGACY_IDS.has(a.id));
        if (nonLegacy.length > 0) {
          saveStoredAstrologers(nonLegacy);
          return nonLegacy;
        }
      }
    }
    return getStoredAstrologers();
  },

  createAstrologer: async (astro: Partial<AstrologerItem>): Promise<AstrologerItem> => {
    const newAstro: AstrologerItem = {
      id: astro.id || `astro-${Date.now()}`,
      name: astro.name || 'New Astrologer',
      title: astro.title || 'Vedic Jyotish Expert',
      experience: astro.experience || '10+ Years Experience',
      rating: astro.rating || 4.9,
      reviewsCount: astro.reviewsCount || '1k+ Readings',
      ratePerMin: astro.ratePerMin || 20,
      cropKey: (astro.cropKey as any) || 'astroSophia',
      customImageUrl: astro.customImageUrl,
      languages: astro.languages || ['Hindi', 'English'],
      bio: astro.bio || 'Vedic astrologer trained in Parashara Jyotish.',
      specializations: astro.specializations || ['Vedic', 'Tarot'],
      isOnline: astro.isOnline !== false,
      totalConsultations: astro.totalConsultations || 0,
      totalEarnings: astro.totalEarnings || 0
    };

    let created = newAstro;
    if (isSupabaseConfigured) {
      try {
        const rows = await supabaseMutation<any[]>('astrologers', 'POST', '', {
          id: newAstro.id,
          is_online: newAstro.isOnline,
          data: newAstro,
          updated_at: new Date().toISOString()
        });
        if (Array.isArray(rows) && rows[0]) {
          created = mapAstrologerRow(rows[0]);
        }
      } catch {}
    } else {
      const res = await safeFetchJson<{ astrologer: AstrologerItem }>(`${API_BASE}/astrologers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAstro)
      });
      if (res.ok && res.data?.astrologer) created = res.data.astrologer;
    }

    const astros = getStoredAstrologers().filter((a) => a.id !== created.id);
    astros.push(created);
    saveStoredAstrologers(astros);
    notifyAstrologersUpdated();
    return created;
  },

  updateAstrologer: async (id: string, astro: Partial<AstrologerItem>): Promise<AstrologerItem> => {
    let updated: AstrologerItem | null = null;
    const existingLocal = getStoredAstrologers().find((a) => a.id === id);

    if (isSupabaseConfigured) {
      try {
        const remoteRows = await supabaseRest<any[]>('astrologers', `?id=eq.${encodeURIComponent(id)}&select=*`).catch(() => []);
        const base = remoteRows?.[0] ? mapAstrologerRow(remoteRows[0]) : existingLocal;
        const merged = { ...(base || { id }), ...astro, id } as AstrologerItem;
        const patched = await supabaseMutation<any[]>('astrologers', 'PATCH', `?id=eq.${encodeURIComponent(id)}`, {
          is_online: merged.isOnline !== false,
          data: merged,
          updated_at: new Date().toISOString()
        });
        if (Array.isArray(patched) && patched[0]) {
          updated = mapAstrologerRow(patched[0]);
        } else {
          const inserted = await supabaseMutation<any[]>('astrologers', 'POST', '', {
            id,
            is_online: merged.isOnline !== false,
            data: merged,
            updated_at: new Date().toISOString()
          });
          if (Array.isArray(inserted) && inserted[0]) {
            updated = mapAstrologerRow(inserted[0]);
          }
        }
      } catch {}
    } else {
      const res = await safeFetchJson<{ astrologer: AstrologerItem }>(`${API_BASE}/astrologers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(astro)
      });
      if (res.ok && res.data?.astrologer) updated = res.data.astrologer;
    }

    const astros = getStoredAstrologers();
    const idx = astros.findIndex((a) => a.id === id);
    if (updated) {
      if (idx !== -1) astros[idx] = updated;
      else astros.push(updated);
      saveStoredAstrologers(astros);
      notifyAstrologersUpdated();
      return updated;
    }

    if (idx !== -1) {
      astros[idx] = { ...astros[idx], ...astro };
      saveStoredAstrologers(astros);
      notifyAstrologersUpdated();
      return astros[idx];
    }
    notifyAstrologersUpdated();
    return { ...astro, id } as AstrologerItem;
  },

  setAstrologerAvailability: async (id: string, isOnline: boolean): Promise<boolean> => {
    if (isSupabaseConfigured) {
      try {
        await invokeGauKripaChat({ action: 'set-availability', astrologerId: id, isOnline });
      } catch {
        await api.updateAstrologer(id, { isOnline });
      }
    } else {
      await safeFetchJson<{ isOnline: boolean }>(`${API_BASE}/astrologers/${id}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline })
      });
    }

    const astros = getStoredAstrologers();
    const idx = astros.findIndex((a) => a.id === id);
    if (idx !== -1) {
      astros[idx].isOnline = isOnline;
      saveStoredAstrologers(astros);
    }
    notifyAstrologersUpdated();
    return isOnline;
  },

  // Bookings
  getBookings: async (phone?: string): Promise<BookingRecord[]> => {
    if (isSupabaseConfigured) {
      try {
        const clean = phone ? normalizePhone(phone, '') : '';
        const query = clean
          ? `?phone=eq.${encodeURIComponent(clean)}&order=created_at.desc&select=*`
          : '?order=created_at.desc&select=*';
        const data = await supabaseRest<any[]>('bookings', query);
        if (Array.isArray(data)) {
          return data.map(mapBookingRow);
        }
      } catch {}
    } else {
      const url = phone ? `${API_BASE}/bookings?phone=${encodeURIComponent(phone)}` : `${API_BASE}/bookings`;
      const res = await safeFetchJson<BookingRecord[]>(url);
      if (res.ok && Array.isArray(res.data)) return res.data;
    }

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

  createBooking: async (booking: Partial<BookingRecord> & { orderId?: string; paymentId?: string }): Promise<BookingRecord> => {
    const cleanPhone = normalizePhone(booking.phone);
    const newBooking: BookingRecord & { orderId?: string; paymentId?: string } = {
      id: booking.id || `bkg-${Date.now()}`,
      bookingId: booking.bookingId || `GK-${Math.floor(100000 + Math.random() * 900000)}`,
      devoteeName: booking.devoteeName || 'Devotee',
      phone: cleanPhone,
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
      goshala: sanitizeLegacyLocationText(booking.goshala) || 'GauKripa Pramanit Goshala',
      orderId: booking.orderId,
      paymentId: booking.paymentId,
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      const session = await getActiveSessionSafe();
      if (session?.access_token && newBooking.orderId && newBooking.paymentId) {
        try {
          const fnRes = await invokeGauKripaPayments<{ success: boolean; booking?: BookingRecord }>({
            action: 'create-booking',
            booking: newBooking
          });
          if (fnRes?.booking) return fnRes.booking;
        } catch {}
      }
    } else {
      const res = await safeFetchJson<{ booking: BookingRecord }>(`${API_BASE}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking)
      });
      if (res.ok && res.data?.booking) return res.data.booking;
    }

    try {
      const stored = localStorage.getItem('gaukripa_bookings');
      const list: BookingRecord[] = stored ? JSON.parse(stored) : [];
      if (!list.some((b) => b.bookingId === newBooking.bookingId)) {
        list.unshift(newBooking);
        localStorage.setItem('gaukripa_bookings', JSON.stringify(list));
      }
    } catch {}

    return newBooking;
  },

  updateBookingStatus: async (id: string, status: BookingRecord['status']): Promise<BookingRecord> => {
    if (isSupabaseConfigured) {
      try {
        const rows = await supabaseRest<any[]>('bookings', `?or=(id.eq.${encodeURIComponent(id)},booking_id.eq.${encodeURIComponent(id)})&select=*`);
        const current = rows?.[0] ? mapBookingRow(rows[0]) : undefined;
        const nextData = { ...(current || { id }), status, whatsappSent: status === 'completed' };
        const patched = await supabaseMutation<any[]>(
          'bookings',
          'PATCH',
          `?or=(id.eq.${encodeURIComponent(id)},booking_id.eq.${encodeURIComponent(id)})`,
          { status, data: nextData, updated_at: new Date().toISOString() }
        );
        if (Array.isArray(patched) && patched[0]) return mapBookingRow(patched[0]);
      } catch {}
    } else {
      const res = await safeFetchJson<{ booking: BookingRecord }>(`${API_BASE}/bookings/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok && res.data?.booking) return res.data.booking;
    }

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
    if (isSupabaseConfigured) {
      try {
        const rows = await supabaseRest<any[]>('bookings', `?or=(id.eq.${encodeURIComponent(id)},booking_id.eq.${encodeURIComponent(id)})&select=*`);
        const current = rows?.[0] ? mapBookingRow(rows[0]) : undefined;
        const nextStatus = (proof.status || 'completed') as BookingRecord['status'];
        const nextData = {
          ...(current || { id }),
          ...proof,
          status: nextStatus,
          whatsappSent: true
        };
        const patched = await supabaseMutation<any[]>(
          'bookings',
          'PATCH',
          `?or=(id.eq.${encodeURIComponent(id)},booking_id.eq.${encodeURIComponent(id)})`,
          { status: nextStatus, data: nextData, updated_at: new Date().toISOString() }
        );
        if (Array.isArray(patched) && patched[0]) return mapBookingRow(patched[0]);
      } catch {}
    } else {
      const res = await safeFetchJson<{ booking: BookingRecord }>(`${API_BASE}/bookings/${id}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proof)
      });
      if (res.ok && res.data?.booking) return res.data.booking;
    }

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

  // Wallet: balances and transaction history (Supabase Edge Function gaukripa-payments + PostgreSQL)
  getWallet: async (phone: string): Promise<WalletInfo> => {
    const cleanPhone = normalizePhone(phone);

    if (isSupabaseConfigured) {
      const session = await getActiveSessionSafe();
      if (session?.access_token) {
        try {
          const data = await invokeGauKripaPayments<WalletInfo>({
            action: 'get-wallet',
            phone: cleanPhone
          });
          if (data) {
            try {
              localStorage.setItem(`gaukripa_wallet_${cleanPhone}`, JSON.stringify(data));
            } catch {}
            return data;
          }
        } catch {}
      }
    } else {
      const serverRes = await safeFetchJson<WalletInfo>(`${API_BASE}/wallet/${encodeURIComponent(cleanPhone)}`);
      if (serverRes.ok && serverRes.data) {
        try {
          localStorage.setItem(`gaukripa_wallet_${cleanPhone}`, JSON.stringify(serverRes.data));
        } catch {}
        return serverRes.data;
      }
    }

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

  // Standard Razorpay Checkout Methods (Seva Bookings via gaukripa-payments Edge Function)
  createOrder: async (amountInPaise: number, currency = 'INR', receipt?: string, notes?: Record<string, string>) => {
    if (!amountInPaise || amountInPaise < 100) {
      throw new Error('Minimum order amount must be at least 100 paise (₹1).');
    }

    const accountPhone = getStoredUserPhone();
    const cleanPhone = normalizePhone(accountPhone || notes?.phone, '');

    if (isSupabaseConfigured) {
      const session = await getActiveSessionSafe();
      if (!session?.access_token) {
        throw new Error('Please sign in with your email and password before paying for Seva.');
      }
      if (cleanPhone.length < 10) {
        throw new Error('Please add a valid 10-digit mobile number before making a payment.');
      }

      const data = await invokeGauKripaPayments<{
        order_id?: string;
        orderId?: string;
        amount: number;
        currency: string;
        key_id?: string;
        keyId?: string;
      }>({
        action: 'create-seva-order',
        phone: cleanPhone,
        amount_paise: Math.round(amountInPaise),
        currency,
        receipt: receipt || `gks_${Date.now()}`,
        seva_title: notes?.sevaTitle || 'GauKripa Seva Booking',
        notes: notes || {}
      });

      const orderId = data?.order_id || data?.orderId;
      const keyId = data?.key_id || data?.keyId;
      if (orderId && keyId) {
        return {
          order_id: orderId,
          amount: data.amount || amountInPaise,
          currency: (data.currency || currency || 'INR') as string,
          key_id: keyId
        };
      }
      throw new Error('Unable to create Razorpay order. Please check Razorpay LIVE configuration.');
    }

    const payload = {
      type: 'seva',
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

  verifyPayment: async (order_id: string, payment_id: string, signature: string, bookingData?: Partial<BookingRecord>) => {
    if (!order_id || !payment_id || !signature) {
      throw new Error('order_id, payment_id, and signature are required.');
    }

    if (isSupabaseConfigured) {
      const accountPhone = getStoredUserPhone();
      const cleanPhone = normalizePhone(accountPhone || bookingData?.phone, '');
      const verifyData = await invokeGauKripaPayments<{ success: boolean; verified: boolean }>({
        action: 'verify-seva-payment',
        order_id,
        payment_id,
        signature,
        phone: cleanPhone
      });

      if (!verifyData?.success || !verifyData?.verified) {
        throw new Error('Payment verification failed. Please contact support before retrying.');
      }

      if (bookingData) {
        const bookingRes = await invokeGauKripaPayments<{ success: boolean; booking?: BookingRecord }>({
          action: 'create-booking',
          booking: {
            ...bookingData,
            orderId: order_id,
            paymentId: payment_id,
            phone: cleanPhone
          }
        });
        return {
          success: true,
          verified: true,
          message: 'Payment verified and Seva booking saved.',
          booking: bookingRes?.booking
        };
      }

      return { success: true, verified: true, message: 'Payment verified.' };
    }

    const payload = { type: 'seva', order_id, payment_id, signature, ...(bookingData ? { booking: bookingData } : {}) };
    const res = await safeFetchJson<{ success: boolean; verified: boolean; message: string; booking?: any }>(
      `${API_BASE}/verify-payment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    if (res.ok && res.data?.success && res.data?.verified) {
      return res.data;
    }
    throw new Error(res.error || 'Payment verification failed. Please contact support before retrying.');
  },

  // Wallet Razorpay Recharge (Supabase Edge Function gaukripa-payments)
  createWalletOrder: async (phone: string, amount: number, name: string, email?: string) => {
    const numAmount = Number(amount);
    if (!Number.isInteger(numAmount) || numAmount < 50 || numAmount > 100000) {
      throw new Error('Minimum wallet recharge is ₹50 (whole-rupee amount up to ₹1,00,000).');
    }
    const cleanPhone = normalizePhone(phone, '');
    if (cleanPhone.length < 10) {
      throw new Error('Please add a valid 10-digit mobile number to your profile before recharging.');
    }

    if (isSupabaseConfigured) {
      const session = await getActiveSessionSafe();
      if (!session?.access_token) {
        throw new Error('Your login session expired. Please Log Out and Sign In again to recharge securely.');
      }
      const data = await invokeGauKripaPayments<{
        order_id?: string;
        orderId?: string;
        amount: number;
        currency: string;
        key_id?: string;
        keyId?: string;
      }>({
        action: 'create-order',
        phone: cleanPhone,
        amount: numAmount
      });

      const orderId = data?.order_id || data?.orderId;
      const keyId = data?.key_id || data?.keyId;
      if (orderId && keyId) {
        return {
          order_id: orderId,
          amount: data.amount || numAmount * 100,
          currency: (data.currency || 'INR') as 'INR',
          key_id: keyId
        };
      }
      throw new Error('Razorpay order creation failed. No valid order ID was returned.');
    }

    const res = await safeFetchJson<{ order_id?: string; orderId?: string; amount: number; currency: string; key_id?: string; keyId?: string }>(
      `${API_BASE}/wallet/create-razorpay-order`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          amount: numAmount,
          amountInPaise: Math.round(numAmount * 100),
          name,
          email
        })
      }
    );

    const orderId = res.data?.order_id || res.data?.orderId;
    const keyId = res.data?.key_id || res.data?.keyId || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID;

    if (res.ok && orderId && keyId) {
      return {
        order_id: orderId,
        amount: res.data?.amount || numAmount * 100,
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

    const cleanPhone = normalizePhone(payload.phone, '');
    if (cleanPhone.length < 10) {
      throw new Error('A valid 10-digit mobile number is required to verify wallet payment.');
    }

    if (isSupabaseConfigured) {
      const data = await invokeGauKripaPayments<{
        success: boolean;
        verified?: boolean;
        credited?: boolean;
        already_credited?: boolean;
        balance?: number;
        wallet?: WalletInfo;
      }>({
        action: 'verify-payment',
        order_id: payload.order_id,
        payment_id: payload.payment_id,
        signature: payload.signature,
        phone: cleanPhone
      });

      if (data?.success && data?.verified) {
        const refreshed = await api.getWallet(cleanPhone);
        return {
          success: true,
          verified: true,
          credited: data.credited !== false && !data.already_credited,
          balance: typeof data.balance === 'number' ? data.balance : refreshed.balance
        };
      }
      throw new Error('Razorpay payment could not be verified.');
    }

    const res = await safeFetchJson<{ success: boolean; verified?: boolean; credited?: boolean; message?: string; balance?: number; wallet?: WalletInfo }>(
      `${API_BASE}/wallet/verify-razorpay-payment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: payload.order_id,
          payment_id: payload.payment_id,
          signature: payload.signature,
          phone: cleanPhone
        })
      }
    );

    if (res.ok && res.data?.success && res.data?.verified) {
      const storageKey = `gaukripa_wallet_${cleanPhone}`;
      let existingTransactions: WalletInfo['transactions'] = [];
      let existingName = 'Devotee';
      try {
        const cached = localStorage.getItem(storageKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed.transactions)) existingTransactions = parsed.transactions;
          if (parsed.name) existingName = parsed.name;
        }
      } catch {}

      const verifiedWallet: WalletInfo = res.data.wallet || {
        phone: cleanPhone,
        name: existingName,
        balance: typeof res.data.balance === 'number' ? res.data.balance : 0,
        transactions: existingTransactions
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

    if (isSupabaseConfigured) {
      try {
        const [settingsData, bookingRows] = await Promise.all([
          api.getSettings(),
          supabaseRest<any[]>('bookings', `?phone=eq.${encodeURIComponent(cleanPhone)}&select=id&limit=1`).catch(() => [])
        ]);
        const hasBooking = Array.isArray(bookingRows) && bookingRows.length > 0;
        const eligible = settingsData.discountEnabled && hasBooking;
        return {
          eligible,
          ratePerMin: eligible ? settingsData.discountedRatePerMin : settingsData.standardRatePerMin,
          standardRate: settingsData.standardRatePerMin,
          discountedRate: settingsData.discountedRatePerMin,
          rule: eligible ? '50% Seva Discount Applied' : 'Standard Consultation Rate'
        };
      } catch {}
    } else {
      const res = await safeFetchJson<{ eligible: boolean; ratePerMin: number; standardRate: number; discountedRate: number; rule: string }>(
        `${API_BASE}/wallet/discount-check/${encodeURIComponent(cleanPhone)}`
      );
      if (res.ok && res.data) return res.data;
    }

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

  // Live Chat Workflow (Supabase Edge Function gaukripa-chat + PostgreSQL)
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
    const cleanPhone = normalizePhone(payload.customerPhone);

    if (isSupabaseConfigured) {
      const data = await invokeGauKripaChat<{ success: boolean; session: ChatSession }>({
        action: 'request',
        astrologerId: payload.astrologerId,
        customerConcern: payload.customerConcern,
        birthDate: payload.birthDate,
        birthTime: payload.birthTime,
        birthPlace: payload.birthPlace
      });
      if (data?.session) {
        saveLocalSession(data.session);
        broadcastChatEvent({ type: 'NEW_CHAT_REQUEST', session: data.session });
        return { success: true, session: data.session };
      }
    }

    const res = await safeFetchJson<{ success: boolean; session: ChatSession }>(`${API_BASE}/chat/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    let session: ChatSession;
    if (res.ok && res.data?.session) {
      session = res.data.session;
    } else {
      const astros = getStoredAstrologers();
      const astro = astros.find((a) => a.id === payload.astrologerId) || astros[0];
      const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const defaultMessages: ChatMessage[] =
        payload.initialMessages && payload.initialMessages.length > 0
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
        customerId: payload.customerId || cleanPhone,
        customerName: payload.customerName || 'Devotee',
        customerPhone: cleanPhone,
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

    saveLocalSession(session);
    broadcastChatEvent({ type: 'NEW_CHAT_REQUEST', session });
    return { success: true, session };
  },

  getIncomingChat: async (astrologerId: string): Promise<ChatSession | null> => {
    const targetAstro = astrologerId || 'all';

    if (isSupabaseConfigured) {
      const session = await getActiveSessionSafe();
      if (session?.access_token) {
        try {
          const data = await invokeGauKripaChat<{ incoming: ChatSession | null }>({
            action: 'incoming',
            astrologerId: targetAstro
          });
          if (data?.incoming) {
            saveLocalSession(data.incoming);
            return data.incoming;
          }
          return null;
        } catch {}
      }
      return null;
    }

    const res = await safeFetchJson<{ incoming: ChatSession | null }>(`${API_BASE}/chat/incoming/${encodeURIComponent(targetAstro)}`);
    if (res.ok && res.data?.incoming) {
      saveLocalSession(res.data.incoming);
      return res.data.incoming;
    }

    if (targetAstro !== 'all') {
      const local = getAstrologerActiveSession(targetAstro);
      if (local) return local;
    }
    return null;
  },

  respondChat: async (sessionId: string, astrologerId: string, action: 'accept' | 'reject'): Promise<ChatSession> => {
    if (isSupabaseConfigured) {
      const data = await invokeGauKripaChat<{ session: ChatSession }>({
        action: 'respond',
        sessionId,
        astrologerId,
        response: action
      });
      if (data?.session) {
        saveLocalSession(data.session);
        broadcastChatEvent({ type: 'CHAT_ACCEPTED', session: data.session });
        return data.session;
      }
    }

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
    const local = getLocalSession(sessionId);

    if (isSupabaseConfigured) {
      const data = await invokeGauKripaChat<{ session: ChatSession; customerWalletBalance: number }>({
        action: 'get-session',
        sessionId
      });
      if (data?.session) {
        if (local && local.messages.length > (data.session.messages?.length || 0)) {
          data.session.messages = local.messages;
        }
        saveLocalSession(data.session);
        return data;
      }
    } else {
      const res = await safeFetchJson<{ session: ChatSession; customerWalletBalance: number }>(`${API_BASE}/chat/session/${sessionId}`);
      if (res.ok && res.data?.session) {
        if (local && local.messages.length > (res.data.session.messages?.length || 0)) {
          res.data.session.messages = local.messages;
        }
        saveLocalSession(res.data.session);
        return res.data;
      }
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
    if (isSupabaseConfigured) {
      const data = await invokeGauKripaChat<{ success: boolean; message: ChatMessage; session: ChatSession }>({
        action: 'send-message',
        sessionId,
        text: payload.text,
        suggestedSeva: payload.suggestedSeva,
        clientMessageId: payload.clientMessageId
      });
      if (data?.message && data?.session) {
        saveLocalSession(data.session);
        broadcastChatEvent({ type: 'NEW_MESSAGE', sessionId, message: data.message, session: data.session });
        return data.message;
      }
    }

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
    if (isSupabaseConfigured) {
      return await invokeGauKripaChat<{
        durationSeconds: number;
        totalCharged: number;
        astrologerEarned: number;
        walletBalance: number;
        status: string;
      }>({ action: 'heartbeat', sessionId });
    }

    const res = await safeFetchJson<{
      durationSeconds: number;
      totalCharged: number;
      astrologerEarned: number;
      walletBalance: number;
      status: string;
    }>(`${API_BASE}/chat/session/${sessionId}/heartbeat`, { method: 'POST' });
    if (res.ok && res.data) return res.data;

    const { session, customerWalletBalance } = await api.getChatSession(sessionId);
    return {
      durationSeconds: session.durationSeconds || 0,
      totalCharged: session.totalCharged || 0,
      astrologerEarned: session.astrologerEarned || 0,
      walletBalance: customerWalletBalance,
      status: session.status
    };
  },

  endChat: async (sessionId: string): Promise<ChatSession> => {
    broadcastChatEvent({ type: 'CHAT_ENDED', sessionId });

    if (isSupabaseConfigured) {
      const data = await invokeGauKripaChat<{ session: ChatSession }>({
        action: 'end',
        sessionId
      });
      if (data?.session) {
        saveLocalSession(data.session);
        return data.session;
      }
    }

    const res = await safeFetchJson<{ session: ChatSession }>(`${API_BASE}/chat/session/${sessionId}/end`, { method: 'POST' });
    if (res.ok && res.data?.session) {
      saveLocalSession(res.data.session);
      return res.data.session;
    }

    const { session } = await api.getChatSession(sessionId);
    session.status = 'ended';
    session.endedAt = new Date().toISOString();
    saveLocalSession(session);
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

    if (isSupabaseConfigured) {
      const session = await getActiveSessionSafe();
      if (session?.access_token) {
        try {
          return await invokeGauKripaChat<{
            sessions: ChatSession[];
            analytics: {
              totalConsultations: number;
              todayEarnings: number;
              weeklyEarnings: number;
              monthlyEarnings: number;
            };
          }>({ action: 'history', astrologerId: isAll ? 'all' : astrologerId });
        } catch {}
      }
      return {
        sessions: [],
        analytics: { totalConsultations: 0, todayEarnings: 0, weeklyEarnings: 0, monthlyEarnings: 0 }
      };
    }

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

    return {
      sessions: [],
      analytics: { totalConsultations: 0, todayEarnings: 0, weeklyEarnings: 0, monthlyEarnings: 0 }
    };
  },

  // Settings (live table: app_settings, id: 'global')
  getSettings: async (): Promise<AppSettings> => {
    if (isSupabaseConfigured) {
      try {
        const rows = await supabaseRest<any[]>('app_settings', '?id=eq.global&select=*');
        if (Array.isArray(rows) && rows[0]) return mapSettingsRow(rows[0]);
      } catch {}
    } else {
      const res = await safeFetchJson<AppSettings>(`${API_BASE}/settings`);
      if (res.ok && res.data) return res.data;
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
    const merged = { ...current, ...settings };

    if (isSupabaseConfigured) {
      try {
        const patched = await supabaseMutation<any[]>('app_settings', 'PATCH', '?id=eq.global', {
          data: merged,
          updated_at: new Date().toISOString()
        });
        if (Array.isArray(patched) && patched[0]) return mapSettingsRow(patched[0]);
      } catch {}
    } else {
      const res = await safeFetchJson<{ settings: AppSettings }>(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok && res.data?.settings) return res.data.settings;
    }

    try {
      localStorage.setItem('gaukripa_settings', JSON.stringify(merged));
    } catch {}
    return merged;
  },

  // Reviews
  getReviews: async (): Promise<ReviewItem[]> => {
    if (isSupabaseConfigured) {
      try {
        const rows = await supabaseRest<any[]>('reviews', '?order=created_at.desc&select=*');
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map(mapReviewRow);
        }
      } catch {}
    } else {
      const res = await safeFetchJson<ReviewItem[]>(`${API_BASE}/reviews`);
      if (res.ok && Array.isArray(res.data)) return res.data;
    }

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
    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      name: review.name || 'Devotee',
      city: review.city || 'India',
      seva: review.seva || 'Gau Seva',
      oneLiner: review.oneLiner || 'Sacred experience with GauKripa.',
      stars: review.stars || 5,
      isApproved: review.isApproved !== false,
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      try {
        const inserted = await supabaseMutation<any[]>('reviews', 'POST', '', {
          id: newRev.id,
          is_approved: newRev.isApproved,
          data: newRev,
          created_at: newRev.createdAt
        });
        if (Array.isArray(inserted) && inserted[0]) return mapReviewRow(inserted[0]);
      } catch {}
    } else {
      const res = await safeFetchJson<{ review: ReviewItem }>(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRev)
      });
      if (res.ok && res.data?.review) return res.data.review;
    }

    const reviews = await api.getReviews();
    reviews.unshift(newRev);
    try {
      localStorage.setItem('gaukripa_reviews', JSON.stringify(reviews));
    } catch {}
    return newRev;
  },

  approveReview: async (id: string, isApproved: boolean): Promise<ReviewItem> => {
    if (isSupabaseConfigured) {
      try {
        const rows = await supabaseRest<any[]>('reviews', `?id=eq.${encodeURIComponent(id)}&select=*`).catch(() => []);
        const current = rows?.[0] ? mapReviewRow(rows[0]) : { id };
        const nextData = { ...current, isApproved };
        const patched = await supabaseMutation<any[]>('reviews', 'PATCH', `?id=eq.${encodeURIComponent(id)}`, {
          is_approved: isApproved,
          data: nextData
        });
        if (Array.isArray(patched) && patched[0]) return mapReviewRow(patched[0]);
      } catch {}
    } else {
      const res = await safeFetchJson<{ review: ReviewItem }>(`${API_BASE}/reviews/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved })
      });
      if (res.ok && res.data?.review) return res.data.review;
    }

    const reviews = await api.getReviews();
    const idx = reviews.findIndex((r) => r.id === id);
    if (idx !== -1) {
      reviews[idx].isApproved = isApproved;
      try {
        localStorage.setItem('gaukripa_reviews', JSON.stringify(reviews));
      } catch {}
      return reviews[idx];
    }
    return { id, isApproved } as any;
  },

  deleteReview: async (id: string): Promise<boolean> => {
    if (isSupabaseConfigured) {
      try {
        await supabaseMutation('reviews', 'DELETE', `?id=eq.${encodeURIComponent(id)}`);
        return true;
      } catch {}
    } else {
      const res = await safeFetchJson<{ success: boolean }>(`${API_BASE}/reviews/${id}`, { method: 'DELETE' });
      if (res.ok) return true;
    }

    const reviews = (await api.getReviews()).filter((r) => r.id !== id);
    try {
      localStorage.setItem('gaukripa_reviews', JSON.stringify(reviews));
    } catch {}
    return true;
  },

  // Media Upload helper (Supabase Storage via gaukripa_supabase_session -> Compressed DataURL fallback)
  uploadMediaFile: async (file: File): Promise<string> => {
    if (isSupabaseConfigured) {
      try {
        return await uploadGauKripaMedia(file);
      } catch (err: any) {
        if (err?.message) throw err;
      }
    }

    const readRaw = (): Promise<string> =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });

    const rawDataUrl = await readRaw();
    try {
      const res = await safeFetchJson<{ url: string }>(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl: rawDataUrl, fileName: file.name })
      });
      if (res.ok && res.data?.url) {
        return res.data.url;
      }
    } catch {}
    return rawDataUrl;
  },

  getDatabaseStatus: async (): Promise<{
    connected: boolean;
    projectId: string;
    databaseId?: string;
    collections?: Record<string, number>;
    error?: string;
  }> => {
    if (isSupabaseConfigured) {
      try {
        const [srv, ast, rev] = await Promise.all([
          supabaseRest<any[]>('services', '?select=id').catch(() => []),
          supabaseRest<any[]>('astrologers', '?select=id').catch(() => []),
          supabaseRest<any[]>('reviews', '?select=id').catch(() => [])
        ]);
        const bkg = await supabaseRest<any[]>('bookings', '?select=id').catch(() => []);
        return {
          connected: true,
          projectId: getSupabaseProjectRef(),
          databaseId: 'Supabase PostgreSQL',
          collections: {
            services: Array.isArray(srv) ? srv.length : 0,
            astrologers: Array.isArray(ast) ? ast.length : 0,
            bookings: Array.isArray(bkg) ? bkg.length : 0,
            reviews: Array.isArray(rev) ? rev.length : 0
          }
        };
      } catch {}
    }

    const res = await safeFetchJson<{
      connected: boolean;
      projectId: string;
      databaseId?: string;
      collections?: Record<string, number>;
    }>(`${API_BASE}/database/status`);
    if (res.ok && res.data) return res.data;

    return {
      connected: true,
      projectId: getSupabaseProjectRef(),
      databaseId: 'Supabase PostgreSQL',
      collections: { services: 6, astrologers: 2, bookings: 0, reviews: 5 }
    };
  },

  // User Registration (Supabase Auth + PostgreSQL app_users)
  registerUser: async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ success: boolean; message: string }> => {
    const trimmedName = (data.name || '').trim();
    const trimmedEmail = (data.email || '').trim().toLowerCase();
    const trimmedPass = (data.password || '').trim();
    const trimmedPhone = normalizePhone(data.phone, '');

    if (!trimmedName) throw new Error('Please enter your full name.');
    if (!trimmedEmail) throw new Error('Please enter your email address.');
    if (trimmedPass.length < 8) throw new Error('Password must be at least 8 characters long.');
    if (trimmedPhone.length !== 10) throw new Error('Please enter a valid 10-digit mobile number.');

    if (isSupabaseConfigured) {
      const auth = await supabaseAuth('signup', {
        email: trimmedEmail,
        password: trimmedPass,
        data: { name: trimmedName, full_name: trimmedName, phone: trimmedPhone }
      });

      if (auth?.access_token && auth?.user) {
        const session: SupabaseSession = {
          access_token: auth.access_token,
          refresh_token: auth.refresh_token,
          expires_at: auth.expires_at,
          user: auth.user
        };
        await saveSupabaseSession(session);
        if (supabase && auth.refresh_token) {
          try {
            await supabase.auth.setSession({
              access_token: auth.access_token,
              refresh_token: auth.refresh_token
            });
          } catch {}
        }
      }

      return {
        success: true,
        message: 'Account created successfully! Please sign in with your email and password.'
      };
    }

    const serverRes = await safeFetchJson<{ success: boolean; message: string }>(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmedName, email: trimmedEmail, password: trimmedPass, phone: trimmedPhone })
    });

    if (serverRes.ok && serverRes.data?.success) {
      return serverRes.data;
    }

    throw new Error(serverRes.error || 'Failed to register user.');
  },

  // Authentication: Supabase Auth + app_users Role-based profile
  login: async (credentials: { email: string; password: string; phone?: string }): Promise<{
    success: boolean;
    user: {
      name: string;
      email: string;
      role: 'super_admin' | 'admin' | 'astrologer' | 'devotee';
      astrologerId?: string;
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

    if (isSupabaseConfigured) {
      const auth = await supabaseAuth('token?grant_type=password', {
        email: trimmedEmail,
        password: trimmedPass
      });

      if (!auth?.access_token || !auth?.user) {
        throw new Error('Invalid email or password. Please try again.');
      }

      const session: SupabaseSession = {
        access_token: auth.access_token,
        refresh_token: auth.refresh_token,
        expires_at: auth.expires_at,
        user: auth.user
      };
      await saveSupabaseSession(session);

      if (supabase && auth.refresh_token) {
        try {
          await supabase.auth.setSession({
            access_token: auth.access_token,
            refresh_token: auth.refresh_token
          });
        } catch {}
      }

      const rows = await supabaseRest<any[]>(
        'app_users',
        `?auth_user_id=eq.${encodeURIComponent(auth.user.id)}&select=id,email,full_name,phone,role,astrologer_id`,
        auth.access_token
      ).catch(() => []);

      const profile = rows?.[0];
      const meta = auth.user.user_metadata || {};
      const resolvedRole = (
        profile?.role ||
        (trimmedEmail === 'bankush014@gmail.com' ? 'super_admin' : 'devotee')
      ) as 'super_admin' | 'admin' | 'astrologer' | 'devotee';

      const user = {
        name:
          profile?.full_name ||
          String(meta.full_name || meta.name || (resolvedRole === 'super_admin' ? 'Super Admin' : 'Devotee')),
        email: profile?.email || auth.user.email || trimmedEmail,
        role: resolvedRole,
        astrologerId: profile?.astrologer_id || undefined,
        phone: normalizePhone(profile?.phone || String(meta.phone || credentials.phone || ''), ''),
        isAdmin: resolvedRole === 'super_admin' || resolvedRole === 'admin'
      };

      try {
        localStorage.setItem('gaukripa_user', JSON.stringify(user));
      } catch {}
      return { success: true, user };
    }

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
      try {
        localStorage.setItem('gaukripa_user', JSON.stringify(serverRes.data.user));
      } catch {}
      return serverRes.data;
    }

    throw new Error(serverRes.error || 'Account not found or invalid credentials.');
  },

  logout: async (): Promise<void> => {
    clearSupabaseSession();
    try {
      localStorage.removeItem('gaukripa_user');
    } catch {}
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
  }
};
