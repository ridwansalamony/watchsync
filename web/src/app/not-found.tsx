import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main
      id="konten"
      className="page-width flex min-h-[80dvh] flex-col items-center justify-center text-center"
    >
      <p className="font-mono text-primary">404</p>
      <h1 className="mt-4 text-3xl">Sepertinya Anda tersesat</h1>
      <p className="my-6 text-muted-foreground">
        Halaman ini tidak ditemukan. Cerita lainnya menunggu di beranda.
      </p>
      <Button asChild>
        <Link href="/">Kembali ke Beranda</Link>
      </Button>
    </main>
  );
}
