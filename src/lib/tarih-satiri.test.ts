import { describe, expect, it } from "vitest";
import { ayAnahtari, gunFarki, tarihSatiri, trGun } from "@/lib/tarih-satiri";

describe("tarihSatiri", () => {
  const an = new Date(Date.UTC(2026, 9, 3, 9)); // 3 Ekim 2026 Cumartesi, TR 12:00

  it("gün adı başta, Türkçe büyük harf", () => {
    expect(tarihSatiri(an)).toBe("CUMARTESİ · 3 EKİM 2026");
    expect(tarihSatiri(an, { yil: false })).toBe("CUMARTESİ · 3 EKİM");
  });
});

describe("ayAnahtari", () => {
  it("Türkiye saatiyle ay sınırı", () => {
    // UTC 30 Eylül 22:00 = TR 1 Ekim 01:00
    expect(ayAnahtari(new Date(Date.UTC(2026, 8, 30, 22)))).toBe("2026-10");
    expect(ayAnahtari(new Date(Date.UTC(2026, 8, 30, 20)))).toBe("2026-09");
  });
});

describe("trGun / gunFarki", () => {
  it("Türkiye saatine göre gün", () => {
    // UTC 22:30 = TR ertesi gün 01:30
    expect(trGun(new Date(Date.UTC(2026, 9, 7, 22, 30)))).toEqual({ yil: 2026, ay: 9, gun: 8 });
  });
  it("takvim günü farkı", () => {
    const simdi = new Date(Date.UTC(2026, 9, 3, 20)); // TR 23:00, 3 Ekim
    expect(gunFarki(simdi, new Date(Date.UTC(2026, 9, 3, 21, 30)))).toBe(1); // TR 00:30, 4 Ekim
    expect(gunFarki(simdi, new Date(Date.UTC(2026, 9, 8, 11)))).toBe(5);
    expect(gunFarki(simdi, new Date(Date.UTC(2026, 9, 3, 9)))).toBe(0);
  });
});
