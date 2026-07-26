// Deployed via the Supabase Dashboard (Edge Functions -> Deploy a new function -> paste this file).
// Requires "Enforce JWT Verification" ON (default) -- callers must be logged-in Tubonge users.
//
// Secrets to set (Edge Functions -> Manage -> Secrets):
//   PESAPAL_CONSUMER_KEY, PESAPAL_CONSUMER_SECRET, PESAPAL_ENV ("sandbox" | "production"),
//   PESAPAL_IPN_ID (from registering pesapal-ipn's URL, see README), SITE_URL
// SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PESAPAL_ENV = Deno.env.get("PESAPAL_ENV") ?? "sandbox";
const PESAPAL_BASE =
  PESAPAL_ENV === "production" ? "https://pay.pesapal.com/v3" : "https://cybqa.pesapal.com/pesapalv3";
const CONSUMER_KEY = Deno.env.get("PESAPAL_CONSUMER_KEY")!;
const CONSUMER_SECRET = Deno.env.get("PESAPAL_CONSUMER_SECRET")!;
const IPN_ID = Deno.env.get("PESAPAL_IPN_ID")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "http://localhost:5183";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getPesapalToken(): Promise<string> {
  const res = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ consumer_key: CONSUMER_KEY, consumer_secret: CONSUMER_SECRET }),
  });
  const data = await res.json();
  if (!data.token) throw new Error(`Pesapal auth failed: ${JSON.stringify(data)}`);
  return data.token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) throw new Error("Not authenticated");
    const user = userData.user;

    const { slotId, method, phone } = await req.json();
    if (!slotId || !method) throw new Error("slotId and method are required");

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: slot, error: slotErr } = await admin
      .from("availability_slots")
      .select("id, therapist_id, status")
      .eq("id", slotId)
      .single();
    if (slotErr || !slot) throw new Error("Slot not found");

    const { data: therapist, error: tErr } = await admin
      .from("therapists")
      .select("id, session_rate_kes")
      .eq("id", slot.therapist_id)
      .single();
    if (tErr || !therapist) throw new Error("Therapist not found");

    const { data: profile } = await admin.from("profiles").select("email, phone, is_youth").eq("id", user.id).single();

    // Atomically hold the slot so two clients can't book the same one.
    const { data: heldSlot, error: holdErr } = await admin
      .from("availability_slots")
      .update({ status: "held" })
      .eq("id", slotId)
      .eq("status", "open")
      .select()
      .maybeSingle();
    if (holdErr || !heldSlot) throw new Error("That slot was just taken -- please pick another time.");

    // Self-declared youth pricing (ages 13-24): 50% off, same trust boundary as the
    // therapist-set session_rate_kes itself.
    const amount = profile?.is_youth ? Math.round(therapist.session_rate_kes / 2) : therapist.session_rate_kes;

    const { data: booking, error: bookingErr } = await admin
      .from("bookings")
      .insert({
        client_id: user.id,
        therapist_id: therapist.id,
        slot_id: slot.id,
        amount_kes: amount,
        status: "pending_payment",
      })
      .select()
      .single();
    if (bookingErr || !booking) {
      await admin.from("availability_slots").update({ status: "open" }).eq("id", slotId);
      throw new Error(bookingErr?.message ?? "Could not create booking");
    }

    const { data: payment, error: paymentErr } = await admin
      .from("payments")
      .insert({ booking_id: booking.id, method, amount_kes: amount, status: "pending" })
      .select()
      .single();
    if (paymentErr || !payment) {
      await admin.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
      await admin.from("availability_slots").update({ status: "open" }).eq("id", slotId);
      throw new Error(paymentErr?.message ?? "Could not create payment");
    }

    let order: { order_tracking_id?: string; redirect_url?: string; message?: string };
    try {
      const token = await getPesapalToken();
      const orderRes = await fetch(`${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: booking.id,
          currency: "KES",
          amount,
          description: "Tubonge therapy session",
          callback_url: SITE_URL,
          notification_id: IPN_ID,
          billing_address: {
            email_address: profile?.email ?? undefined,
            phone_number: phone ?? profile?.phone ?? undefined,
          },
        }),
      });
      order = await orderRes.json();
      if (!order.order_tracking_id) throw new Error(order.message ?? "Pesapal order submission failed");
    } catch (e) {
      await admin.from("payments").update({ status: "failed" }).eq("id", payment.id);
      await admin.from("bookings").update({ status: "cancelled" }).eq("id", booking.id);
      await admin.from("availability_slots").update({ status: "open" }).eq("id", slotId);
      throw e;
    }

    await admin.from("payments").update({ provider_ref: order.order_tracking_id }).eq("id", payment.id);

    return new Response(
      JSON.stringify({ redirect_url: order.redirect_url, order_tracking_id: order.order_tracking_id, booking_id: booking.id }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
