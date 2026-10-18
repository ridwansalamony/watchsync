"use client";
import { Command as P } from "cmdk";
export const Command = P;
export function CommandInput(p: React.ComponentProps<typeof P.Input>) {
  return (
    <P.Input
      className="h-12 w-full border-b border-white/10 bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground"
      {...p}
    />
  );
}
export const CommandList = P.List;
export const CommandEmpty = P.Empty;
export function CommandItem(p: React.ComponentProps<typeof P.Item>) {
  return (
    <P.Item
      className="flex cursor-pointer items-center gap-3 rounded-lg p-3 aria-selected:bg-white/10"
      {...p}
    />
  );
}
