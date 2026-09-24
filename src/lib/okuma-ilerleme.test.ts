import { describe, it, expect } from "vitest";
import { okumaOrani } from "@/lib/okuma-ilerleme";

// ekran 900, başlık 80 → okuma alanı 820. İçerik 3000px → kaydırılabilir 2180.
const temel = { yukseklik: 3000, ekran: 900, ofset: 80 };

describe("okumaOrani", () => {
  it("içerik başlığın altındayken 0", () => {
    expect(okumaOrani({ ...temel, ust: 600 })).toBe(0);
    expect(okumaOrani({ ...temel, ust: 80 })).toBe(0);
  });

  it("yarı yolda ~0.5", () => {
    expect(okumaOrani({ ...temel, ust: 80 - 1090 })).toBeCloseTo(0.5, 5);
  });

  it("içeriğin sonu ekranın altına gelince 1 ve ötesinde 1'de kalır", () => {
    expect(okumaOrani({ ...temel, ust: 80 - 2180 })).toBe(1);
    expect(okumaOrani({ ...temel, ust: -5000 })).toBe(1);
  });

  it("tek ekrana sığan içerikte null (çubuk gizli)", () => {
    expect(okumaOrani({ ust: 200, yukseklik: 500, ekran: 900, ofset: 80 })).toBeNull();
  });
});
