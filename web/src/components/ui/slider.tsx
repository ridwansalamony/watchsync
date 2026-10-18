"use client";
import * as P from "@radix-ui/react-slider";
export function Slider(p: React.ComponentProps<typeof P.Root>) {
  return (
    <P.Root
      className="relative flex h-5 w-full touch-none select-none items-center"
      {...p}
    >
      <P.Track className="relative h-1.5 grow rounded-full bg-white/15">
        <P.Range className="absolute h-full rounded-full bg-primary" />
      </P.Track>
      <P.Thumb
        aria-label={p["aria-label"]}
        aria-labelledby={p["aria-labelledby"]}
        aria-valuetext={p["aria-valuetext"]}
        className="block size-3.5 rounded-full border-2 border-primary bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      />
    </P.Root>
  );
}
