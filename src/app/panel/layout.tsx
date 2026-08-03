import { redirect } from "next/navigation";
import { PanelShell } from "@/components/panel/PanelShell";
import { AcilisEkrani } from "@/components/panel/AcilisEkrani";
import { getPanelCourses, getPanelProfile } from "@/lib/panel";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const [profil, courses] = await Promise.all([getPanelProfile(), getPanelCourses()]);
  if (!profil) redirect("/giris");

  return (
    <>
      <AcilisEkrani />
      <PanelShell
        profil={profil}
        aktifProgram={courses[0] ? { baslik: courses[0].baslik, slug: courses[0].slug } : null}
        programSayisi={courses.length}
      >
        {children}
      </PanelShell>
    </>
  );
}
