import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { PHQ9_QUESTIONS, GAD7_QUESTIONS, ANSWER_LABELS, PHQ9_SELF_HARM_INDEX, scoreBand } from "@/lib/checkIns";
import type { CheckInType } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { CrisisNotice } from "@/components/CrisisNotice";
import { ArrowLeft, Smile, Wind, CheckCircle2 } from "lucide-react";

type Stage = "pick" | "questions" | "safety" | "done";

export function CheckIn({ back }: { back: () => void }) {
  const { profile } = useAuth();
  const [type, setType] = useState<CheckInType | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [stage, setStage] = useState<Stage>("pick");
  const [saving, setSaving] = useState(false);
  const [score, setScore] = useState(0);

  const questions = type === "phq9" ? PHQ9_QUESTIONS : GAD7_QUESTIONS;

  const pick = (t: CheckInType) => {
    setType(t);
    setAnswers(Array(t === "phq9" ? PHQ9_QUESTIONS.length : GAD7_QUESTIONS.length).fill(-1));
    setStage("questions");
  };

  const answer = (i: number, v: number) => {
    const next = [...answers];
    next[i] = v;
    setAnswers(next);
  };

  const allAnswered = answers.every((a) => a >= 0);

  const submit = async () => {
    if (!type || !profile || !allAnswered) return;

    if (type === "phq9" && answers[PHQ9_SELF_HARM_INDEX] > 0) {
      setStage("safety");
      return;
    }
    await save();
  };

  const save = async () => {
    if (!type || !profile) return;
    setSaving(true);
    const total = answers.reduce((s, a) => s + a, 0);
    await supabase.from("check_ins").insert({ client_id: profile.id, type, answers, score: total });
    setScore(total);
    setSaving(false);
    setStage("done");
  };

  if (stage === "pick") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12">
        <Button variant="ghost" onClick={back} className="mb-4 font-heading text-muted-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">How are you feeling?</h1>
        <p className="mt-1 text-muted-foreground">A quick, private check-in. Takes about a minute.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button onClick={() => pick("phq9")} className="rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-[#d97757]/50">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d97757]/15 text-[#d97757]"><Smile className="h-5 w-5" /></span>
            <p className="mt-3 font-heading font-semibold">Mood</p>
            <p className="mt-1 text-sm text-muted-foreground">PHQ-9 · 9 questions about the last 2 weeks</p>
          </button>
          <button onClick={() => pick("gad7")} className="rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-[#6a9bcc]/50">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#6a9bcc]/15 text-[#6a9bcc]"><Wind className="h-5 w-5" /></span>
            <p className="mt-3 font-heading font-semibold">Anxiety</p>
            <p className="mt-1 text-sm text-muted-foreground">GAD-7 · 7 questions about the last 2 weeks</p>
          </button>
        </div>
      </div>
    );
  }

  if (stage === "questions") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-12">
        <Button variant="ghost" onClick={() => setStage("pick")} className="mb-4 font-heading text-muted-foreground">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Over the last 2 weeks, how often have you been bothered by any of the following?</h1>
        <div className="mt-6 space-y-5">
          {questions.map((q, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <p className="font-heading text-sm font-medium">{q}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ANSWER_LABELS.map((label, v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => answer(i, v)}
                    className={`rounded-lg border px-2 py-2 text-xs transition-colors ${answers[i] === v ? "border-[#141413] bg-[#141413]/[0.05] font-heading font-medium" : "border-border text-muted-foreground hover:border-[#141413]/30"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Button onClick={submit} disabled={!allAnswered || saving} className="mt-6 bg-[#d97757] font-heading text-white hover:bg-[#c9663f]">
          {saving ? "Saving…" : "See my result"}
        </Button>
      </div>
    );
  }

  if (stage === "safety") {
    return (
      <div className="mx-auto max-w-lg px-5 py-16">
        <CrisisNotice />
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <p className="font-heading font-semibold">You mentioned thoughts of self-harm.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            That takes courage to share. Please consider reaching out to the Kenya Red Cross line 1199 (toll-free) right now,
            or to your therapist if you have an upcoming session. Your response has been recorded and, if you have a therapist
            on Tubonge, they'll be able to see this trend.
          </p>
          <Button onClick={save} disabled={saving} className="mt-4 bg-[#141413] font-heading text-white hover:bg-[#141413]/90">
            {saving ? "Saving…" : "Continue"}
          </Button>
        </div>
      </div>
    );
  }

  const band = type ? scoreBand(type, score) : null;
  return (
    <div className="mx-auto max-w-lg px-5 py-16 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12" style={{ color: band?.color }} />
      <h1 className="mt-4 font-heading text-xl font-semibold">Check-in saved</h1>
      {band && (
        <p className="mt-2 font-heading text-lg font-semibold" style={{ color: band.color }}>{band.label}</p>
      )}
      <p className="mt-1 text-sm text-muted-foreground">Score: {score}</p>
      <Button onClick={back} className="mt-6 bg-[#141413] font-heading text-white hover:bg-[#141413]/90">
        Done
      </Button>
    </div>
  );
}
