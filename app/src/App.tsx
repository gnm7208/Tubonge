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
import { PaymentReturn } from "@/screens/PaymentReturn";
import { PrivacyPolicy } from "@/screens/PrivacyPolicy";
import { Terms } from "@/screens/Terms";
import { MatchQuiz, type QuizAnswers } from "@/screens/MatchQuiz";
import { MatchResults } from "@/screens/MatchResults";
import { Header } from "@/components/Header";
import type { Therapist, Slot } from "@/data/mock";

export type View = "landing" | "browse" | "profile" | "booking" | "dashboard" | "session" | "login" | "signup" | "payment-return" | "privacy" | "terms" | "match-quiz" | "match-results";

function initialOrderTrackingId(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("OrderTrackingId");
}

function AppShell() {
  const returningOrderTrackingId = useState(initialOrderTrackingId)[0];
  const [view, setView] = useState<View>(returningOrderTrackingId ? "payment-return" : "landing");
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [sessionBookingId, setSessionBookingId] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswers | null>(null);
  const { loading, profile } = useAuth();

  const go = (v: View) => {
    if (window.location.search) window.history.replaceState({}, "", window.location.pathname);
    window.scrollTo(0, 0);
    setView(v);
  };

  const openProfile = (t: Therapist) => { setTherapist(t); go("profile"); };
  const startBooking = (t: Therapist, s?: Slot) => { setTherapist(t); setSlot(s ?? null); go("booking"); };
  const joinSession = (t: Therapist, bookingId: string) => { setTherapist(t); setSessionBookingId(bookingId); go("session"); };

  const showHeader = view !== "landing" && view !== "session" && view !== "login" && view !== "signup" && view !== "payment-return" && view !== "match-quiz";

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      {showHeader && <Header view={view} go={go} />}

      {view === "landing" && <Landing go={go} openProfile={openProfile} />}
      {view === "browse" && <Browse go={go} openProfile={openProfile} startBooking={startBooking} />}
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
          <TherapistDashboard join={joinSession} />
        ) : profile.role === "admin" ? (
          <AdminDashboard />
        ) : (
          <ClientDashboard go={go} join={joinSession} />
        )
      )}
      {view === "session" && therapist && sessionBookingId && (
        <SessionRoom therapist={therapist} bookingId={sessionBookingId} end={() => go("dashboard")} />
      )}
      {view === "login" && <Login go={go} />}
      {view === "signup" && <SignUp go={go} />}
      {view === "payment-return" && returningOrderTrackingId && (
        <PaymentReturn orderTrackingId={returningOrderTrackingId} go={go} />
      )}
      {view === "privacy" && <PrivacyPolicy back={() => go("landing")} />}
      {view === "terms" && <Terms back={() => go("landing")} />}
      {view === "match-quiz" && (
        <MatchQuiz back={() => go("landing")} onComplete={(a) => { setQuizAnswers(a); go("match-results"); }} />
      )}
      {view === "match-results" && quizAnswers && (
        <MatchResults
          answers={quizAnswers}
          back={() => go("browse")}
          retake={() => go("match-quiz")}
          openProfile={openProfile}
          startBooking={startBooking}
        />
      )}
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
