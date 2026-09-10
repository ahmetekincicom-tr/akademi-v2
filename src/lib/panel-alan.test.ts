import { describe, expect, it } from "vitest";
import { kaydedilecekIsaret, kaydedilecekMetin } from "@/lib/panel-alan";

/**
 * Panelden kaydetme kuralı.
 *
 * Bu testler tek bir arızayı koruyor ve o arıza İKİ KEZ yaşandı: eğitimin
 * "başlık altı cümlesi" panelde değiştirilip kaydedildiğinde eski değerine
 * geri dönüyordu. Kural kaydetme yolunun içine gömülü olduğu için test
 * edilemiyordu; artık burada.
 */

describe("kaydedilecekMetin", () => {
  it("editörden gelen değer KAZANIYOR", () => {
    /*
      Asıl arıza buydu: mevcut değer her zaman kazanıyordu, yani panelde ne
      yazılırsa yazılsın kaydettikten sonra eski metin geri geliyordu.
    */
    expect(kaydedilecekMetin("yeni cümle", "eski cümle")).toBe("yeni cümle");
  });

  it("boş metin GEÇERLİ bir değer: metni siliyor", () => {
    // "Bu cümleyi kaldır" demenin yolu alanı boşaltmak. Boş gelen değer
    // mevcut değere düşerse alan asla temizlenemez.
    expect(kaydedilecekMetin("", "eski cümle")).toBe("");
    expect(kaydedilecekMetin("   ", "eski cümle")).toBe("");
  });

  it("alan hiç gönderilmediyse mevcut değer korunuyor", () => {
    expect(kaydedilecekMetin(undefined, "eski cümle")).toBe("eski cümle");
  });

  it("mevcut değer BOŞSA yedeğe düşüyor", () => {
    /*
      Eskiden burada `mevcut ?? yedek` yazıyordu. Veritabanındaki boş string
      null olmadığı için `??` hiç tetiklenmiyordu: hero cümlesi boş olan
      eğitimlerde (Ankara programı) alan kalıcı olarak boş kalıyordu.
    */
    expect(kaydedilecekMetin(undefined, "", "kısa açıklama")).toBe("kısa açıklama");
    expect(kaydedilecekMetin(undefined, "   ", "kısa açıklama")).toBe("kısa açıklama");
    expect(kaydedilecekMetin(undefined, null, "kısa açıklama")).toBe("kısa açıklama");
  });

  it("yedek verilmemişse boş dönüyor", () => {
    expect(kaydedilecekMetin(undefined, null)).toBe("");
  });

  it("baştaki ve sondaki boşlukları kırpıyor", () => {
    expect(kaydedilecekMetin("  yeni cümle  ", "eski")).toBe("yeni cümle");
    expect(kaydedilecekMetin(undefined, "  eski cümle  ")).toBe("eski cümle");
  });
});

describe("kaydedilecekIsaret", () => {
  it("editörden gelen işaret kazanıyor", () => {
    expect(kaydedilecekIsaret(true, false)).toBe(true);
  });

  it("false GEÇERLİ bir değer: işareti kaldırıyor", () => {
    // `||` ile yazılsaydı işareti kaldırmak imkânsız olurdu.
    expect(kaydedilecekIsaret(false, true)).toBe(false);
  });

  it("gönderilmediyse mevcut değer korunuyor", () => {
    expect(kaydedilecekIsaret(undefined, true)).toBe(true);
    expect(kaydedilecekIsaret(undefined, false)).toBe(false);
  });

  it("mevcut değer de yoksa varsayılana düşüyor", () => {
    /*
      duyuruGizli için varsayılan false olmak ZORUNDA: alan eski kayıtlarda
      hiç yok ve true'ya düşseydi alanın eklendiği gün bütün eğitimlerden
      kayıt duyurusu kaybolurdu.
    */
    expect(kaydedilecekIsaret(undefined, undefined)).toBe(false);
    expect(kaydedilecekIsaret(undefined, undefined, true)).toBe(true);
  });
});
