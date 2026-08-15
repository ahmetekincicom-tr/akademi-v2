"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { pushGonder } from "@/lib/apns";
import { slugYap, type DuyuruDurum, type DuyuruOnem } from "@/lib/duyuru";

export type DuyuruGirdi = {
  id?: string;
  baslik: string;
  ozet: string;
  icerik: string;
  kategori: string;
  onem: DuyuruOnem;
  durum: DuyuruDurum;
};

async function yoneticiMi() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return data?.role === "admin" ? { supabase, user } : null;
}

function tazele(slug?: string) {
  revalidatePath("/kontrol-9f4x2k/duyurular");
  revalidatePath("/panel/duyurular");
  if (slug) revalidatePath(`/panel/duyurular/${slug}`);
}

/**
 * Duyuruyu kaydeder. Yayına alınırken yayın tarihi bir kez damgalanıyor;
 * sonraki düzenlemeler tarihi öne çekmiyor — küçük bir yazım düzeltmesi
 * duyuruyu listenin başına fırlatmamalı.
 */
export async function duyuruKaydet(girdi: DuyuruGirdi): Promise<{ error?: string; slug?: string }> {
  const oturum = await yoneticiMi();
  if (!oturum) return { error: "Yetkisiz işlem." };
  const { supabase } = oturum;

  const baslik = girdi.baslik.trim();
  if (!baslik) return { error: "Başlık zorunlu." };

  const ozet = girdi.ozet.trim();
  // Özet push bildiriminin gövdesi oluyor; boşsa telefonda başlıksız bir
  // bildirim çıkar.
  if (girdi.durum === "yayinda" && !ozet) {
    return { error: "Yayınlamadan önce özet gir — bildirim metni olarak kullanılıyor." };
  }

  const alanlar = {
    baslik,
    ozet,
    icerik: girdi.icerik.trim(),
    kategori: girdi.kategori.trim() || "Genel",
    onem: girdi.onem,
    durum: girdi.durum,
  };

  if (girdi.id) {
    const { data: mevcut } = await supabase
      .from("duyurular")
      .select("slug, yayin_tarihi")
      .eq("id", girdi.id)
      .maybeSingle();

    const { error } = await supabase
      .from("duyurular")
      .update({
        ...alanlar,
        yayin_tarihi:
          girdi.durum === "yayinda" ? (mevcut?.yayin_tarihi ?? new Date().toISOString()) : null,
      })
      .eq("id", girdi.id);

    if (error) return { error: error.message };
    tazele(mevcut?.slug);
    return { slug: mevcut?.slug };
  }

  // Aynı başlıktan ikinci bir duyuru gelirse adres çakışır; sonuna sayı
  // ekleyerek ilerliyoruz.
  const kok = slugYap(baslik) || "duyuru";
  let slug = kok;
  for (let i = 2; i < 50; i++) {
    const { data } = await supabase.from("duyurular").select("id").eq("slug", slug).maybeSingle();
    if (!data) break;
    slug = `${kok}-${i}`;
  }

  const { error } = await supabase.from("duyurular").insert({
    ...alanlar,
    slug,
    yayin_tarihi: girdi.durum === "yayinda" ? new Date().toISOString() : null,
  });

  if (error) return { error: error.message };
  tazele(slug);
  return { slug };
}

export async function duyuruSil(id: string): Promise<{ error?: string }> {
  const oturum = await yoneticiMi();
  if (!oturum) return { error: "Yetkisiz işlem." };

  const { error } = await oturum.supabase.from("duyurular").delete().eq("id", id);
  if (error) return { error: error.message };
  tazele();
  return {};
}

/**
 * Duyuruyu push bildirimi olarak gönderir.
 *
 * Bildirime dokunulduğunda duyurunun kendi sayfası açılıyor: yol bildirimin
 * verisinde taşınıyor ve uygulamadaki dinleyici yalnızca uygulama içi yolları
 * kabul ediyor.
 *
 * Tekrar gönderim engellenmiyor ama damga tutuluyor — bazen bir duyuru
 * güncellenip yeniden duyurulmak isteniyor; arayüz "daha önce gönderildi"
 * uyarısını gösterip kararı yöneticiye bırakıyor.
 */
export async function duyuruBildirimGonder(id: string): Promise<{ error?: string; mesaj?: string }> {
  const oturum = await yoneticiMi();
  if (!oturum) return { error: "Yetkisiz işlem." };
  const { supabase, user } = oturum;

  const { data: duyuru } = await supabase
    .from("duyurular")
    .select("slug, baslik, ozet, durum")
    .eq("id", id)
    .maybeSingle();

  if (!duyuru) return { error: "Duyuru bulunamadı." };
  if (duyuru.durum !== "yayinda") return { error: "Önce duyuruyu yayına al." };

  const { data: cihazlar } = await supabase
    .from("push_cihazlar")
    .select("token")
    .is("gecersiz_tarihi", null);

  const tokenlar = (cihazlar ?? []).map((c) => c.token as string);
  if (tokenlar.length === 0) {
    return { error: "Kayıtlı cihaz yok. Öğrencilerin uygulamadan bildirim izni vermesi gerekiyor." };
  }

  const sonuc = await pushGonder(tokenlar, duyuru.baslik, duyuru.ozet, {
    yol: `/panel/duyurular/${duyuru.slug}`,
  });

  if (sonuc.gecersizTokenlar.length > 0) {
    await supabase
      .from("push_cihazlar")
      .update({ gecersiz_tarihi: new Date().toISOString() })
      .in("token", sonuc.gecersizTokenlar);
  }

  await supabase.from("push_gonderimler").insert({
    baslik: duyuru.baslik,
    govde: duyuru.ozet,
    cihaz_sayisi: tokenlar.length,
    basarili: sonuc.gonderilen,
    hata_metni: sonuc.hata ?? null,
    gonderen_id: user.id,
  });

  if (sonuc.gonderilen === 0) return { error: sonuc.hata ?? "Hiçbir cihaza ulaşılamadı." };

  await supabase
    .from("duyurular")
    .update({ bildirim_gonderildi_tarihi: new Date().toISOString() })
    .eq("id", id);

  tazele(duyuru.slug);
  return { mesaj: `${sonuc.gonderilen}/${tokenlar.length} cihaza bildirim gönderildi.` };
}
