import { useState } from "react";
import type { Therapist } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Send, ShieldCheck } from "lucide-react";

export function SessionRoom({ therapist: t, end }: { therapist: Therapist; end: () => void }) {
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [msgs, setMsgs] = useState([
    { me: false, text: "Hi, glad you could make it today. How have you been feeling this week?" },
  ]);
  const [draft, setDraft] = useState("");

  const send = () => {
    if (!draft.trim()) return;
    setMsgs((m) => [...m, { me: true, text: draft.trim() }]);
    setDraft("");
  };

  return (
    <div className="flex h-screen flex-col bg-[#141413] text-white">
      {/* top bar */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#e5484d]" />
          <span className="font-heading text-sm">Live · 50:00 session</span>
        </div>
        <span className="flex items-center gap-1.5 font-heading text-xs text-[#b0aea5]"><ShieldCheck className="h-3.5 w-3.5 text-[#788c5d]" /> Encrypted</span>
      </div>

      <div className="flex min-h-0 flex-1 gap-4 px-5 pb-4">
        {/* video area */}
        <div className="relative flex-1 overflow-hidden rounded-2xl bg-gradient-to-br from-[#26251f] to-[#141413]">
          <div className="grid h-full place-items-center">
            <div className="text-center">
              <span className="mx-auto grid h-28 w-28 place-items-center rounded-full font-heading text-4xl font-semibold text-white" style={{ background: t.accent }}>{t.initials}</span>
              <p className="mt-4 font-heading text-lg">{t.name}</p>
              <p className="text-sm text-[#b0aea5]">{t.title}</p>
            </div>
          </div>
          {/* self view */}
          <div className="absolute bottom-4 right-4 grid h-28 w-40 place-items-center overflow-hidden rounded-xl border border-white/15 bg-[#26251f]">
            {cam ? <span className="font-heading text-2xl font-semibold text-[#b0aea5]">You</span> : <VideoOff className="h-6 w-6 text-[#b0aea5]" />}
          </div>
        </div>

        {/* chat */}
        <div className="hidden w-80 flex-col rounded-2xl bg-[#faf9f5] text-[#141413] md:flex">
          <div className="border-b border-border px-4 py-3 font-heading text-sm font-semibold">Chat</div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {msgs.map((m, i) => (
              <div key={i} className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${m.me ? "ml-auto bg-[#d97757] text-white" : "bg-[#e8e6dc]"}`}>
                {m.text}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 border-t border-border p-3">
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Type a message…" className="font-body" />
            <Button size="icon" onClick={send} className="shrink-0 bg-[#d97757] hover:bg-[#c9663f]"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* controls */}
      <div className="flex items-center justify-center gap-3 pb-6">
        <Button size="icon" onClick={() => setMic(!mic)} className={`h-12 w-12 rounded-full ${mic ? "bg-white/10 hover:bg-white/20" : "bg-[#e5484d] hover:bg-[#d43b40]"}`}>
          {mic ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>
        <Button size="icon" onClick={() => setCam(!cam)} className={`h-12 w-12 rounded-full ${cam ? "bg-white/10 hover:bg-white/20" : "bg-[#e5484d] hover:bg-[#d43b40]"}`}>
          {cam ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
        </Button>
        <Button onClick={end} className="h-12 rounded-full bg-[#e5484d] px-6 font-heading hover:bg-[#d43b40]">
          <PhoneOff className="mr-2 h-5 w-5" /> Leave
        </Button>
      </div>
    </div>
  );
}
