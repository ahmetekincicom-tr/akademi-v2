import "server-only";

import { headers } from "next/headers";

/**
 * İstek native uygulamanın içinden mi geliyor?
 *
 * İstemci tarafındaki useNativeUygulama() ancak hidrasyondan sonra cevap
 * verebiliyor; sunucuda basılan işaretleme bir an için web sürümünü gösterip
 * sonra değişiyor. Site menüsü gibi uygulamada hiç görünmemesi gereken
 * parçalarda o an göz kırpması olarak fark ediliyor.
 *
 * İşaret capacitor.config.ts'te tarayıcı kimliğine ekleniyor; src/proxy.ts de
 * aynı işareti okuyor.
 *
 * headers() sayfayı dinamik render'a zorluyor: yalnızca zaten dinamik olan
 * sayfalarda kullan.
 */
export async function nativeIstekMi(): Promise<boolean> {
  const h = await headers();
  return h.get("user-agent")?.includes("AEAkademiApp") ?? false;
}
