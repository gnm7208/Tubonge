import { Button } from "@/components/ui/button";
import { CrisisNotice } from "@/components/CrisisNotice";
import { ArrowLeft } from "lucide-react";

export function Terms({ back }: { back: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <Button variant="ghost" onClick={back} className="mb-4 font-heading text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Terms of Service</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last updated 25 July 2026</p>

      <div className="prose-sm mt-8 space-y-6 leading-relaxed text-foreground/90">
        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">1. Not a medical emergency service</h2>
          <p className="mt-2">
            Tubonge connects you with independent, licensed therapists for scheduled online sessions. It is not a
            crisis line, emergency service, or substitute for emergency medical care. If you are in danger or crisis,
            contact the Kenya Red Cross line 1199 (toll-free) or go to your nearest hospital immediately.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">2. Therapists are independent professionals</h2>
          <p className="mt-2">
            Therapists on Tubonge are independent, licensed practitioners registered with the Counsellors and
            Psychologists Board (CPB) or an equivalent recognised body. Tubonge verifies license details before a
            therapist profile goes live, but the therapeutic relationship and clinical judgment are the therapist's
            own responsibility, not Tubonge's.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">3. Payments</h2>
          <p className="mt-2">
            Session fees are charged in full (KES) at the time of booking, processed securely via Pesapal (M-Pesa,
            card, or bank transfer). Tubonge does not store your M-Pesa PIN, card number, or bank credentials.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">4. Cancellations &amp; refunds</h2>
          <p className="mt-2">
            Free cancellation is available up to 12 hours before your scheduled session. For MVP, refunds for
            cancellations, no-shows, or payment issues are handled manually by our support team on a case-by-case
            basis rather than an automated reversal -- contact us to request one.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">5. Account responsibilities</h2>
          <p className="mt-2">
            You're responsible for keeping your login credentials secure and for the accuracy of information you
            provide. Therapists are responsible for the accuracy of their license, credential, and profile
            information, and for maintaining their professional registration.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">6. Acceptable use</h2>
          <p className="mt-2">
            Sessions and chat are for genuine therapeutic use between a matched client and therapist. Recording,
            sharing, or publishing session content without the other party's consent is not permitted.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">7. Changes</h2>
          <p className="mt-2">
            We may update these terms as the platform evolves. Material changes will be communicated before they
            take effect.
          </p>
        </section>
      </div>

      <CrisisNotice className="mt-8" />
    </div>
  );
}
