import { YakindaBos } from "@/components/panel/YakindaBos";

export default function SoruCevapPage() {
  return (
    <YakindaBos
      ikon="✉"
      baslik="Soru-cevap"
      aciklama="Eğitim boyunca takıldığın her konuyu buradan sorabilirsin."
      metin="Henüz açtığın bir konu yok. Panel içi mesajlaşma devreye girene kadar sorularını WhatsApp üzerinden iletebilirsin."
      aksiyon={{ href: "/iletisim", label: "Soru sor" }}
    />
  );
}
