"use client";
import { Toaster as Sonner } from "sonner";
export function Toaster() {
  return (
    <Sonner
      theme="dark"
      richColors
      position="bottom-right"
      closeButton
      containerAriaLabel="Notifikasi"
      toastOptions={{
        closeButtonAriaLabel: "Tutup notifikasi",
        style: {
          background: "hsl(229 22% 10%)",
          border: "1px solid hsl(229 18% 24%)",
          color: "hsl(220 30% 96%)",
        },
      }}
    />
  );
}
