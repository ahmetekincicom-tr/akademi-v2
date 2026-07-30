import { YakindaBos } from "@/components/panel/YakindaBos";

export default function SeanslarPage() {
  return (
    <YakindaBos
      ikon="◷"
      baslik="Birebir seanslar"
      aciklama="Eğitmenle yaptığın birebir görüşmelerin takvimi ve geçmişi."
      metin="Planlanmış bir seansın görünmüyor. Seans takvimi panele bağlanana kadar randevunu WhatsApp üzerinden ayarlayabilirsin."
      aksiyon={{ href: "/iletisim", label: "İletişime geç" }}
    />
  );
}
