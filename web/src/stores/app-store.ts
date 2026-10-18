"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Room,
  User,
  Playlist,
  History,
  Member,
  Video,
  Message,
} from "@watchsync/shared/types";
import {
  toggleSavedRoom,
  savePersonalPlaylists,
  clearHistory,
  updateProfile,
  scheduleAccountDeletion,
} from "@/app/actions/dashboard";
import {
  updateRoomSettings,
  deleteRoom as deleteRoomAction,
} from "@/app/actions/room-settings";
import { refreshData, refreshRoom } from "@/lib/client-data";
import { roomCommand, reportError } from "@/lib/realtime-client";
export interface Preferences {
  notifications: boolean;
  sounds: boolean;
  pushToTalk: boolean;
  quality: "480p" | "720p";
}
interface AppState {
  typing: Record<string, Record<string, number>>;
  hydrated: boolean;
  user: User | null;
  guestName: string;
  rooms: Room[];
  playlists: Playlist[];
  history: History[];
  savedRoomIds: string[];
  memberships: Record<string, string>;
  passwordDigests: Record<string, string>;
  preferences: Preferences;
  setHydrated: () => void;
  login: () => void;
  logout: () => void;
  setGuestName: (name: string) => void;
  updateProfile: (name: string) => void;
  setPreference: <K extends keyof Preferences>(
    key: K,
    value: Preferences[K],
  ) => void;
  addRoom: (room: Room, memberId: string, digest?: string) => void;
  joinRoom: (code: string, name: string) => void;
  updateRoom: (code: string, patch: Partial<Room>) => void;
  deleteRoom: (code: string) => void;
  saveRoom: (id: string) => void;
  addMessage: (code: string, message: Message) => void;
  updateMember: (code: string, id: string, patch: Partial<Member>) => void;
  removeMember: (code: string, id: string) => void;
  setVideos: (code: string, videos: Video[]) => void;
  setPlaylists: (playlists: Playlist[]) => void;
  removeHistory: (id?: string) => void;
  deleteAccount: () => void;
  reset: () => void;
}
const initial = () => ({
  typing: {} as Record<string, Record<string, number>>,
  user: null as User | null,
  guestName: "",
  rooms: [] as Room[],
  playlists: [] as Playlist[],
  history: [] as History[],
  savedRoomIds: [] as string[],
  memberships: {} as Record<string, string>,
  passwordDigests: {} as Record<string, string>,
  preferences: {
    notifications: true,
    sounds: true,
    pushToTalk: false,
    quality: "480p" as const,
  },
});
function run(task: Promise<unknown>) {
  void task.catch(reportError);
}
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initial(),
      hydrated: false,
      setHydrated: () => {},
      login: () => {
        run(
          import("next-auth/react").then(({ signIn }) =>
            signIn("google", { redirectTo: "/dashboard" }),
          ),
        );
      },
      logout: () => {
        run(
          import("next-auth/react").then(({ signOut }) =>
            signOut({ redirectTo: "/" }),
          ),
        );
      },
      setGuestName: (guestName) => set({ guestName }),
      updateProfile: (name) => run(updateProfile(name).then(refreshData)),
      setPreference: (key, value) =>
        set((s) => ({ preferences: { ...s.preferences, [key]: value } })),
      addRoom: (room, memberId) =>
        set((s) => ({
          rooms: [...s.rooms.filter((r) => r.code !== room.code), room],
          memberships: { ...s.memberships, [room.code]: memberId },
        })),
      joinRoom: () => {},
      updateRoom: (code, patch) => {
        const room = get().rooms.find((r) => r.code === code);
        if (!room) return;
        if (patch.currentVideoId)
          run(
            roomCommand(
              code,
              "player:change-video",
              room.videos.find((v) => v.id === patch.currentVideoId)
                ?.youtubeVideoId,
            ),
          );
        else if (patch.playbackStatus)
          run(
            roomCommand(
              code,
              patch.playbackStatus === "playing"
                ? "player:play"
                : "player:pause",
            ),
          );
        else if (patch.playbackPosition !== undefined)
          run(roomCommand(code, "player:seek", patch.playbackPosition));
        else run(updateRoomSettings(code, patch).then(() => refreshRoom(code)));
      },
      deleteRoom: (code) => run(deleteRoomAction(code).then(refreshData)),
      saveRoom: (id) => run(toggleSavedRoom(id).then(refreshData)),
      addMessage: (code, message) => {
        if (!message.isSystem)
          run(roomCommand(code, "chat:send", message.body));
      },
      updateMember: (code, id, patch) => {
        const room = get().rooms.find((r) => r.code === code);
        if (patch.online === false) {
          run(roomCommand(code, "room:leave"));
          return;
        }
        const target = room?.members.find((m) => m.id === id);
        if (patch.role)
          run(
            roomCommand(
              code,
              patch.role === "moderator" ? "member:promote" : "member:demote",
              id,
            ),
          );
        else if (patch.isMuted !== undefined && target)
          run(
            roomCommand(
              code,
              patch.isMuted ? "member:mute" : "member:unmute",
              id,
            ),
          );
      },
      removeMember: (code, id) => run(roomCommand(code, "member:kick", id)),
      setVideos: (code, videos) => {
        const old = get().rooms.find((r) => r.code === code)?.videos ?? [];
        const added = videos.filter((v) => !old.some((o) => o.id === v.id));
        const removed = old.filter((v) => !videos.some((o) => o.id === v.id));
        run(
          (async () => {
            for (const v of removed)
              await roomCommand(code, "playlist:remove", v.id);
            for (const v of added)
              await roomCommand(code, "playlist:add", v.youtubeVideoId);
            if (!added.length && !removed.length)
              await roomCommand(
                code,
                "playlist:reorder",
                videos.map((v) => v.id),
              );
            await refreshRoom(code);
          })(),
        );
      },
      setPlaylists: (playlists) =>
        run(savePersonalPlaylists(playlists).then(refreshData)),
      removeHistory: (id) => run(clearHistory(id).then(refreshData)),
      deleteAccount: () =>
        run(
          scheduleAccountDeletion()
            .then(() => import("next-auth/react"))
            .then(({ signOut }) => signOut({ redirectTo: "/" })),
        ),
      reset: () => set(initial()),
    }),
    {
      name: "watchsync-preferences-v2",
      partialize: (s) => ({
        preferences: s.preferences,
        guestName: s.guestName,
      }),
    },
  ),
);
export function currentMember(
  room: Room,
  memberships: Record<string, string>,
  user: User | null,
) {
  return (
    room.members.find((m) => m.id === memberships[room.code]) ??
    (user ? room.members.find((m) => m.id === user.id) : undefined)
  );
}
