-- GauKripa Complete PostgreSQL Schema, RLS Policies, Atomic Wallet RPCs & Seed Migration
-- Replaces Firebase Firestore & Cloud Functions with Supabase PostgreSQL

create extension if not exists pgcrypto;

-- 1. Profiles (Application users linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text unique not null,
  name text not null,
  phone text not null,
  role text not null default 'devotee' check (role in ('devotee', 'super_admin')),
  password_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Wallets (Phone-keyed so existing balances and Seva bookings preserve seamlessly)
create table if not exists public.wallets (
  phone text primary key,
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null default 'Devotee',
  balance numeric(12,2) not null default 0 check (balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Wallet Transactions (Immutable server-managed ledger)
create table if not exists public.wallet_transactions (
  id text primary key,
  wallet_phone text not null references public.wallets(phone) on delete cascade,
  type text not null check (type in ('credit', 'debit')),
  amount numeric(12,2) not null check (amount > 0),
  description text not null,
  payment_id text unique,
  order_id text,
  created_at timestamptz not null default now()
);

create index if not exists idx_wallet_transactions_phone_created
  on public.wallet_transactions (wallet_phone, created_at desc);

-- 4. Razorpay Wallet Orders (Server-side order integrity)
create table if not exists public.razorpay_wallet_orders (
  order_id text primary key,
  phone text not null,
  name text not null default 'Devotee',
  email text default '',
  amount numeric(12,2) not null check (amount >= 50 and amount <= 100000),
  amount_paise integer not null check (amount_paise >= 5000),
  currency text not null default 'INR',
  status text not null default 'created' check (status in ('created', 'captured', 'failed')),
  payment_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- 5. Razorpay Wallet Payments (Idempotency ledger preventing double-crediting)
create table if not exists public.razorpay_wallet_payments (
  payment_id text primary key,
  order_id text not null references public.razorpay_wallet_orders(order_id),
  phone text not null,
  amount numeric(12,2) not null,
  currency text not null default 'INR',
  verified boolean not null default false,
  wallet_credited boolean not null default false,
  verified_at timestamptz not null default now()
);

-- 6. Razorpay Seva Orders (For direct Seva checkout verification)
create table if not exists public.razorpay_seva_orders (
  order_id text primary key,
  amount_paise integer not null check (amount_paise >= 100),
  currency text not null default 'INR',
  receipt text,
  notes jsonb not null default '{}'::jsonb,
  status text not null default 'created' check (status in ('created', 'captured', 'failed')),
  payment_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- 7. Services (Gau Seva Catalog)
create table if not exists public.services (
  id text primary key,
  title text not null,
  planet text not null,
  planet_tag text not null,
  tag_color text not null,
  price_display text not null,
  base_price numeric(10,2) not null,
  unit text not null,
  min_qty integer not null default 1,
  benefit text not null,
  crop_key text not null,
  custom_image_url text,
  detailed_description text not null,
  vedic_significance text not null,
  is_active boolean not null default true,
  category text not null default 'cow',
  created_at timestamptz not null default now()
);

-- 8. Astrologers
create table if not exists public.astrologers (
  id text primary key,
  name text not null,
  title text not null,
  experience text not null,
  rating numeric(3,2) not null default 4.9,
  reviews_count text not null default '100+ reviews',
  rate_per_min numeric(10,2) not null default 20,
  crop_key text not null default 'astroSophia',
  custom_image_url text,
  languages jsonb not null default '["Hindi","English"]'::jsonb,
  bio text not null default '',
  specializations jsonb not null default '["Vedic Kundali","Grah Shanti"]'::jsonb,
  is_online boolean not null default true,
  total_consultations integer not null default 0,
  total_earnings numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

-- 9. Bookings (Gau Seva Sankalps & Proof Videos)
create table if not exists public.bookings (
  id text primary key,
  booking_id text unique not null,
  devotee_name text not null,
  phone text not null,
  email text default '',
  gotra text not null default 'Kashyap',
  seva_id text not null,
  seva_title text not null,
  quantity text not null,
  duration text not null,
  occasion text not null default 'General Daily Seva',
  amount numeric(10,2) not null,
  base_amount numeric(10,2) not null,
  extra_fee numeric(10,2) not null default 0,
  status text not null default 'confirmed' check (status in ('confirmed', 'in_progress', 'completed', 'cancelled')),
  date text not null,
  family_members jsonb not null default '[]'::jsonb,
  sankalp_wish text default '',
  goshala text not null default 'Surabhi Seva Dham, Vrindavan',
  video_proof_url text,
  photo_proof_urls jsonb default '[]'::jsonb,
  priest_name text,
  whatsapp_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_bookings_phone on public.bookings (phone);

-- 10. Chat Sessions (Live Astrologer Consultations)
create table if not exists public.chat_sessions (
  id text primary key,
  astrologer_id text not null,
  astrologer_name text not null,
  customer_id text not null,
  customer_name text not null,
  customer_phone text not null,
  customer_concern text not null,
  birth_date text,
  birth_time text,
  birth_place text,
  status text not null default 'active' check (status in ('waiting_approval', 'active', 'rejected', 'ended')),
  rate_per_min numeric(10,2) not null default 20,
  has_discount boolean not null default false,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  ended_at timestamptz,
  last_heartbeat timestamptz,
  duration_seconds integer not null default 0,
  total_charged numeric(10,2) not null default 0,
  astrologer_earned numeric(10,2) not null default 0,
  messages jsonb not null default '[]'::jsonb
);

create index if not exists idx_chat_sessions_astro_status on public.chat_sessions (astrologer_id, status);

-- 11. Settings
create table if not exists public.settings (
  id text primary key,
  standard_rate_per_min numeric(10,2) not null default 20,
  discounted_rate_per_min numeric(10,2) not null default 10,
  discount_enabled boolean not null default true,
  extra_occasion_fee numeric(10,2) not null default 21,
  promo_banner_text text not null default '',
  banner_enabled boolean not null default true,
  trust_name text not null default 'GauKripa Seva Trust',
  updated_at timestamptz not null default now()
);

-- 12. Reviews
create table if not exists public.reviews (
  id text primary key,
  name text not null,
  city text not null,
  seva text not null,
  one_liner text not null,
  stars integer not null default 5 check (stars between 1 and 5),
  is_approved boolean not null default true,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- RLS Helper Functions
-- =====================================================================

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.auth_user_id = auth.uid()
      and p.role = 'super_admin'
  )
  or lower(coalesce(auth.jwt() ->> 'email', '')) = 'bankush014@gmail.com';
$$;

create or replace function public.current_user_phone()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.phone from public.profiles p where p.auth_user_id = auth.uid() limit 1),
    nullif(right(regexp_replace(coalesce(auth.jwt() -> 'user_metadata' ->> 'phone', ''), '[^0-9]', '', 'g'), 10), '')
  );
$$;

-- =====================================================================
-- Atomic Server-Only Wallet RPCs (service_role only)
-- =====================================================================

create or replace function public.credit_wallet_from_verified_payment(
  p_order_id text,
  p_payment_id text,
  p_phone text,
  p_name text,
  p_amount numeric
)
returns table (credited boolean, balance numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_already_credited boolean;
  v_next_balance numeric(12,2);
begin
  select wallet_credited
    into v_already_credited
    from public.razorpay_wallet_payments
    where payment_id = p_payment_id
    for update;

  insert into public.wallets (phone, name, balance)
  values (p_phone, coalesce(nullif(trim(p_name), ''), 'Devotee'), 0)
  on conflict (phone) do nothing;

  select w.balance
    into v_next_balance
    from public.wallets w
    where w.phone = p_phone
    for update;

  if coalesce(v_already_credited, false) then
    return query select false, coalesce(v_next_balance, 0);
    return;
  end if;

  v_next_balance := round((coalesce(v_next_balance, 0) + p_amount)::numeric, 2);

  update public.wallets
     set balance = v_next_balance,
         name = coalesce(nullif(trim(p_name), ''), name),
         updated_at = now()
   where phone = p_phone;

  insert into public.wallet_transactions (
    id, wallet_phone, type, amount, description, payment_id, order_id, created_at
  ) values (
    p_payment_id,
    p_phone,
    'credit',
    p_amount,
    'Wallet recharge via Razorpay',
    p_payment_id,
    p_order_id,
    now()
  )
  on conflict (id) do nothing;

  insert into public.razorpay_wallet_payments (
    payment_id, order_id, phone, amount, currency, verified, wallet_credited, verified_at
  ) values (
    p_payment_id, p_order_id, p_phone, p_amount, 'INR', true, true, now()
  )
  on conflict (payment_id) do update
    set verified = true,
        wallet_credited = true,
        verified_at = now();

  update public.razorpay_wallet_orders
     set status = 'captured',
         payment_id = p_payment_id,
         paid_at = now()
   where order_id = p_order_id;

  return query select true, v_next_balance;
end;
$$;

revoke all on function public.credit_wallet_from_verified_payment(text, text, text, text, numeric) from public, anon, authenticated;
grant execute on function public.credit_wallet_from_verified_payment(text, text, text, text, numeric) to service_role;

create or replace function public.debit_wallet_for_chat(
  p_phone text,
  p_amount numeric,
  p_description text,
  p_tx_id text
)
returns table (debited boolean, balance numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current numeric(12,2);
  v_next numeric(12,2);
begin
  select w.balance
    into v_current
    from public.wallets w
    where w.phone = p_phone
    for update;

  if v_current is null or v_current < p_amount then
    return query select false, coalesce(v_current, 0);
    return;
  end if;

  v_next := round((v_current - p_amount)::numeric, 2);

  update public.wallets
     set balance = v_next,
         updated_at = now()
   where phone = p_phone;

  insert into public.wallet_transactions (
    id, wallet_phone, type, amount, description, created_at
  ) values (
    p_tx_id, p_phone, 'debit', p_amount, p_description, now()
  )
  on conflict (id) do nothing;

  return query select true, v_next;
end;
$$;

revoke all on function public.debit_wallet_for_chat(text, numeric, text, text) from public, anon, authenticated;
grant execute on function public.debit_wallet_for_chat(text, numeric, text, text) to service_role;

-- =====================================================================
-- Row Level Security (RLS) Policies
-- =====================================================================

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.razorpay_wallet_orders enable row level security;
alter table public.razorpay_wallet_payments enable row level security;
alter table public.razorpay_seva_orders enable row level security;
alter table public.services enable row level security;
alter table public.astrologers enable row level security;
alter table public.bookings enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.settings enable row level security;
alter table public.reviews enable row level security;

-- Profiles: Users read/update own profile only (role escalation blocked); Super Admin reads all
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = auth_user_id or public.is_super_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (auth.uid() = auth_user_id or public.is_super_admin())
  with check (
    public.is_super_admin()
    or (auth.uid() = auth_user_id and role = 'devotee')
  );

-- Wallets: Read-only for wallet owner or Super Admin. Direct client writes are DENIED.
drop policy if exists "wallets_select_owner_or_admin" on public.wallets;
create policy "wallets_select_owner_or_admin" on public.wallets
  for select using (
    auth_user_id = auth.uid()
    or phone = public.current_user_phone()
    or public.is_super_admin()
  );

-- Wallet transactions: Read-only for owner or Super Admin. Direct client writes are DENIED.
drop policy if exists "wallet_tx_select_owner_or_admin" on public.wallet_transactions;
create policy "wallet_tx_select_owner_or_admin" on public.wallet_transactions
  for select using (
    wallet_phone = public.current_user_phone()
    or exists (
      select 1 from public.wallets w
      where w.phone = wallet_phone and w.auth_user_id = auth.uid()
    )
    or public.is_super_admin()
  );

-- Payment order & idempotency tables: Super Admin read-only; writes strictly via service_role Edge Functions
drop policy if exists "rzp_wallet_orders_admin_read" on public.razorpay_wallet_orders;
create policy "rzp_wallet_orders_admin_read" on public.razorpay_wallet_orders
  for select using (public.is_super_admin());

drop policy if exists "rzp_wallet_payments_admin_read" on public.razorpay_wallet_payments;
create policy "rzp_wallet_payments_admin_read" on public.razorpay_wallet_payments
  for select using (public.is_super_admin());

drop policy if exists "rzp_seva_orders_admin_read" on public.razorpay_seva_orders;
create policy "rzp_seva_orders_admin_read" on public.razorpay_seva_orders
  for select using (public.is_super_admin());

-- Services: Public reads active items; Super Admin manages catalog
drop policy if exists "services_public_read" on public.services;
create policy "services_public_read" on public.services
  for select using (is_active = true or public.is_super_admin());

drop policy if exists "services_admin_write" on public.services;
create policy "services_admin_write" on public.services
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- Astrologers: Public reads; Super Admin writes
drop policy if exists "astrologers_public_read" on public.astrologers;
create policy "astrologers_public_read" on public.astrologers
  for select using (true);

drop policy if exists "astrologers_admin_write" on public.astrologers;
create policy "astrologers_admin_write" on public.astrologers
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- Settings: Public reads; Super Admin writes
drop policy if exists "settings_public_read" on public.settings;
create policy "settings_public_read" on public.settings
  for select using (true);

drop policy if exists "settings_admin_write" on public.settings;
create policy "settings_admin_write" on public.settings
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- Reviews: Public reads approved reviews; public/devotees can insert; Super Admin moderates
drop policy if exists "reviews_public_read" on public.reviews;
create policy "reviews_public_read" on public.reviews
  for select using (is_approved = true or public.is_super_admin());

drop policy if exists "reviews_insert_valid" on public.reviews;
create policy "reviews_insert_valid" on public.reviews
  for insert with check (char_length(trim(name)) > 0 and stars between 1 and 5);

drop policy if exists "reviews_admin_update_delete" on public.reviews;
create policy "reviews_admin_update_delete" on public.reviews
  for update using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "reviews_admin_delete" on public.reviews;
create policy "reviews_admin_delete" on public.reviews
  for delete using (public.is_super_admin());

-- Bookings: Owner or Super Admin can read; authenticated users or Super Admin can create; Super Admin updates proofs/status
drop policy if exists "bookings_select_owner_or_admin" on public.bookings;
create policy "bookings_select_owner_or_admin" on public.bookings
  for select using (
    public.is_super_admin()
    or phone = public.current_user_phone()
    or (coalesce(email, '') <> '' and lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  );

drop policy if exists "bookings_insert_authenticated_or_admin" on public.bookings;
create policy "bookings_insert_authenticated_or_admin" on public.bookings
  for insert with check (
    public.is_super_admin()
    or (auth.uid() is not null and (phone = public.current_user_phone() or lower(coalesce(email, '')) = lower(coalesce(auth.jwt() ->> 'email', ''))))
  );

drop policy if exists "bookings_admin_update" on public.bookings;
create policy "bookings_admin_update" on public.bookings
  for update using (public.is_super_admin()) with check (public.is_super_admin());

-- Chat sessions: Customer owner or Super Admin
drop policy if exists "chat_select_owner_or_admin" on public.chat_sessions;
create policy "chat_select_owner_or_admin" on public.chat_sessions
  for select using (public.is_super_admin() or customer_phone = public.current_user_phone());

drop policy if exists "chat_insert_owner_or_admin" on public.chat_sessions;
create policy "chat_insert_owner_or_admin" on public.chat_sessions
  for insert with check (
    public.is_super_admin()
    or (auth.uid() is not null and customer_phone = public.current_user_phone())
  );

drop policy if exists "chat_update_owner_or_admin" on public.chat_sessions;
create policy "chat_update_owner_or_admin" on public.chat_sessions
  for update using (
    public.is_super_admin()
    or (auth.uid() is not null and customer_phone = public.current_user_phone())
  )
  with check (
    public.is_super_admin()
    or (auth.uid() is not null and customer_phone = public.current_user_phone())
  );

-- =====================================================================
-- Seed Existing GauKripa Data Idempotently (Preserves Existing Records)
-- =====================================================================

insert into public.settings (
  id, standard_rate_per_min, discounted_rate_per_min, discount_enabled,
  extra_occasion_fee, promo_banner_text, banner_enabled, trust_name
) values (
  'config',
  20,
  10,
  true,
  21,
  '✨ Subh Deepawali Special Offer: 50% Off on Astrologer Consultation with any Seva Booking!',
  true,
  'GauKripa Seva Trust • Vrindavan & Mathura'
) on conflict (id) do nothing;

insert into public.profiles (email, name, phone, role)
values ('bankush014@gmail.com', 'Super Admin', '7838031067', 'super_admin')
on conflict (email) do nothing;

insert into public.services (
  id, title, planet, planet_tag, tag_color, price_display, base_price, unit, min_qty,
  benefit, crop_key, detailed_description, vedic_significance, is_active, category
) values
  ('gau-chara', 'Gau Chara Seva', 'Surya Grah', '☀️ Surya Grah', 'bg-amber-100 text-amber-900 border-amber-300', '₹251 (5 kg)', 251, 'lot (5 kg)', 1, 'Helps reduce Surya Dosh & brings confidence & success.', 'sevaChara', 'Fresh, juicy green grass, sorghum, and clover harvested early morning and offered with sacred devotion to Gaumata in certified Vedic goshalas.', 'According to the Bhavishya Purana, feeding fresh green fodder to Kamadhenu pleases Lord Surya, dispelling lethargy and opening paths to authority and respect.', true, 'cow'),
  ('gau-roti', 'Gau Roti Seva', 'Chandra Grah', '🌙 Chandra Grah', 'bg-amber-50 text-amber-900 border-amber-200', '₹51 (4 Rotis)', 51, 'lot (4 rotis)', 1, 'Helps calm Chandra Dosh & brings peace of mind.', 'sevaRoti', 'Pure whole-wheat rotis freshly prepared with pure desi ghee and love, hand-fed to maternal cows while reciting auspicious cow-benedictions.', 'Chandra (Moon) controls the psyche and emotional wellbeing. Offering warm rotis soothes mental afflictions, anxiety, and sleeplessness.', true, 'cow'),
  ('gau-gud-chana', 'Gau Gud-Chana Seva', 'Mangal Grah', '🪐 Mangal Grah', 'bg-amber-100 text-amber-900 border-amber-300', '₹151', 151, 'thali', 1, 'Helps reduce Mangal Dosh & brings courage & strength.', 'sevaGudChana', 'Rich organic mineral jaggery (Gud) and dry-roasted protein-rich gram (Chana), formulated to build vigor and vitality for cows and calves.', 'Pacifies fiery Mars (Mangal). Recommended by astrologers for clearing debts, removing legal hurdles, and pacifying Manglik Dosha.', true, 'cow'),
  ('pakshi-dana', 'Pakshi Dana Seva', 'Budh Grah', '🦅 Budh Grah', 'bg-amber-100 text-amber-900 border-amber-300', '₹101', 101, 'katori mix', 1, 'Helps remove Mangal Dosh & brings courage & strength.', 'sevaPakshi', 'Wholesome natural pearl millets (bajra), broken wheat, flaxseeds, and water bowls distributed at sunrise for wild sparrows, doves, and parrots.', 'Mercury (Budh) governs speech, business acumen, and intellect. Birds are symbols of divine communication; feeding them brings clarity and prosperous trade.', true, 'bird'),
  ('cheenti-aata', 'Cheenti Aata Seva', 'Rahu-Ketu', '🪱 Rahu-Ketu', 'bg-amber-100 text-amber-900 border-amber-300', '₹149', 149, 'pudika pack', 1, 'Helps reduce Rahu-Ketu Dosh & brings stability.', 'sevaCheenti', 'Sacred sweet Kasar powder composed of dry roasted wheat flour, powdered sugar, and sesame seeds, placed near ant colonies under holy Peepal and Banyan trees.', 'Feeding innumerable tiny souls (cheentis) balances karmic debits, neutralizes sudden shocks, and stabilizes unpredictable Rahu-Ketu cycles.', true, 'ant'),
  ('street-dogs', 'Street Dogs Seva', 'Ketu Grah', '🐕 Ketu Grah', 'bg-amber-100 text-amber-900 border-amber-300', '₹199+', 199, 'meal tray', 1, 'Helps remove Ketu Dosh & brings spiritual growth.', 'sevaDogs', 'Wholesome hygienic meals cooked with rice, turmeric, boiled milk, pumpkin, and rotis, distributed compassionately to stray street animals.', 'The dog represents the faithful vahana of Lord Bhairava and Lord Dattatreya. Feeding stray dogs shields families from evil eye, black magic, and Ketu obstacles.', true, 'dog')
on conflict (id) do nothing;

insert into public.astrologers (
  id, name, title, experience, rating, reviews_count, rate_per_min, crop_key,
  languages, bio, specializations, is_online, total_consultations, total_earnings
) values
  ('nipunjj', 'Nipunjj', 'Numerology, Vedic, Tarot & Palmistry Expert', '7+ Years Experience', 4.9, '5239+ Readings', 20, 'astroRohan', '["Hindi","English"]'::jsonb, 'Trusted Numerology, Vedic Astrology, Tarot, and Palmistry specialist with 7+ years of experience and 5239+ readings completed for career, marriage, and life clarity.', '["Numerology","Vedic","Tarot","Palmistry"]'::jsonb, true, 5239, 104780),
  ('dravina', 'Dravina', 'Senior Vedic & Tarot Expert', '10+ Years Experience', 4.9, '7648+ Readings', 20, 'astroSophia', '["Hindi","English"]'::jsonb, 'Seasoned Vedic Astrologer and intuitive Tarot reader with 10+ years of experience and 7648+ readings completed, offering clear Kundali, relationship, and remedial guidance.', '["Vedic","Tarot"]'::jsonb, true, 7648, 152960)
on conflict (id) do nothing;

insert into public.wallets (phone, name, balance) values
  ('9988776655', 'Devotee', 100),
  ('9876543210', 'Live Devotee', 50),
  ('7838031067', 'Devotee', 0)
on conflict (phone) do nothing;

insert into public.wallet_transactions (id, wallet_phone, type, amount, description, payment_id, order_id, created_at) values
  ('tx-pay_test_wallet_dedup_2', '9988776655', 'credit', 50, 'Razorpay Wallet Recharge (+₹50)', 'pay_test_wallet_dedup_2', 'order_TyRgJNSirUInEf', '2026-11-10T10:51:21.074Z'),
  ('tx-pay_test_wallet_dedup', '9988776655', 'credit', 50, 'Razorpay Wallet Recharge (+₹50)', 'pay_test_wallet_dedup', 'order_TyRgJNSirUInEf', '2026-11-10T10:50:48.109Z'),
  ('tx-pay_live_test_001', '9876543210', 'credit', 50, 'Razorpay Wallet Recharge (+₹50)', 'pay_live_test_001', 'order_TySS3PBEEs8rL7', '2026-11-10T11:35:22.650Z')
on conflict (id) do nothing;

insert into public.bookings (
  id, booking_id, devotee_name, phone, email, gotra, seva_id, seva_title, quantity,
  duration, occasion, amount, base_amount, extra_fee, status, date, family_members,
  sankalp_wish, goshala, video_proof_url, photo_proof_urls, priest_name, whatsapp_sent, created_at
) values
  ('b-101', 'GK-749102', 'Harsh Bhardwaj', '9876543210', 'harshbhardwaj0745@gmail.com', 'Kashyap', 'gau-chara', 'Gau Chara Seva', '1 lot (5 kg)', '1 Day (Single Seva)', 'General Daily Seva', 251, 251, 0, 'completed', '2026-11-05', '["Sunita Bhardwaj","Aarav Bhardwaj"]'::jsonb, 'Family prosperity and peace', 'Surabhi Seva Dham, Vrindavan', 'https://assets.mixkit.co/videos/preview/mixkit-cows-in-a-field-grazing-43283-large.mp4', '["/assets/aistudio/image_a83a3632.png"]'::jsonb, 'Pandit Radheshyam Shastri', true, '2026-11-05T17:02:14.523Z'),
  ('b-102', 'GK-839211', 'Rameshwar Gupta', '9811223344', 'rameshwar.gupta@gmail.com', 'Garg', 'gau-roti', 'Gau Roti Seva', '1 lot (4 rotis)', '7 Days (Weekly Sankalp)', 'Birthday Blessing', 378, 357, 21, 'completed', '2026-11-04', '["Meenakshi Gupta"]'::jsonb, 'Chandra dosh nivaran and peace of mind', 'Gau Seva Ashram, Mathura', 'https://assets.mixkit.co/videos/preview/mixkit-cows-in-a-field-grazing-43283-large.mp4', '["/assets/aistudio/image_123e24a7.png"]'::jsonb, 'Acharya Vidyadhar', true, '2026-11-04T17:02:14.523Z'),
  ('b-103', 'GK-910283', 'Anjali Sharma', '9877665544', 'anjali.s@gmail.com', 'Bhardwaj', 'cheenti-aata', 'Cheenti Aata Seva', '1 pudika pack', '1 Day (Single Seva)', 'General Daily Seva', 149, 149, 0, 'in_progress', '2026-11-06', '[]'::jsonb, 'Rahu Ketu dosh shanti', 'Kamadhenu Dham, Govardhan', null, '[]'::jsonb, 'Pandit Murari Lal', false, '2026-11-06T17:02:14.523Z')
on conflict (id) do nothing;

insert into public.reviews (id, name, city, seva, one_liner, stars, is_approved, created_at) values
  ('rev-1', 'Rohit Sharma', 'Delhi NCR', 'Gau Chara Seva', 'Bhai WhatsApp pe direct 2 ghante me Gaumata ke chara khilane ka video proof mil gaya, bahut shanti mili!', 5, true, '2026-11-05T10:00:00Z'),
  ('rev-2', 'Ananya Verma', 'Mumbai', 'Gau Roti Seva', 'Gau Roti seva book ki thi, puja ki video dekh ke sach me pura mann prasann ho gaya.', 5, true, '2026-11-05T12:00:00Z'),
  ('rev-3', 'Vikram Singhania', 'Varanasi', 'Gud-Chana Seva', 'Vrindavan goshala me Pandit ji ne hamare gotra ke sath sankalp padha, 100% genuine trust hai.', 5, true, '2026-11-04T15:00:00Z'),
  ('rev-4', 'Priya Deshmukh', 'Pune', 'Surya Grah Seva', 'Job interview se pehle chara seva ki thi, positive results mile aur mann me bohot confidence aaya.', 5, true, '2026-11-04T18:00:00Z'),
  ('rev-5', 'Rajesh Patel', 'Ahmedabad', 'Cheenti Aata Seva', 'Cheenti aata seva ka clear HD video phone pe aaya, itni transparent seva pehli baar dekhi.', 5, true, '2026-11-03T09:00:00Z')
on conflict (id) do nothing;

insert into public.chat_sessions (
  id, astrologer_id, astrologer_name, customer_id, customer_name, customer_phone,
  customer_concern, status, rate_per_min, has_discount, created_at, started_at,
  last_heartbeat, ended_at, duration_seconds, total_charged, astrologer_earned, messages
) values
  (
    'CHAT-1793985213901-110', 'dravina', 'Dravina', '9876543210', 'Aarav Sharma', '9876543210',
    'Kundali dosha and Rahu Shanti', 'ended', 10, true, '2026-11-06T17:13:33.901Z', '2026-11-06T17:13:33.914Z',
    '2026-11-06T17:13:33.932Z', '2026-11-06T17:13:33.935Z', 0, 10, 10,
    '[{"id":"msg-1793985213901","sender":"customer","senderName":"Aarav Sharma","text":"Pranam Guruji! I would like your guidance regarding: Kundali dosha and Rahu Shanti.","timestamp":"05:13 PM"},{"id":"msg-1793985213914","sender":"astrologer","senderName":"Dravina","text":"Hari Om! Pranam Aarav Sharma. I am Dravina. I have accepted your consultation. Please share your birth details (Date, Time, Place of birth).","timestamp":"05:13 PM"},{"id":"msg-1793985213919-609","sender":"customer","senderName":"Aarav Sharma","text":"Namaste Pandit ji, I need guidance.","timestamp":"05:13 PM"},{"id":"msg-1793985213927-653","sender":"astrologer","senderName":"Dravina","text":"Hari Om Aarav ji. Do Gau Green Grass Seva on Wednesday for Rahu.","timestamp":"05:13 PM","suggestedSeva":"Hari Ghaas Seva"},{"id":"sys-1793985213935","sender":"astrologer","senderName":"System","text":"Consultation concluded. Total Duration: 0 min 0 sec. Total Dakshina: ₹10. Jai Gaumata!","timestamp":"05:13 PM"}]'::jsonb
  ),
  (
    'CHAT-1793985045332-676', 'nipunjj', 'Nipunjj', '9876543210', 'Harsh Bhardwaj', '9876543210',
    'Career & Manglik Dosh', 'ended', 10, true, '2026-11-06T17:10:45.332Z', '2026-11-06T17:10:55.899Z',
    '2026-11-06T17:11:11.419Z', '2026-11-06T17:11:16.265Z', 15, 10, 10,
    '[{"id":"msg-1793985045332","sender":"customer","senderName":"Harsh Bhardwaj","text":"Pranam Guruji! I would like your guidance regarding: Career & Manglik Dosh.","timestamp":"05:10 PM"},{"id":"msg-1793985055899","sender":"astrologer","senderName":"Nipunjj","text":"Hari Om! Pranam Harsh Bhardwaj. I am Nipunjj. I have accepted your consultation. Please share your birth details (Date, Time, Place of birth).","timestamp":"05:10 PM"},{"id":"msg-1793985061600-734","sender":"customer","senderName":"Harsh Bhardwaj","text":"My DOB is 14 July 1995, 06:30 AM, Mathura.","timestamp":"05:11 PM"},{"id":"msg-1793985067102-202","sender":"astrologer","senderName":"Nipunjj","text":"Based on your chart, Mars is placed in the 7th house. I prescribe Gau Gud-Chana Seva on Tuesday morning.","timestamp":"05:11 PM","suggestedSeva":"Gau Gud-Chana Seva"},{"id":"sys-1793985076265","sender":"astrologer","senderName":"System","text":"Consultation concluded. Total Duration: 0 min 15 sec. Total Dakshina: ₹10. Jai Gaumata!","timestamp":"05:11 PM"}]'::jsonb
  )
on conflict (id) do nothing;

-- Optional Supabase Storage bucket for proof media
insert into storage.buckets (id, name, public)
values ('gaukripa-media', 'gaukripa-media', true)
on conflict (id) do nothing;

drop policy if exists "gaukripa_media_public_read" on storage.objects;
create policy "gaukripa_media_public_read" on storage.objects
  for select using (bucket_id = 'gaukripa-media');

drop policy if exists "gaukripa_media_admin_write" on storage.objects;
create policy "gaukripa_media_admin_write" on storage.objects
  for insert with check (bucket_id = 'gaukripa-media' and (auth.uid() is not null));
