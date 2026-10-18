import Link from "next/link";
import { Play } from "lucide-react";
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="flex shrink-0 items-center gap-2.5"
      aria-label="WatchSync Room, beranda"
    >
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary shadow-[0_0_24px_hsl(239_84%_67%_/_0.2)]">
        <Play size={19} fill="currentColor" strokeWidth={1.5} />
      </span>
      {!compact && (
        <span className="font-heading text-lg font-extrabold tracking-tight">
          WatchSync{" "}
          <span className="ml-1 text-muted-foreground font-medium">Room</span>
        </span>
      )}
    </Link>
  );
}
