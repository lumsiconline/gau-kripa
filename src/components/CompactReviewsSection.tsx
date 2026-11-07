import React, { useRef } from 'react';
import { Star, CheckCircle, Sparkles } from 'lucide-react';

interface Review {
  id: string;
  name: string;
  city: string;
  seva: string;
  oneLiner: string;
  stars: number;
}

const INDIA_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    name: 'Rohit Sharma',
    city: 'Delhi NCR',
    seva: 'Gau Chara Seva',
    oneLiner: 'Bhai WhatsApp pe direct 2 ghante me Gaumata ke chara khilane ka video proof mil gaya, bahut shanti mili!',
    stars: 5,
  },
  {
    id: 'rev-2',
    name: 'Ananya Verma',
    city: 'Mumbai',
    seva: 'Gau Roti Seva',
    oneLiner: 'Gau Roti seva book ki thi, puja ki video dekh ke sach me pura mann prasann ho gaya.',
    stars: 5,
  },
  {
    id: 'rev-3',
    name: 'Vikram Singhania',
    city: 'Varanasi',
    seva: 'Gud-Chana Seva',
    oneLiner: 'Vrindavan goshala me Pandit ji ne hamare gotra ke sath sankalp padha, 100% genuine trust hai.',
    stars: 5,
  },
  {
    id: 'rev-4',
    name: 'Priya Deshmukh',
    city: 'Pune',
    seva: 'Surya Grah Seva',
    oneLiner: 'Job interview se pehle chara seva ki thi, positive results mile aur mann me bohot confidence aaya.',
    stars: 5,
  },
  {
    id: 'rev-5',
    name: 'Rajesh Patel',
    city: 'Ahmedabad',
    seva: 'Cheenti Aata Seva',
    oneLiner: 'Cheenti aata seva ka clear HD video phone pe aaya, itni transparent seva pehli baar dekhi.',
    stars: 5,
  },
  {
    id: 'rev-6',
    name: 'Saurabh Mishra',
    city: 'Lucknow',
    seva: 'Gud-Chana Seva',
    oneLiner: 'Papa ke 60th birthday par Gaumata ko bhojan karwaya, family ke sabhi log video dekh kar khush ho gaye.',
    stars: 5,
  },
  {
    id: 'rev-7',
    name: 'Kavita Nair',
    city: 'Bengaluru',
    seva: 'Gau Roti Seva',
    oneLiner: 'Bangalore me busy schedule me bhi gaumata ki daily seva aaram se ho gayi, best platform hai.',
    stars: 5,
  },
  {
    id: 'rev-8',
    name: 'Deepak Joshi',
    city: 'Jaipur',
    seva: 'Mangal Dosh Upay',
    oneLiner: 'Pandit ji ne Kundali dekh ke sahi seva guide ki, ghar me kalesh bilkul shant ho gaya.',
    stars: 5,
  },
  {
    id: 'rev-9',
    name: 'Manoj Tiwari',
    city: 'Patna',
    seva: 'Gau Chara Seva',
    oneLiner: 'Gotra aur name board ke sath live sankalp video bheja, bilkul saccha aur dharmik anubhav raha.',
    stars: 5,
  },
  {
    id: 'rev-10',
    name: 'Shreya Aggarwal',
    city: 'Chandigarh',
    seva: 'Pakshi Dana Seva',
    oneLiner: 'Har Ekadashi pe pakshi dana aur gaumata ko roti book karti hoon, photo time par share hoti hai.',
    stars: 5,
  },
  {
    id: 'rev-11',
    name: 'Amitabh Sengupta',
    city: 'Kolkata',
    seva: 'Gau Chara Seva',
    oneLiner: 'Ghar baithe Vrindavan aur Mathura goshalas me seva ho jana kalyankari hai, Jai Gaumata!',
    stars: 5,
  },
  {
    id: 'rev-12',
    name: 'Pooja Kulkarni',
    city: 'Indore',
    seva: 'Chandra Grah Seva',
    oneLiner: 'Gau Roti sankalp ke baad mental stress kafi kam hua, pure heart se recommended hai.',
    stars: 5,
  },
];

interface CompactReviewsSectionProps {
  onOpenProofGallery?: () => void;
}

export const CompactReviewsSection: React.FC<CompactReviewsSectionProps> = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="bg-[#f7f0df] border-b border-[#ebdcb9] py-5 sm:py-6 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#1b4b32] text-amber-200 text-[11px] font-bold shadow-2xs">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>4.9/5 Rating</span>
            </span>
            <h3 className="font-playfair text-base sm:text-lg font-bold text-[#1b4b32]">
              Devotee Reviews across India
            </h3>
            <span className="text-xs text-[#6e5f4a] font-medium hidden md:inline">
              (सच्चे भक्तों के 1-Liner अनुभव)
            </span>
          </div>


        </div>

        {/* Compact One-Liner Reviews Horizontal Track */}
        <div
          ref={scrollRef}
          className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 scroll-smooth scrollbar-none snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {INDIA_REVIEWS.map((rev) => (
            <div
              key={rev.id}
              className="snap-start shrink-0 w-[300px] sm:w-[340px] bg-[#fffdf9] border border-[#ebdcb9] hover:border-[#1b4b32]/40 rounded-2xl p-3 shadow-2xs transition-all hover:shadow-xs flex flex-col justify-between"
            >
              {/* Reviewer Header */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-[#1b4b32] text-amber-200 text-[10px] font-bold flex items-center justify-center shrink-0">
                    {rev.name.charAt(0)}
                  </div>
                  <div className="min-w-0 truncate">
                    <span className="text-xs font-bold text-[#1b4b32] truncate block">
                      {rev.name}
                    </span>
                    <span className="text-[10px] text-[#786a55] block truncate">
                      📍 {rev.city} • <span className="text-[#8b5a0a] font-medium">{rev.seva}</span>
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
                    <span>Verified</span>
                  </span>
                </div>
              </div>

              {/* Strictly One-Liner Hinglish Review Text */}
              <p
                className="text-xs text-[#3d3326] italic font-medium leading-snug line-clamp-2 sm:line-clamp-1 border-t border-[#f2e7cd] pt-1.5"
                title={rev.oneLiner}
              >
                &ldquo;{rev.oneLiner}&rdquo;
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
