import { describe, it, expect, vi } from "vitest";

// sayfa-seo veritabanına gidiyor; burada yalnız saf başlık kuralı sınanıyor.
vi.mock("@/lib/sayfa-seo", () => ({ aciklamayiKisalt: (s: string) => s, getSayfaSeo: async () => ({}) }));

const { baslikMetasi } = await import("@/lib/seo");

describe("baslikMetasi", () => {
  it("kısa başlık kök şablona bırakılır (marka eklenir)", () => {
    expect(baslikMetasi("Blog", "/blog")).toBe("Blog");
  });
  it("marka ekiyle 60'ı aşan başlıkta marka düşer", () => {
    expect(baslikMetasi("Meta Business Andromeda Güncellemesi Nedir? - 2026", "/x")).toEqual({
      absolute: "Meta Business Andromeda Güncellemesi Nedir? - 2026",
    });
  });
  it("ana sayfa olduğu gibi", () => {
    expect(baslikMetasi("Birebir Dijital Pazarlama Eğitimleri - Ahmet Ekinci Akademi", "/")).toBe(
      "Birebir Dijital Pazarlama Eğitimleri - Ahmet Ekinci Akademi",
    );
  });
});
