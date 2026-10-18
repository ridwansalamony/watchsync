"use client";
import { useQuery } from "@tanstack/react-query";
import type { Room } from "@watchsync/shared/types";
import { Reveal } from "@/components/motion/reveal";
import { RoomCard } from "./room-card";
import { Button } from "@/components/ui/button";
export function PublicRooms() {
  const {
    data: rooms = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["public-rooms"],
    queryFn: async () => {
      const response = await fetch("/api/rooms/public");
      if (!response.ok) throw new Error("Daftar room belum tersedia.");
      return response.json() as Promise<Room[]>;
    },
    staleTime: 30000,
  });
  if (isPending)
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Memuat room publik"
        className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
      >
        {[0, 1, 2].map((key) => (
          <div key={key} className="skeleton h-80 rounded-xl" />
        ))}
      </div>
    );
  if (isError)
    return (
      <div role="status" className="py-12 text-center">
        <p className="mb-4 text-muted-foreground">
          Daftar room belum dapat dimuat. Periksa koneksi lalu coba kembali.
        </p>
        <Button variant="outline" onClick={() => void refetch()}>
          Coba Lagi
        </Button>
      </div>
    );
  return (
    <>
      <div className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {rooms.slice(0, 3).map((room) => (
          <Reveal key={room.id}>
            <RoomCard room={room} />
          </Reveal>
        ))}
      </div>
      {!rooms.length && (
        <p className="py-12 text-center text-muted-foreground">
          Belum ada room publik. Jadilah yang pertama membuatnya.
        </p>
      )}
    </>
  );
}
