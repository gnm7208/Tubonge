import { useState } from "react";
import { ALL_SPECIALTIES, ALL_LANGUAGES } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, MessageCircleHeart } from "lucide-react";

export type QuizAnswers = {
  specialties: string[];
  languages: string[];
  budgetMax: number | null; // null = no preference
};

const BUDGETS: { label: string; max: number | null }[] = [
  { label: "Under KES 1,500", max: 1500 },
  { label: "KES 1,500 – 2,500", max: 2500 },
  { label: "KES 2,500 – 3,500", max: 3500 },
  { label: "No budget preference", max: null },
];

function toggle(list: string[], item: string) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export function MatchQuiz({ onComplete, back }: { onComplete: (a: QuizAnswers) => void; back: () => void }) {
  const [step, setStep] = useState(0);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [budgetMax, setBudgetMax] = useState<number | null | undefined>(undefined);

  const steps = [
    {
      title: "What would you like support with?",
      subtitle: "Pick as many as apply.",
      valid: specialties.length > 0,
      content: (
        <div className="flex flex-wrap gap-2">
          {ALL_SPECIALTIES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpecialties(toggle(specialties, s))}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${specialties.includes(s) ? "border-[#141413] bg-[#141413]/[0.05] font-heading font-medium" : "border-border text-muted-foreground hover:border-[#141413]/30"}`}
            >
              {s}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "Which languages do you prefer?",
      subtitle: "Pick as many as apply.",
      valid: languages.length > 0,
      content: (
        <div className="flex flex-wrap gap-2">
          {ALL_LANGUAGES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLanguages(toggle(languages, l))}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${languages.includes(l) ? "border-[#141413] bg-[#141413]/[0.05] font-heading font-medium" : "border-border text-muted-foreground hover:border-[#141413]/30"}`}
            >
              {l}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: "What's your budget per session?",
      subtitle: "We'll prioritise therapists in this range.",
      valid: budgetMax !== undefined,
      content: (
        <div className="grid gap-2 sm:grid-cols-2">
          {BUDGETS.map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={() => setBudgetMax(b.max)}
              className={`rounded-xl border p-4 text-left font-heading text-sm transition-colors ${budgetMax === b.max ? "border-[#d97757] bg-[#d97757]/10" : "border-border hover:border-[#d97757]/50"}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      ),
    },
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const next = () => {
    if (!current.valid) return;
    if (isLast) {
      onComplete({ specialties, languages, budgetMax: budgetMax ?? null });
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <Button variant="ghost" onClick={step === 0 ? back : () => setStep((s) => s - 1)} className="mb-4 font-heading text-muted-foreground">
        <ArrowLeft className="mr-1 h-4 w-4" /> Back
      </Button>

      <div className="mb-6 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#d97757] text-white">
          <MessageCircleHeart className="h-5 w-5" />
        </span>
        <span className="font-heading text-lg font-semibold">Find your match</span>
      </div>

      <div className="mb-6 flex gap-1.5">
        {steps.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-[#d97757]" : "bg-[#e8e6dc]"}`} />
        ))}
      </div>

      <h1 className="font-heading text-2xl font-semibold tracking-tight">{current.title}</h1>
      <p className="mt-1 text-muted-foreground">{current.subtitle}</p>

      <div className="mt-6">{current.content}</div>

      <Button onClick={next} disabled={!current.valid} className="mt-8 bg-[#d97757] font-heading text-white hover:bg-[#c9663f]">
        {isLast ? "See my matches" : "Continue"} <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}
