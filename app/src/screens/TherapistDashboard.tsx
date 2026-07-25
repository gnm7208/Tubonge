import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { TherapistRow, AvailabilitySlot } from "@/lib/database.types";
import { slotLabel, initialsOf, accentFor } from "@/lib/therapists";
import { canJoinSession } from "@/lib/sessionTiming";
import { ALL_SPECIALTIES, ALL_LANGUAGES, type Therapist } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ShieldCheck, Clock, CheckCircle2, XCircle, FileText, Upload, Plus, Trash2, CalendarPlus, Video } from "lucide-react";

const SESSION_MINUTES = 50;

function AvailabilityManager({ therapistId }: { therapistId: string }) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [when, setWhen] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("therapist_id", therapistId)
      .eq("status", "open")
      .gt("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true });
    setSlots((data as AvailabilitySlot[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [therapistId]);

  const addSlot = async (e: FormEvent) => {
    e.preventDefault();
    if (!when) return;
    setBusy(true);
    setError(null);
    const startsAt = new Date(when);
    const endsAt = new Date(startsAt.getTime() + SESSION_MINUTES * 60_000);
    const { error } = await supabase.from("availability_slots").insert({
      therapist_id: therapistId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setWhen("");
    await load();
  };

  const removeSlot = async (id: string) => {
    setBusy(true);
    await supabase.from("availability_slots").delete().eq("id", id);
    setBusy(false);
    await load();
  };

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6">
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
        <CalendarPlus className="h-5 w-5 text-[#6a9bcc]" /> Availability
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Add open slots ({SESSION_MINUTES} min each) for clients to book.
      </p>

      <form onSubmit={addSlot} className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="slotWhen" className="font-heading text-sm">Date &amp; time</Label>
          <Input
            id="slotWhen"
            type="datetime-local"
            required
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="mt-1.5 font-body"
          />
        </div>
        <Button type="submit" disabled={busy} className="bg-[#6a9bcc] font-heading text-white hover:bg-[#5b89b8]">
          <Plus className="mr-1.5 h-4 w-4" /> Add slot
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <div className="mt-5 space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming open slots yet.</p>
        ) : (
          slots.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-xl border border-border bg-[#faf9f5] px-4 py-2.5">
              <span className="font-heading text-sm">{slotLabel(s.starts_at)}</span>
              <button
                type="button"
                disabled={busy}
                onClick={() => removeSlot(s.id)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove slot"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function toggle(list: string[], item: string) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

type TherapistBookingRow = {
  id: string;
  profiles: { full_name: string } | null;
  availability_slots: { starts_at: string; ends_at: string } | null;
};

function UpcomingSessions({ therapistId, join }: { therapistId: string; join: (t: Therapist, bookingId: string) => void }) {
  const [bookings, setBookings] = useState<TherapistBookingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("bookings")
      .select("id, profiles(full_name), availability_slots(starts_at, ends_at)")
      .eq("therapist_id", therapistId)
      .eq("status", "confirmed")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setBookings((data as unknown as TherapistBookingRow[]) ?? []);
        setLoading(false);
      });
  }, [therapistId]);

  const now = Date.now();
  const upcoming = bookings.filter((b) => b.availability_slots && new Date(b.availability_slots.ends_at).getTime() > now);

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6">
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
        <Video className="h-5 w-5 text-[#6a9bcc]" /> Upcoming sessions
      </h2>
      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No confirmed sessions yet.</p>
        ) : (
          upcoming.map((b) => {
            const name = b.profiles?.full_name ?? "Client";
            const clientAsTherapist: Therapist = {
              id: b.id, name, title: "Client", specialties: [], languages: [], years: 0, rate: 0,
              rating: 0, reviews: 0, verified: false, bio: "", initials: initialsOf(name), accent: accentFor(b.id), nextSlots: [],
            };
            const joinable = b.availability_slots ? canJoinSession(b.availability_slots.starts_at, b.availability_slots.ends_at) : false;
            return (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-border bg-[#faf9f5] px-4 py-3">
                <div>
                  <p className="font-heading text-sm font-semibold">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.availability_slots ? new Date(b.availability_slots.starts_at).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit", month: "short", day: "numeric" }) : "—"}
                  </p>
                </div>
                <Button size="sm" disabled={!joinable} onClick={() => join(clientAsTherapist, b.id)} className="bg-[#6a9bcc] font-heading text-white hover:bg-[#5b89b8]">
                  <Video className="mr-1.5 h-4 w-4" /> Join
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const STATUS_COPY: Record<TherapistRow["verification_status"], { label: string; icon: typeof Clock; color: string }> = {
  pending: { label: "Verification pending", icon: Clock, color: "#8a6d3b" },
  approved: { label: "Verified", icon: CheckCircle2, color: "#4f6138" },
  rejected: { label: "Not approved — please review and resubmit", icon: XCircle, color: "#b3452c" },
};

export function TherapistDashboard({ join }: { join: (t: Therapist, bookingId: string) => void }) {
  const { profile } = useAuth();
  const [row, setRow] = useState<TherapistRow | null>(null);
  const [loading, setLoading] = useState(true);

  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseBody, setLicenseBody] = useState("Counsellors and Psychologists Board (CPB)");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [years, setYears] = useState(0);
  const [rate, setRate] = useState(2000);
  const [file, setFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("therapists")
      .select("*")
      .eq("profile_id", profile.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setRow(data);
          setLicenseNumber(data.license_number);
          setLicenseBody(data.license_body);
          setTitle(data.title ?? "");
          setBio(data.bio ?? "");
          setSpecialties(data.specialties);
          setLanguages(data.languages);
          setYears(data.years_experience);
          setRate(data.session_rate_kes);
        }
        setLoading(false);
      });
  }, [profile]);

  const viewDocument = async () => {
    if (!row?.credentials_url) return;
    const { data } = await supabase.storage.from("credentials").createSignedUrl(row.credentials_url, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);

    let credentialsUrl = row?.credentials_url ?? null;
    if (file) {
      const path = `${profile.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("credentials").upload(path, file, { upsert: true });
      if (uploadError) {
        setError(uploadError.message);
        setSaving(false);
        return;
      }
      credentialsUrl = path;
    }

    const { data, error: upsertError } = await supabase
      .from("therapists")
      .upsert(
        {
          profile_id: profile.id,
          license_number: licenseNumber,
          license_body: licenseBody,
          title,
          bio,
          specialties,
          languages,
          years_experience: years,
          session_rate_kes: rate,
          credentials_url: credentialsUrl,
          ...(!row || row.verification_status === "rejected" ? { verification_status: "pending" as const } : {}),
        },
        { onConflict: "profile_id" }
      )
      .select()
      .single();

    setSaving(false);
    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    setRow(data);
    setFile(null);
  };

  if (loading) {
    return <div className="mx-auto max-w-3xl px-5 py-20 text-center text-muted-foreground">Loading…</div>;
  }

  const status = row ? STATUS_COPY[row.verification_status] : null;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Welcome, {profile?.full_name?.split(" ")[0] ?? "there"}
      </h1>
      <p className="mt-1 text-muted-foreground">Your therapist workspace.</p>

      {status && (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-5">
          <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${status.color}22`, color: status.color }}>
            <status.icon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-heading font-semibold" style={{ color: status.color }}>{status.label}</p>
            <p className="text-sm text-muted-foreground">
              {row?.verification_status === "approved"
                ? "You're live and visible to clients browsing Tubonge."
                : "An admin will review your license details before you appear publicly."}
            </p>
          </div>
        </div>
      )}

      {row && <UpcomingSessions therapistId={row.id} join={join} />}

      <form onSubmit={submit} className="mt-6 grid gap-5 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-heading text-lg font-semibold">
          {row ? "Update your profile" : "Complete your profile"}
        </h2>

        <div>
          <Label htmlFor="title" className="font-heading text-sm">Professional title</Label>
          <Input id="title" required placeholder="e.g. Clinical Psychologist" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5 font-body" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="licenseNumber" className="font-heading text-sm">License number</Label>
            <Input id="licenseNumber" required value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} className="mt-1.5 font-body" />
          </div>
          <div>
            <Label htmlFor="licenseBody" className="font-heading text-sm">Licensing body</Label>
            <Input id="licenseBody" required value={licenseBody} onChange={(e) => setLicenseBody(e.target.value)} className="mt-1.5 font-body" />
          </div>
        </div>

        <div>
          <Label htmlFor="bio" className="font-heading text-sm">Bio</Label>
          <Textarea id="bio" required value={bio} onChange={(e) => setBio(e.target.value)} className="mt-1.5 font-body" rows={4} />
        </div>

        <div>
          <Label className="font-heading text-sm">Specialties</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALL_SPECIALTIES.map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setSpecialties(toggle(specialties, s))}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${specialties.includes(s) ? "border-[#141413] bg-[#141413]/[0.05] font-medium" : "border-border text-muted-foreground hover:border-[#141413]/30"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label className="font-heading text-sm">Languages</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALL_LANGUAGES.map((l) => (
              <button
                type="button"
                key={l}
                onClick={() => setLanguages(toggle(languages, l))}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${languages.includes(l) ? "border-[#141413] bg-[#141413]/[0.05] font-medium" : "border-border text-muted-foreground hover:border-[#141413]/30"}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="years" className="font-heading text-sm">Years of experience</Label>
            <Input id="years" type="number" min={0} required value={years} onChange={(e) => setYears(Number(e.target.value))} className="mt-1.5 font-body" />
          </div>
          <div>
            <Label htmlFor="rate" className="font-heading text-sm">Session rate (KES)</Label>
            <Input id="rate" type="number" min={0} required value={rate} onChange={(e) => setRate(Number(e.target.value))} className="mt-1.5 font-body" />
          </div>
        </div>

        <Separator />

        <div>
          <Label htmlFor="credentials" className="font-heading text-sm">License / credential document</Label>
          <div className="mt-1.5 flex items-center gap-3">
            <label htmlFor="credentials" className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm text-muted-foreground hover:border-[#141413]/30">
              <Upload className="h-4 w-4" /> {file ? file.name : "Choose file (PDF or image)"}
            </label>
            <input
              id="credentials"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {row?.credentials_url && !file && (
              <button type="button" onClick={viewDocument} className="flex items-center gap-1 font-heading text-sm text-[#d97757] underline">
                <FileText className="h-3.5 w-3.5" /> View current file
              </button>
            )}
          </div>
          {!row?.credentials_url && !file && (
            <p className="mt-1.5 text-xs text-muted-foreground">Required before an admin can verify you.</p>
          )}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={saving} className="w-fit bg-[#d97757] font-heading text-white hover:bg-[#c9663f]">
          {saving ? "Saving…" : row ? "Save changes" : "Submit for verification"}
        </Button>
      </form>

      {row && <AvailabilityManager therapistId={row.id} />}

      <div className="mt-6 flex items-center gap-2 rounded-xl bg-[#e8e6dc]/60 p-4 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#788c5d]" />
        Every therapist on Tubonge is verified against the Counsellors and Psychologists Board (CPB) register before going live.
      </div>
    </div>
  );
}
