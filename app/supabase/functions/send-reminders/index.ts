// Deployed via the Supabase Dashboard (Edge Functions -> Deploy a new function -> paste this file).
// IMPORTANT: turn "Enforce JWT Verification" OFF -- this is called by pg_cron (via pg_net), which
// has no Supabase user session. Instead it's protected by a shared secret header, `x-cron-secret`,
// set to match the value hardcoded into 0010_session_reminders.sql's cron.schedule() call.
//
// Secrets: CRON_SECRET (must match the migration), RESEND_API_KEY, SITE_URL.
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CRON_SECRET = Deno.env.get("CRON_SECRET");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = Deno.env.get("SITE_URL") ?? "http://localhost:5183";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function sendEmail(to: string | null | undefined, subject: string, html: string) {
  if (!RESEND_API_KEY || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Tubonge <onboarding@resend.dev>", to: [to], subject, html }),
    });
  } catch (e) {
    console.error("sendEmail failed", e);
  }
}

Deno.serve(async (req) => {
  if (CRON_SECRET && req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Reminder window: sessions starting 50-70 minutes from now that haven't been reminded yet.
  // (Cron runs every 15 min, so this window comfortably covers every booking exactly once.)
  const now = Date.now();
  const windowStart = new Date(now + 50 * 60_000).toISOString();
  const windowEnd = new Date(now + 70 * 60_000).toISOString();

  const { data: bookings, error } = await admin
    .from("bookings")
    .select("id, profiles(full_name, email), therapists(profiles(full_name)), availability_slots!inner(starts_at)")
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .gte("availability_slots.starts_at", windowStart)
    .lte("availability_slots.starts_at", windowEnd);

  if (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  let sent = 0;
  for (const b of bookings ?? []) {
    const clientEmail = (b as any).profiles?.email;
    const clientName = (b as any).profiles?.full_name ?? "there";
    const therapistName = (b as any).therapists?.profiles?.full_name ?? "your therapist";
    const startsAt = (b as any).availability_slots?.starts_at;
    const whenLabel = startsAt
      ? new Date(startsAt).toLocaleTimeString("en-KE", { hour: "numeric", minute: "2-digit" })
      : "soon";

    await sendEmail(
      clientEmail,
      "Your Tubonge session starts in about an hour",
      `<p>Hi ${clientName},</p>
       <p>Just a reminder: your session with <strong>${therapistName}</strong> starts at
       <strong>${whenLabel}</strong> (about an hour from now).</p>
       <p>Join from <a href="${SITE_URL}">My sessions</a> when it's time.</p>`
    );

    await admin.from("bookings").update({ reminder_sent_at: new Date().toISOString() }).eq("id", b.id);
    sent++;
  }

  return new Response(JSON.stringify({ sent }), { headers: { "Content-Type": "application/json" } });
});
