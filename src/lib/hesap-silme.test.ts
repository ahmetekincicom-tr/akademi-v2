import { describe, expect, it } from "vitest";
import { kimlikGecerli, onayEslesiyor, silmeEngeli } from "./hesap-silme";

const ID = "6b1f2c3d-4e5f-4a7b-8c9d-0e1f2a3b4c5d";

describe("hesap silme kuralları", () => {
  it("yalnızca UUID kabul eder", () => {
    expect(kimlikGecerli(ID)).toBe(true);
    expect(kimlikGecerli("abc")).toBe(false);
    expect(kimlikGecerli(undefined)).toBe(false);
  });

  it("onay: e-posta, harf büyüklüğü ve boşluk önemsiz; e-postasız hesapta SİL", () => {
    expect(onayEslesiyor("  Ayse@Ornek.com ", "ayse@ornek.com")).toBe(true);
    expect(onayEslesiyor("baska@ornek.com", "ayse@ornek.com")).toBe(false);
    expect(onayEslesiyor("", "ayse@ornek.com")).toBe(false);
    expect(onayEslesiyor("sil", null)).toBe(true);
    expect(onayEslesiyor("SİL", null)).toBe(true);
    expect(onayEslesiyor("evet", null)).toBe(false);
  });

  it("kendini, yöneticiyi ve bulunamayanı silmez", () => {
    expect(silmeEngeli({ id: ID, role: "student" }, "baska")).toBeNull();
    expect(silmeEngeli({ id: ID, role: "student" }, ID)).toBe("kendi");
    expect(silmeEngeli({ id: ID, role: "admin" }, "baska")).toBe("yonetici");
    expect(silmeEngeli(null, "baska")).toBe("yok");
  });
});
