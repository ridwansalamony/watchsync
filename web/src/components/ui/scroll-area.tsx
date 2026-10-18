"use client";
import * as P from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";
export function ScrollArea({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <P.Root className={cn("relative overflow-hidden", className)}>
      <P.Viewport className="size-full rounded-[inherit]">
        {children}
      </P.Viewport>
      <P.Scrollbar
        orientation="vertical"
        className="flex w-1.5 touch-none p-px"
      >
        <P.Thumb className="flex-1 rounded-full bg-white/20" />
      </P.Scrollbar>
    </P.Root>
  );
}
