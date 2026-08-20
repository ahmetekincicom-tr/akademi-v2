import type { Instrumentation } from "next";

/**
 * Sunucu hatalarının tek toplanma noktası.
 *
 * Next bu kancayı sayfa çizimi, sunucu eylemi, API yolu ve proxy — dördünde
 * de çağırıyor. Her çağrı yerine ayrı try/catch koymanın alternatifiydi; o
 * yol er geç bir yerde unutulur ve o yerdeki hata sessiz kalırdı.
 */
export const onRequestError: Instrumentation.onRequestError = async (hata, istek, baglam) => {
  /*
    Yükleme tembel: bu dosya Edge çalışma zamanında da yükleniyor ve
    hata-bildirimi.ts "server-only" işaretli, Node bağımlılıkları taşıyor.
    Üst seviye import, Edge derlemesini bozardı.
  */
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    console.error("[hata:edge]", istek.path, hata);
    return;
  }

  const { hataBildir } = await import("@/lib/hata-bildirimi");
  await hataBildir(hata, {
    yol: istek.path,
    method: istek.method,
    nerede: `${baglam.routerKind} · ${baglam.routeType}`,
  });
};
