import type { Metadata } from "next";
import { RoomShell } from "@/components/room/room-shell";
export const metadata: Metadata = {
  title: "Ruang Nonton",
  robots: { index: false, follow: false },
};
export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ kode: string }>;
}) {
  const { kode } = await params;
  return <RoomShell code={kode}>{children}</RoomShell>;
}
