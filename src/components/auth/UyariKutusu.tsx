import { Icon } from "@/components/Icon";

/**
 * Oturum ekranlarının hata/uyarı kutusu.
 *
 * Dört ekranda ayrı ayrı kopyalanmıştı ve hepsinde simge yerine metin olarak
 * "!" basılıyordu: yazı tipine göre hizası kayıyor, kalınlığı tutmuyordu.
 * Tek yerde toplandı, simge de gerçek ikon setinden geliyor.
 */
export function UyariKutusu({ mesaj, tur = "hata" }: { mesaj: string; tur?: "hata" | "bilgi" }) {
  const hata = tur === "hata";
  return (
    <div
      role="alert"
      className="flex items-start gap-[11px] rounded-[11px] border px-[15px] py-[13px]"
      style={{
        borderColor: hata ? "rgba(217,60,60,0.35)" : "rgba(28,86,243,0.3)",
        background: hata ? "rgba(217,60,60,0.07)" : "rgba(28,86,243,0.06)",
      }}
    >
      <span
        className="mt-[1px] flex-none"
        style={{ color: hata ? "#D93C3C" : "#1C56F3" }}
        aria-hidden
      >
        <Icon name="alert" size={17} strokeWidth={2} />
      </span>
      <span className="text-sm leading-[1.5]" style={{ color: hata ? "#8E2226" : "#1F3E9E" }}>
        {mesaj}
      </span>
    </div>
  );
}
