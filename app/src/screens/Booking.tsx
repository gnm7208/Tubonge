import { useState } from "react";
import type { Therapist, Slot } from "@/data/mock";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { PersonAvatar } from "@/components/PersonAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CrisisNotice } from "@/components/CrisisNotice";
import { ArrowLeft, ShieldCheck, Smartphone, CreditCard, Landmark, Loader2, Clock } from "lucide-react";

type Method = "mpesa" | "card" | "bank";

const METHODS: { id: Method; label: string; icon: any; hint: string; color: string }[] = [
  { id: "mpesa", label: "M-Pesa", icon: Smartphone, hint: "Instant · STK push", color: "#2e8540" },
  { id: "card", label: "Debit card", icon: CreditCard, hint: "Visa / Mastercard", color: "#6a9bcc" },
  { id: "bank", label: "Bank transfer", icon: Landmark, hint: "Pay by reference", color: "#788c5d" },
];

export function BookingScreen({ therapist: t, slot, setSlot, back }: {
  therapist: Therapist; slot: Slot | null; setSlot: (s: Slot) => void; onPaid: () => void; back: () => void;
}) {
  const { profile } = useAuth();
  const [method, setMethod] = useState<Method>("mpesa");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <p className="text-muted-foreground">Log in to book a session.</p>
      </div>
    );
  }

  const displayRate = profile.is_youth ? Math.round(t.rate / 2) : t.rate;

  const pay = async () => {
    if (!slot) return;
    setSubmitting(true);
    setError(null);
    const { data, error } = await supabase.functions.invoke("create-payment", {
      body: { slotId: slot.id, method, phone: method === "mpesa" ? phone : undefined },
    });
    if (error || !data?.redirect_url) {
      setSubmitting(false);
      setError(data?.error ?? error?.message ?? "Something went wrong starting your payment. Please try again.");
      return;
    }
    window.location.href = data.redirect_url;
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <Button variant="ghost" onClick={back} className="mb-4 font-heading text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Confirm & pay</h1>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        {/* Left: form */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-heading text-lg font-semibold">Choose a time</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {t.nextSlots.map((s) => (
              <button key={s.id} onClick={() => setSlot(s)} className={`rounded-xl border px-3 py-3 text-center font-heading text-sm transition-colors ${slot?.id === s.id ? "border-[#d97757] bg-[#d97757]/10 text-[#141413]" : "border-border bg-[#faf9f5] hover:border-[#d97757]/50"}`}>
                {s.label}
              </button>
            ))}
            {t.nextSlots.length === 0 && <p className="text-sm text-muted-foreground">No open slots right now.</p>}
          </div>

          <Separator className="my-6" />
          <h2 className="font-heading text-lg font-semibold">Payment method</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {METHODS.map((m) => (
              <button key={m.id} onClick={() => setMethod(m.id)} className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${method === m.id ? "border-[#141413] bg-[#141413]/[0.03]" : "border-border hover:border-[#141413]/30"}`}>
                <span className="grid h-8 w-8 place-items-center rounded-lg text-white" style={{ background: m.color }}>
                  <m.icon className="h-4 w-4" />
                </span>
                <span className="font-heading text-sm font-semibold">{m.label}</span>
                <span className="text-xs text-muted-foreground">{m.hint}</span>
              </button>
            ))}
          </div>

          <div className="mt-5">
            {method === "mpesa" && (
              <div className="max-w-xs">
                <Label htmlFor="phone" className="font-heading text-sm">M-Pesa phone number</Label>
                <div className="relative mt-1.5">
                  <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2e8540]" />
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0712 345 678" className="pl-9 font-body" />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">You'll get a prompt on your phone to enter your PIN.</p>
              </div>
            )}
            {(method === "card" || method === "bank") && (
              <p className="max-w-md text-sm text-muted-foreground">
                You'll enter your {method === "card" ? "card details" : "bank transfer reference"} on Pesapal's secure
                checkout page next — Tubonge never sees or stores {method === "card" ? "your card number" : "your bank details"}.
              </p>
            )}
          </div>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          <Button onClick={pay} disabled={!slot || submitting} className="mt-6 w-full font-heading text-white sm:w-auto" style={{ background: METHODS.find((m) => m.id === method)!.color }}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? "Starting checkout…" : `Continue to pay · KES ${displayRate.toLocaleString()}`}
          </Button>
          {!slot && <p className="mt-2 text-xs text-muted-foreground">Select a time to continue.</p>}
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-[#788c5d]" /> Payments processed securely via Pesapal (M-Pesa, cards & bank).
          </p>
        </div>

        {/* Right: order summary */}
        <aside className="h-fit rounded-2xl border border-border bg-card p-5">
          <p className="font-heading text-sm font-semibold text-muted-foreground">Summary</p>
          <div className="mt-3 flex items-center gap-3">
            <PersonAvatar name={t.name} id={t.id} avatarUrl={t.avatarUrl} className="h-11 w-11 text-sm" />
            <div>
              <p className="font-heading text-sm font-semibold">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.title}</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Time</span><span className="font-heading">{slot?.label ?? "—"}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Duration</span><span className="font-heading">50 min</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Method</span><span className="font-heading capitalize">{method === "mpesa" ? "M-Pesa" : method}</span></div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Session fee</span>
              <span className="font-heading">
                {profile.is_youth && <span className="mr-1.5 text-xs text-muted-foreground line-through">KES {t.rate.toLocaleString()}</span>}
                KES {displayRate.toLocaleString()}
              </span>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <span className="font-heading font-semibold">Total</span>
            <span className="font-heading text-lg font-semibold">KES {displayRate.toLocaleString()}</span>
          </div>
          {profile.is_youth && <p className="mt-2 text-xs text-[#4f6138]">Youth discount applied (50% off, ages 13–24).</p>}
          <p className="mt-4 flex items-start gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#788c5d]" /> Payment is held securely. Free cancellation up to 12 hours before your session.
          </p>
        </aside>
      </div>

      <CrisisNotice className="mt-6" />
    </div>
  );
}
