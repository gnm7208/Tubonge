// Hand-written to match supabase/migrations/*.sql. Regenerate with
// `supabase gen types typescript` once the project is linked, if preferred.

export type UserRole = "client" | "therapist" | "admin";
export type VerificationStatus = "pending" | "approved" | "rejected";
export type SlotStatus = "open" | "held" | "booked";
export type BookingStatus = "pending_payment" | "confirmed" | "completed" | "cancelled" | "refunded";
export type PaymentMethod = "mpesa" | "card" | "bank";
export type PaymentStatus = "pending" | "success" | "failed";
export type PayoutStatus = "requested" | "paid";

export type Profile = {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type TherapistRow = {
  id: string;
  profile_id: string;
  license_number: string;
  license_body: string;
  verification_status: VerificationStatus;
  title: string;
  bio: string | null;
  specialties: string[];
  languages: string[];
  years_experience: number;
  session_rate_kes: number;
  credentials_url: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AvailabilitySlot = {
  id: string;
  therapist_id: string;
  starts_at: string;
  ends_at: string;
  status: SlotStatus;
  created_at: string;
  updated_at: string;
};

export type BookingRow = {
  id: string;
  client_id: string;
  therapist_id: string;
  slot_id: string;
  status: BookingStatus;
  amount_kes: number;
  created_at: string;
  updated_at: string;
};

export type PaymentRow = {
  id: string;
  booking_id: string;
  provider: "pesapal";
  method: PaymentMethod;
  provider_ref: string | null;
  receipt: string | null;
  amount_kes: number;
  status: PaymentStatus;
  raw_callback: unknown;
  created_at: string;
  updated_at: string;
};

export type SessionRow = {
  id: string;
  booking_id: string;
  video_room_url: string | null;
  started_at: string | null;
  ended_at: string | null;
  notes_therapist: string | null;
  created_at: string;
  updated_at: string;
};

export type MessageRow = {
  id: string;
  booking_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export type ReviewRow = {
  id: string;
  booking_id: string;
  client_id: string;
  therapist_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type PayoutRow = {
  id: string;
  therapist_id: string;
  amount_kes: number;
  status: PayoutStatus;
  requested_at: string;
  paid_at: string | null;
};

// Note: these Row types are used for local casting/typing (e.g. `data as TherapistRow`),
// not fed into `createClient<Database>()` — see src/lib/supabase.ts for why.
