import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function PrivacyPolicy({ back }: { back: () => void }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <Button variant="ghost" onClick={back} className="mb-4 font-heading text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Privacy Policy</h1>
      <p className="mt-1 text-sm text-muted-foreground">Last updated 25 July 2026</p>

      <div className="prose-sm mt-8 space-y-6 leading-relaxed text-foreground/90">
        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">1. Who we are</h2>
          <p className="mt-2">
            Tubonge ("we", "us") operates an online platform connecting clients in Kenya with licensed therapists for
            video and chat-based therapy sessions. This policy explains what personal data we collect, why, and how
            it's protected, in line with Kenya's Data Protection Act (2019).
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">2. What we collect</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Account details: full name, email, phone number, password (stored hashed, we never see it in plain text).</li>
            <li>Therapist-specific: license number, licensing body, professional bio, credential documents.</li>
            <li>Booking &amp; payment: session bookings, payment method and receipt references. We never receive or store your M-Pesa PIN or full card number -- those are handled directly by our payment processor, Pesapal.</li>
            <li>Session content: in-session and async chat messages, and (for therapists only) private clinical notes about a session.</li>
            <li>Usage data: basic device/browser information for security and reliability.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">3. Why we collect it</h2>
          <p className="mt-2">
            To create and run your account, match you with a therapist, process bookings and payments, enable video
            and chat sessions, verify therapist licensing, and communicate booking confirmations and reminders. We do
            not sell your data, and we do not use your health-related information for advertising.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">4. Health data is sensitive</h2>
          <p className="mt-2">
            Information about your mental health -- including chat messages, session notes, and anything you share
            in a session -- is treated as sensitive personal data. It is encrypted in transit and at rest, and access
            is restricted by our systems so that only you and your matched therapist can read your session content.
            Therapist clinical notes are visible only to that therapist -- not to you, not to other therapists, and
            not to Tubonge staff except where legally required.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">5. Who can see what</h2>
          <p className="mt-2">
            Clients and therapists can only see data related to their own bookings. Admin staff can access therapist
            verification documents (to confirm licensing) and booking/payment records (to handle support and
            refunds), but not private session notes or the content of your chat messages beyond what's needed to
            resolve a specific support issue.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">6. Your rights</h2>
          <p className="mt-2">
            Under the Data Protection Act, you can request a copy of your data, ask us to correct inaccurate data, or
            request deletion of your account and associated data (subject to legal/financial record-keeping
            requirements for completed payments). Contact us to exercise these rights.
          </p>
        </section>

        <section>
          <h2 className="font-heading text-lg font-semibold text-foreground">7. Contact</h2>
          <p className="mt-2">
            Questions about this policy or your data can be sent to <span className="font-heading">privacy@tubonge.example</span>.
          </p>
        </section>
      </div>
    </div>
  );
}
