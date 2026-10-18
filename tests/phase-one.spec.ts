import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function login(page: Page) {
  await page.goto("/masuk");
  await page.getByRole("button", { name: "Lanjutkan dengan Google" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: /Mau nonton apa/ }),
  ).toBeVisible();
}
async function joinOwner(page: Page) {
  await login(page);
  await page.goto("/gabung/NG7KQ2XR");
  await page.getByRole("button", { name: "Gabung Sekarang" }).click();
  await expect(page).toHaveURL(/\/room\/NG7KQ2XR$/);
  await expect(page.getByLabel("Tulis pesan", { exact: true })).toBeVisible();
}
test("semua 18 rute lengkap dan tanpa error runtime", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await joinOwner(page);
  const routes = [
    "/",
    "/buat-room",
    "/gabung",
    "/gabung/NG7KQ2XR",
    "/masuk",
    "/tentang",
    "/bantuan",
    "/kebijakan-privasi",
    "/syarat-layanan",
    "/dashboard",
    "/dashboard/room-tersimpan",
    "/dashboard/playlist",
    "/dashboard/playlist/film-akhir-pekan",
    "/dashboard/riwayat",
    "/dashboard/profil",
    "/room/NG7KQ2XR",
    "/room/NG7KQ2XR/pengaturan",
    "/room/NG7KQ2XR/anggota",
  ];
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("h1").first(), route).toBeVisible();
    await expect(page.locator("body")).not.toContainText(
      /sedang dalam pengembangan|Lorem Ipsum/,
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
      `overflow ${route}`,
    ).toBeTruthy();
  }
  expect(errors).toEqual([]);
});
test("buat room tamu, validasi, tambah video, chat, dan persistensi", async ({
  page,
}) => {
  await page.goto("/buat-room");
  await page
    .getByRole("button", { name: "Buat Room Baru", exact: true })
    .click();
  await expect(
    page.getByText("Nama tampilan minimal 2 karakter."),
  ).toBeVisible();
  await page.getByLabel("Nama tampilan", { exact: true }).fill("Dewi Maharani");
  await page
    .getByLabel("Nama room", { exact: true })
    .fill("Nonton Akhir Pekan");
  await page
    .getByRole("button", { name: "Buat Room Baru", exact: true })
    .click();
  await expect(page).toHaveURL(/\/room\/[A-HJ-NP-Z2-9]{8}$/);
  await expect(
    page.getByText("Layar siap. Ceritanya dari kamu."),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Playlist", exact: true }).click();
  await page.getByRole("button", { name: "Cari Video", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Cari video YouTube demo" })
    .fill("Jakarta");
  await page.getByRole("option").first().click();
  await page.getByLabel("Tutup dialog").click();
  await expect(
    page.getByRole("button", { name: "Putar video demo" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Putar video demo" }).click();
  await expect(page.getByText("Simulasi pemutaran aktif")).toBeVisible();
  await page.getByRole("tab", { name: "Chat", exact: true }).click();
  await page
    .getByLabel("Tulis pesan", { exact: true })
    .fill("Halo teman-teman! <script>alert(1)</script>");
  await page.getByLabel("Kirim pesan", { exact: true }).click();
  await expect(page.getByRole("log")).toContainText(
    "<script>alert(1)</script>",
  );
  await page.reload();
  await expect(page.getByRole("log")).toContainText("Halo teman-teman!");
});
test("hak akses Member, anggota bisu, Moderator, dan Owner", async ({
  page,
}) => {
  await joinOwner(page);
  await page.getByText("Alat verifikasi peran demo").click();
  await page
    .getByLabel("Lihat room sebagai anggota contoh")
    .selectOption("budi");
  await expect(page.getByLabel("Tulis pesan", { exact: true })).toBeDisabled();
  await expect(page.getByLabel("Aktifkan mikrofon demo")).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Putar video demo" }),
  ).toBeDisabled();
  await page.getByRole("tab", { name: "Playlist", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Cari Video", exact: true }),
  ).toBeDisabled();
  await page.goto("/room/NG7KQ2XR/pengaturan");
  await expect(
    page.getByRole("heading", { name: "Akses terbatas" }),
  ).toBeVisible();
  await page.goto("/room/NG7KQ2XR");
  await page.getByText("Alat verifikasi peran demo").click();
  await page
    .getByLabel("Lihat room sebagai anggota contoh")
    .selectOption("ayu");
  await page.getByRole("tab", { name: "Playlist", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Cari Video", exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole("button", { name: "Putar video demo" }),
  ).toBeDisabled();
  await page.goto("/room/NG7KQ2XR/anggota");
  await page.getByLabel("Moderasi Budi Santoso").click();
  await page.getByRole("menuitem", { name: "Batalkan Bisu" }).click();
  await page
    .getByRole("button", { name: "Batalkan Bisu", exact: true })
    .click();
  await expect(
    page.getByText("Batalkan Bisu berhasil diterapkan."),
  ).toBeVisible();
  await expect(page.getByLabel("Moderasi Rizky Pratama")).toHaveCount(0);
});
test("dashboard playlist, urutan keyboard, profil dan riwayat", async ({
  page,
}) => {
  await login(page);
  await page.goto("/dashboard/playlist/film-akhir-pekan");
  const before = await page
    .getByRole("button", { name: /Ubah urutan/ })
    .first()
    .getAttribute("aria-label");
  await page
    .getByRole("button", { name: /Ubah urutan/ })
    .first()
    .focus();
  // Model a real key press: dnd-kit installs its keyboard listener on a timer.
  await page.keyboard.press("Space", { delay: 100 });
  await expect(
    page.getByRole("button", { name: before!, exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("ArrowDown", { delay: 100 });
  await expect(page.getByRole("status")).toContainText("Posisi tujuan 2.");
  await page.keyboard.press("Space", { delay: 100 });
  await expect
    .poll(() =>
      page
        .getByRole("button", { name: /Ubah urutan/ })
        .first()
        .getAttribute("aria-label"),
    )
    .not.toBe(before);
  await page.goto("/dashboard/profil");
  await page.getByLabel("Nama tampilan default").fill("Rizky Nonton");
  await page
    .getByRole("button", { name: "Simpan Perubahan", exact: true })
    .click();
  await page.reload();
  await expect(page.getByLabel("Nama tampilan default")).toHaveValue(
    "Rizky Nonton",
  );
  await page.goto("/dashboard/riwayat");
  await page.getByRole("button", { name: "Hapus Semua", exact: true }).click();
  await page
    .getByRole("button", { name: "Hapus Riwayat", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Cerita berikutnya menunggu" }),
  ).toBeVisible();
});
test("room privat dan kode salah menampilkan penjelasan", async ({ page }) => {
  await page.goto("/gabung");
  await page.getByLabel("Kode room atau tautan undangan").fill("salah");
  await page.getByRole("button", { name: "Temukan Room" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "kode room 8 karakter" }),
  ).toBeVisible();
  await page.goto("/gabung/PD8WZ3HF");
  await expect(
    page.getByRole("heading", { name: "Undangan diperlukan" }),
  ).toBeVisible();
  await page.goto("/room/ZZZZZZZZ");
  await expect(
    page.getByRole("heading", { name: "Room tidak ditemukan" }),
  ).toBeVisible();
});
test("tampilan mobile dan tablet tanpa overflow", async ({ page }) => {
  await joinOwner(page);
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "/",
      "/buat-room",
      "/dashboard",
      "/dashboard/playlist/film-akhir-pekan",
      "/dashboard/profil",
      "/room/NG7KQ2XR",
      "/room/NG7KQ2XR/anggota",
      "/room/NG7KQ2XR/pengaturan",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1").first()).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `${width} ${route} ${JSON.stringify(
          await page.evaluate(() => ({
            doc: document.documentElement.scrollWidth,
            body: document.body.scrollWidth,
            viewport: innerWidth,
            elements: Array.from(document.querySelectorAll("*"))
              .map((el) => ({
                tag: el.tagName,
                classes: el.getAttribute("class"),
                width: el.getBoundingClientRect().width,
                right: el.getBoundingClientRect().right,
                overflow: getComputedStyle(el).overflowX,
                parentOverflow: el.parentElement
                  ? getComputedStyle(el.parentElement).overflowX
                  : "",
              }))
              .filter((el) => el.right > innerWidth + 1)
              .slice(0, 12),
          })),
        )}`,
      ).toBeTruthy();
    }
    await page.goto("/room/NG7KQ2XR");
    if (width < 1024) {
      const controls = await page
        .getByRole("group", { name: "Kontrol media room" })
        .boundingBox();
      const navigation = await page
        .getByRole("tablist", { name: "Panel ruang nonton" })
        .boundingBox();
      expect(controls!.y + controls!.height).toBeLessThanOrEqual(navigation!.y);
    }
    await page.getByRole("tab", { name: "Playlist", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Cari Video", exact: true }),
    ).toBeVisible();
  }
  await page.screenshot({
    path: "test-results/room-desktop.png",
    fullPage: true,
  });
  await page.goto("/");
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const image of await page.locator("main img").all())
    await image.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(350); // Tunggu transisi masuk 300ms selesai untuk foto QA.
  await page.screenshot({
    path: "test-results/home-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-results/home-mobile.png",
    fullPage: true,
  });
  await page.goto("/room/NG7KQ2XR");
  await page.screenshot({
    path: "test-results/room-mobile.png",
    fullPage: true,
  });
  await page.goto("/dashboard");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForTimeout(350); // Foto QA diambil setelah transisi halaman selesai.
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
});
test("aksesibilitas halaman utama, form, dashboard dan room", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await joinOwner(page);
  for (const route of [
    "/",
    "/buat-room",
    "/gabung",
    "/gabung/NG7KQ2XR",
    "/masuk",
    "/tentang",
    "/bantuan",
    "/kebijakan-privasi",
    "/syarat-layanan",
    "/dashboard",
    "/dashboard/room-tersimpan",
    "/dashboard/playlist",
    "/dashboard/playlist/film-akhir-pekan",
    "/dashboard/riwayat",
    "/dashboard/profil",
    "/room/NG7KQ2XR",
    "/room/NG7KQ2XR/pengaturan",
    "/room/NG7KQ2XR/anggota",
  ]) {
    await page.goto(route);
    await page.mouse.move(0, 0);
    await expect(page.locator("h1").first()).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        description: v.description,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          reason: n.failureSummary,
        })),
      })),
      route,
    ).toEqual([]);
  }
});
test("pengaturan password, akses penuh, dan konfirmasi hapus room", async ({
  page,
}) => {
  await joinOwner(page);
  await page.goto("/room/NG7KQ2XR/pengaturan");
  await page
    .getByLabel("Password room (opsional)", { exact: true })
    .fill("rahasia-demo");
  await page.getByLabel("Mode kontrol video").selectOption("everyone");
  await page
    .getByRole("button", { name: "Simpan Perubahan", exact: true })
    .click();
  await expect(page.getByText("Pengaturan room disimpan.")).toBeVisible();
  await page.evaluate(() => {
    const value = JSON.parse(localStorage.getItem("watchsync-demo-v1")!);
    value.state.memberships = {};
    value.state.user = null;
    localStorage.setItem("watchsync-demo-v1", JSON.stringify(value));
  });
  await page.goto("/gabung/NG7KQ2XR");
  await page.getByLabel("Nama tampilan", { exact: true }).fill("Tamu Baru");
  await page.getByLabel("Password room", { exact: true }).fill("salah");
  await page.getByRole("button", { name: "Gabung Sekarang" }).click();
  await expect(
    page.getByText("Password belum tepat. Silakan periksa kembali."),
  ).toBeVisible();
  await page.getByLabel("Password room", { exact: true }).fill("rahasia-demo");
  await page.getByRole("button", { name: "Gabung Sekarang" }).click();
  await expect(page).toHaveURL(/\/room\/NG7KQ2XR$/);
  await expect(
    page.getByRole("button", { name: "Putar video demo" }),
  ).toBeEnabled();
  await page.getByText("Alat verifikasi peran demo").click();
  await page
    .getByLabel("Lihat room sebagai anggota contoh")
    .selectOption("rizky");
  await page.goto("/room/NG7KQ2XR/pengaturan");
  await page.getByRole("button", { name: "Hapus Room", exact: true }).click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Hapus Room", exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel(/Ketik “Malam Minggu/)
    .fill("Malam Minggu Nonton Film Indonesia");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Hapus Room", exact: true })
    .click();
  await expect(page).toHaveURL("/");
  await page.goto("/room/NG7KQ2XR");
  await expect(
    page.getByRole("heading", { name: "Room tidak ditemukan" }),
  ).toBeVisible();
});
