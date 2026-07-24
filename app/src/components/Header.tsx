import type { View } from "@/App";
import { Button } from "@/components/ui/button";
import { MessageCircleHeart } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function Header({ view, go }: { view: View; go: (v: View) => void }) {
  const { profile, signOut } = useAuth();
  const nav: { label: string; v: View }[] = [
    { label: "Find a therapist", v: "browse" },
    { label: "My sessions", v: "dashboard" },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <button onClick={() => go("landing")} className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#d97757] text-white">
            <MessageCircleHeart className="h-5 w-5" />
          </span>
          <span className="font-heading text-xl font-semibold tracking-tight">Tubonge</span>
        </button>
        <nav className="hidden items-center gap-1 sm:flex">
          {nav.map((n) => (
            <button
              key={n.v}
              onClick={() => go(n.v)}
              className={`rounded-md px-3 py-2 text-sm font-heading transition-colors ${
                view === n.v ? "text-[#d97757]" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {n.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {profile ? (
            <>
              <span className="hidden font-heading text-sm text-muted-foreground sm:inline">{profile.full_name}</span>
              <Button variant="ghost" onClick={() => signOut().then(() => go("landing"))} className="font-heading">
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => go("login")} className="hidden font-heading sm:inline-flex">Log in</Button>
              <Button onClick={() => go("signup")} className="bg-[#141413] font-heading text-white hover:bg-[#141413]/90">
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
