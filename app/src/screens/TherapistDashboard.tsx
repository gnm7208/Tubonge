import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { TherapistRow, AvailabilitySlot, PayoutRow, CheckInRow, GroupSessionRow, WorksheetRow } from "@/lib/database.types";
import { slotLabel, initialsOf, accentFor } from "@/lib/therapists";
import { canJoinSession } from "@/lib/sessionTiming";
import { scoreBand } from "@/lib/checkIns";
import { ALL_SPECIALTIES, ALL_LANGUAGES, type Therapist } from "@/data/mock";
import { Sparkline } from "@/components/Sparkline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Clock, CheckCircle2, XCircle, FileText, Upload, Plus, Trash2, CalendarPlus, Video, Banknote, Users, ChevronDown, HeartPulse, UsersRound, NotebookPen } from "lucide-react";

const GROUP_SESSION_MINUTES = 60;

function GroupSessionManager({ therapistId, joinGroup }: { therapistId: string; joinGroup: (t: Therapist, groupSessionId: string) => void }) {
  const [groups, setGroups] = useState<(GroupSessionRow & { group_session_attendees: { count: number }[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [when, setWhen] = useState("");
  const [capacity, setCapacity] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("group_sessions")
      .select("*, group_session_attendees(count)")
      .eq("therapist_id", therapistId)
      .neq("status", "cancelled")
      .order("starts_at", { ascending: true });
    setGroups((data as unknown as (GroupSessionRow & { group_session_attendees: { count: number }[] })[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [therapistId]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    if (!when || !title) return;
    setBusy(true);
    setError(null);
    const startsAt = new Date(when);
    const endsAt = new Date(startsAt.getTime() + GROUP_SESSION_MINUTES * 60_000);
    const { error } = await supabase.from("group_sessions").insert({
      therapist_id: therapistId,
      title,
      description: description || null,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      capacity,
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setTitle("");
    setDescription("");
    setWhen("");
    setCapacity(10);
    await load();
  };

  const cancel = async (id: string) => {
    setBusy(true);
    await supabase.from("group_sessions").update({ status: "cancelled" }).eq("id", id);
    setBusy(false);
    await load();
  };

  const now = Date.now();
  const upcoming = groups.filter((g) => new Date(g.ends_at).getTime() > now);

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6">
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
        <UsersRound className="h-5 w-5 text-[#788c5d]" /> Group sessions
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Free groupinars ({GROUP_SESSION_MINUTES} min) -- clients RSVP, no payment involved.
      </p>

      <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="groupTitle" className="font-heading text-sm">Title</Label>
          <Input id="groupTitle" required placeholder="Managing exam stress" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5 font-body" />
        </div>
        <div>
          <Label htmlFor="groupWhen" className="font-heading text-sm">Date &amp; time</Label>
          <Input id="groupWhen" type="datetime-local" required value={when} onChange={(e) => setWhen(e.target.value)} className="mt-1.5 font-body" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="groupDescription" className="font-heading text-sm">Description</Label>
          <Textarea id="groupDescription" value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5 font-body" rows={2} />
        </div>
        <div className="flex items-end gap-3">
          <div>
            <Label htmlFor="groupCapacity" className="font-heading text-sm">Capacity</Label>
            <Input id="groupCapacity" type="number" min={2} max={100} required value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} className="mt-1.5 w-28 font-body" />
          </div>
          <Button type="submit" disabled={busy} className="bg-[#788c5d] font-heading text-white hover:bg-[#788c5d]/90">
            <Plus className="mr-1.5 h-4 w-4" /> Schedule group
          </Button>
        </div>
      </form>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <div className="mt-5 space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming groups yet.</p>
        ) : (
          upcoming.map((g) => {
            const joinable = canJoinSession(g.starts_at, g.ends_at);
            const t: Therapist = {
              id: g.id, name: g.title, title: "Group session", specialties: [], languages: [], years: 0, rate: 0,
              rating: 0, reviews: 0, verified: false, bio: "", initials: initialsOf(g.title), accent: accentFor(g.id), nextSlots: [],
            };
            return (
              <div key={g.id} className="flex items-center justify-between rounded-xl border border-border bg-[#faf9f5] px-4 py-2.5">
                <div>
                  <p className="font-heading text-sm font-semibold">{g.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {slotLabel(g.starts_at)} · {g.group_session_attendees?.[0]?.count ?? 0}/{g.capacity} attending
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button size="sm" disabled={!joinable} onClick={() => joinGroup(t, g.id)} className="bg-[#6a9bcc] font-heading text-white hover:bg-[#5b89b8]">
                    <Video className="mr-1.5 h-4 w-4" /> Join
                  </Button>
                  <button type="button" disabled={busy} onClick={() => cancel(g.id)} className="text-muted-foreground hover:text-destructive" aria-label="Cancel group session">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

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

function EarningsAndPayouts({ therapistId }: { therapistId: string }) {
  const [gross, setGross] = useState(0);
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: bookings }, { data: payoutRows }] = await Promise.all([
      supabase.from("bookings").select("amount_kes").eq("therapist_id", therapistId).eq("status", "completed"),
      supabase.from("payouts").select("*").eq("therapist_id", therapistId).order("requested_at", { ascending: false }),
    ]);
    const g = (bookings ?? []).reduce((s, b) => s + b.amount_kes, 0);
    setGross(g);
    setPayouts((payoutRows as PayoutRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [therapistId]);

  const withdrawn = payouts.filter((p) => p.status === "requested" || p.status === "paid").reduce((s, p) => s + p.amount_kes, 0);
  const available = gross - withdrawn;

  useEffect(() => {
    setAmount(available);
  }, [available]);

  const requestPayout = async () => {
    if (amount <= 0 || amount > available) {
      setError("Enter an amount between 1 and your available balance.");
      return;
    }
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("payouts").insert({ therapist_id: therapistId, amount_kes: amount });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    await load();
  };

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6">
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
        <Banknote className="h-5 w-5 text-[#788c5d]" /> Earnings & payouts
      </h2>

      {loading ? (
        <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-[#faf9f5] p-4">
              <p className="text-xs text-muted-foreground">Total earned</p>
              <p className="font-heading text-xl font-semibold">KES {gross.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-border bg-[#faf9f5] p-4">
              <p className="text-xs text-muted-foreground">Requested / paid out</p>
              <p className="font-heading text-xl font-semibold">KES {withdrawn.toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-[#788c5d]/40 bg-[#788c5d]/10 p-4">
              <p className="text-xs text-muted-foreground">Available to request</p>
              <p className="font-heading text-xl font-semibold text-[#4f6138]">KES {available.toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div>
              <Label htmlFor="payoutAmount" className="font-heading text-sm">Payout amount (KES)</Label>
              <Input
                id="payoutAmount"
                type="number"
                min={1}
                max={available}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="mt-1.5 w-40 font-body"
              />
            </div>
            <Button disabled={busy || available <= 0} onClick={requestPayout} className="bg-[#788c5d] font-heading text-white hover:bg-[#788c5d]/90">
              {busy ? "Requesting…" : "Request payout"}
            </Button>
          </div>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <p className="mt-2 text-xs text-muted-foreground">
            Payouts are settled manually by Tubonge for now (bank transfer) -- an admin marks your request paid once sent.
          </p>

          {payouts.length > 0 && (
            <div className="mt-4 space-y-2">
              {payouts.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5 text-sm">
                  <span className="font-heading">KES {p.amount_kes.toLocaleString()}</span>
                  <span className="text-muted-foreground">{new Date(p.requested_at).toLocaleDateString()}</span>
                  <Badge className={`border-none font-heading text-xs ${p.status === "paid" ? "bg-[#788c5d]/15 text-[#4f6138]" : "bg-[#e8e6dc] text-[#141413]"}`}>
                    {p.status === "paid" ? "Paid" : "Requested"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
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

type ClientSummary = { client_id: string; full_name: string };

function AssignedWorksheets({ clientId, therapistId }: { clientId: string; therapistId: string }) {
  const [worksheets, setWorksheets] = useState<WorksheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    supabase
      .from("worksheets")
      .select("*")
      .eq("client_id", clientId)
      .eq("therapist_id", therapistId)
      .order("assigned_at", { ascending: false })
      .then(({ data }) => {
        setWorksheets((data as WorksheetRow[]) ?? []);
        setLoading(false);
      });
  };

  useEffect(load, [clientId, therapistId]);

  const assign = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !prompt.trim()) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("worksheets").insert({ client_id: clientId, therapist_id: therapistId, title, prompt });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setTitle("");
    setPrompt("");
    load();
  };

  return (
    <div className="mt-3 rounded-xl border border-border bg-[#faf9f5] p-4">
      <p className="flex items-center gap-1.5 font-heading text-xs font-semibold text-muted-foreground"><NotebookPen className="h-3.5 w-3.5" /> Worksheets</p>

      <form onSubmit={assign} className="mt-3 space-y-2">
        <Input placeholder="Worksheet title" value={title} onChange={(e) => setTitle(e.target.value)} className="font-body" />
        <Textarea placeholder="What should they reflect on or complete?" value={prompt} onChange={(e) => setPrompt(e.target.value)} className="font-body" rows={2} />
        <Button type="submit" size="sm" disabled={busy} className="bg-[#788c5d] font-heading text-white hover:bg-[#788c5d]/90">
          {busy ? "Assigning…" : "Assign worksheet"}
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>

      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : worksheets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No worksheets assigned yet.</p>
        ) : (
          worksheets.map((w) => (
            <div key={w.id} className="rounded-lg border border-border bg-card px-3 py-2.5">
              <div className="flex items-center justify-between">
                <p className="font-heading text-sm font-semibold">{w.title}</p>
                <Badge className={`border-none font-heading text-xs ${w.completed_at ? "bg-[#788c5d]/15 text-[#4f6138]" : "bg-[#e8e6dc] text-[#141413]"}`}>
                  {w.completed_at ? "Completed" : "Assigned"}
                </Badge>
              </div>
              {w.client_response && <p className="mt-1.5 text-sm text-muted-foreground">{w.client_response}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function ClientDetail({ clientId, therapistId }: { clientId: string; therapistId: string }) {
  const [checkIns, setCheckIns] = useState<CheckInRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("check_ins")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setCheckIns((data as CheckInRow[]) ?? []);
        setLoading(false);
      });
  }, [clientId]);

  const latest = checkIns[checkIns.length - 1];
  const band = latest ? scoreBand(latest.type, latest.score) : null;

  return (
    <div className="mt-2 rounded-xl border border-border bg-[#faf9f5] p-4">
      <p className="flex items-center gap-1.5 font-heading text-xs font-semibold text-muted-foreground"><HeartPulse className="h-3.5 w-3.5" /> Check-in trend</p>
      {loading ? (
        <p className="mt-2 text-sm text-muted-foreground">Loading…</p>
      ) : checkIns.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">No check-ins yet.</p>
      ) : (
        <div className="mt-3 flex items-center gap-4">
          <Sparkline values={checkIns.slice(-8).map((c) => c.score)} max={27} color={band?.color ?? "#788c5d"} />
          {band && latest && (
            <div>
              <p className="font-heading text-sm font-semibold" style={{ color: band.color }}>{band.label}</p>
              <p className="text-xs text-muted-foreground">{latest.type === "phq9" ? "Mood" : "Anxiety"} · {new Date(latest.created_at).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      )}
      <AssignedWorksheets clientId={clientId} therapistId={therapistId} />
    </div>
  );
}

function MyClients({ therapistId }: { therapistId: string }) {
  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("bookings")
      .select("client_id, profiles(full_name)")
      .eq("therapist_id", therapistId)
      .in("status", ["confirmed", "completed"])
      .then(({ data }) => {
        const seen = new Map<string, string>();
        for (const b of (data as unknown as { client_id: string; profiles: { full_name: string } | null }[]) ?? []) {
          if (!seen.has(b.client_id)) seen.set(b.client_id, b.profiles?.full_name ?? "Client");
        }
        setClients(Array.from(seen, ([client_id, full_name]) => ({ client_id, full_name })));
        setLoading(false);
      });
  }, [therapistId]);

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-6">
      <h2 className="flex items-center gap-2 font-heading text-lg font-semibold">
        <Users className="h-5 w-5 text-[#788c5d]" /> My clients
      </h2>
      <div className="mt-4 space-y-2">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : clients.length === 0 ? (
          <p className="text-sm text-muted-foreground">Clients from confirmed bookings will show up here.</p>
        ) : (
          clients.map((c) => (
            <div key={c.client_id}>
              <button
                onClick={() => setOpenId(openId === c.client_id ? null : c.client_id)}
                className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 text-left transition-colors hover:border-[#788c5d]/40"
              >
                <span className="font-heading text-sm font-semibold">{c.full_name}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${openId === c.client_id ? "rotate-180" : ""}`} />
              </button>
              {openId === c.client_id && <ClientDetail clientId={c.client_id} therapistId={therapistId} />}
            </div>
          ))
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

export function TherapistDashboard({
  join,
  joinGroup,
}: {
  join: (t: Therapist, bookingId: string) => void;
  joinGroup: (t: Therapist, groupSessionId: string) => void;
}) {
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
      {row && <MyClients therapistId={row.id} />}

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
      {row && <GroupSessionManager therapistId={row.id} joinGroup={joinGroup} />}
      {row && <EarningsAndPayouts therapistId={row.id} />}

      <div className="mt-6 flex items-center gap-2 rounded-xl bg-[#e8e6dc]/60 p-4 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#788c5d]" />
        Every therapist on Tubonge is verified against the Counsellors and Psychologists Board (CPB) register before going live.
      </div>
    </div>
  );
}
