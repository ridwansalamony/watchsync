import type { Socket } from "socket.io-client";
import { toast } from "sonner";
const sockets = new Map<string, Socket>();
export function registerSocket(code: string, socket: Socket | null) {
  if (socket) sockets.set(code, socket);
  else sockets.delete(code);
}
export async function roomCommand(
  code: string,
  event: string,
  input?: unknown,
) {
  let socket = sockets.get(code);
  let temporary = false;
  if (!socket) {
    const { io } = await import("socket.io-client");
    const response = await fetch(`/api/room/${encodeURIComponent(code)}`, {
      cache: "no-store",
    });
    const data = await response.json();
    if (!data.token) throw new Error("Gabung ke room terlebih dahulu.");
    socket = io(process.env.NEXT_PUBLIC_REALTIME_URL!, {
      auth: { token: data.token },
      withCredentials: true,
    });
    temporary = true;
    const connection = socket;
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error("Koneksi room belum tersedia.")),
          10000,
        );
        connection.once("connect", () => {
          clearTimeout(timer);
          resolve();
        });
        connection.once("connect_error", () => {
          clearTimeout(timer);
          reject(new Error("Akses room ditolak."));
        });
      });
      await socket.timeout(15000).emitWithAck("room:join", {});
    } catch (error) {
      socket.disconnect();
      throw error;
    }
  }
  if (!socket?.connected)
    throw new Error("Koneksi room terputus. Tunggu hingga tersambung kembali.");
  let result: { ok: boolean; error?: string; data?: unknown };
  try {
    result = (await socket.timeout(15000).emitWithAck(event, input)) as {
      ok: boolean;
      error?: string;
      data?: unknown;
    };
  } finally {
    if (temporary) socket.disconnect();
  }
  if (!result.ok) throw new Error(result.error ?? "Permintaan gagal.");
  return result.data;
}
export function reportError(error: unknown) {
  toast.error(
    error instanceof Error ? error.message : "Permintaan gagal. Coba kembali.",
  );
}
