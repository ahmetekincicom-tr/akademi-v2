import { describe, it, expect } from "vitest";
import { ekleriDogrula, ekDosyaAdi, ekOnKontrol } from "@/lib/destek-ek";

const UID = "11111111-2222-3333-4444-555555555555";
const ek = (o: Record<string, unknown> = {}) => ({ yol: `${UID}/1700-ekran.webp`, ad: "ekran.png", tip: "image/webp", boyut: 2048, ...o });

describe("ekleriDogrula", () => {
  it("boş / null → boş liste", () => {
    expect(ekleriDogrula(undefined, UID)).toEqual({ ekler: [] });
    expect(ekleriDogrula([], UID)).toEqual({ ekler: [] });
  });

  it("kendi klasöründeki geçerli ekleri kabul eder", () => {
    const r = ekleriDogrula([ek()], UID);
    expect("ekler" in r && r.ekler).toHaveLength(1);
  });

  it("başkasının klasörünü, yol kaçışını, yasak türü ve fazla sayıyı reddeder", () => {
    expect(ekleriDogrula([ek({ yol: "baska-uid/x.png" })], UID)).toHaveProperty("hata");
    expect(ekleriDogrula([ek({ yol: `${UID}/../baska/x.png` })], UID)).toHaveProperty("hata");
    expect(ekleriDogrula([ek({ tip: "image/svg+xml" })], UID)).toHaveProperty("hata");
    expect(ekleriDogrula([ek(), ek(), ek(), ek(), ek()], UID)).toHaveProperty("hata");
    expect(ekleriDogrula("x", UID)).toHaveProperty("hata");
  });
});

describe("ekDosyaAdi", () => {
  it("Türkçe harf ve boşlukları sadeleştirir, uzantıyı korur", () => {
    expect(ekDosyaAdi("Ekran Görüntüsü 2026-09-24 Öğle.PNG")).toBe("ekran-goruntusu-2026-09-24-ogle.png");
    expect(ekDosyaAdi("...")).toBe("dosya");
  });
});

describe("ekOnKontrol", () => {
  it("tür ve boyut sınırları", () => {
    expect(ekOnKontrol({ type: "image/png", size: 1000 })).toBeNull();
    expect(ekOnKontrol({ type: "application/zip", size: 1000 })).toMatch(/Yalnız/);
    expect(ekOnKontrol({ type: "application/pdf", size: 11 * 1024 * 1024 })).toMatch(/10 MB/);
  });
});
