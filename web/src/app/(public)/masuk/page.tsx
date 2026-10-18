import { publicMetadata } from "@/lib/seo";
import { Suspense } from "react";
import { FormPage } from "@/components/public/room-forms";
import { Login } from "@/components/public/login";
const metadata = {
  title: "Masuk",
  description:
    "Masuk untuk menyimpan room, playlist, dan riwayat menonton Anda.",
};
export default function Page() {
  return (
    <FormPage
      title="Kembali ke cerita Anda."
      description="Satu akun untuk semua momen nonton bersama."
    >
      <Suspense fallback={<div className="skeleton h-80 rounded-xl" />}>
        <Login />
      </Suspense>
    </FormPage>
  );
}

export const revalidate = 300;
export function generateMetadata() {
  return publicMetadata(
    "/masuk",
    metadata.title,
    metadata.description ?? "Nonton bersama teman di WatchSync Room.",
  );
}
