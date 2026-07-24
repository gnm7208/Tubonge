import { useEffect, useState } from "react";
import type { View } from "@/App";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

type Status = "checking" | "success" | "failed" | "timeout";

export function PaymentReturn({ orderTrackingId, go }: { orderTrackingId: string; go: (v: View) => void }) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let active = true;
    let attempts = 0;

    const check = async () => {
      attempts += 1;
      const { data } = await supabase
        .from("payments")
        .select("status")
        .eq("provider_ref", orderTrackingId)
        .maybeSingle();

      if (!active) return;
      if (data?.status === "success") return setStatus("success");
      if (data?.status === "failed") return setStatus("failed");
      if (attempts >= 20) return setStatus("timeout"); // ~60s of polling
      setTimeout(check, 3000);
    };

    check();
    return () => {
      active = false;
    };
  }, [orderTrackingId]);

  if (status === "checking") {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#d97757]" />
        <h1 className="mt-4 font-heading text-xl font-semibold">Confirming your payment…</h1>
        <p className="mt-2 text-sm text-muted-foreground">This usually takes a few seconds. Don't close this page.</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-[#788c5d]" />
        <h1 className="mt-4 font-heading text-xl font-semibold">Payment confirmed</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your session is booked.</p>
        <Button onClick={() => go("dashboard")} className="mt-6 bg-[#141413] font-heading text-white hover:bg-[#141413]/90">
          Go to my sessions
        </Button>
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="mx-auto max-w-md px-5 py-24 text-center">
        <XCircle className="mx-auto h-12 w-12 text-destructive" />
        <h1 className="mt-4 font-heading text-xl font-semibold">Payment didn't go through</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your slot has been released. You can try again.</p>
        <Button onClick={() => go("browse")} className="mt-6 bg-[#141413] font-heading text-white hover:bg-[#141413]/90">
          Find a therapist
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 py-24 text-center">
      <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
      <h1 className="mt-4 font-heading text-xl font-semibold">Still confirming</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This is taking longer than usual. Check "My sessions" in a moment — we'll update it as soon as Pesapal confirms.
      </p>
      <Button onClick={() => go("dashboard")} className="mt-6 bg-[#141413] font-heading text-white hover:bg-[#141413]/90">
        Go to my sessions
      </Button>
    </div>
  );
}
