"use client";
import * as P from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";
export const Tabs = P.Root;
export function TabsList({
  className,
  ...p
}: React.ComponentProps<typeof P.List>) {
  return (
    <P.List
      className={cn("flex gap-1 rounded-lg bg-background/50 p-1", className)}
      {...p}
    />
  );
}
export function TabsTrigger({
  className,
  ...p
}: React.ComponentProps<typeof P.Trigger>) {
  return (
    <P.Trigger
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm text-muted-foreground data-[state=active]:bg-secondary data-[state=active]:text-foreground focus-visible:ring-2 focus-visible:ring-primary",
        className,
      )}
      {...p}
    />
  );
}
export function TabsContent({
  className,
  ...p
}: React.ComponentProps<typeof P.Content>) {
  return <P.Content className={cn("outline-none", className)} {...p} />;
}
