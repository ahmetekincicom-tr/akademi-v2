import { describe, it, expect } from "vitest";
import {
  bugunTR,
  suresiDoldu,
  kalanGun,
  basvuruHedefi,
  maddeler,
  ilanGirdisiniDogrula,
  lokasyonMetni,
  type IlanGirdi,
} from "@/lib/firsat";

const girdi = (o: Partial<IlanGirdi> = {}): IlanGirdi => ({
  pozisyon: "Performans Pazarlama Uzmanı",
  sirketAdi: "Örnek Ajans",
  sirketLogo: null,
  sirketWeb: "",
  kategori: "Performans pazarlama",
  calismaTipi: "tam_zamanli",
  calismaModeli: "hibrit",
  sehir: "İstanbul",
  seviye: "orta",
  aciklama: "Açıklama",
  sorumluluklar: "- Kampanya kurulumu\n\n• Raporlama",
  arananOzellikler: "",
  tercihenOzellikler: "",
  ucret: "",
  basvuruTipi: "url",
  basvuruAdresi: "https://ornek.com/kariyer",
  sonBasvuru: "",
  durum: "yayinda",
  oneCikan: false,
  ...o,
});

describe("bugunTR", () => {
  it("Türkiye gününü verir (UTC 22:30 → ertesi gün)", () => {
    expect(bugunTR(new Date("2026-09-24T22:30:00Z"))).toBe("2026-09-25");
    expect(bugunTR(new Date("2026-09-24T20:30:00Z"))).toBe("2026-09-24");
  });
});

describe("suresiDoldu / kalanGun", () => {
  it("son gün boyunca açık, ertesi gün kapalı", () => {
    expect(suresiDoldu({ durum: "yayinda", sonBasvuru: "2026-09-24" }, "2026-09-24")).toBe(false);
    expect(suresiDoldu({ durum: "yayinda", sonBasvuru: "2026-09-24" }, "2026-09-25")).toBe(true);
    expect(suresiDoldu({ durum: "yayinda", sonBasvuru: null }, "2030-01-01")).toBe(false);
  });
  it("elle sona erdirilen ilan tarih ne olursa olsun kapalı", () => {
    expect(suresiDoldu({ durum: "sona_erdi", sonBasvuru: "2099-01-01" }, "2026-09-24")).toBe(true);
  });
  it("kalan gün", () => {
    expect(kalanGun("2026-09-27", "2026-09-24")).toBe(3);
    expect(kalanGun("2026-09-24", "2026-09-24")).toBe(0);
    expect(kalanGun(null, "2026-09-24")).toBeNull();
  });
});

describe("basvuruHedefi / lokasyonMetni", () => {
  it("e-postada konu satırı hazır", () => {
    expect(basvuruHedefi({ basvuruTipi: "eposta", basvuruAdresi: "ik@x.com", pozisyon: "SEO Uzmanı" })).toBe(
      "mailto:ik@x.com?subject=Ba%C5%9Fvuru%3A%20SEO%20Uzman%C4%B1",
    );
    expect(basvuruHedefi({ basvuruTipi: "url", basvuruAdresi: "https://x.com/a", pozisyon: "x" })).toBe("https://x.com/a");
  });
  it("lokasyon", () => {
    expect(lokasyonMetni({ sehir: "Ankara", calismaModeli: "ofis" })).toBe("Ankara · Ofis");
    expect(lokasyonMetni({ sehir: null, calismaModeli: "uzaktan" })).toBe("Remote");
  });
});

describe("maddeler", () => {
  it("madde işaretlerini ve boş satırları atar", () => {
    expect(maddeler("- a\n\n• b\n * c \n")).toEqual(["a", "b", "c"]);
  });
});

describe("ilanGirdisiniDogrula", () => {
  it("geçerli girdiyi satıra çevirir", () => {
    const r = ilanGirdisiniDogrula(girdi());
    expect("satir" in r && r.satir.sorumluluklar).toEqual(["Kampanya kurulumu", "Raporlama"]);
    expect("satir" in r && r.satir.son_basvuru).toBeNull();
  });
  it("hatalı girdileri reddeder", () => {
    expect(ilanGirdisiniDogrula(girdi({ pozisyon: " " }))).toHaveProperty("hata");
    expect(ilanGirdisiniDogrula(girdi({ sehir: "", calismaModeli: "ofis" }))).toHaveProperty("hata");
    expect(ilanGirdisiniDogrula(girdi({ basvuruAdresi: "javascript:alert(1)" }))).toHaveProperty("hata");
    expect(ilanGirdisiniDogrula(girdi({ basvuruTipi: "eposta", basvuruAdresi: "yok" }))).toHaveProperty("hata");
    expect(ilanGirdisiniDogrula(girdi({ aciklama: "" }))).toHaveProperty("hata");
    expect(ilanGirdisiniDogrula(girdi({ calismaTipi: "x" as never }))).toHaveProperty("hata");
  });
  it("uzaktan ilanda şehir isteğe bağlı; taslakta açıklama boş olabilir", () => {
    expect(ilanGirdisiniDogrula(girdi({ sehir: "", calismaModeli: "uzaktan" }))).toHaveProperty("satir");
    expect(ilanGirdisiniDogrula(girdi({ aciklama: "", durum: "taslak" }))).toHaveProperty("satir");
  });
});
