"use client";
import { scheduleAccountDeletion } from "@/app/actions/dashboard";
import { signOut } from "next-auth/react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Clock, LogOut, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { displayNameSchema } from "@watchsync/shared/validation";
import { useAppStore } from "@/stores/app-store";
import { duration } from "@/lib/utils";
import { DashboardHeading } from "./overview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
export function WatchHistory() {
  const s = useAppStore();
  const [remove, setRemove] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const items = s.history.filter((h) =>
    `${h.video.title} ${h.roomName}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <DashboardHeading
        title="Riwayat Menonton"
        description="Cerita yang pernah Anda nikmati bersama teman."
        action={
          <Button
            variant="outline"
            disabled={!s.history.length}
            onClick={() => setRemove("all")}
          >
            <Trash2 />
            Hapus Semua
          </Button>
        }
      />
      <label htmlFor="history-search" className="sr-only">
        Cari riwayat menonton
      </label>
      <Input
        id="history-search"
        placeholder="Cari video atau room..."
        className="mb-6 max-w-md"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {items.length ? (
        <div className="grid gap-4">
          {items.map((h) => (
            <Card
              key={h.id}
              className="flex items-start gap-4 p-4 sm:items-center sm:p-5"
            >
              <div className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-lg sm:w-36">
                <Image
                  src={h.video.thumbnailUrl}
                  alt=""
                  fill
                  sizes="150px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm leading-6 sm:text-base">
                  {h.video.title}
                </h2>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {h.video.channelTitle}
                </p>
                <p className="mt-2 text-xs text-indigo-200">{h.roomName}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
                  <span>
                    {new Date(h.watchedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    Ditonton {duration(h.watchedSeconds)}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                aria-label={`Hapus riwayat ${h.video.title}`}
                onClick={() => setRemove(h.id)}
              >
                <Trash2 />
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title={
            search ? "Video tidak ditemukan" : "Cerita berikutnya menunggu"
          }
          description={
            search
              ? "Coba judul atau nama room lain."
              : "Video yang Anda tonton akan muncul di sini. Mulai dengan bergabung ke sebuah room."
          }
          action={
            <Button asChild>
              <Link href="/gabung">Gabung dengan Kode</Link>
            </Button>
          }
        />
      )}
      <ConfirmDialog
        open={!!remove}
        onOpenChange={(o) => !o && setRemove(null)}
        title={
          remove === "all" ? "Hapus seluruh riwayat?" : "Hapus riwayat ini?"
        }
        description="Entri yang dihapus tidak dapat dikembalikan."
        confirmLabel="Hapus Riwayat"
        onConfirm={() => {
          s.removeHistory(remove === "all" ? undefined : (remove ?? undefined));
          toast.success("Riwayat dihapus.");
        }}
      />
    </>
  );
}
export function Profile() {
  const s = useAppStore();
  const router = useRouter();
  const [name, setName] = useState(s.user?.name ?? "");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState<"delete" | "reset" | null>(null);
  return (
    <>
      <DashboardHeading
        title="Profil & Pengaturan"
        description="Buat pengalaman menonton terasa lebih nyaman untuk Anda."
      />
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_300px]">
        <div className="grid gap-6">
          <Card className="p-6">
            <h2 className="text-lg">Profil Anda</h2>
            <div className="my-6 flex items-center gap-4">
              <Avatar
                className="size-16"
                src={s.user?.image ?? ""}
                name={s.user?.name ?? "Pengguna"}
              />
              <div>
                <p className="text-sm font-semibold">{s.user?.name}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Foto profil dari akun Google
                </p>
              </div>
            </div>
            <form
              className="grid gap-5"
              onSubmit={(e) => {
                e.preventDefault();
                const parsed = displayNameSchema.safeParse(name);
                if (!parsed.success) {
                  setError(parsed.error.errors[0].message);
                  return;
                }
                s.updateProfile(parsed.data);
                setError("");
                toast.success("Profil berhasil disimpan.");
              }}
            >
              <div className="field">
                <label htmlFor="profile-name">Nama tampilan default</label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={24}
                  autoComplete="nickname"
                  aria-invalid={!!error}
                />
                {error && (
                  <p role="alert" className="field-error">
                    {error}
                  </p>
                )}
              </div>
              <div className="field">
                <label htmlFor="profile-email">Email Google</label>
                <Input
                  id="profile-email"
                  value={s.user?.email ?? ""}
                  disabled
                />
                <p className="text-xs text-muted-foreground">
                  Email terhubung ke akun dan tidak dapat diubah di sini.
                </p>
              </div>
              <Button type="submit" className="justify-self-start">
                <Save />
                Simpan Perubahan
              </Button>
            </form>
          </Card>
          <Card className="p-6">
            <h2 className="text-lg">Preferensi menonton</h2>
            <div className="mt-6 grid gap-6">
              {[
                {
                  key: "notifications" as const,
                  title: "Notifikasi di dalam room",
                  desc: "Tampilkan pemberitahuan saat anggota bergabung dan video berganti.",
                },
                {
                  key: "sounds" as const,
                  title: "Suara pesan masuk",
                  desc: "Aktifkan suara pemberitahuan chat di room.",
                },
                {
                  key: "pushToTalk" as const,
                  title: "Tekan untuk bicara",
                  desc: "Gunakan tombol spasi di desktop pada integrasi media mendatang.",
                },
              ].map(({ key, title, desc }) => (
                <div
                  className="flex items-center justify-between gap-5"
                  key={key}
                >
                  <div>
                    <label htmlFor={key}>{title}</label>
                    <p className="mt-1 text-xs leading-6 text-muted-foreground">
                      {desc}
                    </p>
                  </div>
                  <Switch
                    id={key}
                    checked={s.preferences[key]}
                    onCheckedChange={(v) => s.setPreference(key, v)}
                  />
                </div>
              ))}
              <div className="field">
                <label htmlFor="language">Bahasa antarmuka</label>
                <select id="language" defaultValue="id">
                  <option value="id">Bahasa Indonesia</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="quality">Kualitas kamera pilihan</label>
                <select
                  id="quality"
                  value={s.preferences.quality}
                  onChange={(e) =>
                    s.setPreference(
                      "quality",
                      e.target.value as "480p" | "720p",
                    )
                  }
                >
                  <option value="480p">480p (disarankan)</option>
                  <option value="720p">720p</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Preferensi perangkat tersimpan. Kualitas akan digunakan saat kamera diaktifkan.
                </p>
              </div>
            </div>
          </Card>
          <Card className="border-destructive/20 p-6">
            <h2 className="text-lg">Kelola akun</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Penghapusan akun dan data pribadi dijadwalkan dalam 30 hari
              setelah permintaan Anda.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  s.logout();
                  router.push("/");
                  toast.success("Anda sudah keluar.");
                }}
              >
                <LogOut />
                Keluar
              </Button>
              <Button
                variant="destructive"
                onClick={() => setConfirm("delete")}
              >
                <Trash2 />
                Hapus Akun
              </Button>
            </div>
          </Card>
        </div>
        <div className="grid gap-5">
          <Card className="p-6">
            <ShieldCheck size={28} className="text-primary" />
            <h2 className="mt-5 text-lg">Kendali ada pada Anda</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Nama tampilan dalam room dapat berbeda dari nama profil.
              Preferensi perangkat disimpan di browser Anda.
            </p>
            <Link
              href="/kebijakan-privasi"
              className="mt-5 block text-sm text-indigo-300"
            >
              Baca Kebijakan Privasi
            </Link>
          </Card>
        </div>
      </div>
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Jadwalkan penghapusan akun?"
        description="Akun dan data pribadi Anda dijadwalkan untuk dihapus dalam 30 hari."
        requiredText="HAPUS"
        confirmLabel="Hapus Akun"
        onConfirm={async () => {
          try {
            await scheduleAccountDeletion();
            toast.success("Penghapusan akun dijadwalkan dalam 30 hari.");
            await signOut({ redirectTo: "/" });
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Permintaan belum berhasil.",
            );
          }
        }}
      />
    </>
  );
}
