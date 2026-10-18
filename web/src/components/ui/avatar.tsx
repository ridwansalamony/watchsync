"use client";
import * as P from "@radix-ui/react-avatar";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
export function Avatar({
  src,
  name,
  className,
  online = false,
}: {
  src: string;
  name: string;
  className?: string;
  online?: boolean;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return (
    <span className="relative inline-flex shrink-0">
      <P.Root
        className={cn(
          "flex size-9 shrink-0 overflow-hidden rounded-full bg-primary/20",
          className,
        )}
      >
        {src && failedSource !== src ? (
          <Image
            src={src}
            alt={name}
            width={96}
            height={96}
            sizes="64px"
            className="size-full object-cover"
            onError={() => setFailedSource(src)}
          />
        ) : (
          <P.Fallback className="m-auto text-xs font-semibold">
            {name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </P.Fallback>
        )}
      </P.Root>
      {online && (
        <span className="online-dot absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card bg-emerald-400" />
      )}
    </span>
  );
}
