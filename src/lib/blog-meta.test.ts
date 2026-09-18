import { describe, it, expect } from "vitest";
import {
  okumaSuresi,
  tarihUzun,
  tarihIso,
  guncellemeGosterilecek,
  dateModifiedDegeri,
} from "@/lib/blog-meta";

describe("okumaSuresi", () => {
  it("boş içerikte en az 1 dk", () => {
    expect(okumaSuresi("")).toBe(1);
    expect(okumaSuresi("<p></p>")).toBe(1);
  });

  it("~200 kelime/dk hesaplar, etiketleri atar", () => {
    const kelimeler = Array.from({ length: 400 }, () => "kelime").join(" ");
    expect(okumaSuresi(`<p>${kelimeler}</p>`)).toBe(2);
  });
});

describe("tarih biçimleme", () => {
  it("uzun Türkçe biçim", () => {
    expect(tarihUzun("2026-08-27T10:00:00Z")).toBe("27 Ağustos 2026");
  });
  it("datetime için ISO gün", () => {
    expect(tarihIso("2026-08-27T10:00:00Z")).toBe("2026-08-27");
  });
  it("geçersiz/boş → boş string", () => {
    expect(tarihUzun(null)).toBe("");
    expect(tarihIso("abc")).toBe("");
  });
});

describe("guncellemeGosterilecek", () => {
  it("içerik güncelleme yoksa null", () => {
    expect(guncellemeGosterilecek("2026-08-27T00:00:00Z", null)).toBeNull();
  });
  it("aynı gün ise null (gereksiz 'Güncellendi' çıkmasın)", () => {
    expect(guncellemeGosterilecek("2026-08-27T08:00:00Z", "2026-08-27T20:00:00Z")).toBeNull();
  });
  it("sonraki bir günse güncelleme tarihini döndürür", () => {
    expect(guncellemeGosterilecek("2026-08-27T00:00:00Z", "2026-09-18T00:00:00Z")).toBe(
      "2026-09-18T00:00:00Z",
    );
  });
  it("güncelleme yayından önceyse null (tutarsız veri)", () => {
    expect(guncellemeGosterilecek("2026-08-27T00:00:00Z", "2026-08-20T00:00:00Z")).toBeNull();
  });
});

describe("dateModifiedDegeri", () => {
  it("gerçek içerik güncellemesi varsa onu kullanır", () => {
    expect(dateModifiedDegeri("2026-08-27T00:00:00Z", "2026-09-18T00:00:00Z", "2026-09-30T00:00:00Z")).toBe(
      "2026-09-18T00:00:00Z",
    );
  });
  it("yoksa yayın tarihine düşer (teknik updated_at'e DEĞİL)", () => {
    expect(dateModifiedDegeri("2026-08-27T00:00:00Z", null, "2026-09-30T00:00:00Z")).toBe(
      "2026-08-27T00:00:00Z",
    );
  });
});
