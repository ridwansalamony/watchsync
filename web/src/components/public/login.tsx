"use client";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { signIn } from "next-auth/react";

export function Login() {
  const search = useSearchParams();
  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-7 flex size-12 items-center justify-center rounded-xl bg-primary/15 text-indigo-300">
        <ShieldCheck size={25} />
      </div>
      <h2 className="text-xl">Semua cerita, tersimpan untuk Anda.</h2>
      <p className="mb-6 mt-3 text-sm leading-6 text-muted-foreground">
        Simpan room favorit, susun playlist, dan temukan kembali video yang
        pernah Anda tonton.
      </p>

      <Button
        className="mt-6 w-full"
        size="lg"
        onClick={() => {
          const next = search.get("lanjut");
          void signIn("google", {
            redirectTo: next?.startsWith("/dashboard") ? next : "/dashboard",
          });
        }}
      >
        <span
          className="flex size-6 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-800"
          aria-hidden
        >
          G
        </span>
        Lanjutkan dengan Google
        <ArrowRight />
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Masuk dengan akun Google Anda.
      </p>
      <p className="mt-7 text-center text-xs leading-6 text-muted-foreground">
        Dengan melanjutkan, Anda menyetujui{" "}
        <Link href="/syarat-layanan" className="text-indigo-300 underline">
          Syarat & Ketentuan
        </Link>{" "}
        serta{" "}
        <Link href="/kebijakan-privasi" className="text-indigo-300 underline">
          Kebijakan Privasi
        </Link>
        .
      </p>
    </Card>
  );
}
