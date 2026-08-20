import { redirect } from "next/navigation";
import { PanelShell } from "@/components/panel/PanelShell";
import { AcilisEkrani } from "@/components/panel/AcilisEkrani";
import { getPanelCourses, getPanelProfile } from "@/lib/panel";
import { getBildirimler } from "@/lib/bildirimler";
import { panelOlcumlemeTazele } from "@/lib/meta/toplama";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const [profil, courses, bildirim] = await Promise.all([
    getPanelProfile(),
    getPanelCourses(),
    getBildirimler(),
  ]);
  if (!profil) redirect("/giris");

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
        aktifProgram={courses[0] ? { baslik: courses[0].baslik, slug: courses[0].slug } : null}
        programSayisi={courses.length}
        bildirim={bildirim}
      >
        {children}
      </PanelShell>
    </>
  );
}
