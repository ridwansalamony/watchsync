import { publicMetadata } from "@/lib/seo";
import { FormPage, JoinForm } from "@/components/public/room-forms";
export default function Page() {
  return (
    <FormPage
      title="Teman Anda sudah menunggu."
      description="Punya kode atau tautan undangan? Masukkan di bawah untuk bergabung."
    >
      <JoinForm />
    </FormPage>
  );
}

export const revalidate = 300;
export function generateMetadata() {
  return publicMetadata(
    "/gabung",
    "Gabung Room",
    "Nonton bersama teman di WatchSync Room.",
  );
}
