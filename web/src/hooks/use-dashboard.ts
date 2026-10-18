"use client";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/stores/app-store";
export function useDashboard() {
  const userId = useAppStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["dashboard", userId],
    enabled: !!userId,
    queryFn: async () => {
      const state = useAppStore.getState();
      return {
        savedRooms: state.rooms.filter((room) =>
          state.savedRoomIds.includes(room.id),
        ),
        playlistCount: state.playlists.length,
        history: state.history,
      };
    },
    staleTime: 0,
    refetchOnMount: "always",
  });
}
