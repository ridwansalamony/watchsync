"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

function LoadingRooms() {
  return (
    <div
      role="status"
      aria-label="Memuat room publik"
      className="mt-9 grid min-h-80 gap-5 md:grid-cols-2 lg:grid-cols-3"
    >
      {[0, 1, 2].map((key) => (
        <div key={key} className="skeleton h-80 rounded-xl" />
      ))}
    </div>
  );
}
const PublicRooms = dynamic(
  () => import("./public-rooms").then((module) => module.PublicRooms),
  { ssr: false, loading: LoadingRooms },
);

export function DeferredPublicRooms() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref}>{visible ? <PublicRooms /> : <LoadingRooms />}</div>;
}
