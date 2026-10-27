"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugYap } from "@/lib/duyuru";
import { blogSayfalariniTazele } from "@/lib/blog-tazele";
import { hedefDuzenle } from "@/lib/yonlendirme";
import { yoneticiMi } from "@/lib/panel-kapsam";
import { kapakSimgesiMi, kapakTonuMu } from "@/lib/blog-kapak";
import type { Json } from "@/lib/supabase/tipler";
import type { YaziDurum } from "@/lib/yazilar";

/**
 * Yayından kalkan (ya da silinen) yazının eski adresi nereye gitsin.
 *
 * Verilmezse veritabanı tetikleyicisi /blog/'a yönlendiriyor: hiç karar
 * verilmemiş bir yazının adresi de 404 değil, en yakın anlamlı sayfa olur.
 */
export type YonlendirmeKarari = { kod: 301; hedef: string } | { kod: 410 };

export type YaziKaydetGirdi = {
  /** Düzenlemede mevcut kaydı bulmak için; yeni yazıda yok. */
  originalSlug?: string;
  slug: string;
  baslik: string;
  ozet: string;
  icerikHtml: string;
  icerikJson: unknown;
  kapakYol: string | null;
  durum: YaziDurum;
  /** ISO tarih; boşsa ve yayına alınıyorsa now() damgalanır. */
  yayinTarihi: string | null;
  /** ISO tarih; yalnız durum "zamanli" iken. Yayına bu an girer. */
  zamanlananTarih?: string | null;
  seoBaslik: string;
  seoAciklama: string;
  yazar: string;
  kategoriId: string | null;
  etiketler: string[];
  /** SEO analizinin odak kelimesi (yalnız panel). */
  odakKelime?: string;
  /** Görselsiz kapağın özel rengi/simgesi; null = kategorininki. */
  kapakTon?: string | null;
  kapakSimge?: string | null;
  /** Kapak görselinin alt metni; boşsa sitede yazı başlığı. */
  kapakAlt?: string;
  /**
   * İşaretliyse içeriğin GERÇEKTEN güncellendiğini damgalar (icerik_guncelleme
   * = now()). Her kayıtta otomatik değişmiyor: yalnızca yazar bilinçli seçince.
   * Teknik updated_at bundan bağımsız her kayıtta güncelleniyor.
   */
  icerikGuncellendi?: boolean;
  /** Yayındaki yazı yayından kalkıyorsa eski adresinin kaderi. */
  yonlendirme?: YonlendirmeKarari | null;
};

/** Karardaki hedefi doğrular; hata metni ya da veritabanına gidecek değerler. */
function karariHazirla(karar: YonlendirmeKarari): { kod: 301 | 410; hedef: string | null } | { error: string } {
  if (karar.kod === 410) return { kod: 410, hedef: null };
  const hedef = hedefDuzenle(karar.hedef);
  if (!hedef) return { error: "Yönlendirme adresi geçersiz. Örnek: /blog/ ya da /meta-capi-nedir/" };
  return { kod: 301, hedef };
}

export async function saveYazi(input: YaziKaydetGirdi): Promise<{ error?: string }> {
  if (!input.baslik.trim() || !input.slug.trim()) {
    return { error: "Başlık ve URL zorunludur." };
  }

  // Zamanlı yazının saati ileride olmalı. Geçmiş bir saat "hemen yayınla"
  // demek; o zaten Yayında seçeneği. Sessizce yayına almak yerine soruluyor.
  let zamanlananTarih: string | null = null;
  if (input.durum === "zamanli") {
    const an = input.zamanlananTarih ? new Date(input.zamanlananTarih) : null;
    if (!an || Number.isNaN(an.getTime())) return { error: "Zamanlı yayın için tarih ve saat seç." };
    if (an.getTime() <= Date.now()) {
      return { error: "Zamanlanan saat geçmişte. Hemen yayınlamak için durumu Yayında yap." };
    }
    zamanlananTarih = an.toISOString();
  }

  const karar = input.yonlendirme ? karariHazirla(input.yonlendirme) : null;
  if (karar && "error" in karar) return { error: karar.error };

  const supabase = await createClient();

  // Yazılar ve kategori arşivleri kökte aynı ad alanını paylaşıyor; sayfa önce
  // yazıyı arıyor. Kategoriyle aynı adresi alan yazı arşivi görünmez kılardı.
  const { data: ayniKategori } = await supabase.from("categories").select("id").eq("slug", input.slug.trim()).maybeSingle();
  if (ayniKategori) return { error: "Bu URL bir kategori arşivinde kullanılıyor." };

  // Yayına alınıyor ve tarih girilmemişse: şimdi. Tarih bir kez konduysa
  // korunuyor (yeniden yayınlamak tarihi ileri atmasın).
  let yayinTarihi = input.yayinTarihi;
  if (input.durum === "yayin" && !yayinTarihi) yayinTarihi = new Date().toISOString();

  const row = {
    slug: input.slug.trim(),
    baslik: input.baslik.trim(),
    ozet: input.ozet.trim(),
    icerik_html: input.icerikHtml,
    icerik_json: (input.icerikJson ?? {}) as unknown as Json,
    kapak_gorsel: input.kapakYol,
    durum: input.durum,
    yayin_tarihi: yayinTarihi,
    zamanlanan_tarih: zamanlananTarih,
    seo_baslik: input.seoBaslik.trim(),
    seo_aciklama: input.seoAciklama.trim(),
    yazar: input.yazar.trim(),
    kategori_id: input.kategoriId,
    // Boş etiketler ayıklanıyor; tekrarlar temizleniyor.
    etiketler: Array.from(new Set(input.etiketler.map((e) => e.trim()).filter(Boolean))),
    odak_kelime: (input.odakKelime ?? "").trim().slice(0, 120),
    // Tanınmayan değer yazılmıyor: sitede zaten kategorinin görünümüne düşerdi.
    kapak_ton: kapakTonuMu(input.kapakTon) ? input.kapakTon : null,
    kapak_simge: kapakSimgesiMi(input.kapakSimge) ? input.kapakSimge : null,
    kapak_alt: (input.kapakAlt ?? "").trim().slice(0, 300),
    updated_at: new Date().toISOString(),
    // İçerik güncelleme damgası YALNIZCA bilinçli işaretlendiğinde. Aksi halde
    // alanı hiç yazmıyoruz (mevcut değeri korunur; migration/teknik kayıt bunu
    // ileri atmaz).
    ...(input.icerikGuncellendi ? { icerik_guncelleme: new Date().toISOString() } : {}),
  };

  let onceki: { id: string; durum: string; kategori_id: string | null } | null = null;
  if (input.originalSlug) {
    const { data } = await supabase
      .from("posts")
      .select("id, durum, kategori_id")
      .eq("slug", input.originalSlug)
      .maybeSingle();
    onceki = data ?? null;
  }

  if (onceki) {
    // .select() şart: RLS engellenmiş bir yazma hata değil, sıfır satır döndürür
    // ve bu sessizce "başarılı" gibi görünür.
    const { data, error } = await supabase.from("posts").update(row).eq("id", onceki.id).select("id");
    if (error) return { error: error.code === "23505" ? "Bu URL zaten kullanılıyor." : error.message };
    if (!data || data.length === 0) {
      return { error: "Kaydedilemedi. Yönetici yetkisi doğrulanamadı (RLS)." };
    }

    // Yayından kalktı ve karar verildi: tetikleyicinin yazdığı varsayılan
    // (/blog/) yönlendirme bu kararla değişiyor. Kayıt yapıldı; karar
    // yazılamazsa yazı yine kaydedilmiş sayılır, kullanıcıya söylenir.
    if (karar && onceki.durum === "yayin" && input.durum !== "yayin") {
      const { error: kararHatasi } = await supabase.rpc("yazi_yonlendirme_karari", {
        p_post: onceki.id,
        p_kod: karar.kod,
        p_hedef: karar.hedef,
      });
      if (kararHatasi) {
        return { error: `Yazı kaydedildi ama yönlendirme yazılamadı: ${kararHatasi.message}` };
      }
    }
  } else {
    const { error } = await supabase.from("posts").insert(row).select("id").single();
    if (error) return { error: error.code === "23505" ? "Bu URL zaten kullanılıyor." : error.message };
  }

  // Yazının eski ve yeni kategorisinin arşiv sayfası da tazelensin (yeni yazı
  // listede görünsün, taşınan yazı eskisinden düşsün). Kategoriler de kökte.
  const kategoriIdleri = [input.kategoriId, onceki?.kategori_id].filter((k): k is string => Boolean(k));
  let kategoriSluglari: string[] = [];
  if (kategoriIdleri.length) {
    const { data: katlar } = await supabase.from("categories").select("slug").in("id", kategoriIdleri);
    kategoriSluglari = (katlar ?? []).map((k) => k.slug);
  }
  blogSayfalariniTazele([input.slug, input.originalSlug, ...kategoriSluglari]);
  revalidatePath("/kontrol-9f4x2k/blog/yonlendirmeler");

  redirect("/kontrol-9f4x2k/blog");
}

/**
 * Yazıyı siler. Yazı yayındaysa ya da bir kez bile yayınlandıysa adresi
 * Google'da: önce yayından alınıp karar (varsa) yazılıyor, sonra siliniyor.
 * Karar yoksa silme tetikleyicisi /blog/'a yönlendiriyor.
 */
export async function silYazi(slug: string, yonlendirme?: YonlendirmeKarari | null): Promise<{ error?: string }> {
  const karar = yonlendirme ? karariHazirla(yonlendirme) : null;
  if (karar && "error" in karar) return { error: karar.error };

  const supabase = await createClient();
  const { data: yazi } = await supabase
    .from("posts")
    .select("id, durum, kategori_id, hic_yayinlandi")
    .eq("slug", slug)
    .maybeSingle();
  if (!yazi) return { error: "Yazı bulunamadı." };

  if (karar && yazi.hic_yayinlandi) {
    // Karar yalnız yayında olmayan yazıya yazılabiliyor (canlı adres
    // yönlendirilemez); önce taslağa çekiliyor.
    if (yazi.durum === "yayin") {
      const { error } = await supabase.from("posts").update({ durum: "taslak" }).eq("id", yazi.id);
      if (error) return { error: error.message };
    }
    const { error } = await supabase.rpc("yazi_yonlendirme_karari", {
      p_post: yazi.id,
      p_kod: karar.kod,
      p_hedef: karar.hedef,
    });
    if (error) return { error: `Yönlendirme yazılamadı, yazı silinmedi: ${error.message}` };
  }

  const { data, error } = await supabase.from("posts").delete().eq("id", yazi.id).select("id");
  if (error) return { error: error.message };
  if (!data || data.length === 0) {
    return { error: "Silinemedi. Yönetici yetkisi doğrulanamadı (RLS)." };
  }

  let kategoriSlug: string | null = null;
  if (yazi.kategori_id) {
    const { data: kat } = await supabase.from("categories").select("slug").eq("id", yazi.kategori_id).maybeSingle();
    kategoriSlug = kat?.slug ?? null;
  }
  blogSayfalariniTazele([slug, kategoriSlug]);
  revalidatePath("/kontrol-9f4x2k/blog/yonlendirmeler");
  redirect("/kontrol-9f4x2k/blog");
}

/** Yazının önceki sürümleri (editördeki "Sürümler" paneli). */
export type YaziSurumu = {
  id: string;
  tarih: string;
  baslik: string;
  ozet: string;
  icerikHtml: string;
  icerikJson: unknown;
  durum: string;
  seoBaslik: string;
  seoAciklama: string;
};

export async function yaziSurumleri(postId: string): Promise<{ surumler?: YaziSurumu[]; error?: string }> {
  // RLS zaten yalnız yöneticiye gösteriyor; boş liste yerine açık hata dönsün.
  if (!(await yoneticiMi())) return { error: "Bu işlem için yönetici girişi gerekiyor." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_surumleri")
    .select("id, created_at, baslik, ozet, icerik_html, icerik_json, durum, seo")
    .eq("post_id", postId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return { error: error.message };
  return {
    surumler: (data ?? []).map((r) => {
      const seo = (r.seo ?? {}) as { seo_baslik?: string; seo_aciklama?: string };
      return {
        id: r.id,
        tarih: r.created_at,
        baslik: r.baslik,
        ozet: r.ozet,
        icerikHtml: r.icerik_html,
        icerikJson: r.icerik_json,
        durum: r.durum,
        seoBaslik: seo.seo_baslik ?? "",
        seoAciklama: seo.seo_aciklama ?? "",
      };
    }),
  };
}

/* ---------------------------------------------------------- kategoriler --- */

export async function kategoriEkle(ad: string): Promise<{ id?: string; error?: string }> {
  const temiz = ad.trim();
  if (!temiz) return { error: "Kategori adı boş olamaz." };
  const supabase = await createClient();
  const slug = slugYap(temiz) || `kategori-${Date.now()}`;
  const { data: yazi } = await supabase.from("posts").select("id").eq("slug", slug).maybeSingle();
  if (yazi) return { error: `/${slug}/ adresi bir blog yazısında kullanılıyor; kategoriye başka bir ad ver.` };
  const { data, error } = await supabase.from("categories").insert({ ad: temiz, slug }).select("id").single();
  if (error) return { error: error.code === "23505" ? "Bu kategori (ya da URL) zaten var." : error.message };
  revalidatePath("/kontrol-9f4x2k/blog");
  revalidatePath("/blog");
  return { id: data.id };
}

export async function kategoriGuncelle(id: string, ad: string): Promise<{ error?: string }> {
  const temiz = ad.trim();
  if (!temiz) return { error: "Kategori adı boş olamaz." };
  const supabase = await createClient();
  /*
    Yalnız AD değişiyor, adres değil. Önceden ad değişince slug da yeniden
    üretiliyordu: "Meta Business Manager" adını düzeltmek Google'da dizinli
    /meta-business-manager/ arşivini sessizce 404'e düşürürdü. Adres
    değiştirmek ayrı ve bilinçli bir işlem (kategoriAdresGuncelle).
  */
  const { data, error } = await supabase.from("categories").update({ ad: temiz }).eq("id", id).select("slug");
  if (error) return { error: error.code === "23505" ? "Bu kategori (ya da URL) zaten var." : error.message };
  if (!data || data.length === 0) return { error: "Güncellenemedi (RLS)." };
  revalidatePath("/kontrol-9f4x2k/blog");
  blogSayfalariniTazele([data[0].slug]);
  return {};
}

/**
 * Kategorinin adresini değiştirir. Eski adres veritabanı tetikleyicisiyle
 * yenisine 301'leniyor (yonlendirmeler); arşiv Google'daki yerini korur.
 */
export async function kategoriAdresGuncelle(id: string, slugGirdi: string): Promise<{ slug?: string; error?: string }> {
  const slug = slugYap(slugGirdi);
  if (!slug) return { error: "Adres boş olamaz." };
  const supabase = await createClient();
  const { data: eski } = await supabase.from("categories").select("slug").eq("id", id).maybeSingle();
  if (!eski) return { error: "Kategori bulunamadı." };
  if (eski.slug === slug) return { slug };

  // Kökte yazılarla aynı ad alanı: bir yazı bu adresi kullanıyorsa kategori
  // onu gölgeler (sayfa önce yazıyı arıyor), çakışma baştan engelleniyor.
  const { data: yazi } = await supabase.from("posts").select("id").eq("slug", slug).maybeSingle();
  if (yazi) return { error: "Bu adres bir blog yazısında kullanılıyor." };

  const { data, error } = await supabase.from("categories").update({ slug }).eq("id", id).select("slug");
  if (error) return { error: error.code === "23505" ? "Bu adres başka bir kategoride kullanılıyor." : error.message };
  if (!data || data.length === 0) return { error: "Güncellenemedi (RLS)." };
  revalidatePath("/kontrol-9f4x2k/blog/kategoriler");
  revalidatePath("/kontrol-9f4x2k/blog/yonlendirmeler");
  blogSayfalariniTazele([eski.slug, slug]);
  return { slug };
}

/**
 * Kategori arşiv sayfasının giriş metni (aynı zamanda meta açıklaması).
 * Yetki RLS'te (kategoriler yalnız yöneticiye yazılabilir), diğer kategori
 * eylemleriyle aynı.
 */
export async function kategoriAciklamaGuncelle(id: string, aciklama: string): Promise<{ error?: string }> {
  const temiz = aciklama.trim().slice(0, 600);
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").update({ aciklama: temiz }).eq("id", id).select("slug");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Güncellenemedi (RLS)." };
  revalidatePath("/kontrol-9f4x2k/blog/kategoriler");
  revalidatePath(`/${data[0].slug}`);
  return {};
}

export async function kategoriSil(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  // FK on delete set null: silinen kategorinin yazıları kategorisiz kalır.
  // Arşiv adresi tetikleyiciyle /blog/'a yönleniyor.
  const { data, error } = await supabase.from("categories").delete().eq("id", id).select("slug");
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "Silinemedi (RLS)." };
  revalidatePath("/kontrol-9f4x2k/blog");
  revalidatePath("/kontrol-9f4x2k/blog/yonlendirmeler");
  blogSayfalariniTazele([data[0].slug]);
  return {};
}

/* ------------------------------------------------------ toplu işlemler --- */
/*
  Listede seçilen yazılara tek seferde: kategori değiştir, yayınla, taslağa al,
  sil. Kaynak: ahmetekinci.com.tr paneli (BlogList toplu işlemleri). Her yazı
  ayrı ayrı işleniyor; birinin hatası diğerlerini durdurmuyor, hatalılar
  sonuçta adıyla dönüyor. Yayından kalkan ya da silinen yazıların eski
  adresleri için TEK karar veriliyor (hepsine aynısı); karar yoksa veritabanı
  tetikleyicisi /blog/'a yönlendiriyor.

  Toplu yayınlamada yayın öncesi kontrol listesi gösterilmiyor (tek tek
  yazıda gösteriliyor); panel bunu düğmenin yanında söylüyor.
*/

export type TopluIslem =
  | { tur: "kategori"; kategoriId: string | null }
  | { tur: "yayinla" }
  | { tur: "taslak"; yonlendirme?: YonlendirmeKarari | null }
  | { tur: "sil"; yonlendirme?: YonlendirmeKarari | null };

export type TopluSonuc = { tamam: number; hatalar: { baslik: string; mesaj: string }[]; error?: string };

export async function topluIslem(idler: string[], islem: TopluIslem): Promise<TopluSonuc> {
  if (!(await yoneticiMi())) return { tamam: 0, hatalar: [], error: "Bu işlem için yönetici girişi gerekiyor." };
  const benzersiz = Array.from(new Set(idler)).slice(0, 200);
  if (!benzersiz.length) return { tamam: 0, hatalar: [], error: "Yazı seçilmedi." };

  const karar =
    (islem.tur === "taslak" || islem.tur === "sil") && islem.yonlendirme ? karariHazirla(islem.yonlendirme) : null;
  if (karar && "error" in karar) return { tamam: 0, hatalar: [], error: karar.error };

  const supabase = await createClient();
  const { data: yazilar, error } = await supabase
    .from("posts")
    .select("id, slug, baslik, durum, kategori_id, hic_yayinlandi, yayin_tarihi")
    .in("id", benzersiz);
  if (error) return { tamam: 0, hatalar: [], error: error.message };

  const hatalar: TopluSonuc["hatalar"] = [];
  const tazelenecek = new Set<string>();
  const kategoriIdleri = new Set<string>();
  let tamam = 0;

  if (islem.tur === "kategori" && islem.kategoriId) kategoriIdleri.add(islem.kategoriId);

  for (const y of yazilar ?? []) {
    const hata = (mesaj: string) => hatalar.push({ baslik: y.baslik, mesaj });
    if (y.kategori_id) kategoriIdleri.add(y.kategori_id);
    tazelenecek.add(y.slug);

    if (islem.tur === "kategori") {
      const { data, error: e } = await supabase
        .from("posts")
        .update({ kategori_id: islem.kategoriId, updated_at: new Date().toISOString() })
        .eq("id", y.id)
        .select("id");
      if (e || !data?.length) hata(e?.message ?? "Güncellenemedi (RLS).");
      else tamam++;
      continue;
    }

    if (islem.tur === "yayinla") {
      if (y.durum === "yayin") {
        tamam++;
        continue;
      }
      const { data, error: e } = await supabase
        .from("posts")
        .update({
          durum: "yayin",
          zamanlanan_tarih: null,
          yayin_tarihi: y.yayin_tarihi ?? new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", y.id)
        .select("id");
      if (e || !data?.length) hata(e?.message ?? "Yayınlanamadı (RLS).");
      else tamam++;
      continue;
    }

    if (islem.tur === "taslak") {
      if (y.durum === "taslak") {
        tamam++;
        continue;
      }
      const { data, error: e } = await supabase
        .from("posts")
        .update({ durum: "taslak", zamanlanan_tarih: null, updated_at: new Date().toISOString() })
        .eq("id", y.id)
        .select("id");
      if (e || !data?.length) {
        hata(e?.message ?? "Taslağa alınamadı (RLS).");
        continue;
      }
      if (karar && y.durum === "yayin") {
        const { error: ke } = await supabase.rpc("yazi_yonlendirme_karari", {
          p_post: y.id,
          p_kod: karar.kod,
          p_hedef: karar.hedef,
        });
        if (ke) {
          hata(`Taslağa alındı ama yönlendirme yazılamadı: ${ke.message}`);
          continue;
        }
      }
      tamam++;
      continue;
    }

    // Sil: tek yazı silmeyle aynı sıra (silYazi).
    if (karar && y.hic_yayinlandi) {
      if (y.durum === "yayin") {
        const { error: e } = await supabase.from("posts").update({ durum: "taslak" }).eq("id", y.id);
        if (e) {
          hata(e.message);
          continue;
        }
      }
      const { error: ke } = await supabase.rpc("yazi_yonlendirme_karari", {
        p_post: y.id,
        p_kod: karar.kod,
        p_hedef: karar.hedef,
      });
      if (ke) {
        hata(`Yönlendirme yazılamadı, yazı silinmedi: ${ke.message}`);
        continue;
      }
    }
    const { data, error: e } = await supabase.from("posts").delete().eq("id", y.id).select("id");
    if (e || !data?.length) hata(e?.message ?? "Silinemedi (RLS).");
    else tamam++;
  }

  let kategoriSluglari: string[] = [];
  if (kategoriIdleri.size) {
    const { data: katlar } = await supabase.from("categories").select("slug").in("id", [...kategoriIdleri]);
    kategoriSluglari = (katlar ?? []).map((k) => k.slug);
  }
  blogSayfalariniTazele([...tazelenecek, ...kategoriSluglari]);
  revalidatePath("/kontrol-9f4x2k/blog");
  revalidatePath("/kontrol-9f4x2k/blog/yonlendirmeler");
  return { tamam, hatalar };
}
