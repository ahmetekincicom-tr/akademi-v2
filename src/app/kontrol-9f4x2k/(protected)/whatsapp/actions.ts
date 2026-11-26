"use server";

import { revalidatePath } from "next/cache";
import { yoneticiMi } from "@/lib/panel-kapsam";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { veriHatasi } from "@/lib/auth-hatalari";
import {
  BITIS_OLAYLARI,
  UYGULAMAYLA_BIRLIKTE_OLAYI,
  anahtarHesaplari,
  baglanacakNumara,
  kimlikGecerliMi,
  type HesapNumarasi,
} from "@/lib/whatsapp/ortak";
import {
  anahtarBilgisi,
  hesapNumaralari,
  koduAnahtaraCevir,
  numaraBilgisi,
  numaralar,
  uygulamaVerisiniSenkronla,
  uygulamayiAboneEt,
} from "@/lib/whatsapp/graph";

const YOL = "/kontrol-9f4x2k/whatsapp";

/**
 * Meta uygulama kimliği ve Embedded Signup yapılandırma kimliği.
 * İkisi de gizli değil (tarayıcıdaki JS SDK'ya veriliyor); panelden
 * girilebilsin diye veritabanında.
 */
export async function whatsappAyarKaydet(girdi: { appId: string; configId: string }): Promise<{ error?: string }> {
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };
  const appId = girdi.appId.trim();
  const configId = girdi.configId.trim();
  if (appId && !kimlikGecerliMi(appId)) return { error: "Uygulama kimliği yalnızca rakamlardan oluşmalı." };
  if (configId && !kimlikGecerliMi(configId)) return { error: "Yapılandırma kimliği yalnızca rakamlardan oluşmalı." };

  const servis = gorevIstemcisi();
  if (!servis) return { error: "Sunucu yapılandırması eksik." };
  const { error } = await servis.from("whatsapp_baglanti").upsert({
    id: true,
    app_id: appId || null,
    es_config_id: configId || null,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: veriHatasi(error) };
  revalidatePath(YOL, "layout");
  return {};
}

export type BaglantiSonucu = {
  error?: string;
  numara?: string | null;
  uygulamaylaBirlikte?: boolean;
  /** Senkronizasyon isteklerinden dönen hatalar (bağlantı yine de tamam). */
  uyarilar?: string[];
};

/**
 * Embedded Signup'tan dönen kodla bağlantıyı tamamlar.
 *
 * Sıra Meta'nın Teknoloji Sağlayıcı ve coexistence belgelerinden:
 *  1. Kodu işletme erişim anahtarına çevir (kodun ömrü 30 saniye).
 *  2. Uygulamayı WhatsApp işletme hesabına abone et (webhook bildirimleri).
 *  3. Telefondaki uygulamayla birlikte kullanımda: kişi listesi ve sohbet
 *     geçmişi senkronizasyonu — 24 saat içinde, her biri YALNIZ BİR KEZ.
 *     Numara zaten kayıtlı olduğu için /register çağrılmıyor.
 *
 * Erişim anahtarı SAKLANMIYOR: bu adımlar için bir kez kullanılıp atılıyor.
 * Kalıcı gönderim anahtarı (sistem kullanıcısı) ayrı bir adım ve yalnızca
 * Vercel'de duracak.
 */
export async function whatsappBagla(girdi: {
  kod: string;
  olay: string;
  wabaId: string;
  telefonNumaraId: string | null;
}): Promise<BaglantiSonucu> {
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };
  if (!(BITIS_OLAYLARI as readonly string[]).includes(girdi.olay)) return { error: "Bağlantı tamamlanmadı." };
  if (!kimlikGecerliMi(girdi.wabaId)) return { error: "WhatsApp işletme hesabı kimliği okunamadı." };
  if (girdi.telefonNumaraId && !kimlikGecerliMi(girdi.telefonNumaraId)) return { error: "Numara kimliği okunamadı." };
  if (typeof girdi.kod !== "string" || girdi.kod.length < 10 || girdi.kod.length > 2048) return { error: "Bağlantı kodu okunamadı." };

  const servis = gorevIstemcisi();
  const sir = process.env.WHATSAPP_APP_SECRET?.trim();
  if (!servis || !sir) return { error: "Sunucuda WHATSAPP_APP_SECRET tanımlı değil." };

  const { data: ayar } = await servis.from("whatsapp_baglanti").select("app_id, senkron").eq("id", true).maybeSingle();
  if (!ayar?.app_id) return { error: "Önce uygulama kimliğini kaydet." };

  const anahtar = await koduAnahtaraCevir(ayar.app_id, sir, girdi.kod);
  if (!anahtar.ok) return { error: `Meta kodu kabul etmedi: ${anahtar.hata}` };
  const token = anahtar.veri.access_token;

  // Numara kimliği bazı olaylarda gelmiyor; hesaptaki numaradan bul.
  let telefonNumaraId = girdi.telefonNumaraId;
  let gorunen: string | null = null;
  let ad: string | null = null;
  if (telefonNumaraId) {
    const b = await numaraBilgisi(telefonNumaraId, token);
    if (b.ok) {
      gorunen = b.veri.display_phone_number ?? null;
      ad = b.veri.verified_name ?? null;
    }
  } else {
    const l = await numaralar(girdi.wabaId, token);
    const ilk = l.ok ? l.veri.data[0] : undefined;
    if (ilk) {
      telefonNumaraId = ilk.id;
      gorunen = ilk.display_phone_number ?? null;
      ad = ilk.verified_name ?? null;
    }
  }

  return baglantiyiTamamla(servis, ayar.senkron, token, {
    wabaId: girdi.wabaId,
    telefonNumaraId,
    gorunen,
    ad,
    uygulamaylaBirlikte: girdi.olay === UYGULAMAYLA_BIRLIKTE_OLAYI,
  });
}

type Servis = NonNullable<ReturnType<typeof gorevIstemcisi>>;

/**
 * Bağlantının iki yolda da ortak kısmı: bildirim aboneliği, telefondaki
 * uygulamadan kişi/geçmiş aktarımı ve kayıt.
 *
 * uygulamaylaBirlikte "bilinmiyor" (null) ise aktarım yine isteniyor: numara
 * uygulamada değilse Meta isteği reddeder, zarar yok; uygulamadaysa 24 saatlik
 * aktarım süresi kaçmamış olur.
 */
async function baglantiyiTamamla(
  servis: Servis,
  eskiSenkron: unknown,
  token: string,
  h: { wabaId: string; telefonNumaraId: string | null; gorunen: string | null; ad: string | null; uygulamaylaBirlikte: boolean | null },
): Promise<BaglantiSonucu> {
  const abone = await uygulamayiAboneEt(h.wabaId, token);
  if (!abone.ok) return { error: `Bildirim aboneliği kurulamadı: ${abone.hata}` };

  const uyarilar: string[] = [];
  const onceki = (eskiSenkron && typeof eskiSenkron === "object" ? eskiSenkron : {}) as Record<string, unknown>;
  const senkron: Record<string, unknown> = { ...onceki };
  let aktarimKabul = false;

  if (h.uygulamaylaBirlikte !== false && h.telefonNumaraId) {
    for (const [tur, etiket] of [
      ["smb_app_state_sync", "kisiler"],
      ["history", "gecmis"],
    ] as const) {
      // Her biri yalnız bir kez: daha önce başarıyla istendiyse tekrar etme.
      const eski = onceki[etiket] as { request_id?: string } | undefined;
      if (eski?.request_id) {
        aktarimKabul = true;
        continue;
      }
      const r = await uygulamaVerisiniSenkronla(h.telefonNumaraId, token, tur);
      if (r.ok) {
        aktarimKabul = true;
        senkron[etiket] = { request_id: r.veri.request_id ?? "istendi", zaman: new Date().toISOString() };
      } else {
        senkron[etiket] = { hata: r.hata, zaman: new Date().toISOString() };
        uyarilar.push(`${etiket === "kisiler" ? "Kişi listesi" : "Sohbet geçmişi"} aktarımı: ${r.hata}`);
      }
    }
  }

  const uygulamaylaBirlikte = h.uygulamaylaBirlikte ?? aktarimKabul;
  const { error } = await servis.from("whatsapp_baglanti").upsert({
    id: true,
    waba_id: h.wabaId,
    telefon_numara_id: h.telefonNumaraId,
    gorunen_numara: h.gorunen,
    dogrulanmis_ad: h.ad,
    uygulamayla_birlikte: uygulamaylaBirlikte,
    baglanma_zamani: new Date().toISOString(),
    senkron: senkron as never,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: veriHatasi(error) };

  revalidatePath(YOL, "layout");
  return { numara: h.gorunen, uygulamaylaBirlikte, uyarilar };
}

/**
 * Sistem kullanıcısı anahtarıyla bağlantı (Embedded Signup penceresi olmadan).
 *
 * Neden var: WhatsApp hesabı, Meta uygulamasının sahibi olan işletmenin
 * kendisine ait. Embedded Signup'ın son adımı hesabı "ortağa" paylaşmak; işletme
 * kendisiyle paylaşamadığı için pencere orada hata veriyor (#1690130), oysa
 * QR adımıyla telefon platforma bağlanmış oluyor. Hesap zaten bizim
 * olduğundan, işletmenin sistem kullanıcısı anahtarıyla kalan adımlar
 * (abonelik, aktarım) doğrudan yapılıyor.
 *
 * Anahtar yalnızca Vercel'de (WHATSAPP_SISTEM_TOKENI); veritabanına ya da
 * tarayıcıya hiç gitmiyor. Hangi hesaba erişebildiği debug_token'dan okunuyor;
 * sistem kullanıcısına yalnızca bu işletmenin WhatsApp hesabı atanmalı.
 */
export async function whatsappSistemAnahtariylaBagla(girdi: { wabaId?: string } = {}): Promise<BaglantiSonucu> {
  if (!(await yoneticiMi())) return { error: "Bu işlem için yetkin yok." };
  const elleWaba = girdi.wabaId?.replace(/\s/g, "") ?? "";
  if (elleWaba && !kimlikGecerliMi(elleWaba)) return { error: "WhatsApp hesap kimliği yalnızca rakamlardan oluşmalı." };

  const servis = gorevIstemcisi();
  const sir = process.env.WHATSAPP_APP_SECRET?.trim();
  const token = process.env.WHATSAPP_SISTEM_TOKENI?.trim();
  if (!servis || !sir) return { error: "Sunucuda WHATSAPP_APP_SECRET tanımlı değil." };
  if (!token) return { error: "Sunucuda WHATSAPP_SISTEM_TOKENI tanımlı değil." };

  const { data: ayar } = await servis.from("whatsapp_baglanti").select("app_id, senkron").eq("id", true).maybeSingle();
  if (!ayar?.app_id) return { error: "Önce uygulama kimliğini kaydet." };

  const bilgi = await anahtarBilgisi(ayar.app_id, sir, token);
  if (!bilgi.ok) return { error: `Anahtar doğrulanamadı: ${bilgi.hata}` };
  const d = bilgi.veri.data;
  if (!d?.is_valid) return { error: "Sistem anahtarı geçersiz ya da süresi dolmuş. Yeni anahtar üretip Vercel'de güncelle." };
  if (d.app_id !== ayar.app_id) return { error: "Sistem anahtarı başka bir Meta uygulaması için üretilmiş." };
  const izinler = d.scopes ?? [];
  for (const gerekli of ["whatsapp_business_management", "whatsapp_business_messaging"]) {
    if (!izinler.includes(gerekli)) return { error: `Sistem anahtarında ${gerekli} izni yok. Anahtarı bu izinle yeniden üret.` };
  }

  /*
    Hesap kimliği önce anahtarın kapsamından (target_ids). Meta, izin anahtarın
    erişebildiği her şeyi kapsıyorsa target_ids'i hiç göndermiyor; o durumda
    panelde elle girilen kimlik kullanılıyor (İşletme ayarları → Mesajlaşma
    hesapları → hesabın "Kod"u; gizli değil). Elle girilen kimliğe erişim
    aşağıdaki numara sorgusunda zaten sınanıyor.
  */
  const kapsamdan = anahtarHesaplari(d.granular_scopes);
  const hesaplar = elleWaba ? [elleWaba] : kapsamdan;
  if (!hesaplar.length) {
    const kapsamlar = Array.isArray(d.granular_scopes)
      ? (d.granular_scopes as { scope?: unknown; target_ids?: unknown }[])
          .map((k) => `${String(k?.scope)}${Array.isArray(k?.target_ids) ? `(${k.target_ids.length})` : "(tümü)"}`)
          .join(", ")
      : "yok";
    console.warn("[whatsapp] anahtar kapsamında hesap kimliği yok:", kapsamlar);
    return {
      error:
        "Meta, anahtarın hangi WhatsApp hesabına eriştiğini bildirmedi. İşletme ayarları → Mesajlaşma hesapları → ahmetekincicomtr'deki \"Kod\" numarasını aşağıdaki kutuya yazıp tekrar dene.",
    };
  }

  const liste: HesapNumarasi[] = [];
  for (const wabaId of hesaplar) {
    const r = await hesapNumaralari(wabaId, token);
    if (!r.ok) return { error: `Numaralar okunamadı: ${r.hata}` };
    for (const n of r.veri.data ?? []) if (kimlikGecerliMi(n.id)) liste.push({ ...n, wabaId });
  }
  if (!liste.length) return { error: "Atanmış WhatsApp hesabında numara bulunamadı." };
  const secilen = baglanacakNumara(liste);
  if (!secilen) {
    const numaralar = liste.map((n) => n.display_phone_number ?? n.id).join(", ");
    return { error: `Birden fazla numara var (${numaralar}). Sistem kullanıcısına yalnızca akademinin WhatsApp hesabını ata.` };
  }

  return baglantiyiTamamla(servis, ayar.senkron, token, {
    wabaId: secilen.wabaId,
    telefonNumaraId: secilen.id,
    gorunen: secilen.display_phone_number ?? null,
    ad: secilen.verified_name ?? null,
    // false gelse bile aktarım deneniyor: yarım kalmış bir bağlantıda alan
    // henüz güncellenmemiş olabilir; geçmiş aktarımının 24 saati kaçmasın.
    uygulamaylaBirlikte: secilen.is_on_biz_app === true ? true : null,
  });
}
