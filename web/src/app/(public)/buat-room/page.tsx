import { publicMetadata } from "@/lib/seo";
import { FormPage, CreateRoomForm } from "@/components/public/room-forms";
export default function Page() {
  return (
    <FormPage
      title="Cerita dimulai dari sini."
      description="Buat room Anda, bagikan tautannya, lalu nikmati waktu bersama."
    >
      <CreateRoomForm />
    </FormPage>
  );
}

export const revalidate = 300;
export function generateMetadata() {
  return publicMetadata(
    "/buat-room",
    "Buat Room",
    "Nonton bersama teman di WatchSync Room.",
  );
}
