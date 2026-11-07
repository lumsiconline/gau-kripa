import fs from 'fs';
import path from 'path';

export interface DbService {
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

export interface DbAstrologer {
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

export interface DbBooking {
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

export interface DbChatMessage {
  id: string;
  sender: 'customer' | 'astrologer';
  senderName: string;
  text: string;
  timestamp: string;
  suggestedSeva?: string;
}

export interface DbChatSession {
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
  messages: DbChatMessage[];
  lastHeartbeat?: string;
}

export interface DbWallet {
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

export interface DbSettings {
  standardRatePerMin: number;
  discountedRatePerMin: number;
  discountEnabled: boolean;
  extraOccasionFee: number;
  promoBannerText: string;
  bannerEnabled: boolean;
  trustName: string;
}

export interface DbReview {
  id: string;
  name: string;
  city: string;
  seva: string;
  oneLiner: string;
  stars: number;
  isApproved: boolean;
  createdAt: string;
}

export interface DbSchema {
  services: DbService[];
  astrologers: DbAstrologer[];
  bookings: DbBooking[];
  chatSessions: DbChatSession[];
  wallets: Record<string, DbWallet>;
  settings: DbSettings;
  reviews: DbReview[];
}

const DB_PATH = path.resolve(process.cwd(), 'src/server/db.json');

const INITIAL_SERVICES: DbService[] = [
  {
    id: 'gau-chara',
    title: 'Gau Chara Seva',
    planet: 'Surya Grah',
    planetTag: '☀️ Surya Grah',
    tagColor: 'bg-amber-100 text-amber-900 border-amber-300',
    priceDisplay: '₹251 (5 kg)',
    basePrice: 251,
    unit: 'lot (5 kg)',
    minQty: 1,
    benefit: 'Helps reduce Surya Dosh & brings confidence & success.',
    cropKey: 'sevaChara',
    detailedDescription: 'Fresh, juicy green grass, sorghum, and clover harvested early morning and offered with sacred devotion to Gaumata in certified Vedic goshalas.',
    vedicSignificance: 'According to the Bhavishya Purana, feeding fresh green fodder to Kamadhenu pleases Lord Surya, dispelling lethargy and opening paths to authority and respect.',
    isActive: true,
    category: 'cow'
  },
  {
    id: 'gau-roti',
    title: 'Gau Roti Seva',
    planet: 'Chandra Grah',
    planetTag: '🌙 Chandra Grah',
    tagColor: 'bg-amber-50 text-amber-900 border-amber-200',
    priceDisplay: '₹51 (4 Rotis)',
    basePrice: 51,
    unit: 'lot (4 rotis)',
    minQty: 1,
    benefit: 'Helps calm Chandra Dosh & brings peace of mind.',
    cropKey: 'sevaRoti',
    detailedDescription: 'Pure whole-wheat rotis freshly prepared with pure desi ghee and love, hand-fed to maternal cows while reciting auspicious cow-benedictions.',
    vedicSignificance: 'Chandra (Moon) controls the psyche and emotional wellbeing. Offering warm rotis soothes mental afflictions, anxiety, and sleeplessness.',
    isActive: true,
    category: 'cow'
  },
  {
    id: 'gau-gud-chana',
    title: 'Gau Gud-Chana Seva',
    planet: 'Mangal Grah',
    planetTag: '🪐 Mangal Grah',
    tagColor: 'bg-amber-100 text-amber-900 border-amber-300',
    priceDisplay: '₹151',
    basePrice: 151,
    unit: 'thali',
    minQty: 1,
    benefit: 'Helps reduce Mangal Dosh & brings courage & strength.',
    cropKey: 'sevaGudChana',
    detailedDescription: 'Rich organic mineral jaggery (Gud) and dry-roasted protein-rich gram (Chana), formulated to build vigor and vitality for cows and calves.',
    vedicSignificance: 'Pacifies fiery Mars (Mangal). Recommended by astrologers for clearing debts, removing legal hurdles, and pacifying Manglik Dosha.',
    isActive: true,
    category: 'cow'
  },
  {
    id: 'pakshi-dana',
    title: 'Pakshi Dana Seva',
    planet: 'Budh Grah',
    planetTag: '🦅 Budh Grah',
    tagColor: 'bg-amber-100 text-amber-900 border-amber-300',
    priceDisplay: '₹101',
    basePrice: 101,
    unit: 'katori mix',
    minQty: 1,
    benefit: 'Helps remove Mangal Dosh & brings courage & strength.',
    cropKey: 'sevaPakshi',
    detailedDescription: 'Wholesome natural pearl millets (bajra), broken wheat, flaxseeds, and water bowls distributed at sunrise for wild sparrows, doves, and parrots.',
    vedicSignificance: 'Mercury (Budh) governs speech, business acumen, and intellect. Birds are symbols of divine communication; feeding them brings clarity and prosperous trade.',
    isActive: true,
    category: 'bird'
  },
  {
    id: 'cheenti-aata',
    title: 'Cheenti Aata Seva',
    planet: 'Rahu-Ketu',
    planetTag: '🪱 Rahu-Ketu',
    tagColor: 'bg-amber-100 text-amber-900 border-amber-300',
    priceDisplay: '₹149',
    basePrice: 149,
    unit: 'pudika pack',
    minQty: 1,
    benefit: 'Helps reduce Rahu-Ketu Dosh & brings stability.',
    cropKey: 'sevaCheenti',
    detailedDescription: 'Sacred sweet Kasar powder composed of dry roasted wheat flour, powdered sugar, and sesame seeds, placed near ant colonies under holy Peepal and Banyan trees.',
    vedicSignificance: 'Feeding innumerable tiny souls (cheentis) balances karmic debits, neutralizes sudden shocks, and stabilizes unpredictable Rahu-Ketu cycles.',
    isActive: true,
    category: 'ant'
  },
  {
    id: 'street-dogs',
    title: 'Street Dogs Seva',
    planet: 'Ketu Grah',
    planetTag: '🐕 Ketu Grah',
    tagColor: 'bg-amber-100 text-amber-900 border-amber-300',
    priceDisplay: '₹199+',
    basePrice: 199,
    unit: 'meal tray',
    minQty: 1,
    benefit: 'Helps remove Ketu Dosh & brings spiritual growth.',
    cropKey: 'sevaDogs',
    detailedDescription: 'Wholesome hygienic meals cooked with rice, turmeric, boiled milk, pumpkin, and rotis, distributed compassionately to stray street animals.',
    vedicSignificance: 'The dog represents the faithful vahana of Lord Bhairava and Lord Dattatreya. Feeding stray dogs shields families from evil eye, black magic, and Ketu obstacles.',
    isActive: true,
    category: 'dog'
  }
];

const INITIAL_ASTROLOGERS: DbAstrologer[] = [
  {
    id: 'dr-sophia',
    name: 'Dr. Sophia Sharma',
    title: 'Tarot & Vedic Expert',
    experience: '15+ Years Experience',
    rating: 4.9,
    reviewsCount: '12k+ reviews',
    ratePerMin: 20,
    cropKey: 'astroSophia',
    languages: ['Hindi', 'English', 'Sanskrit'],
    bio: 'Renowned gold-medalist Vedic astrologer and intuitive tarot reader with deep lineage in Nadi astrology and sacred gemstone remedial science.',
    specializations: ['Kundali Analysis', 'Tarot Card Reading', 'Career Transitions', 'Marriage Compatibility'],
    isOnline: true,
    totalConsultations: 1420,
    totalEarnings: 28400
  },
  {
    id: 'acharya-rohan',
    name: 'Acharya Rohan Mehta',
    title: 'Vedic & Life Coach',
    experience: '14+ Years Experience',
    rating: 4.8,
    reviewsCount: '10k+ reviews',
    ratePerMin: 20,
    cropKey: 'astroRohan',
    languages: ['Hindi', 'Gujarati', 'English'],
    bio: 'Practicing Vedic Shastri trained at Kashi Vishwanath Gurukula, specializing in birth chart rectifications, Manglik Dosh remedies, and wealth Yantras.',
    specializations: ['Vedic Astrology', 'Life Coaching', 'Business Horoscopy', 'Grah Shanti Upay'],
    isOnline: true,
    totalConsultations: 980,
    totalEarnings: 19600
  },
  {
    id: 'maria-kapoor',
    name: 'Maria Kapoor',
    title: 'Tarot & Relationship Expert',
    experience: '12+ Years Experience',
    rating: 4.8,
    reviewsCount: '8k+ reviews',
    ratePerMin: 20,
    cropKey: 'astroMaria',
    languages: ['Hindi', 'English', 'Punjabi'],
    bio: 'Celebrated relationship counselor and intuitive tarot healer, empowering thousands to navigate romance, marital harmony, and personal fulfillment.',
    specializations: ['Love & Relationship', 'Soulmate Spread', 'Emotional Healing', 'Numerology'],
    isOnline: true,
    totalConsultations: 850,
    totalEarnings: 17000
  }
];

const INITIAL_BOOKINGS: DbBooking[] = [
  {
    id: 'b-101',
    bookingId: 'GK-749102',
    devoteeName: 'Harsh Bhardwaj',
    phone: '9876543210',
    email: 'harshbhardwaj0745@gmail.com',
    gotra: 'Kashyap',
    sevaId: 'gau-chara',
    sevaTitle: 'Gau Chara Seva',
    quantity: '1 lot (5 kg)',
    duration: '1 Day (Single Seva)',
    occasion: 'General Daily Seva',
    amount: 251,
    baseAmount: 251,
    extraFee: 0,
    status: 'completed',
    date: '2026-11-05',
    familyMembers: ['Sunita Bhardwaj', 'Aarav Bhardwaj'],
    sankalpWish: 'Family prosperity and peace',
    goshala: 'Surabhi Seva Dham, Vrindavan',
    videoProofUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cows-in-a-field-grazing-43283-large.mp4',
    photoProofUrls: ['/assets/aistudio/image_a83a3632.png'],
    priestName: 'Pandit Radheshyam Shastri',
    whatsappSent: true,
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'b-102',
    bookingId: 'GK-839211',
    devoteeName: 'Rameshwar Gupta',
    phone: '9811223344',
    email: 'rameshwar.gupta@gmail.com',
    gotra: 'Garg',
    sevaId: 'gau-roti',
    sevaTitle: 'Gau Roti Seva',
    quantity: '1 lot (4 rotis)',
    duration: '7 Days (Weekly Sankalp)',
    occasion: 'Birthday Blessing',
    amount: 378,
    baseAmount: 357,
    extraFee: 21,
    status: 'completed',
    date: '2026-11-04',
    familyMembers: ['Meenakshi Gupta'],
    sankalpWish: 'Chandra dosh nivaran and peace of mind',
    goshala: 'Gau Seva Ashram, Mathura',
    videoProofUrl: 'https://assets.mixkit.co/videos/preview/mixkit-cows-in-a-field-grazing-43283-large.mp4',
    photoProofUrls: ['/assets/aistudio/image_123e24a7.png'],
    priestName: 'Acharya Vidyadhar',
    whatsappSent: true,
    createdAt: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 'b-103',
    bookingId: 'GK-910283',
    devoteeName: 'Anjali Sharma',
    phone: '9877665544',
    email: 'anjali.s@gmail.com',
    gotra: 'Bhardwaj',
    sevaId: 'cheenti-aata',
    sevaTitle: 'Cheenti Aata Seva',
    quantity: '1 pudika pack',
    duration: '1 Day (Single Seva)',
    occasion: 'General Daily Seva',
    amount: 149,
    baseAmount: 149,
    extraFee: 0,
    status: 'in_progress',
    date: '2026-11-06',
    familyMembers: [],
    sankalpWish: 'Rahu Ketu dosh shanti',
    goshala: 'Kamadhenu Dham, Govardhan',
    priestName: 'Pandit Murari Lal',
    whatsappSent: false,
    createdAt: new Date().toISOString()
  }
];

const INITIAL_REVIEWS: DbReview[] = [
  {
    id: 'rev-1',
    name: 'Rohit Sharma',
    city: 'Delhi NCR',
    seva: 'Gau Chara Seva',
    oneLiner: 'Bhai WhatsApp pe direct 2 ghante me Gaumata ke chara khilane ka video proof mil gaya, bahut shanti mili!',
    stars: 5,
    isApproved: true,
    createdAt: '2026-11-05T10:00:00Z'
  },
  {
    id: 'rev-2',
    name: 'Ananya Verma',
    city: 'Mumbai',
    seva: 'Gau Roti Seva',
    oneLiner: 'Gau Roti seva book ki thi, puja ki video dekh ke sach me pura mann prasann ho gaya.',
    stars: 5,
    isApproved: true,
    createdAt: '2026-11-05T12:00:00Z'
  },
  {
    id: 'rev-3',
    name: 'Vikram Singhania',
    city: 'Varanasi',
    seva: 'Gud-Chana Seva',
    oneLiner: 'Vrindavan goshala me Pandit ji ne hamare gotra ke sath sankalp padha, 100% genuine trust hai.',
    stars: 5,
    isApproved: true,
    createdAt: '2026-11-04T15:00:00Z'
  },
  {
    id: 'rev-4',
    name: 'Priya Deshmukh',
    city: 'Pune',
    seva: 'Surya Grah Seva',
    oneLiner: 'Job interview se pehle chara seva ki thi, positive results mile aur mann me bohot confidence aaya.',
    stars: 5,
    isApproved: true,
    createdAt: '2026-11-04T18:00:00Z'
  },
  {
    id: 'rev-5',
    name: 'Rajesh Patel',
    city: 'Ahmedabad',
    seva: 'Cheenti Aata Seva',
    oneLiner: 'Cheenti aata seva ka clear HD video phone pe aaya, itni transparent seva pehli baar dekhi.',
    stars: 5,
    isApproved: true,
    createdAt: '2026-11-03T09:00:00Z'
  }
];

export function readDb(): DbSchema {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initial: DbSchema = {
        services: INITIAL_SERVICES,
        astrologers: INITIAL_ASTROLOGERS,
        bookings: INITIAL_BOOKINGS,
        chatSessions: [],
        wallets: {
          '9876543210': {
            phone: '9876543210',
            name: 'Harsh Bhardwaj',
            balance: 250,
            transactions: [
              {
                id: 'tx-1',
                type: 'credit',
                amount: 250,
                description: 'Devotee Welcome Credit (Vedic Grah Remedial Balance)',
                date: new Date().toISOString()
              }
            ]
          }
        },
        settings: {
          standardRatePerMin: 20,
          discountedRatePerMin: 10,
          discountEnabled: true,
          extraOccasionFee: 21,
          promoBannerText: '✨ Subh Deepawali Special Offer: 50% Off on Astrologer Consultation with any Seva Booking!',
          bannerEnabled: true,
          trustName: 'GauKripa Seva Trust • Vrindavan & Mathura'
        },
        reviews: INITIAL_REVIEWS
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading db.json:', err);
    throw err;
  }
}

export function writeDb(db: DbSchema): void {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
}
