import { isToday, isTomorrow, format } from "date-fns";
import { supabase } from "@/lib/supabase";
import type { Therapist } from "@/data/mock";

const ACCENTS = ["#d97757", "#6a9bcc", "#788c5d"];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function accentFor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return ACCENTS[hash % ACCENTS.length];
}

export function slotLabel(startsAt: string) {
  const d = new Date(startsAt);
  if (isToday(d)) return `Today ${format(d, "h:mm a")}`;
  if (isTomorrow(d)) return `Tomorrow ${format(d, "h:mm a")}`;
  return format(d, "EEE h:mm a");
}

type TherapistQueryRow = {
  id: string;
  bio: string | null;
  specialties: string[];
  languages: string[];
  years_experience: number;
  session_rate_kes: number;
  title: string;
  profiles: { full_name: string } | null;
  availability_slots: { starts_at: string; status: string }[];
  reviews: { rating: number }[];
};

function mapRow(row: TherapistQueryRow): Therapist {
  const name = row.profiles?.full_name ?? "Therapist";
  const reviewCount = row.reviews.length;
  const rating = reviewCount ? row.reviews.reduce((s, r) => s + r.rating, 0) / reviewCount : 0;
  const now = new Date();
  const nextSlots = row.availability_slots
    .filter((s) => s.status === "open" && new Date(s.starts_at) > now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
    .slice(0, 3)
    .map((s) => slotLabel(s.starts_at));

  return {
    id: row.id,
    name,
    title: row.title || "Therapist",
    specialties: row.specialties,
    languages: row.languages,
    years: row.years_experience,
    rate: row.session_rate_kes,
    rating,
    reviews: reviewCount,
    verified: true,
    bio: row.bio ?? "",
    initials: initialsOf(name),
    accent: accentFor(row.id),
    nextSlots,
  };
}

export async function fetchApprovedTherapists(limit?: number): Promise<Therapist[]> {
  let query = supabase
    .from("therapists")
    .select(
      "id, bio, specialties, languages, years_experience, session_rate_kes, title, profiles(full_name), availability_slots(starts_at, status), reviews(rating)"
    )
    .eq("verification_status", "approved")
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return ((data as unknown as TherapistQueryRow[]) ?? []).map(mapRow);
}
