import { useState } from "react";
import type { View } from "@/App";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, User, Stethoscope, MessageCircleHeart } from "lucide-react";
import type { UserRole } from "@/lib/database.types";

export function SignUp({ go }: { go: (v: View) => void }) {
  const { signUp } = useAuth();
  const [role, setRole] = useState<Extract<UserRole, "client" | "therapist">>("client");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isYouth, setIsYouth] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError("Please accept the privacy policy to continue.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error, needsEmailConfirmation } = await signUp({ fullName, email, phone, password, role, isYouth: role === "client" && isYouth });
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    if (needsEmailConfirmation) {
      setAwaitingConfirmation(true);
      return;
    }
    go("dashboard");
  };

  if (awaitingConfirmation) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-[#788c5d]" />
        <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight">Check your email</h1>
        <p className="mt-2 text-muted-foreground">
          We sent a confirmation link to <span className="font-heading font-medium text-foreground">{email}</span>. Confirm it, then log in.
        </p>
        <Button onClick={() => go("login")} className="mt-6 bg-[#141413] font-heading text-white hover:bg-[#141413]/90">
          Go to log in
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 py-12">
      <div className="mb-6 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#d97757] text-white">
          <MessageCircleHeart className="h-5 w-5" />
        </span>
        <span className="font-heading text-xl font-semibold tracking-tight">Tubonge</span>
      </div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Start your journey with a licensed Kenyan therapist.</p>

      <div className="mt-6 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setRole("client")}
          className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${role === "client" ? "border-[#141413] bg-[#141413]/[0.03]" : "border-border hover:border-[#141413]/30"}`}
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#6a9bcc] text-white"><User className="h-4 w-4" /></span>
          <span className="font-heading text-sm font-semibold">I'm seeking therapy</span>
        </button>
        <button
          type="button"
          onClick={() => setRole("therapist")}
          className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors ${role === "therapist" ? "border-[#141413] bg-[#141413]/[0.03]" : "border-border hover:border-[#141413]/30"}`}
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#788c5d] text-white"><Stethoscope className="h-4 w-4" /></span>
          <span className="font-heading text-sm font-semibold">I'm a therapist</span>
        </button>
      </div>

      <form onSubmit={submit} className="mt-6 grid gap-4">
        <div>
          <Label htmlFor="fullName" className="font-heading text-sm">Full name</Label>
          <Input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5 font-body" />
        </div>
        <div>
          <Label htmlFor="email" className="font-heading text-sm">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 font-body" />
        </div>
        <div>
          <Label htmlFor="phone" className="font-heading text-sm">Phone number</Label>
          <Input id="phone" required placeholder="0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5 font-body" />
        </div>
        <div>
          <Label htmlFor="password" className="font-heading text-sm">Password</Label>
          <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 font-body" />
        </div>

        {role === "client" && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <input id="isYouth" type="checkbox" checked={isYouth} onChange={(e) => setIsYouth(e.target.checked)} className="mt-0.5" />
            <label htmlFor="isYouth">I'm between 13–24 — get 50% off every session.</label>
          </div>
        )}

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <input id="consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
          <label htmlFor="consent">
            I agree to the{" "}
            <button type="button" onClick={(e) => { e.stopPropagation(); go("privacy"); }} className="underline hover:text-foreground">Privacy Policy</button>{" "}
            and{" "}
            <button type="button" onClick={(e) => { e.stopPropagation(); go("terms"); }} className="underline hover:text-foreground">Terms of Service</button>,
            and consent to my data being processed to provide therapy services, per Kenya's Data Protection Act.
          </label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={submitting} className="bg-[#d97757] font-heading text-white hover:bg-[#c9663f]">
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-[#788c5d]" /> Your data is encrypted and kept private.
      </p>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button onClick={() => go("login")} className="font-heading text-[#d97757] underline">Log in</button>
      </p>
    </div>
  );
}
