import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/tipler";
import { ogrenciBildirimi } from "@/lib/eposta";
import { TR_ZAMAN } from "@/lib/zaman";
import type { BildirimSonuc } from "@/lib/odeme-eposta";

/**
 * Eğitim ve danışmanlık ile ilgili katılımcı e-postaları.
 *
 * Panele bir şey eklendiğini kişinin kendiliğinden fark etmesini beklemek,
 * çoğu zaman hiç fark edilmemesi demek: kimse panele her gün girmiyor.
 * Rozetler paneldeki kişiye, bu mailler panele girmeyen kişiye çalışıyor.
 *
 * Ödeme bildirimlerindeki sözleşmenin aynısı: hata fırlatmıyorlar, sonucu
 * döndürüyorlar. Postanın gitmemesi kaydın oluşmasını geri almamalı, ama
 * yönetici tarafında sessizce kaybolmamalı da.
 */

const EPOSTA_YOK = "Katılımcının profilinde e-posta adresi yok, bildirim gönderilemedi.";

const tarihSaatBicimi = new Intl.DateTimeFormat("tr-TR", {
  timeZone: TR_ZAMAN,
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

async function kisiyiOku(servis: SupabaseClient<Database>, userId: string) {
  const { data } = await servis.from("profiles").select("ad, email").eq("id", userId).maybeSingle();
  return { ad: (data?.ad as string) ?? null, email: (data?.email as string) ?? null };
}

/** Kayıt klasörü paylaşıldığında. */
export async function kayitArsiviBildir(
  servis: SupabaseClient<Database>,
  userId: string,
  bilgi: { baslik: string; program: string | null },
): Promise<BildirimSonuc> {
  try {
    const kisi = await kisiyiOku(servis, userId);
    if (!kisi.email) return { gonderildi: false, sebep: EPOSTA_YOK };

    await ogrenciBildirimi({
      akis: "egitim-kaydi",
      alici: kisi.email,
      konu: "Ders kayıtların panelinde",
      ustEtiket: "Eğitim kayıtları",
      baslik: kisi.ad ? `${kisi.ad}, ders kayıtların hazır` : "Ders kayıtların hazır",
      ozet:
        "Derslerin ekran kayıtlarının bulunduğu klasörü panelinle paylaştık. " +
        "Klasör canlı: yeni ders işlendikçe kayıtlar aynı yere ekleniyor, tekrar bir bağlantı beklemene gerek yok.",
      satirlar: [
        { etiket: "Klasör", deger: bilgi.baslik || "Ders kayıtları" },
        ...(bilgi.program ? [{ etiket: "Program", deger: bilgi.program }] : []),
      ],
      yol: "/panel/birebir-egitim",
      eylemEtiketi: "Kayıtları aç",
    });
    return { gonderildi: true };
  } catch (e) {
    return { gonderildi: false, sebep: e instanceof Error ? e.message : "Bilinmeyen hata" };
  }
}

/** Birebir ders planlandığında. */
export async function oturumPlanlandiBildir(
  servis: SupabaseClient<Database>,
  userId: string,
  bilgi: { baslangic: string; sureDk: number; konu: string; program: string | null; toplantiLink: string | null },
): Promise<BildirimSonuc> {
  try {
    const kisi = await kisiyiOku(servis, userId);
    if (!kisi.email) return { gonderildi: false, sebep: EPOSTA_YOK };

    await ogrenciBildirimi({
      akis: "oturum-planlandi",
      alici: kisi.email,
      konu: `Dersin planlandı · ${tarihSaatBicimi.format(new Date(bilgi.baslangic))}`,
      ustEtiket: "Birebir eğitim",
      baslik: kisi.ad ? `${kisi.ad}, dersin planlandı` : "Dersin planlandı",
      ozet:
        "Birebir ders takvimine yeni bir oturum eklendi. Katılım bağlantısı panelindeki birebir eğitim " +
        "sayfasında; ders saatinde oradan katılabilirsin.",
      satirlar: [
        // Saat en üstte: mailden akılda kalması gereken tek şey bu.
        { etiket: "Tarih ve saat", deger: tarihSaatBicimi.format(new Date(bilgi.baslangic)) },
        { etiket: "Süre", deger: `${bilgi.sureDk} dakika` },
        ...(bilgi.konu ? [{ etiket: "Konu", deger: bilgi.konu }] : []),
        ...(bilgi.program ? [{ etiket: "Program", deger: bilgi.program }] : []),
      ],
      yol: "/panel/birebir-egitim",
      eylemEtiketi: "Takvimi görüntüle",
    });
    return { gonderildi: true };
  } catch (e) {
    return { gonderildi: false, sebep: e instanceof Error ? e.message : "Bilinmeyen hata" };
  }
}

/**
 * Kurumsal bir ödemeye koltuk atandığında.
 *
 * Bu kişi ödemeyi kendisi yapmadı: panelde erişimi bir anda açılıyor ve bunu
 * ona söyleyen hiçbir şey yoktu. Ödemeyi yapan kurumun adı yazılıyor, çünkü
 * "eğitime eklendin" tek başına nereden geldiği belirsiz bir mail.
 */
export async function koltukAtandiBildir(
  servis: SupabaseClient<Database>,
  userId: string,
  bilgi: { program: string | null; odeyen: string | null; testAcik: boolean },
): Promise<BildirimSonuc> {
  try {
    const kisi = await kisiyiOku(servis, userId);
    if (!kisi.email) return { gonderildi: false, sebep: EPOSTA_YOK };

    await ogrenciBildirimi({
      akis: "koltuk-atandi",
      alici: kisi.email,
      konu: bilgi.program ? `${bilgi.program} eğitimine eklendin` : "Eğitime eklendin",
      ustEtiket: "Eğitim erişimi",
      baslik: kisi.ad ? `${kisi.ad}, eğitime eklendin` : "Eğitime eklendin",
      ozet:
        (bilgi.odeyen
          ? `${bilgi.odeyen} tarafından yapılan kurumsal kayıt kapsamında eğitime eklendin. `
          : "Kurumsal kayıt kapsamında eğitime eklendin. ") +
        "Ödemeyle ilgili yapman gereken bir şey yok; panelin şu andan itibaren açık." +
        (bilgi.testAcik
          ? " Sıradaki adım kısa bir ön değerlendirme: eğitimi sana göre kurabilmemiz için onu doldurman gerekiyor."
          : ""),
      satirlar: [
        ...(bilgi.program ? [{ etiket: "Program", deger: bilgi.program }] : []),
        ...(bilgi.odeyen ? [{ etiket: "Kayıt", deger: bilgi.odeyen }] : []),
        { etiket: "Sıradaki adım", deger: bilgi.testAcik ? "Ön değerlendirmeyi doldur" : "Panele giriş yap" },
      ],
      yol: bilgi.testAcik ? "/panel/testlerim" : "/panel",
      eylemEtiketi: bilgi.testAcik ? "Ön değerlendirmeyi aç" : "Panele git",
    });
    return { gonderildi: true };
  } catch (e) {
    return { gonderildi: false, sebep: e instanceof Error ? e.message : "Bilinmeyen hata" };
  }
}

/** Danışmanlık görüşmesine tarih ve saat verildiğinde. */
export async function gorusmePlanlandiBildir(
  servis: SupabaseClient<Database>,
  userId: string,
  bilgi: { baslangic: string; sureDk: number; konu: string | null; toplantiLink: string | null },
): Promise<BildirimSonuc> {
  try {
    const kisi = await kisiyiOku(servis, userId);
    if (!kisi.email) return { gonderildi: false, sebep: EPOSTA_YOK };

    const zaman = tarihSaatBicimi.format(new Date(bilgi.baslangic));

    await ogrenciBildirimi({
      akis: "gorusme-planlandi",
      alici: kisi.email,
      konu: `Danışmanlık görüşmen planlandı · ${zaman}`,
      ustEtiket: "Danışmanlık",
      baslik: kisi.ad ? `${kisi.ad}, görüşmen planlandı` : "Görüşmen planlandı",
      ozet:
        "Danışmanlık talebine tarih ve saat verildi. Katılım bağlantısı panelindeki görüşmeler sayfasında " +
        "duruyor; görüşme saatinde oradan katılabilirsin.",
      satirlar: [
        // Saat en üstte: mailden akılda kalması gereken tek şey bu.
        { etiket: "Tarih ve saat", deger: zaman },
        { etiket: "Süre", deger: `${bilgi.sureDk} dakika` },
        ...(bilgi.konu ? [{ etiket: "Konu", deger: bilgi.konu }] : []),
      ],
      yol: "/panel/gorusmeler",
      eylemEtiketi: "Görüşmeyi aç",
    });
    return { gonderildi: true };
  } catch (e) {
    return { gonderildi: false, sebep: e instanceof Error ? e.message : "Bilinmeyen hata" };
  }
}

/**
 * Erişimi açıldığı hâlde ön değerlendirmeyi doldurmayana hatırlatma.
 *
 * Kişi başına BİR KEZ: doldurmama bir tercih de olabilir ve aynı maili tekrar
 * göndermek, ilkini de okunmaz hâle getiriyor. Tekrarı engelleyen damga
 * profiles.on_degerlendirme_hatirlatma_tarihi.
 */
export async function onDegerlendirmeHatirlat(
  servis: SupabaseClient<Database>,
  userId: string,
): Promise<BildirimSonuc> {
  try {
    const kisi = await kisiyiOku(servis, userId);
    if (!kisi.email) return { gonderildi: false, sebep: EPOSTA_YOK };

    await ogrenciBildirimi({
      akis: "on-degerlendirme-hatirlatma",
      alici: kisi.email,
      konu: "Ön değerlendirmen bekliyor",
      ustEtiket: "Ön değerlendirme",
      baslik: kisi.ad ? `${kisi.ad}, ön değerlendirmen bekliyor` : "Ön değerlendirmen bekliyor",
      ozet:
        "Eğitim erişimin açık ama ön değerlendirme testin hâlâ boş görünüyor. Eğitimi senin seviyene ve " +
        "sektörüne göre kurgulayabilmemiz için ihtiyacımız olan tek şey bu; birkaç dakika sürüyor ve " +
        "tarih planlaması da ardından açılıyor.",
      yol: "/panel/testlerim",
      eylemEtiketi: "Testi doldur",
    });
    return { gonderildi: true };
  } catch (e) {
    return { gonderildi: false, sebep: e instanceof Error ? e.message : "Bilinmeyen hata" };
  }
}
