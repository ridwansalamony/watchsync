"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import {
  ArrowRight,
  Plus,
  Globe,
  Link2,
  LockKeyhole,
  Eye,
  EyeOff,
  Check,
  Users,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  roomSchema,
  displayNameSchema,
  parseRoomCode,
} from "@watchsync/shared/validation";
import type { Privacy, ControlMode } from "@watchsync/shared/types";
import { useAppStore } from "@/stores/app-store";
import { createRoom, joinRoom } from "@/app/actions/room";
import { refreshRoom } from "@/lib/client-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";
export function FormPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="page-width py-14 md:py-20">
      <Reveal className="mx-auto max-w-lg">
        <h1 className="text-3xl md:text-4xl">{title}</h1>
        <p className="mb-8 mt-4 leading-7 text-muted-foreground">
          {description}
        </p>
        {children}
      </Reveal>
    </div>
  );
}
export function Field({
  label,
  error,
  hint,
  children,
  id,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  id: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && (
        <p
          id={`${id}-hint`}
          className="text-xs leading-5 text-muted-foreground"
        >
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
export function CreateRoomForm() {
  const s = useAppStore();
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [privacy, setPrivacy] = useState<Privacy>("unlisted");
  const [control, setControl] = useState<ControlMode>("owner_only");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <Card className="p-5 sm:p-7">
      <form
        className="mt-7 grid gap-6"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          const parsed = roomSchema.safeParse({
            displayName: data.get("displayName"),
            name: data.get("name"),
            description: "",
            privacy,
            password: data.get("password") ?? "",
            controlMode: control,
          });
          if (!parsed.success) {
            setErrors(
              Object.fromEntries(
                parsed.error.errors.map((i) => [String(i.path[0]), i.message]),
              ),
            );
            return;
          }
          setErrors({});
          setBusy(true);
          try {
            const value = parsed.data;
            const result = await createRoom(value);
            if (result.error || !result.code)
              throw new Error(result.error ?? "Room belum dapat dibuat.");
            const code = result.code;
            await refreshRoom(code);
            s.setGuestName(value.displayName);
            toast.success("Room berhasil dibuat. Ajak temanmu!");
            router.push(`/room/${code}`);
          } catch (error) {
            toast.error(
              error instanceof Error
                ? error.message
                : "Room belum berhasil dibuat. Silakan coba lagi.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field
          id="displayName"
          label="Nama tampilan"
          error={errors.displayName}
          hint="Nama yang akan dilihat teman Anda. 2 sampai 24 karakter."
        >
          <Input
            id="displayName"
            name="displayName"
            defaultValue={s.user?.name ?? s.guestName}
            maxLength={24}
            autoComplete="nickname"
            placeholder="Contoh: Rizky"
            aria-invalid={!!errors.displayName}
            aria-describedby={
              errors.displayName ? "displayName-error" : "displayName-hint"
            }
          />
        </Field>
        <Field id="name" label="Nama room" error={errors.name}>
          <Input
            id="name"
            name="name"
            placeholder="Contoh: Malam Minggu Nonton Bareng"
            maxLength={60}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
        </Field>
        <fieldset>
          <legend className="mb-3 text-sm font-medium">Privasi room</legend>
          <div className="grid gap-2">
            {[
              {
                value: "public",
                title: "Publik",
                desc: "Dapat ditemukan di Beranda.",
                icon: Globe,
              },
              {
                value: "unlisted",
                title: "Tautan saja",
                desc: "Hanya yang punya tautan atau kode.",
                icon: Link2,
              },
              {
                value: "private",
                title: "Privat",
                desc: "Khusus anggota yang diundang.",
                icon: LockKeyhole,
              },
            ].map(({ value, title, desc, icon: Icon }) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 ${privacy === value ? "border-primary/60 bg-primary/8" : "border-white/10"}`}
              >
                <input
                  className="accent-indigo-500"
                  type="radio"
                  name="privacy"
                  value={value}
                  checked={privacy === value}
                  onChange={() => setPrivacy(value as Privacy)}
                />
                <Icon size={18} className="text-muted-foreground" />
                <span>
                  <span className="block text-sm">{title}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {desc}
                  </span>
                </span>
                {privacy === value && (
                  <Check className="ml-auto text-primary" size={17} />
                )}
              </label>
            ))}
          </div>
        </fieldset>
        <Field
          id="password"
          label="Password room (opsional)"
          error={errors.password}
          hint="4 sampai 32 karakter. Kosongkan jika tidak diperlukan."
        >
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={visible ? "text" : "password"}
              maxLength={32}
              autoComplete="new-password"
              placeholder="Tambahkan perlindungan ekstra"
              className="pr-12"
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              className="absolute right-3 top-3.5 text-muted-foreground"
              onClick={() => setVisible(!visible)}
              aria-label={
                visible ? "Sembunyikan password" : "Tampilkan password"
              }
            >
              {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>
        <Field id="controlMode" label="Siapa yang boleh mengontrol video?">
          <select
            id="controlMode"
            value={control}
            onChange={(e) => setControl(e.target.value as ControlMode)}
          >
            <option value="owner_only">Hanya Owner</option>
            <option value="moderators">Owner dan Moderator</option>
            <option value="everyone">Semua anggota</option>
          </select>
        </Field>
        <Button size="lg" type="submit" disabled={busy}>
          {busy ? (
            "Membuat room..."
          ) : (
            <>
              <Plus />
              Buat Room Baru
            </>
          )}
        </Button>
        <p className="text-center text-xs leading-5 text-muted-foreground">
          Dengan membuat room, Anda menyetujui{" "}
          <Link href="/syarat-layanan" className="text-indigo-300 underline">
            Syarat & Ketentuan
          </Link>
          .
        </p>
      </form>
    </Card>
  );
}
export function JoinForm({ code: fixedCode }: { code?: string }) {
  const [loading, setLoading] = useState(!!fixedCode);
  const s = useAppStore();
  const router = useRouter();
  const [code, setCode] = useState(fixedCode ?? "");
  const [invitation, setInvitation] = useState("");
  useEffect(
    () =>
      setInvitation(new URLSearchParams(location.search).get("undangan") ?? ""),
    [],
  );
  const [selected, setSelected] = useState(fixedCode ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    if (selected) {
      setLoading(true);
      void refreshRoom(selected)
        .catch(() => {
          if (active) setError("Room tidak ditemukan.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    return () => {
      active = false;
    };
  }, [selected]);
  const room = s.rooms.find((r) => r.code === selected);
  return (
    <Card className="p-5 sm:p-7">
      {!fixedCode && (
        <form
          className="mt-6 grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              const parsed = parseRoomCode(code);
              setSelected(parsed);
              setError("");
            } catch (err) {
              setError(
                err instanceof z.ZodError
                  ? err.errors[0].message
                  : "Kode tidak valid.",
              );
            }
          }}
        >
          <Field
            id="code"
            label="Kode room atau tautan undangan"
            hint="Masukkan kode 8 karakter dari undangan Anda."
          >
            <Input
              id="code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setSelected("");
                setError("");
              }}
              placeholder="Contoh: AN4BT9LM"
              autoComplete="off"
              className="font-mono"
            />
          </Field>
          <Button variant="secondary" type="submit">
            Temukan Room
            <ArrowRight />
          </Button>
        </form>
      )}
      {room && (
        <>
          <div className="my-6 rounded-xl border border-white/10 bg-white/3 p-4">
            <div className="flex items-center gap-3">
              <Avatar
                src={room.members[0]?.avatarUrl ?? ""}
                name={room.ownerName}
              />
              <div>
                <h2 className="text-base">{room.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Owner: {room.ownerName}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Badge>
                <Users size={12} />
                {room.memberCount} / 50 anggota
              </Badge>
              {room.hasPassword && (
                <Badge>
                  <LockKeyhole size={12} />
                  Dilindungi password
                </Badge>
              )}
            </div>
          </div>
          {room.privacy === "private" &&
          !room.invited &&
          !invitation &&
          !s.memberships[room.code] ? (
            <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-5">
              <LockKeyhole className="mb-3 text-red-300" />
              <h3>Undangan diperlukan</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Room ini privat. Minta Owner atau Moderator untuk mengundang
                Anda terlebih dahulu.
              </p>
            </div>
          ) : (
            <form
              className="grid gap-5"
              onSubmit={async (e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                const name = displayNameSchema.safeParse(
                  data.get("displayName"),
                );
                if (!name.success) {
                  setError(name.error.errors[0].message);
                  return;
                }
                if (room.memberCount >= 50 && !s.memberships[room.code]) {
                  setError(
                    "Maaf, room ini sudah penuh (50/50). Minta Owner untuk membuka slot atau coba room lain.",
                  );
                  return;
                }
                if (room.blockedUntil && Date.now() < room.blockedUntil) {
                  setError(
                    "Kamu belum bisa bergabung. Blokir berlaku selama 30 menit setelah dikeluarkan.",
                  );
                  return;
                }
                setBusy(true);
                try {
                  const result = await joinRoom({
                    code: room.code,
                    displayName: name.data,
                    password: String(data.get("password") ?? ""),
                    invitation,
                  });
                  if (result.error) throw new Error(result.error);
                  await refreshRoom(room.code);
                } catch (err) {
                  setError(
                    err instanceof Error ? err.message : "Gabung room gagal.",
                  );
                  setBusy(false);
                  return;
                }
                setError("");
                router.push(`/room/${room.code}`);
                setBusy(false);
              }}
            >
              <Field id="join-displayName" label="Nama tampilan">
                <Input
                  id="join-displayName"
                  name="displayName"
                  defaultValue={s.user?.name ?? s.guestName}
                  placeholder="Siapa nama Anda?"
                  autoComplete="nickname"
                  maxLength={24}
                />
              </Field>
              {room.hasPassword && !s.memberships[room.code] && (
                <Field id="join-password" label="Password room">
                  <Input
                    id="join-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Masukkan password room"
                  />
                </Field>
              )}
              <Button
                type="submit"
                size="lg"
                disabled={
                  busy || (room.memberCount >= 50 && !s.memberships[room.code])
                }
              >
                {busy ? "Bergabung..." : "Gabung Sekarang"}
                <ArrowRight />
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck size={14} />
                Tidak perlu mendaftar untuk menonton.
              </p>
            </form>
          )}
        </>
      )}
      {loading && !room && (
        <div
          className="skeleton my-6 h-40 rounded-xl"
          role="status"
          aria-label="Memuat informasi room"
        />
      )}
      {fixedCode && !room && !loading && (
        <div className="py-8 text-center">
          <h2 className="text-xl">Room tidak ditemukan</h2>
          <p className="my-4 text-sm text-muted-foreground">
            Periksa kembali tautan undangan Anda.
          </p>
          <Button asChild variant="outline">
            <Link href="/gabung">Masukkan Kode Lain</Link>
          </Button>
        </div>
      )}
      {error && (
        <p
          className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-red-300"
          role="alert"
        >
          {error}
        </p>
      )}
    </Card>
  );
}
