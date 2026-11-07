export interface SevaItem {
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
  detailedDescription: string;
  vedicSignificance: string;
}

export const SEVA_ITEMS: SevaItem[] = [
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
    vedicSignificance: 'According to the Bhavishya Purana, feeding fresh green fodder to Kamadhenu pleases Lord Surya, dispelling lethargy and opening paths to authority and respect.'
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
    vedicSignificance: 'Chandra (Moon) controls the psyche and emotional wellbeing. Offering warm rotis soothes mental afflictions, anxiety, and sleeplessness.'
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
    vedicSignificance: 'Pacifies fiery Mars (Mangal). Recommended by astrologers for clearing debts, removing legal hurdles, and pacifying Manglik Dosha.'
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
    vedicSignificance: 'Mercury (Budh) governs speech, business acumen, and intellect. Birds are symbols of divine communication; feeding them brings clarity and prosperous trade.'
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
    vedicSignificance: 'Feeding innumerable tiny souls (cheentis) balances karmic debits, neutralizes sudden shocks, and stabilizes unpredictable Rahu-Ketu cycles.'
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
    vedicSignificance: 'The dog represents the faithful vahana of Lord Bhairava and Lord Dattatreya. Feeding stray dogs shields families from evil eye, black magic, and Ketu obstacles.'
  }
];

export interface Astrologer {
  id: string;
  name: string;
  title: string;
  experience: string;
  rating: number;
  reviewsCount: string;
  ratePerMin: number;
  cropKey: 'astroSophia' | 'astroRohan' | 'astroMaria';
  languages: string[];
  bio: string;
  specializations: string[];
}

export const ASTROLOGERS: Astrologer[] = [
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
    specializations: ['Kundali Analysis', 'Tarot Card Reading', 'Career Transitions', 'Marriage Compatibility']
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
    specializations: ['Vedic Astrology', 'Life Coaching', 'Business Horoscopy', 'Grah Shanti Upay']
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
    specializations: ['Love & Relationship', 'Soulmate Spread', 'Emotional Healing', 'Numerology']
  }
];

export interface RemedyCategory {
  id: string;
  title: string;
  iconName: string;
  rulingPlanets: string;
  description: string;
  recommendedSevaId: string;
  mantra: string;
  dosha: string;
}

export const REMEDY_CATEGORIES: RemedyCategory[] = [
  {
    id: 'career',
    title: 'Career Growth',
    iconName: 'Briefcase',
    rulingPlanets: 'Surya (Sun) & Shani (Saturn)',
    description: 'Break professional stagnation, clear delayed promotions, and gain leadership respect.',
    recommendedSevaId: 'gau-chara',
    mantra: 'ॐ घृणि सूर्याय नमः (Om Ghrini Suryaya Namaha)',
    dosha: 'Surya Dosh / Pitra Rin'
  },
  {
    id: 'love',
    title: 'Love & Marriage',
    iconName: 'Heart',
    rulingPlanets: 'Shukra (Venus) & Mangal (Mars)',
    description: 'Resolve marital discord, find the ideal partner, and pacify fiery Manglik energies.',
    recommendedSevaId: 'gau-gud-chana',
    mantra: 'ॐ शुं शुक्राय नमः (Om Shum Shukraya Namaha)',
    dosha: 'Mangal Dosh / Shukra Peeda'
  },
  {
    id: 'health',
    title: 'Health & Peace',
    iconName: 'Leaf',
    rulingPlanets: 'Chandra (Moon) & Mahamrityunjaya',
    description: 'Soothe mental turmoil, anxiety, insomnia, and promote healing from persistent illnesses.',
    recommendedSevaId: 'gau-roti',
    mantra: 'ॐ सों सोमाय नमः (Om Som Somaya Namaha)',
    dosha: 'Chandra Dosh / Vish Yoga'
  },
  {
    id: 'finance',
    title: 'Financial Stability',
    iconName: 'Coins',
    rulingPlanets: 'Guru (Jupiter) & Budh (Mercury)',
    description: 'Attract steady wealth, dissolve business debts, and invite Goddess Lakshmi’s blessings.',
    recommendedSevaId: 'gau-chara',
    mantra: 'ॐ बृं बृहस्पतये नमः (Om Brim Brihaspataye Namaha)',
    dosha: 'Guru Chandal / Daridra Yoga'
  },
  {
    id: 'negativity',
    title: 'Remove Negativity',
    iconName: 'Shield',
    rulingPlanets: 'Rahu & Ketu (Shadow Planets)',
    description: 'Shield home and mind from evil eye, black energies, unexpected fears, and bad dreams.',
    recommendedSevaId: 'street-dogs',
    mantra: 'ॐ कें केतवे नमः (Om Kem Ketave Namaha)',
    dosha: 'Kalsarp Dosh / Rahu Mahadasha'
  },
  {
    id: 'family',
    title: 'Family Happiness',
    iconName: 'Home',
    rulingPlanets: 'Chandra (Moon) & Brihaspati (Jupiter)',
    description: 'Foster filial harmony, eradicate ancestral blockages, and bless the household with peace.',
    recommendedSevaId: 'cheenti-aata',
    mantra: 'ॐ नमो भगवते वासुदेवाय (Om Namo Bhagavate Vasudevaya)',
    dosha: 'Griha Klesh / Vastu Dosh'
  }
];

export interface SevaProof {
  id: string;
  devoteeName: string;
  location: string;
  sevaTitle: string;
  date: string;
  time: string;
  goshalaName: string;
  certificateId: string;
}

export const RECENT_PROOFS: SevaProof[] = [
  {
    id: 'PRF-8941',
    devoteeName: 'Rajesh & Sunita Sharma',
    location: 'Jaipur, Rajasthan',
    sevaTitle: 'Gau Chara Seva (25 kg)',
    date: 'Today, 07:15 AM',
    time: 'Brahmamuhurta',
    goshalaName: 'Surabhi Seva Dham, Vrindavan',
    certificateId: 'GK-SANKALP-9021'
  },
  {
    id: 'PRF-8942',
    devoteeName: 'Ananya Deshmukh',
    location: 'Pune, Maharashtra',
    sevaTitle: 'Gau Roti Seva (21 Rotis)',
    date: 'Today, 08:30 AM',
    time: 'Morning Arati',
    goshalaName: 'Gau Prem Mandir, Mathura',
    certificateId: 'GK-SANKALP-9022'
  },
  {
    id: 'PRF-8943',
    devoteeName: 'Vikramaditya Singhania',
    location: 'New Delhi',
    sevaTitle: 'Street Dogs Seva (10 Trays)',
    date: 'Yesterday, 06:45 PM',
    time: 'Sandhya Bela',
    goshalaName: 'Karuna Mitra Seva Dal, Delhi NCR',
    certificateId: 'GK-SANKALP-9023'
  },
  {
    id: 'PRF-8944',
    devoteeName: 'Meenakshi Iyer',
    location: 'Bengaluru, Karnataka',
    sevaTitle: 'Pakshi Dana & Cheenti Aata',
    date: 'Yesterday, 07:00 AM',
    time: 'Sunrise Pratham Seva',
    goshalaName: 'Ananda Teertha Vana, Haridwar',
    certificateId: 'GK-SANKALP-9024'
  }
];
