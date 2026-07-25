import { ShieldCheck } from "lucide-react";

export function CrisisNotice({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl bg-[#e8e6dc]/60 p-4 text-sm text-muted-foreground ${className}`}>
      <ShieldCheck className="h-4 w-4 shrink-0 text-[#788c5d]" />
      Tubonge is not for emergencies and therapists here don't provide crisis intervention. If you're in immediate
      danger or crisis, call the Kenya Red Cross line 1199 (toll-free) or go to your nearest hospital.
    </div>
  );
}
