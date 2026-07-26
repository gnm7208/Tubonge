import { useEffect, useState } from "react";
import type { View } from "@/App";
import type { Therapist } from "@/data/mock";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { slotLabel, initialsOf, accentFor } from "@/lib/therapists";
import { canJoinSession } from "@/lib/sessionTiming";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Video, CheckCircle2 } from "lucide-react";

type GroupListRow = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number;
  therapists: { id: string; title: string; profiles: { full_name: string } | null } | null;
  group_session_attendees: { client_id: string }[];
};

export function Groups({ go, joinGroup }: { go: (v: View) => void; joinGroup: (t: Therapist, groupSessionId: string) => void }) {
  const { profile } = useAuth();
  const [groups, setGroups] = useState<GroupListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    supabase
      .from("group_sessions")
      .select("id, title, description, starts_at, ends_at, capacity, therapists(id, title, profiles(full_name)), group_session_attendees(client_id)")
      .eq("status", "scheduled")
      .gt("ends_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .then(({ data }) => {
        setGroups((data as unknown as GroupListRow[]) ?? []);
        setLoading(false);
      });
  };

  useEffect(load, []);

  const enter = (g: GroupListRow) => {
    const facilitator = g.therapists?.profiles?.full_name ?? "Therapist";
    const id = g.therapists?.id ?? g.id;
    const t: Therapist = {
      id, name: g.title, title: g.therapists?.title || "Therapist", specialties: [], languages: [], years: 0, rate: 0,
      rating: 0, reviews: 0, verified: true, bio: "", initials: initialsOf(facilitator), accent: accentFor(id), avatarUrl: null, nextSlots: [],
    };
    joinGroup(t, g.id);
  };

  const rsvp = async (g: GroupListRow) => {
    if (!profile) {
      go("login");
      return;
    }
    setJoiningId(g.id);
    setError(null);
    const { data, error } = await supabase.functions.invoke("join-group-session", { body: { groupSessionId: g.id } });
    setJoiningId(null);
    if (error || data?.error) {
      setError(data?.error ?? error?.message ?? "Could not join this group.");
      return;
    }
    load();
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Group sessions</h1>
      <p className="mt-1 text-muted-foreground">Free, therapist-led groups. Open to everyone -- no booking or payment needed.</p>

      {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : groups.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-muted-foreground">No group sessions scheduled right now -- check back soon.</p>
          </div>
        ) : (
          groups.map((g) => {
            const name = g.therapists?.profiles?.full_name ?? "Therapist";
            const spotsLeft = g.capacity - g.group_session_attendees.length;
            const attending = profile ? g.group_session_attendees.some((a) => a.client_id === profile.id) : false;
            const joinable = canJoinSession(g.starts_at, g.ends_at);
            return (
              <div key={g.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-heading font-semibold">{g.title}</p>
                    <p className="text-sm text-muted-foreground">with {name}</p>
                    {g.description && <p className="mt-1 text-sm text-muted-foreground">{g.description}</p>}
                    <p className="mt-1.5 flex items-center gap-1.5 font-heading text-sm">
                      <Calendar className="h-4 w-4 text-[#788c5d]" /> {slotLabel(g.starts_at)}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left` : "Full"}
                    </p>
                  </div>
                  {attending ? (
                    joinable ? (
                      <Button onClick={() => enter(g)} className="bg-[#6a9bcc] font-heading text-white hover:bg-[#5b89b8]">
                        <Video className="mr-1.5 h-4 w-4" /> Join
                      </Button>
                    ) : (
                      <span className="flex items-center gap-1.5 font-heading text-sm text-[#4f6138]">
                        <CheckCircle2 className="h-4 w-4" /> You're in
                      </span>
                    )
                  ) : (
                    <Button
                      disabled={spotsLeft <= 0 || joiningId === g.id}
                      onClick={() => rsvp(g)}
                      className="bg-[#d97757] font-heading text-white hover:bg-[#c9663f]"
                    >
                      {joiningId === g.id ? "Joining…" : spotsLeft <= 0 ? "Full" : profile ? "RSVP" : "Log in to RSVP"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
