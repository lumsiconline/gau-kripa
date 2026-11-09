import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { readDb, writeDb, DbChatMessage, DbChatSession, DbBooking, DbService, DbAstrologer } from './src/server/db';
import {
  initFirestoreDatabase,
  syncService,
  deleteService,
  syncAstrologer,
  syncBooking,
  syncChatSession,
  syncWallet,
  syncReview,
  deleteReview,
  syncSettings,
  getFirestoreStats
} from './src/server/firestoreSync';

async function startServer() {
  const app = express();
  // Dev server must always run on port 3000 according to environment constraints
  const PORT = 3000;

  // Body parser with 50mb limit for media uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Ensure public/uploads exists
  const uploadsDir = path.resolve(process.cwd(), 'public/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve uploads statically
  app.use('/uploads', express.static(uploadsDir));

  // Initialize DB and sync with Firestore
  const initialDb = readDb();
  initFirestoreDatabase(initialDb).catch(console.error);

  // ==========================================
  // API: HEALTH CHECK & DATABASE STATUS
  // ==========================================
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  app.get('/api/database/status', async (req, res) => {
    const stats = await getFirestoreStats();
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
    const cleanPhone = String(phone || '').trim() || '9876543210';

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

    // Ensure wallet exists for new devotee with welcome bonus
    if (!db.wallets[cleanPhone]) {
      db.wallets[cleanPhone] = {
        phone: cleanPhone,
        name: cleanName,
        balance: 150,
        transactions: [
          {
            id: `tx-${Date.now()}`,
            type: 'credit',
            amount: 150,
            description: 'Vedic Devotee Welcome Balance (Sign-Up Bonus)',
            date: new Date().toISOString()
          }
        ]
      };
      syncWallet(db.wallets[cleanPhone]).catch(console.error);
    }

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

    // Fallback devotee authentication
    const devoteeUser = {
      name: cleanEmail.split('@')[0],
      email: cleanEmail,
      role: 'devotee',
      phone: phone || '9876543210',
      isAdmin: false
    };

    // Ensure wallet exists for devotee
    if (!db.wallets[devoteeUser.phone]) {
      db.wallets[devoteeUser.phone] = {
        phone: devoteeUser.phone,
        name: devoteeUser.name,
        balance: 150,
        transactions: [
          {
            id: `tx-${Date.now()}`,
            type: 'credit',
            amount: 150,
            description: 'Vedic Devotee Welcome Balance',
            date: new Date().toISOString()
          }
        ]
      };
      writeDb(db);
      syncWallet(db.wallets[devoteeUser.phone]).catch(console.error);
    }

    return res.json({ success: true, user: devoteeUser });
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
      return res.json(db.bookings.filter((b) => b.phone === phone));
    }
    res.json(db.bookings);
  });

  app.post('/api/bookings', (req, res) => {
    const db = readDb();
    const newBooking: DbBooking = {
      id: `b-${Date.now()}`,
      bookingId: `GK-${Math.floor(100000 + Math.random() * 900000)}`,
      devoteeName: req.body.devoteeName || 'Devotee',
      phone: req.body.phone || '9876543210',
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

    // Initialize or reward devotee wallet
    const p = newBooking.phone;
    if (!db.wallets[p]) {
      db.wallets[p] = {
        phone: p,
        name: newBooking.devoteeName,
        balance: 150,
        transactions: [
          {
            id: `tx-${Date.now()}`,
            type: 'credit',
            amount: 150,
            description: 'Devotee Seva Sankalp Bonus',
            date: new Date().toISOString()
          }
        ]
      };
    }
    writeDb(db);
    syncBooking(newBooking).catch(console.error);
    if (db.wallets[p]) syncWallet(db.wallets[p]).catch(console.error);
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
    const phone = req.params.phone;
    let wallet = db.wallets[phone];
    if (!wallet) {
      wallet = {
        phone,
        name: 'Devotee',
        balance: 150,
        transactions: [
          {
            id: `tx-${Date.now()}`,
            type: 'credit',
            amount: 150,
            description: 'Vedic Devotee Welcome Balance',
            date: new Date().toISOString()
          }
        ]
      };
      db.wallets[phone] = wallet;
      writeDb(db);
    }
    res.json(wallet);
  });

  app.post('/api/wallet/topup', (req, res) => {
    const db = readDb();
    const { phone, amount, name } = req.body;
    const addAmount = Number(amount);
    if (!phone || isNaN(addAmount) || addAmount <= 0) {
      return res.status(400).json({ error: 'Invalid top-up amount' });
    }
    if (!db.wallets[phone]) {
      db.wallets[phone] = {
        phone,
        name: name || 'Devotee',
        balance: 0,
        transactions: []
      };
    }
    db.wallets[phone].balance += addAmount;
    db.wallets[phone].transactions.unshift({
      id: `tx-${Date.now()}`,
      type: 'credit',
      amount: addAmount,
      description: `Wallet Recharged via UPI / NetBanking (₹${addAmount})`,
      date: new Date().toISOString()
    });
    writeDb(db);
    syncWallet(db.wallets[phone]).catch(console.error);
    res.json({ success: true, balance: db.wallets[phone].balance, wallet: db.wallets[phone] });
  });

  app.get('/api/wallet/discount-check/:phone', (req, res) => {
    const db = readDb();
    const phone = req.params.phone;
    // Check if customer has any completed or confirmed booking
    const hasBooking = db.bookings.some(
      (b) => b.phone === phone && (b.status === 'completed' || b.status === 'confirmed')
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

    // Ensure wallet exists for customer with consultation balance
    if (!db.wallets[customerPhone]) {
      db.wallets[customerPhone] = {
        phone: customerPhone,
        name: customerName || 'Devotee',
        balance: 150,
        transactions: [
          {
            id: `tx-${Date.now()}`,
            type: 'credit',
            amount: 150,
            description: 'Vedic Devotee Welcome Balance',
            date: new Date().toISOString()
          }
        ]
      };
    }

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
    const customerWallet = db.wallets[session.customerPhone];
    res.json({ session, customerWalletBalance: customerWallet?.balance ?? 150 });
  });

  // 5. Send chat message (Both customer & astrologer)
  app.post('/api/chat/session/:sessionId/message', (req, res) => {
    const db = readDb();
    const session = db.chatSessions.find((s) => s.id === req.params.sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const { sender, senderName, text, suggestedSeva, clientMessageId } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) return res.status(400).json({ error: 'Message text is required' });
    if (clientMessageId) {
      const previous = session.messages.find((m) => m.clientMessageId === clientMessageId);
      if (previous) return res.json({ success: true, message: previous, session });
    }
    const newMsg: DbChatMessage = {
      id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sender: sender || 'customer',
      senderName: senderName || (sender === 'astrologer' ? session.astrologerName : session.customerName),
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedSeva,
      clientMessageId
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

    const wallet = db.wallets[session.customerPhone];

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
      text: `Consultation concluded. Total Duration: ${Math.floor(session.durationSeconds / 60)} min ${session.durationSeconds % 60} sec. Total Dakshina: ₹${session.totalCharged}. Jai Gaumata!`,
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
