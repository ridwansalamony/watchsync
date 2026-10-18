"use client";
import * as P from "@radix-ui/react-switch";
export function Switch(p: React.ComponentProps<typeof P.Root>) {
  return (
    <P.Root
      className="inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-white/20 transition-colors data-[state=checked]:bg-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      {...p}
    >
      <P.Thumb className="block size-4 translate-x-1 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-6" />
    </P.Root>
  );
}
