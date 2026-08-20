"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { nativeIstekMi } from "@/lib/native-sunucu";
import { iyzicoAyari, odemeBaslat as iyzicoBaslat, taksitleriCoz } from "@/lib/iyzico";
import { yoneticiBildirimi } from "@/lib/eposta";
import { paraBicimi } from "@/lib/odeme";
import { rizaKaydet } from "@/lib/riza";
import { metaOlayiKuyrukla } from "@/lib/meta/kuyruk";
import { istekBaglami, profildenKimlik } from "@/lib/meta/toplama";

/** Ödeme adımında onaylanan metinler. */
const ODEME_BELGELERI = ["satis-sozlesmesi", "iptal-iade-politikasi"];

/**
 * Ödeme başlatma.
 *
 * Tutar İSTEMCİDEN ALINMIYOR. Kayıt id'siyle veritabanından okunuyor; aksi
 * halde tarayıcıdan 1 TL gönderip eğitimi satın almak mümkün olurdu.
 */

/** Geri dönüş adresi isteğin geldiği alan adından kuruluyor. */
async function siteKoku(): Promise<string> {
  const h = await headers();
  const host = h.get("host") ?? "";
  // Vercel arkasında istek TLS'i sonlandırılmış olarak geliyor; şemayı
  // başlıktan okumazsak yerelde https, canlıda http üretiyor.
  const sema = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${sema}://${host}`;
}

async function istekIp(): Promise<string> {
  const h = await headers();
  const ham = h.get("x-forwarded-for") ?? "";
  const ilk = ham.split(",")[0]?.trim();
  // iyzico ip alanını zorunlu tutuyor ve boş metni reddediyor.
  return ilk || "127.0.0.1";
}

export async function odemeyeGec(
  paymentId: string,
  /*
    Sözleşme onayı sunucuya taşınıyor.

    Kutucuk şimdiye kadar yalnızca düğmeyi açıyordu: işaretlendiği hiçbir yere
    yazılmıyor, sunucu da sormuyordu. Yani onay ne ispat edilebiliyordu ne de
    zorunluydu — bu eylem tarayıcıdan doğrudan çağrılabilir ve ödeme, kutucuk
    hiç işaretlenmeden başlatılabilirdi.
  */
  onay = false,
): Promise<{ adres?: string; hata?: string }> {
  // Apple 3.1.3: uygulama içinden ödeme akışı hiç açılmamalı. Sayfa zaten
  // uygulamada basılmıyor ama sunucu eylemi adresten bağımsız çağrılabilir.
  if (await nativeIstekMi()) return { hata: "Bu işlem uygulamada yapılamıyor." };

  if (!onay) return { hata: "Devam etmek için sözleşmeleri onaylaman gerekiyor." };

  const ayar = iyzicoAyari();
  if (!ayar) return { hata: "Ödeme altyapısı henüz yapılandırılmadı." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { hata: "Oturumun kapanmış görünüyor, tekrar giriş yap." };

  /*
    Sahiplik süzgeci AÇIK. RLS "kendi satırın veya yöneticiysen hepsi" diyor
    ve yönetici de bu paneli kullanıyor; süzgeç olmadan başkasının bekleyen
    ödemesinin id'siyle bu eylem çağrılabilirdi. Durum süzgeci ise ödenmiş bir
    kaydın ikinci kez tahsil edilmesini engelliyor.
  */
  const { data: kayit } = await supabase
    .from("payments")
    .select("id, tutar, online_odeme, courses(baslik)")
    .eq("id", paymentId)
    .eq("user_id", user.id)
    .eq("durum", "bekliyor")
    .maybeSingle();

  if (!kayit) return { hata: "Ödenecek kayıt bulunamadı." };
  if (kayit.online_odeme === false) return { hata: "Bu kayıt kartla ödemeye kapalı." };

  const tutar = Number(kayit.tutar);
  if (!Number.isFinite(tutar) || tutar <= 0) return { hata: "Kaydın tutarı geçersiz." };

  const { data: profil } = await supabase
    .from("profiles")
    .select("ad, soyad, telefon")
    .eq("id", user.id)
    .maybeSingle();

  // settings tablosu öğrenciye kapalı (settings_admin_select); fatura adresi
  // ve taksit ayarı oradan geldiği için servis anahtarıyla okunuyor.
  const servis = gorevIstemcisi();
  if (!servis) return { hata: "Sunucu yapılandırması eksik." };

  const { data: ayarSatiri } = await servis
    .from("settings")
    .select("deger")
    .eq("anahtar", "odeme")
    .maybeSingle();
  const odemeAyari = (ayarSatiri?.deger ?? {}) as Record<string, string>;

  /*
    Onay, iyzico'ya gitmeden ÖNCE yazılıyor. Dönüşte yazsaydık yarıda bırakılan
    ödemelerde onay hiç kaydedilmezdi — oysa kişi sözleşmeyi o an kabul etti ve
    kabul ettiği metin o anki metindi.
  */
  await rizaKaydet({
    userId: user.id,
    belgeler: ODEME_BELGELERI,
    baglam: "odeme",
    paymentId: kayit.id,
  });

  const konusmaId = crypto.randomUUID();

  // Deneme kaydı iyzico'ya GİTMEDEN önce yazılıyor: geri dönüşte eşleşecek
  // satır yoksa ödemeyi doğrulayamayız ve para çekilmiş ama kaydı olmayan bir
  // durum kalır. Tersi (kayıt var, ödeme başlamadı) zararsız.
  const { error: denemeHatasi } = await servis.from("odeme_denemeleri").insert({
    payment_id: kayit.id,
    user_id: user.id,
    conversation_id: konusmaId,
    tutar,
  });
  if (denemeHatasi) return { hata: "Ödeme kaydı oluşturulamadı." };

  const kok = await siteKoku();
  const kursAdi = kayit.courses?.baslik ?? null;

  let cevap;
  try {
    cevap = await iyzicoBaslat(ayar, {
      konusmaId,
      tutar,
      donusAdresi: `${kok}/api/odeme/iyzico/sonuc`,
      alici: {
        id: user.id,
        ad: profil?.ad?.trim() || "Katılımcı",
        soyad: profil?.soyad?.trim() || "-",
        email: user.email ?? "",
        telefon: profil?.telefon?.trim() || "+905000000000",
        ip: await istekIp(),
      },
      kalem: {
        id: kayit.id,
        ad: kursAdi ?? "Eğitim ücreti",
        kategori: "Eğitim",
      },
      adres: {
        adres: odemeAyari.adres?.trim() || "Ankara, Türkiye",
        sehir: odemeAyari.sehir?.trim() || "Ankara",
        ulke: "Turkey",
      },
      taksitler: taksitleriCoz(odemeAyari.taksit),
    });
  } catch (e) {
    await servis
      .from("odeme_denemeleri")
      .update({ durum: "basarisiz", hata_mesaji: e instanceof Error ? e.message : "Bilinmeyen hata" })
      .eq("conversation_id", konusmaId)
      .eq("user_id", user.id);
    return { hata: "Ödeme sayfası açılamadı, birazdan tekrar dene." };
  }

  if (cevap.status !== "success" || !cevap.paymentPageUrl) {
    await servis
      .from("odeme_denemeleri")
      .update({
        durum: "basarisiz",
        hata_kodu: cevap.errorCode ?? null,
        hata_mesaji: cevap.errorMessage ?? "iyzico ödeme sayfası döndürmedi.",
        ham_yanit: cevap,
      })
      .eq("conversation_id", konusmaId)
      .eq("user_id", user.id);
    // iyzico'nun hata metni teknik ("Sistem hatası" / alan doğrulama);
    // öğrenciye ham hâlini göstermenin faydası yok.
    return { hata: "Ödeme başlatılamadı. Sorun sürerse bize yaz." };
  }

  await servis
    .from("odeme_denemeleri")
    .update({ token: cevap.token ?? null })
    .eq("conversation_id", konusmaId)
    .eq("user_id", user.id);

  /*
    Meta'ya InitiateCheckout.

    iyzico sayfası AÇILDIKTAN sonra: daha önce yazılsaydı, sayfası hiç
    açılmayan başarısız denemeler de "ödemeye başladı" diye sayılırdı.

    Kimlik profilden geliyor ama _fbp/_fbc istekten tazeleniyor: kişi o an
    panelde ve tarayıcısındaki değer profildekinden yeni olabilir.
  */
  const [baglam, metaKimlik] = await Promise.all([istekBaglami(), profildenKimlik(servis, user.id)]);
  if (metaKimlik) {
    await metaOlayiKuyrukla({
      olay: "InitiateCheckout",
      eventId: `checkout-${konusmaId}`,
      kimlik: {
        ...metaKimlik.kimlik,
        ...(baglam.fbp ? { fbp: baglam.fbp } : {}),
        ...(baglam.fbc ? { fbc: baglam.fbc } : {}),
        ...(baglam.ip ? { client_ip_address: baglam.ip } : {}),
        ...(baglam.ua ? { client_user_agent: baglam.ua } : {}),
      },
      ozel: { value: tutar, currency: "TRY", content_name: kursAdi ?? "Eğitim" },
      aksiyon: "website",
      userId: user.id,
      // Panelde olduğu için isteğin izni asıl kaynak; profildeki kayıt
      // yalnızca istekte çerez yoksa devreye giriyor.
      izin: baglam.izin || metaKimlik.izin,
    });
  }

  return { adres: cevap.paymentPageUrl };
}

/**
 * "Havaleyi yaptım" bildirimi.
 *
 * Ödemeyi ÖDENDİ yapmıyor — öğrencinin beyanı tahsilatın kanıtı değil.
 * Yaptığı tek şey yöneticiye haber vermek ve kayda bir damga düşmek; asıl
 * doğrulama hesap ekstresinden yapılıyor.
 */
export async function havaleBildir(
  paymentId: string,
  /** Mesafeli satış sözleşmesi onayı; kart yolundaki gibi sunucuda zorunlu. */
  onay = false,
): Promise<{ tamam?: true; hata?: string }> {
  if (await nativeIstekMi()) return { hata: "Bu işlem uygulamada yapılamıyor." };
  if (!onay) return { hata: "Devam etmek için sözleşmeleri onaylaman gerekiyor." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { hata: "Oturumun kapanmış görünüyor, tekrar giriş yap." };

  // Sahiplik süzgeci AÇIK — odemeyeGec ile aynı sebep. Durum süzgeci ödenmiş
  // bir kayda bildirim düşmesini engelliyor.
  const { data: kayit } = await supabase
    .from("payments")
    .select("id, tutar, courses(baslik)")
    .eq("id", paymentId)
    .eq("user_id", user.id)
    .eq("durum", "bekliyor")
    .maybeSingle();
  if (!kayit) return { hata: "Ödenecek kayıt bulunamadı." };

  const servis = gorevIstemcisi();
  if (!servis) return { hata: "Sunucu yapılandırması eksik." };

  /*
    payments'ta yazma yetkisi yalnızca yöneticide; damgayı servis anahtarı
    atıyor. Servis anahtarı RLS'i atladığı için user_id süzgeci burada da
    tekrarlanıyor: sahiplik yukarıda doğrulandı ama bu satır o doğrulamaya
    değil, kendi süzgecine dayanmalı.
  */
  await servis
    .from("payments")
    .update({ havale_bildirimi_tarihi: new Date().toISOString() })
    .eq("id", kayit.id)
    .eq("user_id", user.id)
    .eq("durum", "bekliyor");

  await rizaKaydet({
    userId: user.id,
    belgeler: ODEME_BELGELERI,
    baglam: "odeme",
    paymentId: kayit.id,
  });

  const { data: profil } = await supabase
    .from("profiles")
    .select("ad, soyad, telefon")
    .eq("id", user.id)
    .maybeSingle();
  const isim = [profil?.ad, profil?.soyad].filter(Boolean).join(" ") || user.email || "Bir katılımcı";
  const tutar = Number(kayit.tutar);

  await yoneticiBildirimi({
    akis: "havale-bildirimi",
    konu: `Havale bildirimi · ${paraBicimi.format(tutar)} · ${isim}`,
    ustEtiket: "Havale bildirimi",
    baslik: `${isim} havale yaptığını bildirdi`,
    ozet: "Tutarın hesaba geçtiğini ekstreden doğrulayıp kaydı “Ödendi” olarak işaretle.",
    satirlar: [
      { etiket: "Tutar", deger: paraBicimi.format(tutar) },
      { etiket: "Eğitim", deger: kayit.courses?.baslik ?? "Belirtilmedi" },
      { etiket: "E-posta", deger: user.email ?? "—" },
      { etiket: "Telefon", deger: profil?.telefon ?? "—" },
    ],
    yol: "/kontrol-9f4x2k/odemeler",
    eylemEtiketi: "Ödemeleri aç",
  });

  return { tamam: true };
}
