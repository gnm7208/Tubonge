import { useEffect, useState } from "react";
import type { Therapist, Slot } from "@/data/mock";
import type { View } from "@/App";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CrisisNotice } from "@/components/CrisisNotice";
import { Star, ShieldCheck, Languages, Clock, ArrowLeft, GraduationCap, Quote, Sparkles } from "lucide-react";

const REVIEWS = [
  { name: "Wanjiku M.", text: "I felt heard from the first session. Practical tools I actually use.", stars: 5 },
  { name: "Daniel K.", text: "Warm and professional. Booking and M-Pesa payment was seamless.", stars: 5 },
  { name: "Aisha O.", text: "Helped me through a really hard season. Highly recommend.", stars: 5 },
];

export function TherapistProfile({
  therapist: t,
  onBook,
  back,
  go,
}: {
  therapist: Therapist;
  onBook: (slot: Slot) => void;
  back: () => void;
  go: (v: View) => void;
}) {
  const { profile } = useAuth();
  const [introEligible, setIntroEligible] = useState(true);
  const [introBusy, setIntroBusy] = useState(false);
  const [introError, setIntroError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile || profile.role !== "client") return;
    supabase
      .from("bookings")
      .select("id")
      .eq("client_id", profile.id)
      .eq("therapist_id", t.id)
      .eq("is_intro", true)
      .maybeSingle()
      .then(({ data }) => setIntroEligible(!data));
  }, [profile, t.id]);

  const bookIntro = async () => {
    if (!profile) {
      go("login");
      return;
    }
    const slot = t.nextSlots[0];
    if (!slot) return;
    setIntroBusy(true);
    setIntroError(null);
    const { data, error } = await supabase.functions.invoke("book-intro-call", { body: { slotId: slot.id } });
    setIntroBusy(false);
    if (error || data?.error) {
      setIntroError(data?.error ?? error?.message ?? "Could not book the intro call.");
      return;
    }
    go("dashboard");
  };

  const showIntro = (!profile || profile.role === "client") && introEligible;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <Button variant="ghost" onClick={back} className="mb-4 font-heading text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to therapists
      </Button>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Main */}
        <div>
          <div className="flex items-start gap-4">
            <span className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl font-heading text-2xl font-semibold text-white" style={{ background: t.accent }}>
              {t.initials}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-3xl font-semibold tracking-tight">{t.name}</h1>
                {t.verified && (
                  <Badge className="border-none bg-[#788c5d]/15 font-heading text-[#4f6138] hover:bg-[#788c5d]/15">
                    <ShieldCheck className="mr-1 h-3 w-3" /> Verified
                  </Badge>
                )}
              </div>
              <p className="mt-0.5 text-muted-foreground">{t.title}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-[#d97757] text-[#d97757]" />
                  {t.reviews > 0 ? (
                    <><span className="font-heading font-medium">{t.rating.toFixed(1)}</span> ({t.reviews} reviews)</>
                  ) : (
                    <span className="font-heading font-medium">New on Tubonge</span>
                  )}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground"><GraduationCap className="h-4 w-4" /> {t.years} years experience</span>
                <span className="flex items-center gap-1 text-muted-foreground"><Languages className="h-4 w-4" /> {t.languages.join(", ")}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-1.5">
            {t.specialties.map((s) => (
              <Badge key={s} variant="secondary" className="border-none bg-[#e8e6dc] font-heading font-normal text-[#141413] hover:bg-[#e8e6dc]">{s}</Badge>
            ))}
          </div>

          <Separator className="my-6" />
          <h2 className="font-heading text-xl font-semibold">About</h2>
          <p className="mt-2 leading-relaxed text-foreground/90">{t.bio}</p>

          <Separator className="my-6" />
          <h2 className="font-heading text-xl font-semibold">What clients say</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {REVIEWS.map((r, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4">
                <Quote className="h-4 w-4 text-[#d97757]" />
                <p className="mt-2 text-sm leading-relaxed">{r.text}</p>
                <div className="mt-3 flex items-center gap-1">
                  {Array.from({ length: r.stars }).map((_, j) => <Star key={j} className="h-3 w-3 fill-[#d97757] text-[#d97757]" />)}
                </div>
                <p className="mt-1 font-heading text-xs text-muted-foreground">{r.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Booking sidebar */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-baseline justify-between">
              <p className="font-heading text-2xl font-semibold">KES {t.rate.toLocaleString()}</p>
              <span className="text-sm text-muted-foreground">/ 50 min</span>
            </div>
            <p className="mt-4 flex items-center gap-1.5 font-heading text-sm font-medium"><Clock className="h-4 w-4 text-[#d97757]" /> Next availability</p>
            {t.nextSlots.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No open slots right now — check back soon.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {t.nextSlots.map((s) => (
                  <button key={s.id} onClick={() => onBook(s)} className="flex w-full items-center justify-between rounded-xl border border-border bg-[#faf9f5] px-4 py-3 text-left font-heading text-sm transition-colors hover:border-[#d97757] hover:bg-[#d97757]/5">
                    <span>{s.label}</span>
                    <span className="text-[#d97757]">Select →</span>
                  </button>
                ))}
              </div>
            )}
            <Button onClick={() => onBook(t.nextSlots[0])} disabled={t.nextSlots.length === 0} className="mt-4 w-full bg-[#d97757] font-heading text-white hover:bg-[#c9663f]">
              Book a session
            </Button>
            {showIntro && (
              <Button
                onClick={bookIntro}
                disabled={t.nextSlots.length === 0 || introBusy}
                variant="outline"
                className="mt-2 w-full font-heading"
              >
                <Sparkles className="mr-1.5 h-4 w-4 text-[#d97757]" /> {introBusy ? "Booking…" : "Free 15-min intro call"}
              </Button>
            )}
            {introError && <p className="mt-2 text-sm text-destructive">{introError}</p>}
            <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-[#788c5d]" /> Secure M-Pesa payment · free cancellation 12h before
            </p>
          </div>
        </aside>
      </div>

      <CrisisNotice className="mt-6" />
    </div>
  );
}
