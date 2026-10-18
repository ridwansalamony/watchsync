"use client";
import { Button } from "@/components/ui/button";
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main id="konten" className="page-width py-28 text-center">
      <h1 className="text-3xl">Halaman belum berhasil dimuat</h1>
      <p className="my-6 text-muted-foreground">
        Silakan coba kembali. Periksa koneksi Anda, lalu muat ulang halaman.
      </p>
      <Button onClick={reset}>Coba Lagi</Button>
    </main>
  );
}
