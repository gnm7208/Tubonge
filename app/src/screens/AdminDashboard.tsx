import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { TherapistRow, PayoutRow } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Inbox, CheckCircle2, XCircle, FileText, Banknote } from "lucide-react";

type PendingTherapist = TherapistRow & {
  profiles: { full_name: string; email: string | null; phone: string | null } | null;
};

type PendingPayout = PayoutRow & {
  therapists: { profiles: { full_name: string } | null } | null;
};

function PayoutQueue() {
  const [payouts, setPayouts] = useState<PendingPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("payouts")
      .select("*, therapists(profiles(full_name))")
      .eq("status", "requested")
      .order("requested_at", { ascending: true });
    setPayouts((data as unknown as PendingPayout[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const markPaid = async (id: string) => {
    setBusyId(id);
    await supabase.from("payouts").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    setBusyId(null);
    await load();
  };

  return (
    <div className="mt-8">
      <h2 className="flex items-center gap-2 font-heading text-xl font-semibold">
        <Banknote className="h-5 w-5 text-[#788c5d]" /> Payout requests
      </h2>
      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
      ) : payouts.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No pending payout requests.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {payouts.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
              <div>
                <p className="font-heading font-semibold">{p.therapists?.profiles?.full_name ?? "Therapist"}</p>
                <p className="text-sm text-muted-foreground">
                  KES {p.amount_kes.toLocaleString()} · requested {new Date(p.requested_at).toLocaleDateString()}
                </p>
              </div>
              <Button size="sm" disabled={busyId === p.id} onClick={() => markPaid(p.id)} className="bg-[#788c5d] font-heading text-white hover:bg-[#788c5d]/90">
                Mark paid
              </Button>
            </div>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">
        "Mark paid" only records that you settled it (e.g. via bank transfer) -- no money actually moves from here.
      </p>
    </div>
  );
}

export function AdminDashboard() {
  const { profile } = useAuth();
  const [items, setItems] = useState<PendingTherapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("therapists")
      .select("*, profiles(full_name, email, phone)")
      .eq("verification_status", "pending")
      .order("created_at", { ascending: true });
    if (error) setError(error.message);
    setItems((data as unknown as PendingTherapist[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const decide = async (id: string, status: "approved" | "rejected") => {
    setBusyId(id);
    const { error } = await supabase
      .from("therapists")
      .update({
        verification_status: status,
        ...(status === "approved" ? { approved_at: new Date().toISOString() } : {}),
      })
      .eq("id", id);
    setBusyId(null);
    if (error) {
      setError(error.message);
      return;
    }
    await load();
  };

  const viewDoc = async (path: string | null) => {
    if (!path) return;
    const { data } = await supabase.storage.from("credentials").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Admin · {profile?.full_name ?? ""}</h1>
      <p className="mt-1 text-muted-foreground">Verification queue.</p>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="mt-8 text-center text-muted-foreground">Loading…</div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 text-center">
          <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-heading font-semibold">No pending therapists</p>
          <p className="mt-1 text-sm text-muted-foreground">
            New applications will show up here for license review. (If you just submitted one and don't see it,
            confirm your profile's role is set to <code className="font-heading">admin</code> in the Supabase table editor.)
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {items.map((t) => (
            <div key={t.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-heading font-semibold">{t.profiles?.full_name ?? "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{t.profiles?.email} · {t.profiles?.phone}</p>
                </div>
                <span className="rounded-full bg-[#e8e6dc] px-3 py-1 font-heading text-xs">Pending review</span>
              </div>

              <Separator className="my-4" />

              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">License number</dt><dd className="font-heading">{t.license_number}</dd></div>
                <div><dt className="text-muted-foreground">Licensing body</dt><dd className="font-heading">{t.license_body}</dd></div>
                <div><dt className="text-muted-foreground">Years experience</dt><dd className="font-heading">{t.years_experience}</dd></div>
                <div><dt className="text-muted-foreground">Session rate</dt><dd className="font-heading">KES {t.session_rate_kes.toLocaleString()}</dd></div>
                <div className="sm:col-span-2"><dt className="text-muted-foreground">Specialties</dt><dd className="font-heading">{t.specialties.join(", ") || "—"}</dd></div>
                <div className="sm:col-span-2"><dt className="text-muted-foreground">Languages</dt><dd className="font-heading">{t.languages.join(", ") || "—"}</dd></div>
                <div className="sm:col-span-2"><dt className="text-muted-foreground">Bio</dt><dd>{t.bio || "—"}</dd></div>
              </dl>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!t.credentials_url}
                  onClick={() => viewDoc(t.credentials_url)}
                  className="font-heading"
                >
                  <FileText className="mr-1.5 h-4 w-4" /> View credential document
                </Button>
                <div className="ml-auto flex gap-2">
                  <Button
                    size="sm"
                    disabled={busyId === t.id}
                    onClick={() => decide(t.id, "rejected")}
                    variant="outline"
                    className="font-heading text-destructive"
                  >
                    <XCircle className="mr-1.5 h-4 w-4" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    disabled={busyId === t.id}
                    onClick={() => decide(t.id, "approved")}
                    className="bg-[#788c5d] font-heading text-white hover:bg-[#788c5d]/90"
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <PayoutQueue />

      <div className="mt-6 flex items-center gap-2 rounded-xl bg-[#e8e6dc]/60 p-4 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#788c5d]" />
        Approving sets a therapist's <code className="font-heading">verification_status</code> to "approved" and makes
        them visible immediately on the public Browse page and Landing.
      </div>
    </div>
  );
}
