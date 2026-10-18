import { Home } from "@/components/public/home";
import { publicMetadata } from "@/lib/seo";
export const revalidate = 60;
export function generateMetadata() {
  return publicMetadata(
    "/",
    "Nonton Bareng, Serasa Sebelahan",
    "Putar YouTube bersama teman, mengobrol, dan berbagi cerita dalam satu room.",
  );
}
export default function Page() {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "WatchSync Room",
    url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    applicationCategory: "EntertainmentApplication",
    operatingSystem: "Web",
    inLanguage: "id",
    offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(data).replace(/</g, "\\u003c"),
        }}
      />
      <Home />
    </>
  );
}
