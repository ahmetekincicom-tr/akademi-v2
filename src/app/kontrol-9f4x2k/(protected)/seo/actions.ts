"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { yolSadelestir } from "@/lib/sayfa-seo";
import type { Json } from "@/lib/supabase/tipler";

/**
 * SEO metinlerini kaydeder.
 *
 * İki ayrı yere yazıyor ve bu bilerek:
 *
 *  - Tanıtım sayfaları → sayfa_seo tablosu, anahtar sitedeki yol.
 *  - Eğitimler → courses.content JSON'u.
 *
 * Eğitimlerin ayrı durmasının sebebi, adreslerinin (slug) panelden
 * değiştirilebilmesi. Yola bağlı bir tabloda dursaydı adres değiştiği anda
 * satır sahipsiz kalır, SEO metni sessizce kaybolurdu; content ile birlikte
 * taşındığı için o risk yok.
 *
 * Yetki kontrolü burada tekrarlanmıyor: yazma yolları RLS ile korunuyor
 * (is_admin) ve panelin düzeni zaten oturum kontrolü yapıyor. İki yerde
 * yazılan bir kontrol, bir yerde güncellenmeyi bekleyen bir kontroldür.
 */

export type SeoKayitGirdisi = {
  /** "sayfa" → sayfa_seo tablosu; "egitim" → courses.content */
  tip: "sayfa" | "egitim";
  /** Sayfa için yol ("/hakkimizda"), eğitim için slug ("meta-ads-egitimi"). */
  anahtar: string;
  baslik: string;
  aciklama: string;
};

export async function seoKaydet(girdi: SeoKayitGirdisi): Promise<{ error?: string }> {
  const baslik = girdi.baslik.trim();
  const aciklama = girdi.aciklama.trim();
  const supabase = await createClient();

  if (girdi.tip === "egitim") {
    const slug = girdi.anahtar.trim();
    if (!slug) return { error: "Eğitim adresi eksik." };

    /*
      content JSON'u okunup üzerine yazılıyor, tek tek alan güncellenmiyor:
      jsonb_set ile iki ayrı yazma yapmak yerine mevcut nesneyi alıp iki alanı
      değiştirmek hem tek tur hem de kaydın geri kalanını olduğu gibi bırakıyor.
    */
    const { data: mevcut, error: okumaHatasi } = await supabase
      .from("courses")
      .select("content")
      .eq("slug", slug)
      .maybeSingle();

    if (okumaHatasi) return { error: "Eğitim okunamadı." };
    if (!mevcut) return { error: "Eğitim bulunamadı." };

    /*
      content'in tipi Json; okunan nesneye iki alan eklenip geri yazılıyor.
      Yayılım (spread) sonrası tip Record<string, unknown>'a düşüyor ve Json'a
      geri dönmüyor — o yüzden yazarken tip yeniden belirtiliyor. Değerlerin
      ikisi de string, yani gerçekten Json.
    */
    const icerik = {
      ...((mevcut.content as Record<string, Json>) ?? {}),
      seoBaslik: baslik,
      seoAciklama: aciklama,
    } satisfies Record<string, Json>;

    const { error } = await supabase
      .from("courses")
      .update({ content: icerik, updated_at: new Date().toISOString() })
      .eq("slug", slug);

    if (error) return { error: "Kaydedilemedi." };

    revalidatePath(`/egitimler/${slug}`);
    revalidatePath("/egitimler");
  } else {
    const yol = yolSadelestir(girdi.anahtar);

    /*
      İki alan da boşsa satır SİLİNİYOR, boş metinlerle bırakılmıyor.

      Boş bir satır ile hiç satır olmaması uygulamada aynı sonucu veriyor
      (ikisi de otomatik değere düşüyor), ama tabloda duran boş satır "burada
      bir ezme var" izlenimi bırakıyor ve bir sonraki bakan kişiyi yanıltıyor.
    */
    if (!baslik && !aciklama) {
      const { error } = await supabase.from("sayfa_seo").delete().eq("yol", yol);
      if (error) return { error: "Kaydedilemedi." };
    } else {
      const { error } = await supabase
        .from("sayfa_seo")
        .upsert({ yol, baslik, aciklama, updated_at: new Date().toISOString() }, { onConflict: "yol" });
      if (error) return { error: "Kaydedilemedi." };
    }

    revalidatePath(yol);
  }

  revalidatePath("/kontrol-9f4x2k/seo");
  return {};
}
