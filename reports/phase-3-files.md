# Daftar berkas Fase 3

Tidak mencakup node_modules, .runtime, .next, test-results, atau file kredensial yang diperbarui pemilik proyek. PRD.md, AGENTS.md, dan SKILL.md tetap utuh.

## Dibuat

- web/src/app/api/livekit/token/route.ts
- web/src/app/api/livekit/screen/route.ts
- web/src/lib/livekit.ts
- web/src/lib/seo.ts
- web/src/components/room/media-bar.tsx
- web/src/components/motion/features.ts
- web/src/app/robots.ts
- web/src/app/sitemap.ts
- web/src/app/opengraph-image.tsx
- web/src/app/(public)/gabung/[kode]/opengraph-image.tsx
- realtime/src/media.ts
- realtime/Dockerfile
- realtime/railway.json
- .dockerignore
- .github/workflows/realtime-image.yml
- deploy/compose.yml
- deploy/Caddyfile
- deploy/.env.example
- deploy/PANDUAN.md
- scripts/load-realtime.mjs
- tests/phase-three.spec.ts
- reports/phase-3.md
- reports/phase-3-files.md
- reports/phase-3-drift.json
- reports/phase-3-load.json
- reports/phase-3-load-summary.json
- reports/phase-3-lighthouse.json
- reports/screenshots/phase-3-media-desktop.png
- reports/screenshots/phase-3-media-mobile.png

## Diubah

- package.json, package-lock.json
- web/package.json, realtime/package.json
- shared/src/validation.ts
- realtime/src/index.ts
- web/next.config.ts
- web/src/lib/identity.ts
- web/src/lib/redis.ts
- web/src/lib/client-data.ts
- web/src/app/actions/room.ts
- web/src/app/actions/room-settings.ts
- web/src/app/api/youtube/search/route.ts
- web/src/app/error.tsx
- web/src/components/room/watch-room.tsx
- web/src/components/room/youtube-player.tsx
- web/src/components/room/member-panel.tsx
- web/src/components/providers.tsx
- web/src/components/data-bootstrap.tsx
- web/src/components/layout/brand.tsx
- web/src/components/dashboard/history-profile.tsx
- web/src/components/public/info-pages.tsx
- web/src/app/(public)/page.tsx
- web/src/app/(public)/buat-room/page.tsx
- web/src/app/(public)/gabung/page.tsx
- web/src/app/(public)/gabung/[kode]/page.tsx
- web/src/app/(public)/masuk/page.tsx
- web/src/app/(public)/tentang/page.tsx
- web/src/app/(public)/bantuan/page.tsx
- web/src/app/(public)/kebijakan-privasi/page.tsx
- web/src/app/(public)/syarat-layanan/page.tsx
- tests/phase-two.spec.ts
- scripts/check-services.mjs
- README.md
- reports/screenshots/phase-2-{dashboard,room}-{1280,375}.png: diperbarui suite regresi 18 rute.

## Dihapus

- web/src/components/room/media-grid.tsx: simulasi kamera digantikan track LiveKit nyata.

## Tambahan pada deployment produksi

- scripts/check-production.mjs: validasi konfigurasi produksi tanpa menampilkan secret.
- scripts/smoke-production.mjs: smoke test hosting final, dua sesi, media sintetis, dan pembersihan fixture melalui Owner.
- shared/src/redis-key.ts, shared/package.json, realtime/package.json, package-lock.json: namespace Redis per lingkungan dan dependency workspace untuk Docker.
- .github/workflows/realtime-artifact.yml: build image dan artifact tanpa token registry.
- deploy/install-docker-ubuntu.sh: instalasi Docker resmi Ubuntu.
- .vercelignore, vercel.json, .gitignore: hosting region sin1 dan pengecualian file lokal/rahasia.
- web/src/components/public/deferred-public-rooms.tsx: daftar room dimuat mendekati viewport.
- web/src/components/public/public-rooms.tsx, home.tsx, web/src/app/globals.css: status muat/error dan penundaan render bagian di bawah viewport.
- web/src/components/query-provider.tsx, providers.tsx, web/src/app/dashboard/layout.tsx, web/src/app/room/[kode]/layout.tsx: TanStack Query hanya dimuat pada bagian yang menggunakannya.
- web/src/lib/realtime-client.ts, web/src/stores/app-store.ts: SDK klien dimuat sesuai kebutuhan.
- web/src/app/actions/room.ts, room-settings.ts, web/src/lib/seo.ts: invalidasi cache publik/metadata saat room dibuat, diubah, atau dihapus.
- .env.example, deploy/.env.example, package.json, README.md, deploy/PANDUAN.md, reports/phase-3.md: konfigurasi, perintah, dan dokumentasi terbaru.
- reports/phase-3-production-smoke.json, phase-3-lighthouse-production.json, screenshots/phase-3-production-*.png: bukti hosting final.

File `.env.production`, `deploy/.env.production`, dan `.vercel/` hanya tersedia lokal/server, tidak ikut commit. Seluruh perubahan kode/laporan disimpan di repository.
