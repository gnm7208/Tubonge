import { useEffect, useState } from "react";
import type { Therapist } from "@/data/mock";
import type { QuizAnswers } from "@/screens/MatchQuiz";
import { fetchApprovedTherapists } from "@/lib/therapists";
import { PersonAvatar } from "@/components/PersonAvatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ShieldCheck, Languages, Sparkles } from "lucide-react";

type Scored = { t: Therapist; matchedSpecialties: string[]; matchedLanguages: string[]; withinBudget: boolean; score: number };

function score(t: Therapist, a: QuizAnswers): Scored {
  const matchedSpecialties = t.specialties.filter((s) => a.specialties.includes(s));
  const matchedLanguages = t.languages.filter((l) => a.languages.includes(l));
  const withinBudget = a.budgetMax === null || t.rate <= a.budgetMax;
  const points = matchedSpecialties.length * 2 + matchedLanguages.length + (withinBudget ? 1 : 0);
  return { t, matchedSpecialties, matchedLanguages, withinBudget, score: points };
}

export function MatchResults({ answers, back, retake, openProfile, startBooking }: {
  answers: QuizAnswers;
  back: () => void;
  retake: () => void;
  openProfile: (t: Therapist) => void;
  startBooking: (t: Therapist) => void;
}) {
  const [results, setResults] = useState<Scored[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovedTherapists()
      .then((therapists) => {
        const scored = therapists.map((t) => score(t, answers)).filter((s) => s.score > 0);
        scored.sort((a, b) => b.score - a.score);
        setResults(scored);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [answers]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <Button variant="ghost" onClick={back} className="mb-4 font-heading text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>

      <h1 className="font-heading text-3xl font-semibold tracking-tight">Your matches</h1>
      <p className="mt-1 text-muted-foreground">
        Based on {answers.specialties.join(", ")} · {answers.languages.join(", ")}
      </p>

      {loading ? (
        <div className="mt-10 text-center text-muted-foreground">Finding your matches…</div>
      ) : results.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border bg-card p-8 text-center">
          <p className="font-heading font-semibold">No close matches yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Try widening your answers, or browse everyone.</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={retake} className="font-heading">Retake quiz</Button>
            <Button onClick={back} className="bg-[#141413] font-heading text-white hover:bg-[#141413]/90">Browse all therapists</Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {results.map(({ t, matchedSpecialties, matchedLanguages }, i) => (
            <div key={t.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start gap-4">
                <PersonAvatar name={t.name} id={t.id} avatarUrl={t.avatarUrl} className="h-14 w-14 shrink-0 rounded-2xl text-lg" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-heading font-semibold">{t.name}</p>
                    {t.verified && <ShieldCheck className="h-4 w-4 text-[#788c5d]" />}
                    {i === 0 && (
                      <Badge className="border-none bg-[#d97757]/15 font-heading text-xs text-[#d97757] hover:bg-[#d97757]/15">
                        <Sparkles className="mr-1 h-3 w-3" /> Best match
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{t.title}</p>

                  {matchedSpecialties.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      Matches: {matchedSpecialties.map((s) => (
                        <Badge key={s} variant="secondary" className="border-none bg-[#788c5d]/15 font-heading text-xs text-[#4f6138] hover:bg-[#788c5d]/15">{s}</Badge>
                      ))}
                    </div>
                  )}
                  {matchedLanguages.length > 0 && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Languages className="h-3.5 w-3.5" /> {matchedLanguages.join(", ")}
                    </p>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-heading text-sm font-semibold">KES {t.rate.toLocaleString()} <span className="font-normal text-muted-foreground">/ session</span></span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openProfile(t)} className="font-heading">View</Button>
                      <Button size="sm" onClick={() => startBooking(t)} className="bg-[#d97757] font-heading text-white hover:bg-[#c9663f]">Book</Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="pt-2 text-center">
            <button onClick={retake} className="font-heading text-sm text-[#d97757] underline">Retake the quiz</button>
          </div>
        </div>
      )}
    </div>
  );
}
