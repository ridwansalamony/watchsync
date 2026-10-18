"use client";
import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppStore, currentMember } from "@/stores/app-store";
import { roleLabels } from "@watchsync/shared/types";
import { DashboardHeading } from "./overview";
import { RoomCard } from "@/components/public/room-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
export function SavedRooms() {
  const s = useAppStore();
  const [search, setSearch] = useState("");
  const [remove, setRemove] = useState<string | null>(null);
  const rooms = s.rooms.filter(
    (r) =>
      s.savedRoomIds.includes(r.id) &&
      r.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <DashboardHeading
        title="Room Tersimpan"
        description="Tempat berkumpul yang ingin Anda kunjungi lagi."
        action={
          <Button asChild>
            <Link href="/buat-room">
              <Plus />
              Buat Room Baru
            </Link>
          </Button>
        }
      />
      <label htmlFor="room-search" className="sr-only">
        Cari room tersimpan
      </label>
      <Input
        id="room-search"
        className="mb-6 max-w-md"
        placeholder="Cari nama room..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {rooms.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard
              room={room}
              key={room.id}
              extra={
                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="text-emerald-300">Aktif</Badge>
                    <Badge>
                      {
                        roleLabels[
                          currentMember(room, s.memberships, s.user)?.role ??
                            "member"
                        ]
                      }
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Hapus ${room.name} dari tersimpan`}
                    onClick={() => setRemove(room.id)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={search ? "Room tidak ditemukan" : "Belum ada room tersimpan"}
          description={
            search
              ? "Coba kata kunci lain."
              : "Simpan room melalui ikon bookmark di ruang nonton."
          }
          action={
            <Button asChild variant="outline">
              <Link href="/gabung">Gabung dengan Kode</Link>
            </Button>
          }
        />
      )}
      <ConfirmDialog
        open={!!remove}
        onOpenChange={(o) => !o && setRemove(null)}
        title="Hapus dari daftar tersimpan?"
        description="Room tetap tersedia. Anda dapat menyimpannya kembali nanti."
        confirmLabel="Hapus dari Daftar"
        onConfirm={() => {
          if (remove) s.saveRoom(remove);
          toast.success("Room dihapus dari daftar tersimpan.");
        }}
      />
    </>
  );
}
