import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipler";
import { ogrenciBildirimi, yoneticiBildirimi } from "@/lib/eposta";

/**
 * Abonelik e-postaları.
 *
 * Hepsi tek yerden (lib/abonelik.ts → aboneligiSenkronla) tetikleniyor ve
 * her olay için en fazla bir kez: olay defterindeki benzersiz indeks aynı
 * çekimin ikinci kez işlenmesini engelliyor. Bildirim, ödeme formunun dönüşü
 * ve mutabakat görevi aynı aboneliğe peş peşe bakabiliyor.
 *
 * Hiçbiri hata fırlatmıyor: postanın gitmemesi tahsilatı geçersiz kılmaz.
 */

export type AbonelikOlayi = "basladi" | "yenilendi" | "odeme_alinamadi" | "iptal";

const paraBicimi = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 2,
});

const tarihBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: "Europe/Istanbul",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function tarih(deger: string | null): string {
  return deger ? tarihBicimi.format(new Date(deger)) : "—";
}

export async function abonelikBildir(
  servis: SupabaseClient<Database>,
  abonelikId: string,
  olay: AbonelikOlayi,
): Promise<void> {
  try {
    const { data } = await servis
      .from("abonelikler")
      .select("tutar, donem_bitis, erisim_bitis, son_hata, test_modu, profiles(ad, soyad, email, telefon)")
      .eq("id", abonelikId)
      .maybeSingle();
    if (!data) return;

    const kisi = data.profiles;
    const ad = kisi?.ad?.trim() || null;
    const isim = [kisi?.ad, kisi?.soyad].filter(Boolean).join(" ") || kisi?.email || "—";
    const tutar = data.tutar != null ? paraBicimi.format(Number(data.tutar)) : "—";
    // Test ortamındaki abonelik gerçek bir tahsilat değil; katılımcıya giden
    // maillerde bunu konu satırında söylemek, yönetici denerken kendi
    // kutusuna düşen mailin "gerçekten para çekildi" diye okunmasını önlüyor.
    const onEk = data.test_modu ? "[TEST] " : "";

    if (kisi?.email) await katilimciyaGonder(kisi.email, ad, olay, tutar, data, onEk);
    if (olay !== "yenilendi") await yonetimeGonder(isim, kisi, olay, tutar, data, onEk);
  } catch (e) {
    console.error("[abonelik-eposta]", e);
  }
}

type Satir = { donem_bitis: string | null; erisim_bitis: string | null; son_hata: string | null };

async function katilimciyaGonder(
  email: string,
  ad: string | null,
  olay: AbonelikOlayi,
  tutar: string,
  a: Satir,
  onEk: string,
) {
  const ortak = { alici: email, yol: "/panel/abonelik" };

  if (olay === "basladi") {
    await ogrenciBildirimi({
      ...ortak,
      akis: "abonelik-basladi",
      konu: `${onEk}Video aboneliğin başladı`,
      ustEtiket: "Abonelik",
      baslik: ad ? `${ad}, derslerin açıldı` : "Derslerin açıldı",
      ozet:
        "İlk aylık ödemen alındı. Kayıtlı olduğun eğitimlerin ders videolarını panelindeki " +
        "Derslerim bölümünden izleyebilirsin. Aboneliğin her ay aynı karttan otomatik yenilenir; " +
        "istediğin zaman panelinden iptal edebilirsin.",
      satirlar: [
        { etiket: "Aylık ücret", deger: tutar },
        { etiket: "Sonraki yenileme", deger: tarih(a.donem_bitis) },
      ],
      yol: "/panel/dersler",
      eylemEtiketi: "Derslerime git",
      degiskenler: { ad, tutar, tarih: tarih(a.donem_bitis) },
    });
    return;
  }

  if (olay === "yenilendi") {
    await ogrenciBildirimi({
      ...ortak,
      akis: "abonelik-yenilendi",
      konu: `${onEk}Aboneliğin yenilendi · ${tutar}`,
      ustEtiket: "Abonelik",
      baslik: ad ? `${ad}, aboneliğin yenilendi` : "Aboneliğin yenilendi",
      ozet: "Bu ayın ödemesi alındı; derslerin açık kalmaya devam ediyor.",
      satirlar: [
        { etiket: "Tutar", deger: tutar },
        { etiket: "Sonraki yenileme", deger: tarih(a.donem_bitis) },
      ],
      eylemEtiketi: "Aboneliğimi görüntüle",
      degiskenler: { ad, tutar, tarih: tarih(a.donem_bitis) },
    });
    return;
  }

  if (olay === "odeme_alinamadi") {
    await ogrenciBildirimi({
      ...ortak,
      akis: "abonelik-odeme-alinamadi",
      konu: `${onEk}Abonelik ödemen alınamadı`,
      ustEtiket: "Abonelik",
      baslik: ad ? `${ad}, kartından ödeme alınamadı` : "Kartından ödeme alınamadı",
      ozet:
        `Bu ayın abonelik ödemesi kartından çekilemedi. Derslerin ${tarih(a.erisim_bitis)} tarihine kadar ` +
        "açık kalıyor; bu süre içinde panelinden kartını güncellersen ödeme yeniden denenir ve " +
        "aboneliğin kesintisiz devam eder.",
      satirlar: a.son_hata ? [{ etiket: "Bankanın cevabı", deger: a.son_hata }] : [],
      eylemEtiketi: "Kartımı güncelle",
      degiskenler: { ad, tarih: tarih(a.erisim_bitis) },
    });
    return;
  }

  await ogrenciBildirimi({
    ...ortak,
    akis: "abonelik-iptal",
    konu: `${onEk}Aboneliğin iptal edildi`,
    ustEtiket: "Abonelik",
    baslik: ad ? `${ad}, aboneliğin iptal edildi` : "Aboneliğin iptal edildi",
    ozet:
      `Kartından yeni bir ödeme çekilmeyecek. Derslerin ödediğin dönemin sonuna, ` +
      `${tarih(a.erisim_bitis)} tarihine kadar açık kalıyor. İstediğin zaman yeniden abone olabilirsin.`,
    eylemEtiketi: "Aboneliğimi görüntüle",
    degiskenler: { ad, tarih: tarih(a.erisim_bitis) },
  });
}

async function yonetimeGonder(
  isim: string,
  kisi: { email: string | null; telefon: string | null } | null,
  olay: AbonelikOlayi,
  tutar: string,
  a: Satir,
  onEk: string,
) {
  const basliklar: Record<Exclude<AbonelikOlayi, "yenilendi">, { konu: string; baslik: string; ozet: string }> = {
    basladi: {
      konu: `${onEk}Yeni video aboneliği · ${tutar} · ${isim}`,
      baslik: `${isim} video aboneliği başlattı`,
      ozet: "İlk aylık ödeme alındı. Faturayı kesmeyi unutma.",
    },
    odeme_alinamadi: {
      konu: `${onEk}Abonelik ödemesi alınamadı · ${isim}`,
      baslik: `${isim} kişisinin aylık çekimi reddedildi`,
      ozet: `Katılımcıya kartını güncellemesi için e-posta gitti. Erişimi ${tarih(a.erisim_bitis)} tarihine kadar açık.`,
    },
    iptal: {
      konu: `${onEk}Abonelik iptal edildi · ${isim}`,
      baslik: `${isim} aboneliğini iptal etti`,
      ozet: `Yeni ödeme çekilmeyecek. Erişimi ${tarih(a.erisim_bitis)} tarihine kadar açık.`,
    },
  };
  const m = basliklar[olay as Exclude<AbonelikOlayi, "yenilendi">];

  await yoneticiBildirimi({
    akis: "abonelik-bildirimi",
    konu: m.konu,
    ustEtiket: "Video aboneliği",
    baslik: m.baslik,
    ozet: m.ozet,
    satirlar: [
      { etiket: "Aylık ücret", deger: tutar },
      ...(a.son_hata && olay === "odeme_alinamadi" ? [{ etiket: "Bankanın cevabı", deger: a.son_hata }] : []),
      { etiket: "E-posta", deger: kisi?.email ?? "—" },
      { etiket: "Telefon", deger: kisi?.telefon ?? "—" },
    ],
    yol: "/kontrol-9f4x2k/abonelikler",
    eylemEtiketi: "Abonelikleri aç",
  });
}
