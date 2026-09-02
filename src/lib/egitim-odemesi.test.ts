import { describe, it, expect } from "vitest";
import { danismanlikOdemeKumesi, egitimOdemeleri, danismanlikOdemesiMi } from "@/lib/egitim-odemesi";

describe("egitim ödemesi ayrımı", () => {
  const gorusmeler = [{ payment_id: "p-danismanlik" }, { payment_id: null }];

  it("görüşmeye bağlı ödemeyi danışmanlık sayar", () => {
    const kume = danismanlikOdemeKumesi(gorusmeler);
    expect(danismanlikOdemesiMi("p-danismanlik", kume)).toBe(true);
    expect(danismanlikOdemesiMi("p-egitim", kume)).toBe(false);
  });

  /*
    Asıl hata buydu: yalnızca danışmanlık alan kişi "ödenmiş ödemesi var"
    diye eğitim müşterisi sayılıyor, ön değerlendirme maili ona da gidiyordu.
  */
  it("listeden danışmanlık ödemelerini eler", () => {
    const kume = danismanlikOdemeKumesi(gorusmeler);
    const kalan = egitimOdemeleri(
      [{ id: "p-egitim" }, { id: "p-danismanlik" }],
      kume,
    );
    expect(kalan.map((o) => o.id)).toEqual(["p-egitim"]);
  });

  it("yalnızca danışmanlığı olan kişide geriye eğitim ödemesi kalmaz", () => {
    const kume = danismanlikOdemeKumesi(gorusmeler);
    expect(egitimOdemeleri([{ id: "p-danismanlik" }], kume)).toEqual([]);
  });

  // payment_id'si olmayan görüşme (ücretsiz ön görüşme) kümeye girmemeli:
  // girseydi null anahtarı tüm ödemeleri danışmanlık gibi gösterebilirdi.
  it("ücretsiz görüşme kümeyi kirletmez", () => {
    expect(danismanlikOdemeKumesi([{ payment_id: null }]).size).toBe(0);
    expect(danismanlikOdemeKumesi(null).size).toBe(0);
  });
});
