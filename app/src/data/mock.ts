export type Therapist = {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  languages: string[];
  years: number;
  rate: number; // KES per session
  rating: number;
  reviews: number;
  verified: boolean;
  bio: string;
  initials: string;
  accent: string; // brand accent hex
  nextSlots: string[];
};

export const THERAPISTS: Therapist[] = [
  {
    id: "t1",
    name: "Dr. Amina Wanjiru",
    title: "Clinical Psychologist",
    specialties: ["Anxiety", "Depression", "Trauma"],
    languages: ["English", "Kiswahili"],
    years: 11,
    rate: 2500,
    rating: 4.9,
    reviews: 128,
    verified: true,
    bio: "I help clients navigate anxiety, burnout and life transitions using CBT and mindfulness-based approaches. Sessions are warm, practical and judgement-free.",
    initials: "AW",
    accent: "#d97757",
    nextSlots: ["Today 4:00 PM", "Tomorrow 10:00 AM", "Tomorrow 2:00 PM"],
  },
  {
    id: "t2",
    name: "Brian Otieno",
    title: "Counselling Psychologist",
    specialties: ["Relationships", "Stress", "Grief"],
    languages: ["English", "Kiswahili", "Dholuo"],
    years: 7,
    rate: 1800,
    rating: 4.8,
    reviews: 74,
    verified: true,
    bio: "Relationship and grief counselling with a person-centred approach. I create a safe space to talk through what feels heavy, at your pace.",
    initials: "BO",
    accent: "#6a9bcc",
    nextSlots: ["Today 6:00 PM", "Fri 9:00 AM", "Sat 11:00 AM"],
  },
  {
    id: "t3",
    name: "Dr. Fatuma Ali",
    title: "Psychotherapist",
    specialties: ["Trauma", "PTSD", "Family"],
    languages: ["English", "Kiswahili", "Somali"],
    years: 14,
    rate: 3000,
    rating: 5.0,
    reviews: 96,
    verified: true,
    bio: "Trauma-informed therapy for individuals and families. EMDR certified. I believe healing happens in relationship and at a pace that feels safe.",
    initials: "FA",
    accent: "#788c5d",
    nextSlots: ["Tomorrow 12:00 PM", "Thu 3:00 PM", "Thu 5:00 PM"],
  },
  {
    id: "t4",
    name: "Kevin Mwangi",
    title: "Counsellor",
    specialties: ["Addiction", "Anxiety", "Youth"],
    languages: ["English", "Kiswahili"],
    years: 5,
    rate: 1500,
    rating: 4.7,
    reviews: 41,
    verified: true,
    bio: "I work with young adults on addiction recovery, anxiety and self-esteem. Direct, supportive and focused on building practical coping skills.",
    initials: "KM",
    accent: "#d97757",
    nextSlots: ["Today 7:00 PM", "Fri 4:00 PM", "Sat 2:00 PM"],
  },
  {
    id: "t5",
    name: "Dr. Grace Njeri",
    title: "Clinical Psychologist",
    specialties: ["Depression", "Women's health", "Postpartum"],
    languages: ["English", "Kiswahili", "Gikuyu"],
    years: 9,
    rate: 2200,
    rating: 4.9,
    reviews: 87,
    verified: true,
    bio: "Specialising in maternal mental health and depression. A compassionate, evidence-based space for women navigating change.",
    initials: "GN",
    accent: "#6a9bcc",
    nextSlots: ["Tomorrow 9:00 AM", "Wed 1:00 PM", "Wed 4:00 PM"],
  },
  {
    id: "t6",
    name: "Samuel Kiptoo",
    title: "Counselling Psychologist",
    specialties: ["Stress", "Career", "Men's health"],
    languages: ["English", "Kiswahili", "Kalenjin"],
    years: 8,
    rate: 2000,
    rating: 4.8,
    reviews: 63,
    verified: true,
    bio: "Helping men and professionals manage stress, burnout and career pressure. Confidential, straightforward and goal-oriented.",
    initials: "SK",
    accent: "#788c5d",
    nextSlots: ["Today 5:00 PM", "Fri 11:00 AM", "Sat 10:00 AM"],
  },
];

export const ALL_SPECIALTIES = ["Anxiety","Depression","Trauma","Relationships","Stress","Grief","Addiction","Family","Career","PTSD"];
export const ALL_LANGUAGES = ["English","Kiswahili","Dholuo","Somali","Gikuyu","Kalenjin"];

export type Booking = {
  therapist: Therapist;
  slot: string;
};
