/**
 * Sayfa giriş geçişi.
 *
 * template.tsx (layout değil): Next her gezinmede bunu YENİDEN bağlıyor, yani
 * içindeki `.sayfa-giris` animasyonu her sayfada baştan oynuyor — ilk açılışta
 * ve sonraki her geçişte. Böylece sayfalar "şak" diye değil, aşağıdan hafifçe
 * yükselerek (fade-up) beliriyor.
 *
 * Sarmalayıcı yalnızca sayfa içeriğini kapsıyor; sabit WhatsApp düğmesi ve
 * çerez bandı kök düzende (layout.tsx) bunun DIŞINDA. Animasyon bitiş karesi
 * transform:none olduğu için, animasyon bittiğinde sarmalayıcı hiçbir transform
 * taşımıyor ve içindeki yapışkan/sabit öğeler normal çalışıyor.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="sayfa-giris">{children}</div>;
}
