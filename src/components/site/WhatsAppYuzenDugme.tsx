import { Icon } from "@/components/Icon";
import { WHATSAPP_NUMARALAR, WHATSAPP_VARSAYILAN_MESAJ } from "@/lib/iletisim";
import { WhatsAppBaglantisi } from "./WhatsAppBaglantisi";

/**
 * Sağ altta sabit duran WhatsApp düğmesi — her sayfada görünür.
 *
 * Doğrudan wa.me'ye değil, ölçülen uçtan geçiyor (/git/whatsapp): tıklama
 * kaydediliyor, mesaja referans kodu gömülüyor, Meta'ya Contact olayı düşüyor.
 * Gerekçesi app/git/whatsapp/route.ts içinde. `yer=yuzen` hangi düğmeden
 * gelindiğini ayırıyor; hazır mesaj varsayılan ("birebir eğitimleriniz…").
 *
 * z-index çerez bandının (z-[9998]) altında: ilk ziyarette bant en altta
 * tam genişlikte durduğu için düğmeyi kapatması doğru, banttan sonra düğme
 * açılıyor. Alt boşluğa mobil çentik payı (safe-area) ekleniyor.
 */
export function WhatsAppYuzenDugme() {
  return (
    <WhatsAppBaglantisi
      numara={WHATSAPP_NUMARALAR[0].numara}
      mesaj={WHATSAPP_VARSAYILAN_MESAJ}
      yer="yuzen"
      ariaLabel="WhatsApp'tan yazın"
      title="WhatsApp'tan yazın"
      className="group fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_rgba(37,211,102,0.45)] transition-transform duration-200 hover:scale-[1.06] active:scale-95 sm:right-6 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] sm:h-[60px] sm:w-[60px]"
    >
      <Icon name="whatsapp" size={30} className="sm:hidden" />
      <Icon name="whatsapp" size={32} className="hidden sm:block" />
    </WhatsAppBaglantisi>
  );
}
