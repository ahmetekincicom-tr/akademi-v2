import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { dogrulamaIfadesi, imzaGecerliMi, takipKoduBul, webhookMesajlari, webhookRehberi } from "./webhook";
import { kodluMesaj } from "@/lib/temas-kod";

const SIR = "test-app-secret";
const imzala = (govde: string, sir = SIR) => "sha256=" + createHmac("sha256", sir).update(govde, "utf8").digest("hex");

describe("imzaGecerliMi (X-Hub-Signature-256)", () => {
  const govde = JSON.stringify({ object: "whatsapp_business_account", entry: [] });

  it("doğru imzayı kabul eder", () => {
    expect(imzaGecerliMi(govde, imzala(govde), SIR)).toBe(true);
  });

  it("başka sırla, bozulmuş gövdeyle, eksik ya da biçimsiz başlıkla reddeder", () => {
    expect(imzaGecerliMi(govde, imzala(govde, "baska"), SIR)).toBe(false);
    expect(imzaGecerliMi(govde + " ", imzala(govde), SIR)).toBe(false);
    expect(imzaGecerliMi(govde, null, SIR)).toBe(false);
    expect(imzaGecerliMi(govde, "sha1=abc", SIR)).toBe(false);
    expect(imzaGecerliMi(govde, "sha256=kisa", SIR)).toBe(false);
    expect(imzaGecerliMi(govde, imzala(govde), "")).toBe(false);
  });
});

describe("dogrulamaIfadesi", () => {
  it("sırdan türetiliyor: kararlı, 32 karakter, sırrın kendisi değil", () => {
    const d = dogrulamaIfadesi(SIR);
    expect(d).toHaveLength(32);
    expect(dogrulamaIfadesi(SIR)).toBe(d);
    expect(dogrulamaIfadesi("baska")).not.toBe(d);
    expect(d).not.toContain(SIR);
  });
});

describe("takipKoduBul", () => {
  it("sitedeki düğmenin eklediği kodu bulur (kodluMesaj ile aynı biçim)", () => {
    expect(takipKoduBul(kodluMesaj("Merhaba, birebir eğitimleriniz hakkında bilgi almak istiyorum.", "K7F2QA"))).toBe("K7F2QA");
  });

  it("kişi mesajın önüne yazsa da, küçük harf ya da boşluklu yazılsa da bulur; eski 5 haneli kodlar geçerli", () => {
    expect(takipKoduBul("Fiyat nedir? Merhaba (Ref: k7f2qa)")).toBe("K7F2QA");
    expect(takipKoduBul("ref:AB3CD")).toBe("AB3CD");
  });

  it("Ref etiketi yoksa ya da alfabede olmayan harf varsa kod saymaz", () => {
    expect(takipKoduBul("MERHABA nasılsınız")).toBeNull();
    expect(takipKoduBul("(Ref: AB0CD1)")).toBeNull(); // 0 ve 1 alfabede yok
    expect(takipKoduBul(null)).toBeNull();
  });
});

describe("webhookMesajlari", () => {
  const gelen = {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "102290129340398",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              metadata: { display_phone_number: "908501234567", phone_number_id: "106540352242922" },
              contacts: [{ profile: { name: "Ayşe Yılmaz" }, wa_id: "905321234567" }],
              messages: [
                {
                  from: "905321234567",
                  id: "wamid.AAA",
                  timestamp: "1749416383",
                  type: "text",
                  text: { body: "Merhaba, bilgi alabilir miyim? (Ref: K7F2QA)" },
                  referral: { source_type: "ad", source_id: "1203", ctwa_clid: "ARAkLkA8" },
                },
              ],
              statuses: [{ id: "wamid.X", status: "read" }],
            },
          },
        ],
      },
    ],
  };

  it("gelen mesajı ad, kod, reklam tıklaması ve zamanla çözer", () => {
    const [m, ...diger] = webhookMesajlari(gelen);
    expect(diger).toHaveLength(0);
    expect(m).toMatchObject({
      waMesajId: "wamid.AAA",
      yon: "gelen",
      waId: "905321234567",
      ad: "Ayşe Yılmaz",
      telefonNumaraId: "106540352242922",
      tur: "text",
      temasKodu: "K7F2QA",
      ctwaClid: "ARAkLkA8",
    });
    expect(m!.zaman.toISOString()).toBe(new Date(1749416383 * 1000).toISOString());
  });

  it("telefondaki uygulamadan atılan yanıtı (smb_message_echoes) giden olarak çözer; kod aramaz", () => {
    const yanit = {
      object: "whatsapp_business_account",
      entry: [
        {
          changes: [
            {
              field: "smb_message_echoes",
              value: {
                metadata: { phone_number_id: "106540352242922" },
                message_echoes: [
                  { from: "908501234567", to: "905321234567", id: "wamid.BBB", timestamp: "1739321024", type: "text", text: { body: "Tabii (Ref: K7F2QA)" } },
                ],
              },
            },
          ],
        },
      ],
    };
    const [m] = webhookMesajlari(yanit);
    expect(m).toMatchObject({ yon: "giden", waId: "905321234567", metin: "Tabii (Ref: K7F2QA)", temasKodu: null });
  });

  it("medya açıklamasını metin sayar; bilinmeyen alanları ve başka nesneleri atlar", () => {
    const g = structuredClone(gelen);
    g.entry[0]!.changes[0]!.value.messages = [
      { from: "905321234567", id: "wamid.CCC", timestamp: "1", type: "image", image: { caption: "dekont" } } as never,
    ];
    expect(webhookMesajlari(g)[0]).toMatchObject({ tur: "image", metin: "dekont" });
    expect(webhookMesajlari({ object: "page", entry: [] })).toEqual([]);
    expect(webhookMesajlari({ object: "whatsapp_business_account", entry: [{ changes: [{ field: "history", value: {} }] }] })).toEqual([]);
    expect(webhookMesajlari("bozuk")).toEqual([]);
  });

  it("kimliksiz ya da numarasız mesajı atlar", () => {
    const g = structuredClone(gelen);
    g.entry[0]!.changes[0]!.value.messages = [{ from: "abc", id: "wamid.D", type: "text", text: { body: "x" } } as never];
    expect(webhookMesajlari(g)).toEqual([]);
  });
});

describe("geçmiş (history) ve rehber (smb_app_state_sync)", () => {
  const sar = (field: string, value: unknown) => ({ object: "whatsapp_business_account", entry: [{ changes: [{ field, value }] }] });

  it("geçmişteki mesajların yönünü gönderenden çıkarır; eski mesajdaki takip kodunu da okur", () => {
    const g = sar("history", {
      metadata: { display_phone_number: "908501234567", phone_number_id: "106" },
      history: [
        {
          metadata: { phase: 0, chunk_order: 1, progress: 100 },
          threads: [
            {
              id: "905321234567",
              messages: [
                { from: "905321234567", id: "wamid.H1", timestamp: "1780000000", type: "text", text: { body: "Fiyat? (Ref: K7F2QA)" }, history_context: { status: "READ" } },
                { from: "908501234567", id: "wamid.H2", timestamp: "1780000100", type: "text", text: { body: "Merhaba" }, history_context: { status: "READ" } },
              ],
            },
          ],
        },
      ],
    });
    const [a, b] = webhookMesajlari(g);
    expect(a).toMatchObject({ waMesajId: "wamid.H1", yon: "gelen", waId: "905321234567", temasKodu: "K7F2QA" });
    expect(b).toMatchObject({ waMesajId: "wamid.H2", yon: "giden", waId: "905321234567", temasKodu: null });
  });

  it("geçmiş paylaşımı reddedildiyse mesaj üretmez", () => {
    const g = sar("history", {
      metadata: { display_phone_number: "908501234567" },
      history: [{ errors: [{ code: 2593109, message: "History sharing is turned off by the business" }] }],
    });
    expect(webhookMesajlari(g)).toEqual([]);
  });

  it("rehberdeki adları okur; silinen kişileri ve adsızları atlar", () => {
    const g = sar("smb_app_state_sync", {
      state_sync: [
        { type: "contact", contact: { full_name: "Ayşe Yılmaz", first_name: "Ayşe", phone_number: "905321234567" }, action: "add" },
        { type: "contact", contact: { phone_number: "905551112233" }, action: "remove" },
        { type: "contact", contact: { phone_number: "905551112244" }, action: "add" },
      ],
    });
    expect(webhookRehberi(g)).toEqual([{ waId: "905321234567", ad: "Ayşe Yılmaz" }]);
    expect(webhookRehberi(sar("messages", {}))).toEqual([]);
  });
});
