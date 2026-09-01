import { describe, it, expect } from "vitest";
import { etkinlikGovdesi, takvimYapilandirildiMi } from "@/lib/takvim";

describe("etkinlikGovdesi", () => {
  const temel = {
    baslik: "Danışmanlık görüşmesi · Ayşe Yılmaz",
    aciklama: "Katılımcı: Ayşe Yılmaz",
    baslangicUtc: "2026-09-10T12:00:00.000Z",
    sureDk: 45,
  };

  it("bitişi süreye göre hesaplar", () => {
    const g = etkinlikGovdesi(temel);
    expect(g.start.dateTime).toBe("2026-09-10T12:00:00.000Z");
    expect(g.end.dateTime).toBe("2026-09-10T12:45:00.000Z");
  });

  it("saat dilimini Türkiye olarak yazar", () => {
    const g = etkinlikGovdesi(temel);
    expect(g.start.timeZone).toBe("Europe/Istanbul");
    expect(g.end.timeZone).toBe("Europe/Istanbul");
  });

  /*
    Sıfır ya da eksi süre, Google'ın reddettiği bir aralık üretiyordu
    (bitiş başlangıçtan önce). Panelde süre alanı boş bırakılabildiği için
    bu gerçekten oluşabilecek bir durum.
  */
  it("süre sıfır ya da eksi geldiğinde bitişi başlangıcın önüne almaz", () => {
    const g = etkinlikGovdesi({ ...temel, sureDk: 0 });
    expect(new Date(g.end.dateTime).getTime()).toBeGreaterThan(new Date(g.start.dateTime).getTime());

    const eksi = etkinlikGovdesi({ ...temel, sureDk: -30 });
    expect(new Date(eksi.end.dateTime).getTime()).toBeGreaterThan(new Date(eksi.start.dateTime).getTime());
  });

  /*
    Boş metin yerine undefined: Google boş string'i "açıklaması silinmiş"
    saymıyor, düz boş bir alan olarak yazıyor ve etkinlikte bomboş bir
    açıklama kutusu kalıyordu.
  */
  it("boş açıklama ve konumu hiç göndermez", () => {
    const g = etkinlikGovdesi({ ...temel, aciklama: "", konum: "   " });
    expect(g.description).toBeUndefined();
    expect(g.location).toBeUndefined();
  });

  it("toplantı bağlantısını konum olarak taşır", () => {
    const g = etkinlikGovdesi({ ...temel, konum: " https://meet.google.com/abc-defg-hij " });
    expect(g.location).toBe("https://meet.google.com/abc-defg-hij");
  });

  it("varsayılan hatırlatıcıları kapatıp kendi hatırlatıcılarını koyar", () => {
    const g = etkinlikGovdesi(temel);
    expect(g.reminders.useDefault).toBe(false);
    expect(g.reminders.overrides.map((h) => h.minutes)).toEqual([1440, 10]);
  });
});

describe("takvimYapilandirildiMi", () => {
  /*
    Üçü birden aranıyor: ikisi tanımlıyken üçüncüsü eksikse özellik "açık"
    görünüp her planlamada hata döndürürdü.
  */
  it("değişkenlerden biri eksikse kapalı sayar", () => {
    const eski = { ...process.env };
    try {
      process.env.GOOGLE_TAKVIM_ISTEMCI_ID = "id";
      process.env.GOOGLE_TAKVIM_ISTEMCI_SIRRI = "sir";
      delete process.env.GOOGLE_TAKVIM_YENILEME_ANAHTARI;
      expect(takvimYapilandirildiMi()).toBe(false);

      process.env.GOOGLE_TAKVIM_YENILEME_ANAHTARI = "anahtar";
      expect(takvimYapilandirildiMi()).toBe(true);
    } finally {
      process.env = eski;
    }
  });
});
