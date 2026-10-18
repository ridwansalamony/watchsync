# Daftar file Fase 2

AGENTS.md, PRD.md, dan SKILL.md dipertahankan. .env.local berisi kredensial milik pengguna dan tidak disalin ke laporan. Artefak build, node_modules, test-results, dan runtime portabel .runtime tidak dicantumkan.

## Dibuat

- realtime/src/index.ts
- realtime/src/maintenance.ts
- realtime/tsconfig.json
- reports/phase-2-files.md
- reports/phase-2.md
- reports/screenshots/phase-2-dashboard-1280.png
- reports/screenshots/phase-2-dashboard-375.png
- reports/screenshots/phase-2-room-1280.png
- reports/screenshots/phase-2-room-375.png
- scripts/check-services.mjs
- scripts/test-maintenance.ts
- tests/phase-two.spec.ts
- web/drizzle.config.ts
- web/drizzle/0000_pretty_stature.sql
- web/drizzle/meta/0000_snapshot.json
- web/drizzle/meta/_journal.json
- web/src/app/actions/dashboard.ts
- web/src/app/actions/room-settings.ts
- web/src/app/actions/room.ts
- web/src/app/api/auth/[...nextauth]/route.ts
- web/src/app/api/bootstrap/route.ts
- web/src/app/api/room/[code]/route.ts
- web/src/app/api/rooms/public/route.ts
- web/src/app/api/youtube/search/route.ts
- web/src/app/api/youtube/video/route.ts
- web/src/auth.ts
- web/src/components/data-bootstrap.tsx
- web/src/components/room/youtube-player.tsx
- web/src/db/index.ts
- web/src/db/schema.ts
- web/src/db/seed.ts
- web/src/hooks/use-dashboard.ts
- web/src/hooks/use-room-sync.ts
- web/src/lib/client-data.ts
- web/src/lib/guest.ts
- web/src/lib/identity.ts
- web/src/lib/invitation.ts
- web/src/lib/notify-room.ts
- web/src/lib/realtime-client.ts
- web/src/lib/redis.ts
- web/src/lib/room-data.ts
- web/src/lib/youtube.ts
- web/src/middleware.ts

- shared/src/video-policy.ts

- scripts/test-identity.ts

- web/src/lib/merge-guest.ts

## Diubah

- .env.example
- .gitignore
- README.md
- package-lock.json
- package.json
- playwright.config.ts
- realtime/README.md
- realtime/package.json
- web/next.config.ts
- web/package.json
- web/src/components/common/confirm-dialog.tsx
- web/src/components/common/video-picker.tsx
- web/src/components/dashboard/history-profile.tsx
- web/src/components/dashboard/overview.tsx
- web/src/components/dashboard/playlists.tsx
- web/src/components/layout/dashboard-shell.tsx
- web/src/components/layout/public-shell.tsx
- web/src/components/providers.tsx
- web/src/components/public/home.tsx
- web/src/components/public/info-pages.tsx
- web/src/components/public/login.tsx
- web/src/components/public/public-rooms.tsx
- web/src/components/public/room-forms.tsx
- web/src/components/room/chat-panel.tsx
- web/src/components/room/member-panel.tsx
- web/src/components/room/playlist-panel.tsx
- web/src/components/room/room-settings.tsx
- web/src/components/room/room-shell.tsx
- web/src/components/room/watch-room.tsx
- web/src/stores/app-store.ts

- shared/package.json

## Dihapus/diganti

- web/src/components/room/demo-player.tsx
- web/src/hooks/use-demo-dashboard.ts
