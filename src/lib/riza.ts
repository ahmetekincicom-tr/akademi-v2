/**
 * Onay (rıza) kayıtları.
 *
 * KVKK ve 6502 kapsamında alınan onayların ispatı, "kutucuk işaretliydi"
 * demekten ibaret olamaz: kimin, neyi, ne zaman, nereden kabul ettiği
 * yazılmalı. Ödeme ekranındaki mesafeli satış onayı şimdiye kadar yalnızca
 * tarayıcıda duruyordu — işaretlendiği an hiçbir yere yazılmıyordu.
 *
 * Kayıt SERVİS ANAHTARIYLA atılıyor, kullanıcının oturumuyla değil.
 * riza_kayitlari'nda insert politikası yok ve authenticated'a yazma yetkisi
 * verilmedi. Sebep doğrudan kaydın değeriyle ilgili: tarayıcıdan yazılabilen
 * bir onay kaydı hiçbir şey ispat etmez.
 *
 * Tipler ve etiketler riza-tipleri.ts'te: bu dosya server-only ve onları
 * gösteren bileşenlerin bir kısmı client.
 */

import "server-only";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { gorevIstemcisi } from "@/lib/supabase/gorev";
import { BELGE_ADI, type RizaBaglami, type RizaKaydi } from "@/lib/riza-tipleri";

export type { RizaBaglami, RizaKaydi };

/** İstek başlıklarından IP ve tarayıcı. Tarayıcıdan gelen gövdeye güvenilmiyor. */
async function istekKimligi(): Promise<{ ip: string | null; tarayici: string | null }> {
  try {
    const h = await headers();
    const ham = h.get("x-forwarded-for") ?? "";
    // Zincirin ilki gerçek istemci; sonrakiler vekil sunucular.
    const ilk = ham.split(",")[0]?.trim();
    return {
      ip: ilk || h.get("x-real-ip") || null,
      tarayici: h.get("user-agent")?.slice(0, 400) ?? null,
    };
  } catch {
    // İstek bağlamı yok (zamanlanmış görev vb.); onay yine kaydedilsin.
    return { ip: null, tarayici: null };
  }
}

/**
 * Onayı kaydeder.
 *
 * Hata fırlatmıyor. Çağıran yerlerin hepsi kullanıcının başlattığı bir işin
 * ortasında (ödemeye geçiş gibi); kaydın yazılamaması o işi durdurmamalı.
 * Ama sessiz de kalmıyor: konsola düşüyor, çünkü kaydın olmaması ileride
 * ispat sorunu demek.
 */
export async function rizaKaydet(girdi: {
  userId: string;
  /** yasal_sayfalar.slug ya da 'ticari-ileti-izni' gibi kendi adı olan onay. */
  belgeler: string[];
  baglam: RizaBaglami;
  paymentId?: string | null;
}): Promise<void> {
  if (girdi.belgeler.length === 0) return;

  const servis = gorevIstemcisi();
  if (!servis) {
    console.error("[riza] servis anahtarı yok, onay kaydedilemedi:", girdi.belgeler);
    return;
  }

  const [{ ip, tarayici }, { data: sayfalar }] = await Promise.all([
    istekKimligi(),
    servis.from("yasal_sayfalar").select("slug, baslik, icerik, guncelleme").in("slug", girdi.belgeler),
  ]);

  /*
    Metnin parmak izi onay anında alınıyor.

    Yasal metinler panelden düzenlenebiliyor. Yalnızca slug saklasaydık kayıt,
    yarın yazılmış bir metne işaret ederdi; özet o anki sürümü sabitliyor.
  */
  const kodlayici = new TextEncoder();
  const satirlar = await Promise.all(
    girdi.belgeler.map(async (slug) => {
      const sayfa = sayfalar?.find((s) => s.slug === slug);
      const icerik = (sayfa?.icerik as string) ?? "";
      const ozet = icerik
        ? Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", kodlayici.encode(icerik))))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")
        : null;

      return {
        user_id: girdi.userId,
        belge: slug,
        baglam: girdi.baglam,
        belge_basligi: (sayfa?.baslik as string) ?? null,
        belge_guncelleme: (sayfa?.guncelleme as string) ?? null,
        belge_ozeti: ozet,
        payment_id: girdi.paymentId ?? null,
        ip,
        tarayici,
      };
    }),
  );

  const { error } = await servis.from("riza_kayitlari").insert(satirlar);
  if (error) console.error("[riza] kaydedilemedi:", error.message);
}

/**
 * Kişinin onay geçmişi. RLS satırları sahibiyle sınırlıyor; yönetici için
 * userId veriliyor.
 */
export async function getRizalarim(userId?: string): Promise<RizaKaydi[]> {
  const supabase = await createClient();
  let sorgu = supabase
    .from("riza_kayitlari")
    .select("id, belge, baglam, belge_basligi, belge_guncelleme, belge_ozeti, created_at")
    .order("created_at", { ascending: false });

  // Yönetici için RLS herkesi döndürüyor; süzgeç olmadan başkasının onayları
  // da listeye karışırdı.
  if (userId) sorgu = sorgu.eq("user_id", userId);

  const { data } = await sorgu;

  return (data ?? []).map((r) => ({
    id: r.id,
    belge: r.belge,
    baglam: r.baglam as RizaBaglami,
    baslik: (r.belge_basligi as string) || BELGE_ADI[r.belge] || r.belge,
    tarih: r.created_at,
    belgeGuncelleme: r.belge_guncelleme ?? null,
    ozet: r.belge_ozeti ?? null,
  }));
}

