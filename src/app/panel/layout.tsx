import { redirect } from "next/navigation";
import { PanelShell } from "@/components/panel/PanelShell";
import { AcilisEkrani } from "@/components/panel/AcilisEkrani";
import { getPanelProfile } from "@/lib/panel";
import { getBildirimler } from "@/lib/bildirimler";
import { panelOlcumlemeTazele } from "@/lib/meta/toplama";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const [profil, bildirim] = await Promise.all([getPanelProfile(), getBildirimler()]);
  if (!profil) redirect("/giris");
  // Google ile açılan hesap: sözleşme/KVKK onayı ve telefon bir kez alınıyor.
  if (profil.kayitTamamlanmadi) redirect("/kayit/tamamla");

  /*
    İzin ve tıklama kimliği her panel ziyaretinde tazeleniyor.

    await ediliyor: sunucusuz ortamda cevap döndükten sonra devam eden bir işin
    tamamlanacağı garanti değil. Maliyeti tek bir okuma ve — yalnızca gerçekten
    bir şey değiştiyse — tek bir yazma.

    Burada olmasının sebebi: kişinin izni ödeme gününde okunamıyor. Havaleyi
    yönetici işaretliyor, mutabakatı zamanlayıcı çalıştırıyor; o anda ortada
    çerez yok. İzin bir yerde donmak zorunda ve o yer profil.
  */
  await panelOlcumlemeTazele(profil.id);

  return (
    <>
      <AcilisEkrani />
      <PanelShell
        profil={profil}
        bildirim={bildirim}
      >
        {children}
      </PanelShell>
    </>
  );
}
