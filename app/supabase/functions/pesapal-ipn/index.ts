// Deployed via the Supabase Dashboard (Edge Functions -> Deploy a new function -> paste this file).
// IMPORTANT: turn "Enforce JWT Verification" OFF for this function -- Pesapal's servers call it
// directly with no Supabase auth token. This is the URL you register with Pesapal's RegisterIPN
// endpoint (see README): https://<project-ref>.supabase.co/functions/v1/pesapal-ipn
//
// Secrets: PESAPAL_CONSUMER_KEY, PESAPAL_CONSUMER_SECRET, PESAPAL_ENV, RESEND_API_KEY, SITE_URL.
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected by Supabase.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const PESAPAL_ENV = Deno.env.get("PESAPAL_ENV") ?? "sandbox";
const PESAPAL_BASE =
  PESAPAL_ENV === "production" ? "https://pay.pesapal.com/v3" : "https://cybqa.pesapal.com/pesapalv3";
const CONSUMER_KEY = Deno.env.get("PESAPAL_CONSUMER_KEY")!;
const CONSUMER_SECRET = Deno.env.get("PESAPAL_CONSUMER_SECRET")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = Deno.env.get("SITE_URL") ?? "http://localhost:5183";

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

async function sendEmail(to: string | null | undefined, subject: string, html: string) {
  if (!RESEND_API_KEY || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Tubonge <onboarding@resend.dev>", to: [to], subject, html }),
    });
  } catch (e) {
    console.error("sendEmail failed", e); // never let a notification failure break the payment flow
  }
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
      .select("id, booking_id, status, amount_kes")
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
      .select(
        "id, slot_id, client_id, profiles(full_name, email), therapists(profiles(full_name)), availability_slots(starts_at)"
      )
      .eq("id", payment.booking_id)
      .single();

    // Pesapal's live API has been observed returning title-case ("Failed") even though some of
    // their docs show upper-case ("FAILED") -- normalize before comparing.
    const desc = String(statusData.payment_status_description ?? "").toUpperCase();

    const clientEmail = (booking as any)?.profiles?.email;
    const clientName = (booking as any)?.profiles?.full_name ?? "there";
    const therapistName = (booking as any)?.therapists?.profiles?.full_name ?? "your therapist";
    const startsAt = (booking as any)?.availability_slots?.starts_at;
    const whenLabel = startsAt
      ? new Date(startsAt).toLocaleString("en-KE", { weekday: "long", hour: "numeric", minute: "2-digit", month: "long", day: "numeric" })
      : "your booked time";

    if (desc === "COMPLETED") {
      await admin
        .from("payments")
        .update({ status: "success", receipt: statusData.confirmation_code, raw_callback: statusData })
        .eq("id", payment.id);
      await admin.from("bookings").update({ status: "confirmed" }).eq("id", payment.booking_id);
      if (booking) await admin.from("availability_slots").update({ status: "booked" }).eq("id", (booking as any).slot_id);

      await sendEmail(
        clientEmail,
        "Your Tubonge session is confirmed",
        `<p>Hi ${clientName},</p>
         <p>Your session with <strong>${therapistName}</strong> on <strong>${whenLabel}</strong> is confirmed.
         We've received your payment of KES ${payment.amount_kes.toLocaleString()}.</p>
         <p>You can join the session from <a href="${SITE_URL}">My sessions</a> once it's time.</p>
         <p style="color:#888;font-size:12px">If you're in crisis, call the Kenya Red Cross line 1199 (toll-free).</p>`
      );
    } else if (["FAILED", "INVALID", "REVERSED"].includes(desc)) {
      await admin.from("payments").update({ status: "failed", raw_callback: statusData }).eq("id", payment.id);
      await admin.from("bookings").update({ status: "cancelled" }).eq("id", payment.booking_id);
      if (booking) await admin.from("availability_slots").update({ status: "open" }).eq("id", (booking as any).slot_id);

      await sendEmail(
        clientEmail,
        "Your Tubonge payment didn't go through",
        `<p>Hi ${clientName},</p>
         <p>Your payment for a session with <strong>${therapistName}</strong> didn't go through, so the slot has
         been released. No charge was completed.</p>
         <p>You're welcome to try booking again from <a href="${SITE_URL}">Tubonge</a>.</p>`
      );
    }
    // else: still pending -- leave as-is, a later IPN call or the client's status poll will resolve it.

    return ack(200);
  } catch (e) {
    console.error(e);
    return ack(200); // always ack so Pesapal doesn't retry forever; error is logged server-side
  }
});
