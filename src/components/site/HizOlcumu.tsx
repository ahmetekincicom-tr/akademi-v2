"use client";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { useNativeUygulama } from "@/lib/native";

/**
 * Gerçek kullanıcı hız ölçümü (Core Web Vitals).
 *
 * İzne bağlı DEĞİL, bilerek: çerez ya da benzeri bir depolama kullanmıyor ve
 * kişiyi tanımlayan bir veri toplamıyor — ölçtüğü şey sayfanın kendisi. Çerez
 * bandına eklemek, izin isteyecek bir şey yokken izin istemek olurdu.
 *
 * Uygulamanın içinde çizilmiyor: WebView ölçümleri tarayıcıdan sistematik
 * olarak farklı çıkıyor ve ikisi aynı havuza karışınca sitenin gerçek hız
 * rakamları bulanıklaşıyor.
 *
 * ————————————————————————————————————————————————————————————————
 * Bu kontrol NEDEN sunucuda değil:
 *
 * İlk hâli kök düzende nativeIstekMi() çağırıyordu. O da headers() okuyor ve
 * headers() bütün uygulamayı dinamik render'a düşürüyor — ana sayfa,
 * /egitimler, /hakkimizda, /kurumsal, /iletisim dahil 13 sayfa statik
 * üretimden çıkıp her istekte sunucuda çizilmeye başlamıştı. Yani hız ölçmek
 * için eklenen satır, ölçülecek sayfaları yavaşlatıyordu.
 *
 * Burada istemci tarafında bakmanın bilinen bedeli (cevabın ancak hidrasyondan
 * sonra gelmesi) bu bileşen için maliyetsiz: Speed Insights zaten hidrasyondan
 * sonra ölçmeye başlıyor ve görsel bir çıktısı yok, dolayısıyla göz kırpması
 * da olmuyor.
 */
export function HizOlcumu() {
  const uygulamada = useNativeUygulama();
  if (uygulamada) return null;
  return <SpeedInsights />;
}
