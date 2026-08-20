import { describe, expect, it } from "vitest";
import { hakDurumu, type Gorusme, type GorusmeAyarlari } from "@/lib/gorusme";

/**
 * Ücretsiz danışmanlık hakkının sayımı.
 *
 * Bu hesabın bir kez sessizce yanlış çalıştığı görüldü: görüşme listesi
 * kapsamsız okunduğu için yöneticinin panelinde HERKESİN görüşmeleri
 * sayılıyordu. Sayım fonksiyonu doğruydu, girdisi yanlıştı — testin
 * yaptığı iş de bu: fonksiyonun sözleşmesini sabitlemek, girdinin doğru
 * gelmesini ise kapsam bekçisi (kapsam.test.ts) üstleniyor.
 */

const AYAR: GorusmeAyarlari = {
  ucretsizHak: 3,
  ucret: 2500,
  sureDk: 45,
  odemeAciklamasi: "",
  aktif: true,
  okundu: true,
};

function gorusme(ekle: Partial<Gorusme>): Gorusme {
  return {
    id: crypto.randomUUID(),
    paymentId: null,
    userId: "k1",
    kisiAd: "Katılımcı",
    kisiEmail: "k@ornek.test",
    konu: "Konu",
    aciklama: "",
    tercihZaman: "",
    ucretsiz: true,
    ucret: null,
    odendi: false,
    odemeReferansi: "",
    baslangic: null,
    sureDk: 45,
    toplantiLink: "",
    durum: "talep",
    adminNotu: "",
    olusturma: new Date().toISOString(),
    ...ekle,
  };
}

describe("hakDurumu", () => {
  it("eğitim kaydı yoksa ücretsiz hak vermiyor", () => {
    // Ücretsiz hak eğitime katılanların hakkı; panele girmiş herkesin değil.
    const d = hakDurumu([], AYAR, false);
    expect(d.kalan).toBe(0);
    expect(d.sonrakiUcretli).toBe(true);
  });

  it("eğitim kaydı varsa tam hak veriyor", () => {
    const d = hakDurumu([], AYAR, true);
    expect(d.kalan).toBe(3);
    expect(d.sonrakiUcretli).toBe(false);
  });

  it("iptal edilen görüşme hakkı yakmıyor", () => {
    const d = hakDurumu(
      [gorusme({ durum: "iptal" }), gorusme({ durum: "tamamlandi" })],
      AYAR,
      true,
    );
    expect(d.kullanilan).toBe(1);
    expect(d.kalan).toBe(2);
  });

  it("ücretli görüşme ücretsiz haktan düşmüyor", () => {
    const d = hakDurumu([gorusme({ ucretsiz: false, durum: "tamamlandi" })], AYAR, true);
    expect(d.kullanilan).toBe(0);
    expect(d.kalan).toBe(3);
  });

  it("hak bitince kalan negatife düşmüyor", () => {
    const dortTane = Array.from({ length: 4 }, () => gorusme({ durum: "tamamlandi" }));
    const d = hakDurumu(dortTane, AYAR, true);
    expect(d.kalan).toBe(0);
    expect(d.sonrakiUcretli).toBe(true);
  });

  it("bekleyen talebi görüyor", () => {
    expect(hakDurumu([gorusme({ durum: "odeme_bekliyor" })], AYAR, true).bekleyen).toBe(true);
    expect(hakDurumu([gorusme({ durum: "tamamlandi" })], AYAR, true).bekleyen).toBe(false);
  });
});
