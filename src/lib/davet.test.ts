import { describe, expect, it } from "vitest";
import { DAVET_GECERLILIK_GUN, davetKoduCoz, davetKoduUret, davetKullanilmamis } from "@/lib/davet";

const GIZLI = "deneme-servis-anahtari";
const KIMLIK = "6b1f2c3d-4e5f-4a7b-8c9d-0e1f2a3b4c5d";

describe("davet kodu", () => {
  it("üretilen kod çözülüyor ve kimliği taşıyor", () => {
    const kod = davetKoduUret({ userId: KIMLIK, sonGiris: null }, GIZLI);
    expect(davetKoduCoz(kod, GIZLI)).toEqual({ gecerli: true, userId: KIMLIK, sonGiris: null });
  });

  it("son giriş zamanını taşıyor", () => {
    const kod = davetKoduUret({ userId: KIMLIK, sonGiris: "2026-11-01T10:00:00Z" }, GIZLI);
    const c = davetKoduCoz(kod, GIZLI);
    expect(c.gecerli && c.sonGiris).toBe("2026-11-01T10:00:00Z");
  });

  it("geçerlilik süresi dolunca reddediliyor", () => {
    const simdi = new Date("2026-11-26T12:00:00Z");
    const kod = davetKoduUret({ userId: KIMLIK, sonGiris: null, simdi }, GIZLI);
    const sonGun = new Date(simdi.getTime() + (DAVET_GECERLILIK_GUN * 24 - 1) * 3600_000);
    const sonrasi = new Date(simdi.getTime() + (DAVET_GECERLILIK_GUN * 24 + 1) * 3600_000);
    expect(davetKoduCoz(kod, GIZLI, sonGun).gecerli).toBe(true);
    expect(davetKoduCoz(kod, GIZLI, sonrasi)).toEqual({ gecerli: false, sebep: "suresi-doldu" });
  });

  it("başka anahtarla imzalanmış kod reddediliyor", () => {
    const kod = davetKoduUret({ userId: KIMLIK, sonGiris: null }, "baska-anahtar");
    expect(davetKoduCoz(kod, GIZLI)).toEqual({ gecerli: false, sebep: "bozuk" });
  });

  it("içeriği değiştirilmiş kod reddediliyor", () => {
    const kod = davetKoduUret({ userId: KIMLIK, sonGiris: null }, GIZLI);
    const [, imza] = kod.split(".");
    const sahte = Buffer.from(JSON.stringify({ u: "baskasi", s: 9_999_999_999, g: "" })).toString("base64url");
    expect(davetKoduCoz(`${sahte}.${imza}`, GIZLI)).toEqual({ gecerli: false, sebep: "bozuk" });
  });

  it("bozuk girdiler reddediliyor", () => {
    for (const kod of [null, undefined, "", "abc", "a.b.c", ".", "x".repeat(3000)]) {
      expect(davetKoduCoz(kod, GIZLI).gecerli, String(kod).slice(0, 10)).toBe(false);
    }
  });
});

describe("tek kullanımlık", () => {
  it("gönderimden beri giriş yoksa kullanılabilir", () => {
    expect(davetKullanilmamis(null, null)).toBe(true);
    expect(davetKullanilmamis(null, undefined)).toBe(true);
    expect(davetKullanilmamis("2026-11-01T10:00:00Z", "2026-11-01T10:00:00Z")).toBe(true);
  });

  it("gönderimden sonra giriş yapılmışsa bağlantı geçersiz", () => {
    expect(davetKullanilmamis(null, "2026-11-27T09:00:00Z")).toBe(false);
    expect(davetKullanilmamis("2026-11-01T10:00:00Z", "2026-11-27T09:00:00Z")).toBe(false);
  });
});
