export type Slot = { id: string; label: string };

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
  nextSlots: Slot[];
};

export const ALL_SPECIALTIES = ["Anxiety","Depression","Trauma","Relationships","Stress","Grief","Addiction","Family","Career","PTSD"];
export const ALL_LANGUAGES = ["English","Kiswahili","Dholuo","Somali","Gikuyu","Kalenjin"];
