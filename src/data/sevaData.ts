import type { AppLanguage } from '../i18n/LanguageContext';

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
  customImageUrl?: string;
  detailedDescription: string;
  vedicSignificance: string;
  fulfilmentDetails: string;
}

export const SEVA_ITEMS_HI: SevaItem[] = [
  {
    id: 'gau-chara',
    title: 'गौमाता के लिए चारा व्यवस्था',
    planet: 'Surya Grah',
    planetTag: '☀️ सूर्य ग्रह शांति',
    tagColor: 'bg-amber-100 text-amber-900 border-amber-300',
    priceDisplay: '5 किलो ₹251',
    basePrice: 251,
    unit: '5 किलो',
    minQty: 1,
    benefit: 'गौमाता को 5 किलो हरा व पौष्टिक चारा उपलब्ध कराने की सेवा। सूर्य ग्रह दोष शांति व यश-कीर्ति वृद्धि।',
    cropKey: 'sevaChara',
    detailedDescription: 'प्रमाणित गौशाला में गौमाता के लिए 5 किलोग्राम ताजा, पौष्टिक हरा चारा व सूखा चारा आहार व्यवस्था। सेवा उपरांत आपके नाम व गोत्र से आहार वितरण की वीडियो पुष्टि व्हाट्सएप पर भेजी जाती है।',
    vedicSignificance: 'शास्त्रों के अनुसार गौमाता को तृप्त आहार कराने से सभी 33 कोटि देवी-देवताओं का आशीर्वाद प्राप्त होता है और सूर्य ग्रह की कृपा से जीवन में तेज और सफलता मिलती है।',
    fulfilmentDetails: 'प्रमाणित गौशाला में 5 किलो ताजे चारे का प्रत्यक्ष आहार प्रबंधन + गोत्र संकल्प + आहार वितरण की वीडियो पुष्टि।'
  },
  {
    id: 'gau-gud-chana',
    title: 'गौमाता का गुड़-चना आहार',
    planet: 'Mangal Grah',
    planetTag: '🪐 मंगल ग्रह शांति',
    tagColor: 'bg-amber-100 text-amber-900 border-amber-300',
    priceDisplay: '₹151',
    basePrice: 151,
    unit: 'थाली आहार',
    minQty: 1,
    benefit: 'ऊर्जादायक गुड़-चना आहार व्यवस्था। मंगल दोष निवारण, कर्ज मुक्ति व शक्ति-साहस प्राप्ति।',
    cropKey: 'sevaGudChana',
    detailedDescription: 'देसी गौमाता एवं बछड़ों के लिए शुद्ध खनिजयुक्त गुड़ एवं भुने हुए चने का विशेष पौष्टिक आहार। गौमाता के स्वास्थ्य संवर्धन हेतु उत्तम आहार व्यवस्था।',
    vedicSignificance: 'गुड़-चना आहार से मंगल ग्रह के क्रूर प्रभाव शांत होते हैं, कर्ज से मुक्ति और भूमि-भवन संबंधी कार्यों में सफलता प्राप्त होती है।',
    fulfilmentDetails: 'देसी गौमाता को शुद्ध गुड़-चना थाली आहार खिलाया जाता है + आहार वितरण की वीडियो पुष्टि।'
  },
  {
    id: 'gau-roti',
    title: 'गौमाता के लिए रोटी व्यवस्था',
    planet: 'Chandra Grah',
    planetTag: '🌙 चंद्र ग्रह शांति',
    tagColor: 'bg-amber-50 text-amber-900 border-amber-200',
    priceDisplay: '4 रोटियाँ ₹51',
    basePrice: 51,
    unit: '4 रोटियाँ',
    minQty: 1,
    benefit: 'गौमाता के लिए 4 ताजी रोटियों की व्यवस्था। चंद्र दोष शांति, मानसिक शांति व पारिवारिक सौहार्द।',
    cropKey: 'sevaRoti',
    detailedDescription: 'शुद्ध गेहूं के आटे से ताजी तैयार 4 रोटियां गौमाता को आदरपूर्वक खिलाने की व्यवस्था। प्रतिदिन गौमाता को ग्रास देने का वैदिक नियम पूर्ण होता है।',
    vedicSignificance: 'गौमाता को नित्य रोटी खिलाने से चंद्र ग्रह बलिष्ठ होता है, मानसिक तनाव व अनिद्रा दूर होती है और परिवार में सुख-शांति रहती है।',
    fulfilmentDetails: 'गौमाता को ताजी 4 गेहूं की रोटियां प्रेमपूर्वक खिलाई जाती हैं + आहार वितरण की वीडियो पुष्टि।'
  },
  {
    id: 'pakshi-dana',
    title: 'पक्षी दाना आहार सेवा',
    planet: 'Budh Grah',
    planetTag: '🦅 बुध ग्रह शांति',
    tagColor: 'bg-amber-100 text-amber-900 border-amber-300',
    priceDisplay: '₹101',
    basePrice: 101,
    unit: 'कटोरी मिश्रण',
    minQty: 1,
    benefit: 'बाजरा, कंगनी व अनाज की व्यवस्था। बुध ग्रह दोष निवारण, व्यापारिक बुद्धि व वाक-चातुर्य में वृद्धि।',
    cropKey: 'sevaPakshi',
    detailedDescription: 'प्रातःकाल पक्षियों के लिए पोषक बाजरा, गेहूं, तिल व जलपात्र की उचित व्यवस्था। वाणी दोष और व्यापारिक अड़चनों को दूर करने हेतु उत्तम सेवा।',
    vedicSignificance: 'बुध ग्रह वाणी, बुद्धि और व्यापार का कारक है। पक्षियों को दाना चुगाने से मानसिक स्पष्टता व नए व्यावसायिक अवसर प्राप्त होते हैं।',
    fulfilmentDetails: 'प्राकृतिक पक्षी आश्रय स्थलों पर अनाज-दाना व जल वितरण किया जाता है।'
  },
  {
    id: 'cheenti-aata',
    title: 'चींटी आटा-कसार आहार सेवा',
    planet: 'Rahu-Ketu',
    planetTag: '🪱 राहु-केतु शांति',
    tagColor: 'bg-amber-100 text-amber-900 border-amber-300',
    priceDisplay: '₹149',
    basePrice: 149,
    unit: 'पुड़िका पैकेट',
    minQty: 1,
    benefit: 'पीपल व वटवृक्ष के नीचे मीठे कसार की व्यवस्था। राहु-केतु जनित अप्रत्याशित संकटों से सुरक्षा।',
    cropKey: 'sevaCheenti',
    detailedDescription: 'भुने हुए गेहूं के आटे, बूरा शक्कर व तिल से निर्मित कसार आहार। चींटियों के बिलों के समीप पवित्र वृक्षों के नीचे आहार व्यवस्था की जाती है।',
    vedicSignificance: 'चींटियों को भोजन कराने से संचित कर्म दोष कटते हैं, अज्ञात भय समाप्त होता है और राहु की महादशा में जीवन में स्थिरता आती है।',
    fulfilmentDetails: 'पवित्र पीपल वृक्ष के समीप चींटी आहार अर्पित किया जाता है।'
  },
  {
    id: 'street-dogs',
    title: 'श्वान आहार व्यवस्था सेवा',
    planet: 'Ketu Grah',
    planetTag: '🐕 केतु ग्रह शांति',
    tagColor: 'bg-amber-100 text-amber-900 border-amber-300',
    priceDisplay: '₹199',
    basePrice: 199,
    unit: 'आहार थाल',
    minQty: 1,
    benefit: 'सड़क के बेसहारा श्वान के लिए पके भोजन की व्यवस्था। केतु दोष शांति, अकाल मृत्यु भय निवारण।',
    cropKey: 'sevaDogs',
    detailedDescription: 'चावल, हल्दी, रोटी व दूध से बना शुद्ध और स्वास्थ्यवर्धक भोजन बेसहारा श्वान को सम्मानपूर्वक वितरित किया जाता है।',
    vedicSignificance: 'श्वान भगवान भैरव के सेवक हैं। उन्हें भोजन कराने से घर-परिवार पर आने वाली अदृश्य विपत्तियां टलती हैं और केतु शुभ फल देने लगता है।',
    fulfilmentDetails: 'आहार तैयार कर निराश्रित श्वान को तृप्त भोजन कराया जाता है।'
  }
];

export const SEVA_ITEMS_EN: SevaItem[] = [
  {
    id: 'gau-chara',
    title: 'Gaumata Hara Chara Seva',
    planet: 'Surya Grah',
    planetTag: '☀️ Surya Grah Shanti',
    tagColor: 'bg-amber-100 text-amber-900 border-amber-300',
    priceDisplay: '5 kg ₹251',
    basePrice: 251,
    unit: '5 kg',
    minQty: 1,
    benefit: 'Gaumata ko 5 kg taaza aur paushtik hara chara khilane ki pratyaksh seva. Surya Grah dosh shanti aur yash-kirti mein vriddhi.',
    cropKey: 'sevaChara',
    detailedDescription: 'Pramanit goshala mein Gaumata ke liye 5 kg taaza hara chara aur sookha chara aahar vyavastha. Seva poori hone ke baad aapke naam aur Gotra ke sath aahar vitaran ka video proof WhatsApp par bheja jata hai.',
    vedicSignificance: 'Shastron ke anusar Gaumata ko tript aahar karane se sabhi 33 koti devi-devtaon ka aashirwad milta hai aur Surya Grah ki kripa se jeevan mein tej aur safalta milti hai.',
    fulfilmentDetails: 'Pramanit goshala mein 5 kg taaze chare ki pratyaksh vyavastha + Gotra Sankalp + WhatsApp par video confirmation.'
  },
  {
    id: 'gau-gud-chana',
    title: 'Gaumata Gud-Chana Aahar Seva',
    planet: 'Mangal Grah',
    planetTag: '🪐 Mangal Grah Shanti',
    tagColor: 'bg-amber-100 text-amber-900 border-amber-300',
    priceDisplay: '₹151',
    basePrice: 151,
    unit: 'Aahar Thali',
    minQty: 1,
    benefit: 'Urjadayak gud-chana aahar vyavastha. Mangal dosh nivaran, karz mukti aur shakti-sahas prapti ke liye.',
    cropKey: 'sevaGudChana',
    detailedDescription: 'Desi Gaumata aur bachhdon ke liye shuddh gud aur bhune chane ki vishesh paushtik thali. Gaumata ke swasthya aur poshan ke liye uttam aahar seva.',
    vedicSignificance: 'Gud-chana aahar se Mangal Grah ke ugra prabhav shant hote hain, karz se mukti aur bhoomi-bhavan ya career ke kaamon mein safalta milti hai.',
    fulfilmentDetails: 'Desi Gaumata ko shuddh Gud-Chana thali pratyaksh khilayi jati hai + WhatsApp par video proof.'
  },
  {
    id: 'gau-roti',
    title: 'Gaumata Taazi Roti Seva',
    planet: 'Chandra Grah',
    planetTag: '🌙 Chandra Grah Shanti',
    tagColor: 'bg-amber-50 text-amber-900 border-amber-200',
    priceDisplay: '4 Roti ₹51',
    basePrice: 51,
    unit: '4 Roti',
    minQty: 1,
    benefit: 'Gaumata ke liye 4 taazi gehun ki rotiyon ki vyavastha. Chandra dosh shanti, mansik shanti aur parivarik sukh.',
    cropKey: 'sevaRoti',
    detailedDescription: 'Shuddh gehun ke aate se taazi bani 4 rotiyan Gaumata ko prem aur aadar se khilane ki vyavastha, jisse daily Vedic Go-Gras niyam poora hota hai.',
    vedicSignificance: 'Gaumata ko roz roti khilane se Chandra Grah majboot hota hai, mansik tanav aur anindra door hoti hai aur ghar mein sukh-shanti bani rehti hai.',
    fulfilmentDetails: 'Gaumata ko 4 taazi gehun ki rotiyan prem se khilayi jati hain + WhatsApp video proof.'
  },
  {
    id: 'pakshi-dana',
    title: 'Pakshi Dana Aahar Seva',
    planet: 'Budh Grah',
    planetTag: '🦅 Budh Grah Shanti',
    tagColor: 'bg-amber-100 text-amber-900 border-amber-300',
    priceDisplay: '₹101',
    basePrice: 101,
    unit: 'Dana Katori',
    minQty: 1,
    benefit: 'Pakshiyon ke liye bajra, anaj aur shuddh jal ki vyavastha. Budh Grah dosh nivaran, vyapar buddhi aur vaani mein sudhar.',
    cropKey: 'sevaPakshi',
    detailedDescription: 'Subah pakshiyon ke liye paushtik bajra, gehun, til aur peene ke saaf paani ki vyavastha. Vaani dosh aur vyapar ki rukawaton ko door karne ki uttam seva.',
    vedicSignificance: 'Budh Grah vaani, buddhi aur vyapar ka karak hai. Pakshiyon ko dana khilane se mansik spashtata aur naye business avsar milte hain.',
    fulfilmentDetails: 'Prakritik pakshi aashray sthalon par anaj-dana aur paani rakha jata hai.'
  },
  {
    id: 'cheenti-aata',
    title: 'Cheenti Aata-Kasar Aahar Seva',
    planet: 'Rahu-Ketu',
    planetTag: '🪱 Rahu-Ketu Shanti',
    tagColor: 'bg-amber-100 text-amber-900 border-amber-300',
    priceDisplay: '₹149',
    basePrice: 149,
    unit: 'Kasar Pack',
    minQty: 1,
    benefit: 'Peepal aur Vatvriksh ke neeche meethe kasar ki vyavastha. Rahu-Ketu ke achanak aane wale sankaton se suraksha.',
    cropKey: 'sevaCheenti',
    detailedDescription: 'Bhune hue gehun ke aate, bura shakkar aur til se bana paushtik kasar aahar. Pavitra vrikshon ke neeche cheentiyon ke bilon ke paas arpit kiya jata hai.',
    vedicSignificance: 'Sookshma jeevon ko bhojan karane se sanchit karm dosh katte hain, agyat bhay khatam hota hai aur Rahu-Ketu mahadasha mein sthirta aati hai.',
    fulfilmentDetails: 'Pavitra Peepal vriksh ke neeche aata-kasar aahar arpit kiya jata hai.'
  },
  {
    id: 'street-dogs',
    title: 'Shwan (Street Dogs) Aahar Seva',
    planet: 'Ketu Grah',
    planetTag: '🐕 Ketu Grah Shanti',
    tagColor: 'bg-amber-100 text-amber-900 border-amber-300',
    priceDisplay: '₹199',
    basePrice: 199,
    unit: 'Aahar Thali',
    minQty: 1,
    benefit: 'Sadak ke besahara shwan ke liye taaza paka bhojan. Ketu dosh shanti aur adrishya sankaton se parivar ki raksha.',
    cropKey: 'sevaDogs',
    detailedDescription: 'Chawal, haldi, roti aur doodh se bana shuddh aur swasthya-vardhak bhojan besahara street dogs ko pyar aur samman se khilaya jata hai.',
    vedicSignificance: 'Shwan Bhagwan Bhairav ke sevak maane jate hain. Unhe bhojan karane se ghar-parivar par aane wali badhayein talti hain aur Ketu shubh fal deta hai.',
    fulfilmentDetails: 'Taaza paka bhojan taiyar karke besahara shwan ko tript bhojan karaya jata hai.'
  }
];

export const SEVA_ITEMS: SevaItem[] = SEVA_ITEMS_HI;

export function getLocalizedSevaItems(lang: AppLanguage): SevaItem[] {
  return lang === 'en' ? SEVA_ITEMS_EN : SEVA_ITEMS_HI;
}

export interface Astrologer {
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
}

export const ASTROLOGERS_HI: Astrologer[] = [
  {
    id: 'nipunjj',
    name: 'निपुंज (Nipunjj)',
    title: 'अंक ज्योतिष, वैदिक, टैरो एवं हस्तरेखा विशेषज्ञ',
    experience: '7+ वर्ष का अनुभव',
    rating: 4.9,
    reviewsCount: '5239+ रीडिंग पूर्ण',
    ratePerMin: 20,
    cropKey: 'astroRohan',
    languages: ['हिन्दी', 'English'],
    bio: 'अंक ज्योतिष (Numerology), वैदिक ज्योतिष, टैरो कार्ड रीडिंग एवं हस्तरेखा (Palmistry) में 7+ वर्षों के अनुभव के साथ 5239+ सटीक रीडिंग पूर्ण। करियर, प्रेम, विवाह एवं जीवन निर्णय हेतु स्पष्ट मार्गदर्शन।',
    specializations: ['अंक ज्योतिष', 'वैदिक ज्योतिष', 'टैरो रीडिंग', 'हस्तरेखा विज्ञान']
  },
  {
    id: 'dravina',
    name: 'द्रविना (Dravina)',
    title: 'वरिष्ठ वैदिक ज्योतिष एवं टैरो विशेषज्ञ',
    experience: '10+ वर्ष का अनुभव',
    rating: 4.9,
    reviewsCount: '7648+ रीडिंग पूर्ण',
    ratePerMin: 20,
    cropKey: 'astroSophia',
    languages: ['हिन्दी', 'English'],
    bio: '10+ वर्षों के गहन वैदिक एवं टैरो परामर्श अनुभव के साथ 7648+ सफल रीडिंग पूर्ण। जन्म कुंडली विश्लेषण, संबंध सामंजस्य, दशा फल और सरल आध्यात्मिक उपायों की विशेषज्ञ।',
    specializations: ['वैदिक ज्योतिष', 'टैरो रीडिंग']
  }
];

export const ASTROLOGERS_EN: Astrologer[] = [
  {
    id: 'nipunjj',
    name: 'Nipunjj',
    title: 'Numerology, Vedic, Tarot & Palmistry Expert',
    experience: '7+ Saal ka Anubhav',
    rating: 4.9,
    reviewsCount: '5239+ Readings Poorn',
    ratePerMin: 20,
    cropKey: 'astroRohan',
    languages: ['Hindi', 'English'],
    bio: 'Numerology, Vedic Jyotish, Tarot reading aur Palmistry mein 7+ saal ke anubhav ke sath 5239+ sateek readings poorn. Career, love, marriage aur jeevan ke faislon ke liye spasht margdarshan.',
    specializations: ['Numerology', 'Vedic', 'Tarot', 'Palmistry']
  },
  {
    id: 'dravina',
    name: 'Dravina',
    title: 'Varishth Vedic Jyotish & Tarot Expert',
    experience: '10+ Saal ka Anubhav',
    rating: 4.9,
    reviewsCount: '7648+ Readings Poorn',
    ratePerMin: 20,
    cropKey: 'astroSophia',
    languages: ['Hindi', 'English'],
    bio: '10+ saal ke gehan Vedic aur Tarot paramarsh anubhav ke sath 7648+ safal readings poorn. Janam Kundali vishleshan, rishton mein samanjasya aur saral upayon ki visheshagya.',
    specializations: ['Vedic', 'Tarot']
  }
];

export const ASTROLOGERS: Astrologer[] = ASTROLOGERS_HI;

export function getLocalizedAstrologers(lang: AppLanguage): Astrologer[] {
  return lang === 'en' ? ASTROLOGERS_EN : ASTROLOGERS_HI;
}

export interface JyotishCategory {
  id: string;
  title: string;
  subtitle: string;
  iconName: 'Heart' | 'Users' | 'Briefcase' | 'Compass' | 'Sparkles';
  description: string;
  topics: string[];
  recommendedAstrologerId?: string;
  badge: string;
}

export const JYOTISH_CATEGORIES_HI: JyotishCategory[] = [
  {
    id: 'love-relationship',
    title: 'प्रेम एवं संबंध मार्गदर्शन',
    subtitle: 'Love & Relationship Guidance',
    iconName: 'Heart',
    description: 'प्रेम संबंधों में सामंजस्य, आपसी समझ, गलतफहमियों का समाधान और भावनात्मक संतुलन के लिए वैदिक परामर्श।',
    topics: ['प्रेम में रुकावटें व समाधान', 'रिश्तों में आपसी समझ', 'पार्टनर का स्वभाव व तालमेल', 'भावनात्मक स्थिरता'],
    badge: 'लोकप्रिय परामर्श'
  },
  {
    id: 'marriage',
    title: 'विवाह संबंधी ज्योतिष परामर्श',
    subtitle: 'Marriage Astrology Consultation',
    iconName: 'Users',
    description: 'कुंडली मिलान, मांगलिक विचार, विवाह में देरी के कारण और दांपत्य जीवन में सुख-शांति के सटीक उपाय।',
    topics: ['विवाह में विलंब के कारण', 'सटीक कुंडली व गुण मिलान', 'मांगलिक दोष विश्लेषण', 'सुखी दांपत्य जीवन के उपाय'],
    badge: 'अति आवश्यक'
  },
  {
    id: 'career-business',
    title: 'करियर एवं व्यवसाय मार्गदर्शन',
    subtitle: 'Career & Business Guidance',
    iconName: 'Briefcase',
    description: 'नौकरी में पदोन्नति, सही कार्यक्षेत्र का चयन, व्यापार में लाभ-हानि का विश्लेषण और नए निवेश के शुभ योग।',
    topics: ['नौकरी vs नया व्यवसाय', 'पदोन्नति व स्थायित्व', 'शुभ निवेश का समय', 'व्यापारिक बाधाओं का वैदिक हल'],
    badge: 'व्यावसायिक सफलता'
  },
  {
    id: 'kundali-analysis',
    title: 'जन्म कुंडली विश्लेषण',
    subtitle: 'Birth Chart Analysis',
    iconName: 'Compass',
    description: 'लग्न, राशि, 12 भावों और वर्तमान दशा-अंतर्दशा का समग्र व सटीक वैदिक विश्लेषण। भविष्य की दिशा का स्पष्ट बोध।',
    topics: ['सम्पूर्ण लग्न व राशि फल', 'वर्तमान महादशा व अंतर्दशा', '12 भावों का सूक्ष्म अध्ययन', 'अनुकूल रत्न व शुभ समय'],
    badge: 'सम्पूर्ण विश्लेषण'
  },
  {
    id: 'planetary-nakshatra',
    title: 'ग्रह एवं नक्षत्र विश्लेषण',
    subtitle: 'Planetary & Nakshatra Guidance',
    iconName: 'Sparkles',
    description: 'सूर्य, चंद्र, मंगल, राहु-केतु, शनि साढ़ेसाती और जन्म नक्षत्र के प्रभाव का विश्लेषण एवं वैदिक निवारण।',
    topics: ['शनि साढ़ेसाती व ढैय्या प्रभाव', 'कालसर्प व पितृ दोष विश्लेषण', 'जन्म नक्षत्र व पाद प्रभाव', 'सरल ग्रह शांति व्यवस्था'],
    badge: 'दोष शांति'
  }
];

export const JYOTISH_CATEGORIES_EN: JyotishCategory[] = [
  {
    id: 'love-relationship',
    title: 'Prem aur Sambandh Margdarshan',
    subtitle: 'Love & Relationship Salah',
    iconName: 'Heart',
    description: 'Prem sambandhon mein samanjasya, aapsi samajh, galatfahmiyon ka samadhan aur bhavnatmak santulan ke liye Vedic paramarsh.',
    topics: ['Prem mein rukawaton ka samadhan', 'Rishton mein aapsi samajh', 'Partner ka swabhav aur taalmel', 'Bhavnatmak sthirta'],
    badge: 'Lokpriya Paramarsh'
  },
  {
    id: 'marriage',
    title: 'Vivah Sambandhi Jyotish Paramarsh',
    subtitle: 'Shaadi aur Kundali Milan',
    iconName: 'Users',
    description: 'Kundali milan, Manglik vichar, vivah mein deri ke karan aur dampatya jeevan mein sukh-shanti ke sateek upay.',
    topics: ['Vivah mein deri ke karan', 'Sateek Kundali & Gun Milan', 'Manglik Dosh vishleshan', 'Sukhi dampatya ke upay'],
    badge: 'Ati Aavashyak'
  },
  {
    id: 'career-business',
    title: 'Career aur Business Margdarshan',
    subtitle: 'Naukri & Vyapar Salah',
    iconName: 'Briefcase',
    description: 'Naukri mein promotion, sahi karyakshetra ka chayan, vyapar mein labh-hani ka vishleshan aur naye nivesh ke shubh yog.',
    topics: ['Job vs Naya Business chayan', 'Promotion aur sthayitva', 'Shubh nivesh ka samay', 'Vyaparik badhaon ka Vedic hal'],
    badge: 'Career Safalta'
  },
  {
    id: 'kundali-analysis',
    title: 'Janam Kundali Vishleshan',
    subtitle: 'Poorna Birth Chart Study',
    iconName: 'Compass',
    description: 'Lagna, Rashi, 12 bhavon aur vartaman Mahadasha-Antardasha ka samagra aur sateek Vedic vishleshan.',
    topics: ['Sampurna Lagna aur Rashi fal', 'Vartaman Mahadasha & Antardasha', '12 Bhavon ka gehan adhyayan', 'Anukool ratna aur shubh samay'],
    badge: 'Poorna Vishleshan'
  },
  {
    id: 'planetary-nakshatra',
    title: 'Grah aur Nakshatra Vishleshan',
    subtitle: 'Dosh Shanti Margdarshan',
    iconName: 'Sparkles',
    description: 'Surya, Chandra, Mangal, Rahu-Ketu, Shani Sade Sati aur janam Nakshatra ke prabhav ka vishleshan aur Vedic nivaran.',
    topics: ['Shani Sade Sati aur Dhaiya prabhav', 'Kaal Sarp aur Pitra Dosh vishleshan', 'Janam Nakshatra aur Pada prabhav', 'Saral Grah Shanti upay'],
    badge: 'Grah Shanti'
  }
];

export const JYOTISH_CATEGORIES: JyotishCategory[] = JYOTISH_CATEGORIES_HI;

export function getLocalizedJyotishCategories(lang: AppLanguage): JyotishCategory[] {
  return lang === 'en' ? JYOTISH_CATEGORIES_EN : JYOTISH_CATEGORIES_HI;
}

export interface RemedyCategory {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  rulingPlanets: string;
  description: string;
  recommendedSevaId: string;
  mantra: string;
  dosha: string;
}

export const REMEDY_CATEGORIES_HI: RemedyCategory[] = [
  {
    id: 'career',
    title: 'करियर व यश वृद्धि',
    subtitle: 'Career Growth & Respect',
    iconName: 'Briefcase',
    rulingPlanets: 'सूर्य व शनि ग्रह',
    description: 'कार्यक्षेत्र में रुकावटें, विलंबित पदोन्नति और नेतृत्व क्षमता में वृद्धि हेतु गौ-आहार सेवा।',
    recommendedSevaId: 'gau-chara',
    mantra: 'ॐ घृणि सूर्याय नमः',
    dosha: 'सूर्य दोष / कार्य बाधा'
  },
  {
    id: 'love',
    title: 'दांपत्य व प्रेम सौहार्द',
    subtitle: 'Love & Marriage Harmony',
    iconName: 'Heart',
    rulingPlanets: 'शुक्र व मंगल ग्रह',
    description: 'विवाह में बाधा, मांगलिक प्रभाव और रिश्तों में कटुता दूर करने के लिए गुड़-चना आहार सेवा।',
    recommendedSevaId: 'gau-gud-chana',
    mantra: 'ॐ शुं शुक्राय नमः',
    dosha: 'मंगल दोष / शुक्र पीड़ा'
  },
  {
    id: 'health',
    title: 'मानसिक शांति व स्वास्थ्य',
    subtitle: 'Mental Peace & Wellness',
    iconName: 'Leaf',
    rulingPlanets: 'चंद्रमा व महामृत्युंजय',
    description: 'चिंता, मानसिक अशांति, अनिद्रा और स्वास्थ्य लाभ हेतु गौमाता को ताजी रोटियों की व्यवस्था।',
    recommendedSevaId: 'gau-roti',
    mantra: 'ॐ सों सोमाय नमः',
    dosha: 'चंद्र दोष / मानसिक तनाव'
  },
  {
    id: 'finance',
    title: 'व्यापार व आर्थिक समृद्धि',
    subtitle: 'Business & Financial Stability',
    iconName: 'Coins',
    rulingPlanets: 'बृहस्पति व बुध ग्रह',
    description: 'व्यापारिक वृद्धि, कर्जों से मुक्ति और माँ लक्ष्मी की कृपा हेतु नियमित गौ-आहार सेवा।',
    recommendedSevaId: 'gau-chara',
    mantra: 'ॐ बृं बृहस्पतये नमः',
    dosha: 'गुरु चांडाल / आर्थिक अवरोध'
  },
  {
    id: 'negativity',
    title: 'नकारात्मक ऊर्जा निवारण',
    subtitle: 'Protection from Negative Energy',
    iconName: 'Shield',
    rulingPlanets: 'राहु व केतु (छाया ग्रह)',
    description: 'अज्ञात भय, नजर दोष और अप्रत्याशित बाधाओं से सुरक्षा हेतु श्वान एवं चींटी आहार सेवा।',
    recommendedSevaId: 'street-dogs',
    mantra: 'ॐ कें केतवे नमः',
    dosha: 'कालसर्प दोष / राहु महादशा'
  },
  {
    id: 'family',
    title: 'पारिवारिक सुख व शांति',
    subtitle: 'Family Peace & Harmony',
    iconName: 'Home',
    rulingPlanets: 'चंद्र व बृहस्पति ग्रह',
    description: 'गृह-क्लेश समाप्ति, पितृ शांति और परिवार में परस्पर प्रेम व सौहार्द हेतु चींटी आहार सेवा।',
    recommendedSevaId: 'cheenti-aata',
    mantra: 'ॐ नमो भगवते वासुदेवाय',
    dosha: 'गृह क्लेश / पितृ दोष'
  }
];

export const REMEDY_CATEGORIES_EN: RemedyCategory[] = [
  {
    id: 'career',
    title: 'Career aur Yash Vriddhi',
    subtitle: 'Safalta & Samman',
    iconName: 'Briefcase',
    rulingPlanets: 'Surya aur Shani Grah',
    description: 'Kaamkaaj mein rukawatein, promotion mein deri aur netritva kshamta badhane ke liye Gau-Aahar seva.',
    recommendedSevaId: 'gau-chara',
    mantra: 'Om Ghrini Suryaya Namah',
    dosha: 'Surya Dosh / Karya Badha'
  },
  {
    id: 'love',
    title: 'Dampatya aur Prem Sauhardra',
    subtitle: 'Vivah & Rishton mein Shanti',
    iconName: 'Heart',
    rulingPlanets: 'Shukra aur Mangal Grah',
    description: 'Shaadi mein badha, Manglik prabhav aur rishton ki kadwahat door karne ke liye Gud-Chana aahar seva.',
    recommendedSevaId: 'gau-gud-chana',
    mantra: 'Om Shum Shukraya Namah',
    dosha: 'Mangal Dosh / Shukra Peeda'
  },
  {
    id: 'health',
    title: 'Mansik Shanti aur Swasthya',
    subtitle: 'Tanav Mukti & Sehat',
    iconName: 'Leaf',
    rulingPlanets: 'Chandra aur Mahamrityunjaya',
    description: 'Chinta, mansik ashanti, anindra aur swasthya labh ke liye Gaumata ko taazi rotiyon ki seva.',
    recommendedSevaId: 'gau-roti',
    mantra: 'Om Som Somaya Namah',
    dosha: 'Chandra Dosh / Mansik Tanav'
  },
  {
    id: 'finance',
    title: 'Vyapar aur Aarthik Samriddhi',
    subtitle: 'Business Growth & Barkat',
    iconName: 'Coins',
    rulingPlanets: 'Brihaspati aur Budh Grah',
    description: 'Vyapar mein vriddhi, karz se mukti aur Maa Lakshmi ki kripa ke liye niyamit Gau-Aahar seva.',
    recommendedSevaId: 'gau-chara',
    mantra: 'Om Brim Brihaspataye Namah',
    dosha: 'Guru Chandal / Aarthik Rukawat'
  },
  {
    id: 'negativity',
    title: 'Nakaratmak Urja Nivaran',
    subtitle: 'Nazar Dosh & Bhay se Suraksha',
    iconName: 'Shield',
    rulingPlanets: 'Rahu aur Ketu (Chhaya Grah)',
    description: 'Agyat bhay, nazar dosh aur achanak aane wali rukawaton se suraksha ke liye Shwan aur Cheenti aahar seva.',
    recommendedSevaId: 'street-dogs',
    mantra: 'Om Kem Ketave Namah',
    dosha: 'Kaal Sarp Dosh / Rahu Mahadasha'
  },
  {
    id: 'family',
    title: 'Parivarik Sukh aur Shanti',
    subtitle: 'Ghar mein Prem & Samanjasya',
    iconName: 'Home',
    rulingPlanets: 'Chandra aur Brihaspati Grah',
    description: 'Grih-kalesh samapti, Pitra shanti aur parivar mein aapsi prem-sauhardra ke liye Cheenti aahar seva.',
    recommendedSevaId: 'cheenti-aata',
    mantra: 'Om Namo Bhagavate Vasudevaya',
    dosha: 'Grih Kalesh / Pitra Dosh'
  }
];

export const REMEDY_CATEGORIES: RemedyCategory[] = REMEDY_CATEGORIES_HI;

export function getLocalizedRemedyCategories(lang: AppLanguage): RemedyCategory[] {
  return lang === 'en' ? REMEDY_CATEGORIES_EN : REMEDY_CATEGORIES_HI;
}

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

export const RECENT_PROOFS_HI: SevaProof[] = [
  {
    id: 'PRF-8941',
    devoteeName: 'राजेश एवं सुनीता शर्मा',
    location: 'जयपुर, राजस्थान',
    sevaTitle: 'गौमाता के लिए चारा व्यवस्था (25 किलो)',
    date: 'आज, प्रातः 07:15',
    time: 'ब्रह्ममुहूर्त सेवा',
    goshalaName: 'गौकृपा प्रमाणित गौशाला',
    certificateId: 'GK-SANKALP-9021'
  },
  {
    id: 'PRF-8942',
    devoteeName: 'अनन्या देशमुख',
    location: 'पुणे, महाराष्ट्र',
    sevaTitle: 'गौमाता के लिए रोटी व्यवस्था (20 रोटियां)',
    date: 'आज, प्रातः 08:30',
    time: 'प्रातः गौ आरती',
    goshalaName: 'गौ प्रेम धाम, मथुरा',
    certificateId: 'GK-SANKALP-9022'
  },
  {
    id: 'PRF-8943',
    devoteeName: 'विक्रमादित्य सिंघानिया',
    location: 'नई दिल्ली',
    sevaTitle: 'गौमाता का गुड़-चना आहार (5 थाली)',
    date: 'कल, सायं 06:45',
    time: 'संध्या बेला',
    goshalaName: 'गौकृपा प्रमाणित गौशाला',
    certificateId: 'GK-SANKALP-9023'
  },
  {
    id: 'PRF-8944',
    devoteeName: 'मीनाक्षी अय्यर',
    location: 'बेंगलुरु, कर्नाटक',
    sevaTitle: 'पक्षी दाना एवं चींटी आहार सेवा',
    date: 'कल, प्रातः 07:00',
    time: 'सूर्योदय प्रथम आहार',
    goshalaName: 'आनन्द तीर्थ वन, हरिद्वार',
    certificateId: 'GK-SANKALP-9024'
  }
];

export const RECENT_PROOFS_EN: SevaProof[] = [
  {
    id: 'PRF-8941',
    devoteeName: 'Rajesh aur Sunita Sharma',
    location: 'Jaipur, Rajasthan',
    sevaTitle: 'Gaumata Hara Chara Seva (25 kg)',
    date: 'Aaj, Subah 07:15 AM',
    time: 'Brahmamuhurta Seva',
    goshalaName: 'GauKripa Pramanit Goshala',
    certificateId: 'GK-SANKALP-9021'
  },
  {
    id: 'PRF-8942',
    devoteeName: 'Ananya Deshmukh',
    location: 'Pune, Maharashtra',
    sevaTitle: 'Gaumata Taazi Roti Seva (20 Roti)',
    date: 'Aaj, Subah 08:30 AM',
    time: 'Subah Gau Aarati',
    goshalaName: 'Gau Prem Dham, Mathura',
    certificateId: 'GK-SANKALP-9022'
  },
  {
    id: 'PRF-8943',
    devoteeName: 'Vikramaditya Singhania',
    location: 'New Delhi',
    sevaTitle: 'Gaumata Gud-Chana Aahar (5 Thali)',
    date: 'Kal, Shaam 06:45 PM',
    time: 'Sandhya Bela',
    goshalaName: 'GauKripa Pramanit Goshala',
    certificateId: 'GK-SANKALP-9023'
  },
  {
    id: 'PRF-8944',
    devoteeName: 'Meenakshi Iyer',
    location: 'Bengaluru, Karnataka',
    sevaTitle: 'Pakshi Dana aur Cheenti Aahar Seva',
    date: 'Kal, Subah 07:00 AM',
    time: 'Suryoday Pratham Aahar',
    goshalaName: 'Anand Tirtha Van, Haridwar',
    certificateId: 'GK-SANKALP-9024'
  }
];

export const RECENT_PROOFS: SevaProof[] = RECENT_PROOFS_HI;

export function getLocalizedRecentProofs(lang: AppLanguage): SevaProof[] {
  return lang === 'en' ? RECENT_PROOFS_EN : RECENT_PROOFS_HI;
}
