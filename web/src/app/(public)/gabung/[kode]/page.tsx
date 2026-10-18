import { FormPage, JoinForm } from "@/components/public/room-forms";
import { publicRoom, publicMetadata } from "@/lib/seo";
export const revalidate = 60;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ kode: string }>;
}) {
  const { kode } = await params;
  const room = await publicRoom(kode);
  return {
    ...publicMetadata(
      `/gabung/${kode}`,
      room ? `Undangan: ${room.name}` : "Undangan Room",
      "Anda diundang untuk menonton bersama di WatchSync Room.",
    ),
    openGraph: {
      title: room ? `Undangan: ${room.name}` : "Undangan Room",
      images: [`/gabung/${kode}/opengraph-image`],
    },
    robots: {
      index: room?.privacy === "public",
      follow: room?.privacy === "public",
    },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ kode: string }>;
}) {
  const { kode } = await params;
  return (
    <FormPage
      title="Ada tempat untuk Anda."
      description="Anda diundang untuk menikmati cerita bersama. Siapkan camilan favorit Anda."
    >
      <JoinForm code={kode} />
    </FormPage>
  );
}
