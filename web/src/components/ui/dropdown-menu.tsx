"use client";
import * as P from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";
export const DropdownMenu = P.Root;
export const DropdownMenuTrigger = P.Trigger;
export function DropdownMenuContent(p: React.ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        sideOffset={6}
        className="z-50 min-w-44 rounded-xl border border-white/10 bg-card p-1.5 shadow-xl"
        {...p}
      />
    </P.Portal>
  );
}
export function DropdownMenuItem({
  className,
  ...p
}: React.ComponentProps<typeof P.Item>) {
  return (
    <P.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2.5 text-sm outline-none focus:bg-white/10 data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
        className,
      )}
      {...p}
    />
  );
}
