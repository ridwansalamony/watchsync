import { publicMetadata } from "@/lib/seo";
import { About } from "@/components/public/info-pages";
const metadata = {
  title: "Tentang Kami",
  description:
    "Misi WatchSync Room: mendekatkan teman dan keluarga lewat cerita yang dinikmati bersama.",
};
export default function Page() {
  return <About />;
}

export const revalidate = 300;
export function generateMetadata() {
  return publicMetadata(
    "/tentang",
    metadata.title,
    metadata.description ?? "Nonton bersama teman di WatchSync Room.",
  );
}
