"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { refreshData } from "@/lib/client-data";
import { Button } from "@/components/ui/button";
export function DataBootstrap() {
  const path = usePathname();
  const [error, setError] = useState(false);
  useEffect(() => {
    void refreshData()
      .then(() => setError(false))
      .catch(() => setError(true));
  }, [path]);
  return error ? (
    <div
      role="alert"
      className="fixed bottom-20 left-4 z-50 rounded-xl border bg-card p-4 text-sm"
    >
      Data belum dapat dimuat.{" "}
      <Button
        size="sm"
        onClick={() =>
          void refreshData()
            .then(() => setError(false))
            .catch(() => setError(true))
        }
      >
        Coba Lagi
      </Button>
    </div>
  ) : null;
}
