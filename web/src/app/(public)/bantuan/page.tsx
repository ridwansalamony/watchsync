import { publicMetadata } from "@/lib/seo";
import { Help } from "@/components/public/info-pages";
const metadata = {
  title: "Pusat Bantuan",
  description:
    "Panduan membuat room, bergabung, mengatur video, dan mengelola anggota WatchSync Room.",
};
export default function Page() {
  return <Help />;
}

export const revalidate = 300;
export function generateMetadata() {
  return publicMetadata(
    "/bantuan",
    metadata.title,
    metadata.description ?? "Nonton bersama teman di WatchSync Room.",
  );
}
