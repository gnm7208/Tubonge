import type { Therapist } from "@/data/mock";
import { PersonAvatar } from "@/components/PersonAvatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShieldCheck, Languages } from "lucide-react";

export function TherapistCard({ t, onView, onBook }: { t: Therapist; onView: () => void; onBook: () => void }) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <PersonAvatar name={t.name} id={t.id} avatarUrl={t.avatarUrl} className="h-14 w-14 shrink-0 text-lg" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-heading font-semibold">{t.name}</p>
            {t.verified && <ShieldCheck className="h-4 w-4 shrink-0 text-[#788c5d]" />}
          </div>
          <p className="text-sm text-muted-foreground">{t.title}</p>
          <div className="mt-1 flex items-center gap-1 text-sm">
            <Star className="h-3.5 w-3.5 fill-[#d97757] text-[#d97757]" />
            {t.reviews > 0 ? (
              <>
                <span className="font-heading font-medium">{t.rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({t.reviews})</span>
              </>
            ) : (
              <span className="text-muted-foreground">New</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {t.specialties.slice(0, 3).map((s) => (
          <Badge key={s} variant="secondary" className="border-none bg-[#e8e6dc] font-heading text-xs font-normal text-[#141413] hover:bg-[#e8e6dc]">{s}</Badge>
        ))}
      </div>

      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Languages className="h-3.5 w-3.5" /> {t.languages.join(" · ")}
      </p>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <div>
          <p className="font-heading text-lg font-semibold">KES {t.rate.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">per 50-min session</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onView} className="font-heading">View</Button>
          <Button onClick={onBook} className="bg-[#d97757] font-heading text-white hover:bg-[#c9663f]">Book</Button>
        </div>
      </div>
    </div>
  );
}
