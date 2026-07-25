// A session's video room opens a bit before the booked slot and stays reachable a bit after,
// rather than being available at any time or strictly only during the exact slot window.
const JOIN_EARLY_MINUTES = 10;
const JOIN_GRACE_MINUTES = 30;

export function canJoinSession(startsAt: string, endsAt: string, now = new Date()): boolean {
  const start = new Date(startsAt).getTime() - JOIN_EARLY_MINUTES * 60_000;
  const end = new Date(endsAt).getTime() + JOIN_GRACE_MINUTES * 60_000;
  const t = now.getTime();
  return t >= start && t <= end;
}
