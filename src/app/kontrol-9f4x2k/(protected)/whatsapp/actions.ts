"use server";

import { revalidatePath } from "next/cache";
import { yoneticiMi } from "@/lib/panel-kapsam";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { veriHatasi } from "@/lib/auth-hatalari";
import { BITIS_OLAYLARI, UYGULAMAYLA_BIRLIKTE_OLAYI, kimlikGecerliMi } from "@/lib/whatsapp/ortak";
import { koduAnahtaraCevir, numaraBilgisi, numaralar, uygulamaVerisiniSenkronla, uygulamayiAboneEt } from "@/lib/whatsapp/graph";

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
  revalidatePath(YOL);
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

  const abone = await uygulamayiAboneEt(girdi.wabaId, token);
  if (!abone.ok) return { error: `Bildirim aboneliği kurulamadı: ${abone.hata}` };

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

  const uygulamaylaBirlikte = girdi.olay === UYGULAMAYLA_BIRLIKTE_OLAYI;
  const uyarilar: string[] = [];
  const onceki = (ayar.senkron && typeof ayar.senkron === "object" ? ayar.senkron : {}) as Record<string, unknown>;
  const senkron: Record<string, unknown> = { ...onceki };

  if (uygulamaylaBirlikte && telefonNumaraId) {
    for (const [tur, etiket] of [
      ["smb_app_state_sync", "kisiler"],
      ["history", "gecmis"],
    ] as const) {
      // Her biri yalnız bir kez: daha önce başarıyla istendiyse tekrar etme.
      const eski = onceki[etiket] as { request_id?: string } | undefined;
      if (eski?.request_id) continue;
      const r = await uygulamaVerisiniSenkronla(telefonNumaraId, token, tur);
      if (r.ok) senkron[etiket] = { request_id: r.veri.request_id ?? "istendi", zaman: new Date().toISOString() };
      else {
        senkron[etiket] = { hata: r.hata, zaman: new Date().toISOString() };
        uyarilar.push(`${etiket === "kisiler" ? "Kişi listesi" : "Sohbet geçmişi"} aktarımı: ${r.hata}`);
      }
    }
  }

  const { error } = await servis.from("whatsapp_baglanti").upsert({
    id: true,
    waba_id: girdi.wabaId,
    telefon_numara_id: telefonNumaraId,
    gorunen_numara: gorunen,
    dogrulanmis_ad: ad,
    uygulamayla_birlikte: uygulamaylaBirlikte,
    baglanma_zamani: new Date().toISOString(),
    senkron: senkron as never,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: veriHatasi(error) };

  revalidatePath(YOL);
  return { numara: gorunen, uygulamaylaBirlikte, uyarilar };
}
