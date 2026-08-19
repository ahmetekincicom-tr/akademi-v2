import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getYayindakiDuyurular } from "@/lib/duyuru-sorgu";
import { yeniSayisi } from "@/lib/duyuru";
import type { IconName } from "@/components/Icon";

/**
 * Panelin bildirim merkezi.
 *
 * Rozetler ve genel bakıştaki bildirim kutusu aynı yerden besleniyor. İki
 * ayrı hesap yazılsaydı er geç ayrışırdı: yan menüde 2 yazarken kutuda tek
 * satır görünmesi, kullanıcının hangisine güveneceğini bilmediği bir durum.
 *
 * İki tür bildirim var ve ayrımı bilerek koruyoruz:
 *
 *   sayılabilir — "bu tarihten sonra ne oldu": yeni ders kaydı, planlanan
 *   oturum, gelen yanıt. panel_gorulme'deki zaman damgasına bakıyor, bölüm
 *   açılınca sıfırlanıyor.
 *
 *   duran      — "hâlâ yapılmamış": bekleyen ödeme. Görülmesi bir şeyi
 *   değiştirmiyor, ödeme yapılana kadar durmalı. Bu yüzden panel_gorulme'ye
 *   hiç bakmıyor.
 */

/** panel_gorulme.alan değerleri. */
export type GorulmeAlani = "birebir" | "soru_cevap";

export type PanelBildirim = {
  anahtar: string;
  baslik: string;
  aciklama: string;
  yol: string;
  ikon: IconName;
  /** Rozet sayısı; duran bildirimlerde yok. */
  sayi?: number;
  /** "uyari" dikkat isteyen, eylem bekleyen bildirim (ödeme gibi). */
  ton: "bilgi" | "uyari";
};

export type PanelBildirimleri = {
  liste: PanelBildirim[];
  /** Yan menü rozetleri. */
  sayac: { birebir: number; soruCevap: number; duyuru: number };
  /** Bekleyen ödeme; rozet değil, duran bir uyarı. */
  odemeBekliyor: { adet: number; tutar: number } | null;
  toplam: number;
};

const BOS: PanelBildirimleri = {
  liste: [],
  sayac: { birebir: 0, soruCevap: 0, duyuru: 0 },
  odemeBekliyor: null,
  toplam: 0,
};

/*
  Hiç görülme kaydı olmayan bölüm için başlangıç noktası.

  Epoch verilirsek panele ilk giren kişi geçmişteki her şeyi "yeni" görüyor;
  şimdiki zamanı verirsek bölüm hiç açılmadan her şey okunmuş sayılıyor.
  Hesabın açılış tarihi ikisinin arasında doğru olan: kişi katıldıktan sonra
  eklenen şeyler yeni, öncekiler değil.
*/
function baslangicNoktasi(kayitTarihi: string | null): string {
  return kayitTarihi ?? new Date(0).toISOString();
}

/**
 * Bir istekte birden çok yerden çağrılıyor (yan menü + genel bakış); cache
 * sayesinde sorgular bir kez çalışıyor.
 */
export const getBildirimler = cache(async (): Promise<PanelBildirimleri> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return BOS;

  const [{ data: profil }, { data: gorulmeler }] = await Promise.all([
    supabase.from("profiles").select("created_at").eq("id", user.id).maybeSingle(),
    supabase.from("panel_gorulme").select("alan, gorulme").eq("user_id", user.id),
  ]);

  const esik = (alan: GorulmeAlani) =>
    (gorulmeler ?? []).find((g) => g.alan === alan)?.gorulme ?? baslangicNoktasi(profil?.created_at ?? null);

  const birebirEsik = esik("birebir");
  const soruEsik = esik("soru_cevap");

  /*
    Her sorguda user_id süzgeci var, RLS'e güvenip bırakılmıyor. Sebep:
    yönetici de bu paneli kullanıyor ve onun için RLS herkesin satırını
    döndürüyor — süzgeç olmasa yönetici kendi panelinde bütün katılımcıların
    bildirimlerini sayardı.
  */
  const [yeniKayit, yeniOturum, yeniYanit, bekleyen, duyurular] = await Promise.all([
    supabase
      .from("egitim_kayit_arsivi")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gt("created_at", birebirEsik),
    supabase
      .from("egitim_oturumlari")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("durum", "planlandi")
      .gt("created_at", birebirEsik),
    // !inner: talebin sahibi ben olmalıyım. Yalnızca gonderen_id süzgeci
    // yetmez, o yalnızca "benim yazmadığım" demek.
    supabase
      .from("support_messages")
      .select("id, support_tickets!inner(user_id)", { count: "exact", head: true })
      .eq("support_tickets.user_id", user.id)
      .neq("gonderen_id", user.id)
      .gt("created_at", soruEsik),
    supabase.from("payments").select("tutar").eq("user_id", user.id).eq("durum", "bekliyor"),
    getYayindakiDuyurular(),
  ]);

  const kayitSayisi = yeniKayit.count ?? 0;
  const oturumSayisi = yeniOturum.count ?? 0;
  const yanitSayisi = yeniYanit.count ?? 0;
  const duyuruSayisi = yeniSayisi(duyurular);

  const bekleyenSatirlar = bekleyen.data ?? [];
  const bekleyenTutar = bekleyenSatirlar.reduce((n, s) => n + Number(s.tutar ?? 0), 0);

  const liste: PanelBildirim[] = [];

  // Ödeme en üstte: tek eylem bekleyen bildirim bu, diğerleri bilgi.
  if (bekleyenSatirlar.length > 0) {
    liste.push({
      anahtar: "odeme",
      baslik: bekleyenSatirlar.length > 1 ? "Bekleyen ödemelerin var" : "Bekleyen ödemen var",
      aciklama: "Kartla ya da havale ile tamamlayabilirsin.",
      yol: "/panel/odemelerim",
      ikon: "card",
      ton: "uyari",
    });
  }

  if (yanitSayisi > 0) {
    liste.push({
      anahtar: "soru-cevap",
      baslik: yanitSayisi > 1 ? `${yanitSayisi} yeni yanıt` : "Soru-cevapta yeni yanıt",
      aciklama: "Eğitmenin talebine cevap yazdı.",
      yol: "/panel/soru-cevap",
      ikon: "message",
      sayi: yanitSayisi,
      ton: "bilgi",
    });
  }

  if (kayitSayisi > 0) {
    liste.push({
      anahtar: "kayit",
      baslik: "Ders kayıtların eklendi",
      aciklama:
        kayitSayisi > 1
          ? `${kayitSayisi} kayıt klasörü paylaşıldı.`
          : "Ekran kayıtlarının bulunduğu klasör paylaşıldı.",
      yol: "/panel/birebir-egitim",
      ikon: "folder",
      sayi: kayitSayisi,
      ton: "bilgi",
    });
  }

  if (oturumSayisi > 0) {
    liste.push({
      anahtar: "oturum",
      baslik: oturumSayisi > 1 ? `${oturumSayisi} ders planlandı` : "Eğitimin planlandı",
      aciklama: "Tarih, konu ve katılım bağlantısı birebir eğitim sayfasında.",
      yol: "/panel/birebir-egitim",
      ikon: "calendar",
      sayi: oturumSayisi,
      ton: "bilgi",
    });
  }

  if (duyuruSayisi > 0) {
    liste.push({
      anahtar: "duyuru",
      baslik: duyuruSayisi > 1 ? `${duyuruSayisi} yeni gündem yazısı` : "Yeni gündem yazısı",
      aciklama: "Sektörde bu hafta ne değişti.",
      yol: "/panel/duyurular",
      ikon: "bell",
      sayi: duyuruSayisi,
      ton: "bilgi",
    });
  }

  return {
    liste,
    sayac: {
      birebir: kayitSayisi + oturumSayisi,
      soruCevap: yanitSayisi,
      duyuru: duyuruSayisi,
    },
    odemeBekliyor: bekleyenSatirlar.length
      ? { adet: bekleyenSatirlar.length, tutar: bekleyenTutar }
      : null,
    toplam: liste.length,
  };
});
