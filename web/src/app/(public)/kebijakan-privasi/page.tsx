import { publicMetadata } from "@/lib/seo";
import { Legal } from "@/components/public/info-pages";
const metadata = {
  title: "Kebijakan Privasi",
  description:
    "Pelajari penggunaan data akun Google, cookie tamu, dan kendali privasi Anda.",
};
export default function Page() {
  return <Legal kind="privacy" />;
}

export const revalidate = 300;
export function generateMetadata() {
  return publicMetadata(
    "/kebijakan-privasi",
    metadata.title,
    metadata.description ?? "Nonton bersama teman di WatchSync Room.",
  );
}
