/**
 * Blog analytics — tek giriş noktası (tarayıcı tarafı).
 *
 * Event adları ve gönderim mantığı componentlere dağılmasın diye burada
 * toplanıyor; ileride GA4 dışında bir araca geçilse tek dosya değişir.
 *
 * Gönderim, mevcut Google akışıyla AYNI (bkz. lib/olay.ts whatsappOlayi):
 *  - window.gtag üzerinden event atılıyor.
 *  - GA4'e AÇIKÇA (send_to = __aeaGa4) gönderiliyor; bu olmadan olay sitedeki
 *    Google etiketi tarafından öncelikle Ads'e yönlendirilip GA4'e hiç
 *    ulaşmıyor. GTM kuruluysa __aeaGa4 yok, olay dataLayer'a düşüp GTM'de
 *    yönetiliyor.
 *  - İzin Consent Mode ile Google tarafında yönetiliyor; burada ayrı izin
 *    kontrolü yok (mevcut politikayla tutarlı). gtag yoksa (ölçümleme kapalı /
 *    izin bandı yüklenmemiş) sessizce atlanıyor.
 *
 * Public bundle'a yalnız bu minimum kod giriyor; GA4 Data API / raporlama
 * tamamen sunucu tarafında (lib/google/ga4-*).
 */

const AYIKLAMA = process.env.NODE_ENV !== "production";

type Params = Record<string, string | number | boolean | null | undefined>;

function gonder(olay: string, parametreler: Params): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...a: unknown[]) => void; __aeaGa4?: string };
  if (typeof w.gtag !== "function") {
    if (AYIKLAMA) console.debug("[analiz] gtag yok, atlandı:", olay, parametreler);
    return;
  }
  try {
    // undefined/null parametreleri ayıkla (GA4'e boş alan gitmesin).
    const p: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(parametreler)) if (v !== undefined && v !== null) p[k] = v;
    if (w.__aeaGa4) p.send_to = w.__aeaGa4;
    w.gtag("event", olay, p);
    if (AYIKLAMA) console.debug("[analiz]", olay, p);
  } catch {
    // Ölçümleme yan iş; hiçbir koşulda kullanıcı akışını bozmasın.
  }
}

/** Yazı bağlamı: post_id + slug (ortak parametreler). */
export type BlogBaglam = {
  post_id: string;
  post_slug: string;
  post_title?: string;
  category?: string;
  author?: string;
  published_date?: string;
};

/** DOM'daki [data-blog-post] öğesinden yazı bağlamını okur (island'lar için). */
export function blogBaglami(): { post_id: string; post_slug: string } | null {
  if (typeof document === "undefined") return null;
  const el = document.querySelector<HTMLElement>("[data-blog-post]");
  const id = el?.dataset.postId;
  const slug = el?.dataset.postSlug;
  if (!id || !slug) return null;
  return { post_id: id, post_slug: slug };
}

export const analiz = {
  blog: {
    goruntulendi(b: BlogBaglam): void {
      gonder("blog_view", {
        post_id: b.post_id,
        post_slug: b.post_slug,
        post_title: b.post_title,
        category: b.category,
        author: b.author,
        published_date: b.published_date,
      });
    },
    /** esik: 25 | 50 | 75 | 100 (100 → blog_complete). */
    scroll(esik: 25 | 50 | 75 | 100, b: { post_id: string; post_slug: string; post_title?: string; category?: string }): void {
      const olay = esik === 100 ? "blog_complete" : `blog_scroll_${esik}`;
      gonder(olay, { post_id: b.post_id, post_slug: b.post_slug, post_title: b.post_title, category: b.category });
    },
    ctaTikla(p: {
      post_id: string;
      post_slug: string;
      cta_id: string;
      cta_label: string;
      cta_destination: string;
      placement: string;
    }): void {
      gonder("blog_cta_click", p);
    },
    promptKopya(p: { post_id: string; post_slug: string; prompt_index: number; prompt_label?: string; block_id?: string }): void {
      gonder("blog_prompt_copy", p);
    },
    gorselAcildi(p: { post_id: string; post_slug: string; image_index: number; image_alt?: string }): void {
      gonder("blog_image_lightbox", p);
    },
    ilgiliTikla(p: { source_post_slug: string; destination_post_slug: string; position: number }): void {
      gonder("blog_related_post_click", p);
    },
  },
};
