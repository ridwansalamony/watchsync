import { useAppStore } from "@/stores/app-store";
let revision = 0,
  bootstrapGeneration = 0,
  roomRequest = 0;
const roomRevisions = new Map<string, number>(),
  roomRequests = new Map<string, number>();
export async function refreshData() {
  const startedAt = revision,
    generation = ++bootstrapGeneration;
  const response = await fetch("/api/bootstrap", { cache: "no-store" });
  if (!response.ok) throw new Error("Data belum dapat dimuat.");
  const data = await response.json();
  if (generation !== bootstrapGeneration) return;
  useAppStore.setState((state) => {
    const newer = state.rooms.filter(
      (room) => (roomRevisions.get(room.code) ?? 0) > startedAt,
    );
    const memberships = { ...data.memberships };
    for (const room of newer) {
      if (state.memberships[room.code])
        memberships[room.code] = state.memberships[room.code];
      else delete memberships[room.code];
    }
    return {
      ...data,
      rooms: [
        ...data.rooms.filter(
          (room: { code: string }) => !newer.some((r) => r.code === room.code),
        ),
        ...newer,
      ],
      memberships,
      hydrated: true,
    };
  });
}
export async function refreshRoom(code: string) {
  const request = ++roomRequest;
  roomRequests.set(code, request);
  const response = await fetch(`/api/room/${encodeURIComponent(code)}`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Room tidak ditemukan.");
  const data = await response.json();
  if (roomRequests.get(code) !== request) return data;
  roomRevisions.set(code, ++revision);
  useAppStore.setState((s) => {
    const previous = s.rooms.find((r) => r.code === code);
    const room = {
      ...data.room,
      members: data.room.members.map((m: { id: string; isMuted: boolean }) => ({
        ...m,
        speaking:
          !m.isMuted &&
          Boolean(
            previous?.members.find((member) => member.id === m.id)?.speaking,
          ),
      })),
    };
    const memberships = { ...s.memberships };
    if (data.memberId) memberships[code] = data.memberId;
    else delete memberships[code];
    return {
      rooms: [...s.rooms.filter((r) => r.code !== code), room],
      memberships,
    };
  });
  return data;
}
