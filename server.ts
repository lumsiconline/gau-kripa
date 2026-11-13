import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { createServer as createViteServer } from 'vite';
import { readDb, writeDb, DbChatMessage, DbChatSession, DbBooking, DbService, DbAstrologer } from './src/server/db';
import {
  initSupabaseData,
  syncService,
  deleteService,
  syncAstrologer,
  syncBooking,
  syncChatSession,
  syncWallet,
  syncReview,
  deleteReview,
  syncSettings,
  getSupabaseStats
} from './src/server/dataSync';

async function startServer() {
  const app = express();
  // Dev server must always run on port 3000 according to environment constraints
  const PORT = 3000;

  // Body parser with 50mb limit for media uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS middleware for hosted frontend (e.g. https://gaukripa.site) calling deployed Express API
  const configuredOrigins = (process.env.ALLOWED_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedDefaults = [
      'https://gaukripa.site',
      'https://www.gaukripa.site',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173'
    ];
    const isAllowedOrigin =
      !origin ||
      allowedDefaults.includes(origin) ||
      configuredOrigins.includes(origin) ||
      /^https:\/\/[a-z0-9-]+\.run\.app$/i.test(origin) ||
      /^https:\/\/([a-z0-9-]+\.)?github\.io$/i.test(origin);

    if (origin && isAllowedOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    return next();
  });

  // Consistent phone normalization (+91 / 91 / 0 / 10-digit)
  const normalizePhone = (rawPhone: unknown, fallback = '9876543210'): string => {
    const digits = String(rawPhone || '').replace(/[^0-9]/g, '');
    if (!digits) return fallback;
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    if (digits.length > 10) return digits.slice(-10);
    return digits;
  };

  // Resolve existing wallet without losing legacy keys
  const getOrInitWallet = (db: ReturnType<typeof readDb>, rawPhone: unknown, name = 'Devotee') => {
    const rawStr = String(rawPhone || '').trim();
    const clean = normalizePhone(rawPhone);
    const candidates = Array.from(new Set([clean, rawStr, `91${clean}`, `+91${clean}`].filter(Boolean)));
    for (const key of candidates) {
      if (db.wallets[key]) {
        return { key, wallet: db.wallets[key] };
      }
    }
    const created = {
      phone: clean,
      name: name || 'Devotee',
      balance: 0,
      transactions: []
    };
    db.wallets[clean] = created;
    return { key: clean, wallet: created };
  };

  // Track server-created Razorpay order amounts to prevent client-side amount tampering on verify
  const orderAmountInPaiseCache = new Map<string, number>();

  // Ensure public/uploads exists
  const uploadsDir = path.resolve(process.cwd(), 'public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve uploads statically
  app.use('/uploads', express.static(uploadsDir));

  // Initialize local development cache; production site data is served by Supabase
  const initialDb = readDb();
  initSupabaseData(initialDb).catch(console.error);

  // ==========================================
  // API: HEALTH CHECK & DATABASE STATUS
  // ==========================================
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  app.get('/api/database/status', async (req, res) => {
    const stats = await getSupabaseStats();
    res.json(stats);
  });

  // ==========================================
  // API: AUTHENTICATION (SUPER ADMIN & DEVOTEE)
  // ==========================================
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please enter your name, email, and password.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPass = String(password).trim();
    const cleanName = String(name).trim();
    const cleanPhone = normalizePhone(phone);

    if (cleanPass.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    const db = readDb();
    if (!db.users) db.users = {};

    if (cleanEmail === 'bankush014@gmail.com' || db.users[cleanEmail]) {
      return res.status(400).json({ error: 'This email is already registered. Please sign in.' });
    }

    const passwordHash = crypto.createHash('sha256').update(cleanPass).digest('hex');
    db.users[cleanEmail] = {
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      phone: cleanPhone,
      createdAt: new Date().toISOString()
    };

    // Ensure wallet exists for new devotee with actual balance (0 default)
    const { wallet } = getOrInitWallet(db, cleanPhone, cleanName);
    syncWallet(wallet).catch(console.error);

    writeDb(db);
    return res.json({ success: true, message: 'Account registered successfully. Please log in with your email and password.' });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password, phone } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPass = String(password).trim();

    // Super Admin Verification
    if (cleanEmail === 'bankush014@gmail.com') {
      if (cleanPass === '7838031067') {
        return res.json({
          success: true,
          user: {
            name: 'Super Admin',
            email: 'bankush014@gmail.com',
            role: 'super_admin',
            phone: '7838031067',
            isAdmin: true
          }
        });
      } else {
        return res.status(401).json({ error: 'Invalid email or password. Please try again.' });
      }
    }

    const db = readDb();
    if (!db.users) db.users = {};

    // Check registered devotee accounts
    if (db.users[cleanEmail]) {
      const inputHash = crypto.createHash('sha256').update(cleanPass).digest('hex');
      if (inputHash !== db.users[cleanEmail].passwordHash) {
        return res.status(401).json({ error: 'Invalid email or password. Please try again.' });
      }
      const devoteeUser = {
        name: db.users[cleanEmail].name,
        email: cleanEmail,
        role: 'devotee',
        phone: db.users[cleanEmail].phone,
        isAdmin: false
      };
      return res.json({ success: true, user: devoteeUser });
    }

    // Only registered accounts can log in.
    return res.status(401).json({
      error: 'Account not found. Please sign up first, then log in.'
    });
  });

  // ==========================================
  // API: SETTINGS & CONFIG
  // ==========================================
  app.get('/api/settings', (req, res) => {
    const db = readDb();
    res.json(db.settings);
  });

  app.put('/api/settings', (req, res) => {
    const db = readDb();
    db.settings = { ...db.settings, ...req.body };
    writeDb(db);
    syncSettings(db.settings).catch(console.error);
    res.json({ success: true, settings: db.settings });
  });

  // ==========================================
  // API: SEVA SERVICES
  // ==========================================
  app.get('/api/services', (req, res) => {
    const db = readDb();
    const includeInactive = req.query.all === 'true';
    const services = includeInactive ? db.services : db.services.filter((s) => s.isActive);
    res.json(services);
  });

  app.post('/api/services', (req, res) => {
    const db = readDb();
    const newService: DbService = {
      id: req.body.id || `seva-${Date.now()}`,
      title: req.body.title || 'New Sacred Seva',
      planet: req.body.planet || 'Surya Grah',
      planetTag: req.body.planetTag || '☀️ Surya Grah',
      tagColor: req.body.tagColor || 'bg-amber-100 text-amber-900 border-amber-300',
      priceDisplay: req.body.priceDisplay || `₹${req.body.basePrice || 101}`,
      basePrice: Number(req.body.basePrice) || 101,
      unit: req.body.unit || 'lot',
      minQty: Number(req.body.minQty) || 1,
      benefit: req.body.benefit || 'Brings peace and removes planetary obstacles.',
      cropKey: req.body.cropKey || 'sevaChara',
      customImageUrl: req.body.customImageUrl || '',
      detailedDescription: req.body.detailedDescription || '',
      vedicSignificance: req.body.vedicSignificance || '',
      isActive: req.body.isActive !== false,
      category: req.body.category || 'cow'
    };
    db.services.unshift(newService);
    writeDb(db);
    syncService(newService).catch(console.error);
    res.json({ success: true, service: newService });
  });

  app.put('/api/services/:id', (req, res) => {
    const db = readDb();
    const idx = db.services.findIndex((s) => s.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Service not found' });
    }
    db.services[idx] = { ...db.services[idx], ...req.body };
    writeDb(db);
    syncService(db.services[idx]).catch(console.error);
    res.json({ success: true, service: db.services[idx] });
  });

  app.delete('/api/services/:id', (req, res) => {
    const db = readDb();
    db.services = db.services.filter((s) => s.id !== req.params.id);
    writeDb(db);
    deleteService(req.params.id).catch(console.error);
    res.json({ success: true, message: 'Service deleted' });
  });

  // ==========================================
  // API: ASTROLOGERS
  // ==========================================
  app.get('/api/astrologers', (req, res) => {
    const db = readDb();
    res.json(db.astrologers);
  });

  app.post('/api/astrologers', (req, res) => {
    const db = readDb();
    const newAstro: DbAstrologer = {
      id: req.body.id || `astro-${Date.now()}`,
      name: req.body.name,
      title: req.body.title || 'Vedic Astrologer & Upay Specialist',
      experience: req.body.experience || '10+ Years Experience',
      rating: Number(req.body.rating) || 4.9,
      reviewsCount: req.body.reviewsCount || '100+ reviews',
      ratePerMin: Number(req.body.ratePerMin) || db.settings.standardRatePerMin || 20,
      cropKey: req.body.cropKey || 'astroSophia',
      customImageUrl: req.body.customImageUrl || '',
      languages: Array.isArray(req.body.languages) ? req.body.languages : ['Hindi', 'English'],
      bio: req.body.bio || '',
      specializations: Array.isArray(req.body.specializations) ? req.body.specializations : ['Vedic Kundali', 'Grah Shanti'],
      isOnline: req.body.isOnline !== false,
      totalConsultations: 0,
      totalEarnings: 0
    };
    db.astrologers.push(newAstro);
    writeDb(db);
    syncAstrologer(newAstro).catch(console.error);
    res.json({ success: true, astrologer: newAstro });
  });

  app.put('/api/astrologers/:id', (req, res) => {
    const db = readDb();
    const idx = db.astrologers.findIndex((a) => a.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Astrologer not found' });
    }
    db.astrologers[idx] = { ...db.astrologers[idx], ...req.body };
    writeDb(db);
    syncAstrologer(db.astrologers[idx]).catch(console.error);
    res.json({ success: true, astrologer: db.astrologers[idx] });
  });

  app.patch('/api/astrologers/:id/availability', (req, res) => {
    const db = readDb();
    const idx = db.astrologers.findIndex((a) => a.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Astrologer not found' });
    }
    db.astrologers[idx].isOnline = req.body.isOnline;
    writeDb(db);
    syncAstrologer(db.astrologers[idx]).catch(console.error);
    res.json({ success: true, isOnline: db.astrologers[idx].isOnline });
  });

  // ==========================================
  // API: BOOKINGS & PROOF MANAGEMENT
  // ==========================================
  app.get('/api/bookings', (req, res) => {
    const db = readDb();
    const phone = req.query.phone as string;
    if (phone) {
      const clean = normalizePhone(phone);
      return res.json(db.bookings.filter((b) => normalizePhone(b.phone) === clean || b.phone === phone));
    }
    res.json(db.bookings);
  });

  app.post('/api/bookings', (req, res) => {
    const db = readDb();
    const cleanPhone = normalizePhone(req.body.phone);
    const newBooking: DbBooking = {
      id: `b-${Date.now()}`,
      bookingId: `GK-${Math.floor(100000 + Math.random() * 900000)}`,
      devoteeName: req.body.devoteeName || 'Devotee',
      phone: cleanPhone,
      email: req.body.email || '',
      gotra: req.body.gotra || 'Kashyap',
      sevaId: req.body.sevaId || 'gau-chara',
      sevaTitle: req.body.sevaTitle || 'Gau Chara Seva',
      quantity: req.body.quantity || '1 lot',
      duration: req.body.duration || '1 Day (Single Seva)',
      occasion: req.body.occasion || 'General Daily Seva',
      amount: Number(req.body.amount) || 251,
      baseAmount: Number(req.body.baseAmount) || 251,
      extraFee: Number(req.body.extraFee) || 0,
      status: 'confirmed',
      date: req.body.date || new Date().toISOString().split('T')[0],
      familyMembers: Array.isArray(req.body.familyMembers) ? req.body.familyMembers : [],
      sankalpWish: req.body.sankalpWish || '',
      goshala: req.body.goshala || 'Surabhi Seva Dham, Vrindavan',
      createdAt: new Date().toISOString()
    };
    db.bookings.unshift(newBooking);

    // Ensure wallet exists for devotee (real balance only)
    const { wallet } = getOrInitWallet(db, cleanPhone, newBooking.devoteeName);
    writeDb(db);
    syncBooking(newBooking).catch(console.error);
    syncWallet(wallet).catch(console.error);
    res.json({ success: true, booking: newBooking });
  });

  app.put('/api/bookings/:id/status', (req, res) => {
    const db = readDb();
    const idx = db.bookings.findIndex((b) => b.id === req.params.id || b.bookingId === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    db.bookings[idx].status = req.body.status;
    if (req.body.status === 'completed') {
      db.bookings[idx].whatsappSent = true;
    }
    writeDb(db);
    syncBooking(db.bookings[idx]).catch(console.error);
    res.json({ success: true, booking: db.bookings[idx] });
  });

  app.post('/api/bookings/:id/proof', (req, res) => {
    const db = readDb();
    const idx = db.bookings.findIndex((b) => b.id === req.params.id || b.bookingId === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (req.body.videoProofUrl) db.bookings[idx].videoProofUrl = req.body.videoProofUrl;
    if (req.body.photoProofUrls) db.bookings[idx].photoProofUrls = req.body.photoProofUrls;
    if (req.body.priestName) db.bookings[idx].priestName = req.body.priestName;
    if (req.body.status) db.bookings[idx].status = req.body.status;
    db.bookings[idx].whatsappSent = true;
    writeDb(db);
    syncBooking(db.bookings[idx]).catch(console.error);
    res.json({ success: true, booking: db.bookings[idx] });
  });

  // ==========================================
  // API: WALLET & 50% DISCOUNT VERIFICATION
  // ==========================================
  app.get('/api/wallet/:phone', (req, res) => {
    const db = readDb();
    const hadExisting = Boolean(
      db.wallets[req.params.phone] ||
      db.wallets[normalizePhone(req.params.phone)] ||
      db.wallets[`91${normalizePhone(req.params.phone)}`] ||
      db.wallets[`+91${normalizePhone(req.params.phone)}`]
    );
    const { wallet } = getOrInitWallet(db, req.params.phone);
    if (!hadExisting) {
      writeDb(db);
    }
    res.json(wallet);
  });

  // ==========================================
  // API: RAZORPAY STANDARD WEB CHECKOUT
  // ==========================================

  // STEP 1: BACKEND - Create Order
  // Endpoint: POST /api/create-order (and /api/wallet/create-razorpay-order)
  const handleCreateOrder = async (req: express.Request, res: express.Response) => {
    try {
      const { currency = 'INR', receipt, notes, phone, name } = req.body;
      const rawAmount = req.body.amount;
      const rawAmountInPaise = req.body.amountInPaise;
      const explicitIsPaise = req.body.isPaise;

      if (
        (rawAmount === undefined || rawAmount === null || rawAmount === '') &&
        (rawAmountInPaise === undefined || rawAmountInPaise === null || rawAmountInPaise === '')
      ) {
        return res.status(400).json({ error: 'Amount is required.' });
      }

      const isWalletRoute = req.path.includes('/wallet');
      let amountInPaise: number;

      if (isWalletRoute) {
        const rupeeAmount =
          rawAmount !== undefined && rawAmount !== null && rawAmount !== ''
            ? Number(rawAmount)
            : Number(rawAmountInPaise) / 100;
        if (isNaN(rupeeAmount) || rupeeAmount < 50 || rupeeAmount > 100000) {
          return res.status(400).json({ error: 'Minimum wallet recharge amount is ₹50 (up to ₹1,00,000).' });
        }
        amountInPaise = Math.round(rupeeAmount * 100);
      } else if (rawAmountInPaise !== undefined && rawAmountInPaise !== null && rawAmountInPaise !== '') {
        amountInPaise = Math.round(Number(rawAmountInPaise));
        if (isNaN(amountInPaise) || amountInPaise < 100) {
          return res.status(400).json({ error: 'Minimum amount must be at least 100 paise (₹1).' });
        }
      } else {
        const numAmount = Number(rawAmount);
        if (isNaN(numAmount) || numAmount <= 0) {
          return res.status(400).json({ error: 'Invalid amount provided.' });
        }
        amountInPaise = explicitIsPaise === false ? Math.round(numAmount * 100) : Math.round(numAmount);
        if (amountInPaise < 100) {
          return res.status(400).json({ error: 'Minimum amount must be at least 100 paise.' });
        }
      }

      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;

      if (!keyId || !keySecret) {
        return res.status(500).json({
          error: 'Razorpay LIVE credentials (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET) are not configured in backend environment.'
        });
      }

      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const orderReceipt = receipt || `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const cleanPhone = phone ? normalizePhone(phone) : '';

      try {
        const order = await razorpay.orders.create({
          amount: amountInPaise,
          currency: currency || 'INR',
          receipt: orderReceipt,
          notes: notes || {
            purpose: isWalletRoute ? 'GauKripa Sacred Wallet Recharge' : 'GauKripa Payment',
            phone: cleanPhone,
            devoteeName: name || 'Devotee'
          }
        });

        orderAmountInPaiseCache.set(order.id, Number(order.amount));

        return res.json({
          order_id: order.id,
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          key_id: keyId,
          keyId,
          success: true
        });
      } catch (rzpErr: any) {
        console.error('Razorpay API error in orders.create:', rzpErr);
        if (rzpErr?.statusCode === 401 || rzpErr?.error?.description === 'Authentication failed') {
          return res.status(401).json({
            error: 'Razorpay authentication failed. Please verify that your active Razorpay Live Key ID and Key Secret are correctly attached in your backend .env or environment variables.'
          });
        }
        if (rzpErr?.error?.code === 'BAD_REQUEST_ERROR') {
          return res.status(400).json({
            error: rzpErr?.error?.description || 'Razorpay order creation request was rejected.'
          });
        }
        return res.status(500).json({
          error: rzpErr?.error?.description || rzpErr?.message || 'Failed to create Razorpay order.'
        });
      }
    } catch (err: any) {
      console.error('Error creating Razorpay order:', err);
      return res.status(500).json({ error: err?.message || 'Internal server error creating order.' });
    }
  };

  app.post('/api/create-order', handleCreateOrder);
  app.post('/api/wallet/create-razorpay-order', handleCreateOrder);

  // STEP 3: BACKEND - Verify Signature
  // Endpoint: POST /api/verify-payment (and /api/wallet/verify-razorpay-payment)
  // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
  // Timing-safe comparison with razorpay_signature
  const handleVerifyPayment = async (req: express.Request, res: express.Response) => {
    try {
      const order_id = req.body.order_id || req.body.razorpay_order_id;
      const payment_id = req.body.payment_id || req.body.razorpay_payment_id;
      const signature = req.body.signature || req.body.razorpay_signature;
      const { phone, name, amount } = req.body;

      // Missing fields: return 400
      if (!order_id || !payment_id || !signature) {
        return res.status(400).json({
          error: 'Missing required payment verification fields (order_id, payment_id, signature).',
          verified: false
        });
      }

      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (!keySecret) {
        return res.status(500).json({
          error: 'Razorpay secret key not configured on server.',
          verified: false
        });
      }

      // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
      const textToSign = `${order_id}|${payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(textToSign)
        .digest('hex');

      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
      const signatureBuffer = Buffer.from(String(signature), 'utf8');

      // Timing-safe comparison to prevent timing attacks
      const isMatch =
        expectedBuffer.length === signatureBuffer.length &&
        crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

      if (!isMatch) {
        // Signature mismatch: return 400, do NOT mark as paid
        return res.status(400).json({
          error: 'Invalid payment signature. Verification failed.',
          verified: false
        });
      }

      // Signature is valid! If phone is provided, credit wallet
      if (phone) {
        const db = readDb();
        const { wallet } = getOrInitWallet(db, phone, name || 'Devotee');

        const cachedPaise = orderAmountInPaiseCache.get(String(order_id));
        const creditAmount = cachedPaise
          ? Number((cachedPaise / 100).toFixed(2))
          : Number(amount) || 50;

        // Prevent duplicate credits: check if this paymentId was already credited
        const existingTx = wallet.transactions.find(
          (tx: any) => tx.id === `tx-${payment_id}` || tx.paymentId === payment_id
        );

        if (existingTx) {
          return res.json({
            success: true,
            verified: true,
            credited: false,
            message: 'Payment verified. Wallet was already credited.',
            balance: wallet.balance,
            wallet
          });
        }

        // Credit wallet
        wallet.balance = Number((wallet.balance + creditAmount).toFixed(2));
        wallet.transactions.unshift({
          id: `tx-${payment_id}`,
          paymentId: payment_id,
          orderId: order_id,
          type: 'credit',
          amount: creditAmount,
          description: `Razorpay Wallet Recharge (+₹${creditAmount})`,
          date: new Date().toISOString()
        });

        writeDb(db);
        syncWallet(wallet).catch(console.error);

        return res.json({
          success: true,
          verified: true,
          credited: true,
          message: `Payment verified! Successfully recharged ₹${creditAmount} to your wallet.`,
          balance: wallet.balance,
          wallet
        });
      }

      // Standard verification response without wallet
      return res.json({
        success: true,
        verified: true,
        message: 'Payment verified successfully.'
      });
    } catch (err: any) {
      console.error('Error verifying payment:', err);
      return res.status(500).json({
        error: err?.message || 'Payment verification failed.',
        verified: false
      });
    }
  };

  app.post('/api/verify-payment', handleVerifyPayment);
  app.post('/api/wallet/verify-razorpay-payment', handleVerifyPayment);

  app.post('/api/wallet/topup', (_req, res) => {
    return res.status(403).json({
      error: 'Direct wallet credit is disabled. Complete Razorpay Checkout via /api/wallet/create-razorpay-order and /api/wallet/verify-razorpay-payment.'
    });
  });

  app.get('/api/wallet/discount-check/:phone', (req, res) => {
    const db = readDb();
    const cleanPhone = normalizePhone(req.params.phone);
    // Check if customer has any completed or confirmed booking
    const hasBooking = db.bookings.some(
      (b) =>
        (normalizePhone(b.phone) === cleanPhone || b.phone === req.params.phone) &&
        (b.status === 'completed' || b.status === 'confirmed')
    );
    const eligible = db.settings.discountEnabled && hasBooking;
    const ratePerMin = eligible ? db.settings.discountedRatePerMin : db.settings.standardRatePerMin;
    res.json({
      eligible,
      ratePerMin,
      standardRate: db.settings.standardRatePerMin,
      discountedRate: db.settings.discountedRatePerMin,
      rule: '50% discount applied because you have booked a sacred Gau Seva with GauKripa!'
    });
  });

  // ==========================================
  // API: COMPLETE LIVE CHAT WORKFLOW
  // ==========================================

  // 1. Customer initiates chat request to a specific astrologer (Immediately active & synced)
  app.post('/api/chat/request', (req, res) => {
    const db = readDb();
    const { astrologerId, customerId, customerName, customerPhone, customerConcern, birthDate, birthTime, birthPlace, initialMessages } = req.body;
    if (!customerName?.trim() || !customerPhone || !birthDate || !birthTime || !birthPlace?.trim()) {
      return res.status(400).json({ error: 'Please complete your name, date of birth, birth time and birth place before connecting.' });
    }

    const astro = db.astrologers.find((a) => a.id === astrologerId);
    if (!astro) {
      return res.status(404).json({ error: 'Astrologer not found' });
    }

    const cleanCustomerPhone = normalizePhone(customerPhone);

    // Ensure wallet exists for customer (real balance)
    getOrInitWallet(db, cleanCustomerPhone, customerName || 'Devotee');

    const sessionId = `CHAT-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const currentTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Use initial messages if provided or generate default intake card + welcome
    const messages: DbChatMessage[] = Array.isArray(initialMessages) && initialMessages.length > 0
      ? initialMessages
      : [
          {
            id: `msg-intake-${Date.now()}`,
            sender: 'customer',
            senderName: customerName || 'Devotee',
            text: `📋 VEDIC KUNDALI INTAKE DETAILS:\n• Name: ${customerName}\n• Date of Birth: ${birthDate}\n• Birth Time: ${birthTime}\n• Birth Place: ${birthPlace}\n• Guidance Needed: ${customerConcern || 'Kundali & Grah Upay guidance'}\n\nPranam Guruji! Here are my complete birth details. Please analyze my chart and guide me.`,
            timestamp: currentTimeStr
          },
          {
            id: `msg-welcome-${Date.now() + 1}`,
            sender: 'astrologer',
            senderName: astro.name,
            text: `Pranam ${customerName} ji! 🙏 Har Har Mahadev. I have received your complete birth details (DOB: ${birthDate}, Time: ${birthTime}, Place: ${birthPlace}). I am analyzing your Lagna Kundali now for ${customerConcern || 'your spiritual guidance'}. Please feel free to ask your questions.`,
            timestamp: currentTimeStr
          }
        ];

    const newSession: DbChatSession = {
      id: sessionId,
      astrologerId: astro.id,
      astrologerName: astro.name,
      customerId: customerId || customerPhone,
      customerName: customerName || 'Devotee',
      customerPhone,
      customerConcern: customerConcern || 'Kundali & Grah Upay guidance',
      birthDate: String(birthDate),
      birthTime: String(birthTime),
      birthPlace: String(birthPlace).trim(),
      status: 'active',
      ratePerMin: 20,
      hasDiscount: true,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      durationSeconds: 0,
      totalCharged: 0,
      astrologerEarned: 0,
      messages
    };

    db.chatSessions.unshift(newSession);
    writeDb(db);
    syncChatSession(newSession).catch(console.error);
    res.json({ success: true, session: newSession });
  });

  // 2. Astrologer polls for incoming / active requests (supports 'all' for unified desk)
  app.get('/api/chat/incoming/:astrologerId', (req, res) => {
    const db = readDb();
    const astroId = req.params.astrologerId;
    const activeOrIncoming = (astroId === 'all' || !astroId)
      ? (db.chatSessions.find((s) => s.status === 'active' || s.status === 'waiting_approval'))
      : (db.chatSessions.find((s) => s.astrologerId === astroId && (s.status === 'active' || s.status === 'waiting_approval')));
    res.json({ incoming: activeOrIncoming || null });
  });

  // 3. Astrologer responds (Accept or Reject)
  app.post('/api/chat/respond', (req, res) => {
    const db = readDb();
    const { sessionId, astrologerId, action } = req.body;
    const session = db.chatSessions.find((s) => s.id === sessionId && (!astrologerId || s.astrologerId === astrologerId));
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    if (action === 'accept') {
      session.status = 'active';
      if (!session.startedAt) session.startedAt = new Date().toISOString();
      session.lastHeartbeat = new Date().toISOString();
    } else {
      session.status = 'rejected';
      session.endedAt = new Date().toISOString();
    }
    writeDb(db);
    syncChatSession(session).catch(console.error);
    res.json({ success: true, session });
  });

  // 4. Session details & message polling (Customer & Astrologer)
  app.get('/api/chat/session/:sessionId', (req, res) => {
    const db = readDb();
    const session = db.chatSessions.find((s) => s.id === req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const { wallet: customerWallet } = getOrInitWallet(db, session.customerPhone, session.customerName || 'Devotee');
    res.json({ session, customerWalletBalance: customerWallet?.balance ?? 0 });
  });

  // 5. Send chat message (Both customer & astrologer)
  app.post('/api/chat/session/:sessionId/message', (req, res) => {
    const db = readDb();
    const session = db.chatSessions.find((s) => s.id === req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const { sender, senderName, text, suggestedSeva } = req.body;
    const newMsg: DbChatMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sender: sender || 'customer',
      senderName: senderName || (sender === 'astrologer' ? session.astrologerName : session.customerName),
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedSeva
    };
    session.messages.push(newMsg);
    writeDb(db);
    syncChatSession(session).catch(console.error);
    res.json({ success: true, message: newMsg, session });
  });

  // 6. Active chat heartbeat (Timer tick & per-minute wallet deduction)
  app.post('/api/chat/session/:sessionId/heartbeat', (req, res) => {
    const db = readDb();
    const session = db.chatSessions.find((s) => s.id === req.params.sessionId);
    if (!session || session.status !== 'active') {
      return res.json({ status: session ? session.status : 'not_found' });
    }

    const now = Date.now();
    const startTime = session.startedAt ? new Date(session.startedAt).getTime() : now;
    const elapsedSecs = Math.max(0, Math.floor((now - startTime) / 1000));
    session.durationSeconds = elapsedSecs;

    // Billed minutes: 1st minute is charged immediately upon starting, then every full minute
    const billedMinutes = Math.max(1, Math.ceil(elapsedSecs / 60));
    const targetCharge = billedMinutes * session.ratePerMin;
    const diff = targetCharge - session.totalCharged;

    const { wallet } = getOrInitWallet(db, session.customerPhone, session.customerName || 'Devotee');

    if (diff > 0 && wallet) {
      if (wallet.balance >= diff) {
        wallet.balance -= diff;
        session.totalCharged += diff;
        session.astrologerEarned += diff;
        wallet.transactions.unshift({
          id: `tx-${Date.now()}`,
          type: 'debit',
          amount: diff,
          description: `Vedic Consultation with ${session.astrologerName} (${billedMinutes} min @ ₹${session.ratePerMin}/min)`,
          date: new Date().toISOString()
        });

        // Update astrologer earnings
        const astro = db.astrologers.find((a) => a.id === session.astrologerId);
        if (astro) {
          astro.totalEarnings += diff;
        }
      } else {
        // Insufficient funds -> auto end session
        session.status = 'ended';
        session.endedAt = new Date().toISOString();
        session.messages.push({
          id: `sys-${Date.now()}`,
          sender: 'astrologer',
          senderName: 'System',
          text: `Consultation session concluded because devotee wallet balance was exhausted. Thank you for seeking Vedic guidance with ${session.astrologerName}.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    }

    session.lastHeartbeat = new Date().toISOString();
    writeDb(db);
    syncChatSession(session).catch(console.error);
    if (wallet) syncWallet(wallet).catch(console.error);
    res.json({
      success: true,
      durationSeconds: session.durationSeconds,
      totalCharged: session.totalCharged,
      astrologerEarned: session.astrologerEarned,
      walletBalance: wallet?.balance || 0,
      status: session.status
    });
  });

  // 7. End chat session
  app.post('/api/chat/session/:sessionId/end', (req, res) => {
    const db = readDb();
    const session = db.chatSessions.find((s) => s.id === req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    session.status = 'ended';
    session.endedAt = new Date().toISOString();

    // Finalize astrologer count
    const astro = db.astrologers.find((a) => a.id === session.astrologerId);
    if (astro) {
      astro.totalConsultations += 1;
    }

    session.messages.push({
      id: `sys-${Date.now()}`,
      sender: 'astrologer',
      senderName: 'System',
      text: `Consultation concluded. Total Duration: ${Math.floor(session.durationSeconds / 60)} min ${session.durationSeconds % 60} sec. Total Service Fee: ₹${session.totalCharged}. Jai Gaumata!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    writeDb(db);
    syncChatSession(session).catch(console.error);
    res.json({ success: true, session });
  });

  // 8. Astrologer chat history & earnings (supports 'all' for unified desk)
  app.get('/api/chat/history/:astrologerId', (req, res) => {
    const db = readDb();
    const astroId = req.params.astrologerId;
    const history = (astroId === 'all' || !astroId)
      ? db.chatSessions.filter((s) => s.status === 'ended')
      : db.chatSessions.filter((s) => s.astrologerId === astroId && s.status === 'ended');

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const todayEarnings = history
      .filter((s) => s.endedAt && s.endedAt.startsWith(todayStr))
      .reduce((acc, s) => acc + (s.astrologerEarned || 0), 0);

    const totalEarnings = history.reduce((acc, s) => acc + (s.astrologerEarned || 0), 0);

    res.json({
      sessions: history,
      analytics: {
        totalConsultations: history.length,
        todayEarnings,
        weeklyEarnings: Math.round(totalEarnings * 0.4),
        monthlyEarnings: totalEarnings
      }
    });
  });

  // ==========================================
  // API: REVIEWS
  // ==========================================
  app.get('/api/reviews', (req, res) => {
    const db = readDb();
    res.json(db.reviews);
  });

  app.post('/api/reviews', (req, res) => {
    const db = readDb();
    const newRev = {
      id: `rev-${Date.now()}`,
      name: req.body.name,
      city: req.body.city || 'Delhi',
      seva: req.body.seva || 'Gau Chara Seva',
      oneLiner: req.body.oneLiner,
      stars: Number(req.body.stars) || 5,
      isApproved: req.body.isApproved !== false,
      createdAt: new Date().toISOString()
    };
    db.reviews.unshift(newRev);
    writeDb(db);
    syncReview(newRev).catch(console.error);
    res.json({ success: true, review: newRev });
  });

  app.put('/api/reviews/:id/approve', (req, res) => {
    const db = readDb();
    const rev = db.reviews.find((r) => r.id === req.params.id);
    if (!rev) return res.status(404).json({ error: 'Review not found' });
    rev.isApproved = req.body.isApproved;
    writeDb(db);
    syncReview(rev).catch(console.error);
    res.json({ success: true, review: rev });
  });

  app.delete('/api/reviews/:id', (req, res) => {
    const db = readDb();
    db.reviews = db.reviews.filter((r) => r.id !== req.params.id);
    writeDb(db);
    deleteReview(req.params.id).catch(console.error);
    res.json({ success: true, message: 'Review deleted' });
  });

  // ==========================================
  // API: FILE & MEDIA UPLOAD (Images/Videos)
  // ==========================================
  app.post('/api/upload', (req, res) => {
    try {
      const { dataUrl, fileName } = req.body;
      if (!dataUrl) {
        return res.status(400).json({ error: 'No data provided' });
      }

      // Check format
      const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: 'Invalid base64 data URL' });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      let ext = 'jpg';
      if (mimeType.includes('png')) ext = 'png';
      else if (mimeType.includes('jpeg')) ext = 'jpg';
      else if (mimeType.includes('webp')) ext = 'webp';
      else if (mimeType.includes('mp4')) ext = 'mp4';
      else if (mimeType.includes('webm')) ext = 'webm';

      const safeName = `upload-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
      const filePath = path.join(uploadsDir, safeName);

      fs.writeFileSync(filePath, buffer);
      const fileUrl = `/uploads/${safeName}`;

      res.json({ success: true, url: fileUrl, fileName: safeName, mimeType });
    } catch (err: any) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Failed to upload media', details: err.message });
    }
  });

  // ==========================================
  // VITE DEV SERVER MIDDLEWARE / PRODUCTION
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ GauKripa Full-Stack Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Error:', err);
  process.exit(1);
});
