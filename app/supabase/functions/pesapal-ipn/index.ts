// Deployed via the Supabase Dashboard (Edge Functions -> Deploy a new function -> paste this file).
// IMPORTANT: turn "Enforce JWT Verification" OFF for this function -- Pesapal's servers call it
// directly with no Supabase auth token. This is the URL you register with Pesapal's RegisterIPN
// endpoint (see README): https://<project-ref>.supabase.co/functions/v1/pesapal-ipn
//
// Secrets: PESAPAL_CONSUMER_KEY, PESAPAL_CONSUMER_SECRET, PESAPAL_ENV.
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PESAPAL_ENV = Deno.env.get("PESAPAL_ENV") ?? "sandbox";
const PESAPAL_BASE =
  PESAPAL_ENV === "production" ? "https://pay.pesapal.com/v3" : "https://cybqa.pesapal.com/pesapalv3";
const CONSUMER_KEY = Deno.env.get("PESAPAL_CONSUMER_KEY")!;
const CONSUMER_SECRET = Deno.env.get("PESAPAL_CONSUMER_SECRET")!;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
  const url = new URL(req.url);
  const orderTrackingId = url.searchParams.get("OrderTrackingId");
  const orderMerchantReference = url.searchParams.get("OrderMerchantReference");
  const orderNotificationType = url.searchParams.get("OrderNotificationType") ?? "IPNCHANGE";

  const ack = (status: number) =>
    new Response(JSON.stringify({ orderNotificationType, orderTrackingId, orderMerchantReference, status }), {
      headers: { "Content-Type": "application/json" },
    });

  if (!orderTrackingId) return ack(200);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  try {
    const { data: payment } = await admin
      .from("payments")
      .select("id, booking_id, status")
      .eq("provider_ref", orderTrackingId)
      .maybeSingle();

    // Untracked order, or already processed -- ack without reprocessing (idempotent).
    if (!payment || payment.status === "success" || payment.status === "failed") return ack(200);

    const token = await getPesapalToken();
    const statusRes = await fetch(
      `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } }
    );
    const statusData = await statusRes.json();

    const { data: booking } = await admin
      .from("bookings")
      .select("id, slot_id")
      .eq("id", payment.booking_id)
      .single();

    // Pesapal's live API has been observed returning title-case ("Failed") even though some of
    // their docs show upper-case ("FAILED") -- normalize before comparing.
    const desc = String(statusData.payment_status_description ?? "").toUpperCase();

    if (desc === "COMPLETED") {
      await admin
        .from("payments")
        .update({ status: "success", receipt: statusData.confirmation_code, raw_callback: statusData })
        .eq("id", payment.id);
      await admin.from("bookings").update({ status: "confirmed" }).eq("id", payment.booking_id);
      if (booking) await admin.from("availability_slots").update({ status: "booked" }).eq("id", booking.slot_id);
    } else if (["FAILED", "INVALID", "REVERSED"].includes(desc)) {
      await admin.from("payments").update({ status: "failed", raw_callback: statusData }).eq("id", payment.id);
      await admin.from("bookings").update({ status: "cancelled" }).eq("id", payment.booking_id);
      if (booking) await admin.from("availability_slots").update({ status: "open" }).eq("id", booking.slot_id);
    }
    // else: still pending -- leave as-is, a later IPN call or the client's status poll will resolve it.

    return ack(200);
  } catch (e) {
    console.error(e);
    return ack(200); // always ack so Pesapal doesn't retry forever; error is logged server-side
  }
});
