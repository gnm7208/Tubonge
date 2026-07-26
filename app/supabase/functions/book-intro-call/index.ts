// Deployed via the Supabase Dashboard (Edge Functions -> Deploy a new function -> paste this file).
// Requires "Enforce JWT Verification" ON (default) -- callers must be logged-in Tubonge clients.
//
// No provider secrets needed -- this path skips Pesapal entirely (amount_kes = 0, status goes
// straight to 'confirmed', no payments row). SUPABASE_URL / SUPABASE_ANON_KEY /
// SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { slotId } = await req.json();
    if (!slotId) throw new Error("slotId is required");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: slot, error: slotErr } = await admin
      .from("availability_slots")
      .select("id, therapist_id, status")
      .eq("id", slotId)
      .single();
    if (slotErr || !slot) throw new Error("Slot not found");

    // Atomically hold the slot -- same pattern as create-payment -- so it can't double-book.
    const { data: heldSlot, error: holdErr } = await admin
      .from("availability_slots")
      .update({ status: "held" })
      .eq("id", slotId)
      .eq("status", "open")
      .select()
      .maybeSingle();
    if (holdErr || !heldSlot) throw new Error("That slot was just taken -- please pick another time.");

    const { data: booking, error: bookingErr } = await admin
      .from("bookings")
      .insert({
        client_id: user.id,
        therapist_id: slot.therapist_id,
        slot_id: slot.id,
        amount_kes: 0,
        status: "confirmed",
        is_intro: true,
      })
      .select()
      .single();
    if (bookingErr) {
      await admin.from("availability_slots").update({ status: "open" }).eq("id", slotId);
      if (bookingErr.code === "23505") throw new Error("You've already used your free intro call with this therapist.");
      throw new Error(bookingErr.message);
    }

    // Unlike the paid flow (where pesapal-ipn flips held -> booked on payment success), there's
    // no webhook here -- the booking is already confirmed, so mark the slot booked immediately.
    await admin.from("availability_slots").update({ status: "booked" }).eq("id", slotId);

    return new Response(JSON.stringify({ booking_id: booking.id }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
