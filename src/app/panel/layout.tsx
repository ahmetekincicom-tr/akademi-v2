import { redirect } from "next/navigation";
import { PanelShell } from "@/components/panel/PanelShell";
import { AcilisEkrani } from "@/components/panel/AcilisEkrani";
import { getPanelCourses, getPanelProfile } from "@/lib/panel";
import { getBildirimler } from "@/lib/bildirimler";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const [profil, courses, bildirim] = await Promise.all([
    getPanelProfile(),
    getPanelCourses(),
    getBildirimler(),
  ]);
  if (!profil) redirect("/giris");

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
