import { redirect } from "next/navigation";
import { PanelShell } from "@/components/panel/PanelShell";
import { AcilisEkrani } from "@/components/panel/AcilisEkrani";
import { getPanelCourses, getPanelProfile } from "@/lib/panel";
import { getYayindakiDuyurular } from "@/lib/duyuru-sorgu";
import { yeniSayisi } from "@/lib/duyuru";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const [profil, courses, duyurular] = await Promise.all([
    getPanelProfile(),
    getPanelCourses(),
    getYayindakiDuyurular(),
  ]);
  if (!profil) redirect("/giris");

  return (
    <>
      <AcilisEkrani />
      <PanelShell
        profil={profil}
        aktifProgram={courses[0] ? { baslik: courses[0].baslik, slug: courses[0].slug } : null}
        programSayisi={courses.length}
        yeniDuyuru={yeniSayisi(duyurular)}
      >
        {children}
      </PanelShell>
    </>
  );
}
