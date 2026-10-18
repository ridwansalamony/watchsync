"use client";
import * as P from "@radix-ui/react-tooltip";
export const TooltipProvider = P.Provider;
export function Tooltip({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <P.Root>
      <P.Trigger asChild>{children}</P.Trigger>
      <P.Portal>
        <P.Content
          sideOffset={6}
          className="z-50 rounded-md border border-white/15 bg-secondary px-3 py-1.5 text-xs text-foreground shadow-lg"
        >
          {label}
          <P.Arrow className="fill-secondary" />
        </P.Content>
      </P.Portal>
    </P.Root>
  );
}
