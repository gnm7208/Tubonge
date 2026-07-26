import { useEffect, useRef, useState } from "react";
import DailyIframe, { type DailyCall } from "@daily-co/daily-js";
import type { Therapist } from "@/data/mock";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { initialsOf, accentFor } from "@/lib/therapists";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PhoneOff, Send, ShieldCheck, Loader2, NotebookPen, Video, VideoOff } from "lucide-react";

type Message = { id: string; sender_id: string; body: string; created_at: string };

export function SessionRoom({
  therapist: t,
  bookingId,
  groupSessionId,
  end,
}: {
  therapist: Therapist;
  bookingId?: string;
  groupSessionId?: string;
  end: () => void;
}) {
  const { profile } = useAuth();
  const videoRef = useRef<HTMLDivElement>(null);
  const callRef = useRef<DailyCall | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  const [msgs, setMsgs] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");

  const isTherapist = profile?.role === "therapist";
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [audioOnly, setAudioOnly] = useState(false);

  // Video: create/join the Daily room
  useEffect(() => {
    let active = true;
    (async () => {
      const fn = groupSessionId ? "join-group-session" : "create-session-room";
      const body = groupSessionId ? { groupSessionId } : { bookingId };
      const { data, error } = await supabase.functions.invoke(fn, { body });
      if (!active) return;
      if (error || !data?.room_url) {
        setError(data?.error ?? error?.message ?? "Could not start the video call.");
        setStatus("error");
        return;
      }
      if (videoRef.current && !callRef.current) {
        const call = DailyIframe.createFrame(videoRef.current, {
          url: data.room_url,
          showLeaveButton: false,
          iframeStyle: { width: "100%", height: "100%", border: "0" },
        });
        callRef.current = call;
        await call.join();
      }
      setStatus("ready");
    })();
    return () => {
      active = false;
      callRef.current?.leave();
      callRef.current?.destroy();
      callRef.current = null;
    };
  }, [bookingId, groupSessionId]);

  // Chat: load history + subscribe to realtime inserts
  useEffect(() => {
    const column = groupSessionId ? "group_session_id" : "booking_id";
    const id = groupSessionId ?? bookingId;

    supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq(column, id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMsgs((data as Message[]) ?? []));

    const channel = supabase
      .channel(`${column}-${id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `${column}=eq.${id}` },
        (payload) => setMsgs((prev) => [...prev, payload.new as Message])
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, groupSessionId]);

  // Therapist-only private notes -- not applicable to group rooms (no single client to note about)
  useEffect(() => {
    if (!isTherapist || !bookingId) return;
    supabase
      .from("sessions")
      .select("id")
      .eq("booking_id", bookingId)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setSessionId(data.id);
        supabase
          .from("session_notes")
          .select("notes")
          .eq("session_id", data.id)
          .maybeSingle()
          .then(({ data: n }) => setNotes(n?.notes ?? ""));
      });
  }, [isTherapist, bookingId]);

  const send = async () => {
    if (!draft.trim() || !profile) return;
    const body = draft.trim();
    setDraft("");
    await supabase.from("messages").insert(
      groupSessionId
        ? { group_session_id: groupSessionId, sender_id: profile.id, body }
        : { booking_id: bookingId, sender_id: profile.id, body }
    );
  };

  const saveNotes = async () => {
    if (!sessionId || !profile) return;
    setNotesSaving(true);
    const { data: therapistRow } = await supabase.from("therapists").select("id").eq("profile_id", profile.id).single();
    if (therapistRow) {
      await supabase
        .from("session_notes")
        .upsert({ session_id: sessionId, therapist_id: therapistRow.id, notes }, { onConflict: "session_id" });
    }
    setNotesSaving(false);
  };

  const toggleAudioOnly = async () => {
    const next = !audioOnly;
    setAudioOnly(next);
    await callRef.current?.setLocalVideo(!next);
  };

  const leave = async () => {
    if (bookingId) {
      // Idempotent: only flips confirmed -> completed once, whichever party leaves first.
      await supabase.from("bookings").update({ status: "completed" }).eq("id", bookingId).eq("status", "confirmed");
    }
    end();
  };

  return (
    <div className="flex h-screen flex-col bg-[#141413] text-white">
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#e5484d]" />
          <span className="font-heading text-sm">Live · {t.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden font-heading text-xs text-[#b0aea5] sm:inline">In a crisis, call the Kenya Red Cross 1199 (toll-free)</span>
          <span className="flex items-center gap-1.5 font-heading text-xs text-[#b0aea5]"><ShieldCheck className="h-3.5 w-3.5 text-[#788c5d]" /> Encrypted</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 gap-4 px-5 pb-4">
        <div className="relative flex-1 overflow-hidden rounded-2xl bg-gradient-to-br from-[#26251f] to-[#141413]">
          {status !== "ready" && (
            <div className="absolute inset-0 grid place-items-center">
              {status === "loading" ? (
                <div className="text-center text-[#b0aea5]">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  <p className="mt-3 font-heading text-sm">Connecting to your session…</p>
                </div>
              ) : (
                <div className="max-w-xs text-center text-sm text-[#e5484d]">{error}</div>
              )}
            </div>
          )}
          <div ref={videoRef} className="h-full w-full" />
          {status === "ready" && audioOnly && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[#141413]">
              <div className="text-center">
                <span
                  className="mx-auto grid h-20 w-20 place-items-center rounded-full font-heading text-2xl font-semibold text-white"
                  style={{ background: accentFor(profile?.id ?? "self") }}
                >
                  {initialsOf(profile?.full_name ?? "You")}
                </span>
                <p className="mt-3 font-heading text-sm text-[#b0aea5]">Audio-only mode — your video is paused to save data</p>
              </div>
            </div>
          )}
        </div>

        <div className="hidden w-80 flex-col gap-4 md:flex">
          {isTherapist && !groupSessionId && (
            <div className="flex max-h-56 flex-col rounded-2xl bg-[#faf9f5] text-[#141413]">
              <div className="flex items-center gap-1.5 border-b border-border px-4 py-3 font-heading text-sm font-semibold">
                <NotebookPen className="h-3.5 w-3.5" /> Private notes
              </div>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={saveNotes}
                placeholder="Only you can see these notes."
                className="flex-1 resize-none rounded-none border-0 font-body focus-visible:ring-0"
              />
              {notesSaving && <p className="px-3 pb-2 text-xs text-muted-foreground">Saving…</p>}
            </div>
          )}
          <div className="flex flex-1 flex-col rounded-2xl bg-[#faf9f5] text-[#141413]">
            <div className="border-b border-border px-4 py-3 font-heading text-sm font-semibold">Chat</div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {msgs.map((m) => (
                <div key={m.id} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.sender_id === profile?.id ? "ml-auto bg-[#d97757] text-white" : "bg-[#e8e6dc]"}`}>
                  {m.body}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-border p-3">
              <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message…" className="font-body" />
              <Button size="icon" onClick={send} className="shrink-0 bg-[#d97757] hover:bg-[#c9663f]"><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 pb-6">
        {status === "ready" && (
          <Button
            onClick={toggleAudioOnly}
            variant="outline"
            className="h-12 rounded-full border-white/20 bg-white/10 px-6 font-heading text-white hover:bg-white/20"
          >
            {audioOnly ? <><Video className="mr-2 h-5 w-5" /> Turn on video</> : <><VideoOff className="mr-2 h-5 w-5" /> Audio only</>}
          </Button>
        )}
        <Button onClick={leave} className="h-12 rounded-full bg-[#e5484d] px-6 font-heading hover:bg-[#d43b40]">
          <PhoneOff className="mr-2 h-5 w-5" /> Leave
        </Button>
      </div>
    </div>
  );
}
