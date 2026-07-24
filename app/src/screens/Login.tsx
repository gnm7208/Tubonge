import { useState } from "react";
import type { View } from "@/App";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageCircleHeart } from "lucide-react";

export function Login({ go }: { go: (v: View) => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    go("dashboard");
  };

  return (
    <div className="mx-auto max-w-md px-5 py-12">
      <div className="mb-6 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#d97757] text-white">
          <MessageCircleHeart className="h-5 w-5" />
        </span>
        <span className="font-heading text-xl font-semibold tracking-tight">Tubonge</span>
      </div>
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-muted-foreground">Log in to continue your care.</p>

      <form onSubmit={submit} className="mt-6 grid gap-4">
        <div>
          <Label htmlFor="email" className="font-heading text-sm">Email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 font-body" />
        </div>
        <div>
          <Label htmlFor="password" className="font-heading text-sm">Password</Label>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5 font-body" />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={submitting} className="bg-[#d97757] font-heading text-white hover:bg-[#c9663f]">
          {submitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        New to Tubonge?{" "}
        <button onClick={() => go("signup")} className="font-heading text-[#d97757] underline">Create an account</button>
      </p>
    </div>
  );
}
