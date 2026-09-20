"use client";

import { useEffect } from "react";
import { analiz } from "@/lib/analiz";

/**
 * Blog detay sayfasının davranış ölçümü (tek client island).
 *
 * Gönderdikleri:
 *  - blog_view (sayfa başına bir kez)
 *  - blog_scroll_25 / _50 / _75 / blog_complete (her biri oturumda bir kez)
 *  - blog_cta_click (içerikteki tüm .aea-cta'lar; placement data-attribute'tan)
 *  - blog_related_post_click (yazı sonu benzer yazılar)
 *
 * prompt_copy ve image_lightbox kendi island'larında (PromptKopyala,
 * GorselLightbox). Bu bileşen sunucu HTML'i üzerine olay bağlıyor; ölçümleme
 * kapalıysa (gtag yok) sessizce hiçbir şey yapmıyor.
 */

// Modül düzeyinde dedup: aynı gerçek sayfa yüklemesinde olaylar iki kez
// gitmesin (React StrictMode çift mount / hızlı yeniden render). Yenilemede
// modül yeniden yüklenir → yeni görüntülenme doğru sayılır. Slug değişince
// (SPA gezinme) scroll eşikleri sıfırlanır.
let sonGoruntulenen: string | null = null;
let scrollSlug: string | null = null;
let scrollGonderilen = new Set<number>();

export function BlogAnalitik({
  postId,
  slug,
  title,
  category,
  author,
  published,
}: {
  postId: string;
  slug: string;
  title?: string;
  category?: string;
  author?: string;
  published?: string;
}) {
  useEffect(() => {
    if (sonGoruntulenen !== slug) {
      sonGoruntulenen = slug;
      analiz.blog.goruntulendi({
        post_id: postId,
        post_slug: slug,
        post_title: title,
        category,
        author,
        published_date: published,
      });
    }

    // --- Scroll derinliği (rAF ile hafif; her scroll'da iş yapmıyor) ---
    // Dedup modül düzeyinde (StrictMode çift-mount'ta eşik iki kez gitmesin).
    if (scrollSlug !== slug) {
      scrollSlug = slug;
      scrollGonderilen = new Set<number>();
    }
    const gonderilen = scrollGonderilen;
    const icerik = document.querySelector<HTMLElement>("[data-blog-icerik]");
    let bekleyen = false;

    const olc = () => {
      bekleyen = false;
      if (!icerik) return;
      const kutu = icerik.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      const toplam = kutu.height;
      // İçeriğin ne kadarı geçildi: viewport'un altı içeriğin neresinde.
      const ilerleme = toplam <= 0 ? 100 : Math.max(0, Math.min(100, ((vh - kutu.top) / toplam) * 100));
      for (const esik of [25, 50, 75, 100] as const) {
        const hedef = esik === 100 ? 90 : esik; // complete ~%90+
        if (ilerleme >= hedef && !gonderilen.has(esik)) {
          gonderilen.add(esik);
          analiz.blog.scroll(esik, { post_id: postId, post_slug: slug, post_title: title, category });
        }
      }
      if (gonderilen.has(100)) window.removeEventListener("scroll", tetik);
    };
    const tetik = () => {
      if (bekleyen) return;
      bekleyen = true;
      requestAnimationFrame(olc);
    };
    window.addEventListener("scroll", tetik, { passive: true });
    // İlk ölçüm: kısa yazıda içerik zaten tam görünür olabilir.
    olc();

    // --- CTA + benzer yazı tıklamaları (delegasyon) ---
    const tikla = (e: MouseEvent) => {
      const hedef = e.target as HTMLElement | null;
      const cta = hedef?.closest?.("a.aea-cta") as HTMLAnchorElement | null;
      if (cta) {
        analiz.blog.ctaTikla({
          post_id: postId,
          post_slug: slug,
          cta_id: cta.dataset.ctaId || "egitim",
          cta_label: cta.dataset.ctaLabel || cta.textContent?.trim().slice(0, 80) || "",
          cta_destination: cta.getAttribute("href") || "",
          placement: cta.dataset.placement || "inline",
        });
        return;
      }
      const ilgili = hedef?.closest?.("[data-ilgili-slug]") as HTMLElement | null;
      if (ilgili) {
        analiz.blog.ilgiliTikla({
          source_post_slug: slug,
          destination_post_slug: ilgili.dataset.ilgiliSlug || "",
          position: Number(ilgili.dataset.ilgiliPos) || 0,
        });
      }
    };
    document.addEventListener("click", tikla);

    return () => {
      window.removeEventListener("scroll", tetik);
      document.removeEventListener("click", tikla);
    };
  }, [postId, slug, title, category, author, published]);

  return null;
}
