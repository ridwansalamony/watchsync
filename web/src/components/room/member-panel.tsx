"use client";
import { roomCommand, reportError } from "@/lib/realtime-client";
import { useState } from "react";
import {
  MoreHorizontal,
  Shield,
  VolumeX,
  Volume2,
  UserMinus,
  Crown,
  Mic,
} from "lucide-react";
import { toast } from "sonner";
import type { Member } from "@watchsync/shared/types";
import { canModerate, roleLabels } from "@watchsync/shared/types";
import { useRoom } from "@/hooks/use-room";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
export function RoleBadge({ role }: { role: Member["role"] }) {
  return (
    <Badge
      className={
        role === "owner"
          ? "border-amber-400/20 bg-amber-400/8 text-amber-300"
          : role === "moderator"
            ? "border-sky-400/20 bg-sky-400/8 text-sky-300"
            : "text-muted-foreground"
      }
    >
      {role === "owner" ? (
        <Crown size={10} />
      ) : role === "moderator" ? (
        <Shield size={10} />
      ) : null}
      {roleLabels[role]}
    </Badge>
  );
}
export function ModerationMenu({ member }: { member: Member }) {
  const { me, code } = useRoom();
  const [action, setAction] = useState<
    "mute" | "unmute" | "kick" | "promote" | "demote" | null
  >(null);
  if (!canModerate(me.role, member.role) || me.id === member.id) return null;
  const labels = {
    mute: "Bisukan",
    unmute: "Batalkan Bisu",
    kick: "Keluarkan",
    promote: "Jadikan Moderator",
    demote: "Jadikan Member",
  };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`Moderasi ${member.displayName}`}
          >
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => setAction(member.isMuted ? "unmute" : "mute")}
          >
            {member.isMuted ? <Volume2 size={15} /> : <VolumeX size={15} />}{" "}
            {member.isMuted ? "Batalkan Bisu" : "Bisukan"}
          </DropdownMenuItem>
          {me.role === "owner" && (
            <DropdownMenuItem
              onSelect={() =>
                setAction(member.role === "moderator" ? "demote" : "promote")
              }
            >
              <Shield size={15} />
              {member.role === "moderator"
                ? "Jadikan Member"
                : "Jadikan Moderator"}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="text-red-300"
            onSelect={() => setAction("kick")}
          >
            <UserMinus size={15} />
            Keluarkan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={!!action}
        onOpenChange={(o) => !o && setAction(null)}
        title={`${action ? labels[action] : ""} ${member.displayName}?`}
        description={
          action === "kick"
            ? "Anggota akan dikeluarkan dan diblokir selama 30 menit dari room ini."
            : action === "mute"
              ? "Anggota tetap bisa menonton dan mendengarkan, tetapi tidak bisa mengirim chat atau menggunakan mikrofon."
              : "Perubahan peran atau izin ini langsung berlaku untuk seluruh anggota room."
        }
        confirmLabel={action ? labels[action] : "Konfirmasi"}
        onConfirm={async () => {
          if (!action || !canModerate(me.role, member.role)) return;
          try {
            await roomCommand(code, "member:" + action, member.id);
            toast.success(labels[action] + " berhasil diterapkan.");
          } catch (err) {
            reportError(err);
          }
        }}
      />
    </>
  );
}
export function MemberPanel({ table = false }: { table?: boolean }) {
  const { room, me } = useRoom();
  const priority = { owner: 0, moderator: 1, member: 2 };
  const sorted = [...room.members].sort(
    (a, b) =>
      priority[a.role] - priority[b.role] ||
      a.displayName.localeCompare(b.displayName),
  );
  if (table)
    return (
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-left text-sm">
            <caption className="sr-only">
              Daftar anggota dan peran dalam {room.name}
            </caption>
            <thead className="bg-white/3 text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-4 font-medium">
                  Anggota
                </th>
                <th scope="col" className="px-4 py-4 font-medium">
                  Peran
                </th>
                <th scope="col" className="px-4 py-4 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-4 font-medium">
                  <span className="sr-only">Aksi moderasi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((member) => (
                <tr key={member.id} className="border-t border-white/7">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={member.avatarUrl}
                        name={member.displayName}
                        online={member.online}
                      />
                      <span className="whitespace-nowrap text-xs">
                        {member.displayName}
                        {member.id === me.id ? " (kamu)" : ""}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <RoleBadge role={member.role} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 text-xs text-muted-foreground">
                    {member.isMuted ? (
                      <span className="text-red-300">Dibisukan</span>
                    ) : member.speaking ? (
                      <span className="text-emerald-300">Sedang Berbicara</span>
                    ) : member.online ? (
                      "Online"
                    ) : (
                      "Offline 2 menit lalu"
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <ModerationMenu member={member} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  return (
    <div
      className={
        table ? "rounded-xl border border-white/10 bg-card p-2" : "p-4"
      }
    >
      {!table && (
        <p className="mb-5 text-xs text-muted-foreground">
          {room.memberCount} anggota di room · kapasitas 50
        </p>
      )}
      <div className="grid gap-1">
        {sorted.map((m) => (
          <div
            key={m.id}
            className={`flex items-center gap-3 rounded-lg px-2 py-3 ${table ? "sm:px-5 sm:py-4" : ""}`}
          >
            <div
              className={
                m.speaking && !m.isMuted
                  ? "rounded-full ring-2 ring-emerald-400 ring-offset-2 ring-offset-card"
                  : ""
              }
            >
              <Avatar
                src={m.avatarUrl}
                name={m.displayName}
                online={m.online}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium sm:text-sm">
                {m.displayName}
                {m.id === me.id ? " (kamu)" : ""}
              </p>
              <p
                className={`mt-1 text-[10px] ${m.speaking && !m.isMuted ? "text-emerald-300" : "text-muted-foreground"}`}
              >
                {m.isMuted
                  ? "Dibisukan"
                  : m.speaking
                    ? "Sedang Berbicara"
                    : m.online
                      ? "Online"
                      : "Offline 2 menit lalu"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {m.isMuted ? (
                <VolumeX size={13} className="text-red-300" />
              ) : m.speaking ? (
                <Mic size={13} className="text-emerald-300" />
              ) : null}
              <RoleBadge role={m.role} />
              <ModerationMenu member={m} />
            </div>
          </div>
        ))}
      </div>
      {!table && (
        <p className="mt-5 rounded-lg bg-white/3 p-3 text-[10px] leading-6 text-muted-foreground">
          Status anggota dan tindakan moderasi diperbarui untuk seluruh room.
        </p>
      )}
    </div>
  );
}
