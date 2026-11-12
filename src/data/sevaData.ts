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
  fulfilmentDetails: string;
}

export const SEVA_ITEMS: SevaItem[] = [
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
    detailedDescription: 'प्रमाणित गौशाला में गौमाता के लिए 5 किलोग्राम ताजा, पौष्टिक हरा चारा व सुखा चारा आहार व्यवस्था। सेवा उपरांत आपके नाम व गोत्र से आहार वितरण की वीडियो पुष्टि व्हाट्सएप पर भेजी जाती है।',
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
    name: 'डॉ. सोफिया शर्मा',
    title: 'वरिष्ठ वैदिक ज्योतिषाचार्य एवं रत्न विशेषज्ञ',
    experience: '15+ वर्ष का अनुभव',
    rating: 4.9,
    reviewsCount: '12k+ परामर्श',
    ratePerMin: 20,
    cropKey: 'astroSophia',
    languages: ['हिन्दी', 'English', 'संस्कृत'],
    bio: 'वैदिक ज्योतिष, जन्म कुंडली गहन विश्लेषण, विवाह योग तथा ग्रह-नक्षत्र शांति के प्रमाणित विशेषज्ञ। सरल एवं सटीक मार्गदर्शन।',
    specializations: ['जन्म कुंडली विश्लेषण', 'विवाह संबंधी ज्योतिष परामर्श', 'प्रेम एवं संबंध मार्गदर्शन', 'रत्न एवं वैदिक उपाय']
  },
  {
    id: 'acharya-rohan',
    name: 'आचार्य रोहन मेहता',
    title: 'काशी प्रशिक्षित वैदिक शास्त्री एवं जीवन मार्गदर्शक',
    experience: '14+ वर्ष का अनुभव',
    rating: 4.8,
    reviewsCount: '10k+ परामर्श',
    ratePerMin: 20,
    cropKey: 'astroRohan',
    languages: ['हिन्दी', 'गुजराती', 'English'],
    bio: 'काशी विश्वनाथ गुरुकुल से प्रशिक्षित, करियर व व्यापार के शुभ समय, मांगलिक दोष, कालसर्प शांति एवं गृह-क्लेश निवारण विशेषज्ञ।',
    specializations: ['करियर एवं व्यवसाय मार्गदर्शन', 'ग्रह एवं नक्षत्र विश्लेषण', 'दशा-अंतर्दशा फल', 'मांगलिक शांति']
  },
  {
    id: 'maria-kapoor',
    name: 'मारिया कपूर',
    title: 'रिलेशनशिप एवं आध्यात्मिक परामर्शदात्री',
    experience: '12+ वर्ष का अनुभव',
    rating: 4.8,
    reviewsCount: '8k+ परामर्श',
    ratePerMin: 20,
    cropKey: 'astroMaria',
    languages: ['हिन्दी', 'English', 'पंजाबी'],
    bio: 'प्रेम, दांपत्य जीवन, संबंध सामंजस्य एवं भावनात्मक शांति हेतु समर्पित परामर्शदात्री। 8000+ से अधिक परिवारों का सफल मार्गदर्शन।',
    specializations: ['प्रेम एवं संबंध मार्गदर्शन', 'विवाह संबंधी ज्योतिष परामर्श', 'पारिवारिक सुख-शांति', 'अंक ज्योतिष']
  }
];

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

export const JYOTISH_CATEGORIES: JyotishCategory[] = [
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

export const REMEDY_CATEGORIES: RemedyCategory[] = [
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
    dosha: 'गुरु चांडाल / दरिद्रता निवारण'
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
    devoteeName: 'राजेश एवं सुनीता शर्मा',
    location: 'जयपुर, राजस्थान',
    sevaTitle: 'गौमाता के लिए चारा व्यवस्था (25 किलो)',
    date: 'आज, प्रातः 07:15',
    time: 'ब्रह्ममुहूर्त सेवा',
    goshalaName: 'सुरभि गौ सेवा धाम, वृन्दावन',
    certificateId: 'GK-SANKALP-9021'
  },
  {
    id: 'PRF-8942',
    devoteeName: 'अनन्या देशमुख',
    location: 'पुणे, महाराष्ट्र',
    sevaTitle: 'गौमाता के लिए रोटी व्यवस्था (21 रोटियां)',
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
    goshalaName: 'सुरभि गौ सेवा धाम, वृन्दावन',
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
