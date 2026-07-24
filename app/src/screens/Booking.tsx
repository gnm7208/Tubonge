import { useState } from "react";
import type { Therapist } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ShieldCheck, Smartphone, CreditCard, Landmark, Loader2, CheckCircle2, Clock, Video, Copy } from "lucide-react";

type Stage = "details" | "prompt" | "success";
type Method = "mpesa" | "card" | "bank";

const METHODS: { id: Method; label: string; icon: any; hint: string; color: string }[] = [
  { id: "mpesa", label: "M-Pesa", icon: Smartphone, hint: "Instant · STK push", color: "#2e8540" },
  { id: "card", label: "Debit card", icon: CreditCard, hint: "Visa / Mastercard", color: "#6a9bcc" },
  { id: "bank", label: "Bank transfer", icon: Landmark, hint: "Pay by reference", color: "#788c5d" },
];

export function BookingScreen({ therapist: t, slot, setSlot, onPaid, back }: {
  therapist: Therapist; slot: string; setSlot: (s: string) => void; onPaid: () => void; back: () => void;
}) {
  const [method, setMethod] = useState<Method>("mpesa");
  const [phone, setPhone] = useState("0712 345 678");
  const [card, setCard] = useState({ num: "", exp: "", cvv: "", name: "" });
  const [stage, setStage] = useState<Stage>("details");

  const pay = () => {
    setStage("prompt");
    setTimeout(() => setStage("success"), method === "bank" ? 2200 : 3200);
  };

  const payLabel =
    method === "mpesa" ? "Pay with M-Pesa" : method === "card" ? "Pay by card" : "I've sent the transfer";

  return (
    <div className="mx-auto max-w-4xl px-5 py-8">
      <Button variant="ghost" onClick={back} className="mb-4 font-heading text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Confirm & pay</h1>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_320px]">
        {/* Left: form / payment */}
        <div className="rounded-2xl border border-border bg-card p-6">
          {stage === "details" && (
            <>
              <h2 className="font-heading text-lg font-semibold">Choose a time</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {t.nextSlots.map((s) => (
                  <button key={s} onClick={() => setSlot(s)} className={`rounded-xl border px-3 py-3 text-center font-heading text-sm transition-colors ${slot === s ? "border-[#d97757] bg-[#d97757]/10 text-[#141413]" : "border-border bg-[#faf9f5] hover:border-[#d97757]/50"}`}>
                    {s}
                  </button>
                ))}
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

              {/* Method-specific fields */}
              <div className="mt-5">
                {method === "mpesa" && (
                  <div className="max-w-xs">
                    <Label htmlFor="phone" className="font-heading text-sm">M-Pesa phone number</Label>
                    <div className="relative mt-1.5">
                      <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2e8540]" />
                      <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9 font-body" />
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">You'll get a prompt on your phone to enter your PIN.</p>
                  </div>
                )}

                {method === "card" && (
                  <div className="grid max-w-md gap-3">
                    <div>
                      <Label className="font-heading text-sm">Card number</Label>
                      <div className="relative mt-1.5">
                        <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6a9bcc]" />
                        <Input value={card.num} onChange={(e) => setCard({ ...card, num: e.target.value })} placeholder="4242 4242 4242 4242" className="pl-9 font-body" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="font-heading text-sm">Expiry</Label>
                        <Input value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} placeholder="MM/YY" className="mt-1.5 font-body" />
                      </div>
                      <div>
                        <Label className="font-heading text-sm">CVV</Label>
                        <Input value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} placeholder="123" className="mt-1.5 font-body" />
                      </div>
                    </div>
                    <div>
                      <Label className="font-heading text-sm">Name on card</Label>
                      <Input value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="As shown on card" className="mt-1.5 font-body" />
                    </div>
                  </div>
                )}

                {method === "bank" && (
                  <div className="max-w-md rounded-xl border border-border bg-[#faf9f5] p-4">
                    <p className="font-heading text-sm font-semibold">Transfer to</p>
                    <dl className="mt-3 space-y-2 text-sm">
                      {[["Bank", "Equity Bank Kenya"], ["Account name", "Tubonge Health Ltd"], ["Account no.", "0123456789012"], ["Reference", "TBG-4821"]].map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between gap-3">
                          <dt className="text-muted-foreground">{k}</dt>
                          <dd className="flex items-center gap-1.5 font-heading font-medium">{v}<Copy className="h-3 w-3 text-muted-foreground" /></dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-3 text-xs text-muted-foreground">Use reference <span className="font-heading font-medium text-foreground">TBG-4821</span> so we can match your payment. Confirmation may take a few minutes.</p>
                  </div>
                )}
              </div>

              <Button onClick={pay} disabled={!slot} className="mt-6 w-full font-heading text-white sm:w-auto" style={{ background: METHODS.find((m) => m.id === method)!.color }}>
                {method === "mpesa" && <Smartphone className="mr-2 h-4 w-4" />}
                {method === "card" && <CreditCard className="mr-2 h-4 w-4" />}
                {method === "bank" && <Landmark className="mr-2 h-4 w-4" />}
                {payLabel} · KES {t.rate.toLocaleString()}
              </Button>
              {!slot && <p className="mt-2 text-xs text-muted-foreground">Select a time to continue.</p>}
              <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-[#788c5d]" /> Payments processed securely via Pesapal (M-Pesa, cards & bank).
              </p>
            </>
          )}

          {stage === "prompt" && (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="relative">
                <span className="grid h-16 w-16 place-items-center rounded-2xl text-white" style={{ background: METHODS.find((m) => m.id === method)!.color }}>
                  {method === "mpesa" && <Smartphone className="h-7 w-7" />}
                  {method === "card" && <CreditCard className="h-7 w-7" />}
                  {method === "bank" && <Landmark className="h-7 w-7" />}
                </span>
                <Loader2 className="absolute -right-2 -top-2 h-6 w-6 animate-spin text-[#d97757]" />
              </div>
              <h2 className="mt-5 font-heading text-lg font-semibold">
                {method === "mpesa" && `STK push sent to ${phone}`}
                {method === "card" && "Authorising your card…"}
                {method === "bank" && "Checking for your transfer…"}
              </h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {method === "mpesa" && `Enter your M-Pesa PIN to approve KES ${t.rate.toLocaleString()}. Waiting for confirmation…`}
                {method === "card" && "Contacting your bank for 3-D Secure verification. Please don't close this window."}
                {method === "bank" && `Matching reference TBG-4821 for KES ${t.rate.toLocaleString()}.`}
              </p>
              <div className="mt-5 h-1.5 w-48 overflow-hidden rounded-full bg-[#e8e6dc]">
                <div className="h-full w-1/2 animate-pulse rounded-full" style={{ background: METHODS.find((m) => m.id === method)!.color }} />
              </div>
            </div>
          )}

          {stage === "success" && (
            <div className="flex flex-col items-center py-8 text-center">
              <CheckCircle2 className="h-14 w-14 text-[#788c5d]" />
              <h2 className="mt-4 font-heading text-xl font-semibold">Payment confirmed</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {method === "mpesa" && <>M-Pesa receipt <span className="font-heading font-medium text-foreground">SGR7X2QW1P</span> · </>}
                {method === "card" && <>Card ending 4242 · Ref <span className="font-heading font-medium text-foreground">PSP-99A2</span> · </>}
                {method === "bank" && <>Bank ref <span className="font-heading font-medium text-foreground">TBG-4821</span> · </>}
                KES {t.rate.toLocaleString()}
              </p>
              <div className="mt-5 w-full rounded-xl border border-border bg-[#faf9f5] p-4 text-left">
                <p className="flex items-center gap-2 font-heading text-sm font-medium"><Video className="h-4 w-4 text-[#6a9bcc]" /> Your session is booked</p>
                <p className="mt-1 text-sm text-muted-foreground">{t.name} · {slot}</p>
              </div>
              <Button onClick={onPaid} className="mt-6 w-full bg-[#141413] font-heading text-white hover:bg-[#141413]/90">
                Go to my sessions
              </Button>
            </div>
          )}
        </div>

        {/* Right: order summary */}
        <aside className="h-fit rounded-2xl border border-border bg-card p-5">
          <p className="font-heading text-sm font-semibold text-muted-foreground">Summary</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-full font-heading text-sm font-semibold text-white" style={{ background: t.accent }}>{t.initials}</span>
            <div>
              <p className="font-heading text-sm font-semibold">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.title}</p>
            </div>
          </div>
          <Separator className="my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between"><span className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-3.5 w-3.5" /> Time</span><span className="font-heading">{slot || "—"}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Duration</span><span className="font-heading">50 min</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Method</span><span className="font-heading capitalize">{method === "mpesa" ? "M-Pesa" : method}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Session fee</span><span className="font-heading">KES {t.rate.toLocaleString()}</span></div>
          </div>
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <span className="font-heading font-semibold">Total</span>
            <span className="font-heading text-lg font-semibold">KES {t.rate.toLocaleString()}</span>
          </div>
          <p className="mt-4 flex items-start gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#788c5d]" /> Payment is held securely. Free cancellation up to 12 hours before your session.
          </p>
        </aside>
      </div>
    </div>
  );
}
