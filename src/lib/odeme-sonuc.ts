import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { basariliMi, odemeSorgula, type IyzicoAyar, type SorgulamaCevabi } from "@/lib/iyzico";
import { yoneticiBildirimi } from "@/lib/eposta";

/**
 * Bir ödeme denemesinin sonucunu iyzico'ya sorup kaydeder.
 *
 * Üç yerden çağrılıyor: 3D Secure dönüşü, yöneticinin "iyzico'ya sor" düğmesi
 * ve zamanlanmış mutabakat görevi. Aynı mantığın üç kopyası olsaydı biri
 * mutlaka diğerlerinden farklı davranırdı — ve fark ettiğimiz yer para
 * tutmayan bir kayıt olurdu.
 */

export type CozumSonucu =
  /** iyzico ödemeyi onayladı, kayıt "odendi" yapıldı. */
  | "basarili"
  /** iyzico ödemenin tamamlanmadığını söyledi. */
  | "basarisiz"
  /** Token'a karşılık gelen deneme kaydı bulunamadı. */
  | "eslesmedi"
  /** iyzico'ya ulaşılamadı; kayıt olduğu gibi bırakıldı. */
  | "belirsiz";

export async function denemeyiCoz(
  servis: SupabaseClient,
  ayar: IyzicoAyar,
  token: string,
): Promise<CozumSonucu> {
  let cevap;
  try {
    cevap = await odemeSorgula(ayar, token);
  } catch {
    // Ağ hatası. Kaydı bozmuyoruz: para çekilmiş olabilir ve "basarisiz"
    // yazmak onu görünmez yapardı. Mutabakat görevi tekrar deneyecek.
    return "belirsiz";
  }

  // Eşleştirmede conversationId birincil yol; iyzico bu alanı her cevapta
  // döndürmediği için token ikinci yol olarak duruyor.
  const konusmaId = cevap.conversationId ?? "";
  let deneme: { id: string; payment_id: string; tutar: number; durum: string } | null = null;

  if (konusmaId) {
    const { data } = await servis
      .from("odeme_denemeleri")
      .select("id, payment_id, tutar, durum")
      .eq("conversation_id", konusmaId)
      .maybeSingle();
    deneme = data;
  }
  if (!deneme) {
    const { data } = await servis
      .from("odeme_denemeleri")
      .select("id, payment_id, tutar, durum")
      .eq("token", token)
      .maybeSingle();
    deneme = data;
  }
  if (!deneme) return "eslesmedi";

  // Aynı token birden çok kez çözülebiliyor (geri tuşu, iyzico tekrarı,
  // mutabakat görevi). İkinci kez ödeme tarihini bozmuyoruz.
  if (deneme.durum === "basarili") return "basarili";

  const ortak = {
    token,
    saglayici_odeme_id: cevap.paymentId ?? null,
    taksit: cevap.installment ?? null,
    kart_son4: cevap.lastFourDigits ?? null,
    kart_ailesi: cevap.cardFamily ?? null,
    ham_yanit: cevap,
  };

  if (!basariliMi(cevap)) {
    await servis
      .from("odeme_denemeleri")
      .update({
        ...ortak,
        durum: "basarisiz",
        hata_kodu: cevap.errorCode ?? null,
        hata_mesaji: cevap.errorMessage ?? `Ödeme tamamlanmadı (${cevap.paymentStatus ?? cevap.status}).`,
      })
      .eq("id", deneme.id);
    return "basarisiz";
  }

  /*
    Tutar doğrulaması `price` üzerinden, `paidPrice` üzerinden DEĞİL.

    Taksitli ödemede paidPrice vade farkıyla price'tan büyük geliyor; onu
    karşılaştırsaydık her taksitli ödeme "tutar uyuşmuyor" diye düşerdi.
  */
  const gelen = Number(cevap.price);
  const beklenen = Number(deneme.tutar);
  if (!Number.isFinite(gelen) || Math.abs(gelen - beklenen) > 0.01) {
    await servis
      .from("odeme_denemeleri")
      .update({
        ...ortak,
        durum: "basarisiz",
        hata_kodu: "TUTAR_UYUSMAZLIGI",
        hata_mesaji: `Beklenen ${beklenen}, iyzico ${cevap.price} dedi.`,
      })
      .eq("id", deneme.id);
    return "basarisiz";
  }

  await servis.from("odeme_denemeleri").update({ ...ortak, durum: "basarili" }).eq("id", deneme.id);

  // durum süzgeci: bu arada yönetici kaydı "iade"ye çekmişse ödeme onu geri
  // "odendi" yapmasın.
  await servis
    .from("payments")
    .update({
      durum: "odendi",
      yontem: "Kart (iyzico)",
      odeme_tarihi: new Date().toISOString(),
    })
    .eq("id", deneme.payment_id)
    .eq("durum", "bekliyor");

  await odemeBildirimi(servis, deneme.payment_id, cevap);

  return "basarili";
}

const paraBicimi = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 2,
});

/**
 * Ödeme geçtiğinde yöneticiye e-posta.
 *
 * Ödemenin kendisi ÇOKTAN kaydedilmiş oluyor; buradaki hiçbir hata onu geri
 * almamalı. Bu yüzden epostaGonder hata fırlatmıyor ve dönüşüne de bakmıyoruz:
 * postanın gitmemesi tahsilatı geçersiz kılmaz.
 */
async function odemeBildirimi(
  servis: SupabaseClient,
  paymentId: string,
  cevap: SorgulamaCevabi,
): Promise<void> {
  const { data: odeme } = await servis
    .from("payments")
    .select("tutar, odeme_tarihi, profiles(ad, soyad, email, telefon), courses(baslik)")
    .eq("id", paymentId)
    .maybeSingle();

  const kisi = odeme?.profiles as unknown as {
    ad: string | null;
    soyad: string | null;
    email: string | null;
    telefon: string | null;
  } | null;
  const kurs = (odeme?.courses as unknown as { baslik: string } | null)?.baslik ?? "Belirtilmedi";

  /*
    Danışmanlık ödemesi mi?

    Bu ödeme bir görüşmeye bağlıysa tahsilat aynı zamanda YENİ BİR TALEP demek:
    veritabanındaki tetikleyici satırı 'odeme_bekliyor'dan 'talep'e çeviriyor.
    Yöneticiye giden tek bildirim bu olduğu için görüşmenin konusu da burada
    yazılıyor; aksi halde panelde nereden geldiği belirsiz bir talep beliriyor.
  */
  const { data: gorusme } = await servis
    .from("gorusmeler")
    .select("konu, tercih_zaman, sure_dk")
    .eq("payment_id", paymentId)
    .maybeSingle();
  const isim = [kisi?.ad, kisi?.soyad].filter(Boolean).join(" ") || kisi?.email || "—";
  const tutar = Number(odeme?.tutar ?? cevap.price ?? 0);

  const satirlar = [
    { etiket: "Tutar", deger: paraBicimi.format(tutar) },
    ...(gorusme
      ? [
          { etiket: "Danışmanlık konusu", deger: gorusme.konu as string },
          { etiket: "Tercih ettiği zaman", deger: (gorusme.tercih_zaman as string) || "Belirtilmedi" },
          { etiket: "Süre", deger: `${gorusme.sure_dk} dk` },
        ]
      : [{ etiket: "Eğitim", deger: kurs }]),
    { etiket: "E-posta", deger: kisi?.email ?? "—" },
    { etiket: "Telefon", deger: kisi?.telefon ?? "—" },
  ];

  // Taksitli ödemede tahsil edilen tutar sepet tutarından yüksek: vade farkı
  // öğrenciye ait ve mutabakatta bunu görmek gerekiyor.
  if (cevap.paidPrice && Number(cevap.paidPrice) !== tutar) {
    satirlar.push({
      etiket: "Karttan çekilen",
      deger: `${paraBicimi.format(Number(cevap.paidPrice))}${
        cevap.installment && cevap.installment > 1 ? ` · ${cevap.installment} taksit` : ""
      }`,
    });
  }
  if (cevap.lastFourDigits) {
    satirlar.push({ etiket: "Kart", deger: `${cevap.cardFamily ?? ""} ****${cevap.lastFourDigits}`.trim() });
  }
  satirlar.push({ etiket: "iyzico ödeme no", deger: cevap.paymentId ?? "—" });

  await yoneticiBildirimi({
    konu: gorusme
      ? `Danışmanlık ödemesi · ${paraBicimi.format(tutar)} · ${isim}`
      : `Ödeme alındı · ${paraBicimi.format(tutar)} · ${isim}`,
    ustEtiket: gorusme ? "Danışmanlık talebi ödendi" : "Ödeme alındı",
    baslik: gorusme
      ? `${isim} danışmanlık görüşmesi için ödeme yaptı`
      : `${isim} ${paraBicimi.format(tutar)} ödedi`,
    ozet: gorusme
      ? "Talep planlamaya hazır; görüşme saatini belirleyip katılımcıya ilet."
      : "Faturayı kesmeyi unutma.",
    satirlar,
    yol: gorusme ? "/kontrol-9f4x2k/gorusmeler" : "/kontrol-9f4x2k/odemeler",
    eylemEtiketi: gorusme ? "Talebi panelde aç" : "Ödemeleri aç",
  });
}
