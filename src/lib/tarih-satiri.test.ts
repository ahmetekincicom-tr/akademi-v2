import { describe, expect, it } from "vitest";
import { ayAnahtari, tarihSatiri } from "@/lib/tarih-satiri";

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
