import { useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Landing } from "@/screens/Landing";
import { Browse } from "@/screens/Browse";
import { TherapistProfile } from "@/screens/TherapistProfile";
import { BookingScreen } from "@/screens/Booking";
import { ClientDashboard } from "@/screens/ClientDashboard";
import { TherapistDashboard } from "@/screens/TherapistDashboard";
import { AdminDashboard } from "@/screens/AdminDashboard";
import { SessionRoom } from "@/screens/SessionRoom";
import { SignUp } from "@/screens/SignUp";
import { Login } from "@/screens/Login";
import { Header } from "@/components/Header";
import type { Therapist } from "@/data/mock";

export type View = "landing" | "browse" | "profile" | "booking" | "dashboard" | "session" | "login" | "signup";

function AppShell() {
  const [view, setView] = useState<View>("landing");
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [slot, setSlot] = useState<string>("");
  const { loading, profile } = useAuth();

  const go = (v: View) => { window.scrollTo(0, 0); setView(v); };

  const openProfile = (t: Therapist) => { setTherapist(t); go("profile"); };
  const startBooking = (t: Therapist, s?: string) => { setTherapist(t); if (s) setSlot(s); go("booking"); };

  const showHeader = view !== "landing" && view !== "session" && view !== "login" && view !== "signup";

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {showHeader && <Header view={view} go={go} />}

      {view === "landing" && <Landing go={go} openProfile={openProfile} />}
      {view === "browse" && <Browse openProfile={openProfile} startBooking={startBooking} />}
      {view === "profile" && therapist && (
        <TherapistProfile therapist={therapist} onBook={(s) => startBooking(therapist, s)} back={() => go("browse")} />
      )}
      {view === "booking" && therapist && (
        <BookingScreen therapist={therapist} slot={slot} setSlot={setSlot} onPaid={() => go("dashboard")} back={() => go("profile")} />
      )}
      {view === "dashboard" && (
        loading ? (
          <div className="mx-auto max-w-3xl px-5 py-20 text-center text-muted-foreground">Loading…</div>
        ) : !profile ? (
          <div className="mx-auto max-w-md px-5 py-20 text-center">
            <p className="text-muted-foreground">Log in to see your sessions.</p>
            <button onClick={() => go("login")} className="mt-3 font-heading text-[#d97757] underline">Log in</button>
          </div>
        ) : profile.role === "therapist" ? (
          <TherapistDashboard />
        ) : profile.role === "admin" ? (
          <AdminDashboard />
        ) : (
          <ClientDashboard go={go} therapist={therapist} slot={slot} join={() => go("session")} />
        )
      )}
      {view === "session" && therapist && (
        <SessionRoom therapist={therapist} end={() => go("dashboard")} />
      )}
      {view === "login" && <Login go={go} />}
      {view === "signup" && <SignUp go={go} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
