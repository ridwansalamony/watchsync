import { PlaylistDetail } from "@/components/dashboard/playlists";
export const metadata = { title: "Detail Playlist" };
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PlaylistDetail id={id} />;
}
