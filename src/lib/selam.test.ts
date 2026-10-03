import { describe, expect, it } from "vitest";
import { gunSelami } from "@/lib/selam";

// Türkiye UTC+3 (yaz saati yok): TR saati = UTC + 3.
const tr = (saat: number, dakika = 0) => new Date(Date.UTC(2026, 9, 3, saat - 3, dakika));

describe("gunSelami", () => {
  it("Türkiye saatine göre selam verir", () => {
    expect(gunSelami(tr(5))).toBe("Günaydın");
    expect(gunSelami(tr(11, 59))).toBe("Günaydın");
    expect(gunSelami(tr(12))).toBe("Merhaba");
    expect(gunSelami(tr(17, 59))).toBe("Merhaba");
    expect(gunSelami(tr(18))).toBe("İyi akşamlar");
    expect(gunSelami(tr(22, 59))).toBe("İyi akşamlar");
    expect(gunSelami(tr(23))).toBe("İyi geceler");
    expect(gunSelami(tr(4, 59))).toBe("İyi geceler");
  });

  it("gece yarısını 24 değil 0 sayar", () => {
    expect(gunSelami(tr(24))).toBe("İyi geceler");
  });
});
