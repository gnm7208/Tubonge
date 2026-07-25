// Deployed via the Supabase Dashboard (Edge Functions -> Deploy a new function -> paste this file).
// Requires "Enforce JWT Verification" ON (default) -- callers must be logged-in Tubonge clients.
//
// Secrets: DAILY_API_KEY (shared with create-session-room).
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase.
//
// Capacity is enforced atomically by the join_group_session() Postgres function (see
// 0013_group_sessions.sql), called here through a user-scoped client so auth.uid() resolves
// correctly inside it. Unlike 1:1 sessions (one Daily room per booking), a group's room is
// created once, lazily, on whichever RSVP happens to be first, and reused by every attendee.

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

    const { groupSessionId } = await req.json();
    if (!groupSessionId) throw new Error("groupSessionId is required");

    const { data: joinRows, error: joinErr } = await userClient.rpc("join_group_session", { g_id: groupSessionId });
    if (joinErr) throw new Error(joinErr.message);
    const existingUrl = joinRows?.[0]?.video_room_url as string | null | undefined;
    if (existingUrl) {
      return new Response(JSON.stringify({ room_url: existingUrl }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: group } = await admin.from("group_sessions").select("ends_at").eq("id", groupSessionId).single();
    const exp = group?.ends_at
      ? Math.floor(new Date(group.ends_at).getTime() / 1000) + 60 * 60 // group end + 1h buffer
      : Math.floor(Date.now() / 1000) + 2 * 60 * 60;

    const roomRes = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${DAILY_API_KEY}` },
      body: JSON.stringify({
        name: `tubonge-group-${groupSessionId}`,
        privacy: "public",
        properties: { exp, enable_chat: false, enable_screenshare: true, enable_knocking: false },
      }),
    });
    const room = await roomRes.json();
    if (!room.url) throw new Error(room.error ? `Daily.co: ${room.info ?? room.error}` : "Could not create video room");

    // Only the first joiner's room creation wins the write -- if a concurrent request beat us
    // to it, fall back to whatever url is already stored rather than orphaning a second room.
    const { data: updated } = await admin
      .from("group_sessions")
      .update({ video_room_url: room.url })
      .eq("id", groupSessionId)
      .is("video_room_url", null)
      .select("video_room_url")
      .maybeSingle();

    let finalUrl = updated?.video_room_url ?? null;
    if (!finalUrl) {
      const { data: refetched } = await admin.from("group_sessions").select("video_room_url").eq("id", groupSessionId).single();
      finalUrl = refetched?.video_room_url ?? room.url;
    }

    return new Response(JSON.stringify({ room_url: finalUrl }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
