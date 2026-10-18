"use client";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Plus,
  Bookmark,
  ListVideo,
  Clock,
  Play,
} from "lucide-react";
import { useAppStore } from "@/stores/app-store";
import { useDashboard } from "@/hooks/use-dashboard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/motion/reveal";
import { RoomCard } from "@/components/public/room-card";
import { EmptyState } from "@/components/common/empty-state";
export function DashboardHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl md:text-3xl">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
export function Overview() {
  const s = useAppStore();
  const { data, isLoading, isError, refetch } = useDashboard();
  if (isLoading)
    return (
      <div
        className="skeleton h-80 rounded-xl"
        role="status"
        aria-label="Memuat ringkasan"
      />
    );
  if (isError)
    return (
      <EmptyState
        title="Ringkasan belum termuat"
        description="Silakan muat kembali data Anda."
        action={<Button onClick={() => refetch()}>Coba Lagi</Button>}
      />
    );
  const rooms = data?.savedRooms ?? [];
  return (
    <>
      <DashboardHeading
        title={`Mau nonton apa, ${s.user?.name.split(" ")[0]}?`}
        description="Lanjutkan cerita kemarin atau mulai momen baru bersama teman."
      />
      <Reveal className="relative overflow-hidden rounded-2xl border border-white/10 bg-secondary p-6 md:p-9">
        <div className="absolute inset-y-0 right-0 w-2/3">
          <Image
            src="/images/cinema.png"
            alt=""
            fill
            sizes="800px"
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/70 to-transparent" />
        </div>
        <div className="relative max-w-md">
          <h2 className="text-2xl leading-tight md:text-3xl">
            Waktu bersama
            <br />
            selalu punya cerita.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Satu room baru bisa jadi awal obrolan yang panjang. Ajak teman Anda
            malam ini.
          </p>
          <Button asChild className="mt-6">
            <Link href="/buat-room">
              <Plus />
              Buat Room Baru
            </Link>
          </Button>
        </div>
      </Reveal>
      <div className="my-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            title: "Room tersimpan",
            count: rooms.length,
            icon: Bookmark,
            href: "/dashboard/room-tersimpan",
          },
          {
            title: "Playlist pribadi",
            count: data?.playlistCount ?? 0,
            icon: ListVideo,
            href: "/dashboard/playlist",
          },
          {
            title: "Video ditonton",
            count: data?.history.length ?? 0,
            icon: Clock,
            href: "/dashboard/riwayat",
          },
        ].map(({ title, count, icon: Icon, href }) => (
          <Link key={title} href={href}>
            <Card className="flex items-center gap-4 p-5 hover:border-primary/40">
              <span className="rounded-xl bg-primary/10 p-3 text-indigo-300">
                <Icon size={21} />
              </span>
              <div>
                <p className="font-heading text-2xl font-bold">{count}</p>
                <p className="mt-1 text-xs text-muted-foreground">{title}</p>
              </div>
              <ArrowRight className="ml-auto text-muted-foreground" size={17} />
            </Card>
          </Link>
        ))}
      </div>
      <section className="mt-10">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-xl">Kembali ke room favorit</h2>
          <Link
            className="text-xs text-indigo-300"
            href="/dashboard/room-tersimpan"
          >
            Lihat Semua
            <ArrowRight size={13} className="ml-1 inline" />
          </Link>
        </div>
        {rooms.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {rooms.slice(0, 3).map((room) => (
              <RoomCard room={room} key={room.id} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Room favorit menunggu Anda"
            description="Buat room atau simpan room yang Anda sukai."
            action={
              <Button asChild>
                <Link href="/buat-room">Buat Room Baru</Link>
              </Button>
            }
          />
        )}
      </section>
      <section className="mt-10">
        <h2 className="mb-5 text-xl">Terakhir Anda tonton</h2>
        {(data?.history ?? []).slice(0, 2).map((h) => (
          <Card key={h.id} className="mb-3 flex items-center gap-4 p-4">
            <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={h.video.thumbnailUrl}
                alt=""
                fill
                sizes="100px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{h.video.title}</p>
              <p className="mt-2 truncate text-xs text-muted-foreground">
                {h.roomName}
              </p>
            </div>
            <Button asChild variant="ghost" size="icon">
              <Link
                href={
                  s.rooms.some((r) => r.id === h.roomId)
                    ? `/gabung/${s.rooms.find((r) => r.id === h.roomId)!.code}`
                    : "/dashboard/riwayat"
                }
                aria-label={`Kembali ke ${h.roomName}`}
              >
                <Play />
              </Link>
            </Button>
          </Card>
        ))}
      </section>
    </>
  );
}
