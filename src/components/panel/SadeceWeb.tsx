"use client";

import { useNativeUygulama } from "@/lib/native";

/**
 * İçeriği yalnızca web tarayıcısında gösterir, native uygulamada hiç basmaz.
 *
 * Apple'ın 3.1.3 maddesi uygulama içinden dışarıdaki bir ödeme yöntemine
 * yönlendirmeyi yasaklıyor. Kapsam sadece "öde" düğmesi değil: IBAN göstermek,
 * ücret sayfasına bağlantı vermek, "web'den satın al" demek de aynı kapıya
 * çıkıyor ve incelemede reddedilme sebebi.
 *
 * Bu yüzden ödemeyle ilgili her yüzey uygulamada kapalı. Öğrenci ödemesini
 * web'den yapıyor, uygulama satın alınmış eğitime erişim yeri.
 */
export function SadeceWeb({ children }: { children: React.ReactNode }) {
  const native = useNativeUygulama();
  if (native) return null;
  return <>{children}</>;
}

/**
 * Sayfanın tamamı web'e ait olduğunda kullanılır: menüde gizli olsa da adres
 * elle yazılabilir, bu yüzden sayfanın kendisi de kapalı olmalı.
 *
 * Metin bilerek yönlendirme içermiyor — "web sitesinden öde" demek de
 * 3.1.3'ün yasakladığı yönlendirme sayılıyor.
 */
export function UygulamadaYok({ children }: { children: React.ReactNode }) {
  const native = useNativeUygulama();
  if (!native) return <>{children}</>;

  return (
    <main className="p-4 pb-14 sm:p-[34px]">
      <div className="rounded-2xl border border-ink/10 bg-white px-8 py-14 text-center">
        <p className="mx-auto max-w-[420px] text-[14.5px] leading-[1.6] text-[#5C6273]">
          Bu bölüm uygulamada yer almıyor.
        </p>
      </div>
    </main>
  );
}

/** Yalnızca uygulamada görünür — web'de basılmaz. SadeceWeb'in karşılığı. */
export function SadeceUygulama({ children }: { children: React.ReactNode }) {
  const native = useNativeUygulama();
  if (!native) return null;
  return <>{children}</>;
}

/**
 * İçindeki bağlantıları uygulamada tıklanamaz yapar.
 *
 * Logo gibi görünmesi gereken ama uygulamada bir yere gitmemesi gereken
 * öğeler için: bağlantıyı kaldırmak yerine tıklamayı yutuyoruz, böylece
 * sunucuda hazırlanan işaretleme aynı kalıyor ve sayfa statik üretilmeye
 * devam ediyor.
 */
export function UygulamadaPasif({ children }: { children: React.ReactNode }) {
  const native = useNativeUygulama();
  if (!native) return <>{children}</>;

  return (
    <div
      onClickCapture={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {children}
    </div>
  );
}
