"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Plus, Search, Link2, Save, ListVideo } from "lucide-react";
import { toast } from "sonner";
import { canControl, canAddVideo } from "@watchsync/shared/types";
import { useRoom } from "@/hooks/use-room";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SortableVideos } from "@/components/common/sortable-videos";
const VideoPicker = dynamic(
  () => import("@/components/common/video-picker").then((m) => m.VideoPicker),
  { ssr: false },
);
export function PlaylistPanel() {
  const { room, me, state, code } = useRoom();
  const [picker, setPicker] = useState<string | null>(null);
  const [save, setSave] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const control = canControl(me.role, room.controlMode);
  const addAllowed = canAddVideo(me.role, room.controlMode);
  const editable = me.role !== "member";
  return (
    <div className="p-3">
      <div className="mb-4 flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground">
          {room.videos.length} / 100 video
        </p>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            if (!state.user) {
              toast.info("Masuk untuk menyimpan playlist.");
              return;
            }
            setSave(true);
          }}
          disabled={!room.videos.length}
        >
          <Save size={14} />
          Simpan Playlist
        </Button>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2">
        <Button
          size="sm"
          variant="secondary"
          disabled={!addAllowed}
          onClick={() => setPicker("search")}
        >
          <Search />
          Cari Video
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={!addAllowed}
          onClick={() => setPicker("url")}
        >
          <Link2 />
          Tambah dari URL
        </Button>
      </div>
      {!addAllowed && (
        <p className="mb-4 px-1 text-[11px] leading-6 text-muted-foreground">
          Hanya anggota yang diizinkan dapat menambahkan dan mengontrol video.
        </p>
      )}
      {room.videos.length ? (
        <SortableVideos
          videos={room.videos}
          currentVideoId={room.currentVideoId}
          contributors={Object.fromEntries(
            room.members.map((m) => [m.id, m.displayName]),
          )}
          editable={editable}
          onReorder={(vs) => state.setVideos(code, vs)}
          onRemove={(id) => {
            if (!editable) return;
            if (
              id === room.currentVideoId &&
              room.videos.length === 1 &&
              me.role !== "owner"
            ) {
              toast.error(
                "Video yang sedang dipilih memerlukan pengganti sebelum dihapus.",
              );
              return;
            }
            state.setVideos(
              code,
              room.videos.filter((v) => v.id !== id),
            );
            toast.success("Video dihapus dari antrean.");
          }}
          onPlay={
            control
              ? (id) => {
                  state.updateRoom(code, {
                    currentVideoId: id,
                    playbackPosition: 0,
                    playbackStatus: "playing",
                  });
                  toast.success("Permintaan pemutaran dikirim.");
                }
              : undefined
          }
        />
      ) : (
        <div className="px-3 py-12 text-center">
          <ListVideo size={32} className="mx-auto mb-4 text-primary" />
          <h3 className="text-base">Antrean masih kosong</h3>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            Tambahkan video pertama dan mulai cerita bersama.
          </p>
          {addAllowed && (
            <Button
              className="mt-5"
              size="sm"
              onClick={() => setPicker("search")}
            >
              <Plus />
              Tambah Video
            </Button>
          )}
        </div>
      )}
      {picker && (
        <VideoPicker
          key={picker}
          defaultTab={picker}
          open={!!picker}
          onOpenChange={(o) => !o && setPicker(null)}
          onAdd={(v) => {
            if (!addAllowed) return false;
            if (room.videos.length >= 100) {
              toast.error("Playlist maksimal 100 video.");
              return false;
            }
            if (room.videos.at(-1)?.youtubeVideoId === v.youtubeVideoId) {
              toast.error("Video yang sama tidak boleh berurutan.");
              return false;
            }
            state.setVideos(code, [
              ...room.videos,
              { ...v, addedByMemberId: me.id },
            ]);
            return true;
          }}
        />
      )}
      <Dialog open={save} onOpenChange={setSave}>
        <DialogContent>
          <DialogTitle className="text-xl font-bold">
            Simpan playlist pribadi
          </DialogTitle>
          <DialogDescription className="mt-3 text-sm text-muted-foreground">
            Simpan {room.videos.length} video untuk sesi berikutnya.
          </DialogDescription>
          <form
            className="mt-5 grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim().length < 2 || name.trim().length > 80) {
                setError("Nama playlist harus 2 sampai 80 karakter.");
                return;
              }
              if (state.playlists.length >= 20) {
                setError("Batas 20 playlist sudah tercapai.");
                return;
              }
              state.setPlaylists([
                ...state.playlists,
                {
                  id: crypto.randomUUID(),
                  name: name.trim(),
                  videos: room.videos,
                  updatedAt: new Date().toISOString(),
                },
              ]);
              setSave(false);
              setName("");
              toast.success("Playlist tersimpan di dasbor.");
            }}
          >
            <label htmlFor="save-name">Nama playlist</label>
            <Input
              id="save-name"
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
            <Button type="submit">
              <Save />
              Simpan Playlist
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
