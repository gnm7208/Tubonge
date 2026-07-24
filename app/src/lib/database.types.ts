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

type TableDef<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<
        Profile,
        Pick<Profile, "id" | "full_name"> & Partial<Pick<Profile, "role" | "phone" | "email" | "avatar_url">>
      >;
      therapists: TableDef<
        TherapistRow,
        Pick<TherapistRow, "profile_id" | "license_number" | "session_rate_kes"> &
          Partial<Omit<TherapistRow, "id" | "profile_id" | "license_number" | "session_rate_kes" | "created_at" | "updated_at">>
      >;
      availability_slots: TableDef<
        AvailabilitySlot,
        Pick<AvailabilitySlot, "therapist_id" | "starts_at" | "ends_at"> & Partial<Pick<AvailabilitySlot, "status">>
      >;
      bookings: TableDef<
        BookingRow,
        Pick<BookingRow, "client_id" | "therapist_id" | "slot_id" | "amount_kes"> & Partial<Pick<BookingRow, "status">>
      >;
      payments: TableDef<
        PaymentRow,
        Pick<PaymentRow, "booking_id" | "method" | "amount_kes"> &
          Partial<Pick<PaymentRow, "provider" | "provider_ref" | "receipt" | "status" | "raw_callback">>
      >;
      sessions: TableDef<SessionRow, Pick<SessionRow, "booking_id"> & Partial<Omit<SessionRow, "id" | "booking_id" | "created_at" | "updated_at">>>;
      messages: TableDef<MessageRow, Pick<MessageRow, "booking_id" | "sender_id" | "body">>;
      reviews: TableDef<
        ReviewRow,
        Pick<ReviewRow, "booking_id" | "client_id" | "therapist_id" | "rating"> & Partial<Pick<ReviewRow, "comment">>
      >;
      payouts: TableDef<PayoutRow, Pick<PayoutRow, "therapist_id" | "amount_kes"> & Partial<Pick<PayoutRow, "status">>>;
    };
  };
};
