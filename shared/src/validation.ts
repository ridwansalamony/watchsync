import { z } from "zod";
export function plainText(value: string) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}
export const displayNameSchema = z
  .string()
  .trim()
  .min(2, "Nama tampilan minimal 2 karakter.")
  .max(24, "Nama tampilan maksimal 24 karakter.");
export const roomSchema = z.object({
  displayName: displayNameSchema,
  name: z
    .string()
    .trim()
    .min(3, "Nama room minimal 3 karakter.")
    .max(60, "Nama room maksimal 60 karakter."),
  description: z
    .string()
    .transform(plainText)
    .pipe(z.string().max(280, "Deskripsi maksimal 280 karakter."))
    .default(""),
  privacy: z.enum(["public", "unlisted", "private"]),
  password: z.union([
    z.literal(""),
    z
      .string()
      .min(4, "Password minimal 4 karakter.")
      .max(32, "Password maksimal 32 karakter."),
  ]),
  controlMode: z.enum(["owner_only", "moderators", "everyone"]),
});
export const messageSchema = z
  .string()
  .trim()
  .min(1, "Tulis pesan terlebih dahulu.")
  .max(300, "Pesan maksimal 300 karakter.");
export function parseRoomCode(value: string) {
  const input = value.trim();
  let code = input;
  if (/^https?:\/\//.test(input)) {
    try {
      const url = new URL(input);
      const match = url.pathname.match(
        /^\/(?:gabung|room)\/([A-Za-z2-9]{8})\/?$/,
      );
      code = match?.[1] ?? "";
    } catch {
      code = "";
    }
  }
  return z
    .string()
    .regex(
      /^[A-HJ-NP-Z2-9]{8}$/,
      "Masukkan kode room 8 karakter atau tautan undangan yang valid.",
    )
    .parse(code.toUpperCase());
}
export function parseYoutubeId(input: string) {
  try {
    const url = new URL(input);
    if (!["https:", "http:"].includes(url.protocol)) return null;
    const host = url.hostname.replace(/^www\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.slice(1);
    if (host === "youtube.com" || host === "m.youtube.com")
      id =
        url.pathname === "/watch"
          ? url.searchParams.get("v")
          : (url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)$/)?.[1] ?? null);
    return id && /^[\w-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
