import { Beliriver } from "@/components/site/Beliriver";

/**
 * Sayfa geçiş sarmalayıcısı.
 *
 * template.tsx (layout değil): Next her gezinmede bunu yeniden bağlıyor, yani
 * Beliriver de her sayfada yeniden çalışıp bölümleri baştan gözlemliyor.
 *
 * Beliriver bölümleri (<section>) kaydırdıkça yumuşakça belirtiyor; başlık ve
 * alt bilgi etkilenmiyor. Sabit WhatsApp düğmesi ve çerez bandı kök düzende
 * (layout.tsx) bunun dışında.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <Beliriver>{children}</Beliriver>;
}
