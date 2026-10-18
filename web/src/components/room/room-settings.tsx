"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, Trash2, Shield, Users, LockKeyhole } from "lucide-react";
import { toast } from "sonner";
import { roomSchema } from "@watchsync/shared/validation";
import type { Privacy, ControlMode } from "@watchsync/shared/types";
import { useRoom } from "@/hooks/use-room";
import { updateRoomSettings, deleteRoom } from "@/app/actions/room-settings";
import { refreshRoom } from "@/lib/client-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
import { Field } from "@/components/public/room-forms";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { MemberPanel, RoleBadge } from "./member-panel";
export function RoomSettings() {
  const { room, me, state, code } = useRoom();
  const router = useRouter();
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description);
  const [privacy, setPrivacy] = useState<Privacy>(room.privacy);
  const [control, setControl] = useState<ControlMode>(room.controlMode);
  const [password, setPassword] = useState("");
  const [removePassword, setRemovePassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [remove, setRemove] = useState(false);
  const [roleTarget, setRoleTarget] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const target = room.members.find((m) => m.id === roleTarget);
  if (me.role !== "owner") return null;
  return (
    <div className="page-width pb-12 pt-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl">Pengaturan Room</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Atur suasana dan kendali untuk {room.name}.
        </p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="grid gap-6">
          <Card className="p-5 md:p-7">
            <h2 className="mb-6 text-lg">Informasi & akses</h2>
            <form
              className="grid gap-6"
              noValidate
              onSubmit={async (e) => {
                e.preventDefault();
                const parsed = roomSchema.safeParse({
                  displayName: me.displayName,
                  name,
                  description,
                  privacy,
                  password,
                  controlMode: control,
                });
                if (!parsed.success) {
                  setErrors(
                    Object.fromEntries(
                      parsed.error.errors.map((e) => [
                        String(e.path[0]),
                        e.message,
                      ]),
                    ),
                  );
                  return;
                }
                setBusy(true);
                try {
                  await updateRoomSettings(code, {
                    name: parsed.data.name,
                    description: parsed.data.description,
                    privacy,
                    controlMode: control,
                    ...(password || removePassword
                      ? { password: removePassword ? "" : password }
                      : {}),
                  });
                  await refreshRoom(code);
                  setPassword("");
                  setRemovePassword(false);
                  setErrors({});
                  toast.success("Pengaturan room disimpan.");
                } catch (err) {
                  toast.error(
                    err instanceof Error
                      ? err.message
                      : "Pengaturan gagal disimpan.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Field id="settings-name" label="Nama room" error={errors.name}>
                <Input
                  id="settings-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  aria-invalid={!!errors.name}
                />
              </Field>
              <Field
                id="settings-description"
                label="Deskripsi (opsional)"
                error={errors.description}
                hint={`${description.length}/280 karakter`}
              >
                <textarea
                  id="settings-description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={280}
                />
              </Field>
              <Field id="settings-privacy" label="Privasi room">
                <select
                  id="settings-privacy"
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value as Privacy)}
                >
                  <option value="public">Publik</option>
                  <option value="unlisted">Tautan saja</option>
                  <option value="private">Privat</option>
                </select>
              </Field>
              <p className="-mt-3 text-xs leading-6 text-muted-foreground">
                Room Privat hanya menerima anggota yang telah diundang. Anggota
                yang sedang aktif tetap berada di room.
              </p>
              <Field
                id="settings-password"
                label={
                  room.hasPassword
                    ? "Ganti password (opsional)"
                    : "Password room (opsional)"
                }
                error={errors.password}
                hint="4 sampai 32 karakter. Biarkan kosong untuk mempertahankan pengaturan saat ini."
              >
                <Input
                  id="settings-password"
                  type="password"
                  value={password}
                  disabled={removePassword}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={32}
                  autoComplete="new-password"
                  placeholder="Masukkan password baru"
                />
              </Field>
              {room.hasPassword && (
                <div className="flex items-center justify-between">
                  <label htmlFor="remove-password">Hapus password room</label>
                  <Switch
                    id="remove-password"
                    checked={removePassword}
                    onCheckedChange={setRemovePassword}
                  />
                </div>
              )}
              <Field id="settings-control" label="Mode kontrol video">
                <select
                  id="settings-control"
                  value={control}
                  onChange={(e) => setControl(e.target.value as ControlMode)}
                >
                  <option value="owner_only">Hanya Owner</option>
                  <option value="moderators">Owner dan Moderator</option>
                  <option value="everyone">Semua anggota</option>
                </select>
              </Field>
              <Button
                type="submit"
                className="justify-self-start"
                disabled={busy}
              >
                <Save />
                {busy ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </form>
          </Card>
          <Card className="border-destructive/20 p-6">
            <h2 className="text-lg">Hapus room</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Room, antrean, dan chat akan dihapus permanen. Pastikan semua
              teman sudah selesai menonton.
            </p>
            <Button
              className="mt-5"
              variant="destructive"
              onClick={() => setRemove(true)}
            >
              <Trash2 />
              Hapus Room
            </Button>
          </Card>
        </div>
        <div className="grid gap-6">
          <Card className="p-6">
            <h2 className="flex items-center gap-2 text-lg">
              <Shield size={20} className="text-sky-300" />
              Moderator room
            </h2>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">
              Moderator membantu mengelola playlist dan anggota. Hanya Owner
              yang dapat mengubah peran.
            </p>
            <div className="mt-5 grid gap-4">
              {room.members
                .filter((m) => m.id !== me.id)
                .map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <Avatar src={m.avatarUrl} name={m.displayName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs">{m.displayName}</p>
                      <div className="mt-1">
                        <RoleBadge role={m.role} />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setRoleTarget(m.id)}
                    >
                      {m.role === "moderator" ? "Cabut" : "Jadikan"}
                    </Button>
                  </div>
                ))}
            </div>
            <Button asChild variant="outline" className="mt-6 w-full">
              <Link href={`/room/${code}/anggota`}>
                <Users />
                Kelola Anggota
              </Link>
            </Button>
          </Card>
          <Card className="p-6">
            <LockKeyhole size={25} className="text-indigo-300" />
            <h2 className="mt-4 text-lg">Akses terlindungi</h2>
            <p className="mt-3 text-xs leading-7 text-muted-foreground">
              Password disimpan dalam bentuk hash. Perubahan pengaturan dan hak
              akses anggota diperiksa oleh server.
            </p>
          </Card>
        </div>
      </div>
      <ConfirmDialog
        open={remove}
        onOpenChange={setRemove}
        title="Hapus room secara permanen?"
        description="Room, playlist, dan percakapannya akan dihapus permanen. Ketik ulang nama room untuk mengonfirmasi."
        requiredText={room.name}
        confirmLabel="Hapus Room"
        onConfirm={async () => {
          try {
            await deleteRoom(code);
            router.push(state.user ? "/dashboard" : "/");
            toast.success("Room dihapus.");
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : "Room gagal dihapus.",
            );
          }
        }}
      />
      <ConfirmDialog
        open={!!target}
        onOpenChange={(o) => !o && setRoleTarget(null)}
        title={
          target?.role === "moderator"
            ? "Cabut peran Moderator?"
            : "Jadikan anggota sebagai Moderator?"
        }
        description={
          target
            ? `Peran ${target.displayName} akan berubah pada room ini.`
            : ""
        }
        confirmLabel="Ubah Peran"
        onConfirm={() => {
          if (target)
            state.updateMember(code, target.id, {
              role: target.role === "moderator" ? "member" : "moderator",
            });
          toast.success("Peran anggota diperbarui.");
        }}
      />
    </div>
  );
}
export function ManageMembers() {
  const { room } = useRoom();
  return (
    <div className="page-width py-8">
      <h1 className="text-2xl md:text-3xl">Kelola Anggota</h1>
      <p className="mb-8 mt-3 text-sm leading-7 text-muted-foreground">
        {room.memberCount} / 50 anggota. Owner dan Moderator dapat menjaga
        percakapan tetap nyaman sesuai hak akses.
      </p>
      <MemberPanel table />
      <p className="mt-5 text-xs leading-7 text-muted-foreground">
        Moderator hanya dapat memoderasi Member. Owner tidak dapat dikeluarkan
        atau dibisukan. Setiap tindakan memerlukan konfirmasi.
      </p>
    </div>
  );
}
