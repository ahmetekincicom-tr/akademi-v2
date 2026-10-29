import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/public", () => ({ createPublicClient: () => ({}) }));

const { enGec, yaziTarihi } = await import("./site-haritasi");

describe("enGec", () => {
  it("geçerli tarihlerin en geçini verir; geçersiz ve boşları atlar", () => {
    expect(enGec("2026-08-01", null, "2026-10-28T09:00:00Z", undefined, "olmayan", new Date("2026-09-15"))?.toISOString()).toBe(
      "2026-10-28T09:00:00.000Z",
    );
  });

  it("hiç geçerli tarih yoksa undefined (lastmod yazılmaz)", () => {
    expect(enGec()).toBeUndefined();
    expect(enGec(null, undefined, "", "tarih değil")).toBeUndefined();
  });
});

describe("yaziTarihi", () => {
  const y = { icerikGuncelleme: null, yayinTarihi: null, guncelleme: "2026-10-01T00:00:00Z" };
  it("önce gerçek içerik güncellemesi, sonra yayın, en son kayıt tarihi", () => {
    expect(yaziTarihi({ ...y, icerikGuncelleme: "2026-10-20T00:00:00Z", yayinTarihi: "2026-09-01T00:00:00Z" })).toBe("2026-10-20T00:00:00Z");
    expect(yaziTarihi({ ...y, yayinTarihi: "2026-09-01T00:00:00Z" })).toBe("2026-09-01T00:00:00Z");
    expect(yaziTarihi(y)).toBe("2026-10-01T00:00:00Z");
  });
});
