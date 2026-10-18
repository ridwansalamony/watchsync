"use client";
import { invitationLink } from "@/app/actions/room";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  ChevronLeft,
  Settings,
  LockKeyhole,
  Bookmark,
  Copy,
  Check,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppStore, currentMember } from "@/stores/app-store";
import { refreshRoom } from "@/lib/client-data";
import { useRoomSync } from "@/hooks/use-room-sync";
import { RoomContext } from "./room-context";
import { JoinForm } from "@/components/public/room-forms";
export function RoomShell({
  code,
  children,
}: {
  code: string;
  children: React.ReactNode;
}) {
  const [loaded, setLoaded] = useState(false);
  const s = useAppStore();
  useRoomSync(code);
  useEffect(() => {
    setLoaded(false);
    void refreshRoom(code)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [code]);
  const room = s.rooms.find((r) => r.code === code);
  const path = usePathname();
  const [copied, setCopied] = useState(false);
  if (!s.hydrated || (!room && !loaded))
    return (
      <main id="konten" className="p-6">
        <div className="skeleton h-[70dvh] rounded-2xl" />
      </main>
    );
  if (!room)
    return (
      <main id="konten" className="page-width py-28 text-center">
        <h1 className="text-3xl">Room tidak ditemukan</h1>
        <p className="my-5 text-muted-foreground">
          Periksa kembali kode undangan atau buat room baru.
        </p>
        <Button asChild>
          <Link href="/gabung">Coba Kode Lain</Link>
        </Button>
      </main>
    );
  const me = currentMember(room, s.memberships, s.user);
  if (!me || !s.memberships[code])
    return (
      <main id="konten" className="page-width py-12">
        <div className="mx-auto max-w-lg">
          <Brand />
          <h1 className="mb-6 mt-10 text-2xl">{room.name}</h1>
          <JoinForm code={code} />
        </div>
      </main>
    );
  const subpage = path !== `/room/${code}`;
  const allowed = path.endsWith("/pengaturan")
    ? me.role === "owner"
    : path.endsWith("/anggota")
      ? me.role !== "member"
      : true;
  return (
    <RoomContext.Provider value={code}>
      <div className="min-h-[100dvh] bg-background">
        <header className="flex min-h-20 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <div className="hidden md:block">
              <Brand compact />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-sm sm:text-base">{room.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                <span className="font-mono tracking-wider">{code}</span>
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {room.memberCount} / 50
                </span>
                <span className="hidden sm:inline">Room tersinkron</span>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge className="hidden text-emerald-300 sm:inline-flex">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              Room aktif
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Simpan room"
              onClick={() => {
                if (!s.user) {
                  toast.info("Masuk ke akun untuk menyimpan room.");
                  return;
                }
                s.saveRoom(room.id);
                toast.success(
                  s.savedRoomIds.includes(room.id)
                    ? "Room dihapus dari daftar tersimpan."
                    : "Room tersimpan di dasbor.",
                );
              }}
            >
              <Bookmark
                className={
                  s.savedRoomIds.includes(room.id) && s.user
                    ? "fill-primary text-primary"
                    : ""
                }
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Salin tautan undangan"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    await invitationLink(code),
                  );
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                  toast.success("Tautan undangan disalin.");
                } catch {
                  toast.error(
                    "Tautan belum tersalin. Salin kode room dari header.",
                  );
                }
              }}
            >
              {copied ? <Check /> : <Copy />}
            </Button>
            {me.role !== "member" && (
              <Button asChild variant="ghost" size="icon">
                <Link
                  href={
                    me.role === "owner"
                      ? `/room/${code}/pengaturan`
                      : `/room/${code}/anggota`
                  }
                  aria-label={
                    me.role === "owner" ? "Pengaturan room" : "Kelola anggota"
                  }
                >
                  <Settings />
                </Link>
              </Button>
            )}
          </div>
        </header>
        <main id="konten">
          {subpage && (
            <div className="page-width pt-6">
              <Button asChild variant="ghost" size="sm">
                <Link href={`/room/${code}`}>
                  <ChevronLeft />
                  Kembali ke Ruang Nonton
                </Link>
              </Button>
            </div>
          )}
          {allowed ? (
            children
          ) : (
            <div className="page-width py-24 text-center">
              <LockKeyhole className="mx-auto mb-5 text-primary" size={32} />
              <h2 className="text-2xl">Akses terbatas</h2>
              <p className="mt-4 text-muted-foreground">
                Peran kamu belum memiliki izin untuk membuka halaman ini.
              </p>
              <Button asChild className="mt-6">
                <Link href={`/room/${code}`}>Kembali Menonton</Link>
              </Button>
            </div>
          )}
        </main>
      </div>
    </RoomContext.Provider>
  );
}
