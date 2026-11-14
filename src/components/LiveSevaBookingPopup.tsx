import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface SevaPopupEntry {
  id: number;
  nameHi: string;
  nameEn: string;
  cityHi: string;
  cityEn: string;
  stateHi: string;
  stateEn: string;
  sevaHi: string;
  sevaEn: string;
  timeAgoHi: string;
  timeAgoEn: string;
}

const LIVE_SEVA_ENTRIES: SevaPopupEntry[] = [
  {
    id: 1,
    nameHi: 'आदित्य शर्मा',
    nameEn: 'Aditya Sharma',
    cityHi: 'जयपुर',
    cityEn: 'Jaipur',
    stateHi: 'राजस्थान',
    stateEn: 'Rajasthan',
    sevaHi: 'गौमाता के लिए चारा व्यवस्था (5 किलो)',
    sevaEn: 'Gaumata Green Fodder (5 kg)',
    timeAgoHi: 'अभी-अभी',
    timeAgoEn: 'Just now',
  },
  {
    id: 2,
    nameHi: 'प्रिया वर्मा',
    nameEn: 'Priya Verma',
    cityHi: 'लखनऊ',
    cityEn: 'Lucknow',
    stateHi: 'उत्तर प्रदेश',
    stateEn: 'Uttar Pradesh',
    sevaHi: 'गौमाता के लिए रोटी व्यवस्था (4 रोटियाँ)',
    sevaEn: 'Gaumata Fresh Roti (4 Rotis)',
    timeAgoHi: '1 मिनट पहले',
    timeAgoEn: '1 min ago',
  },
  {
    id: 3,
    nameHi: 'रोहन देशमुख',
    nameEn: 'Rohan Deshmukh',
    cityHi: 'पुणे',
    cityEn: 'Pune',
    stateHi: 'महाराष्ट्र',
    stateEn: 'Maharashtra',
    sevaHi: 'गौमाता का गुड़-चना आहार',
    sevaEn: 'Gaumata Gud-Chana Feed',
    timeAgoHi: '2 मिनट पहले',
    timeAgoEn: '2 mins ago',
  },
  {
    id: 4,
    nameHi: 'नेहा पटेल',
    nameEn: 'Neha Patel',
    cityHi: 'अहमदाबाद',
    cityEn: 'Ahmedabad',
    stateHi: 'गुजरात',
    stateEn: 'Gujarat',
    sevaHi: 'गौमाता के लिए चारा व्यवस्था (5 किलो)',
    sevaEn: 'Gaumata Green Fodder (5 kg)',
    timeAgoHi: '3 मिनट पहले',
    timeAgoEn: '3 mins ago',
  },
  {
    id: 5,
    nameHi: 'विवेक झा',
    nameEn: 'Vivek Jha',
    cityHi: 'पटना',
    cityEn: 'Patna',
    stateHi: 'बिहार',
    stateEn: 'Bihar',
    sevaHi: 'गौमाता का गुड़-चना आहार',
    sevaEn: 'Gaumata Gud-Chana Feed',
    timeAgoHi: '4 मिनट पहले',
    timeAgoEn: '4 mins ago',
  },
  {
    id: 6,
    nameHi: 'अनुराग तिवारी',
    nameEn: 'Anurag Tiwari',
    cityHi: 'भोपाल',
    cityEn: 'Bhopal',
    stateHi: 'मध्य प्रदेश',
    stateEn: 'Madhya Pradesh',
    sevaHi: 'गौमाता के लिए रोटी व्यवस्था (4 रोटियाँ)',
    sevaEn: 'Gaumata Fresh Roti (4 Rotis)',
    timeAgoHi: 'अभी-अभी',
    timeAgoEn: 'Just now',
  },
  {
    id: 7,
    nameHi: 'गुरप्रीत कौर',
    nameEn: 'Gurpreet Kaur',
    cityHi: 'लुधियाना',
    cityEn: 'Ludhiana',
    stateHi: 'पंजाब',
    stateEn: 'Punjab',
    sevaHi: 'गौमाता के लिए चारा व्यवस्था (5 किलो)',
    sevaEn: 'Gaumata Green Fodder (5 kg)',
    timeAgoHi: '2 मिनट पहले',
    timeAgoEn: '2 mins ago',
  },
  {
    id: 8,
    nameHi: 'कार्तिक राव',
    nameEn: 'Karthik Rao',
    cityHi: 'बेंगलुरु',
    cityEn: 'Bengaluru',
    stateHi: 'कर्नाटक',
    stateEn: 'Karnataka',
    sevaHi: 'गौमाता का गुड़-चना आहार',
    sevaEn: 'Gaumata Gud-Chana Feed',
    timeAgoHi: '5 मिनट पहले',
    timeAgoEn: '5 mins ago',
  },
  {
    id: 9,
    nameHi: 'स्नेहा रेड्डी',
    nameEn: 'Sneha Reddy',
    cityHi: 'हैदराबाद',
    cityEn: 'Hyderabad',
    stateHi: 'तेलंगाना',
    stateEn: 'Telangana',
    sevaHi: 'गौमाता के लिए रोटी व्यवस्था (4 रोटियाँ)',
    sevaEn: 'Gaumata Fresh Roti (4 Rotis)',
    timeAgoHi: '1 मिनट पहले',
    timeAgoEn: '1 min ago',
  },
  {
    id: 10,
    nameHi: 'अरिजीत बनर्जी',
    nameEn: 'Arijit Banerjee',
    cityHi: 'कोलकाता',
    cityEn: 'Kolkata',
    stateHi: 'पश्चिम बंगाल',
    stateEn: 'West Bengal',
    sevaHi: 'गौमाता के लिए चारा व्यवस्था (5 किलो)',
    sevaEn: 'Gaumata Green Fodder (5 kg)',
    timeAgoHi: '3 मिनट पहले',
    timeAgoEn: '3 mins ago',
  },
  {
    id: 11,
    nameHi: 'मीरा जोशी',
    nameEn: 'Meera Joshi',
    cityHi: 'देहरादून',
    cityEn: 'Dehradun',
    stateHi: 'उत्तराखंड',
    stateEn: 'Uttarakhand',
    sevaHi: 'गौमाता का गुड़-चना आहार',
    sevaEn: 'Gaumata Gud-Chana Feed',
    timeAgoHi: '4 मिनट पहले',
    timeAgoEn: '4 mins ago',
  },
  {
    id: 12,
    nameHi: 'सौरभ सिन्हा',
    nameEn: 'Saurabh Sinha',
    cityHi: 'रांची',
    cityEn: 'Ranchi',
    stateHi: 'झारखंड',
    stateEn: 'Jharkhand',
    sevaHi: 'गौमाता के लिए चारा व्यवस्था (5 किलो)',
    sevaEn: 'Gaumata Green Fodder (5 kg)',
    timeAgoHi: '6 मिनट पहले',
    timeAgoEn: '6 mins ago',
  },
  {
    id: 13,
    nameHi: 'मनीषा कलिता',
    nameEn: 'Manisha Kalita',
    cityHi: 'गुवाहाटी',
    cityEn: 'Guwahati',
    stateHi: 'असम',
    stateEn: 'Assam',
    sevaHi: 'गौमाता के लिए रोटी व्यवस्था (4 रोटियाँ)',
    sevaEn: 'Gaumata Fresh Roti (4 Rotis)',
    timeAgoHi: '2 मिनट पहले',
    timeAgoEn: '2 mins ago',
  },
  {
    id: 14,
    nameHi: 'निखिल नायर',
    nameEn: 'Nikhil Nair',
    cityHi: 'कोच्चि',
    cityEn: 'Kochi',
    stateHi: 'केरल',
    stateEn: 'Kerala',
    sevaHi: 'गौमाता का गुड़-चना आहार',
    sevaEn: 'Gaumata Gud-Chana Feed',
    timeAgoHi: 'अभी-अभी',
    timeAgoEn: 'Just now',
  },
  {
    id: 15,
    nameHi: 'अंकिता मलिक',
    nameEn: 'Ankita Malik',
    cityHi: 'गुरुग्राम',
    cityEn: 'Gurugram',
    stateHi: 'हरियाणा',
    stateEn: 'Haryana',
    sevaHi: 'गौमाता के लिए चारा व्यवस्था (5 किलो)',
    sevaEn: 'Gaumata Green Fodder (5 kg)',
    timeAgoHi: '3 मिनट पहले',
    timeAgoEn: '3 mins ago',
  },
  {
    id: 16,
    nameHi: 'सुब्रत मोहंती',
    nameEn: 'Subrat Mohanty',
    cityHi: 'भुवनेश्वर',
    cityEn: 'Bhubaneswar',
    stateHi: 'ओडिशा',
    stateEn: 'Odisha',
    sevaHi: 'गौमाता के लिए रोटी व्यवस्था (4 रोटियाँ)',
    sevaEn: 'Gaumata Fresh Roti (4 Rotis)',
    timeAgoHi: '5 मिनट पहले',
    timeAgoEn: '5 mins ago',
  },
  {
    id: 17,
    nameHi: 'काव्या सुब्रमण्यम',
    nameEn: 'Kavya Subramanian',
    cityHi: 'चेन्नई',
    cityEn: 'Chennai',
    stateHi: 'तमिलनाडु',
    stateEn: 'Tamil Nadu',
    sevaHi: 'गौमाता का गुड़-चना आहार',
    sevaEn: 'Gaumata Gud-Chana Feed',
    timeAgoHi: '1 मिनट पहले',
    timeAgoEn: '1 min ago',
  },
  {
    id: 18,
    nameHi: 'रोहित ठाकुर',
    nameEn: 'Rohit Thakur',
    cityHi: 'शिमला',
    cityEn: 'Shimla',
    stateHi: 'हिमाचल प्रदेश',
    stateEn: 'Himachal Pradesh',
    sevaHi: 'गौमाता के लिए चारा व्यवस्था (5 किलो)',
    sevaEn: 'Gaumata Green Fodder (5 kg)',
    timeAgoHi: '4 मिनट पहले',
    timeAgoEn: '4 mins ago',
  },
  {
    id: 19,
    nameHi: 'पूजा अग्रवाल',
    nameEn: 'Pooja Agarwal',
    cityHi: 'रायपुर',
    cityEn: 'Raipur',
    stateHi: 'छत्तीसगढ़',
    stateEn: 'Chhattisgarh',
    sevaHi: 'गौमाता के लिए रोटी व्यवस्था (4 रोटियाँ)',
    sevaEn: 'Gaumata Fresh Roti (4 Rotis)',
    timeAgoHi: '2 मिनट पहले',
    timeAgoEn: '2 mins ago',
  },
  {
    id: 20,
    nameHi: 'मनीष गुप्ता',
    nameEn: 'Manish Gupta',
    cityHi: 'नई दिल्ली',
    cityEn: 'New Delhi',
    stateHi: 'दिल्ली',
    stateEn: 'Delhi',
    sevaHi: 'गौमाता के लिए चारा व्यवस्था (5 किलो)',
    sevaEn: 'Gaumata Green Fodder (5 kg)',
    timeAgoHi: 'अभी-अभी',
    timeAgoEn: 'Just now',
  },
];

function shuffleEntries(items: SevaPopupEntry[]): SevaPopupEntry[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export const LiveSevaBookingPopup: React.FC = () => {
  const { lang, tr } = useLanguage();
  const [dismissed, setDismissed] = useState(false);
  const [shuffledQueue, setShuffledQueue] = useState<SevaPopupEntry[]>(() =>
    shuffleEntries(LIVE_SEVA_ENTRIES)
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (dismissed) return;

    let fadeTimeout: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setIsVisible(false);
      fadeTimeout = setTimeout(() => {
        setCurrentIndex((prev) => {
          const next = prev + 1;
          if (next >= shuffledQueue.length) {
            setShuffledQueue(shuffleEntries(LIVE_SEVA_ENTRIES));
            return 0;
          }
          return next;
        });
        setIsVisible(true);
      }, 220);
    }, 4000);

    return () => {
      clearInterval(interval);
      if (fadeTimeout) clearTimeout(fadeTimeout);
    };
  }, [dismissed, shuffledQueue.length]);

  if (dismissed) return null;

  const entry = shuffledQueue[currentIndex] || LIVE_SEVA_ENTRIES[0];
  const name = lang === 'en' ? entry.nameEn : entry.nameHi;
  const city = lang === 'en' ? entry.cityEn : entry.cityHi;
  const sevaName = lang === 'en' ? entry.sevaEn : entry.sevaHi;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-2.5 left-2.5 sm:bottom-3.5 sm:left-3.5 z-40 w-auto min-w-[168px] max-w-[210px] sm:max-w-[230px] bg-[#fffdf7]/95 backdrop-blur-md border border-[#d9ba78] rounded-xl shadow-lg px-2.5 py-2 pr-6 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div className="min-w-0 space-y-0.5">
        <p className="text-[11px] font-bold text-[#153e29] leading-tight truncate">
          {name}
        </p>
        <p className="text-[10px] font-semibold text-[#6e5c44] leading-tight truncate">
          {city}
        </p>
        <p className="text-[10px] font-bold text-[#1b4b32] leading-tight truncate pt-0.5">
          {sevaName}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={tr('बंद करें', 'Close')}
        className="absolute top-1.5 right-1.5 p-0.5 rounded-full text-[#7b6b54] hover:text-[#153e29] hover:bg-[#f4ebd4] transition-colors cursor-pointer"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};
