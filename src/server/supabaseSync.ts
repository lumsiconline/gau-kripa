import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  DbService,
  DbAstrologer,
  DbBooking,
  DbChatSession,
  DbWallet,
  DbReview,
  DbSettings,
  DbSchema
} from './db';

let supabaseAdmin: SupabaseClient | null = null;
let isSupabaseAvailable = false;

function getAdminClient(): SupabaseClient | null {
  if (supabaseAdmin) return supabaseAdmin;
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !key) {
    return null;
  }
  supabaseAdmin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  return supabaseAdmin;
}

function getProjectRef(): string {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  if (!url) return 'local-storage';
  try {
    return new URL(url).hostname.split('.')[0] || 'supabase';
  } catch {
    return 'supabase';
  }
}

export async function initSupabaseDatabase(localDb: DbSchema) {
  const client = getAdminClient();
  if (!client) {
    console.log('ℹ️ Supabase server credentials not configured. Operating in local database mode (src/server/db.json).');
    isSupabaseAvailable = false;
    return;
  }

  try {
    const { data: existingSettings, error } = await client
      .from('settings')
      .select('id')
      .eq('id', 'config')
      .maybeSingle();

    if (error) {
      throw error;
    }

    isSupabaseAvailable = true;

    if (!existingSettings) {
      console.log('🌱 Seeding initial GauKripa catalog and data to Supabase PostgreSQL...');
      await syncSettings(localDb.settings);
      for (const service of localDb.services) await syncService(service);
      for (const astro of localDb.astrologers) await syncAstrologer(astro);
      for (const booking of localDb.bookings) await syncBooking(booking);
      for (const wallet of Object.values(localDb.wallets)) await syncWallet(wallet);
      for (const review of localDb.reviews) await syncReview(review);
      console.log('✅ Initial data synced to Supabase PostgreSQL.');
    } else {
      console.log(`✅ Connected to Supabase PostgreSQL (${getProjectRef()}).`);
    }
  } catch (err: any) {
    isSupabaseAvailable = false;
    console.log('ℹ️ Supabase PostgreSQL unreachable. Falling back cleanly to local database mode:', err?.message || err);
  }
}

export async function syncService(service: DbService) {
  const client = getAdminClient();
  if (!isSupabaseAvailable || !client) return;
  try {
    await client.from('services').upsert({
      id: service.id,
      title: service.title,
      planet: service.planet,
      planet_tag: service.planetTag,
      tag_color: service.tagColor,
      price_display: service.priceDisplay,
      base_price: service.basePrice,
      unit: service.unit,
      min_qty: service.minQty,
      benefit: service.benefit,
      crop_key: service.cropKey,
      custom_image_url: service.customImageUrl || null,
      detailed_description: service.detailedDescription,
      vedic_significance: service.vedicSignificance,
      is_active: service.isActive,
      category: service.category
    });
  } catch {}
}

export async function deleteService(id: string) {
  const client = getAdminClient();
  if (!isSupabaseAvailable || !client) return;
  try {
    await client.from('services').delete().eq('id', id);
  } catch {}
}

export async function syncAstrologer(astro: DbAstrologer) {
  const client = getAdminClient();
  if (!isSupabaseAvailable || !client) return;
  try {
    await client.from('astrologers').upsert({
      id: astro.id,
      name: astro.name,
      title: astro.title,
      experience: astro.experience,
      rating: astro.rating,
      reviews_count: astro.reviewsCount,
      rate_per_min: astro.ratePerMin,
      crop_key: astro.cropKey,
      custom_image_url: astro.customImageUrl || null,
      languages: astro.languages,
      bio: astro.bio,
      specializations: astro.specializations,
      is_online: astro.isOnline,
      total_consultations: astro.totalConsultations,
      total_earnings: astro.totalEarnings
    });
  } catch {}
}

export async function syncBooking(booking: DbBooking) {
  const client = getAdminClient();
  if (!isSupabaseAvailable || !client) return;
  try {
    await client.from('bookings').upsert({
      id: booking.id,
      booking_id: booking.bookingId,
      devotee_name: booking.devoteeName,
      phone: booking.phone,
      email: booking.email || '',
      gotra: booking.gotra,
      seva_id: booking.sevaId,
      seva_title: booking.sevaTitle,
      quantity: booking.quantity,
      duration: booking.duration,
      occasion: booking.occasion,
      amount: booking.amount,
      base_amount: booking.baseAmount,
      extra_fee: booking.extraFee,
      status: booking.status,
      date: booking.date,
      family_members: booking.familyMembers || [],
      sankalp_wish: booking.sankalpWish || '',
      goshala: booking.goshala,
      video_proof_url: booking.videoProofUrl || null,
      photo_proof_urls: booking.photoProofUrls || [],
      priest_name: booking.priestName || null,
      whatsapp_sent: Boolean(booking.whatsappSent),
      created_at: booking.createdAt
    });
  } catch {}
}

export async function syncChatSession(session: DbChatSession) {
  const client = getAdminClient();
  if (!isSupabaseAvailable || !client) return;
  try {
    await client.from('chat_sessions').upsert({
      id: session.id,
      astrologer_id: session.astrologerId,
      astrologer_name: session.astrologerName,
      customer_id: session.customerId,
      customer_name: session.customerName,
      customer_phone: session.customerPhone,
      customer_concern: session.customerConcern,
      birth_date: session.birthDate || null,
      birth_time: session.birthTime || null,
      birth_place: session.birthPlace || null,
      status: session.status,
      rate_per_min: session.ratePerMin,
      has_discount: session.hasDiscount,
      created_at: session.createdAt,
      started_at: session.startedAt || null,
      ended_at: session.endedAt || null,
      last_heartbeat: session.lastHeartbeat || null,
      duration_seconds: session.durationSeconds,
      total_charged: session.totalCharged,
      astrologer_earned: session.astrologerEarned,
      messages: session.messages
    });
  } catch {}
}

export async function syncWallet(wallet: DbWallet) {
  const client = getAdminClient();
  if (!isSupabaseAvailable || !client) return;
  try {
    await client.from('wallets').upsert({
      phone: wallet.phone,
      name: wallet.name,
      balance: wallet.balance
    });
    for (const tx of wallet.transactions || []) {
      await client.from('wallet_transactions').upsert(
        {
          id: tx.id,
          wallet_phone: wallet.phone,
          type: tx.type,
          amount: tx.amount,
          description: tx.description,
          payment_id: tx.paymentId || null,
          order_id: tx.orderId || null,
          created_at: tx.date
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );
    }
  } catch {}
}

export async function syncReview(review: DbReview) {
  const client = getAdminClient();
  if (!isSupabaseAvailable || !client) return;
  try {
    await client.from('reviews').upsert({
      id: review.id,
      name: review.name,
      city: review.city,
      seva: review.seva,
      one_liner: review.oneLiner,
      stars: review.stars,
      is_approved: review.isApproved,
      created_at: review.createdAt
    });
  } catch {}
}

export async function deleteReview(id: string) {
  const client = getAdminClient();
  if (!isSupabaseAvailable || !client) return;
  try {
    await client.from('reviews').delete().eq('id', id);
  } catch {}
}

export async function syncSettings(settings: DbSettings) {
  const client = getAdminClient();
  if (!isSupabaseAvailable || !client) return;
  try {
    await client.from('settings').upsert({
      id: 'config',
      standard_rate_per_min: settings.standardRatePerMin,
      discounted_rate_per_min: settings.discountedRatePerMin,
      discount_enabled: settings.discountEnabled,
      extra_occasion_fee: settings.extraOccasionFee,
      promo_banner_text: settings.promoBannerText,
      banner_enabled: settings.bannerEnabled,
      trust_name: settings.trustName
    });
  } catch {}
}

export async function getSupabaseStats() {
  const client = getAdminClient();
  if (!isSupabaseAvailable || !client) {
    return {
      connected: false,
      mode: 'local_database',
      projectId: getProjectRef(),
      databaseId: 'src/server/db.json',
      status: 'Using local persistent JSON storage until SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    };
  }

  try {
    const [srv, ast, bkg, wlt, rev] = await Promise.all([
      client.from('services').select('id', { count: 'exact', head: true }),
      client.from('astrologers').select('id', { count: 'exact', head: true }),
      client.from('bookings').select('id', { count: 'exact', head: true }),
      client.from('wallets').select('phone', { count: 'exact', head: true }),
      client.from('reviews').select('id', { count: 'exact', head: true })
    ]);

    return {
      connected: true,
      projectId: getProjectRef(),
      databaseId: 'Supabase PostgreSQL',
      collections: {
        services: srv.count || 0,
        astrologers: ast.count || 0,
        bookings: bkg.count || 0,
        wallets: wlt.count || 0,
        reviews: rev.count || 0
      }
    };
  } catch (err: any) {
    return {
      connected: false,
      projectId: getProjectRef(),
      databaseId: 'Supabase PostgreSQL',
      error: err?.message || String(err)
    };
  }
}
