import { useEffect, useState } from "react";
import type { View } from "@/App";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Therapist } from "@/data/mock";
import { fetchApprovedTherapists } from "@/lib/therapists";
import { TherapistCard } from "@/components/TherapistCard";
import { useAuth } from "@/lib/auth";
import { MessageCircleHeart, ShieldCheck, Video, Smartphone, Star, ArrowRight, HeartHandshake } from "lucide-react";

export function Landing({ go, openProfile }: { go: (v: View) => void; openProfile: (t: Therapist) => void }) {
  const { profile, signOut } = useAuth();
  const [featured, setFeatured] = useState<Therapist[]>([]);

  useEffect(() => {
    fetchApprovedTherapists(3).then(setFeatured).catch(() => setFeatured([]));
  }, []);

  return (
    <div>
      {/* Nav */}
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#d97757] text-white">
            <MessageCircleHeart className="h-5 w-5" />
          </span>
          <span className="font-heading text-xl font-semibold tracking-tight">Tubonge</span>
        </div>
        <div className="flex items-center gap-2">
          {profile ? (
            <>
              <Button variant="ghost" onClick={() => go("dashboard")} className="hidden font-heading sm:inline-flex">My sessions</Button>
              <Button onClick={() => signOut()} className="bg-[#141413] font-heading text-white hover:bg-[#141413]/90">Log out</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => go("login")} className="hidden font-heading sm:inline-flex">Log in</Button>
              <Button onClick={() => go("signup")} className="bg-[#141413] font-heading text-white hover:bg-[#141413]/90">Get started</Button>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 md:grid-cols-2 md:py-20">
          <div>
            <Badge className="mb-5 border-none bg-[#e8e6dc] font-heading text-[#141413] hover:bg-[#e8e6dc]">
              <ShieldCheck className="mr-1 h-3.5 w-3.5 text-[#788c5d]" /> Licensed Kenyan therapists
            </Badge>
            <h1 className="font-heading text-4xl font-semibold leading-[1.1] tracking-tight md:text-6xl">
              Talk it through.<br />
              <span className="text-[#d97757]">Tubonge.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
              Private online therapy with licensed Kenyan professionals. Book a session, pay with
              M-Pesa, and meet by secure video — from wherever you are.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => go("browse")} className="bg-[#d97757] font-heading text-white hover:bg-[#c9663f]">
                Find your therapist <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => go("browse")} className="border-[#141413]/20 font-heading">
                How it works
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Star className="h-4 w-4 fill-[#d97757] text-[#d97757]" /> 4.9 average rating</span>
              <span className="flex items-center gap-1.5"><HeartHandshake className="h-4 w-4 text-[#788c5d]" /> 2,400+ sessions held</span>
            </div>
          </div>

          {/* Hero card cluster */}
          <div className="relative">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-[#d97757] font-heading text-lg font-semibold text-white">AW</span>
                <div>
                  <p className="font-heading font-semibold">Dr. Amina Wanjiru</p>
                  <p className="text-sm text-muted-foreground">Clinical Psychologist</p>
                </div>
                <Badge className="ml-auto border-none bg-[#788c5d]/15 font-heading text-[#4f6138] hover:bg-[#788c5d]/15">
                  <ShieldCheck className="mr-1 h-3 w-3" /> Verified
                </Badge>
              </div>
              <div className="mt-5 rounded-xl bg-[#141413] p-4 text-white">
                <div className="flex items-center gap-2 text-sm text-[#b0aea5]"><Video className="h-4 w-4" /> Session starting</div>
                <p className="mt-1 font-heading text-lg">Today · 4:00 PM</p>
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-[#faf9f5] p-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5 text-[#2e8540]" />
                  <span className="font-heading text-sm">Pay with M-Pesa</span>
                </div>
                <span className="font-heading font-semibold">KES 2,500</span>
              </div>
            </div>
            <div className="absolute -right-3 -top-3 hidden rounded-xl border border-border bg-card px-4 py-3 shadow-sm sm:block">
              <p className="font-heading text-xs text-muted-foreground">STK push sent</p>
              <p className="font-heading text-sm font-semibold text-[#788c5d]">Payment confirmed ✓</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-[#f3f1e9]">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <h2 className="font-heading text-2xl font-semibold md:text-3xl">How Tubonge works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              { icon: MessageCircleHeart, c: "#d97757", t: "Match", d: "Browse licensed therapists by specialty, language and price. Pick who feels right." },
              { icon: Smartphone, c: "#788c5d", t: "Book & pay", d: "Choose a time and pay securely with M-Pesa. You get an instant confirmation." },
              { icon: Video, c: "#6a9bcc", t: "Meet", d: "Join a private, encrypted video session from your phone or laptop — no travel." },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ background: s.c }}>
                  <s.icon className="h-5 w-5" />
                </span>
                <p className="mt-4 font-heading text-lg font-semibold">{i + 1}. {s.t}</p>
                <p className="mt-1 text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured therapists */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-5 py-14">
          <div className="flex items-end justify-between">
            <h2 className="font-heading text-2xl font-semibold md:text-3xl">Meet our therapists</h2>
            <Button variant="ghost" onClick={() => go("browse")} className="font-heading text-[#d97757]">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((t) => (
              <TherapistCard key={t.id} t={t} onView={() => openProfile(t)} onBook={() => openProfile(t)} />
            ))}
          </div>
        </section>
      )}

      {/* Trust strip */}
      <section className="border-t border-border bg-[#141413] text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-3">
          <div>
            <ShieldCheck className="h-6 w-6 text-[#788c5d]" />
            <p className="mt-3 font-heading font-semibold">Licensed & verified</p>
            <p className="mt-1 text-sm text-[#b0aea5]">Every therapist is registered with the Counsellors & Psychologists Board of Kenya.</p>
          </div>
          <div>
            <MessageCircleHeart className="h-6 w-6 text-[#d97757]" />
            <p className="mt-3 font-heading font-semibold">Private & confidential</p>
            <p className="mt-1 text-sm text-[#b0aea5]">Encrypted sessions and data handled under Kenya's Data Protection Act.</p>
          </div>
          <div>
            <Smartphone className="h-6 w-6 text-[#6a9bcc]" />
            <p className="mt-3 font-heading font-semibold">Pay how you already do</p>
            <p className="mt-1 text-sm text-[#b0aea5]">Simple M-Pesa payments in KES. No cards, no hassle.</p>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-5 text-sm text-[#b0aea5] sm:flex-row">
            <span className="font-heading">Tubonge</span>
            <span>If you are in crisis, call the Kenya Red Cross line 1199 (toll-free).</span>
          </div>
        </div>
      </section>
    </div>
  );
}
