import { useAuth } from "@/lib/auth";
import { ShieldCheck, Clock, ArrowRight } from "lucide-react";

export function TherapistDashboard() {
  const { profile } = useAuth();

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Welcome, {profile?.full_name?.split(" ")[0] ?? "there"}
      </h1>
      <p className="mt-1 text-muted-foreground">Your therapist workspace.</p>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e8e6dc] text-[#8a6d3b]">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <p className="font-heading font-semibold">Verification pending</p>
            <p className="text-sm text-muted-foreground">
              Complete your profile with your license details, and an admin will verify you before you appear publicly.
            </p>
          </div>
        </div>
        <button
          disabled
          className="mt-5 flex items-center gap-1.5 rounded-md bg-[#141413]/40 px-4 py-2 font-heading text-sm text-white"
          title="Therapist onboarding form is coming in the next build phase"
        >
          Complete your profile <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl bg-[#e8e6dc]/60 p-4 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#788c5d]" />
        Every therapist on Tubonge is verified against the Counsellors and Psychologists Board (CPB) register before going live.
      </div>
    </div>
  );
}
