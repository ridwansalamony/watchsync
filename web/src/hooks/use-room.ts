"use client";
import { useAppStore, currentMember } from "@/stores/app-store";
import { useRoomCode } from "@/components/room/room-context";
export function useRoom() {
  const code = useRoomCode();
  const state = useAppStore();
  const room = state.rooms.find((r) => r.code === code)!;
  const me = currentMember(room, state.memberships, state.user)!;
  return { code, room, me, state };
}
