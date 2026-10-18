"use client";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Users, Play } from "lucide-react";
import type { Room } from "@watchsync/shared/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
export function RoomCard({
  room,
  extra,
}: {
  room: Room;
  extra?: React.ReactNode;
}) {
  return (
    <Card className="room-card overflow-hidden">
      <Link href={`/gabung/${room.code}`} aria-label={`Gabung ${room.name}`}>
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={room.image}
            alt={room.category}
            fill
            sizes="(max-width: 768px) 100vw, 400px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/60 to-transparent" />
          <span className="absolute bottom-3 right-3 flex size-8 items-center justify-center rounded-full border border-white/20 bg-black/30">
            <Play size={13} fill="currentColor" />
          </span>
        </div>
      </Link>
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <Badge className="text-indigo-200">{room.category}</Badge>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users size={13} />
            {room.memberCount} / 50
          </span>
        </div>
        <Link
          href={`/gabung/${room.code}`}
          className="group flex items-start justify-between gap-3"
        >
          <h3 className="text-base leading-relaxed">{room.name}</h3>
          <ArrowUpRight
            size={17}
            className="mt-1 shrink-0 text-muted-foreground group-hover:text-primary"
          />
        </Link>
        <p className="mt-3 text-xs text-muted-foreground">
          Bersama {room.ownerName}
        </p>
        {extra}
      </div>
    </Card>
  );
}
