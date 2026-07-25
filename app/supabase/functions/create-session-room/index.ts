// Deployed via the Supabase Dashboard (Edge Functions -> Deploy a new function -> paste this file).
// Requires "Enforce JWT Verification" ON (default) -- callers must be logged-in Tubonge users
// who are a party to the booking.
//
// Secrets: DAILY_API_KEY (from https://dashboard.daily.co -> Developers).
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase.
//
// Rooms are created with privacy "public" (an unguessable uuid-based room name, not listed
// anywhere) rather than "private" -- private rooms need Daily meeting tokens per participant,
// which is more machinery than an MVP needs. Fine for now; revisit before a real launch.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DAILY_API_KEY = Deno.env.get("DAILY_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) throw new Error("Not authenticated");
    const user = userData.user;

    const { bookingId } = await req.json();
    if (!bookingId) throw new Error("bookingId is required");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: booking, error: bookingErr } = await admin
      .from("bookings")
      .select("id, client_id, therapist_id, status, availability_slots(ends_at), therapists(profile_id)")
      .eq("id", bookingId)
      .single();
    if (bookingErr || !booking) throw new Error("Booking not found");

    const isClient = booking.client_id === user.id;
    const isTherapist = (booking as any).therapists?.profile_id === user.id;
    if (!isClient && !isTherapist) throw new Error("You are not part of this booking");
    if (booking.status !== "confirmed") throw new Error("This session isn't confirmed yet");

    const { data: existing } = await admin
      .from("sessions")
      .select("video_room_url")
      .eq("booking_id", bookingId)
      .maybeSingle();
    if (existing?.video_room_url) {
      return new Response(JSON.stringify({ room_url: existing.video_room_url }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const slotEndsAt = (booking as any).availability_slots?.ends_at;
    const exp = slotEndsAt
      ? Math.floor(new Date(slotEndsAt).getTime() / 1000) + 60 * 60 // slot end + 1h buffer
      : Math.floor(Date.now() / 1000) + 2 * 60 * 60;

    const roomRes = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${DAILY_API_KEY}` },
      body: JSON.stringify({
        name: `tubonge-${bookingId}`,
        privacy: "public",
        properties: { exp, enable_chat: false, enable_screenshare: true, enable_knocking: false },
      }),
    });
    const room = await roomRes.json();
    if (!room.url) throw new Error(room.error ? `Daily.co: ${room.info ?? room.error}` : "Could not create video room");

    const { error: upsertErr } = await admin
      .from("sessions")
      .upsert({ booking_id: bookingId, video_room_url: room.url }, { onConflict: "booking_id" });
    if (upsertErr) throw new Error(upsertErr.message);

    return new Response(JSON.stringify({ room_url: room.url }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
