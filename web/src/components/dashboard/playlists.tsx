"use client";
import { loadPersonalPlaylist } from "@/app/actions/dashboard";
import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  ListVideo,
  MoreHorizontal,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import type { Playlist, Video } from "@watchsync/shared/types";
import { useAppStore, currentMember } from "@/stores/app-store";
import { DashboardHeading } from "./overview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { SortableVideos } from "@/components/common/sortable-videos";
const VideoPicker = dynamic(
  () => import("@/components/common/video-picker").then((m) => m.VideoPicker),
  { ssr: false },
);
export function LoadPlaylistDialog({
  playlist,
  open,
  onOpenChange,
}: {
  playlist: Playlist;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const s = useAppStore();
  const router = useRouter();
  const [code, setCode] = useState("");
  const eligible = s.rooms.filter((r) => {
    const member = currentMember(r, s.memberships, s.user);
    return !!member && !!s.memberships[r.code] && member.role !== "member";
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle className="text-xl font-bold">
          Muat playlist ke room
        </DialogTitle>
        <DialogDescription className="mt-3 text-sm leading-7 text-muted-foreground">
          Antrean room akan diganti dengan {playlist.videos.length} video dari “
          {playlist.name}”. Mengganti antrean memerlukan peran Owner atau
          Moderator. Pilih room yang telah Anda masuki dengan salah satu peran
          tersebut.
        </DialogDescription>
        {eligible.length ? (
          <form
            className="mt-6 grid gap-5"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!code) return;
              try {
                await loadPersonalPlaylist(code, playlist.id);
                toast.success("Playlist dimuat ke room.");
                onOpenChange(false);
                router.push("/room/" + code);
              } catch (err) {
                toast.error(
                  err instanceof Error
                    ? err.message
                    : "Playlist belum dapat dimuat.",
                );
              }
            }}
          >
            <label htmlFor="target-room">Room tujuan</label>
            <select
              id="target-room"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
            >
              <option value="">Pilih room</option>
              {eligible.map((r) => (
                <option value={r.code} key={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <Button disabled={!code || !playlist.videos.length}>
              Muat ke Room
              <ArrowRight />
            </Button>
          </form>
        ) : (
          <div className="mt-6">
            <p className="mb-5 text-sm text-muted-foreground">
              Belum ada room yang dapat Anda kelola. Buat room terlebih dahulu
              atau bergabung sebagai anggota yang diizinkan.
            </p>
            <Button asChild>
              <Link href="/buat-room">Buat Room Baru</Link>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
export function Playlists() {
  const s = useAppStore();
  const [create, setCreate] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [remove, setRemove] = useState<string | null>(null);
  const [load, setLoad] = useState<Playlist | null>(null);
  return (
    <>
      <DashboardHeading
        title="Playlist Tersimpan"
        description="Kumpulkan video favorit untuk sesi nonton berikutnya."
        action={
          <Button onClick={() => setCreate(true)}>
            <Plus />
            Buat Playlist
          </Button>
        }
      />
      {s.playlists.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {s.playlists.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <Link href={`/dashboard/playlist/${p.id}`}>
                <div className="relative aspect-video bg-secondary">
                  {p.videos[0] ? (
                    <Image
                      src={p.videos[0].thumbnailUrl}
                      alt={`Sampul ${p.name}`}
                      fill
                      sizes="400px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ListVideo className="text-primary" size={45} />
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 flex h-full w-1/4 items-center justify-center bg-background/70 backdrop-blur-sm">
                    <ListVideo size={24} />
                  </div>
                </div>
              </Link>
              <div className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/dashboard/playlist/${p.id}`}>
                    <h2 className="text-base">{p.name}</h2>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Menu playlist ${p.name}`}
                      >
                        <MoreHorizontal />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/playlist/${p.id}`}>
                          Edit Playlist
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-300"
                        onSelect={() => setRemove(p.id)}
                      >
                        <Trash2 size={15} />
                        Hapus Playlist
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {p.videos.length} video • Diperbarui{" "}
                  {new Date(p.updatedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                  })}
                </p>
                <Button
                  className="mt-5 w-full"
                  variant="secondary"
                  size="sm"
                  onClick={() => setLoad(p)}
                  disabled={!p.videos.length}
                >
                  <Play />
                  Muat ke Room
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Playlist pertama Anda menunggu"
          description="Buat koleksi video untuk film akhir pekan, musik, atau belajar bersama."
          action={
            <Button onClick={() => setCreate(true)}>
              <Plus />
              Buat Playlist
            </Button>
          }
        />
      )}
      <Dialog open={create} onOpenChange={setCreate}>
        <DialogContent>
          <DialogTitle className="text-xl font-bold">
            Beri nama cerita Anda
          </DialogTitle>
          <DialogDescription className="mt-3 text-sm text-muted-foreground">
            Anda dapat menyimpan hingga 20 playlist pribadi.
          </DialogDescription>
          <form
            className="mt-6 grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim().length < 2 || name.trim().length > 80) {
                setError("Nama playlist harus 2 sampai 80 karakter.");
                return;
              }
              if (s.playlists.length >= 20) {
                setError("Batas 20 playlist sudah tercapai.");
                return;
              }
              s.setPlaylists([
                ...s.playlists,
                {
                  id: crypto.randomUUID(),
                  name: name.trim(),
                  videos: [],
                  updatedAt: new Date().toISOString(),
                },
              ]);
              setCreate(false);
              setName("");
              setError("");
              toast.success("Playlist dibuat. Saatnya menambahkan video.");
            }}
          >
            <label htmlFor="playlist-name">Nama playlist</label>
            <Input
              id="playlist-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Film Akhir Pekan"
              maxLength={80}
            />
            {error && (
              <p role="alert" className="text-xs text-red-300">
                {error}
              </p>
            )}
            <Button type="submit">Buat Playlist</Button>
          </form>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={!!remove}
        onOpenChange={(o) => !o && setRemove(null)}
        title="Hapus playlist ini?"
        description="Playlist dan daftar videonya akan dihapus dari akun Anda."
        confirmLabel="Hapus Playlist"
        onConfirm={() => {
          s.setPlaylists(s.playlists.filter((p) => p.id !== remove));
          toast.success("Playlist dihapus.");
        }}
      />
      {load && (
        <LoadPlaylistDialog
          playlist={load}
          open={!!load}
          onOpenChange={(o) => !o && setLoad(null)}
        />
      )}
    </>
  );
}
export function PlaylistDetail({ id }: { id: string }) {
  const s = useAppStore();
  const playlist = s.playlists.find((p) => p.id === id);
  const [add, setAdd] = useState(false);
  const [load, setLoad] = useState(false);
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState("");
  if (!playlist)
    return (
      <EmptyState
        title="Playlist tidak ditemukan"
        description="Playlist mungkin sudah dihapus dari daftar Anda."
        action={
          <Button asChild>
            <Link href="/dashboard/playlist">Kembali ke Playlist</Link>
          </Button>
        }
      />
    );
  function update(videos: Video[]) {
    s.setPlaylists(
      s.playlists.map((p) =>
        p.id === id ? { ...p, videos, updatedAt: new Date().toISOString() } : p,
      ),
    );
  }
  return (
    <>
      <Link
        href="/dashboard/playlist"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft size={16} />
        Semua Playlist
      </Link>
      <DashboardHeading
        title={playlist.name}
        description={`${playlist.videos.length} / 100 video. Seret pegangan untuk mengatur urutan, atau gunakan spasi dan tombol panah.`}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setName(playlist.name);
                setEdit(true);
              }}
            >
              Ubah Nama
            </Button>
            <Button onClick={() => setAdd(true)}>
              <Plus />
              Tambah Video
            </Button>
          </div>
        }
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          {playlist.videos.length ? (
            <SortableVideos
              videos={playlist.videos}
              onReorder={update}
              onRemove={(videoId) => {
                update(playlist.videos.filter((v) => v.id !== videoId));
                toast.success("Video dihapus.");
              }}
            />
          ) : (
            <EmptyState
              title="Belum ada video"
              description="Cari video YouTube atau tambahkan tautan untuk menyusun playlist."
              action={
                <Button onClick={() => setAdd(true)}>Tambah Video</Button>
              }
            />
          )}
        </div>
        <Card className="p-6">
          <ListVideo className="mb-4 text-primary" size={30} />
          <h2 className="text-lg">Siap ditonton bersama?</h2>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Muat koleksi ini sebagai antrean baru di room Anda.
          </p>
          <Button
            className="mt-5 w-full"
            variant="secondary"
            disabled={!playlist.videos.length}
            onClick={() => setLoad(true)}
          >
            Muat ke Room
            <ArrowRight />
          </Button>
        </Card>
      </div>
      {add && (
        <VideoPicker
          open={add}
          onOpenChange={setAdd}
          onAdd={(v) => {
            if (playlist.videos.length >= 100) {
              toast.error("Playlist maksimal 100 video.");
              return false;
            }
            if (playlist.videos.at(-1)?.youtubeVideoId === v.youtubeVideoId) {
              toast.error("Video yang sama tidak boleh berurutan.");
              return false;
            }
            update([...playlist.videos, v]);
            return true;
          }}
        />
      )}
      <LoadPlaylistDialog
        playlist={playlist}
        open={load}
        onOpenChange={setLoad}
      />
      <Dialog open={edit} onOpenChange={setEdit}>
        <DialogContent>
          <DialogTitle className="text-xl font-bold">
            Ubah nama playlist
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-muted-foreground">
            Gunakan nama yang mudah Anda temukan kembali.
          </DialogDescription>
          <form
            className="mt-5 grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim().length < 2) return;
              s.setPlaylists(
                s.playlists.map((p) =>
                  p.id === id ? { ...p, name: name.trim() } : p,
                ),
              );
              setEdit(false);
              toast.success("Nama playlist diperbarui.");
            }}
          >
            <label htmlFor="rename">Nama playlist</label>
            <Input
              id="rename"
              value={name}
              onChange={(e) => setName(e.target.value)}
              minLength={2}
              maxLength={80}
              required
            />
            <Button type="submit">Simpan Perubahan</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
