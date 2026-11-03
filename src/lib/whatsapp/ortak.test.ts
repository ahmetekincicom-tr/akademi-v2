import { describe, expect, it } from "vitest";
import { anahtarHesaplari, baglanacakNumara } from "./ortak";

describe("anahtarHesaplari (debug_token → granular_scopes)", () => {
  it("yalnızca whatsapp_business_management kapsamındaki hesapları, tekrarsız döndürür", () => {
    expect(
      anahtarHesaplari([
        { scope: "whatsapp_business_management", target_ids: ["102290129340398", "102290129340398"] },
        { scope: "whatsapp_business_messaging", target_ids: ["999999999999"] },
        { scope: "business_management", target_ids: ["191883632447339"] },
      ]),
    ).toEqual(["102290129340398"]);
  });

  it("biçimsiz girdide boş liste", () => {
    expect(anahtarHesaplari(undefined)).toEqual([]);
    expect(anahtarHesaplari([{ scope: "whatsapp_business_management" }])).toEqual([]);
    expect(anahtarHesaplari([{ scope: "whatsapp_business_management", target_ids: ["abc", 5] }])).toEqual([]);
  });
});

describe("baglanacakNumara", () => {
  const n = (id: string, biz?: boolean) => ({ wabaId: "1", id, is_on_biz_app: biz });

  it("tek numarayı seçer", () => {
    expect(baglanacakNumara([n("11111")])?.id).toBe("11111");
  });

  it("birden fazlaysa telefondaki uygulamadaki tek numarayı seçer", () => {
    expect(baglanacakNumara([n("11111", false), n("22222", true)])?.id).toBe("22222");
  });

  it("belirsizse seçmez", () => {
    expect(baglanacakNumara([n("11111"), n("22222")])).toBeNull();
    expect(baglanacakNumara([n("11111", true), n("22222", true)])).toBeNull();
    expect(baglanacakNumara([])).toBeNull();
  });
});
