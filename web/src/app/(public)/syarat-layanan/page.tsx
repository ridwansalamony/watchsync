import { publicMetadata } from "@/lib/seo";
import { Legal } from "@/components/public/info-pages";
const metadata = {
  title: "Syarat & Ketentuan",
  description:
    "Aturan penggunaan room, moderasi, konten YouTube, dan akun WatchSync Room.",
};
export default function Page() {
  return <Legal kind="terms" />;
}

export const revalidate = 300;
export function generateMetadata() {
  return publicMetadata(
    "/syarat-layanan",
    metadata.title,
    metadata.description ?? "Nonton bersama teman di WatchSync Room.",
  );
}
