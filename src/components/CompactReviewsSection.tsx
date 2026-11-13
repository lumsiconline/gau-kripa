import React, { useRef } from 'react';
import { Star, CheckCircle, Sparkles } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface Review {
  id: string;
  nameHi: string;
  nameEn: string;
  cityHi: string;
  cityEn: string;
  sevaHi: string;
  sevaEn: string;
  oneLinerHi: string;
  oneLinerEn: string;
  stars: number;
}

const INDIA_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    nameHi: 'रोहित शर्मा',
    nameEn: 'Rohit Sharma',
    cityHi: 'दिल्ली एनसीआर',
    cityEn: 'Delhi NCR',
    sevaHi: 'गौ चारा सेवा (5 किलो)',
    sevaEn: 'Gau Chara Seva (5 kg)',
    oneLinerHi: 'व्हाट्सएप पर 2 घंटे में गौमाता को चारा खिलाने की स्पष्ट वीडियो पुष्टि मिल गई, मन को बहुत शांति मिली।',
    oneLinerEn: 'Received clear WhatsApp video confirmation within 2 hours showing fresh fodder fed to Gaumata. Very peaceful experience!',
    stars: 5,
  },
  {
    id: 'rev-2',
    nameHi: 'अनन्या वर्मा',
    nameEn: 'Ananya Verma',
    cityHi: 'मुंबई',
    cityEn: 'Mumbai',
    sevaHi: 'गौ रोटी व्यवस्था (4 रोटियाँ)',
    sevaEn: 'Gau Roti Service (4 Rotis)',
    oneLinerHi: 'गौमाता के लिए रोटी व्यवस्था बुक की थी, गोत्र संकल्प के साथ वीडियो देखकर पूरा परिवार प्रसन्न हो गया।',
    oneLinerEn: 'Booked the fresh Roti arrangement service; watching the video with our Gotra Sankalp made our entire family very happy.',
    stars: 5,
  },
  {
    id: 'rev-3',
    nameHi: 'विक्रम सिंघानिया',
    nameEn: 'Vikram Singhania',
    cityHi: 'वाराणसी',
    cityEn: 'Varanasi',
    sevaHi: 'गुड़-चना आहार व्यवस्था',
    sevaEn: 'Gud-Chana Feed Service',
    oneLinerHi: 'वृंदावन गौशाला में हमारे नाम व गोत्र के साथ गुड़-चना आहार खिलाया गया, 100% पारदर्शी और विश्वसनीय सेवा है।',
    oneLinerEn: 'In Vrindavan goshala, Gud-Chana feed was served with our name and Gotra placard. 100% transparent and genuine service.',
    stars: 5,
  },
  {
    id: 'rev-4',
    nameHi: 'प्रिया देशमुख',
    nameEn: 'Priya Deshmukh',
    cityHi: 'पुणे',
    cityEn: 'Pune',
    sevaHi: 'करियर ज्योतिष मार्गदर्शन',
    sevaEn: 'Career Astrology Guidance',
    oneLinerHi: 'करियर बदलाव से पहले चारा व्यवस्था व आचार्य जी से कुंडली परामर्श लिया, अत्यंत सकारात्मक मार्गदर्शन मिला।',
    oneLinerEn: 'Booked fodder arrangement and consulted Acharya ji before switching jobs; received very positive and clear guidance.',
    stars: 5,
  },
  {
    id: 'rev-5',
    nameHi: 'राजेश पटेल',
    nameEn: 'Rajesh Patel',
    cityHi: 'अहमदाबाद',
    cityEn: 'Ahmedabad',
    sevaHi: 'चींटी आटा आहार सेवा',
    sevaEn: 'Cheenti Aata Feed Service',
    oneLinerHi: 'आहार वितरण की साफ एचडी वीडियो फोन पर आई, इतनी पारदर्शी व्यवस्था पहली बार देखी।',
    oneLinerEn: 'Received clear HD video confirmation on phone; this level of feed distribution transparency is remarkable.',
    stars: 5,
  },
  {
    id: 'rev-6',
    nameHi: 'सौरभ मिश्रा',
    nameEn: 'Saurabh Mishra',
    cityHi: 'लखनऊ',
    cityEn: 'Lucknow',
    sevaHi: 'गुड़-चना आहार सेवा',
    sevaEn: 'Gud-Chana Feed Service',
    oneLinerHi: 'पिताजी के जन्मदिन पर गौमाता को आहार सेवा करवाई, परिवार के सभी सदस्य वीडियो देखकर बहुत खुश हुए।',
    oneLinerEn: 'Arranged Gaumata feed service on my father’s birthday; everyone in our family was deeply moved watching the video.',
    stars: 5,
  },
  {
    id: 'rev-7',
    nameHi: 'कविता नायर',
    nameEn: 'Kavita Nair',
    cityHi: 'बेंगलुरु',
    cityEn: 'Bengaluru',
    sevaHi: 'गौ रोटी व्यवस्था',
    sevaEn: 'Gau Roti Service',
    oneLinerHi: 'व्यस्त दिनचर्या में भी घर बैठे गौमाता की नियमित आहार व्यवस्था आसानी से हो जाती है।',
    oneLinerEn: 'Even with a busy schedule in Bengaluru, arranging daily roti feeding for cows is seamless here.',
    stars: 5,
  },
  {
    id: 'rev-8',
    nameHi: 'दीपक जोशी',
    nameEn: 'Deepak Joshi',
    cityHi: 'जयपुर',
    cityEn: 'Jaipur',
    sevaHi: 'जन्म कुंडली एवं मंगल परामर्श',
    sevaEn: 'Kundali & Mangal Guidance',
    oneLinerHi: 'आचार्य जी ने जन्म कुंडली देखकर सरल ग्रह-शांति उपाय बताए, घर में सुख-शांति का अनुभव हुआ।',
    oneLinerEn: 'Acharya ji analyzed our birth chart and suggested simple Vedic remedies; we experienced immense peace at home.',
    stars: 5,
  },
];

interface CompactReviewsSectionProps {
  onOpenProofGallery?: () => void;
}

export const CompactReviewsSection: React.FC<CompactReviewsSectionProps> = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { lang, tr } = useLanguage();

  return (
    <section className="bg-[#f7f0df] border-b border-[#ebdcb9] py-5 sm:py-6 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1b4b32] text-amber-200 text-[11px] font-bold shadow-2xs">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>{tr('4.9/5 रेटिंग', '4.9/5 Rating')}</span>
            </span>
            <h3 className="font-playfair text-base sm:text-lg font-bold text-[#1b4b32]">
              {tr('देशभर से ग्राहकों एवं यजमानों के अनुभव', 'Customer & Devotee Experiences Across India')}
            </h3>
            <span className="text-xs text-[#6e5f4a] font-medium hidden md:inline">
              {tr('(आहार सेवा एवं ज्योतिष परामर्श समीक्षाएं)', '(Verified Feed Seva & Astrology Reviews)')}
            </span>
          </div>
        </div>

        {/* Compact Reviews Horizontal Track */}
        <div
          ref={scrollRef}
          className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scroll-smooth scrollbar-none snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {INDIA_REVIEWS.map((rev) => {
            const name = lang === 'en' ? rev.nameEn : rev.nameHi;
            const city = lang === 'en' ? rev.cityEn : rev.cityHi;
            const seva = lang === 'en' ? rev.sevaEn : rev.sevaHi;
            const oneLiner = lang === 'en' ? rev.oneLinerEn : rev.oneLinerHi;
            return (
              <div
                key={rev.id}
                className="snap-start shrink-0 w-[300px] sm:w-[340px] bg-[#fffdf9] border border-[#ebdcb9] hover:border-[#1b4b32]/40 rounded-2xl p-3 shadow-2xs transition-all hover:shadow-xs flex flex-col justify-between"
              >
                {/* Reviewer Header */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#1b4b32] text-amber-200 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {name.charAt(0)}
                    </div>
                    <div className="min-w-0 truncate">
                      <span className="text-xs font-bold text-[#1b4b32] truncate block">
                        {name}
                      </span>
                      <span className="text-[10px] text-[#786a55] block truncate">
                        📍 {city} • <span className="text-[#8b5a0a] font-medium">{seva}</span>
                      </span>
                    </div>
                  </div>

                  {/* Stars & Verified */}
                  <div className="flex flex-col items-end shrink-0">
                    <div className="flex items-center gap-0.5">
                      {[...Array(rev.stars)].map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-[9px] text-emerald-800 font-semibold flex items-center gap-0.5 mt-0.5">
                      <CheckCircle className="w-2.5 h-2.5 text-emerald-700" />
                      <span>{tr('सत्यापित', 'Verified')}</span>
                    </span>
                  </div>
                </div>

                {/* Review Text */}
                <p
                  className="text-xs text-[#3d3326] italic font-medium leading-snug line-clamp-2 sm:line-clamp-2 border-t border-[#f2e7cd] pt-1.5"
                  title={oneLiner}
                >
                  &ldquo;{oneLiner}&rdquo;
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
