import { useAuth } from "@/lib/auth";
import { ShieldCheck, Inbox } from "lucide-react";

export function AdminDashboard() {
  const { profile } = useAuth();

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Admin · {profile?.full_name ?? ""}
      </h1>
      <p className="mt-1 text-muted-foreground">Verification queue and platform oversight.</p>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-center">
        <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 font-heading font-semibold">No pending therapists yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Therapist applications will show up here for license review once onboarding ships.
        </p>
      </div>

      <div className="mt-6 flex items-center gap-2 rounded-xl bg-[#e8e6dc]/60 p-4 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#788c5d]" />
        Admin access is gated by the <code className="font-heading">is_admin()</code> RLS check — set a profile's role to
        <code className="font-heading"> admin</code> directly in the Supabase table editor to test this.
      </div>
    </div>
  );
}
