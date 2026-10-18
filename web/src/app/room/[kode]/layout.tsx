import type { Metadata } from "next";
import { RoomShell } from "@/components/room/room-shell";
import { QueryProvider } from "@/components/query-provider";
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
  return (
    <QueryProvider>
      <RoomShell code={kode}>{children}</RoomShell>
    </QueryProvider>
  );
}
