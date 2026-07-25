import { useEffect, useState } from "react";
import type { View } from "@/App";
import type { Therapist } from "@/data/mock";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { initialsOf, accentFor } from "@/lib/therapists";
import { canJoinSession } from "@/lib/sessionTiming";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Video, Calendar, MessageSquare, ShieldCheck, CheckCircle2, Clock, Star } from "lucide-react";

type BookingRow = {
  id: string;
  therapist_id: string;
  status: string;
  therapists: { id: string; title: string; profiles: { full_name: string } | null } | null;
  availability_slots: { starts_at: string; ends_at: string } | null;
  reviews: { id: string; rating: number; comment: string | null }[];
};

function toTherapist(t: NonNullable<BookingRow["therapists"]>): Therapist {
  const name = t.profiles?.full_name ?? "Therapist";
  return {
    id: t.id, name, title: t.title || "Therapist", specialties: [], languages: [], years: 0, rate: 0,
    rating: 0, reviews: 0, verified: true, bio: "", initials: initialsOf(name), accent: accentFor(t.id), nextSlots: [],
  };
}

function ReviewForm({ booking, clientId, onDone }: { booking: BookingRow; clientId: string; onDone: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    await supabase.from("reviews").insert({
      booking_id: booking.id, client_id: clientId, therapist_id: booking.therapist_id, rating, comment: comment || null,
    });
    setSaving(false);
    onDone();
  };

  return (
    <div className="mt-3 rounded-lg border border-border bg-[#faf9f5] p-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
            <Star className={`h-5 w-5 ${n <= rating ? "fill-[#d97757] text-[#d97757]" : "text-muted-foreground"}`} />
          </button>
        ))}
      </div>
      <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="How was your session? (optional)" className="mt-2 font-body" rows={2} />
      <Button size="sm" disabled={saving} onClick={submit} className="mt-2 bg-[#d97757] font-heading text-white hover:bg-[#c9663f]">
        {saving ? "Saving…" : "Submit review"}
      </Button>
    </div>
  );
}

export function ClientDashboard({ go, join }: { go: (v: View) => void; join: (t: Therapist, bookingId: string) => void }) {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const load = () => {
    if (!profile) return;
    supabase
      .from("bookings")
      .select("id, therapist_id, status, therapists(id, title, profiles(full_name)), availability_slots(starts_at, ends_at), reviews(id, rating, comment)")
      .eq("client_id", profile.id)
      .in("status", ["pending_payment", "confirmed", "completed"])
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setBookings((data as unknown as BookingRow[]) ?? []);
        setLoading(false);
      });
  };

  useEffect(load, [profile]);

  const now = Date.now();
  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && b.availability_slots && new Date(b.availability_slots.starts_at).getTime() > now
  );
  const past = bookings.filter(
    (b) => b.status === "completed" || (b.status === "confirmed" && b.availability_slots && new Date(b.availability_slots.starts_at).getTime() <= now)
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">My sessions</h1>
          <p className="mt-1 text-muted-foreground">Welcome back. Here's what's coming up.</p>
        </div>
        <Button variant="outline" onClick={() => go("browse")} className="font-heading">Book another</Button>
      </div>

      {/* Upcoming */}
      <h2 className="mt-8 font-heading text-lg font-semibold">Upcoming</h2>
      <div className="mt-3 space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-5 text-muted-foreground">Loading…</div>
        ) : upcoming.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-muted-foreground">No upcoming sessions yet. <button onClick={() => go("browse")} className="font-heading text-[#d97757] underline">Find a therapist</button>.</p>
          </div>
        ) : (
          upcoming.map((b) => {
            const t = b.therapists ? toTherapist(b.therapists) : null;
            return (
              <div key={b.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl font-heading text-lg font-semibold text-white" style={{ background: t?.accent }}>{t?.initials}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-heading font-semibold">{t?.name}</p>
                        <Badge className="border-none bg-[#788c5d]/15 font-heading text-xs text-[#4f6138] hover:bg-[#788c5d]/15"><CheckCircle2 className="mr-1 h-3 w-3" /> Paid</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{t?.title}</p>
                      <p className="mt-1 flex items-center gap-1.5 font-heading text-sm">
                        <Calendar className="h-4 w-4 text-[#d97757]" />
                        {b.availability_slots ? new Date(b.availability_slots.starts_at).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit", month: "short", day: "numeric" }) : "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="font-heading"><MessageSquare className="mr-1.5 h-4 w-4" /> Message</Button>
                    <Button
                      onClick={() => t && join(t, b.id)}
                      disabled={!t || !b.availability_slots || !canJoinSession(b.availability_slots.starts_at, b.availability_slots.ends_at)}
                      className="bg-[#6a9bcc] font-heading text-white hover:bg-[#5b89b8]"
                    >
                      <Video className="mr-1.5 h-4 w-4" /> Join session
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        {!loading && bookings.some((b) => b.status === "pending_payment") && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-[#faf9f5] p-4 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" /> You have a booking awaiting payment confirmation.
          </div>
        )}
      </div>

      {/* Past */}
      {past.length > 0 && (
        <>
          <h2 className="mt-8 font-heading text-lg font-semibold">Past sessions</h2>
          <div className="mt-3 space-y-3">
            {past.map((b) => {
              const t = b.therapists ? toTherapist(b.therapists) : null;
              const review = b.reviews[0];
              return (
                <div key={b.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full font-heading text-sm font-semibold text-white" style={{ background: t?.accent }}>{t?.initials}</span>
                      <div>
                        <p className="font-heading text-sm font-semibold">{t?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {b.availability_slots ? new Date(b.availability_slots.starts_at).toLocaleDateString() : ""}
                        </p>
                      </div>
                    </div>
                    {b.status === "completed" && !review && reviewingId !== b.id && (
                      <Button variant="ghost" size="sm" onClick={() => setReviewingId(b.id)} className="font-heading text-[#d97757]">
                        <Star className="mr-1 h-3.5 w-3.5" /> Rate
                      </Button>
                    )}
                    {review && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {Array.from({ length: review.rating }).map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-[#d97757] text-[#d97757]" />)}
                      </div>
                    )}
                  </div>
                  {reviewingId === b.id && profile && (
                    <ReviewForm booking={b} clientId={profile.id} onDone={() => { setReviewingId(null); load(); }} />
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-8 flex items-center gap-2 rounded-xl bg-[#e8e6dc]/60 p-4 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#788c5d]" />
        Your sessions and messages are private and encrypted. In a crisis, call the Kenya Red Cross line 1199 (toll-free).
      </div>
    </div>
  );
}
