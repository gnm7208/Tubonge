import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { initialsOf, accentFor } from "@/lib/therapists";

export function PersonAvatar({
  name,
  id,
  avatarUrl,
  className,
}: {
  name: string;
  id: string;
  avatarUrl?: string | null;
  className?: string;
}) {
  return (
    <Avatar className={className}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
      <AvatarFallback className="font-heading font-semibold text-white" style={{ background: accentFor(id) }}>
        {initialsOf(name)}
      </AvatarFallback>
    </Avatar>
  );
}
