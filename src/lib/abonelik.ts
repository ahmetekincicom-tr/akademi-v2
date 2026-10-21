import "server-only";

import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/tipler";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { iyzicoAyari, iyzicoTestAyari, type IyzicoAyar } from "@/lib/iyzico";
import { abonelikDetayi, abonelikFormSonucu, abonelikOdemesiniYinele } from "@/lib/iyzico-abonelik";
import {
  abonelikAyariniCoz,
  abonelikGorunurMu,
  abonelikOzeti,
  aboneligiSec,
  erisimAcikMi,
  VARSAYILAN_AYAR,
  type AbonelikGorunumu,
  type AbonelikAyari,
} from "@/lib/abonelik-hesap";
import { abonelikBildir, type AbonelikOlayi } from "@/lib/abonelik-eposta";

/**
 * Video aboneliğinin sunucu tarafı.
 *
 * Kopya kuralı: abonelikler tablosu iyzico'nun söylediğinin KOPYASI ve kopya
 * yalnızca aboneligiSenkronla'dan yazılıyor. Bildirim, ödeme formu dönüşü,
 * mutabakat görevi, iptal düğmesi — hepsi "iyzico'ya sor, sonra yaz" yolundan
 * geçiyor. Hiçbiri gelen isteğin gövdesindeki durumu doğrudan yazmıyor.
 */

type Servis = SupabaseClient<Database>;

/** settings tablosu katılımcıya kapalı; ayar servis anahtarıyla okunuyor. */
export async function abonelikAyariOku(servis?: Servis | null): Promise<AbonelikAyari> {
  const istemci = servis ?? gorevIstemcisi();
  if (!istemci) return VARSAYILAN_AYAR;
  const { data } = await istemci.from("settings").select("deger").eq("anahtar", "abonelik").maybeSingle();
  return abonelikAyariniCoz(data?.deger);
}

/** İstek başına bir kez: menü, sayfa ve kartlar aynı ayarı okuyor. */
export const abonelikAyari = cache(() => abonelikAyariOku());

/** Derslerim bölümü bu kişiye açık mı? (lib/bolumler.ts'teki bayrağın yerine.) */
export async function derslerGorunurMu(yonetici: boolean): Promise<boolean> {
  return abonelikGorunurMu(await abonelikAyari(), yonetici);
}

/** Abonelik satırının açıldığı ortama göre iyzico anahtarları. */
export function abonelikIyzicoAyari(testModu: boolean): IyzicoAyar | null {
  return testModu ? iyzicoTestAyari() : iyzicoAyari();
}

export function planKodu(ayar: AbonelikAyari): string {
  return ayar.testModu ? ayar.testPlanKodu : ayar.planKodu;
}

/* --------------------------------------------------------- senkron --- */

export type SenkronSonucu = "guncellendi" | "belirsiz" | "bulunamadi";

/**
 * Bir aboneliği iyzico'ya sorup kaydı günceller, yeni olayları işler.
 *
 * Olaylar defterine "çakışırsa atla" ile yazılıyor ve yalnızca GERÇEKTEN yeni
 * yazılan satırlar mail tetikliyor. Aynı abonelik dakikada birkaç kez
 * senkronlansa da kişiye tek "yenilendi" maili gidiyor.
 */
export async function aboneligiSenkronla(servis: Servis, abonelikId: string): Promise<SenkronSonucu> {
  const { data: satir } = await servis
    .from("abonelikler")
    .select("id, durum, iyzico_abonelik_kodu, test_modu, iptal_tarihi")
    .eq("id", abonelikId)
    .maybeSingle();
  if (!satir?.iyzico_abonelik_kodu) return "bulunamadi";

  const ayar = abonelikIyzicoAyari(satir.test_modu);
  if (!ayar) return "belirsiz";

  let cevap;
  try {
    cevap = await abonelikDetayi(ayar, satir.iyzico_abonelik_kodu);
  } catch {
    // Ağ hatası: kaydı bozmuyoruz, mutabakat görevi tekrar bakacak.
    return "belirsiz";
  }

  const detay = cevap.data?.items?.[0];
  if (cevap.status !== "success" || !detay) {
    await servis
      .from("abonelikler")
      .update({ son_hata: cevap.errorMessage ?? "iyzico abonelik detayını döndürmedi.", updated_at: new Date().toISOString() })
      .eq("id", satir.id);
    return "belirsiz";
  }

  const { ekSureGun } = await abonelikAyariOku(servis);
  const ozet = abonelikOzeti(detay, ekSureGun);
  const simdi = new Date().toISOString();

  await servis
    .from("abonelikler")
    .update({
      durum: ozet.durum,
      erisim_bitis: ozet.erisimBitis?.toISOString() ?? null,
      donem_baslangic: ozet.donemBaslangic?.toISOString() ?? null,
      donem_bitis: ozet.donemBitis?.toISOString() ?? null,
      tutar: ozet.tutar,
      iyzico_musteri_kodu: detay.customerReferenceCode ?? null,
      iyzico_plan_kodu: detay.pricingPlanReferenceCode ?? null,
      iptal_tarihi: ozet.durum === "iptal" ? (satir.iptal_tarihi ?? simdi) : satir.iptal_tarihi,
      son_hata: ozet.sonRet?.hata ?? null,
      ham_yanit: detay as unknown as Json,
      updated_at: simdi,
    })
    .eq("id", satir.id);

  /* ---- olaylar ---- */

  const yeniBasarililar = await olaylariYaz(
    servis,
    satir.id,
    "odeme_basarili",
    ozet.basariliSiparisler,
  );
  for (const kodu of yeniBasarililar) {
    // İlk çekim "başladı", sonrakiler "yenilendi".
    await abonelikBildir(servis, satir.id, kodu === ozet.basariliSiparisler[0] ? "basladi" : "yenilendi");
  }

  if (ozet.sonRet) {
    const yeni = await olaylariYaz(servis, satir.id, "odeme_reddedildi", [ozet.sonRet.kod], {
      hata: ozet.sonRet.hata,
    });
    if (yeni.length > 0) await abonelikBildir(servis, satir.id, "odeme_alinamadi");
  }

  if (ozet.durum === "iptal" && satir.durum !== "iptal") {
    // Sipariş kodu yerine abonelik kodu: iptal aboneliğin ömründe bir kez olur.
    const yeni = await olaylariYaz(servis, satir.id, "iptal", [satir.iyzico_abonelik_kodu]);
    if (yeni.length > 0) await abonelikBildir(servis, satir.id, "iptal");
  }

  return "guncellendi";
}

/** Olayları yazar, yalnızca YENİ yazılanların sipariş kodlarını döndürür. */
async function olaylariYaz(
  servis: Servis,
  abonelikId: string,
  olay: string,
  kodlar: string[],
  ayrinti?: Record<string, unknown>,
): Promise<string[]> {
  if (kodlar.length === 0) return [];
  const { data, error } = await servis
    .from("abonelik_olaylari")
    .upsert(
      kodlar.map((k) => ({
        abonelik_id: abonelikId,
        olay,
        iyzico_siparis_kodu: k,
        ayrinti: (ayrinti ?? null) as Json,
      })),
      { onConflict: "abonelik_id,olay,iyzico_siparis_kodu", ignoreDuplicates: true },
    )
    .select("iyzico_siparis_kodu");
  // Yazılamadıysa mail de gitmesin: tekrar denendiğinde gönderilir. Tersi
  // (mail gitti, olay yazılmadı) aynı maili her senkronda tekrar gönderirdi.
  if (error) {
    console.error("[abonelik] olay yazılamadı:", error.message);
    return [];
  }
  return (data ?? []).map((r) => r.iyzico_siparis_kodu).filter((k): k is string => Boolean(k));
}

/* ------------------------------------------------- form dönüşü --- */

export type FormCozumu = "basarili" | "basarisiz" | "belirsiz" | "eslesmedi";

/**
 * Ödeme formunun dönüşü: token'ın karşılığı olan aboneliği bulur, iyzico'ya
 * sorar, satırı abonelik koduna bağlar ve senkronlar.
 *
 * Üç yerden çağrılıyor: formun dönüş adresi, mutabakat görevi ve yöneticinin
 * "iyzico'ya sor" düğmesi.
 */
export async function formDonusunuCoz(servis: Servis, token: string): Promise<FormCozumu> {
  const { data: satir } = await servis
    .from("abonelikler")
    .select("id, durum, test_modu, iyzico_abonelik_kodu")
    .eq("token", token)
    .maybeSingle();
  if (!satir) return "eslesmedi";

  // Daha önce çözülmüşse yalnızca tazele.
  if (satir.iyzico_abonelik_kodu) {
    await aboneligiSenkronla(servis, satir.id);
    return sonucOku(servis, satir.id);
  }

  const ayar = abonelikIyzicoAyari(satir.test_modu);
  if (!ayar) return "belirsiz";

  let cevap;
  try {
    cevap = await abonelikFormSonucu(ayar, token);
  } catch {
    return "belirsiz";
  }

  const kodu = cevap.data?.referenceCode;
  if (cevap.status !== "success" || !kodu) {
    await servis
      .from("abonelikler")
      .update({
        durum: "basarisiz",
        son_hata: cevap.errorMessage ?? "Ödeme tamamlanmadı.",
        ham_yanit: cevap as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq("id", satir.id)
      .eq("durum", "bekliyor");
    return "basarisiz";
  }

  await servis
    .from("abonelikler")
    .update({
      iyzico_abonelik_kodu: kodu,
      iyzico_musteri_kodu: cevap.data?.customerReferenceCode ?? null,
      iyzico_plan_kodu: cevap.data?.pricingPlanReferenceCode ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", satir.id);

  await aboneligiSenkronla(servis, satir.id);
  return sonucOku(servis, satir.id);
}

async function sonucOku(servis: Servis, abonelikId: string): Promise<FormCozumu> {
  const { data } = await servis.from("abonelikler").select("durum, erisim_bitis").eq("id", abonelikId).maybeSingle();
  if (!data) return "eslesmedi";
  if (erisimAcikMi(data.erisim_bitis)) return "basarili";
  if (data.durum === "basarisiz") return "basarisiz";
  return "belirsiz";
}

/**
 * Kart güncellendikten sonra reddedilmiş çekimi yeniden dener.
 *
 * iyzico yeni kartı kaydediyor ama reddedilmiş ayın ödemesini kendiliğinden
 * tekrar denemiyor; denenmezse kişi kartını güncellediği halde ek süre
 * bitince erişimini kaybederdi.
 */
export async function reddedilenOdemeyiYinele(servis: Servis, abonelikId: string): Promise<boolean> {
  await aboneligiSenkronla(servis, abonelikId);

  const { data: satir } = await servis
    .from("abonelikler")
    .select("durum, test_modu")
    .eq("id", abonelikId)
    .maybeSingle();
  if (satir?.durum !== "odeme_alinamadi") return false;

  const { data: ret } = await servis
    .from("abonelik_olaylari")
    .select("iyzico_siparis_kodu")
    .eq("abonelik_id", abonelikId)
    .eq("olay", "odeme_reddedildi")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const ayar = abonelikIyzicoAyari(satir.test_modu);
  if (!ret?.iyzico_siparis_kodu || !ayar) return false;

  try {
    const cevap = await abonelikOdemesiniYinele(ayar, ret.iyzico_siparis_kodu);
    await aboneligiSenkronla(servis, abonelikId);
    return cevap.status === "success";
  } catch {
    return false;
  }
}

/* ------------------------------------------------- panel okuması --- */

/** Oturumdaki kişinin aboneliği (RLS: yalnızca kendi satırları). */
export async function abonelikDurumum(
  supabase: Servis,
  userId: string,
): Promise<AbonelikGorunumu | null> {
  const { data } = await supabase
    .from("abonelikler")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  return aboneligiSec(data ?? []);
}

export type { AbonelikGorunumu, AbonelikOlayi };
