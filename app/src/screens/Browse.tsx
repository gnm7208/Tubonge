import { useState, useMemo, useEffect } from "react";
import type { View } from "@/App";
import { ALL_SPECIALTIES, ALL_LANGUAGES, type Therapist } from "@/data/mock";
import { fetchApprovedTherapists } from "@/lib/therapists";
import { TherapistCard } from "@/components/TherapistCard";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, Sparkles, ArrowRight } from "lucide-react";

export function Browse({ go, openProfile, startBooking }: { go: (v: View) => void; openProfile: (t: Therapist) => void; startBooking: (t: Therapist) => void }) {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [spec, setSpec] = useState<string>("all");
  const [lang, setLang] = useState<string>("all");
  const [sort, setSort] = useState<string>("rating");

  useEffect(() => {
    fetchApprovedTherapists()
      .then(setTherapists)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const results = useMemo(() => {
    let r = therapists.filter((t) => {
      const matchQ = q === "" || t.name.toLowerCase().includes(q.toLowerCase()) || t.specialties.join(" ").toLowerCase().includes(q.toLowerCase());
      const matchSpec = spec === "all" || t.specialties.includes(spec);
      const matchLang = lang === "all" || t.languages.includes(lang);
      return matchQ && matchSpec && matchLang;
    });
    if (sort === "rating") r = [...r].sort((a, b) => b.rating - a.rating);
    if (sort === "price-low") r = [...r].sort((a, b) => a.rate - b.rate);
    if (sort === "price-high") r = [...r].sort((a, b) => b.rate - a.rate);
    return r;
  }, [therapists, q, spec, lang, sort]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">Find your therapist</h1>
      <p className="mt-1 text-muted-foreground">{therapists.length} licensed professionals available online.</p>

      <button
        onClick={() => go("match-quiz")}
        className="mt-4 flex w-full items-center justify-between rounded-xl border border-[#d97757]/30 bg-[#d97757]/5 px-4 py-3 text-left transition-colors hover:border-[#d97757]/50"
      >
        <span className="flex items-center gap-2 font-heading text-sm font-medium">
          <Sparkles className="h-4 w-4 text-[#d97757]" /> Not sure who to pick? Take our 1-minute match quiz.
        </span>
        <ArrowRight className="h-4 w-4 text-[#d97757]" />
      </button>

      {/* Filters */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or concern…" className="pl-9 font-body" />
          </div>
          <Select value={spec} onValueChange={setSpec}>
            <SelectTrigger className="w-full font-heading md:w-[150px]"><SelectValue placeholder="Specialty" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All specialties</SelectItem>
              {ALL_SPECIALTIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger className="w-full font-heading md:w-[140px]"><SelectValue placeholder="Language" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All languages</SelectItem>
              {ALL_LANGUAGES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-full font-heading md:w-[150px]"><SlidersHorizontal className="mr-1 h-3.5 w-3.5" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Top rated</SelectItem>
              <SelectItem value="price-low">Price: low to high</SelectItem>
              <SelectItem value="price-high">Price: high to low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Badge variant="secondary" className="border-none bg-[#e8e6dc] font-heading font-normal text-[#141413] hover:bg-[#e8e6dc]">{results.length} results</Badge>
      </div>

      {loading ? (
        <div className="mt-16 text-center text-muted-foreground">Loading therapists…</div>
      ) : error ? (
        <div className="mt-16 text-center text-destructive">Couldn't load therapists: {error}</div>
      ) : (
        <>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((t) => (
              <TherapistCard key={t.id} t={t} onView={() => openProfile(t)} onBook={() => startBooking(t)} />
            ))}
          </div>
          {results.length === 0 && (
            <div className="mt-16 text-center text-muted-foreground">
              {therapists.length === 0
                ? "No verified therapists yet — check back soon."
                : "No therapists match those filters. Try widening your search."}
            </div>
          )}
        </>
      )}
    </div>
  );
}
