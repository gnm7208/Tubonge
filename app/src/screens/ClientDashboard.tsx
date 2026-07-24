import type { View } from "@/App";
import type { Therapist } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Calendar, MessageSquare, ShieldCheck, CheckCircle2, Star } from "lucide-react";

export function ClientDashboard({ go, therapist, slot, join }: {
  go: (v: View) => void; therapist: Therapist | null; slot: string; join: () => void;
}) {
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
      <div className="mt-3 rounded-2xl border border-border bg-card p-5">
        {therapist ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 place-items-center rounded-2xl font-heading text-lg font-semibold text-white" style={{ background: therapist.accent }}>{therapist.initials}</span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-heading font-semibold">{therapist.name}</p>
                  <Badge className="border-none bg-[#788c5d]/15 font-heading text-xs text-[#4f6138] hover:bg-[#788c5d]/15"><CheckCircle2 className="mr-1 h-3 w-3" /> Paid</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{therapist.title}</p>
                <p className="mt-1 flex items-center gap-1.5 font-heading text-sm"><Calendar className="h-4 w-4 text-[#d97757]" /> {slot || "Today · 4:00 PM"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="font-heading"><MessageSquare className="mr-1.5 h-4 w-4" /> Message</Button>
              <Button onClick={join} className="bg-[#6a9bcc] font-heading text-white hover:bg-[#5b89b8]"><Video className="mr-1.5 h-4 w-4" /> Join session</Button>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">No upcoming sessions yet. <button onClick={() => go("browse")} className="font-heading text-[#d97757] underline">Find a therapist</button>.</p>
        )}
      </div>

      {/* Past */}
      <h2 className="mt-8 font-heading text-lg font-semibold">Past sessions</h2>
      <div className="mt-3 space-y-3">
        {[
          { n: "Dr. Amina Wanjiru", d: "Last Tuesday · 4:00 PM", i: "AW", c: "#d97757" },
          { n: "Brian Otieno", d: "12 July · 6:00 PM", i: "BO", c: "#6a9bcc" },
        ].map((s, idx) => (
          <div key={idx} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full font-heading text-sm font-semibold text-white" style={{ background: s.c }}>{s.i}</span>
              <div>
                <p className="font-heading text-sm font-semibold">{s.n}</p>
                <p className="text-xs text-muted-foreground">{s.d}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="font-heading text-[#d97757]"><Star className="mr-1 h-3.5 w-3.5" /> Rate</Button>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-2 rounded-xl bg-[#e8e6dc]/60 p-4 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#788c5d]" />
        Your sessions and messages are private and encrypted. In a crisis, call the Kenya Red Cross line 1199 (toll-free).
      </div>
    </div>
  );
}
