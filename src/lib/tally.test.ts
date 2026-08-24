import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { imzaDogru, kullaniciyiBul, yanitOlayiMi } from "@/lib/tally";

/**
 * Tally webhook'unun kapısı.
 *
 * Bu testin sebebi: imza kontrolü yanlış yazıldığında HİÇBİR BELİRTİ
 * vermiyor. Uç nokta çalışmaya devam eder, formlar işaretlenir, her şey
 * normal görünür — sadece artık kimliği doğrulamaz ve adresi bilen herkes
 * istediği katılımcıyı "formu doldurdu" yapabilir.
 *
 * Bu uç noktanın var olma sebebi tam olarak buydu: adımı katılımcının
 * kendisi işaretleyebiliyordu.
 */

const SIR = "test-imzalama-sirri";
const imzala = (govde: string) => createHmac("sha256", SIR).update(govde).digest("base64");

describe("tally imzası", () => {
  it("doğru imzayı kabul ediyor", () => {
    const govde = '{"eventType":"FORM_RESPONSE"}';
    expect(imzaDogru(govde, imzala(govde), SIR)).toBe(true);
  });

  it("gövde değiştirilmişse reddediyor", () => {
    // Saldırganın yapacağı şey bu: geçerli bir imzayı alıp gövdedeki
    // kullanıcı kimliğini değiştirmek.
    const govde = '{"eventType":"FORM_RESPONSE"}';
    expect(imzaDogru('{"eventType":"BASKA"}', imzala(govde), SIR)).toBe(false);
  });

  it("imza yoksa ya da sır boşsa reddediyor", () => {
    const govde = "{}";
    expect(imzaDogru(govde, null, SIR)).toBe(false);
    expect(imzaDogru(govde, "", SIR)).toBe(false);
    // Sır tanımlı değilken "geçsin" demek, uç noktayı herkese açardı.
    expect(imzaDogru(govde, imzala(govde), "")).toBe(false);
  });

  it("başka bir sırla imzalanmışı reddediyor", () => {
    const govde = "{}";
    const yabanci = createHmac("sha256", "baska-sir").update(govde).digest("base64");
    expect(imzaDogru(govde, yabanci, SIR)).toBe(false);
  });
});

describe("yanıttan katılımcı", () => {
  const yanit = (alanlar: unknown[]) => ({ eventType: "FORM_RESPONSE", data: { fields: alanlar } });
  const KIMLIK = "dd18a66a-e732-4924-86d7-b5419e563ccf";

  it("gizli alandaki kimliği buluyor", () => {
    expect(
      kullaniciyiBul(
        yanit([
          { label: "eposta", value: "kisi@ornek.com" },
          { label: "kullanici", value: KIMLIK },
        ]),
      ),
    ).toBe(KIMLIK);
  });

  it("alan adının büyük/küçük harfine takılmıyor", () => {
    expect(kullaniciyiBul(yanit([{ label: "Kullanici", value: KIMLIK }]))).toBe(KIMLIK);
  });

  it("UUID olmayan değeri reddediyor", () => {
    /*
      Gizli alan adres çubuğundan geliyor; kişi kendi bağlantısını
      düzenleyip oraya istediğini yazabilir. Değer doğrudan sorguya
      gittiği için biçim kontrolü şart.
    */
    expect(kullaniciyiBul(yanit([{ label: "kullanici", value: "admin" }]))).toBeNull();
    expect(kullaniciyiBul(yanit([{ label: "kullanici", value: "" }]))).toBeNull();
  });

  it("alan hiç yoksa null dönüyor", () => {
    expect(kullaniciyiBul(yanit([{ label: "eposta", value: "a@b.c" }]))).toBeNull();
    expect(kullaniciyiBul({})).toBeNull();
    expect(kullaniciyiBul(null)).toBeNull();
  });
});

describe("olay türü", () => {
  it("yalnızca form yanıtını kabul ediyor", () => {
    expect(yanitOlayiMi({ eventType: "FORM_RESPONSE" })).toBe(true);
    expect(yanitOlayiMi({ eventType: "PING" })).toBe(false);
    expect(yanitOlayiMi({})).toBe(false);
  });
});
